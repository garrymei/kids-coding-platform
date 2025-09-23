import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async getHealth() {
    let database = 'up';
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
    } catch (_error) {
      database = 'down';
    }

    return {
      ok: database === 'up',
      timestamp: new Date().toISOString(),
      services: {
        database,
      },
    };
  }

  @Get('ready')
  async getReady() {
    await this.prisma.$queryRawUnsafe('SELECT 1');
    return { ok: true, timestamp: new Date().toISOString() };
  }
}
