import { Badge, Card, Progress, Button } from '@kids/ui-kit';

const classes = [
  { id: 'class-a', name: '七年级 1 班', students: 32, completion: 68 },
  { id: 'class-b', name: '七年级 2 班', students: 29, completion: 54 },
  { id: 'class-c', name: '体验班', students: 18, completion: 82 },
];

export function ClassesPage() {
  return (
    <div className="course-grid">
      {classes.map((item) => (
        <Card key={item.id} heading={item.name}>
          <div className="course-card__tags">
            <Badge text={`${item.students} 名学生`} tone="info" />
          </div>
          <Progress value={item.completion} label={`总体完成度 ${item.completion}%`} />
          <div className="course-card__actions">
            <Button variant="secondary">查看详情</Button>
            <Button variant="ghost">发布通知</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
