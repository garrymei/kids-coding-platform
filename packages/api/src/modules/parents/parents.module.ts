import { Module } from '@nestjs/common';
import { ParentPermissionsController } from './controllers/parent-permissions.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { VisibilityService } from '../auth/services/visibility.service';

@Module({
  imports: [PrismaModule],
  controllers: [ParentPermissionsController],
  providers: [VisibilityService],
  exports: [VisibilityService],
})
export class ParentsModule {}
