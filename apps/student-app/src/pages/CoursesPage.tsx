import { Badge, Button, Card, Progress } from '@kids/ui-kit';
import { useStudentState, useStudentActions } from '../store/studentStore.js';

export function CoursesPage() {
  const { courses, focusCourseId } = useStudentState();
  const actions = useStudentActions();

  return (
    <div className="page-section">
      <div className="page-section__header">
        <h2>我的课程</h2>
        <Badge
          tone="info"
          text={`已解锁 ${courses.filter((course) => course.progress >= 100).length}/${courses.length}`}
        />
      </div>
      <div className="course-grid">
        {courses.map((course) => {
          const isFocused = course.id === focusCourseId;
          return (
            <Card
              key={course.id}
              heading={course.title}
              style={{ border: isFocused ? '2px solid rgba(132, 107, 255, 0.45)' : undefined }}
            >
              <div className="course-card__tags">
                {course.tags.map((tag) => (
                  <Badge key={tag} text={tag} tone="info" />
                ))}
              </div>
              <Progress
                value={course.progress}
                label={`进度 ${course.lessonsCompleted}/${course.lessonsTotal}`}
              />
              <div className="course-card__actions">
                <Button variant={isFocused ? 'primary' : 'secondary'} onClick={() => actions.setFocusCourse(course.id)}>
                  {isFocused ? '当前主线' : '设为主线'}
                </Button>
                <Button variant="ghost">查看章节</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
