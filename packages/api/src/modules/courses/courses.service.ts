import { Injectable } from '@nestjs/common';

@Injectable()
export class CoursesService {
  listPreview() {
    return [
      {
        id: 'intro-python',
        title: 'Python 新手村',
        difficulty: 'beginner',
      },
      {
        id: 'logic-lab',
        title: '逻辑闯关训练营',
        difficulty: 'intermediate',
      },
    ];
  }
}
