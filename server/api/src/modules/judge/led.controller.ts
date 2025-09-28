import { Body, Controller, Post } from '@nestjs/common';
import { judgeLEDStrategy, LEDJudgeRequest, LEDJudgeResult } from './strategies/led.strategy';

@Controller('judge/led')
export class LEDJudgeController {
  
  @Post()
  async judgeLED(@Body() body: LEDJudgeRequest): Promise<LEDJudgeResult> {
    return judgeLEDStrategy(body);
  }

  @Post('event-sequence')
  async judgeEventSequence(@Body() body: {
    expectedEvents: string[];
    actualEvents: string[];
  }) {
    const { expectedEvents, actualEvents } = body;
    
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

  @Post('final-state')
  async judgeFinalState(@Body() body: {
    expectedState: string;
    actualState: string;
  }) {
    const { expectedState, actualState } = body;
    const passed = actualState === expectedState;
    
    return {
      ok: passed,
      message: passed ? 
        '✅ 终局状态正确' : 
        `❌ 终局状态不匹配: 期望 "${expectedState}"，实际 "${actualState}"`
    };
  }
}
