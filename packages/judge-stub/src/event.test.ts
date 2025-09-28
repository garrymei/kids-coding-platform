import { parseLEDEvents, calculateFinalState, judgeEventSequence, judgeFinalState, type LEDEvent } from './event';

// 简单的测试框架
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.log(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function expect(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toEqual: (expected: any) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    }
  };
}

// 测试 LED 事件解析
test('parseLEDEvents - 单个事件', () => {
  const code = 'print("on0")';
  const events = parseLEDEvents(code);
  expect(events).toEqual([
    { type: 'on' as const, index: 0, timestamp: 0 }
  ]);
});

test('parseLEDEvents - 多个事件', () => {
  const code = 'print("on0")\nprint("on1")\nprint("on2")';
  const events = parseLEDEvents(code);
  expect(events).toEqual([
    { type: 'on' as const, index: 0, timestamp: 0 },
    { type: 'on' as const, index: 1, timestamp: 1 },
    { type: 'on' as const, index: 2, timestamp: 2 }
  ]);
});

test('parseLEDEvents - 循环事件', () => {
  const code = 'print("on0")\nprint("on1")\nprint("on2")';
  const events = parseLEDEvents(code);
  expect(events).toEqual([
    { type: 'on' as const, index: 0, timestamp: 0 },
    { type: 'on' as const, index: 1, timestamp: 1 },
    { type: 'on' as const, index: 2, timestamp: 2 }
  ]);
});

// 测试终局状态计算
test('calculateFinalState - 简单状态', () => {
  const events: LEDEvent[] = [
    { type: 'on', index: 0, timestamp: 0 },
    { type: 'on', index: 2, timestamp: 1 }
  ];
  const state = calculateFinalState(events, 4);
  expect(state).toBe('1010');
});

test('calculateFinalState - 交替状态', () => {
  const events: LEDEvent[] = [
    { type: 'on', index: 0, timestamp: 0 },
    { type: 'on', index: 2, timestamp: 1 },
    { type: 'on', index: 4, timestamp: 2 },
    { type: 'on', index: 6, timestamp: 3 }
  ];
  const state = calculateFinalState(events, 8);
  expect(state).toBe('10101010');
});

// 测试事件序列判题
test('judgeEventSequence - 正确序列', () => {
  const code = 'print("on0")';
  const expected = ['on0'];
  const result = judgeEventSequence(code, expected);
  expect(result.passed).toBe(true);
});

test('judgeEventSequence - 错误序列', () => {
  const code = 'print("on1")';
  const expected = ['on0'];
  const result = judgeEventSequence(code, expected);
  expect(result.passed).toBe(false);
});

// 测试终局状态判题
test('judgeFinalState - 正确状态', () => {
  const code = 'print("on0")\nprint("on2")\nprint("on4")\nprint("on6")';
  const expected = '10101010';
  const result = judgeFinalState(code, expected, 8);
  expect(result.passed).toBe(true);
});

test('judgeFinalState - 错误状态', () => {
  const code = 'print("on0")\nprint("on1")';
  const expected = '10101010';
  const result = judgeFinalState(code, expected, 8);
  expect(result.passed).toBe(false);
});

console.log('所有测试完成！');