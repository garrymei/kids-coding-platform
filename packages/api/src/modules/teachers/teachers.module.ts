import { Module, forwardRef } from '@nestjs/common';
import { TeacherPermissionsController } from './controllers/teacher-permissions.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { VisibilityService } from '../auth/services/visibility.service';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [TeacherPermissionsController],
  providers: [VisibilityService],
  exports: [VisibilityService],
})
export class TeachersModule {}
