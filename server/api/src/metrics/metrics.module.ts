import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { PrometheusService } from './prometheus.service';
import { LoggerService } from '../common/services/logger.service';

@Module({
  controllers: [MetricsController],
  providers: [PrometheusService, LoggerService],
  exports: [PrometheusService],
})
export class MetricsModule {}
