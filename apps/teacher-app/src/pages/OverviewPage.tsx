import React, { useState, useEffect } from 'react';
import { Card, Button } from '@kids/ui-kit';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { httpClient } from '../services/http';
import './OverviewPage.css';

// Define interfaces for API response data structures
interface StudentTrendData {
  date: string;
  time_spent_min: number;
  tasks_done: number;
  accuracy: number;
  xp: number;
  streak: number;
}

interface StudentComparisonData {
  studentId: string;
  studentName?: string;
  accuracy: number;
  tasks_done: number;
  time_spent_min: number;
  rank: number;
  isAnonymous?: boolean;
  [key: string]: any;
}

interface ClassOverviewData {
  classId: string;
  className: string;
  studentCount: number;
  averageAccuracy: number;
  totalTasksDone: number;
  totalTimeSpent: number;
  topPerformers: Array<{
    studentId: string;
    studentName: string;
    accuracy: number;
    tasksDone: number;
  }>;
}

// Color palette for charts
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function OverviewPage() {
  // State management
  const [classId, setClassId] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [students, setStudents] = useState<Array<{ id: string; displayName: string }>>([]);
  const [trendData, setTrendData] = useState<StudentTrendData[]>([]);
  const [comparisonData, setComparisonData] = useState<StudentComparisonData[]>([]);
  const [classOverview, setClassOverview] = useState<ClassOverviewData | null>(null);
  const [loading, setLoading] = useState({
    classes: false,
    students: false,
    trend: false,
    comparison: false,
    overview: false
  });
  const [error, setError] = useState<string | null>(null);

  // Load classes when component mounts
  useEffect(() => {
    loadClasses();
  }, []);

  // Load students when class is selected
  useEffect(() => {
    if (classId) {
      loadStudents();
      loadClassOverview();
    }
  }, [classId]);

  // Load trend data when student is selected
  useEffect(() => {
    if (studentId) {
      loadStudentTrend();
    }
  }, [studentId, dateRange]);

  // Load comparison data when students are selected
  useEffect(() => {
    if (classId && students.length > 0) {
      loadStudentComparison();
    }
  }, [classId, students]);

  // API call functions
  const loadClasses = async () => {
    try {
      setLoading(prev => ({ ...prev, classes: true, error: null }));
      // In a real implementation, this would fetch actual classes from API
      // For demonstration, using mock data
      const mockClasses = [
        { id: 'class-1', name: '一年级A班' },
        { id: 'class-2', name: '二年级B班' },
        { id: 'class-3', name: '三年级C班' }
      ];
      setClasses(mockClasses);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load classes';
      setError(errorMessage);
      console.error('Failed to load classes:', err);
    } finally {
      setLoading(prev => ({ ...prev, classes: false }));
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(prev => ({ ...prev, students: true, error: null }));
      // In a real implementation, this would fetch actual students for the class from API
      // For demonstration, using mock data
      const mockStudents = [
        { id: 'student-1', displayName: '张小明' },
        { id: 'student-2', displayName: '李小红' },
        { id: 'student-3', displayName: '王小刚' },
        { id: 'student-4', displayName: '赵小丽' }
      ];
      setStudents(mockStudents);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load students';
      setError(errorMessage);
      console.error('Failed to load students:', err);
    } finally {
      setLoading(prev => ({ ...prev, students: false }));
    }
  };

  const loadStudentTrend = async () => {
    try {
      setLoading(prev => ({ ...prev, trend: true, error: null }));
      // Call the actual API
      const response = await httpClient.get<StudentTrendData[]>(`/metrics/students/${studentId}/trend`, {
        query: { from: dateRange.from, to: dateRange.to }
      });
      
      setTrendData(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load student trend data';
      setError(errorMessage);
      console.error('Failed to load student trend data:', err);
      // Fallback to mock data if API fails
      generateMockTrendData();
    } finally {
      setLoading(prev => ({ ...prev, trend: false }));
    }
  };

  const loadStudentComparison = async () => {
    try {
      setLoading(prev => ({ ...prev, comparison: true, error: null }));
      // Call the actual API
      const response = await httpClient.post<StudentComparisonData[]>('/metrics/compare', {
        body: {
          studentIds: students.map(s => s.id),
          metrics: ['accuracy', 'tasks_done', 'time_spent_min'],
          window: 'last_30d'
        }
      });
      
      setComparisonData(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load student comparison data';
      setError(errorMessage);
      console.error('Failed to load student comparison data:', err);
      // Fallback to mock data if API fails
      generateMockComparisonData();
    } finally {
      setLoading(prev => ({ ...prev, comparison: false }));
    }
  };

  const loadClassOverview = async () => {
    try {
      setLoading(prev => ({ ...prev, overview: true, error: null }));
      // Call the actual API
      const response = await httpClient.get<ClassOverviewData>(`/metrics/classes/${classId}/overview`);
      
      setClassOverview(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load class overview';
      setError(errorMessage);
      console.error('Failed to load class overview:', err);
      // Fallback to mock data if API fails
      generateMockClassOverview();
    } finally {
      setLoading(prev => ({ ...prev, overview: false }));
    }
  };

  // Mock data generation functions
  const generateMockTrendData = () => {
    const mockTrendData: StudentTrendData[] = [];
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      mockTrendData.push({
        date: dateStr,
        time_spent_min: Math.floor(Math.random() * 120),
        tasks_done: Math.floor(Math.random() * 10),
        accuracy: parseFloat((Math.random() * 100).toFixed(2)),
        xp: Math.floor(Math.random() * 500),
        streak: Math.floor(Math.random() * 7)
      });
    }
    
    setTrendData(mockTrendData);
  };

  const generateMockComparisonData = () => {
    const mockComparisonData: StudentComparisonData[] = students.map((student, index) => ({
      studentId: student.id,
      studentName: student.displayName,
      accuracy: parseFloat((Math.random() * 100).toFixed(2)),
      tasks_done: Math.floor(Math.random() * 50),
      time_spent_min: Math.floor(Math.random() * 600),
      rank: index + 1
    }));
    
    setComparisonData(mockComparisonData);
  };

  const generateMockClassOverview = () => {
    const mockOverview: ClassOverviewData = {
      classId: classId,
      className: classes.find(c => c.id === classId)?.name || '未知班级',
      studentCount: students.length,
      averageAccuracy: parseFloat((Math.random() * 100).toFixed(2)),
      totalTasksDone: Math.floor(Math.random() * 500),
      totalTimeSpent: Math.floor(Math.random() * 3000),
      topPerformers: students.slice(0, 3).map((student, index) => ({
        studentId: student.id,
        studentName: student.displayName,
        accuracy: parseFloat((Math.random() * 100).toFixed(2)),
        tasksDone: Math.floor(Math.random() * 50)
      }))
    };
    
    setClassOverview(mockOverview);
  };

  // UI event handlers
  const handleDateRangeChange = (days: number) => {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - days);
    
    setDateRange({
      from: fromDate.toISOString().split('T')[0],
      to: toDate.toISOString().split('T')[0]
    });
  };

  // Render helper functions
  const renderError = () => {
    if (!error) return null;
    return (
      <div className="error-banner">
        <p>{error}</p>
        <button onClick={() => setError(null)}>Dismiss</button>
      </div>
    );
  };

  const renderLoading = (type: keyof typeof loading) => {
    if (!loading[type]) return null;
    const messages = {
      classes: '加载班级中...',
      students: '加载学生中...',
      trend: '加载趋势数据中...',
      comparison: '加载对比数据中...',
      overview: '加载班级概览中...'
    };
    return <div className="loading-indicator">{messages[type]}</div>;
  };

  return (
    <div className="overview-page">
      <div className="page-header">
        <h1>数据概览</h1>
        <div className="header-controls">
          <select
            value={classId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setClassId(e.target.value)}
            disabled={loading.classes}
            className="form-select"
          >
            <option value="">选择班级</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
          <select
            value={studentId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStudentId(e.target.value)}
            disabled={loading.students || !classId}
            className="form-select"
          >
            <option value="">选择学生</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>{student.displayName}</option>
            ))}
          </select>
          <div className="date-range-controls">
            <Button 
              variant="secondary" 
              onClick={() => handleDateRangeChange(7)}
              disabled={!studentId}
            >
              最近7天
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => handleDateRangeChange(30)}
              disabled={!studentId}
            >
              最近30天
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => handleDateRangeChange(90)}
              disabled={!studentId}
            >
              最近90天
            </Button>
          </div>
        </div>
      </div>

      {renderError()}

      {/* Class Overview */}
      {classOverview && (
        <div className="class-overview-section">
          <h2>{classOverview.className} - 班级概览</h2>
          <div className="stats-cards">
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-value">{classOverview.studentCount}</div>
                <div className="stat-label">学生总数</div>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-value">{classOverview.averageAccuracy}%</div>
                <div className="stat-label">平均准确率</div>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-value">{classOverview.totalTasksDone}</div>
                <div className="stat-label">总任务数</div>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-value">{classOverview.totalTimeSpent}分钟</div>
                <div className="stat-label">总学习时间</div>
              </div>
            </Card>
          </div>

          {/* Top Performers */}
          <Card heading="表现优异学生" className="top-performers-card">
            <div className="top-performers-list">
              {classOverview.topPerformers.map((performer, index) => (
                <div key={performer.studentId} className="performer-item">
                  <div className="performer-rank">#{index + 1}</div>
                  <div className="performer-name">{performer.studentName}</div>
                  <div className="performer-stats">
                    <span>准确率: {performer.accuracy}%</span>
                    <span>任务数: {performer.tasksDone}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Student Trend Charts */}
      {studentId && (
        <div className="trend-section">
          <h2>学习趋势</h2>
          {renderLoading('trend')}
          {trendData.length > 0 && (
            <div className="charts-grid">
              <Card className="chart-card">
                <h3>学习时间趋势</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="time_spent_min" 
                      name="学习时间(分钟)" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="chart-card">
                <h3>任务完成趋势</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tasks_done" name="完成任务数" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="chart-card">
                <h3>准确率趋势</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      name="准确率(%)" 
                      stroke="#ffc658" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="chart-card">
                <h3>经验值趋势</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="xp" 
                      name="经验值" 
                      stroke="#ff7300" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Student Comparison Charts */}
      {classId && (
        <div className="comparison-section">
          <h2>学生对比</h2>
          {renderLoading('comparison')}
          {comparisonData.length > 0 && (
            <div className="charts-grid">
              <Card className="chart-card">
                <h3>准确率对比</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="studentName" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="accuracy" name="准确率(%)" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="chart-card">
                <h3>任务完成数对比</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="studentName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tasks_done" name="完成任务数" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="chart-card">
                <h3>学习时间对比</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="studentName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="time_spent_min" name="学习时间(分钟)" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="chart-card">
                <h3>综合表现</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={comparisonData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="accuracy"
                      nameKey="studentName"
                      label={({ studentName, accuracy }) => `${studentName}: ${accuracy}%`}
                    >
                      {comparisonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Loading indicators */}
      {renderLoading('classes')}
      {renderLoading('students')}
      {renderLoading('overview')}
    </div>
  );
}