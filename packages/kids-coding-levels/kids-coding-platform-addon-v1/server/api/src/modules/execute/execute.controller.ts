import { Body, Controller, Post } from '@nestjs/common';
import { ExecuteService } from './execute.service';

@Controller('execute')
export class ExecuteController {
  constructor(private readonly svc: ExecuteService) {}

  @Post()
  async run(@Body() body: any) {
    // body: { language, code, stdin?, mode? }
    // THIS IS A MOCK. Replace with sandbox.
    return this.svc.mockRun(body);
  }
}
