import { useState, useEffect } from 'react';
import { useMetricsStore } from '../../stores/metrics';
import { LineTimeseries } from '@kids/ui-kit';
import type { Dim, Period } from '@kids/utils/api/metrics';
import { Select, Card, Statistic, Row, Col, Skeleton, Button, Tabs } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

const { Option } = Select;
const { TabPane } = Tabs;

const studentId = 'stu_1'; // Mock studentId

// Mock 趋势数据
const mockTrendData = {
  xp: [
    { date: '2025-09-29', value: 100 },
    { date: '2025-09-30', value: 150 },
    { date: '2025-10-01', value: 300 },
    { date: '2025-10-02', value: 450 },
    { date: '2025-10-03', value: 600 },
    { date: '2025-10-04', value: 800 },
    { date: '2025-10-05', value: 1000 },
    { date: '2025-10-06', value: 1250 },
  ],
  completion: [
    { date: '2025-09-29', value: 5 },
    { date: '2025-09-30', value: 10 },
    { date: '2025-10-01', value: 18 },
    { date: '2025-10-02', value: 25 },
    { date: '2025-10-03', value: 32 },
    { date: '2025-10-04', value: 40 },
    { date: '2025-10-05', value: 50 },
    { date: '2025-10-06', value: 58 },
  ],
  streak: [
    { date: '2025-09-29', value: 1 },
    { date: '2025-09-30', value: 2 },
    { date: '2025-10-01', value: 3 },
    { date: '2025-10-02', value: 4 },
    { date: '2025-10-03', value: 5 },
    { date: '2025-10-04', value: 6 },
    { date: '2025-10-05', value: 7 },
    { date: '2025-10-06', value: 8 },
  ],
  studyTime: [
    { date: '2025-09-29', value: 15 },
    { date: '2025-09-30', value: 20 },
    { date: '2025-10-01', value: 35 },
    { date: '2025-10-02', value: 40 },
    { date: '2025-10-03', value: 30 },
    { date: '2025-10-04', value: 45 },
    { date: '2025-10-05', value: 50 },
    { date: '2025-10-06', value: 38 },
  ],
};

