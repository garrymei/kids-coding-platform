import { useEffect, useMemo, useState } from 'react';

import { Card, Badge, Progress, Button } from '@kids/ui-kit';

import { httpClient } from '../services/http';

interface StudentProgress {
  id: string;

  displayName: string;

  email: string;

  avatar?: string;

  progress: {
    xp: number;

    streakDays: number;

    completedCourses: number;

    totalCourses: number;

    completedLessons: number;

    totalLessons: number;

    level: number;
  };

  recentActivity: {
    lastActiveAt: string;

    studyTimeToday: number; // 分钟

    completedToday: number;
  };

  courses: Array<{
    id: string;

    title: string;

    progress: number;

    status: 'not_started' | 'in_progress' | 'completed';

    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }>;

  recentWorks: Array<{
    id: string;

    title: string;

    type: 'project' | 'assignment' | 'exercise';

    status: 'completed' | 'in_progress' | 'submitted';

    createdAt: string;
  }>;
}

interface ClassStats {
  totalStudents: number;

  activeStudents: number;

  averageProgress: number;

  totalXp: number;

  completedCourses: number;

  averageStudyTime: number;
}

interface DashboardData {
  classes: Array<{
    id: string;

    name: string;

    studentCount: number;

    averageProgress: number;
  }>;

  students: StudentProgress[];

  stats: ClassStats;

  recentActivity: Array<{
    id: string;

    studentName: string;

    action: string;

    timestamp: string;

    details: string;
  }>;
}
type CourseSummary = {
  id: string;
  title: string;
  difficulty: StudentProgress['courses'][number]['difficulty'];
  totalStudents: number;
  completedStudents: number;
  averageProgress: number;
  progressSum: number;
};

