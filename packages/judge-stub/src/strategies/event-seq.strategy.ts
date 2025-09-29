import { JudgeStrategy, JudgeInput, JudgeResult } from './judge-strategy.interface';

export class EventSeqStrategy implements JudgeStrategy {
  name = 'event-seq';

  judge(input: JudgeInput): JudgeResult {
    const { expected, output, args = {} } = input;

    try {
      // 从事件中提取事件序列
      const actualEvents = this.extractEventSequence(output);
      const expectedEvents = this.normalizeExpectedEvents(expected);

      if (expectedEvents.length === 0) {
        return {
          passed: false,
          message: 'No expected events provided',
          details: 'Expected events array is empty or invalid',
        };
      }

      // 比较事件序列
      const comparison = this.compareEventSequences(expectedEvents, actualEvents);

      return {
        passed: comparison.passed,
        message: comparison.passed ? 'Event sequence matches expected' : 'Event sequence does not match expected',
        details: comparison.details,
        visualization: {
          expected: expectedEvents,
          actual: actualEvents,
          diffIndex: comparison.diffIndex,
        },
        metrics: {
          expectedCount: expectedEvents.length,
          actualCount: actualEvents.length,
          matched: comparison.matched,
          diffIndex: comparison.diffIndex || -1,
        },
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Event sequence comparison failed',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private extractEventSequence(output: JudgeInput['output']): string[] {
    const events: string[] = [];

    // 从事件数组中提取
    if (output.events) {
      for (const event of output.events) {
        events.push(this.eventToString(event));
      }
    }

    // 从stdout中解析
    if (output.stdout) {
      const lines = output.stdout.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          events.push(trimmed);
        }
      }
    }

    return events;
  }

  private eventToString(event: Record<string, any>): string {
    // 将事件对象转换为字符串表示
    switch (event.type) {
      case 'led':
        return `${event.on ? 'on' : 'off'}${event.idx}`;
      case 'maze_step':
        return `step ${event.x} ${event.y}`;
      case 'maze_turn':
        return `turn ${event.dir}`;
      case 'note':
        return `note ${event.track} ${event.pitch} ${event.dur}`;
      case 'pixel':
        return `pixel ${event.x} ${event.y} ${event.value}`;
      case 'tempo':
        return `tempo ${event.bpm}`;
      default:
        return JSON.stringify(event);
    }
  }

  private normalizeExpectedEvents(expected: unknown): string[] {
    if (Array.isArray(expected)) {
      return expected.map(e => String(e));
    }
    
    if (expected && typeof expected === 'object') {
      const obj = expected as Record<string, unknown>;
      if (Array.isArray(obj.events)) {
        return obj.events.map((e: unknown) => String(e));
      }
      if (Array.isArray(obj.expect)) {
        return obj.expect.map((e: unknown) => String(e));
      }
      if (Array.isArray(obj.sequence)) {
        return obj.sequence.map((e: unknown) => String(e));
      }
    }

    if (typeof expected === 'string') {
      return expected.split(/\r?\n/).filter(Boolean);
    }

    return [];
  }

  private compareEventSequences(expected: string[], actual: string[]): {
    passed: boolean;
    details?: string;
    diffIndex?: number;
    matched: number;
  } {
    if (actual.length !== expected.length) {
      return {
        passed: false,
        details: `Event count mismatch: expected ${expected.length}, got ${actual.length}`,
        diffIndex: Math.min(actual.length, expected.length),
        matched: 0,
      };
    }

    let matched = 0;
    for (let i = 0; i < expected.length; i++) {
      if (actual[i] === expected[i]) {
        matched++;
      } else {
        return {
          passed: false,
          details: `Event mismatch at index ${i}: expected "${expected[i]}", got "${actual[i]}"`,
          diffIndex: i,
          matched,
        };
      }
    }

    return {
      passed: true,
      matched,
    };
  }
}
