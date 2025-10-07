import { useEffect, useState } from 'react';
import { useMetricsStore } from '../../stores/metrics';
import type { Dim, Period } from '@kids/utils';
import { Card, Statistic, Row, Col, Skeleton, Tabs, Button } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

const { TabPane } = Tabs;

const studentId = 'stu_1';

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
  const { fetchTrend } = useMetricsStore();
  const dimension: Dim = 'study_minutes';
  const period: Period = 'weekly';
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(7);
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState(mockTrendData);

  useEffect(() => {
    fetchTrend(studentId, [dimension], period);
    void loadTrendData();
  }, [dimension, period, timeRange, fetchTrend]);

  const loadTrendData = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
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

  const latestXP = trendData.xp.at(-1)?.value ?? 0;
  const latestCompletion = trendData.completion.at(-1)?.value ?? 0;
  const currentStreak = trendData.streak.at(-1)?.value ?? 0;
  const totalStudyTime = trendData.studyTime.reduce((sum, item) => sum + item.value, 0);
  const avgStudyTime = Math.round(totalStudyTime / trendData.studyTime.length);

  return (
    <div style={{ padding: '2rem', background: 'var(--bg-primary)', minHeight: '100vh' }}>
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
          追踪孩子的经验值、关卡进度和学习习惯变化
        </p>
      </header>

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '12px' }}>
        {[
          { label: '最近 7 天', value: 7 },
          { label: '最近 30 天', value: 30 },
          { label: '最近 90 天', value: 90 },
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

      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
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
                suffix="XP"
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
                title={<span style={{ color: 'var(--text-secondary)' }}>日均学习时长</span>}
                value={avgStudyTime}
                valueStyle={{ color: '#5da8ff', fontWeight: 700 }}
                suffix="分钟"
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Tabs defaultActiveKey="xp">
          <TabPane tab="经验值增长" key="xp">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData.xp}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="#5da8ff" strokeWidth={2} dot={{ fill: '#5da8ff', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </TabPane>

          <TabPane tab="关卡完成数量" key="completion">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData.completion}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
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
                <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} fill="url(#colorStreak)" />
              </AreaChart>
            </ResponsiveContainer>
          </TabPane>

          <TabPane tab="每日学习时长" key="studyTime">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData.studyTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="#5da8ff" strokeWidth={2} dot={{ fill: '#5da8ff', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </TabPane>
        </Tabs>
      </Card>

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
            <p>太棒了！孩子已经连续学习 {currentStreak} 天，继续保持这个好习惯。</p>
          ) : (
            <p>建议鼓励孩子每天安排时间学习，逐步培养持续学习的节奏。</p>
          )}
          {avgStudyTime >= 30 ? (
            <p>日均学习时长达到 {avgStudyTime} 分钟，证明学习投入稳定。</p>
          ) : (
            <p>可以尝试每天安排至少 30 分钟的学习时间，帮助建立规律。</p>
          )}
          {latestCompletion >= 50 ? (
            <p>已经完成 {latestCompletion} 个关卡，学习进度很扎实，记得及时复习巩固。</p>
          ) : (
            <p>可以与孩子一起设定小目标，逐步推进新的关卡，积累成就感。</p>
          )}
        </div>
      </Card>
    </div>
  );
}