import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { LoggerService } from '../../common/services/logger.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService, LoggerService],
  exports: [HealthService],
})
export class HealthModule {}
