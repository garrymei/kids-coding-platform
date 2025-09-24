import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentPermissionsController } from './controllers/student-permissions.controller';
import { AuthorizationCenterController } from './controllers/authorization-center.controller';
import { StudentsService } from './students.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { VisibilityService } from '../auth/services/visibility.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    StudentsController,
    StudentPermissionsController,
    AuthorizationCenterController,
  ],
  providers: [StudentsService, VisibilityService],
  exports: [StudentsService, VisibilityService],
})
export class StudentsModule {}
