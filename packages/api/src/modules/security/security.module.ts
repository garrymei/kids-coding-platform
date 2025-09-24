import { Module } from '@nestjs/common';
import { SecurityController } from './controllers/security.controller';
import { RateLimitService } from './services/rate-limit.service';
import { DataMaskingService } from './services/data-masking.service';
import { PermissionGranularityService } from './services/permission-granularity.service';
import { ExpirationManagementService } from './services/expiration-management.service';
import { AuditLoggingService } from './services/audit-logging.service';
import { AppealArbitrationService } from './services/appeal-arbitration.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [SecurityController],
  providers: [
    RateLimitService,
    DataMaskingService,
    PermissionGranularityService,
    ExpirationManagementService,
    AuditLoggingService,
    AppealArbitrationService,
  ],
  exports: [
    RateLimitService,
    DataMaskingService,
    PermissionGranularityService,
    ExpirationManagementService,
    AuditLoggingService,
    AppealArbitrationService,
  ],
})
export class SecurityModule {}
