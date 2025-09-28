import { Body, Controller, Post } from '@nestjs/common';
import { ExecuteService } from './execute.service';
import { ExecuteRequestDto, ExecuteResponse } from './dto/execute-request.dto';
import { RunAndJudgeRequestDto, RunAndJudgeResponseDto } from './dto/run-and-judge-request.dto';

@Controller('execute')
export class ExecuteController {
  constructor(private readonly svc: ExecuteService) {}

  @Post()
  async run(@Body() body: ExecuteRequestDto): Promise<ExecuteResponse> {
    return this.svc.run(body);
  }

  @Post('run-and-judge')
  async runAndJudge(@Body() body: RunAndJudgeRequestDto): Promise<RunAndJudgeResponseDto> {
    return this.svc.runAndJudge(body);
  }
}
