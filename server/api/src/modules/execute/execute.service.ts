import { BadRequestException, Injectable } from '@nestjs/common';
import { performance } from 'node:perf_hooks';
import { Script, createContext } from 'node:vm';
import { ExecuteJudgeDto, ExecuteRequestDto, ExecuteResponse, ExecutionError } from './dto/execute-request.dto';
import { EventBridgeService } from './event-bridge.service';
import { JudgeService } from '../judge/judge.service';
import { ExecutionEvent } from './eventParser';
import { dockerRunner } from '../../../../executor/dockerRunner';

const MAX_OUTPUT_BYTES = 64 * 1024;
const MAX_TIMEOUT_MS = 3000;
const PYTHON_ALLOWED_MODULES = ['math', 'random', 'statistics', 'json'];
const PYTHON_CPU_SECONDS = 2.0;
const PYTHON_MEMORY_LIMIT = 256 * 1024 * 1024;
const PYTHON_EXECUTOR_URL = new URL('../../../../executor/dist/pythonExecutor.js', import.meta.url);

// Docker 执行器配置
const USE_DOCKER = process.env.USE_DOCKER === 'true' || process.env.NODE_ENV === 'production';

type InternalExecutionOutcome = {
  stdout: string;
  stderr: string;
  timeMs: number;
  error: ExecutionError | null;
};

type PythonExecutor = (input: {
  source: string;
  stdin?: string;
  timeoutMs?: number;
  allowedModules?: string[];
  cpuSeconds?: number;
  memoryLimitBytes?: number;
}) => Promise<{
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  timedOut?: boolean;
  durationMs?: number;
}>;

@Injectable()
export class ExecuteService {
  constructor(
    private readonly events: EventBridgeService,
    private readonly judgeService: JudgeService,
  ) {}

  async run(dto: ExecuteRequestDto): Promise<ExecuteResponse> {
    const code = this.resolveCode(dto);
    const timeoutMs = this.resolveTimeout(dto.timeoutMs);

    let outcome: InternalExecutionOutcome;
    if (dto.lang === 'python') {
      outcome = await this.runPython(code, dto.stdin ?? '', timeoutMs);
    } else if (dto.lang === 'javascript') {
      outcome = this.runJavaScript(code, dto.stdin ?? '', timeoutMs);
    } else {
      throw new BadRequestException(`Unsupported language: ${dto.lang}`);
    }

    const events = this.events.collect(outcome.stdout);

    let judgeResult: { ok: boolean; details?: any } | undefined;
    if (!outcome.error && dto.judge) {
      judgeResult = await this.evaluateJudge(dto.judge, outcome.stdout, events);
    }

    const limitedStdout = this.enforceOutputLimit(outcome.stdout);
    const limitedStderr = this.enforceOutputLimit(outcome.stderr);

    let error = outcome.error;
    if ((limitedStdout.truncated || limitedStderr.truncated) && !error) {
      error = {
        code: 'OUTPUT_LIMIT',
        message: 'Output exceeded 64KB limit',
      };
    }

    const ok = !error && (!judgeResult || judgeResult.ok);

    return {
      ok,
      stdout: limitedStdout.value,
      stderr: limitedStderr.value,
      timeMs: outcome.timeMs,
      events,
      error,
      judge: judgeResult,
    };
  }

  private resolveCode(dto: ExecuteRequestDto): string {
    const code = dto.code ?? dto.source;
    if (!code) {
      throw new BadRequestException('Missing code payload');
    }
    return code;
  }

  private resolveTimeout(requested?: number): number {
    const value = requested ?? MAX_TIMEOUT_MS;
    return Math.min(Math.max(1, value), MAX_TIMEOUT_MS);
  }

  private async runPython(code: string, stdin: string, timeoutMs: number): Promise<InternalExecutionOutcome> {
    const started = performance.now();
    
    // 选择执行器：Docker 或本地执行器
    if (USE_DOCKER) {
      return this.runPythonWithDocker(code, stdin, timeoutMs, started);
    } else {
      return this.runPythonWithLocalExecutor(code, stdin, timeoutMs, started);
    }
  }

