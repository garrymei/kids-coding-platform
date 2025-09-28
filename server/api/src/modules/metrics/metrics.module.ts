import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { MetricsCacheService } from './cache/metrics-cache.service';
import { MetricsAuthService } from './auth/metrics-auth.service';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService, MetricsCacheService, MetricsAuthService],
  exports: [MetricsService, MetricsCacheService, MetricsAuthService],
})
export class MetricsModule {}
