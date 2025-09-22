import pino, { type LoggerOptions } from 'pino';

const level = process.env.LOG_LEVEL ?? 'info';
const isPretty = process.env.LOG_PRETTY === 'true';

const options: LoggerOptions = {
  level,
  base: {
    service: 'kids-executor',
    environment: process.env.NODE_ENV ?? 'development',
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  transport: isPretty
    ? {
        target: 'pino-pretty',
        options: {
          singleLine: false,
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
};

export const logger = pino(options);

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
