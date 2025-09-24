import { Module } from '@nestjs/common';
import { ClassesController } from './classes.controller';
import { ClassManagementController } from './controllers/class-management.controller';
import { ClassInviteController } from './controllers/class-invite.controller';
import { ClassesService } from './classes.service';
import { ClassManagementService } from './services/class-management.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    ClassesController,
    ClassManagementController,
    ClassInviteController,
  ],
  providers: [ClassesService, ClassManagementService],
  exports: [ClassesService, ClassManagementService],
})
export class ClassesModule {}
