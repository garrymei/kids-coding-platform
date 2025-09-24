import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Button, message, Table, Tag, Space, Modal } from 'antd';
import { BarChartOutlined, LineChartOutlined, UserOutlined } from '@ant-design/icons';
import { StudentTrendChart, StudentComparisonChart } from '@kids/ui-kit';

const { Option } = Select;

interface Student {
  id: string;
  displayName: string;
  nickname?: string;
  school?: string;
  className?: string;
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

interface TrendData {
  date: string;
  time_spent_min: number;
  tasks_done: number;
  accuracy: number;
  xp: number;
  streak: number;
}

const StudentComparisonPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [trendData, setTrendData] = useState<{ [studentId: string]: TrendData[] }>({});
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'accuracy',
    'tasks_done',
    'time_spent_min',
  ]);
  const [timeWindow, setTimeWindow] = useState<string>('last_14d');
  const [viewMode, setViewMode] = useState<'comparison' | 'trend'>('comparison');
  const [selectedStudentForTrend, setSelectedStudentForTrend] = useState<string>('');

  // 获取班级学生列表
  const fetchClassStudents = async () => {
    try {
      // TODO: 调用 API 获取班级学生
      // const response = await api.get('/classes/my-classes');
      // const students = response.data.flatMap(cls => cls.students);
      // setStudents(students);

      // 模拟数据
      setStudents([
        {
          id: 'student-1',
          displayName: '小明',
          nickname: '小明',
          school: '北京市第一中学',
          className: '初一(3)班',
        },
        {
          id: 'student-2',
          displayName: '小红',
          nickname: '小红',
          school: '北京市第一中学',
          className: '初一(3)班',
        },
        {
          id: 'student-3',
          displayName: '小刚',
          nickname: '小刚',
          school: '北京市第一中学',
          className: '初一(3)班',
        },
        {
          id: 'student-4',
          displayName: '小丽',
          nickname: '小丽',
          school: '北京市第一中学',
          className: '初一(3)班',
        },
        {
          id: 'student-5',
          displayName: '小强',
          nickname: '小强',
          school: '北京市第一中学',
          className: '初一(3)班',
        },
      ]);
    } catch (error) {
      message.error('获取学生列表失败');
    }
  };

  // 获取对比数据
  const fetchComparisonData = async () => {
    if (selectedStudents.length === 0) {
      message.warning('请选择要对比的学生');
      return;
    }

    setLoading(true);
    try {
      // TODO: 调用 API 获取对比数据
      // const response = await api.post('/metrics/compare', {
      //   studentIds: selectedStudents,
      //   metrics: selectedMetrics,
      //   window: timeWindow
      // });
      // setComparisonData(response.data);

      // 模拟数据
      const mockData: ComparisonData[] = selectedStudents.map((studentId, index) => {
        const student = students.find((s) => s.id === studentId);
        return {
          studentId,
          studentName: student?.displayName || `学生${studentId.slice(-4)}`,
          accuracy: Math.random() * 0.4 + 0.6, // 0.6-1.0
          tasks_done: Math.floor(Math.random() * 50) + 20,
          time_spent_min: Math.floor(Math.random() * 1000) + 500,
          rank: index + 1,
        };
      });

      // 添加班级统计
      const avgAccuracy = mockData.reduce((sum, item) => sum + item.accuracy, 0) / mockData.length;
      const avgTasksDone =
        mockData.reduce((sum, item) => sum + item.tasks_done, 0) / mockData.length;
      const avgTimeSpent =
        mockData.reduce((sum, item) => sum + item.time_spent_min, 0) / mockData.length;

      mockData.push(
        {
          studentId: 'class_avg',
          studentName: '班级平均',
          accuracy: avgAccuracy,
          tasks_done: Math.round(avgTasksDone),
          time_spent_min: Math.round(avgTimeSpent),
          rank: 0,
          isAnonymous: true,
        },
        {
          studentId: 'class_p50',
          studentName: '班级中位数(P50)',
          accuracy: avgAccuracy * 0.95,
          tasks_done: Math.round(avgTasksDone * 0.9),
          time_spent_min: Math.round(avgTimeSpent * 0.9),
          rank: 0,
          isAnonymous: true,
        },
        {
          studentId: 'class_p90',
          studentName: '班级优秀线(P90)',
          accuracy: avgAccuracy * 1.1,
          tasks_done: Math.round(avgTasksDone * 1.2),
          time_spent_min: Math.round(avgTimeSpent * 1.1),
          rank: 0,
          isAnonymous: true,
        },
      );

      setComparisonData(mockData);
    } catch (error) {
      message.error('获取对比数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取学生趋势数据
  const fetchStudentTrend = async (studentId: string) => {
    try {
      // TODO: 调用 API 获取趋势数据
      // const response = await api.get(`/metrics/students/${studentId}/trend`, {
      //   params: {
      //     from: dayjs().subtract(14, 'day').format('YYYY-MM-DD'),
      //     to: dayjs().format('YYYY-MM-DD'),
      //     granularity: 'day'
      //   }
      // });
      // setTrendData(prev => ({ ...prev, [studentId]: response.data }));

      // 模拟数据
      const mockTrendData: TrendData[] = [];
      for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (13 - i));
        mockTrendData.push({
          date: date.toISOString().split('T')[0],
          time_spent_min: Math.floor(Math.random() * 60) + 20,
          tasks_done: Math.floor(Math.random() * 5) + 1,
          accuracy: Math.random() * 0.4 + 0.6,
          xp: Math.floor(Math.random() * 100) + 50,
          streak: Math.min(i + 1, 10),
        });
      }

      setTrendData((prev) => ({ ...prev, [studentId]: mockTrendData }));
    } catch (error) {
      message.error('获取趋势数据失败');
    }
  };

  // 处理学生选择变化
  const handleStudentSelectionChange = (value: string[]) => {
    setSelectedStudents(value);
  };

  // 处理指标选择变化
  const handleMetricsChange = (value: string[]) => {
    setSelectedMetrics(value);
  };

  // 处理时间窗口变化
  const handleTimeWindowChange = (value: string) => {
    setTimeWindow(value);
  };

  // 查看学生趋势
  const viewStudentTrend = (studentId: string) => {
    setSelectedStudentForTrend(studentId);
    setViewMode('trend');
    if (!trendData[studentId]) {
      fetchStudentTrend(studentId);
    }
  };

  useEffect(() => {
    fetchClassStudents();
  }, []);

  const studentColumns = [
    {
      title: '学生姓名',
      dataIndex: 'displayName',
      key: 'displayName',
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '学校',
      dataIndex: 'school',
      key: 'school',
    },
    {
      title: '班级',
      dataIndex: 'className',
      key: 'className',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: Student) => (
        <Space>
          <Button
            type="link"
            icon={<LineChartOutlined />}
            onClick={() => viewStudentTrend(record.id)}
          >
            查看趋势
          </Button>
        </Space>
      ),
    },
  ];

  const comparisonColumns = [
    {
      title: '学生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (name: string, record: ComparisonData) => (
        <span
          style={{
            fontWeight: record.isAnonymous ? 'normal' : 'bold',
            color: record.isAnonymous ? '#666' : '#000',
          }}
        >
          {name}
        </span>
      ),
    },
    {
      title: '准确率',
      dataIndex: 'accuracy',
      key: 'accuracy',
      render: (value: number) => `${Math.round(value * 100)}%`,
      sorter: (a: ComparisonData, b: ComparisonData) => a.accuracy - b.accuracy,
    },
    {
      title: '完成任务数',
      dataIndex: 'tasks_done',
      key: 'tasks_done',
      sorter: (a: ComparisonData, b: ComparisonData) => a.tasks_done - b.tasks_done,
    },
    {
      title: '学习时长(分钟)',
      dataIndex: 'time_spent_min',
      key: 'time_spent_min',
      render: (value: number) => `${Math.round((value / 60) * 10) / 10}小时`,
      sorter: (a: ComparisonData, b: ComparisonData) => a.time_spent_min - b.time_spent_min,
    },
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      render: (rank: number, record: ComparisonData) =>
        record.isAnonymous ? (
          <Tag color="blue">统计</Tag>
        ) : (
          <Tag color={rank <= 3 ? 'gold' : rank <= 5 ? 'orange' : 'default'}>#{rank}</Tag>
        ),
      sorter: (a: ComparisonData, b: ComparisonData) => a.rank - b.rank,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h2>学生数据对比</h2>

      {/* 控制面板 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <span>选择学生：</span>
            <Select
              mode="multiple"
              placeholder="选择要对比的学生"
              value={selectedStudents}
              onChange={handleStudentSelectionChange}
              style={{ width: '100%', marginTop: '8px' }}
            >
              {students.map((student) => (
                <Option key={student.id} value={student.id}>
                  {student.displayName}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <span>对比指标：</span>
            <Select
              mode="multiple"
              value={selectedMetrics}
              onChange={handleMetricsChange}
              style={{ width: '100%', marginTop: '8px' }}
            >
              <Option value="accuracy">准确率</Option>
              <Option value="tasks_done">完成任务数</Option>
              <Option value="time_spent_min">学习时长</Option>
            </Select>
          </Col>
          <Col span={4}>
            <span>时间窗口：</span>
            <Select
              value={timeWindow}
              onChange={handleTimeWindowChange}
              style={{ width: '100%', marginTop: '8px' }}
            >
              <Option value="last_7d">最近7天</Option>
              <Option value="last_14d">最近14天</Option>
              <Option value="last_30d">最近30天</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              onClick={fetchComparisonData}
              loading={loading}
              style={{ marginTop: '24px' }}
            >
              开始对比
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 学生列表 */}
      <Card title="班级学生列表" style={{ marginBottom: '24px' }}>
        <Table
          columns={studentColumns}
          dataSource={students}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* 对比结果 */}
      {comparisonData.length > 0 && (
        <>
          <Card title="对比结果" style={{ marginBottom: '24px' }}>
            <StudentComparisonChart
              data={comparisonData}
              title="学生对比图表"
              height={400}
              showMetrics={selectedMetrics}
              isTeacher={true}
            />
          </Card>

          <Card title="详细数据">
            <Table
              columns={comparisonColumns}
              dataSource={comparisonData}
              rowKey="studentId"
              pagination={false}
            />
          </Card>
        </>
      )}

      {/* 学生趋势模态框 */}
      <Modal
        title={`${students.find((s) => s.id === selectedStudentForTrend)?.displayName} - 学习趋势`}
        open={viewMode === 'trend' && !!selectedStudentForTrend}
        onCancel={() => setViewMode('comparison')}
        footer={null}
        width={800}
      >
        {selectedStudentForTrend && trendData[selectedStudentForTrend] && (
          <StudentTrendChart
            data={trendData[selectedStudentForTrend]}
            title="学习趋势"
            height={300}
            showMetrics={['time_spent_min', 'tasks_done', 'accuracy']}
          />
        )}
      </Modal>
    </div>
  );
};

export default StudentComparisonPage;