  /**
   * 使用 Docker 容器执行 Python 代码
   */
  private async runPythonWithDocker(code: string, stdin: string, timeoutMs: number, started: number): Promise<InternalExecutionOutcome> {
    try {
      // 检查 Docker 是否可用
      const isDockerAvailable = await dockerRunner.isAvailable();
      if (!isDockerAvailable) {
        throw new Error('Docker is not available');
      }

      // 检查镜像是否存在
      const isImageAvailable = await dockerRunner.isImageAvailable();
      if (!isImageAvailable) {
        throw new Error('Docker image kids-code-python:latest not found');
      }

      const result = await dockerRunner.run({
        source: code,
        stdin,
        timeoutMs,
        allowedModules: PYTHON_ALLOWED_MODULES,
        cpuSeconds: PYTHON_CPU_SECONDS,
        memoryLimitBytes: PYTHON_MEMORY_LIMIT,
      });

      const stdout = typeof result.stdout === 'string' ? result.stdout : '';
      const stderr = typeof result.stderr === 'string' ? result.stderr : '';
      const error = this.mapPythonError(result.timedOut, stderr);
      const timeMs = typeof result.durationMs === 'number'
        ? Math.max(0, Math.round(result.durationMs))
        : Math.max(0, Math.round(performance.now() - started));

      return { stdout, stderr, timeMs, error };
    } catch (error) {
      // Docker 执行失败，回退到本地执行器
      console.warn('Docker execution failed, falling back to local executor:', error);
      return this.runPythonWithLocalExecutor(code, stdin, timeoutMs, started);
    }
  }

  /**
   * 使用本地执行器执行 Python 代码
   */
  private async runPythonWithLocalExecutor(code: string, stdin: string, timeoutMs: number, started: number): Promise<InternalExecutionOutcome> {
    try {
      const module = await import(PYTHON_EXECUTOR_URL.href);
      const runPythonTest: PythonExecutor = module.runPythonTest ?? module.default?.runPythonTest;
      if (typeof runPythonTest !== 'function') {
        throw new Error('Python executor module does not export runPythonTest');
      }

      const result = await runPythonTest({
        source: code,
        stdin,
        timeoutMs,
        allowedModules: PYTHON_ALLOWED_MODULES,
        cpuSeconds: PYTHON_CPU_SECONDS,
        memoryLimitBytes: PYTHON_MEMORY_LIMIT,
      });

      const stdout = typeof result.stdout === 'string' ? result.stdout : '';
      const stderr = typeof result.stderr === 'string' ? result.stderr : '';
      const error = this.mapPythonError(result.timedOut, stderr);
      const timeMs = typeof result.durationMs === 'number'
        ? Math.max(0, Math.round(result.durationMs))
        : Math.max(0, Math.round(performance.now() - started));

      return { stdout, stderr, timeMs, error };
    } catch (error) {
      const fallback = this.runMock(code, stdin);
      fallback.error = fallback.error ?? {
        code: 'RUNTIME_ERROR',
        message: error instanceof Error ? error.message : 'Python executor failed',
      };
      return fallback;
    }
  }

  private runJavaScript(code: string, stdin: string, timeoutMs: number): InternalExecutionOutcome {
    const stdoutBuffer: string[] = [];
    const stderrBuffer: string[] = [];
    const pushStdout = (...args: unknown[]) => stdoutBuffer.push(this.formatConsole(args));
    const pushStderr = (...args: unknown[]) => stderrBuffer.push(this.formatConsole(args));

    const inputLines = stdin.length ? stdin.split(/\r?\n/) : [];
    let inputIndex = 0;
    const readInput = () => (inputIndex < inputLines.length ? inputLines[inputIndex++] : '');

    const sandbox: Record<string, unknown> = {
      console: {
        log: (...args: unknown[]) => pushStdout(...args),
        info: (...args: unknown[]) => pushStdout(...args),
        debug: (...args: unknown[]) => pushStdout(...args),
        warn: (...args: unknown[]) => pushStderr(...args),
        error: (...args: unknown[]) => pushStderr(...args),
      },
      input: () => readInput(),
      stdin,
    };

    ['require', 'process', 'fs', 'child_process'].forEach((name) => {
      sandbox[name] = this.createForbiddenGlobal(name);
    });

    sandbox.global = sandbox;
    sandbox.globalThis = sandbox;
    sandbox.eval = this.createForbiddenGlobal('eval');
    sandbox.Function = this.createForbiddenGlobal('Function');

    const context = createContext(sandbox, {
      codeGeneration: { strings: false, wasm: false },
    });

    const started = performance.now();
    try {
      const script = new Script(code, { filename: 'user.js' });
      script.runInContext(context, { timeout: timeoutMs });
      return {
        stdout: stdoutBuffer.join(''),
        stderr: stderrBuffer.join(''),
        timeMs: Math.max(0, Math.round(performance.now() - started)),
        error: null,
      };
    } catch (err) {
      const mapped = this.mapJavaScriptError(err);
      if (!mapped && err instanceof Error) {
        stderrBuffer.push(err.message + '\n');
      }
      return {
        stdout: stdoutBuffer.join(''),
        stderr: stderrBuffer.join('') || (err instanceof Error ? `${err.name}: ${err.message}` : String(err)),
        timeMs: Math.max(0, Math.round(performance.now() - started)),
        error: mapped ?? {
          code: 'RUNTIME_ERROR',
          message: err instanceof Error ? err.message : 'JavaScript runtime error',
        },
      };
    }
  }

