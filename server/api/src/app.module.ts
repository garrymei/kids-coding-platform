import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ExecuteModule } from './modules/execute/execute.module';
import { JudgeModule } from './modules/judge/judge.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { LevelModule } from './modules/levels/level.module';
import { ProgressModule } from './modules/progress/progress.module';
import { ConsentModule } from './modules/consents/consent.module';
import { AuthModule } from './modules/auth/auth.module';
import { MetricsModule as PrometheusMetricsModule } from './metrics/metrics.module';
import { LoggerService } from './common/services/logger.service';
import { DatabaseDegradationMiddleware } from './middleware/db-degradation.middleware';
import { SecurityMiddleware } from './middleware/security.middleware';
import { ValidationMiddleware } from './middleware/validation.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { AuthMiddleware } from './middleware/auth.middleware';

@Module({
  imports: [ExecuteModule, JudgeModule, MetricsModule, AuditModule, HealthModule, LevelModule, ProgressModule, ConsentModule, AuthModule, PrometheusMetricsModule],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 安全头中间件 - 最先应用
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*');

    // 数据库降级中间件
    consumer
      .apply(DatabaseDegradationMiddleware)
      .forRoutes('*');

    // 输入验证中间件
    consumer
      .apply(ValidationMiddleware)
      .forRoutes('*');

    // 速率限制中间件
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes('*');

    // 认证中间件 - 应用到需要认证的路由
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'metrics', method: RequestMethod.GET },
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
        { path: 'levels', method: RequestMethod.GET },
        { path: 'levels/:id', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}