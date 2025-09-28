// Import from the local event parsing functions
interface LEDEvent {
  type: 'on' | 'off';
  index: number;
  timestamp: number;
}

export interface LEDJudgeRequest {
  code: string;
  grader: {
    mode: 'event' | 'io';
    checks?: Array<{ type: string; expect?: string[] }>;
    io?: { cases: Array<{ out: string }> };
  };
  assets?: {
    gridWidth?: number;
    gridHeight?: number;
  };
}

export interface LEDJudgeResult {
  ok: boolean;
  message: string;
  details?: string;
  events?: LEDEvent[];
  finalState?: string;
  expectedEvents?: string[];
  actualEvents?: string[];
}

/**
 * 解析代码中的LED事件
 */
function parseLEDEvents(code: string): LEDEvent[] {
  const events: LEDEvent[] = [];
  let timestamp = 0;

  // 使用全局匹配来找到所有的 on{i} 和 off{i} 模式
  const onMatches = code.match(/on(\d+)/g);
  const offMatches = code.match(/off(\d+)/g);
  
  if (onMatches) {
    onMatches.forEach(match => {
      const index = parseInt(match.replace('on', ''));
      events.push({
        type: 'on',
        index,
        timestamp: timestamp++
      });
    });
  }
  
  if (offMatches) {
    offMatches.forEach(match => {
      const index = parseInt(match.replace('off', ''));
      events.push({
        type: 'off',
        index,
        timestamp: timestamp++
      });
    });
  }

  return events;
}

/**
 * 计算最终LED状态
 */
function calculateFinalState(events: LEDEvent[], width: number): string {
  const state = Array(width).fill('0');
  
  events.forEach(event => {
    if (event.index < width) {
      state[event.index] = event.type === 'on' ? '1' : '0';
    }
  });
  
  return state.join('');
}

/**
 * LED 判题策略
 * 支持事件序列判题和终局状态判题
 */
export function judgeLEDStrategy(request: LEDJudgeRequest): LEDJudgeResult {
  const { code, grader, assets } = request;
  const gridWidth = assets?.gridWidth || 8;

  try {
    const parsedEvents = parseLEDEvents(code);
    
    if (grader.mode === 'event') {
      // 事件序列判题
      const expectedEvents = grader.checks?.[0]?.expect || [];
      const actualEvents = parsedEvents.map(e => `on${e.index}`);
      
      const passed = JSON.stringify(actualEvents) === JSON.stringify(expectedEvents);
      
      return {
        ok: passed,
        message: passed ? '✅ 事件序列正确' : '❌ 事件序列不匹配',
        details: `期望: [${expectedEvents.join(', ')}]\n实际: [${actualEvents.join(', ')}]`,
        events: parsedEvents,
        expectedEvents,
        actualEvents
      };
    } else if (grader.mode === 'io') {
      // IO 输出判题（终局状态）
      const expectedOutput = grader.io?.cases?.[0]?.out?.trim() || '';
      const finalState = calculateFinalState(parsedEvents, gridWidth);
      
      const passed = finalState === expectedOutput;
      
      return {
        ok: passed,
        message: passed ? '✅ 终局状态正确' : '❌ 终局状态不匹配',
        details: `期望: ${expectedOutput}\n实际: ${finalState}`,
        events: parsedEvents,
        finalState,
        expectedEvents: [expectedOutput],
        actualEvents: [finalState]
      };
    }

    return {
      ok: false,
      message: '不支持的判题模式',
      expectedEvents: [],
      actualEvents: []
    };
  } catch (error) {
    return {
      ok: false,
      message: `❌ 解析出错: ${error instanceof Error ? error.message : String(error)}`,
      details: error instanceof Error ? error.stack : String(error)
    };
  }
}

/**
 * 事件序列精确匹配判题
 */
export function judgeEventSequence(
  expectedEvents: string[],
  actualEvents: string[]
): { ok: boolean; diffIndex?: number; message: string } {
  if (actualEvents.length !== expectedEvents.length) {
    return {
      ok: false,
      diffIndex: Math.min(actualEvents.length, expectedEvents.length),
      message: `事件数量不匹配: 期望 ${expectedEvents.length} 个，实际 ${actualEvents.length} 个`
    };
  }

  for (let i = 0; i < expectedEvents.length; i++) {
    if (actualEvents[i] !== expectedEvents[i]) {
      return {
        ok: false,
        diffIndex: i,
        message: `第 ${i + 1} 个事件不匹配: 期望 "${expectedEvents[i]}"，实际 "${actualEvents[i]}"`
      };
    }
  }

  return {
    ok: true,
    message: '✅ 事件序列完全匹配'
  };
}

/**
 * 终局状态判题
 */
export function judgeFinalState(
  expectedState: string,
  actualState: string
): { ok: boolean; message: string } {
  const passed = actualState === expectedState;
  
  return {
    ok: passed,
    message: passed ? 
      '✅ 终局状态正确' : 
      `❌ 终局状态不匹配: 期望 "${expectedState}"，实际 "${actualState}"`
  };
}
