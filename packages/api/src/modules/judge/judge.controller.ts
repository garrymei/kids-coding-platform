import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JudgeService } from './judge.service';
import { JudgeRequestDto, JudgeResponseDto } from './dto/judge.dto';

@ApiTags('Judge')
@Controller('judge')
export class JudgeController {
  constructor(private readonly judgeService: JudgeService) {}

  @Post()
  @ApiOperation({ summary: '通用判题接口' })
  @ApiResponse({ 
    status: 200, 
    description: '判题结果',
    type: JudgeResponseDto
  })
  async judge(@Body() request: JudgeRequestDto): Promise<JudgeResponseDto> {
    return this.judgeService.judge(request);
  }
}
