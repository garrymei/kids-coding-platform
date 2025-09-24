import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLoggerService } from './services/audit-logger.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AuditService, AuditLoggerService],
  exports: [AuditService, AuditLoggerService],
})
export class AuditModule {}
