export class IOStrategy {
  name = 'io';
  judge(input) {
    const { expected, output } = input;
    try {
      const actual = output.stdout || '';
      // 处理多种期望格式
      if (expected && typeof expected === 'object' && Array.isArray(expected.cases)) {
        return this.judgeWithCases(expected, actual, null);
      }
      // 简单文本比较
      const expectedText = this.extractExpectedText(expected);
      const passed = actual.trim() === expectedText.trim();
      return {
        passed,
        message: passed ? 'Output matches expected text' : 'Output does not match expected text',
        details: passed ? undefined : `Expected: "${expectedText}"\nActual: "${actual}"`,
        visualization: {
          expected: expectedText,
          actual,
          diff: this.generateTextDiff(expectedText, actual),
        },
        metrics: {
          similarity: passed ? 1 : 0,
          length: actual.length,
        },
      };
    } catch (error) {
      return {
        passed: false,
        message: 'IO comparison failed',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }
  judgeWithCases(expected, actual) {
    const { cases, match = 'exact', tolerance = 0, pattern } = expected;
    const warnings = [];
    switch (match) {
      case 'exact': {
        const passed = cases.every((c) => actual === c.out);
        return {
          passed,
          message: passed ? 'All test cases passed' : 'Some test cases failed',
          details: passed
            ? undefined
            : `Failed ${cases.length - cases.filter((c) => actual === c.out).length} out of ${cases.length} test cases`,
          visualization: {
            cases: cases.map((c) => ({
              input: c.in,
              expected: c.out,
              actual,
              passed: actual === c.out,
            })),
          },
          metrics: {
            passed: cases.filter((c) => actual === c.out).length,
            total: cases.length,
            similarity: cases.filter((c) => actual === c.out).length / cases.length,
          },
        };
      }
      case 'tolerance': {
        // 数值容差比较
        const target = cases[cases.length - 1].out.trim();
        const got = actual.trim();
        const numTarget = Number(target);
        const numGot = Number(got);
        const passed =
          !Number.isNaN(numTarget) &&
          !Number.isNaN(numGot) &&
          Math.abs(numTarget - numGot) <= tolerance;
        if (Number.isNaN(numTarget) || Number.isNaN(numGot)) {
          warnings.push('Non-numeric values compared with tolerance mode');
        }
        return {
          passed,
          message: passed ? 'Numeric output within tolerance' : 'Numeric output exceeds tolerance',
          details: passed ? undefined : `Expected: ${target} (±${tolerance}), Got: ${got}`,
          visualization: {
            expected: target,
            actual: got,
            tolerance,
            difference: Math.abs(numTarget - numGot),
          },
          metrics: {
            expected: numTarget,
            actual: numGot,
            difference: Math.abs(numTarget - numGot),
            tolerance,
          },
          warnings: warnings.length > 0 ? warnings : undefined,
        };
      }
      case 'regex': {
        const re = new RegExp(pattern ?? '.*', 's');
        const passed = re.test(actual);
        return {
          passed,
          message: passed ? 'Output matches regex pattern' : 'Output does not match regex pattern',
          details: passed ? undefined : `Pattern: ${pattern}\nOutput: "${actual}"`,
          visualization: {
            pattern,
            actual,
            match: passed,
          },
          metrics: {
            patternLength: pattern?.length || 0,
            outputLength: actual.length,
          },
        };
      }
      default:
        return {
          passed: false,
          message: 'Unknown IO match mode',
          details: `Unsupported match mode: ${match}`,
        };
    }
  }
  extractExpectedText(expected) {
    if (Array.isArray(expected)) {
      return expected.map((item) => String(item)).join('\n');
    }
    if (expected && typeof expected === 'object') {
      if (typeof expected.stdout === 'string') return expected.stdout;
      if (Array.isArray(expected.stdout)) return expected.stdout.join('\n');
      if (typeof expected.expect === 'string') return expected.expect;
    }
    return typeof expected === 'string' ? expected : '';
  }
  generateTextDiff(expected, actual) {
    // 简单的文本差异生成
    const expectedLines = expected.split('\n');
    const actualLines = actual.split('\n');
    const maxLines = Math.max(expectedLines.length, actualLines.length);
    const diff = [];
    for (let i = 0; i < maxLines; i++) {
      const expectedLine = expectedLines[i] || '';
      const actualLine = actualLines[i] || '';
      if (expectedLine === actualLine) {
        diff.push({ type: 'equal', line: expectedLine });
      } else {
        diff.push({ type: 'removed', line: expectedLine }, { type: 'added', line: actualLine });
      }
    }
    return diff;
  }
}
