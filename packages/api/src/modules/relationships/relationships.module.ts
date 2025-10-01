import { Module, forwardRef } from '@nestjs/common';
import { RelationshipsController } from './relationships.controller';
import { RequestsController } from './controllers/requests.controller';
import { AccessGrantsController } from './controllers/access-grants.controller';
import { RelationshipsService } from './relationships.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RateLimitService } from '../search/services/rate-limit.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule, forwardRef(() => AuthModule)],
  controllers: [RelationshipsController, RequestsController, AccessGrantsController],
  providers: [RelationshipsService, RateLimitService],
  exports: [RelationshipsService, RateLimitService],
})
export class RelationshipsModule {}