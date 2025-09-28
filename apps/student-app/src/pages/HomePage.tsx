import { useEffect, useState } from 'react';
import { Badge, Button, Card, Progress, tokens } from '@kids/ui-kit';
import { useNavigate } from 'react-router-dom';
import { useStudentState, useStudentActions } from '../store/studentStore.js';
import { recommendationService } from '../services/recommend';
import type { Level } from '../services/level.repo';
import { LoadingSpinner, CardSkeleton, EmptyState, ErrorState } from '../components/LoadingStates';
import { api, handleApiError } from '../services/api-client';

export function HomePage() {
  const navigate = useNavigate();
  const { displayName, xp, streakDays, focusCourseId, courses } = useStudentState();
  const actions = useStudentActions();
  const [nextLevel, setNextLevel] = useState<Level | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressSummary, setProgressSummary] = useState<{
    totalPacks: number;
    completedPacks: number;
    totalLevels: number;
    completedLevels: number;
    nextMilestone: string;
  } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 使用新的API客户端获取首页进度数据
      const homeProgress = await api.get(`/progress/students/stu_1/home`);
      
      // 同时获取推荐课程
      const [recommendation, summary] = await Promise.all([
        recommendationService.getNextLevelForStudent(),
        recommendationService.getProgressSummary()
      ]);
      
      setNextLevel(recommendation.nextLevel);
      setProgressSummary(summary);
      
      // 更新学生状态
      actions.refreshStats();
      
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const focusCourse = courses.find((course) => course.id === focusCourseId) ?? courses[0];
  const upcomingCourse = courses
    .filter((course) => course.id !== focusCourse?.id)
    .sort((a, b) => b.progress - a.progress)[0];

  // 显示加载状态
  if (loading) {
    return (
      <div className="page-grid">
        <section className="page-grid__column">
          <CardSkeleton />
        </section>
        <section className="page-grid__column">
          <CardSkeleton />
          <CardSkeleton />
        </section>
      </div>
    );
  }

  // 显示错误状态
  if (error) {
    return (
      <div className="page-grid">
        <section className="page-grid__column">
          <ErrorState
            title="加载失败"
            description={error}
            onRetry={loadData}
            retryText="重新加载"
          />
        </section>
      </div>
    );
  }

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
                  if (nextLevel) {
                    navigate(`/play/${nextLevel.id}`);
                  } else {
                    // 临时假数据
                    const nextLevelId = `py-io-001`;
                    navigate(`/play/${nextLevelId}`);
                  }
                }}
                disabled={loading}
              >
                {loading ? '加载中...' : '完成下一节'}
              </Button>
            </div>
          ) : null}
        </Card>

        {progressSummary && (
          <Card heading="学习进度">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {progressSummary.completedLevels}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>已完成关卡</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {progressSummary.completedPacks}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>已完成包</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {Math.round((progressSummary.completedLevels / progressSummary.totalLevels) * 100)}%
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>总体进度</div>
              </div>
            </div>
            
            <Progress 
              value={(progressSummary.completedLevels / progressSummary.totalLevels) * 100} 
              label={`总进度: ${progressSummary.completedLevels}/${progressSummary.totalLevels}`}
            />
            
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '5px' }}>
              <strong>下一步目标:</strong> {progressSummary.nextMilestone}
            </div>
          </Card>
        )}

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
            <li>🎯 作品集收藏 3 个作品后解锁"创意达人"称号。</li>
            <li>🔥 连续学习7天可获得"坚持者"徽章。</li>
            <li>🏆 完成所有关卡可获得"编程大师"称号。</li>
          </ul>
        </Card>
      </section>
    </div>
  );
}