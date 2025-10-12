import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JudgeService } from './judge.service';
import { JudgeRequestDto, JudgeResponseDto } from './dto/judge.dto';
import { RealMetricsService } from '../metrics/services/real-metrics.service';

@ApiTags('Judge')
@Controller('judge')
export class JudgeController {
  constructor(
    private readonly judgeService: JudgeService,
    private readonly metricsService: RealMetricsService,
  ) {}

  @Post()
  @ApiOperation({ summary: '通用判题接口' })
  @ApiResponse({
    status: 200,
    description: '判题结果',
    type: JudgeResponseDto,
  })
  async judge(@Body() request: JudgeRequestDto): Promise<JudgeResponseDto> {
    const result = await this.judgeService.judge(request);

    // 当提供了 studentId 且判题通过时，记录学习事件
    if (request.studentId && result.status === 'passed') {
      try {
        await this.metricsService.recordLearnEvent(
          request.studentId,
          request.levelId,
          true,
          result.timeMs,
        );
      } catch (err) {
        // 记录失败不影响判题返回
      }
    }

    return result;
  }
}
