import { Module } from '@nestjs/common';
import { TeacherPermissionsController } from './controllers/teacher-permissions.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { VisibilityService } from '../auth/services/visibility.service';

@Module({
  imports: [PrismaModule],
  controllers: [TeacherPermissionsController],
  providers: [VisibilityService],
  exports: [VisibilityService],
})
export class TeachersModule {}
