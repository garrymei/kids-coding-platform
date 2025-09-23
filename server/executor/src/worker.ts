import type { ExecutionJob, ExecutionResultPayload } from './queue';
import type { DockerExecutor } from './dockerRunner';
import type { BatchTestResult } from './pythonExecutor';
import { createChildLogger, logger } from './logger';
import { recordExecutionFailure, recordExecutionMetrics } from './metrics';
import { Sentry, isSentryEnabled } from './sentry';

export class WorkerPool {
  private readonly executor: DockerExecutor;

  private readonly queue: {
    take: () => Promise<ExecutionJob>;
    publishResult: (_payload: ExecutionResultPayload) => void;
  };

  private readonly concurrency: number;

  private active = 0;

  private stopped = false;

  constructor(options: {
    executor: DockerExecutor;
    queue: {
      take: () => Promise<ExecutionJob>;
      publishResult: (_payload: ExecutionResultPayload) => void;
    };
    concurrency: number;
  }) {
    this.executor = options.executor;
    this.queue = options.queue;
    this.concurrency = options.concurrency;
  }

  start() {
    for (let i = 0; i < this.concurrency; i += 1) {
      void this.loop(i + 1);
    }
    logger.info({ concurrency: this.concurrency }, '[worker] pool started');
  }

  stop() {
    this.stopped = true;
  }

  private async loop(workerId: number): Promise<void> {
    while (!this.stopped) {
      try {
        this.active += 1;
        const job = await this.queue.take();
        const startedAt = Date.now();
        const jobLogger = createChildLogger({
          traceId: job.traceId,
          userId: job.userId,
          jobId: job.jobId,
          workerId,
        });
        jobLogger.info({
          msg: 'worker_job_started',
          queueLatencyMs: startedAt - job.createdAt,
          tests: job.tests.length,
        });
        let results: BatchTestResult[] = [];
        try {
          results = await this.executor.execBatch(job.source, job.tests, {
            traceId: job.traceId,
            userId: job.userId,
            jobId: job.jobId,
          });
          this.queue.publishResult({ jobId: job.jobId, ok: true, results, traceId: job.traceId, userId: job.userId });
        } catch (error) {
          jobLogger.error({ err: error }, 'worker_execution_failed');
          if (isSentryEnabled()) {
            Sentry.captureException(error);
          }
          this.queue.publishResult({
            jobId: job.jobId,
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            results: [],
            traceId: job.traceId,
            userId: job.userId,
          });
        }
        const durationMs = Date.now() - startedAt;
        const summary = results.map((result, index) => ({
          index,
          exitCode: result.exitCode,
          timedOut: result.timedOut,
          durationMs: result.durationMs,
          passed: result.passed,
          cpuSeconds: result.usage?.cpuSeconds,
          memoryBytes: result.usage?.memoryBytes,
          containerId: result.containerId,
        }));
        recordExecutionMetrics(results);
        jobLogger.info({ msg: 'worker_job_completed', durationMs, tests: summary });
      } catch (error) {
        logger.error({ err: error }, '[worker] loop error');
        if (isSentryEnabled()) {
          Sentry.captureException(error);
        }
        recordExecutionFailure('error');
      } finally {
        this.active = Math.max(0, this.active - 1);
      }
    }
  }
}
