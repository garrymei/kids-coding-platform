import { z } from 'zod';

type Config = z.infer<typeof configSchema>;

const configSchema = z.object({
  port: z.number().int().positive().default(4060),
  redisUrl: z.string().default('redis://localhost:6379'),
  queueKey: z.string().default('executor:tasks'),
  maxConcurrency: z.number().int().min(1).max(20).default(5),
  dockerImage: z.string().default('python:3.12-alpine'),
  memoryBytes: z.number().int().min(64 * 1024 * 1024).default(256 * 1024 * 1024),
  nanoCpus: z.number().int().min(1).default(1_000_000_000),
  executionTimeoutMs: z.number().int().min(500).default(3_000),
  allowModules: z
    .array(z.string())
    .default(['math', 'random', 'statistics'])
    .transform((list) => JSON.stringify(list)),
  dockerSocketPath: z.string().default('/var/run/docker.sock'),
  enableLocalFallback: z.boolean().default(true),
});

export function loadConfig(): Config {
  return configSchema.parse({
    port: process.env.EXECUTOR_PORT ? Number(process.env.EXECUTOR_PORT) : undefined,
    redisUrl: process.env.EXECUTOR_REDIS_URL,
    queueKey: process.env.EXECUTOR_QUEUE_KEY,
    maxConcurrency: process.env.EXECUTOR_MAX_CONCURRENCY
      ? Number(process.env.EXECUTOR_MAX_CONCURRENCY)
      : undefined,
    dockerImage: process.env.EXECUTOR_DOCKER_IMAGE,
    memoryBytes: process.env.EXECUTOR_MEM_LIMIT
      ? Number(process.env.EXECUTOR_MEM_LIMIT)
      : undefined,
    nanoCpus: process.env.EXECUTOR_NANO_CPUS
      ? Number(process.env.EXECUTOR_NANO_CPUS)
      : undefined,
    executionTimeoutMs: process.env.EXECUTOR_TIMEOUT
      ? Number(process.env.EXECUTOR_TIMEOUT) * 1_000
      : undefined,
    allowModules: process.env.EXECUTOR_ALLOWED_MODULES
      ? JSON.parse(process.env.EXECUTOR_ALLOWED_MODULES)
      : undefined,
    dockerSocketPath: process.env.DOCKER_SOCKET_PATH,
    enableLocalFallback:
      process.env.EXECUTOR_LOCAL_FALLBACK === undefined
        ? undefined
        : process.env.EXECUTOR_LOCAL_FALLBACK === 'true',
  });
}
