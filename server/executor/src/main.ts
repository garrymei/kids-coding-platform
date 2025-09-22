import express, { type NextFunction, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { loadConfig } from './config';
import { TaskQueue } from './queue';
import { DockerExecutor } from './dockerRunner';
import { WorkerPool } from './worker';
import { createChildLogger, logger } from './logger';

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

export async function bootstrap() {
  const config = loadConfig();
  const queue = new TaskQueue({ redisUrl: config.redisUrl, queueKey: config.queueKey });
  await queue.connect();

  const dockerExecutor = new DockerExecutor({
    socketPath: config.dockerSocketPath,
    image: config.dockerImage,
    memoryBytes: config.memoryBytes,
    nanoCpus: config.nanoCpus,
    executionTimeoutMs: config.executionTimeoutMs,
    allowedModulesJson: config.allowModules,
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

  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    const headerTrace = req.headers['x-trace-id'];
    const traceId = (Array.isArray(headerTrace) ? headerTrace[0] : headerTrace) ?? randomUUID();
    const headerUser = req.headers['x-user-id'];
    const userId = (Array.isArray(headerUser) ? headerUser[0] : headerUser) ?? null;
    req.traceId = traceId;
    req.userId = userId;
    const requestLogger = createChildLogger({ traceId, userId, path: req.originalUrl, method: req.method });
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

  app.post('/execute', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = executeSchema.parse(req.body ?? {});

      if (parsed.language !== 'python') {
        res.status(400).json({ ok: false, error: 'Only python language is supported currently.' });
        return;
      }

      const traceId = req.traceId ?? randomUUID();
      const userId = req.userId ?? null;

      const job = await queue.enqueue({
        language: parsed.language,
        source: parsed.source,
        tests: parsed.tests,
        traceId,
        userId,
      });
      req.log?.info({ msg: 'execute_job_enqueued', jobId: job.jobId, tests: parsed.tests.length });

      const result = await queue.subscribe(job.jobId);
      req.log?.info({ msg: 'execute_job_completed', jobId: job.jobId, success: result.ok });
      res.json({ ...result, jobId: job.jobId, traceId, userId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ ok: false, error: error.flatten() });
        return;
      }
      next(error);
    }
  });

  app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
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
    logger.error({ err: error }, '[executor] bootstrap failed');
    process.exit(1);
  });
}
