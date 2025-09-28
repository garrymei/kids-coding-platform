import { spawn } from 'child_process';
import path from 'path';
const DEFAULT_TIMEOUT_MS = 3_000;
const DEFAULT_CPU_LIMIT_SECONDS = 2.0;
const DEFAULT_MEMORY_LIMIT_BYTES = 256 * 1024 * 1024;
const DEFAULT_ALLOWED_MODULES = ['math', 'random', 'statistics'];
const runnerPath = path.resolve(__dirname, '../src/runtime/python_runner.py');
export async function runPythonTest(input) {
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
    const timedOut = await new Promise((resolve) => {
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
    const { code, signal } = await new Promise((resolve) => {
        child.on('close', (c, s) => resolve({ code: c, signal: s }));
    });
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
    try {
        const parsed = JSON.parse(stdout || '{}');
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
        };
    }
    catch (error) {
        return {
            stdout,
            stderr: stderr || `Failed to parse runner output: ${error.message}`,
            exitCode: code,
            timedOut: false,
            signal,
            durationMs,
        };
    }
}
export async function runPythonBatch(source, tests, options) {
    const items = tests.length ? tests : [{}];
    const results = [];
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
        let passed;
        if (typeof test.expectedStdout === 'string') {
            passed = result.stdout.trim() === test.expectedStdout.trim();
        }
        results.push({ ...result, expectedStdout: test.expectedStdout, passed });
    }
    return results;
}
function parseUsage(raw) {
    if (!raw || typeof raw !== 'object') {
        return undefined;
    }
    const usage = raw;
    const cpuSeconds = typeof usage.cpu_seconds === 'number' ? usage.cpu_seconds : undefined;
    let memoryBytes;
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
