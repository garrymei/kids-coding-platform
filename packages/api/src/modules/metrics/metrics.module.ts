import { Module } from '@nestjs/common';
import { MetricsController } from './controllers/metrics.controller';
import { MetricsService } from './services/metrics.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { VisibilityService } from '../auth/services/visibility.service';

@Module({
  imports: [PrismaModule],
  controllers: [MetricsController],
  providers: [MetricsService, VisibilityService],
  exports: [MetricsService],
})
export class MetricsModule {}
