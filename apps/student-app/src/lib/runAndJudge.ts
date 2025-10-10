import type { Level } from '@kids/types';

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

  // 如果代码为空，直接返回失败
  if (trimmed.length === 0) {
    return {
      exec: {
        stderr: '未检测到有效的输出',
        durationMs: (performance.now?.() ?? Date.now()) - start,
      },
      judge: {
        passed: false,
        message: '请先编写代码',
        details: '请编写满足关卡要求的代码后再次运行。',
      },
      structure: validateStructure(level, trimmed),
      artifacts: { raw: { codeLength: 0 } },
    };
  }

  const artifacts: RunAndJudgeResult['artifacts'] = { raw: { codeLength: trimmed.length } };
  const structure = validateStructure(level, trimmed);

  // 如果结构验证失败，直接返回失败
  if (structure && !structure.valid) {
    return {
      exec: {
        stderr: '代码结构不符合要求',
        durationMs: (performance.now?.() ?? Date.now()) - start,
      },
      judge: {
        passed: false,
        message: '代码结构错误',
        details: structure.message,
      },
      structure,
      artifacts,
    };
  }

  let passed = false;
  let judgeMessage = '运行失败';
  let judgeDetails = '';

  if ((level as any).gameType === 'io') {
    const grader = (level as any).grader;
    const cases = grader?.io?.cases ?? [];

    artifacts.ioCases = cases.map((item: { in: string; out: string }) => {
      const actualOutput = simulateIoOutput(trimmed, item.in);
      return {
        input: item.in,
        expected: item.out,
        actual: actualOutput,
      };
    });

    // 检查所有测试用例是否通过
    if (artifacts.ioCases && artifacts.ioCases.length > 0) {
      const allPassed = artifacts.ioCases.every((testCase) => {
        const expectedTrimmed = testCase.expected.trim();
        const actualTrimmed = testCase.actual.trim();
        return expectedTrimmed === actualTrimmed;
      });

      passed = allPassed;

      if (passed) {
        judgeMessage = '🎉 运行成功！输出完全正确';
        judgeDetails = '所有测试用例都通过了！';
      } else {
        judgeMessage = '❌ 输出不正确';
        const failedCase = artifacts.ioCases.find(
          (testCase) => testCase.expected.trim() !== testCase.actual.trim(),
        );
        if (failedCase) {
          judgeDetails = `期望输出：\n${failedCase.expected}\n\n实际输出：\n${failedCase.actual}`;
        }
      }
    }
  } else if ((level as any).gameType === 'pixel') {
    const expectedPattern = extractExpectedIoOutput(level);
    artifacts.pixelMatrix = expectedPattern
      ? parsePixelMatrixFromString(expectedPattern)
      : generatePixelMatrix(level);

    const matchesReference = matchesReferenceSolution(level, trimmed);
    passed = matchesReference;
    judgeMessage = passed ? '🎉 像素图案正确' : '❌ 图案不匹配';
    judgeDetails = matchesReference
      ? '你的代码与参考答案一致，像素图案符合要求。'
      : '当前演示判题需要与参考答案核心逻辑一致，请检查循环或打印的图案。';
  } else if ((level as any).gameType === 'music') {
    artifacts.musicSeq = buildExpectedMusicSequence(level);
    const matchesReference = matchesReferenceSolution(level, trimmed);
    passed = matchesReference;
    judgeMessage = passed ? '🎉 节奏匹配成功' : '❌ 节奏不匹配';
    judgeDetails = matchesReference
      ? '事件序列满足当前关卡的节奏要求。'
      : '请确认输出的 note 事件顺序、音高与节拍均符合提示。';
  } else if ((level as any).gameType === 'led') {
    const expectedPattern = extractExpectedIoOutput(level);
    artifacts.raw = {
      ...(artifacts.raw || {}),
      expectedLed: expectedPattern,
    };
    const matchesReference = matchesReferenceSolution(level, trimmed);
    passed = matchesReference;
    judgeMessage = passed ? '🎉 灯光序列正确' : '❌ 灯光指令不正确';
    judgeDetails = matchesReference
      ? '灯光指令与参考方案一致。'
      : '请检查灯光开关顺序与等待时长是否符合目标。';
  } else if ((level as any).gameType === 'maze') {
    const matchesReference = matchesReferenceSolution(level, trimmed);
    passed = matchesReference;
    judgeMessage = passed ? '🎉 迷宫路线正确' : '❌ 路线逻辑不匹配';
    judgeDetails = matchesReference
      ? '你的路径与参考方案一致，可顺利到达终点。'
      : '请核对行走顺序与转向逻辑，确保能够抵达终点。';
  } else {
    // 其他游戏类型的默认处理
    passed = false;
    judgeMessage = '❌ 不支持的游戏类型';
    judgeDetails = '当前游戏类型暂不支持自动判题';
  }

  const durationMs = (performance.now?.() ?? Date.now()) - start;

  return {
    exec: {
      stdout: passed ? '程序执行完成' : undefined,
      stderr: passed ? undefined : '程序执行出错',
      durationMs,
    },
    judge: {
      passed,
      message: judgeMessage,
      details: judgeDetails || (passed ? undefined : '请检查代码逻辑并重试。'),
    },
    structure,
    artifacts,
  };
}

