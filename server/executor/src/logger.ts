import pino, { type LoggerOptions, type TransportTargetOptions } from 'pino';

const level = process.env.LOG_LEVEL ?? 'info';
const isPretty = process.env.LOG_PRETTY === 'true';
const logToFile = process.env.LOG_TO_FILE !== 'false';
const logFilePath = process.env.LOG_FILE ?? 'logs/executor.log';

const options: LoggerOptions = {
  level,
  base: {
    service: 'kids-executor',
    environment: process.env.NODE_ENV ?? 'development',
  },
};

const targets: TransportTargetOptions[] = [];

if (isPretty) {
  targets.push({
    target: 'pino-pretty',
    options: {
      singleLine: false,
      translateTime: 'SYS:standard',
    },
    level,
  });
} else {
  targets.push({
    target: 'pino/file',
    options: { destination: 1 },
    level,
  });
}

if (logToFile) {
  targets.push({
    target: 'pino/file',
    options: { destination: logFilePath, mkdir: true },
    level,
  });
}

export const logger = targets.length > 0 ? pino({ ...options, transport: { targets } }) : pino(options);

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
