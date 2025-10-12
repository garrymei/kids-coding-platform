import EventEmitter from 'node:events';
import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';
import type { BatchTestInput, BatchTestResult } from './pythonExecutor';
import { logger } from './logger';

export interface ExecutionJob {
  jobId: string;
  language: 'python';
  source: string;
  tests: BatchTestInput[];
  createdAt: number;
  traceId: string;
  userId: string | null;
}

export interface ExecutionResultPayload {
  jobId: string;
  ok: boolean;
  results: BatchTestResult[];
  error?: string;
  traceId: string;
  userId: string | null;
}

export class TaskQueue {
  private redisProducer: Redis | null;
  private redisConsumer: Redis | null;

  private readonly queueKey: string;

  private readonly emitter = new EventEmitter();

  private readonly pending = new Map<string, ExecutionResultPayload>();

  private readonly localQueue: ExecutionJob[] = [];

  constructor({ redisUrl, queueKey }: { redisUrl: string; queueKey: string }) {
    this.queueKey = queueKey;

    // Try to create Redis connections, but don't fail if they're not available
    try {
      // Separate connections for producer (lpush) and consumer (brpop) to avoid deadlock
      this.redisProducer = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });
      this.redisConsumer = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });
    } catch (error) {
      logger.warn({ err: error }, '[queue] redis connection failed, using local queue');
      this.redisProducer = null;
      this.redisConsumer = null;
    }
  }

  async connect() {
    if (this.redisProducer && this.redisConsumer) {
      this.redisProducer.on('error', (err) => {
        logger.error({ err }, '[queue] redis producer connection error');
      });
      this.redisConsumer.on('error', (err) => {
        logger.error({ err }, '[queue] redis consumer connection error');
      });
      try {
        await Promise.all([this.redisProducer.connect(), this.redisConsumer.connect()]);
        logger.info('[queue] redis connections established');
      } catch (error) {
        logger.warn({ err: error }, '[queue] redis connection failed, using local queue');
        this.redisProducer = null;
        this.redisConsumer = null;
      }
    } else {
      logger.info('[queue] using local queue (no redis)');
    }
  }

  async enqueue(
    data: Omit<ExecutionJob, 'jobId' | 'createdAt'>,
  ): Promise<{ jobId: string } & ExecutionJob> {
    const job: ExecutionJob = {
      ...data,
      jobId: randomUUID(),
      createdAt: Date.now(),
    };

    logger.info({ jobId: job.jobId, queueKey: this.queueKey }, 'enqueue_job_created');

    if (this.redisProducer) {
      logger.info({ jobId: job.jobId, queueKey: this.queueKey }, 'enqueue_redis_lpush_start');
      try {
        const result = await this.redisProducer.lpush(this.queueKey, JSON.stringify(job));
        logger.info(
          { jobId: job.jobId, queueKey: this.queueKey, result },
          'enqueue_redis_lpush_complete',
        );
      } catch (error) {
        logger.error(
          { jobId: job.jobId, queueKey: this.queueKey, error },
          'enqueue_redis_lpush_error',
        );
        throw error;
      }
    } else {
      // Use local queue
      logger.info(
        { jobId: job.jobId, localQueueLength: this.localQueue.length },
        'enqueue_local_queue',
      );
      this.localQueue.push(job);
    }
    return job;
  }

  async subscribe(jobId: string): Promise<ExecutionResultPayload> {
    const cached = this.pending.get(jobId);
    if (cached) {
      this.pending.delete(jobId);
      return cached;
    }
    return new Promise<ExecutionResultPayload>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.emitter.removeAllListeners(jobId);
        reject(new Error('Execution timed out waiting for worker result'));
      }, 30_000);

      this.emitter.once(jobId, (payload: ExecutionResultPayload) => {
        clearTimeout(timeout);
        resolve(payload);
      });
    });
  }

  publishResult(payload: ExecutionResultPayload) {
    if (this.emitter.listenerCount(payload.jobId) > 0) {
      this.emitter.emit(payload.jobId, payload);
      return;
    }
    this.pending.set(payload.jobId, payload);
  }

  async take(): Promise<ExecutionJob> {
    logger.info({ queueKey: this.queueKey, hasRedis: !!this.redisConsumer }, 'take_job_start');

    if (this.redisConsumer) {
      logger.info({ queueKey: this.queueKey }, 'take_redis_brpop_start');
      const result = await this.redisConsumer.brpop(this.queueKey, 0);
      logger.info({ queueKey: this.queueKey, hasResult: !!result }, 'take_redis_brpop_result');

      if (result) {
        const job = JSON.parse(result[1]) as ExecutionJob;
        logger.info({ jobId: job.jobId, queueKey: this.queueKey }, 'take_job_parsed');
        return job;
      }
      throw new Error('Unexpected empty result from brpop');
    } else {
      // Use local queue
      logger.info({ localQueueLength: this.localQueue.length }, 'take_local_queue_check');
      while (this.localQueue.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const job = this.localQueue.shift()!;
      logger.info({ jobId: job.jobId, localQueueLength: this.localQueue.length }, 'take_local_job');
      return job;
    }
  }

  async disconnect() {
    const promises = [];
    if (this.redisProducer) {
      promises.push(this.redisProducer.quit());
    }
    if (this.redisConsumer) {
      promises.push(this.redisConsumer.quit());
    }
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }
}
