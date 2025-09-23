import * as Sentry from '@sentry/node';

let enabled = false;

export function initSentry() {
  if (enabled) return enabled;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return false;
  }
  Sentry.init({
    dsn,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    environment: process.env.NODE_ENV ?? 'development',
  });
  enabled = true;
  return true;
}

export { Sentry };

export function isSentryEnabled() {
  return enabled;
}
