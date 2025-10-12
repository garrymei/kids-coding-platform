import { spawn } from 'child_process';
import path from 'path';

export interface PythonExecutionInput {
  source: string;
  stdin?: string;
  timeoutMs?: number;
  allowedModules?: string[];
  cpuSeconds?: number;
  memoryLimitBytes?: number;
}

export interface PythonExecutionUsage {
  cpuSeconds?: number;
  memoryBytes?: number;
}

export interface PythonExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  signal: string | null;
  durationMs: number;
  usage?: PythonExecutionUsage;
  raw?: unknown;
  svg?: string;
  segments?: Array<{ len: number; deg: number }>;
}

const DEFAULT_TIMEOUT_MS = 3_000;
const DEFAULT_CPU_LIMIT_SECONDS = 2.0;
const DEFAULT_MEMORY_LIMIT_BYTES = 256 * 1024 * 1024;
const DEFAULT_ALLOWED_MODULES = ['math', 'random', 'statistics', 'turtle'];

const runnerPath = path.resolve(__dirname, '../src/runtime/python_runner.py');

function parseOutput(rawOutput: string): {
  jsonOutput: string;
  svg?: string;
  segments?: Array<{ len: number; deg: number }>;
} {
  let jsonOutput = rawOutput;
  let svg: string | undefined;
  let segments: Array<{ len: number; deg: number }> | undefined;

  // Extract SVG output
  const svgStartMatch = rawOutput.match(/SVG_OUTPUT_START\n([\s\S]*?)\nSVG_OUTPUT_END/);
  if (svgStartMatch) {
    svg = svgStartMatch[1];
    jsonOutput = jsonOutput.replace(/SVG_OUTPUT_START\n[\s\S]*?\nSVG_OUTPUT_END\n?/, '');
  }

  // Extract segments output
  const segmentsStartMatch = rawOutput.match(
    /SEGMENTS_OUTPUT_START\n([\s\S]*?)\nSEGMENTS_OUTPUT_END/,
  );
  if (segmentsStartMatch) {
    try {
      const segmentsData = JSON.parse(segmentsStartMatch[1]);
      segments = segmentsData.segments;
    } catch (error) {
      // Ignore parsing errors for segments
    }
    jsonOutput = jsonOutput.replace(/SEGMENTS_OUTPUT_START\n[\s\S]*?\nSEGMENTS_OUTPUT_END\n?/, '');
  }

  return { jsonOutput: jsonOutput.trim(), svg, segments };
}

export async function runPythonTest(input: PythonExecutionInput): Promise<PythonExecutionResult> {
  const timeoutMs = Math.max(500, input.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const startedAt = Date.now();
  const child = spawn('python3', [runnerPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      EXECUTOR_TIMEOUT: String(timeoutMs / 1_000),
      EXECUTOR_CPU_LIMIT: String(input.cpuSeconds ?? DEFAULT_CPU_LIMIT_SECONDS),
      EXECUTOR_MEM_LIMIT: String(input.memoryLimitBytes ?? DEFAULT_MEMORY_LIMIT_BYTES),
      EXECUTOR_ALLOWED_MODULES: JSON.stringify(input.allowedModules ?? DEFAULT_ALLOWED_MODULES),
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

  let timedOutExternally = false;
  const timedOut = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => {
      if (!child.killed) {
        killed = true;
        timedOutExternally = true;
        child.kill('SIGKILL');
        resolve(true);
      }
    }, timeoutMs + 200);

    child.on('exit', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });

  const { code, signal } = await new Promise<{ code: number | null; signal: string | null }>(
    (resolve) => {
      child.on('close', (c, s) => resolve({ code: c, signal: s }));
    },
  );

  const durationMs = Date.now() - startedAt;

  if (timedOut || killed) {
    return {
      stdout: '',
      stderr: stderr || 'Process terminated due to timeout',
      exitCode: code,
      timedOut: true,
      signal,
      durationMs,
    };
  }

  // Parse output to extract JSON, SVG, and segments
  const { jsonOutput, svg, segments } = parseOutput(stdout);

  try {
    const parsed = JSON.parse(jsonOutput || '{}');
    const usage = parseUsage(parsed.usage);
    return {
      stdout: typeof parsed.stdout === 'string' ? parsed.stdout : '',
      stderr: typeof parsed.stderr === 'string' ? parsed.stderr : stderr,
      exitCode: code,
      timedOut: Boolean(parsed.timeout) || timedOutExternally,
      signal,
      durationMs,
      usage,
      raw: parsed,
      svg,
      segments,
    };
  } catch (error) {
    return {
      stdout: jsonOutput,
      stderr: stderr || `Failed to parse runner output: ${(error as Error).message}`,
      exitCode: code,
      timedOut: false,
      signal,
      durationMs,
      svg,
      segments,
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
  containerId?: string;
}

export async function runPythonBatch(
  source: string,
  tests: BatchTestInput[],
  options?: Pick<
    PythonExecutionInput,
    'allowedModules' | 'cpuSeconds' | 'memoryLimitBytes' | 'timeoutMs'
  >,
): Promise<BatchTestResult[]> {
  const items = tests.length ? tests : [{}];
  const results: BatchTestResult[] = [];
  // Sequential execution to prevent resource contention.
  for (const test of items) {
    const result = await runPythonTest({
      stdin: test.stdin,
      timeoutMs: test.timeoutMs ?? options?.timeoutMs,
      source,
      allowedModules: options?.allowedModules,
      cpuSeconds: options?.cpuSeconds,
      memoryLimitBytes: options?.memoryLimitBytes,
    });

    let passed: boolean | undefined;
    if (typeof test.expectedStdout === 'string') {
      passed = result.stdout.trim() === test.expectedStdout.trim();
    }

    results.push({ ...result, expectedStdout: test.expectedStdout, passed });
  }
  return results;
}

function parseUsage(raw: unknown): PythonExecutionUsage | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const usage = raw as Record<string, unknown>;
  const cpuSeconds = typeof usage.cpu_seconds === 'number' ? usage.cpu_seconds : undefined;
  let memoryBytes: number | undefined;
  if (typeof usage.max_rss === 'number') {
    const maxRss = usage.max_rss;
    // On Linux ru_maxrss is kilobytes, on macOS it is bytes.
    memoryBytes = maxRss > 0 && maxRss < 1_000_000 ? maxRss * 1024 : maxRss;
  }
  if (cpuSeconds === undefined && memoryBytes === undefined) {
    return undefined;
  }
  return {
    cpuSeconds,
    memoryBytes,
  };
}
