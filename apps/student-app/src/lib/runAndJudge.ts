import type { Level } from "@kids/types";

export interface RunAndJudgeOptions {
  level: Level;
  code: string;
}

export interface RunAndJudgeResult {
  exec: {
    stdout?: string;
    stderr?: string;
    durationMs: number;
  };
  judge: {
    passed: boolean;
    message: string;
    details?: string;
  };
  structure?: {
    valid: boolean;
    message?: string;
  };
  artifacts: {
    raw?: Record<string, unknown>;
    ioCases?: Array<{ input: string; expected: string; actual: string }>;
    pixelMatrix?: number[][];
    musicSeq?: Array<{ pitch: string; duration: number }>;
  };
}

export async function runAndJudge({ level, code }: RunAndJudgeOptions): Promise<RunAndJudgeResult> {
  const start = performance.now?.() ?? Date.now();

  await new Promise((resolve) => setTimeout(resolve, 250));

  const trimmed = code.trim();
  const passed = trimmed.length > 0;
  const judgeMessage = passed ? "运行成功" : "请先编写代码";
  const artifacts: RunAndJudgeResult["artifacts"] = { raw: { codeLength: trimmed.length } };
  const structure = validateStructure(level, trimmed);

  if ((level as any).gameType === "io") {
    const grader = (level as any).grader;
    const cases = grader?.io?.cases ?? [];
    artifacts.ioCases = cases.map((item: { in: string; out: string }) => {
      const fakeOutput = simulateIoOutput(trimmed, item.in);
      return {
        input: item.in,
        expected: item.out,
        actual: fakeOutput,
      };
    });
  }

  if ((level as any).gameType === "pixel") {
    artifacts.pixelMatrix = generatePixelMatrix(level);
  }

  if ((level as any).gameType === "music") {
    artifacts.musicSeq = generateMusicSequence(level);
  }

  const durationMs = (performance.now?.() ?? Date.now()) - start;

  return {
    exec: {
      stdout: passed ? "程序执行完成" : undefined,
      stderr: passed ? undefined : "未检测到有效的输出",
      durationMs,
    },
    judge: {
      passed,
      message: judgeMessage,
      details: passed ? undefined : "请编写满足关卡要求的代码后再次运行。",
    },
    structure,
    artifacts,
  };
}

function validateStructure(level: Level, code: string): RunAndJudgeResult["structure"] | undefined {
  const constraints = (level as any).grader?.constraints;
  const required = Array.isArray(constraints?.requireStructures)
    ? (constraints.requireStructures as string[])
    : undefined;

  if (!required || required.length === 0) {
    return undefined;
  }

  const missing = required.filter((token: string) => !code.includes(token));

  if (missing.length === 0) {
    return { valid: true };
  }

  return {
    valid: false,
    message: `缺少必要结构：${missing.join("、")}`,
  };
}

function simulateIoOutput(code: string, input: string): string {
  if (!input) {
    return code.length % 2 === 0 ? "0" : "1";
  }

  if (/reverse/i.test(code)) {
    return input.split("").reverse().join("");
  }

  if (/upper/i.test(code) || /uppercase/i.test(code)) {
    return input.toUpperCase();
  }

  const sum = input
    .split(/\s+/)
    .map((value) => Number.parseFloat(value))
    .filter((value) => Number.isFinite(value))
    .reduce((acc, value) => acc + value, 0);

  if (!Number.isNaN(sum) && sum !== 0) {
    return String(sum);
  }

  return `${input} processed`;
}

function generatePixelMatrix(level: Level): number[][] {
  const visualization = (level as any).visualization ?? {};
  const pixelInfo = visualization.pixel ?? {};
  const size = pixelInfo.height ?? 8;
  const width = pixelInfo.width ?? 8;

  return Array.from({ length: size }).map((_, row) =>
    Array.from({ length: width }).map((__, col) => ((row + col) % 2 === 0 ? 255 : 64)),
  );
}

function generateMusicSequence(level: Level): Array<{ pitch: string; duration: number }> {
  const visualization = (level as any).visualization ?? {};
  const musicInfo = visualization.music ?? {};
  const baseTempo = musicInfo.tempo ?? 120;
  const pitches = ["C", "D", "E", "G", "A"];

  return pitches.map((pitch, index) => ({
    pitch: `${pitch}${4 + (index % 2)}`,
    duration: Number((60 / baseTempo) * (index % 3 === 0 ? 1 : 0.5)),
  }));
}
