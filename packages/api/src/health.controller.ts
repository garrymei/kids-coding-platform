import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Logger } from 'nestjs-pino';

@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  @Get('health')
  async getHealth() {
    let database = 'down';
    let databaseLatency = 0;
    
    try {
      const start = Date.now();
      await this.prisma.$queryRawUnsafe('SELECT 1');
      databaseLatency = Date.now() - start;
      database = 'up';
    } catch (error) {
      this.logger.error('Database health check failed:', error);
    }

    // In a real implementation, we would also check Redis and sandbox status
    const redis = 'up'; // Placeholder
    const sandbox = 'up'; // Placeholder

    const healthResponse = {
      ok: database === 'up' && redis === 'up' && sandbox === 'up',
      deps: {
        db: database,
        redis: redis,
        sandbox: sandbox,
      },
      version: process.env.npm_package_version || '1.0.0',
      commit: process.env.GIT_COMMIT || 'unknown',
    };

    // Log the health check
    this.logger.log({
      msg: 'health_check',
      status: healthResponse.ok ? 'healthy' : 'unhealthy',
      deps: healthResponse.deps,
    });

    return healthResponse;
  }

  @Get('ready')
  async getReady() {
    await this.prisma.$queryRawUnsafe('SELECT 1');
    return { ok: true, timestamp: new Date().toISOString() };
  }
}