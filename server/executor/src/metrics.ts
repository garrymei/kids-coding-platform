import client from 'prom-client';
import type { BatchTestResult } from './pythonExecutor';

client.collectDefaultMetrics({ register: client.register, prefix: 'kids_executor_' });

const executionCounter = new client.Counter({
  name: 'kids_executor_execution_total',
  help: 'Total number of executed test cases',
  labelNames: ['outcome'],
});

const executionDuration = new client.Histogram({
  name: 'kids_executor_execution_duration_ms',
  help: 'Execution duration per test case in milliseconds',
  buckets: [50, 100, 250, 500, 750, 1000, 2000, 5000],
});

export function recordExecutionMetrics(results: BatchTestResult[]) {
  for (const result of results) {
    const outcome = result.timedOut ? 'timeout' : result.stderr ? 'error' : 'success';
    executionCounter.inc({ outcome });
    if (typeof result.durationMs === 'number' && Number.isFinite(result.durationMs)) {
      executionDuration.observe(result.durationMs);
    }
  }
}

export function recordExecutionFailure(outcome: 'error' | 'timeout') {
  executionCounter.inc({ outcome });
}

export async function collectMetrics() {
  return client.register.metrics();
}

export const metricsContentType = client.register.contentType;
