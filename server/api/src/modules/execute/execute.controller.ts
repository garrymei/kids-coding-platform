import { Body, Controller, Post } from '@nestjs/common';
import { ExecuteService } from './execute.service';
import { ExecuteRequestDto, ExecuteResponse } from './dto/execute-request.dto';

@Controller('execute')
export class ExecuteController {
  constructor(private readonly svc: ExecuteService) {}

  @Post()
  async run(@Body() body: ExecuteRequestDto): Promise<ExecuteResponse> {
    return this.svc.run(body);
  }
}
