import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JudgeService } from './judge.service';
import { LEDJudgeRequestDto, LEDJudgeResponseDto } from './dto/judge.dto';

@ApiTags('LED Judge')
@Controller('judge/led')
export class LEDController {
  constructor(private readonly judgeService: JudgeService) {}

  @Post()
  @ApiOperation({ summary: 'LED 判题接口' })
  @ApiResponse({ 
    status: 200, 
    description: 'LED 判题结果',
    type: LEDJudgeResponseDto
  })
  async judgeLED(@Body() request: LEDJudgeRequestDto): Promise<LEDJudgeResponseDto> {
    // 转换为通用判题请求
    const judgeRequest = {
      levelId: request.levelId,
      code: request.code,
      sessionId: request.sessionId
    };
    
    const result = await this.judgeService.judge(judgeRequest);
    
    // 转换为 LED 判题响应
    return {
      levelId: result.levelId,
      message: result.message,
      details: result.details,
      events: result.events,
      finalState: result.finalState,
      timeMs: result.timeMs,
      status: result.status
    };
  }
}
