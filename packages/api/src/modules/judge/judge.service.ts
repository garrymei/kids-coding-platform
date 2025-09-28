import { Injectable } from '@nestjs/common';
import { JudgeRequestDto, JudgeResponseDto } from './dto/judge.dto';

@Injectable()
export class JudgeService {
  /**
   * 通用判题服务
   * 根据关卡类型分发到对应的判题器
   */
  async judge(request: JudgeRequestDto): Promise<JudgeResponseDto> {
    const startTime = Date.now();
    
    try {
      // 这里可以根据 levelId 解析出游戏类型
      // 暂时使用简单的字符串匹配
      let result: JudgeResponseDto;
      
      if (request.levelId.includes('led')) {
        result = await this.judgeLED(request);
      } else if (request.levelId.includes('io')) {
        result = await this.judgeIO(request);
      } else {
        throw new Error(`不支持的关卡类型: ${request.levelId}`);
      }
      
      result.timeMs = Date.now() - startTime;
      return result;
    } catch (error) {
      return {
        levelId: request.levelId,
        message: `判题出错: ${error instanceof Error ? error.message : String(error)}`,
        timeMs: Date.now() - startTime,
        status: 'error'
      };
    }
  }

  /**
   * IO 判题
   */
  private async judgeIO(request: JudgeRequestDto): Promise<JudgeResponseDto> {
    // 这里应该调用真正的 Python 执行器
    // 暂时使用模拟实现
    const mockOutput = this.simulatePythonExecution(request.code, request.input);
    
    // 根据关卡 ID 返回预设的期望输出
    const expectedOutput = this.getExpectedOutput(request.levelId);
    const passed = mockOutput === expectedOutput;
    
    return {
      levelId: request.levelId,
      message: passed ? '🎉 恭喜通关！' : '❌ 答案不正确',
      details: `输入: ${request.input || '(无输入)'}\n期望输出: ${expectedOutput}\n实际输出: ${mockOutput}`,
      timeMs: 0, // 会在上层设置
      status: passed ? 'passed' : 'failed'
    };
  }

  /**
   * LED 判题
   */
  private async judgeLED(request: JudgeRequestDto): Promise<JudgeResponseDto> {
    // 解析 LED 事件
    const events = this.parseLEDEvents(request.code);
    
    // 根据关卡 ID 进行不同的判题
    if (request.levelId === 'py-led-001') {
      // 事件序列判题
      const expectedEvents = ['on0'];
      const actualEvents = events.map(e => `on${e.index}`);
      const passed = JSON.stringify(actualEvents) === JSON.stringify(expectedEvents);
      
      return {
        levelId: request.levelId,
        message: passed ? '🎉 事件序列正确！' : '❌ 事件序列不匹配',
        details: `期望: [${expectedEvents.join(', ')}]\n实际: [${actualEvents.join(', ')}]`,
        events,
        timeMs: 0,
        status: passed ? 'passed' : 'failed'
      };
    } else if (request.levelId === 'py-led-011') {
      // 事件序列判题
      const expectedEvents = ['on0', 'on1', 'on2', 'on3', 'on4'];
      const actualEvents = events.map(e => `on${e.index}`);
      const passed = JSON.stringify(actualEvents) === JSON.stringify(expectedEvents);
      
      return {
        levelId: request.levelId,
        message: passed ? '🎉 事件序列正确！' : '❌ 事件序列不匹配',
        details: `期望: [${expectedEvents.join(', ')}]\n实际: [${actualEvents.join(', ')}]`,
        events,
        timeMs: 0,
        status: passed ? 'passed' : 'failed'
      };
    } else if (request.levelId === 'py-led-021') {
      // 终局状态判题
      const finalState = this.calculateFinalState(events, 8);
      const expectedState = '10101010';
      const passed = finalState === expectedState;
      
      return {
        levelId: request.levelId,
        message: passed ? '🎉 终局状态正确！' : '❌ 终局状态不匹配',
        details: `期望: ${expectedState}\n实际: ${finalState}`,
        events,
        finalState,
        timeMs: 0,
        status: passed ? 'passed' : 'failed'
      };
    }
    
    throw new Error(`不支持的 LED 关卡: ${request.levelId}`);
  }

  /**
   * 解析代码中的 LED 事件
   */
  private parseLEDEvents(code: string): Array<{ type: 'on' | 'off'; index: number; timestamp: number }> {
    const events: Array<{ type: 'on' | 'off'; index: number; timestamp: number }> = [];
    const lines = code.split('\n');
    let timestamp = 0;

    lines.forEach((line) => {
      // 匹配 on{i} 或 off{i} 模式
      const onMatches = line.match(/on(\d+)/g);
      const offMatches = line.match(/off(\d+)/g);
      
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
    });

    return events;
  }

  /**
   * 计算最终 LED 状态
   */
  private calculateFinalState(events: Array<{ type: 'on' | 'off'; index: number; timestamp: number }>, width: number): string {
    const state = Array(width).fill('0');
    
    events.forEach(event => {
      if (event.index < width) {
        state[event.index] = event.type === 'on' ? '1' : '0';
      }
    });
    
    return state.join('');
  }

  /**
   * 模拟 Python 代码执行
   */
  private simulatePythonExecution(code: string, _input?: string): string {
    // 简单的模拟实现
    if (code.includes("Hello, Island!")) {
      return "Hello, Island!\n";
    } else if (code.includes("print")) {
      const printMatch = code.match(/print\(['"](.+?)['"]\)/);
      if (printMatch) {
        return printMatch[1] + "\n";
      }
    }
    
    return code.trim() + "\n";
  }

  /**
   * 获取期望输出
   */
  private getExpectedOutput(levelId: string): string {
    const expectedOutputs: Record<string, string> = {
      'py-io-001': "Hello, Island!\n",
      'py-io-002': "echo\n",
      'py-io-011': "Hello, World!\n",
      'py-io-021': "42\n",
      'py-io-031': "Success!\n"
    };
    
    return expectedOutputs[levelId] || "Expected output\n";
  }
}
