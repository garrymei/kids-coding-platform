import { Body, Controller, Post } from '@nestjs/common';
import { ExecuteService } from './execute.service';
import { ExecuteRequestDto } from './dto/execute-request.dto';

@Controller('execute')
export class ExecuteController {
  constructor(private readonly svc: ExecuteService) {}

  @Post()
  async run(@Body() body: ExecuteRequestDto) {
    return this.svc.execute(body);
  }
}
