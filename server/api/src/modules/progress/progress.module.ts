import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { CourseMapController } from './course-map.controller';

@Module({
  imports: [CurriculumModule],
  providers: [ProgressService],
  controllers: [ProgressController, CourseMapController],
  exports: [ProgressService],
})
export class ProgressModule {}
