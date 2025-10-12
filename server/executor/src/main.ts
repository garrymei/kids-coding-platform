import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { loadConfig } from './config';
import { TaskQueue } from './queue';
import { DockerExecutor } from './dockerRunner';
import { WorkerPool } from './worker';
import { createChildLogger, logger } from './logger';
import { initSentry, Sentry } from './sentry';
import { collectMetrics, metricsContentType, recordExecutionFailure } from './metrics';
import { validatePythonSource } from './pythonStaticValidator';
import {
  blacklistDetectionMiddleware,
  rateLimitMiddleware,
  timeoutDetectionMiddleware,
} from './ratelimit';

type RequestWithContext = Request & {
  traceId?: string;
  userId?: string | null;
  log?: ReturnType<typeof createChildLogger>;
};

const sentryEnabled = initSentry();

const executeSchema = z.object({
  language: z.literal('python').default('python'),
  source: z.string().min(1, 'source is required'),
  tests: z
    .array(
      z.object({
        stdin: z.string().default(''),
        timeoutMs: z.number().int().min(200).max(10_000).optional(),
        expectedStdout: z.string().optional(),
      }),
    )
    .max(10)
    .default([]),
});

export async function bootstrap(): Promise<Express> {
  const config = loadConfig();
  const queue = new TaskQueue({ redisUrl: config.redisUrl, queueKey: config.queueKey });
  await queue.connect();

  const dockerExecutor = new DockerExecutor({
    socketPath: config.dockerSocketPath,
    image: config.dockerImage,
    memoryBytes: config.memoryBytes,
    nanoCpus: config.nanoCpus,
    executionTimeoutMs: config.executionTimeoutMs,
    allowedModulesJson: config.allowedModulesJson,
    allowedModules: config.allowedModules,
    enableLocalFallback: config.enableLocalFallback,
  });

  const workerPool = new WorkerPool({
    executor: dockerExecutor,
    queue: {
      take: () => queue.take(),
      publishResult: (payload) => queue.publishResult(payload),
    },
    concurrency: config.maxConcurrency,
  });
  workerPool.start();

  const app = express();
  app.use(express.json({ limit: '64kb' }));

  if (sentryEnabled) {
    process.on('unhandledRejection', (reason) => {
      Sentry.captureException(reason);
    });
    process.on('uncaughtException', (error) => {
      Sentry.captureException(error);
    });
  }

  app.use((req: RequestWithContext, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();
    const headerTrace = req.headers['x-trace-id'];
    const traceId = (Array.isArray(headerTrace) ? headerTrace[0] : headerTrace) ?? randomUUID();
    const headerUser = req.headers['x-user-id'];
    const userId = (Array.isArray(headerUser) ? headerUser[0] : headerUser) ?? null;
    req.traceId = traceId;
    req.userId = userId;
    const requestLogger = createChildLogger({
      traceId,
      userId,
      path: req.originalUrl,
      method: req.method,
    });
    req.log = requestLogger;
    res.locals.logger = requestLogger;
    requestLogger.info({ msg: 'request_received' });
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      requestLogger.info({
        msg: 'request_completed',
        statusCode: res.statusCode,
        durationMs,
        contentLength: res.get('content-length'),
      });
    });
    next();
  });

  // Add blacklist detection middleware (before rate limiting)
  app.use('/execute', blacklistDetectionMiddleware);

  // Add rate limiting middleware
  app.use('/execute', rateLimitMiddleware);

  // Add timeout detection middleware
  app.use('/execute', timeoutDetectionMiddleware);

  app.post('/execute', async (req: RequestWithContext, res: Response, next: NextFunction) => {
    try {
      req.log?.info({ msg: 'execute_request_start', body: req.body });
      const parsed = executeSchema.parse(req.body ?? {});

      if (parsed.language !== 'python') {
        res.status(400).json({ ok: false, error: 'Only python language is supported currently.' });
        return;
      }

      const traceId = req.traceId ?? randomUUID();
      const userId = req.userId ?? null;

      req.log?.info({ msg: 'execute_static_analysis_start', traceId, userId });
      const analysis = await validatePythonSource(parsed.source, config.allowedModules).catch(
        (error) => {
          req.log?.error({ err: error, msg: 'static_analysis_failed' });
          return { ok: false, issues: ['Static analysis failed to run'] };
        },
      );

      if (!analysis.ok) {
        req.log?.warn({
          msg: 'static_analysis_rejected',
          issues: analysis.issues,
          traceId,
          userId,
        });
        res
          .status(400)
          .json({ ok: false, error: 'Source failed safety checks', issues: analysis.issues });
        return;
      }

      req.log?.info({ msg: 'execute_enqueue_start', traceId, userId });
      const job = await queue.enqueue({
        language: parsed.language,
        source: parsed.source,
        tests: parsed.tests,
        traceId,
        userId,
      });
      req.log?.info({ msg: 'execute_job_enqueued', jobId: job.jobId, tests: parsed.tests.length });

      req.log?.info({ msg: 'execute_subscribe_start', jobId: job.jobId });
      const result = await queue.subscribe(job.jobId);
      req.log?.info({ msg: 'execute_job_completed', jobId: job.jobId, success: result.ok });
      res.json({ ...result, jobId: job.jobId, traceId, userId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ ok: false, error: error.flatten() });
        return;
      }
      if (sentryEnabled) {
        Sentry.captureException(error);
      }
      if (
        error instanceof Error &&
        error.message.includes('Execution timed out waiting for worker result')
      ) {
        recordExecutionFailure('timeout');
        res
          .status(504)
          .json({ ok: false, error: 'Execution timed out while waiting for results.' });
        return;
      }
      next(error);
    }
  });

  app.get('/metrics', async (_req: Request, res: Response) => {
    res.set('Content-Type', metricsContentType);
    res.send(await collectMetrics());
  });

  app.get('/ready', async (_req: Request, res: Response) => {
    const dockerHealthy = await dockerExecutor.ping();
    res.json({
      ok: dockerHealthy,
      services: {
        docker: dockerHealthy ? 'up' : 'down',
        queue: 'up',
      },
    });
  });

  app.use((error: Error, req: RequestWithContext, res: Response, _next: NextFunction) => {
    void _next;
    const requestLogger = req.log ?? logger;
    requestLogger.error({ err: error, msg: 'unhandled_error' });
    res.status(500).json({ ok: false, error: 'Internal server error' });
  });

  const server = app.listen(config.port, () => {
    logger.info({ msg: 'executor_listening', port: config.port });
  });

  process.on('SIGINT', async () => {
    logger.info({ msg: 'executor_shutting_down' });
    workerPool.stop();
    server.close();
    await queue.disconnect();
  });

  return app;
}

if (typeof require !== 'undefined' && require.main === module) {
  bootstrap().catch((error) => {
    if (sentryEnabled) {
      Sentry.captureException(error);
    }
    logger.error({ err: error }, '[executor] bootstrap failed');
    process.exit(1);
  });
}
