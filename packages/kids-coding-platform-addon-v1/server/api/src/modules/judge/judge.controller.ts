import { Body, Controller, Post } from '@nestjs/common';
import { JudgeService } from './judge.service';
import { JudgeRequest } from '../../common/dto/judge.dto';

@Controller('judge')
export class JudgeController {
  constructor(private readonly svc: JudgeService) {}

  @Post()
  async judge(@Body() req: JudgeRequest) {
    return this.svc.judge(req);
  }
}
