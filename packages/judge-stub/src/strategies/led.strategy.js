export class LEDStrategy {
  name = 'led';
  judge(input) {
    const { expected, output, args = {} } = input;
    try {
      // 从事件中提取LED事件
      const ledEvents = this.extractLEDEvents(output);
      if (ledEvents.length === 0) {
        return {
          passed: false,
          message: 'No LED events found in execution output',
          details: 'Expected LED events (on/off commands) in output',
        };
      }
      // 根据期望格式进行判题
      if (expected && typeof expected === 'object') {
        if (expected.mode === 'event') {
          return this.judgeEventSequence(expected, ledEvents);
        } else if (expected.mode === 'io') {
          return this.judgeFinalState(expected, ledEvents, args);
        }
      }
      // 默认事件序列比较
      return this.judgeEventSequence(expected, ledEvents);
    } catch (error) {
      return {
        passed: false,
        message: 'LED comparison failed',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }
  extractLEDEvents(output) {
    const events = [];
    let timestamp = 0;
    // 从事件数组中提取
    if (output.events) {
      for (const event of output.events) {
        if (event.type === 'led') {
          events.push({
            type: event.on ? 'on' : 'off',
            index: event.idx,
            timestamp: timestamp++,
          });
        }
      }
    }
    // 从stdout中解析
    if (output.stdout) {
      const lines = output.stdout.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        const onMatch = trimmed.match(/^on\s*(\d+)$/i);
        const offMatch = trimmed.match(/^off\s*(\d+)$/i);
        if (onMatch) {
          events.push({
            type: 'on',
            index: parseInt(onMatch[1]),
            timestamp: timestamp++,
          });
        } else if (offMatch) {
          events.push({
            type: 'off',
            index: parseInt(offMatch[1]),
            timestamp: timestamp++,
          });
        }
      }
    }
    return events;
  }
  judgeEventSequence(expected, actualEvents) {
    const expectedEvents = this.normalizeExpectedEvents(expected);
    const actualEventStrings = actualEvents.map((e) => `${e.type}${e.index}`);
    const passed = JSON.stringify(actualEventStrings) === JSON.stringify(expectedEvents);
    return {
      passed,
      message: passed
        ? 'LED event sequence matches expected'
        : 'LED event sequence does not match expected',
      details: passed
        ? undefined
        : `Expected: [${expectedEvents.join(', ')}]\nActual: [${actualEventStrings.join(', ')}]`,
      visualization: {
        expected: expectedEvents,
        actual: actualEventStrings,
        events: actualEvents,
      },
      metrics: {
        expectedCount: expectedEvents.length,
        actualCount: actualEventStrings.length,
        matched: actualEventStrings.filter((event, index) => event === expectedEvents[index])
          .length,
      },
    };
  }
  judgeFinalState(expected, actualEvents, args) {
    const gridWidth = args.gridWidth || expected.gridWidth || 8;
    const expectedState = this.extractExpectedState(expected);
    const actualState = this.calculateFinalState(actualEvents, gridWidth);
    const passed = actualState === expectedState;
    return {
      passed,
      message: passed
        ? 'LED final state matches expected'
        : 'LED final state does not match expected',
      details: passed ? undefined : `Expected: ${expectedState}\nActual: ${actualState}`,
      visualization: {
        expected: expectedState,
        actual: actualState,
        events: actualEvents,
        gridWidth,
      },
      metrics: {
        gridWidth: gridWidth,
        eventCount: actualEvents.length,
      },
    };
  }
  normalizeExpectedEvents(expected) {
    if (Array.isArray(expected)) {
      return expected.map((e) => String(e));
    }
    if (expected && typeof expected === 'object') {
      if (Array.isArray(expected.events)) {
        return expected.events.map((e) => String(e));
      }
      if (Array.isArray(expected.checks)) {
        return expected.checks[0]?.expect || [];
      }
    }
    return [];
  }
  extractExpectedState(expected) {
    if (typeof expected === 'string') {
      return expected;
    }
    if (expected && typeof expected === 'object') {
      if (expected.io?.cases?.[0]?.out) {
        return expected.io.cases[0].out.trim();
      }
      if (expected.finalState) {
        return expected.finalState;
      }
    }
    return '';
  }
  calculateFinalState(events, width) {
    const state = Array(width).fill('0');
    events.forEach((event) => {
      if (event.index < width) {
        state[event.index] = event.type === 'on' ? '1' : '0';
      }
    });
    return state.join('');
  }
}
