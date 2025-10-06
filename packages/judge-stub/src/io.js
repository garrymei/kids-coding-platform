/**
 * 本地IO判题函数 - 模拟代码执行并验证输出
 * @param code 用户编写的代码
 * @param input 输入数据
 * @param expectedOutput 期望输出
 * @returns 判题结果
 */
export function judgeIO(code, input, expectedOutput) {
  try {
    // 这是一个简化的模拟执行器
    // 在实际应用中，这里会调用真正的Python执行器
    let actualOutput = '';
    // 简单的模拟逻辑
    if (code.includes('print')) {
      // 提取print语句中的内容
      const printMatch = code.match(/print\(['"](.+?)['"]\)/);
      if (printMatch) {
        actualOutput = printMatch[1] + '\n';
      } else {
        // 如果没有匹配到具体字符串，返回代码中的其他内容
        actualOutput = code.trim() + '\n';
      }
    } else {
      // 如果没有print语句，返回代码本身
      actualOutput = code.trim() + '\n';
    }
    // 比较输出
    const passed = actualOutput === expectedOutput;
    return {
      passed,
      message: passed ? '✅ 答案正确' : '❌ 答案错误',
      expectedOutput,
      actualOutput,
    };
  } catch (error) {
    return {
      passed: false,
      message: `❌ 执行出错: ${error instanceof Error ? error.message : String(error)}`,
      expectedOutput,
      actualOutput: '',
    };
  }
}
/**
 * 验证IO测试用例
 * @param cases 测试用例数组
 * @param code 用户代码
 * @returns 判题结果数组
 */
export function validateIOCases(cases, code) {
  return cases.map((testCase) => {
    return judgeIO(code, testCase.in, testCase.out);
  });
}
