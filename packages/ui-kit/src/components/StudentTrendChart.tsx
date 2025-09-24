import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TrendData {
  date: string;
  time_spent_min: number;
  tasks_done: number;
  accuracy: number;
  xp: number;
  streak: number;
}

interface StudentTrendChartProps {
  data: TrendData[];
  title?: string;
  height?: number;
  showMetrics?: string[];
}

const StudentTrendChart: React.FC<StudentTrendChartProps> = ({
  data,
  title = '学习趋势',
  height = 400,
  showMetrics = ['time_spent_min', 'tasks_done', 'accuracy'],
}) => {
  // 格式化数据用于图表显示
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    }),
    accuracy_percent: Math.round(item.accuracy * 100),
  }));

  const getMetricConfig = (metric: string) => {
    switch (metric) {
      case 'time_spent_min':
        return {
          key: 'time_spent_min',
          name: '学习时长(分钟)',
          color: '#8884d8',
          unit: '分钟',
        };
      case 'tasks_done':
        return {
          key: 'tasks_done',
          name: '完成任务数',
          color: '#82ca9d',
          unit: '个',
        };
      case 'accuracy':
        return {
          key: 'accuracy_percent',
          name: '准确率(%)',
          color: '#ffc658',
          unit: '%',
        };
      case 'xp':
        return {
          key: 'xp',
          name: '经验值',
          color: '#ff7300',
          unit: 'XP',
        };
      case 'streak':
        return {
          key: 'streak',
          name: '连续天数',
          color: '#00ff00',
          unit: '天',
        };
      default:
        return null;
    }
  };

  const visibleMetrics = showMetrics.map(getMetricConfig).filter(Boolean) as Array<{
    key: string;
    name: string;
    color: string;
    unit: string;
  }>;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: '2px 0', color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: height }}>
      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {visibleMetrics.map((metric) => (
            <Line
              key={metric.key}
              type="monotone"
              dataKey={metric.key}
              stroke={metric.color}
              strokeWidth={2}
              dot={{ r: 4 }}
              name={metric.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StudentTrendChart;