  private runMock(code: string, stdin: string): InternalExecutionOutcome {
    const stdoutParts: string[] = [];
    if (code.includes('print(')) {
      const matches = code.match(/print\(([^)]+)\)/g) ?? [];
      matches.forEach((match) => {
        const valueMatch = match.match(/print\(['"]([^'"]*)['"]\)/);
        if (valueMatch) stdoutParts.push(valueMatch[1]);
      });
    } else if (stdin) {
      stdoutParts.push(stdin);
    } else {
      stdoutParts.push('Execution completed');
    }

    return {
      stdout: stdoutParts.join('\n') + '\n',
      stderr: '',
      timeMs: 5,
      error: {
        code: 'RUNTIME_ERROR',
        message: 'Executed via mock runtime fallback',
      },
    };
  }

  private async evaluateJudge(
    judge: ExecuteJudgeDto,
    stdout: string,
    events: ExecutionEvent[],
  ): Promise<{ ok: boolean; details?: any }> {
    try {
      return await this.judgeService.evaluateStrategy({
        strategy: judge.strategy,
        expected: judge.expected,
        output: { stdout, events },
        args: judge.args,
      });
    } catch (error) {
      return {
        ok: false,
        details: {
          message: error instanceof Error ? error.message : 'Judge evaluation failed',
        },
      };
    }
  }

  private mapPythonError(timedOut: boolean | undefined, stderr: string): ExecutionError | null {
    if (timedOut) {
      return { code: 'TIMEOUT', message: 'Execution timed out' };
    }

    if (!stderr) {
      return null;
    }

    const forbiddenMatch = stderr.match(/ImportError: Import of '([^']+)' is not allowed/);
    if (forbiddenMatch) {
      return {
        code: 'FORBIDDEN_IMPORT',
        message: `Import of '${forbiddenMatch[1]}' is not allowed`,
        name: forbiddenMatch[1],
      };
    }

    const syntaxMatch = stderr.match(/(SyntaxError|IndentationError):\s+([^\n]+)(?:[\s\S]*line\s+(\d+))/);
    if (syntaxMatch) {
      return {
        code: 'SYNTAX_ERROR',
        message: syntaxMatch[2],
        line: syntaxMatch[3] ? Number(syntaxMatch[3]) : undefined,
      };
    }

    return {
      code: 'RUNTIME_ERROR',
      message: stderr.split('\n')[0] || 'Python runtime error',
    };
  }

  private mapJavaScriptError(err: unknown): ExecutionError | null {
    if (!(err instanceof Error)) {
      return {
        code: 'RUNTIME_ERROR',
        message: String(err),
      };
    }

    const message = err.message || err.toString();

    if (/timed out/.test(message)) {
      return { code: 'TIMEOUT', message: 'Execution timed out' };
    }

    if (/is disabled/.test(message)) {
      const nameMatch = message.match(/Access to (.+?) is disabled/);
      return {
        code: 'FORBIDDEN_IMPORT',
        message: message,
        name: nameMatch ? nameMatch[1] : undefined,
      };
    }

    if (err.name === 'SyntaxError') {
      const lineMatch = message.match(/<anonymous>:(\d+):/);
      if (!lineMatch && err.stack) {
        const stackMatch = err.stack.match(/<anonymous>:(\d+):/);
        if (stackMatch) {
          return {
            code: 'SYNTAX_ERROR',
            message,
            line: Number(stackMatch[1]),
          };
        }
      }
      return {
        code: 'SYNTAX_ERROR',
        message,
        line: lineMatch ? Number(lineMatch[1]) : undefined,
      };
    }

    return null;
  }

  private createForbiddenGlobal(name: string) {
    const thrower = () => {
      throw new Error(`Access to ${name} is disabled`);
    };
    return new Proxy(thrower, {
      apply: thrower,
      construct: thrower,
      get: () => {
        thrower();
      },
    });
  }

  private formatConsole(args: unknown[]): string {
    return args
      .map((arg) => {
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
        if (arg === null || arg === undefined) return String(arg);
        try {
          return JSON.stringify(arg);
        } catch (error) {
          return String(arg);
        }
      })
      .join(' ') + '\n';
  }

  private enforceOutputLimit(value: string) {
    const buffer = Buffer.from(value ?? '', 'utf8');
    if (buffer.length <= MAX_OUTPUT_BYTES) {
      return { value, truncated: false };
    }
    const truncatedValue = buffer.subarray(0, MAX_OUTPUT_BYTES).toString('utf8');
    return { value: truncatedValue, truncated: true };
  }
}
