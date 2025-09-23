import client from 'prom-client';

client.collectDefaultMetrics({ prefix: 'kids_api_' });

const requestDuration = new client.Histogram({
  name: 'kids_api_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'status_code', 'path'],
  buckets: [50, 100, 250, 500, 1000, 2000, 5000],
});

export function observeRequestDuration(method: string, path: string, statusCode: number, durationMs: number) {
  requestDuration.observe({ method, status_code: String(statusCode), path }, durationMs);
}

export async function collectApiMetrics() {
  return client.register.metrics();
}

export const apiMetricsContentType = client.register.contentType;
