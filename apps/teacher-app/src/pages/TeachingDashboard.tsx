import { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge, Button, Card, Progress } from '@kids/ui-kit';

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

const difficultyLabels: Record<CourseSummary['difficulty'], string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '挑战',
};

const courseStatusLabels: Record<StudentProgress['courses'][number]['status'], string> = {
  completed: '已完成',
  in_progress: '学习中',
  not_started: '未开始',
};

const calculatePercent = (completed: number, total: number) =>
  total === 0 ? 0 : Math.round((completed / total) * 100);

export function TeachingDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const query: { classId?: string; timeRange: typeof timeRange } = { timeRange };
      if (selectedClass !== 'all') {
        query.classId = selectedClass;
      }

      const response = await httpClient.get<DashboardData>('/teachers/dashboard', {
        query,
      });

      setDashboardData(response);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('加载教学仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, timeRange]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const courseSummaries = useMemo<CourseSummary[]>(() => {
    if (!dashboardData) {
      return [];
    }

    const summaryMap = new Map<string, CourseSummary>();

    for (const student of dashboardData.students) {
      for (const course of student.courses) {
        const existing = summaryMap.get(course.id);
        const summary =
          existing ??
          {
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

        summaryMap.set(course.id, summary);
      }
    }

    return Array.from(summaryMap.values()).map((summary) => ({
      ...summary,
      averageProgress:
        summary.totalStudents === 0
          ? 0
          : Math.round(summary.progressSum / summary.totalStudents),
    }));
  }, [dashboardData]);

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('zh-CN');

  const getCourseStatusTone = (status: StudentProgress['courses'][number]['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'not_started':
      default:
        return 'info';
    }
  };

  const getDifficultyTone = (difficulty: CourseSummary['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
      default:
        return 'danger';
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
            value={selectedClass}
            onChange={(event) => setSelectedClass(event.target.value)}
            className="class-selector"
          >
            <option value="all">所有班级</option>
            {dashboardData.classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>

          <select
            value={timeRange}
            onChange={(event) => setTimeRange(event.target.value as '7d' | '30d' | '90d')}
            className="time-range-selector"
          >
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
            <option value="90d">最近90天</option>
          </select>
        </div>
      </div>

      <div className="stats-overview">
        {[
          { label: '总学生数', value: dashboardData.stats.totalStudents, icon: '👥' },
          { label: '活跃学生', value: dashboardData.stats.activeStudents, icon: '✅' },
          {
            label: '平均进度',
            value: `${Math.round(dashboardData.stats.averageProgress)}%`,
            icon: '📊',
          },
          {
            label: '累计经验值',
            value: dashboardData.stats.totalXp.toLocaleString(),
            icon: '⭐',
          },
          { label: '完成课程', value: dashboardData.stats.completedCourses, icon: '🎯' },
          {
            label: '平均学习时长',
            value: `${dashboardData.stats.averageStudyTime} 分钟/日`,
            icon: '⏱️',
          },
        ].map((item) => (
          <Card key={item.label} className="stat-card">
            <div className="stat-icon">{item.icon}</div>
            <div className="stat-content">
              <div className="stat-value">{item.value}</div>
              <div className="stat-label">{item.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card heading="班级概览" className="class-overview">
        {dashboardData.classes.length === 0 ? (
          <p className="empty-state">当前暂无班级数据。</p>
        ) : (
          <div className="class-grid">
            {dashboardData.classes.map((classItem) => (
              <div key={classItem.id} className="class-card">
                <div className="class-card__header">
                  <h3>{classItem.name}</h3>
                  <Badge text={`${classItem.studentCount} 名学生`} tone="info" />
                </div>
                <div className="class-card__progress">
                  <Progress
                    value={Math.round(classItem.averageProgress)}
                    label={`${Math.round(classItem.averageProgress)}%`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card heading="学生进度概览" className="student-progress">
        {dashboardData.students.length === 0 ? (
          <p className="empty-state">暂时没有学生数据，邀请学生加入班级后即可查看。</p>
        ) : (
          <div className="student-grid">
            {dashboardData.students.map((student) => {
              const courseProgress = calculatePercent(
                student.progress.completedCourses,
                student.progress.totalCourses,
              );
              const lessonProgress = calculatePercent(
                student.progress.completedLessons,
                student.progress.totalLessons,
              );

              return (
                <div key={student.id} className="student-card">
                  <div className="student-card__header">
                    <div>
                      <h3>{student.displayName}</h3>
                      <p className="student-email">{student.email}</p>
                    </div>
                    <Badge text={`Lv.${student.progress.level}`} tone="info" />
                  </div>

                  <div className="student-metrics">
                    <div>
                      <strong>{student.progress.xp}</strong>
                      <span> XP</span>
                    </div>
                    <div>
                      <strong>{student.progress.streakDays}</strong>
                      <span> 天连续学习</span>
                    </div>
                  </div>

                  <div className="student-progress-bars">
                    <div className="progress-item">
                      <span>课程进度</span>
                      <Progress
                        value={courseProgress}
                        label={`${student.progress.completedCourses}/${student.progress.totalCourses}`}
                      />
                    </div>
                    <div className="progress-item">
                      <span>课时进度</span>
                      <Progress
                        value={lessonProgress}
                        label={`${student.progress.completedLessons}/${student.progress.totalLessons}`}
                      />
                    </div>
                  </div>

                  <div className="student-activity">
                    <div className="activity-item">
                      <span>今日学习</span>
                      <strong>{student.recentActivity.studyTimeToday} 分钟</strong>
                    </div>
                    <div className="activity-item">
                      <span>今日完成</span>
                      <strong>{student.recentActivity.completedToday} 个任务</strong>
                    </div>
                    <div className="activity-item">
                      <span>最后活跃</span>
                      <strong>{formatDateTime(student.recentActivity.lastActiveAt)}</strong>
                    </div>
                  </div>

                  {student.courses.length > 0 && (
                    <div className="student-courses">
                      {student.courses.slice(0, 3).map((course) => (
                        <Badge
                          key={course.id}
                          text={`${course.title} · ${courseStatusLabels[course.status]}`}
                          tone={getCourseStatusTone(course.status)}
                        />
                      ))}
                    </div>
                  )}

                  <div className="student-actions">
                    <Button variant="ghost">查看详情</Button>
                    <Button variant="ghost">点评作品</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card heading="最近活动" className="recent-activity">
        {dashboardData.recentActivity.length === 0 ? (
          <p className="empty-state">还没有学生活动记录。</p>
        ) : (
          <div className="activity-list">
            {dashboardData.recentActivity.map((activity) => {
              const icon = activity.action.includes('完成')
                ? '✅'
                : activity.action.includes('开始')
                  ? '🚀'
                  : activity.action.includes('提交')
                    ? '📝'
                    : '📊';

              return (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">{icon}</div>
                  <div className="activity-content">
                    <div className="activity-text">
                      <strong>{activity.studentName}</strong> {activity.action}
                    </div>
                    <div className="activity-details">{activity.details}</div>
                    <div className="activity-time">{formatDateTime(activity.timestamp)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card heading="课程进度分析" className="course-analysis">
        {courseSummaries.length === 0 ? (
          <p className="empty-state">当前为演示模式，暂无课程统计数据。</p>
        ) : (
          <div className="course-stats">
            {courseSummaries.map((course) => (
              <div key={course.id} className="course-stat-item">
                <div className="course-info">
                  <h4>{course.title}</h4>
                  <Badge
                    text={difficultyLabels[course.difficulty]}
                    tone={getDifficultyTone(course.difficulty)}
                  />
                </div>
                <div className="course-progress">
                  <Progress value={course.averageProgress} label={`${course.averageProgress}%`} />
                  <div className="progress-details">
                    <span>
                      {course.completedStudents}/{course.totalStudents} 名学生完成
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

