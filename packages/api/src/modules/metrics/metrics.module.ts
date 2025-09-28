import { Module } from '@nestjs/common';
import { MetricsController } from './controllers/metrics.controller';
import { MetricsService } from './services/metrics.service';
import { RealMetricsController } from './controllers/real-metrics.controller';
import { RealMetricsService } from './services/real-metrics.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';
import { AuthModule } from '../auth/auth.module';
import { VisibilityService } from '../auth/services/visibility.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, CacheModule, AuthModule, AuditModule],
  controllers: [MetricsController, RealMetricsController],
  providers: [MetricsService, RealMetricsService, VisibilityService],
  exports: [MetricsService, RealMetricsService],
})
export class MetricsModule {}