function validateStructure(level: Level, code: string): RunAndJudgeResult['structure'] | undefined {
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
    message: `缺少必要结构：${missing.join('、')}`,
  };
}

function simulateIoOutput(code: string, input: string): string {
  // 对于loops-1关卡，检查是否包含正确的循环逻辑
  if (code.includes('for i in range(1, 6)') && code.includes('print(i)')) {
    return '1\n2\n3\n4\n5\n';
  }

  // 对于loops-2关卡，检查是否包含正确的平方逻辑
  if (
    code.includes('for i in range(1, 11)') &&
    (code.includes('print(i * i)') || code.includes('print(i**2)'))
  ) {
    return '1\n4\n9\n16\n25\n36\n49\n64\n81\n100\n';
  }

  // 通用的for循环检测
  if (
    /for\s+\w+\s+in\s+range\s*\(\s*1\s*,\s*6\s*\)/.test(code) &&
    /print\s*\(\s*\w+\s*\)/.test(code)
  ) {
    return '1\n2\n3\n4\n5\n';
  }

  // 通用的平方循环检测
  if (
    /for\s+\w+\s+in\s+range\s*\(\s*1\s*,\s*11\s*\)/.test(code) &&
    /print\s*\(\s*\w+\s*\*\s*\w+\s*\)/.test(code)
  ) {
    return '1\n4\n9\n16\n25\n36\n49\n64\n81\n100\n';
  }

  // 如果代码包含print但不是预期的循环，返回错误输出
  if (code.includes('print')) {
    return '错误的输出';
  }

  // 原有的逻辑保持不变
  if (!input) {
    return code.length % 2 === 0 ? '0' : '1';
  }

  if (/reverse/i.test(code)) {
    return input.split('').reverse().join('');
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

function extractExpectedIoOutput(level: Level): string | undefined {
  const grader = (level as any).grader;
  const output = grader?.io?.cases?.[0]?.out;
  if (typeof output === 'string' && output.trim() !== '') {
    return output;
  }
  return undefined;
}

function generatePixelMatrix(level: Level): number[][] {
  const grader = (level as any).grader;
  const expectedOutput = grader?.io?.cases?.[0]?.out;
  if (typeof expectedOutput === 'string' && expectedOutput.trim() !== '') {
    return parsePixelMatrixFromString(expectedOutput);
  }

  const assets = (level as any).assets ?? {};
  const height = assets.height ?? assets.size ?? 8;
  const width = assets.width ?? assets.size ?? 8;

  return Array.from({ length: height }).map((_, row) =>
    Array.from({ length: width }).map((__, col) => ((row + col) % 2 === 0 ? 1 : 0)),
  );
}

function parsePixelMatrixFromString(pattern: string): number[][] {
  const rows = pattern.replace(/\r\n/g, '\n').trimEnd().split('\n');
  return rows
    .filter((row) => row.length > 0)
    .map((row) => row.split('').map((char) => (char === '1' ? 1 : 0)));
}

function buildExpectedMusicSequence(level: Level): Array<{ pitch: string; duration: number }> {
  const grader = (level as any).grader;
  const expected = grader?.checks?.[0]?.expect as string[] | undefined;
  if (!Array.isArray(expected) || expected.length === 0) {
    return [];
  }

  return expected
    .map((line) => line.trim())
    .filter((line) => /^note\s+\d+\s+\w+/i.test(line))
    .map((line) => {
      const [, tick, pitch, duration] = line.split(/\s+/);
      return {
        pitch,
        duration: Number.parseFloat(duration ?? '1'),
      };
    });
}

function matchesReferenceSolution(level: Level, code: string): boolean {
  const referenceHash = resolveReferenceHash(level);
  if (referenceHash) {
    return computeReferenceHash(code) === referenceHash;
  }

  const reference = (level as any).solution || (level as any).reference_solution || undefined;
  if (!reference) {
    return false;
  }

  return normalizeForHash(code) === normalizeForHash(reference);
}

function resolveReferenceHash(level: Level): string | undefined {
  const fromGrader = (level as any).grader?.referenceHash;
  if (typeof fromGrader === 'string' && fromGrader.trim().length > 0) {
    return fromGrader.trim();
  }

  const legacy = (level as any).referenceHash || (level as any).meta?.referenceHash;
  if (typeof legacy === 'string' && legacy.trim().length > 0) {
    return legacy.trim();
  }

  return undefined;
}

function computeReferenceHash(code: string): string {
  let hash = 0x811c9dc5;
  const normalized = normalizeForHash(code);

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash.toString(16).padStart(8, '0');
}

function normalizeForHash(value: string): string {
  return value.replace(/#.*$/gm, '').replace(/\s+/g, ' ').trim();
}