export function TrendPage() {
  const { series, loading: storeLoading, fetchTrend } = useMetricsStore();
  const [dimension, setDimension] = useState<Dim>('study_minutes');
  const [period, setPeriod] = useState<Period>('weekly');
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(7);
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState(mockTrendData);

  useEffect(() => {
    fetchTrend(studentId, [dimension], period);
    loadTrendData();
  }, [dimension, period, timeRange]);

  const loadTrendData = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      // 根据时间范围过滤数据
      const filtered = {
        xp: mockTrendData.xp.slice(-timeRange),
        completion: mockTrendData.completion.slice(-timeRange),
        streak: mockTrendData.streak.slice(-timeRange),
        studyTime: mockTrendData.studyTime.slice(-timeRange),
      };
      setTrendData(filtered);
    } finally {
      setLoading(false);
    }
  };

  const total = series.reduce((acc, item) => acc + (item[dimension] || 0), 0);
  const average = total / (series.length || 1);

  // 计算统计数据
  const latestXP = trendData.xp[trendData.xp.length - 1]?.value || 0;
  const latestCompletion = trendData.completion[trendData.completion.length - 1]?.value || 0;
  const currentStreak = trendData.streak[trendData.streak.length - 1]?.value || 0;
  const totalStudyTime = trendData.studyTime.reduce((sum, item) => sum + item.value, 0);
  const avgStudyTime = totalStudyTime / trendData.studyTime.length;

  return (
    <div style={{ padding: '2rem', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* 页面标题 */}
      <header style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            marginBottom: '0.5rem',
            color: 'var(--text-primary)',
          }}
        >
          📈 学习趋势分析
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          查看孩子的学习进展和成长趋势
        </p>
      </header>

      {/* 时间范围选择 */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '12px' }}>
        {[
          { label: '最近7天', value: 7 },
          { label: '最近30天', value: 30 },
          { label: '最近90天', value: 90 },
        ].map((option) => (
          <Button
            key={option.value}
            type={timeRange === option.value ? 'primary' : 'default'}
            onClick={() => setTimeRange(option.value as 7 | 30 | 90)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '2rem' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background:
                'linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(167, 139, 250, 0.05))',
              border: '1px solid rgba(167, 139, 250, 0.2)',
            }}
          >
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)' }}>当前 XP</span>}
              value={latestXP}
              valueStyle={{ color: '#a78bfa', fontWeight: 700 }}
              suffix="点"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background:
                'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            }}
          >
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)' }}>完成关卡</span>}
              value={latestCompletion}
              valueStyle={{ color: '#22c55e', fontWeight: 700 }}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background:
                'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))',
              border: '1px solid rgba(245, 158, 11, 0.2)',
            }}
          >
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)' }}>连续学习</span>}
              value={currentStreak}
              valueStyle={{ color: '#f59e0b', fontWeight: 700 }}
              prefix="🔥"
              suffix="天"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background:
                'linear-gradient(135deg, rgba(93, 168, 255, 0.15), rgba(93, 168, 255, 0.05))',
              border: '1px solid rgba(93, 168, 255, 0.2)',
            }}
          >
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)' }}>平均学习时长</span>}
              value={avgStudyTime.toFixed(1)}
              valueStyle={{ color: '#5da8ff', fontWeight: 700 }}
              suffix="分钟/天"
            />
          </Card>
        </Col>
      </Row>

      {/* 趋势图表 */}
      {loading ? (
        <Card>
          <Skeleton active />
        </Card>
      ) : (
        <Card>
          <Tabs defaultActiveKey="xp">
            <TabPane tab="经验值趋势" key="xp">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData.xp}>
                  <defs>
                    <linearGradient id="colorXP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis
                    dataKey="date"
                    stroke="var(--text-secondary)"
                    tick={{ fill: 'var(--text-secondary)' }}
                  />
                  <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    fill="url(#colorXP)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabPane>

            <TabPane tab="完成关卡数" key="completion">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData.completion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis
                    dataKey="date"
                    stroke="var(--text-secondary)"
                    tick={{ fill: 'var(--text-secondary)' }}
                  />
                  <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabPane>

            <TabPane tab="连续学习天数" key="streak">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData.streak}>
                  <defs>
                    <linearGradient id="colorStreak" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis
                    dataKey="date"
                    stroke="var(--text-secondary)"
                    tick={{ fill: 'var(--text-secondary)' }}
                  />
                  <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#colorStreak)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabPane>

            <TabPane tab="每日学习时长" key="studyTime">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData.studyTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis
                    dataKey="date"
                    stroke="var(--text-secondary)"
                    tick={{ fill: 'var(--text-secondary)' }}
                  />
                  <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#5da8ff"
                    strokeWidth={2}
                    dot={{ fill: '#5da8ff', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabPane>
          </Tabs>
        </Card>
      )}

      {/* 学习建议 */}
      <Card
        style={{
          marginTop: '2rem',
          background: 'linear-gradient(135deg, rgba(93, 168, 255, 0.1), rgba(167, 139, 250, 0.05))',
          border: '1px solid rgba(93, 168, 255, 0.2)',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: '16px',
            color: 'var(--text-primary)',
          }}
        >
          💡 学习建议
        </h3>
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {currentStreak >= 7 ? (
            <p>✅ 太棒了！已经连续学习 {currentStreak} 天，保持这个好习惯！</p>
          ) : (
            <p>💪 鼓励孩子每天坚持学习，培养良好的学习习惯。</p>
          )}
          {avgStudyTime >= 30 ? (
            <p>✅ 每日学习时长充足，学习效率很高。</p>
          ) : (
            <p>⏰ 建议每天安排至少30分钟的学习时间，效果会更好。</p>
          )}
          {latestCompletion >= 50 ? (
            <p>🎉 已完成 {latestCompletion} 个关卡，学习进度优秀！</p>
          ) : (
            <p>📚 鼓励孩子多完成一些关卡，巩固所学知识。</p>
          )}
        </div>
      </Card>
    </div>
  );
}
