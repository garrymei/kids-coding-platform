import { Module } from '@nestjs/common';
import { LevelController } from './level.controller';
import { LevelService } from './level.service';
import { LoggerService } from '../../common/services/logger.service';

@Module({
  controllers: [LevelController],
  providers: [LevelService, LoggerService],
  exports: [LevelService],
})
export class LevelModule {}
