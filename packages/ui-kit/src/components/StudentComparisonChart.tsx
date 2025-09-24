import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ComparisonData {
  studentId: string;
  studentName?: string;
  accuracy: number;
  tasks_done: number;
  time_spent_min: number;
  rank: number;
  isAnonymous?: boolean;
}

interface StudentComparisonChartProps {
  data: ComparisonData[];
  title?: string;
  height?: number;
  showMetrics?: string[];
  isTeacher?: boolean;
}

const StudentComparisonChart: React.FC<StudentComparisonChartProps> = ({
  data,
  title = '学生对比',
  height = 400,
  showMetrics = ['accuracy', 'tasks_done'],
  isTeacher = false,
}) => {
  // 格式化数据用于图表显示
  const chartData = data.map((item) => ({
    ...item,
    name: item.studentName || `学生${item.studentId.slice(-4)}`,
    accuracy_percent: Math.round(item.accuracy * 100),
    time_spent_hours: Math.round((item.time_spent_min / 60) * 10) / 10, // 转换为小时，保留1位小数
  }));

  const getMetricConfig = (metric: string) => {
    switch (metric) {
      case 'accuracy':
        return {
          key: 'accuracy_percent',
          name: '准确率(%)',
          color: '#8884d8',
        };
      case 'tasks_done':
        return {
          key: 'tasks_done',
          name: '完成任务数',
          color: '#82ca9d',
        };
      case 'time_spent_min':
        return {
          key: 'time_spent_hours',
          name: '学习时长(小时)',
          color: '#ffc658',
        };
      default:
        return null;
    }
  };

  const visibleMetrics = showMetrics.map(getMetricConfig).filter(Boolean) as Array<{
    key: string;
    name: string;
    color: string;
  }>;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
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
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>排名: #{data.rank}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: height }}>
      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {visibleMetrics.map((metric) => (
            <Bar key={metric.key} dataKey={metric.key} fill={metric.color} name={metric.name} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StudentComparisonChart;
