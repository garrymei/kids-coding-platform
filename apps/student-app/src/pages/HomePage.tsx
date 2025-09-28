import { Badge, Button, Card, Progress, tokens } from '@kids/ui-kit';
import { useNavigate } from 'react-router-dom';
import { useStudentState, useStudentActions } from '../store/studentStore.js';

export function HomePage() {
  const navigate = useNavigate();
  const { displayName, xp, streakDays, focusCourseId, courses } = useStudentState();
  const actions = useStudentActions();

  const focusCourse = courses.find((course) => course.id === focusCourseId) ?? courses[0];
  const upcomingCourse = courses
    .filter((course) => course.id !== focusCourse?.id)
    .sort((a, b) => b.progress - a.progress)[0];

  return (
    <div className="page-grid">
      <section className="page-grid__column">
        <Card
          heading={`Hi, ${displayName}!`}
          featured
          style={{
            background: tokens.gradients.primary,
            color: tokens.colors.surface,
          }}
        >
          <p>继续点亮今日任务，保持学习连击！</p>
          <div className="page-grid__stats">
            <div>
              <div className="page-grid__stats-label">连续学习</div>
              <div className="page-grid__stats-value">{streakDays} 天</div>
            </div>
            <div>
              <div className="page-grid__stats-label">累计 XP</div>
              <div className="page-grid__stats-value">{xp}</div>
            </div>
          </div>
          {focusCourse ? (
            <div className="page-grid__progress">
              <Progress
                value={focusCourse.progress}
                label={`${focusCourse.title} · ${focusCourse.lessonsCompleted}/${focusCourse.lessonsTotal}`}
              />
              <Button
                onClick={() => {
                  // 计算下一关并跳转
                  const nextLevelId = `py-io-001`; // 临时假数据
                  navigate(`/play/${nextLevelId}`);
                }}
              >
                完成下一节
              </Button>
            </div>
          ) : null}
        </Card>

        {upcomingCourse ? (
          <Card heading="下一个推荐">
            <div className="page-grid__course">
              <div>
                <div className="page-grid__course-title">{upcomingCourse.title}</div>
                <div className="page-grid__course-tags">
                  {upcomingCourse.tags.map((tag) => (
                    <Badge key={tag} text={tag} tone="info" />
                  ))}
                </div>
              </div>
              <Button variant="secondary" onClick={() => actions.setFocusCourse(upcomingCourse.id)}>
                切换课程
              </Button>
            </div>
          </Card>
        ) : null}
      </section>

      <section className="page-grid__column">
        <Card heading="快捷入口">
          <div className="quick-actions">
            <Button variant="secondary" onClick={() => navigate('/hub/python')}>
              课程地图
            </Button>
            <Button variant="secondary" onClick={() => navigate('/hub/python/led')}>
              闯关挑战
            </Button>
            <Button variant="secondary" onClick={() => navigate('/works')}>
              作品集
            </Button>
            <Button variant="ghost" onClick={() => navigate('/leaderboard')}>
              排行榜
            </Button>
          </div>
        </Card>
        <Card heading="成长提醒">
          <ul className="reminder-list">
            <li>🧠 每周巩固一次逻辑训练可以保持技能热度。</li>
            <li>🎯 作品集收藏 3 个作品后解锁“创意达人”称号。</li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
