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
  private redis: Redis | null;

  private readonly queueKey: string;

  private readonly emitter = new EventEmitter();

  private readonly pending = new Map<string, ExecutionResultPayload>();

  private readonly localQueue: ExecutionJob[] = [];

  constructor({ redisUrl, queueKey }: { redisUrl: string; queueKey: string }) {
    this.queueKey = queueKey;
    
    // Try to create Redis connection, but don't fail if it's not available
    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });
    } catch (error) {
      logger.warn({ err: error }, '[queue] redis connection failed, using local queue');
      this.redis = null;
    }
  }

  async connect() {
    if (this.redis) {
      this.redis.on('error', (err) => {
        logger.error({ err }, '[queue] redis connection error');
      });
      try {
        await this.redis.connect();
        logger.info('[queue] redis connected');
      } catch (error) {
        logger.warn({ err: error }, '[queue] redis connection failed, using local queue');
        this.redis = null;
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
    
    if (this.redis) {
      await this.redis.lpush(this.queueKey, JSON.stringify(job));
    } else {
      // Use local queue
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
    if (this.redis) {
      const response = await this.redis.brpop(this.queueKey, 0);
      if (!response) {
        throw new Error('Failed to pop job from queue');
      }
      const [, body] = response;
      return JSON.parse(body) as ExecutionJob;
    } else {
      // Use local queue
      if (this.localQueue.length === 0) {
        throw new Error('No jobs in local queue');
      }
      return this.localQueue.shift()!;
    }
  }

  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
