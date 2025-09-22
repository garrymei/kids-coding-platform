import { Controller, Get } from '@nestjs/common';

@Controller('healthz')
export class HealthController {
  @Get()
  getHealth() {
    return { ok: true, ts: Date.now() };
  }
}
