import { Injectable } from '@nestjs/common';
import { ExecuteRequestDto, ExecuteResponse, ExecutionError } from './dto/execute-request.dto';
import { ExecutionEvent, ExecutionArtifacts } from './eventParser';

type SimulationResult = {
  stdout: string;
  stderr: string;
  events: ExecutionEvent[];
  meta?: Record<string, unknown>;
  artifacts?: ExecutionArtifacts;
  error: ExecutionError | null;
  timeout: boolean;
};

@Injectable()
export class ExecuteService {
  private readonly defaultTimeoutMs = 2000;
  private readonly maxStdoutLength = 4096;
  private readonly forbiddenImports = ['os', 'sys', 'subprocess', 'socket', 'requests'];

  async execute(body: ExecuteRequestDto): Promise<ExecuteResponse> {
    const startedAt = Date.now();
    const timeoutMs = body.timeoutMs ?? this.defaultTimeoutMs;
    const code = this.extractCode(body);
    const lang = this.normaliseLanguage((body as any).language ?? body.lang);

    if (!code.trim()) {
      return this.composeResponse(
        {
          stdout: '',
          stderr: '代码为空，请先编写代码后再运行。',
          events: [],
          error: {
            code: 'RUNTIME_ERROR',
            message: 'Empty source code',
          },
          timeout: false,
        },
        startedAt,
      );
    }

    const simulation = this.simulateExecution(lang, code, body.stdin, timeoutMs);
    return this.composeResponse(simulation, startedAt);
  }

  private extractCode(body: ExecuteRequestDto): string {
    if (typeof body.code === 'string') return body.code;
    if (typeof body.source === 'string') return body.source;
    return '';
  }

  private composeResponse(simulation: SimulationResult, startedAt: number): ExecuteResponse {
    const elapsed = Date.now() - startedAt;
    let { stdout } = simulation;
    const { stderr, events, error, meta, artifacts, timeout } = simulation;

    if (stdout.length > this.maxStdoutLength) {
      stdout = stdout.slice(0, this.maxStdoutLength);
    }

    return {
      ok: !timeout && !error && !stderr,
      stdout,
      stderr,
      timeMs: elapsed,
      events,
      error,
      meta,
      timeout,
      artifacts,
    };
  }

  private normaliseLanguage(input?: string): ExecuteRequestDto['lang'] {
    const value = (input ?? 'python').toString().toLowerCase();
    if (value.startsWith('py')) return 'python';
    if (value.startsWith('js') || value.includes('node')) return 'javascript';
    return value === 'javascript' || value === 'python'
      ? (value as ExecuteRequestDto['lang'])
      : 'python';
  }

  private simulateExecution(
    lang: ExecuteRequestDto['lang'],
    code: string,
    stdin: string | undefined,
    timeoutMs: number,
  ): SimulationResult {
    // Detect disallowed patterns first
    if (this.containsForbiddenImport(code)) {
      return {
        stdout: '',
        stderr: '检测到受限模块（如 os/sys/Subprocess 等），请移除后重新运行。',
        events: [],
        error: { code: 'FORBIDDEN_IMPORT', message: 'Forbidden module detected' },
        timeout: false,
      };
    }

    if (this.looksLikeInfiniteLoop(code)) {
      return {
        stdout: '',
        stderr: '程序疑似进入死循环，已自动停止执行。',
        events: [],
        error: { code: 'TIMEOUT', message: `Potential infinite loop (> ${timeoutMs}ms)` },
        timeout: true,
      };
    }

    const stdout = this.simulateStdout(lang, code, stdin);
    const stderr = this.simulateStderr(lang, code);
    const { events, meta } = this.simulateEventsAndMeta(code);
    const artifacts = this.simulateArtifacts(code, events);

    let error: ExecutionError | null = null;
    if (stderr) {
      error = { code: 'RUNTIME_ERROR', message: stderr };
    }

    return {
      stdout,
      stderr,
      events,
      meta,
      artifacts,
      error,
      timeout: false,
    };
  }

  private containsForbiddenImport(code: string): boolean {
    const normalized = code.toLowerCase();
    return this.forbiddenImports.some((name) => normalized.includes(`import ${name}`));
  }

  private looksLikeInfiniteLoop(code: string): boolean {
    const normalized = code.replace(/\s+/g, ' ').toLowerCase();
    return (
      normalized.includes('while true') ||
      normalized.includes('for (;;') ||
      normalized.includes('while( true') ||
      normalized.includes('while(true') ||
      normalized.includes('setinterval(')
    );
  }

