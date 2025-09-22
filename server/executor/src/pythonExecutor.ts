import { spawn } from 'child_process';
import path from 'path';

export interface PythonExecutionInput {
  source: string;
  stdin?: string;
  timeoutMs?: number;
}

export interface PythonExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  signal: string | null;
  raw?: unknown;
}

const DEFAULT_TIMEOUT_MS = 3_000;
const runnerPath = path.resolve(__dirname, '../src/runtime/python_runner.py');

export async function runPythonTest(input: PythonExecutionInput): Promise<PythonExecutionResult> {
  const timeoutMs = Math.max(500, input.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const child = spawn('python3', [runnerPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      EXECUTOR_TIMEOUT: String(timeoutMs / 1_000),
    },
  });

  const payload = JSON.stringify({ source: input.source, stdin: input.stdin ?? '' });
  child.stdin.write(payload);
  child.stdin.end();

  let stdout = '';
  let stderr = '';
  let killed = false;

  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  const timedOut = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => {
      if (!child.killed) {
        killed = true;
        child.kill('SIGKILL');
        resolve(true);
      }
    }, timeoutMs + 200);

    child.on('exit', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });

  const { code, signal } = await new Promise<{ code: number | null; signal: string | null }>((resolve) => {
    child.on('close', (c, s) => resolve({ code: c, signal: s }));
  });

  if (timedOut || killed) {
    return {
      stdout: '',
      stderr: stderr || 'Process terminated due to timeout',
      exitCode: code,
      timedOut: true,
      signal,
    };
  }

  try {
    const parsed = JSON.parse(stdout || '{}');
    return {
      stdout: typeof parsed.stdout === 'string' ? parsed.stdout : '',
      stderr: typeof parsed.stderr === 'string' ? parsed.stderr : stderr,
      exitCode: code,
      timedOut: Boolean(parsed.timeout),
      signal,
      raw: parsed,
    };
  } catch (error) {
    return {
      stdout,
      stderr: stderr || `Failed to parse runner output: ${(error as Error).message}`,
      exitCode: code,
      timedOut: false,
      signal,
    };
  }
}

export interface BatchTestInput {
  expectedStdout?: string;
  stdin?: string;
  timeoutMs?: number;
}

export interface BatchTestResult extends PythonExecutionResult {
  expectedStdout?: string;
  passed?: boolean;
}

export async function runPythonBatch(
  source: string,
  tests: BatchTestInput[],
): Promise<BatchTestResult[]> {
  const items = tests.length ? tests : [{}];
  const results: BatchTestResult[] = [];
  // Sequential execution to prevent resource contention.
  for (const test of items) {
    const result = await runPythonTest({
      stdin: test.stdin,
      timeoutMs: test.timeoutMs,
      source,
    });

    let passed: boolean | undefined;
    if (typeof test.expectedStdout === 'string') {
      passed = result.stdout.trim() === test.expectedStdout.trim();
    }

    results.push({ ...result, expectedStdout: test.expectedStdout, passed });
  }
  return results;
}
