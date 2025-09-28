import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { RealMetricsService } from '../metrics/services/real-metrics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheModule } from '../cache/cache.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CacheModule, AuthModule],
  controllers: [ProgressController],
  providers: [RealMetricsService, PrismaService],
  exports: [RealMetricsService],
})
export class ProgressModule {}
