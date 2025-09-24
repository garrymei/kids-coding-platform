import { Module } from '@nestjs/common';
import { AdminPermissionsController } from './controllers/admin-permissions.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminPermissionsController],
  providers: [],
  exports: [],
})
export class AdminModule {}
