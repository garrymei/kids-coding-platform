import { validateRequiredStructures, getMissingStructuresMessage } from './structure';

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

// Test cases for validateRequiredStructures
test('should validate function definitions', () => {
  const code = `
def move_robot():
    move()
    turn_left()

move_robot()
  `;
  
  const result = validateRequiredStructures(code, ['def']);
  expect(result).toBe(true);
});

test('should fail when missing function definitions', () => {
  const code = `
move()
turn_left()
  `;
  
  const result = validateRequiredStructures(code, ['def']);
  expect(result).toBe(false);
});

test('should validate loops', () => {
  const code = `
for i in range(5):
    move()

while condition:
    turn_left()
  `;
  
  const forResult = validateRequiredStructures(code, ['for']);
  expect(forResult).toBe(true);
  
  const whileResult = validateRequiredStructures(code, ['while']);
  expect(whileResult).toBe(true);
  
  const loopResult = validateRequiredStructures(code, ['loop']);
  expect(loopResult).toBe(true);
});

test('should validate conditionals', () => {
  const code = `
if condition:
    move()
else:
    turn_left()
  `;
  
  const result = validateRequiredStructures(code, ['if']);
  expect(result).toBe(true);
});

test('should validate multiple structures', () => {
  const code = `
def move_robot():
    for i in range(5):
        if condition:
            move()
        else:
            turn_left()

move_robot()
  `;
  
  const result = validateRequiredStructures(code, ['def', 'for', 'if']);
  expect(result).toBe(true);
});

// Test cases for getMissingStructuresMessage
test('should return empty message when all structures are present', () => {
  const code = `
def move_robot():
    move()

move_robot()
  `;
  
  const message = getMissingStructuresMessage(code, ['def']);
  expect(message).toBe('');
});

test('should return message when structures are missing', () => {
  const code = `
move()
turn_left()
  `;
  
  const message = getMissingStructuresMessage(code, ['def']);
  expect(message).toContain('函数定义');
});

test('should return message for multiple missing structures', () => {
  const code = `
move()
turn_left()
  `;
  
  const message = getMissingStructuresMessage(code, ['def', 'for']);
  expect(message).toContain('函数定义');
  expect(message).toContain('for循环');
});

console.log('All structure tests completed!');