export function TeachingDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [selectedClass, setSelectedClass] = useState<string>('all');

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const courseSummaries = useMemo<CourseSummary[]>(() => {
    if (!dashboardData) {
      return [];
    }

    const summaryMap = new Map<string, CourseSummary>();

    for (const student of dashboardData.students) {
      for (const course of student.courses) {
        const existing = summaryMap.get(course.id);
        const summary: CourseSummary = existing ?? {
          id: course.id,
          title: course.title,
          difficulty: course.difficulty,
          totalStudents: 0,
          completedStudents: 0,
          averageProgress: 0,
          progressSum: 0,
        };

        summary.totalStudents += 1;
        if (course.status === 'completed') {
          summary.completedStudents += 1;
        }
        summary.progressSum += course.progress;
        summary.averageProgress = Math.round(summary.progressSum / summary.totalStudents);

        summaryMap.set(course.id, summary);
      }
    }

    return Array.from(summaryMap.values());
  }, [dashboardData]);

  useEffect(() => {
    loadDashboardData();
  }, [selectedClass, timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const response = await httpClient.get<DashboardData>('/teachers/dashboard', {
        query: {
          classId: selectedClass,

          timeRange,
        },
      });

      setDashboardData(response);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('加载仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
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

  if (!dashboardData) {
    return <div className="no-data">暂无数据</div>;
  }

  return (
    <div className="teaching-dashboard">
      <div className="page-header">
        <h1>教学仪表盘</h1>

        <div className="header-controls">
          <select
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(e.target.value || null)}
            className="class-selector"
          >
            <option value="">所有班级</option>

            {dashboardData.classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="time-range-selector"
          >
            <option value="7d">最近7天</option>

            <option value="30d">最近30天</option>

            <option value="90d">最近90天</option>
          </select>
        </div>
      </div>

      {/* 统计概览 */}

      <div className="stats-overview">
        <Card className="stat-card">
          <div className="stat-icon">👥</div>

          <div className="stat-content">
            <div className="stat-value">{dashboardData.stats.totalStudents}</div>

            <div className="stat-label">总学生数</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">✅</div>

          <div className="stat-content">
            <div className="stat-value">{dashboardData.stats.activeStudents}</div>

            <div className="stat-label">活跃学生</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">📊</div>

          <div className="stat-content">
            <div className="stat-value">{dashboardData.stats.averageProgress}%</div>

            <div className="stat-label">平均进度</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">⭐</div>

          <div className="stat-content">
            <div className="stat-value">{dashboardData.stats.totalXp}</div>

            <div className="stat-label">总经验值</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">🎓</div>

          <div className="stat-content">
            <div className="stat-value">{dashboardData.stats.completedCourses}</div>

            <div className="stat-label">完成课程</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">⏱️</div>

          <div className="stat-content">
            <div className="stat-value">{dashboardData.stats.averageStudyTime}分钟</div>

            <div className="stat-label">平均学习时间</div>
          </div>
        </Card>
      </div>

      {/* 班级概览 */}

      <Card heading="班级概览" className="classes-overview">
        <div className="classes-grid">
          {dashboardData.classes.map((classItem) => (
            <div key={classItem.id} className="class-item">
              <div className="class-info">
                <h3>{classItem.name}</h3>

                <p>{classItem.studentCount} 名学生</p>
              </div>

              <div className="class-progress">
                <Progress
                  value={classItem.averageProgress}
                  label={`${classItem.averageProgress}%`}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 学生进度详情 */}

      <Card heading="学生进度详情" className="students-progress">
        <div className="students-table">
          {dashboardData.students.map((student) => (
            <div key={student.id} className="student-row">
              <div className="student-info">
                <div className="student-avatar">
                  {student.avatar ? (
                    <img src={student.avatar} alt={student.displayName} />
                  ) : (
                    <div className="avatar-placeholder">{student.displayName.charAt(0)}</div>
                  )}
                </div>

                <div className="student-details">
                  <h4>{student.displayName}</h4>

                  <p>{student.email}</p>

                  <div className="student-stats">
                    <Badge text={`${student.progress.xp} XP`} tone="info" />

                    <Badge text={`等级 ${student.progress.level}`} tone="success" />

                    <Badge text={`${student.progress.streakDays} 天连续`} tone="warning" />
                  </div>
                </div>
              </div>

              <div className="student-progress">
                <div className="progress-item">
                  <span>课程进度</span>

                  <Progress
                    value={Math.round(
                      (student.progress.completedCourses / student.progress.totalCourses) * 100,
                    )}
                    label={`${student.progress.completedCourses}/${student.progress.totalCourses}`}
                  />
                </div>

                <div className="progress-item">
                  <span>课时进度</span>

                  <Progress
                    value={Math.round(
                      (student.progress.completedLessons / student.progress.totalLessons) * 100,
                    )}
                    label={`${student.progress.completedLessons}/${student.progress.totalLessons}`}
                  />
                </div>
              </div>

              <div className="student-activity">
                <div className="activity-item">
                  <span>今日学习</span>

                  <span>{student.recentActivity.studyTimeToday} 分钟</span>
                </div>

                <div className="activity-item">
                  <span>今日完成</span>

                  <span>{student.recentActivity.completedToday} 个任务</span>
                </div>

                <div className="activity-item">
                  <span>最后活跃</span>

                  <span>{formatDateTime(student.recentActivity.lastActiveAt)}</span>
                </div>
              </div>

              <div className="student-actions">
                <Button variant="ghost">查看详情</Button>

                <Button variant="ghost">点评作品</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 最近活动 */}

      <Card heading="最近活动" className="recent-activity">
        <div className="activity-list">
          {dashboardData.recentActivity.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                {activity.action.includes('完成')
                  ? '✅'
                  : activity.action.includes('开始')
                    ? '🚀'
                    : activity.action.includes('提交')
                      ? '📝'
                      : '📊'}
              </div>

              <div className="activity-content">
                <div className="activity-text">
                  <strong>{activity.studentName}</strong> {activity.action}
                </div>

                <div className="activity-details">{activity.details}</div>

                <div className="activity-time">{formatDateTime(activity.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 课程进度分析 */}

      <Card heading="课程进度分析" className="course-analysis">
        <div className="course-stats">
          {courseSummaries.map((course) => (
            <div key={course.id} className="course-stat-item">
              <div className="course-info">
                <h4>{course.title}</h4>
                <Badge text={course.difficulty} tone={getDifficultyColor(course.difficulty)} />
              </div>
              <div className="course-progress">
                <Progress value={course.averageProgress} label={${course.averageProgress}%} />
                <div className="progress-details">
                  <span>{course.completedStudents}/{course.totalStudents} 学生完成</span>
                </div>
              </div>
            </div>
          ))}
        </div>

              <div className="course-progress">
                <Progress value={course.averageProgress} label={`${course.averageProgress}%`} />

                <div className="progress-details">
                  <span>
                    {course.completedStudents}/{course.totalStudents} 学生完成
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}






