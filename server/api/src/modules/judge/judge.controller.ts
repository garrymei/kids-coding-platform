import { Body, Controller, Post } from '@nestjs/common';
import { JudgeService } from './judge.service';
import { JudgeRequestDto } from './dto/judge-request.dto';

@Controller('judge')
export class JudgeController {
  constructor(private readonly svc: JudgeService) {}

  @Post()
  async judge(@Body() body: JudgeRequestDto) {
    return this.svc.judge(body);
  }
}