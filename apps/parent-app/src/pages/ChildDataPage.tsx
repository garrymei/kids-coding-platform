import { useState, useEffect } from 'react';
import { Card, Badge, Progress, Button } from '@kids/ui-kit';
import { httpClient } from '../services/http';

interface ChildData {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  authorization: {
    scopes: string[];
    expiresAt: string | null;
    grantedAt: string;
  };
  progress: {
    xp: number;
    streakDays: number;
    completedCourses: number;
    totalCourses: number;
    completedLessons: number;
    totalLessons: number;
    level: number;
  };
  recentBadges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: string;
  }>;
  recentWorks: Array<{
    id: string;
    title: string;
    description: string;
    type: 'project' | 'assignment' | 'exercise';
    status: 'completed' | 'in_progress' | 'submitted';
    createdAt: string;
    updatedAt: string;
  }>;
  courses: Array<{
    id: string;
    title: string;
    description: string;
    progress: number;
    status: 'not_started' | 'in_progress' | 'completed';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedDuration: number;
    actualDuration: number;
  }>;
  weeklyActivity: Array<{
    date: string;
    studyTime: number; // 分钟
    completedLessons: number;
    earnedXp: number;
  }>;
}

interface ChildDataPageProps {
  childId: string;
}

export function ChildDataPage({ childId }: ChildDataPageProps) {
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChildData();
  }, [childId]);

  const loadChildData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 检查访问权限
      const hasAccess = await httpClient.get<{ hasAccess: boolean }>(
        `/relationships/check-access/${childId}?scope=progress:read`,
      );
      if (!hasAccess.hasAccess) {
        setError('您没有权限查看该孩子的数据');
        return;
      }

      // 获取孩子数据
      const data = await httpClient.get<ChildData>(`/students/${childId}/data`);
      setChildData(data);
    } catch (err: any) {
      console.error('加载孩子数据失败:', err);
      setError(err.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'progress:read':
        return '学习进度';
      case 'works:read':
        return '作品查看';
      case 'badges:read':
        return '徽章查看';
      case 'courses:read':
        return '课程查看';
      default:
        return scope;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'submitted':
        return 'warning';
      case 'not_started':
        return 'info';
      default:
        return 'info';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'danger';
      default:
        return 'info';
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return (
      <div className="error-page">
        <h2>无法查看数据</h2>
        <p>{error}</p>
        <Button variant="primary" onClick={loadChildData}>
          重试
        </Button>
      </div>
    );
  }

  if (!childData) {
    return <div className="no-data">暂无数据</div>;
  }

  return (
    <div className="child-data-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="child-info">
          <div className="child-avatar">
            {childData.avatar ? (
              <img src={childData.avatar} alt={childData.displayName} />
            ) : (
              <div className="avatar-placeholder">{childData.displayName.charAt(0)}</div>
            )}
          </div>
          <div className="child-details">
            <h1>{childData.displayName}</h1>
            <p>{childData.email}</p>
            <div className="authorization-info">
              <Badge text="已授权" tone="success" />
              <span className="authorization-scopes">
                授权范围: {childData.authorization.scopes.map(getScopeLabel).join(', ')}
              </span>
              {childData.authorization.expiresAt && (
                <span className="authorization-expires">
                  授权至: {formatDate(childData.authorization.expiresAt)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="page-actions">
          <Button variant="ghost">管理授权</Button>
          <Button variant="primary">导出报告</Button>
        </div>
      </div>

      {/* 学习进度概览 */}
      <Card heading="学习进度概览" className="progress-overview">
        <div className="progress-stats">
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-value">{childData.progress.xp}</div>
              <div className="stat-label">经验值</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <div className="stat-value">{childData.progress.streakDays}</div>
              <div className="stat-label">连续学习天数</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <div className="stat-value">{childData.progress.completedCourses}</div>
              <div className="stat-label">完成课程</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-value">{childData.progress.level}</div>
              <div className="stat-label">当前等级</div>
            </div>
          </div>
        </div>
      </Card>

      {/* 课程进度 */}
      <Card heading="课程进度" className="courses-progress">
        <div className="courses-list">
          {childData.courses.map((course) => (
            <div key={course.id} className="course-item">
              <div className="course-info">
                <h4>{course.title}</h4>
                <p>{course.description}</p>
                <div className="course-meta">
                  <Badge text={course.difficulty} tone={getDifficultyColor(course.difficulty)} />
                  <span className="course-duration">预计 {course.estimatedDuration} 分钟</span>
                </div>
              </div>
              <div className="course-progress">
                <Progress value={course.progress} label={`${course.progress}%`} />
                <div className="progress-details">
                  <span>已完成 {course.actualDuration} 分钟</span>
                  <Badge text={course.status} tone={getStatusColor(course.status)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 最近徽章 */}
      <Card heading="最近获得的徽章" className="recent-badges">
        <div className="badges-grid">
          {childData.recentBadges.map((badge) => (
            <div key={badge.id} className="badge-item">
              <div className="badge-icon">{badge.icon}</div>
              <div className="badge-info">
                <h4>{badge.name}</h4>
                <p>{badge.description}</p>
                <small>获得时间: {formatDateTime(badge.earnedAt)}</small>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 最近作品 */}
      <Card heading="最近作品" className="recent-works">
        <div className="works-list">
          {childData.recentWorks.map((work) => (
            <div key={work.id} className="work-item">
              <div className="work-info">
                <h4>{work.title}</h4>
                <p>{work.description}</p>
                <div className="work-meta">
                  <span className="work-type">{work.type}</span>
                  <span className="work-date">创建: {formatDateTime(work.createdAt)}</span>
                </div>
              </div>
              <div className="work-status">
                <Badge text={work.status} tone={getStatusColor(work.status)} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 每周活动统计 */}
      <Card heading="学习活动统计" className="weekly-activity">
        <div className="activity-chart">
          {childData.weeklyActivity.map((day) => (
            <div key={day.date} className="activity-day">
              <div className="day-label">
                {new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'short' })}
              </div>
              <div className="activity-bar">
                <div className="bar-fill" style={{ height: `${(day.studyTime / 120) * 100}%` }} />
              </div>
              <div className="day-stats">
                <span>{day.studyTime}分钟</span>
                <span>{day.completedLessons}课时</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
