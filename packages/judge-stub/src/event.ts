export interface LEDEvent {
  type: 'on' | 'off';
  index: number;
  timestamp: number;
}

export interface EventJudgeResult {
  passed: boolean;
  message: string;
  expectedEvents?: string[];
  actualEvents?: string[];
  finalState?: string;
}

/**
 * 解析代码中的LED事件
 * @param code 用户编写的代码
 * @returns LED事件数组
 */
export function parseLEDEvents(code: string): LEDEvent[] {
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
 * @param events LED事件数组
 * @param width LED网格宽度
 * @returns 最终状态字符串（如 "10101010"）
 */
export function calculateFinalState(events: LEDEvent[], width: number): string {
  const state = Array(width).fill('0');
  
  events.forEach(event => {
    if (event.index < width) {
      state[event.index] = event.type === 'on' ? '1' : '0';
    }
  });
  
  return state.join('');
}

/**
 * 事件序列判题
 * @param code 用户代码
 * @param expectedEvents 期望的事件序列
 * @returns 判题结果
 */
export function judgeEventSequence(
  code: string, 
  expectedEvents: string[]
): EventJudgeResult {
  try {
    const parsedEvents = parseLEDEvents(code);
    const actualEvents = parsedEvents.map(e => `on${e.index}`);
    
    const passed = JSON.stringify(actualEvents) === JSON.stringify(expectedEvents);
    
    return {
      passed,
      message: passed ? '✅ 事件序列正确' : '❌ 事件序列不匹配',
      expectedEvents,
      actualEvents
    };
  } catch (error) {
    return {
      passed: false,
      message: `❌ 解析出错: ${error instanceof Error ? error.message : String(error)}`,
      expectedEvents,
      actualEvents: []
    };
  }
}

/**
 * 终局状态判题
 * @param code 用户代码
 * @param expectedState 期望的终局状态
 * @param width LED网格宽度
 * @returns 判题结果
 */
export function judgeFinalState(
  code: string,
  expectedState: string,
  width: number
): EventJudgeResult {
  try {
    const parsedEvents = parseLEDEvents(code);
    const finalState = calculateFinalState(parsedEvents, width);
    
    const passed = finalState === expectedState;
    
    return {
      passed,
      message: passed ? '✅ 终局状态正确' : '❌ 终局状态不匹配',
      finalState,
      expectedEvents: [expectedState]
    };
  } catch (error) {
    return {
      passed: false,
      message: `❌ 解析出错: ${error instanceof Error ? error.message : String(error)}`,
      finalState: '',
      expectedEvents: [expectedState]
    };
  }
}

/**
 * 通用LED判题函数
 * @param code 用户代码
 * @param grader 判题配置
 * @returns 判题结果
 */
export function judgeLED(
  code: string,
  grader: {
    mode: 'event' | 'io';
    checks?: Array<{ type: string; expect?: string[] }>;
    io?: { cases: Array<{ out: string }> };
  },
  gridWidth: number = 8
): EventJudgeResult {
  if (grader.mode === 'event') {
    // 事件序列判题
    const expectedEvents = grader.checks?.[0]?.expect || [];
    return judgeEventSequence(code, expectedEvents);
  } else if (grader.mode === 'io') {
    // IO 输出判题（终局状态）
    const expectedOutput = grader.io?.cases?.[0]?.out?.trim() || '';
    return judgeFinalState(code, expectedOutput, gridWidth);
  }

  return {
    passed: false,
    message: '不支持的判题模式',
    expectedEvents: [],
    actualEvents: []
  };
}
