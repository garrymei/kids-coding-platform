import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Select, Button, message, Spin } from 'antd';
import {
  CalendarOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { StudentTrendChart, StudentComparisonChart } from '@kids/ui-kit';
import dayjs from 'dayjs';
import { httpClient } from '../services/http';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface StudentSummary {
  studentId: string;
  studentName: string;
  totalTimeSpent: number;
  totalTasksDone: number;
  averageAccuracy: number;
  totalXP: number;
  currentStreak: number;
  lastActiveDate?: string;
}

interface TrendData {
  date: string;
  time_spent_min: number;
  tasks_done: number;
  accuracy: number;
  xp: number;
  streak: number;
}

interface ComparisonData {
  studentId: string;
  studentName?: string;
  accuracy: number;
  tasks_done: number;
  time_spent_min: number;
  rank: number;
  isAnonymous?: boolean;
}

const StudentDataPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [granularity, setGranularity] = useState<'day' | 'week'>('day');
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  // 获取学生摘要
  const fetchStudentSummary = async (studentId: string) => {
    try {
      const response = await httpClient.get<StudentSummary>(
        `/metrics/students/${studentId}/summary`,
      );
      setSummary(response);
    } catch (error) {
      message.error('获取学生摘要失败');
    }
  };

  // 获取学生趋势数据
  const fetchTrendData = async (
    studentId: string,
    from: string,
    to: string,
    granularity: string,
  ) => {
    setLoading(true);
    try {
      const response = await httpClient.get<TrendData[]>(`/metrics/students/${studentId}/trend`, {
        query: { from, to, granularity },
      });
      setTrendData(response);
    } catch (error) {
      message.error('获取趋势数据失败');
      // Fallback to mock data on error
      const mockData: TrendData[] = [];
      const startDate = dayjs(from);
      const endDate = dayjs(to);
      const days = endDate.diff(startDate, 'day') + 1;

      for (let i = 0; i < days; i++) {
        const date = startDate.add(i, 'day');
        mockData.push({
          date: date.format('YYYY-MM-DD'),
          time_spent_min: Math.floor(Math.random() * 60) + 20,
          tasks_done: Math.floor(Math.random() * 5) + 1,
          accuracy: Math.random() * 0.4 + 0.6, // 0.6-1.0
          xp: Math.floor(Math.random() * 100) + 50,
          streak: Math.min(i + 1, 10),
        });
      }

      setTrendData(mockData);
    } finally {
      setLoading(false);
    }
  };

  // 获取对比数据
  const fetchComparisonData = async (studentId: string) => {
    try {
      const response = await httpClient.post<ComparisonData[]>('/metrics/compare', {
        body: {
          studentIds: [studentId],
          metrics: ['accuracy', 'tasks_done', 'time_spent_min'],
          window: 'last_14d',
        },
      });
      setComparisonData(response);
    } catch (error) {
      message.error('获取对比数据失败');
      // Fallback to mock data on error
      setComparisonData([
        {
          studentId: 'student-1',
          studentName: '小明',
          accuracy: 0.85,
          tasks_done: 45,
          time_spent_min: 1200,
          rank: 3,
        },
        {
          studentId: 'class_avg',
          studentName: '班级平均',
          accuracy: 0.78,
          tasks_done: 38,
          time_spent_min: 950,
          rank: 0,
          isAnonymous: true,
        },
        {
          studentId: 'class_p50',
          studentName: '班级中位数(P50)',
          accuracy: 0.8,
          tasks_done: 40,
          time_spent_min: 1000,
          rank: 0,
          isAnonymous: true,
        },
        {
          studentId: 'class_p90',
          studentName: '班级优秀线(P90)',
          accuracy: 0.92,
          tasks_done: 55,
          time_spent_min: 1400,
          rank: 0,
          isAnonymous: true,
        },
      ]);
    }
  };

  // 处理日期范围变化
  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
      if (selectedStudent) {
        fetchTrendData(
          selectedStudent,
          dates[0].format('YYYY-MM-DD'),
          dates[1].format('YYYY-MM-DD'),
          granularity,
        );
      }
    }
  };

  // 处理粒度变化
  const handleGranularityChange = (value: 'day' | 'week') => {
    setGranularity(value);
    if (selectedStudent) {
      fetchTrendData(
        selectedStudent,
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD'),
        value,
      );
    }
  };

  useEffect(() => {
    // 模拟选择第一个学生
    const mockStudentId = 'student-1';
    setSelectedStudent(mockStudentId);
    fetchStudentSummary(mockStudentId);
    fetchComparisonData(mockStudentId);
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchTrendData(
        selectedStudent,
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD'),
        granularity,
      );
    }
  }, [selectedStudent, dateRange, granularity]);

  return (
    <div style={{ padding: '24px' }}>
      <h2>学生数据查看</h2>

      {summary && (
        <>
          {/* 学生摘要卡片 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总学习时长"
                  value={summary.totalTimeSpent}
                  suffix="分钟"
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="完成任务数"
                  value={summary.totalTasksDone}
                  suffix="个"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="平均准确率"
                  value={summary.averageAccuracy * 100}
                  suffix="%"
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="连续学习天数"
                  value={summary.currentStreak}
                  suffix="天"
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 控制面板 */}
          <Card style={{ marginBottom: '24px' }}>
            <Row gutter={16} align="middle">
              <Col>
                <span>时间范围：</span>
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  style={{ marginLeft: '8px' }}
                />
              </Col>
              <Col>
                <span>数据粒度：</span>
                <Select
                  value={granularity}
                  onChange={handleGranularityChange}
                  style={{ width: 120, marginLeft: '8px' }}
                >
                  <Option value="day">按天</Option>
                  <Option value="week">按周</Option>
                </Select>
              </Col>
              <Col>
                <Button
                  type="primary"
                  onClick={() => {
                    if (selectedStudent) {
                      fetchTrendData(
                        selectedStudent,
                        dateRange[0].format('YYYY-MM-DD'),
                        dateRange[1].format('YYYY-MM-DD'),
                        granularity,
                      );
                    }
                  }}
                >
                  刷新数据
                </Button>
              </Col>
            </Row>
          </Card>

          {/* 趋势图表 */}
          <Card title="学习趋势" style={{ marginBottom: '24px' }}>
            <Spin spinning={loading}>
              <StudentTrendChart
                data={trendData}
                title={`${summary.studentName}的学习趋势`}
                height={400}
                showMetrics={['time_spent_min', 'tasks_done', 'accuracy']}
              />
            </Spin>
          </Card>

          {/* 对比图表 */}
          <Card title="班级对比">
            <StudentComparisonChart
              data={comparisonData}
              title={`${summary.studentName}与班级对比`}
              height={400}
              showMetrics={['accuracy', 'tasks_done', 'time_spent_min']}
              isTeacher={false}
            />
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '4px',
              }}
            >
              <p style={{ margin: 0, fontSize: '14px', color: '#52c41a' }}>
                💡
                提示：为了保护隐私，家长端只显示自己孩子与班级匿名统计数据（班级平均、中位数、优秀线）的对比。
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default StudentDataPage;
