import { Module } from '@nestjs/common';
import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';
import { LoggerService } from '../../common/services/logger.service';

@Module({
  controllers: [ConsentController],
  providers: [ConsentService, LoggerService],
  exports: [ConsentService],
})
export class ConsentModule {}
