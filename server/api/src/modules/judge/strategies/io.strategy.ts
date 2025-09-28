type IOCase = { in: string; out: string };
type IOMode = 'exact' | 'tolerance' | 'regex';

export function judgeIO(expected: {
  cases: IOCase[];
  match: IOMode;
  tolerance?: number;
  pattern?: string; // 当 match=regex
}, actual: { stdout: string }) {
  const { cases, match, tolerance = 0, pattern } = expected;
  const out = actual.stdout ?? '';

  switch (match) {
    case 'exact': {
      const ok = cases.every(c => out === c.out);
      return { ok, mismatches: ok ? 0 : 1 };
    }
    case 'tolerance': {
      // 简化：仅比较最后一个用例；生产中应循环对比所有用例
      const target = cases[cases.length - 1].out.trim();
      const got = out.trim();
      const numTarget = Number(target);
      const numGot = Number(got);
      const ok =
        !Number.isNaN(numTarget) &&
        !Number.isNaN(numGot) &&
        Math.abs(numTarget - numGot) <= tolerance;
      return { ok, mismatches: ok ? 0 : 1 };
    }
    case 'regex': {
      const re = new RegExp(pattern ?? '.*', 's');
      const ok = re.test(out);
      return { ok, mismatches: ok ? 0 : 1 };
    }
    default:
      return { ok: false, mismatches: 1 };
  }
}