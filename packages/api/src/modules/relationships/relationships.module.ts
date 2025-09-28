import { Module } from '@nestjs/common';
import { RelationshipsController } from './relationships.controller';
import { RequestsController } from './controllers/requests.controller';
import { AccessGrantsController } from './controllers/access-grants.controller';
import { RelationshipsService } from './relationships.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RateLimitService } from '../search/services/rate-limit.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [RelationshipsController, RequestsController, AccessGrantsController],
  providers: [RelationshipsService, RateLimitService],
  exports: [RelationshipsService, RateLimitService],
})
export class RelationshipsModule {}