  private simulateStdout(lang: ExecuteRequestDto['lang'], code: string, stdin?: string): string {
    const lines: string[] = [];

    if (stdin) {
      lines.push(`# 输入: ${stdin}`);
    }

    const printRegex = lang === 'javascript' ? /console\.log\(([^)]+)\)/g : /print\(([^)]+)\)/g;

    const stringLiteralRegex = /['"`]([^'"`]+)['"`]/;

    let match: RegExpExecArray | null;
    while ((match = printRegex.exec(code))) {
      const rawArg = match[1].trim();
      const literalMatch = rawArg.match(stringLiteralRegex);
      if (literalMatch) {
        lines.push(literalMatch[1]);
      } else if (rawArg === 'input()' && stdin) {
        lines.push(stdin);
      } else {
        lines.push(`[表达式] ${rawArg}`);
      }
    }

    // 如果没有输出，返回一个提示
    if (lines.length === 0) {
      lines.push('（程序执行完成，未产生输出）');
    }

    return lines.join('\n');
  }

  private simulateStderr(lang: ExecuteRequestDto['lang'], code: string): string {
    // 简单的一些语法错误检测（示例）
    if (lang === 'python' && code.includes('print ')) {
      return "SyntaxError: Missing parentheses in call to 'print'";
    }

    if (/^[^#]*TODO\b/m.test(code)) {
      return 'NotImplementedError: 请完成 TODO 部分后再运行。';
    }

    return '';
  }

  private simulateEventsAndMeta(code: string): {
    events: ExecutionEvent[];
    meta?: Record<string, unknown>;
  } {
    if (!code.includes('api.')) {
      return { events: [] };
    }

    const events: ExecutionEvent[] = [];
    const directionOrder: Array<'N' | 'E' | 'S' | 'W'> = ['N', 'E', 'S', 'W'];
    let directionIndex = 0;
    let position = { x: 0, y: 0 };
    let steps = 0;

    const callRegex = /api\.(move_forward|left|right|take_key|open_door)\s*\(([^)]*)\)?/g;
    let match: RegExpExecArray | null;

    while ((match = callRegex.exec(code))) {
      const [, method, args] = match;
      if (method === 'left') {
        directionIndex = (directionIndex + 3) % 4;
        events.push({
          type: 'maze_turn',
          dir: directionOrder[directionIndex],
        });
      } else if (method === 'right') {
        directionIndex = (directionIndex + 1) % 4;
        events.push({
          type: 'maze_turn',
          dir: directionOrder[directionIndex],
        });
      } else if (method === 'move_forward') {
        const count = Math.max(1, Number.parseInt(args || '1', 10) || 1);
        for (let i = 0; i < count; i += 1) {
          position = this.advancePosition(position, directionOrder[directionIndex]);
          events.push({
            type: 'maze_step',
            x: position.x,
            y: position.y,
          });
          steps += 1;
        }
      } else if (method === 'take_key') {
        events.push({
          type: 'tempo',
          bpm: 120,
        });
      } else if (method === 'open_door') {
        events.push({
          type: 'tempo',
          bpm: 140,
        });
      }
    }

    const meta = {
      steps,
      reached: steps > 0,
    };

    return { events, meta };
  }

  private advancePosition(
    pos: { x: number; y: number },
    dir: 'N' | 'E' | 'S' | 'W',
  ): { x: number; y: number } {
    switch (dir) {
      case 'N':
        return { x: pos.x, y: pos.y + 1 };
      case 'E':
        return { x: pos.x + 1, y: pos.y };
      case 'S':
        return { x: pos.x, y: pos.y - 1 };
      case 'W':
        return { x: pos.x - 1, y: pos.y };
      default:
        return pos;
    }
  }

  private simulateArtifacts(
    code: string,
    events: ExecutionEvent[],
  ): ExecutionArtifacts | undefined {
    if (code.includes('pixel(')) {
      return {
        pixelMatrix: {
          width: 5,
          height: 5,
          pixels: Array.from({ length: 5 }, () =>
            Array.from({ length: 5 }, () => Math.round(Math.random())),
          ),
        },
      };
    }

    if (events.some((event) => event.type === 'note')) {
      return {
        musicSeq: {
          tempo: 120,
          notes: [
            { pitch: 'C4', dur: 1, start: 0 },
            { pitch: 'E4', dur: 1, start: 1 },
            { pitch: 'G4', dur: 1, start: 2 },
          ],
        },
      };
    }

    return undefined;
  }
}
