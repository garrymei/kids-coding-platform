import { judgeIO, validateIOCases } from './io';

// Simple test function
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}:`, error);
  }
}

// Simple assertion function
function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected} but got ${actual}`);
      }
    },
    toContain(expected: string) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected ${actual} to contain ${expected}`);
      }
    }
  };
}

// Test cases for the judgeIO function
test('should pass when code output matches expected output', () => {
  const code = "print('Hello, Island!')";
  const input = '';
  const expectedOutput = 'Hello, Island!\n';
  
  const result = judgeIO(code, input, expectedOutput);
  
  expect(result.passed).toBe(true);
  expect(result.message).toBe('✅ 答案正确');
  expect(result.expectedOutput).toBe(expectedOutput);
  expect(result.actualOutput).toBe('Hello, Island!\n');
});

test('should fail when code output does not match expected output', () => {
  const code = "print('Hello, World!')";
  const input = '';
  const expectedOutput = 'Hello, Island!\n';
  
  const result = judgeIO(code, input, expectedOutput);
  
  expect(result.passed).toBe(false);
  expect(result.message).toBe('❌ 答案错误');
  expect(result.expectedOutput).toBe(expectedOutput);
  expect(result.actualOutput).toBe('Hello, World!\n');
});

test('should handle errors gracefully', () => {
  const code = "print('Hello, Island!'";
  const input = '';
  const expectedOutput = 'Hello, Island!\n';
  
  const result = judgeIO(code, input, expectedOutput);
  
  expect(result.passed).toBe(false);
  expect(result.message).toContain('❌ 执行出错');
});

// Test cases for the validateIOCases function
test('should validate multiple test cases', () => {
  const cases = [
    { in: '', out: 'Hello, Island!\n' },
    { in: '', out: 'Hello, World!\n' }
  ];
  const code = "print('Hello, Island!')";
  
  const results = validateIOCases(cases, code);
  
  expect(results.length).toBe(2);
  expect(results[0].passed).toBe(true);
  expect(results[1].passed).toBe(false);
});

console.log('All tests completed!');