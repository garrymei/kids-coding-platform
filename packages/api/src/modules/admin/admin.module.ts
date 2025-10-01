import { Module, forwardRef } from '@nestjs/common';
import { AdminPermissionsController } from './controllers/admin-permissions.controller';
import { AdminAuditController } from './controllers/admin-audit.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule), AuditModule],
  controllers: [AdminPermissionsController, AdminAuditController],
  providers: [],
  exports: [],
})
export class AdminModule {}