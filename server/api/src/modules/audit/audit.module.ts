import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { LoggerService } from '../../common/services/logger.service';

@Module({
  controllers: [AuditController],
  providers: [AuditService, LoggerService],
  exports: [AuditService, LoggerService],
})
export class AuditModule {}
