import { useEffect, useState, useCallback } from 'react';

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

    studyTimeToday: number; // ����

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

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await httpClient.get<DashboardData>('/teachers/dashboard', {
        query: {
          classId: selectedClass,
          timeRange,
        },
      });

      setDashboardData(response);
    } catch (_error) {
      // eslint-disable-next-line no-console
      console.error('加载教学仪表板数据失败:', _error);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, timeRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const _getStatusColor = (status: string) => {
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
    return <div className="loading">������...</div>;
  }

  if (!dashboardData) {
    return <div className="no-data">��������</div>;
  }

  return (
    <div className="teaching-dashboard">
      <div className="page-header">
        <h1>��ѧ�Ǳ���</h1>

        <div className="header-controls">
          <select
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(e.target.value ? e.target.value : '')}
            className="class-selector"
          >
            <option value="">���а༶</option>

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
            <option value="7d">���7��</option>

            <option value="30d">���30��</option>

            <option value="90d">���90��</option>
          </select>
        </div>
      </div>

      <Card heading="课程进度分析" className="course-analysis">
        <p>当前为演示模式，暂无课程统计数据。</p>
      </Card>
    </div>
  );
}
