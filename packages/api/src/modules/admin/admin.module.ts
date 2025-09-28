import { Module } from '@nestjs/common';
import { AdminPermissionsController } from './controllers/admin-permissions.controller';
import { AdminAuditController } from './controllers/admin-audit.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminPermissionsController, AdminAuditController],
  providers: [],
  exports: [],
})
export class AdminModule {}