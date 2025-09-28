import * as client from 'prom-client';

client.collectDefaultMetrics({ prefix: 'kids_api_' });

const requestDuration = new client.Histogram({
  name: 'kids_api_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'status_code', 'path'],
  buckets: [50, 100, 250, 500, 1000, 2000, 5000],
});

const requestsTotal = new client.Counter({
  name: 'kids_api_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'status_code', 'path'],
});

const executeTime = new client.Histogram({
  name: 'kids_api_execute_time_ms',
  help: 'Code execution time in milliseconds',
  labelNames: ['operation'],
  buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000],
});

const judgePassRatio = new client.Gauge({
  name: 'kids_api_judge_pass_ratio',
  help: 'Ratio of passed judge results',
});

const executeTimeoutTotal = new client.Counter({
  name: 'kids_api_execute_timeout_total',
  help: 'Total number of execution timeouts',
});

export function observeRequestDuration(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
) {
  requestDuration.observe(
    { method, status_code: String(statusCode), path },
    durationMs,
  );
  
  requestsTotal.inc(
    { method, status_code: String(statusCode), path },
  );
}

export function observeExecuteTime(operation: string, durationMs: number) {
  executeTime.observe({ operation }, durationMs);
}

export function observeJudgeResult(pass: boolean) {
  // This would be called when a judge result is processed
  // For now, we'll just increment the gauge
  if (pass) {
    judgePassRatio.inc();
  } else {
    judgePassRatio.dec();
  }
}

export function observeExecuteTimeout() {
  executeTimeoutTotal.inc();
}

export async function collectApiMetrics() {
  return client.register.metrics();
}

export const apiMetricsContentType = client.register.contentType;