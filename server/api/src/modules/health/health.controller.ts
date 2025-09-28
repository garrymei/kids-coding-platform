import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { getDatabaseManager } from '../../config/db';
import { LoggerService } from '../../common/services/logger.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly logger: LoggerService
  ) {}

  @Get()
  async getHealth() {
    const dbManager = getDatabaseManager(this.logger);
    const dbStatus = dbManager.getStatus();
    const dbHealthy = await dbManager.isHealthy();

    // 检查Redis连接（如果有的话）
    const redisHealthy = await this.healthService.checkRedis();

    const health = {
      ok: dbHealthy && redisHealthy,
      deps: {
        db: dbHealthy ? 'up' : 'down',
        redis: redisHealthy ? 'up' : 'down',
      },
      version: process.env.APP_VERSION || '1.0.0',
      commit: process.env.GIT_COMMIT || 'unknown',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    // 如果数据库不可用，记录警告
    if (!dbHealthy) {
      this.logger.warn('Health check: Database unavailable', {
        dbStatus: dbStatus.lastError,
        retryCount: dbStatus.retryCount,
      });
    }

    return health;
  }

  @Get('ready')
  async getReadiness() {
    const dbManager = getDatabaseManager(this.logger);
    const dbHealthy = await dbManager.isHealthy();
    const redisHealthy = await this.healthService.checkRedis();

    // 就绪检查：所有关键依赖都必须可用
    const ready = dbHealthy && redisHealthy;

    return {
      ready,
      checks: {
        database: dbHealthy,
        redis: redisHealthy,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  async getLiveness() {
    // 存活检查：只要进程还在运行就返回成功
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
