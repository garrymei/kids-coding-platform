import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { LoggerService } from '../../common/services/logger.service';

@Module({
  controllers: [ProgressController],
  providers: [ProgressService, LoggerService],
  exports: [ProgressService],
})
export class ProgressModule {}
