import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, message, Tabs, Modal, Input } from 'antd';

const { TextArea } = Input;
const { TabPane } = Tabs;

interface ClassStats {
  classId: string;
  className: string;
  totalStudents: number;
  activeStudents: number;
  avgCompletionRate: number;
  avgXP: number;
  avgRetryCount: number;
  lastUpdated: string;
}

interface StudentWork {
  id: string;
  studentId: string;
  studentName: string;
  avatar?: string;
  title: string;
  coverUrl: string;
  type: 'pixel' | 'maze' | 'led' | 'music';
  createdAt: string;
  likes: number;
  comments: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: string;
  }>;
}

interface StudentData {
  id: string;
  name: string;
  xp: number;
  completionRate: number;
  lastActive: string;
  streak: number;
}

// Mock 数据
const mockStats: ClassStats = {
  classId: 'class_1',
  className: 'Python入门班',
  totalStudents: 24,
  activeStudents: 18,
  avgCompletionRate: 68.5,
  avgXP: 1250,
  avgRetryCount: 2.3,
  lastUpdated: new Date().toISOString(),
};

const mockWorks: StudentWork[] = [
  {
    id: 'work_1',
    studentId: 'stu_1',
    studentName: '小明',
    title: '点阵笑脸',
    coverUrl: '🙂',
    type: 'pixel',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    likes: 12,
    comments: [
      { id: 'c1', author: '张老师', content: '做得很棒！', createdAt: new Date().toISOString() },
    ],
  },
  {
    id: 'work_2',
    studentId: 'stu_2',
    studentName: '小红',
    title: 'LED灯光秀',
    coverUrl: '💡',
    type: 'led',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    likes: 8,
    comments: [],
  },
  {
    id: 'work_3',
    studentId: 'stu_3',
    studentName: '小华',
    title: '音乐旋律',
    coverUrl: '🎵',
    type: 'music',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    likes: 15,
    comments: [],
  },
];

const mockStudents: StudentData[] = [
  {
    id: 'stu_1',
    name: '小明',
    xp: 1500,
    completionRate: 85,
    lastActive: new Date(Date.now() - 3600000).toISOString(),
    streak: 7,
  },
  {
    id: 'stu_2',
    name: '小红',
    xp: 1200,
    completionRate: 72,
    lastActive: new Date(Date.now() - 7200000).toISOString(),
    streak: 5,
  },
  {
    id: 'stu_3',
    name: '小华',
    xp: 980,
    completionRate: 60,
    lastActive: new Date(Date.now() - 86400000).toISOString(),
    streak: 3,
  },
];

export function ClassOverview() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [works, setWorks] = useState<StudentWork[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [currentWork, setCurrentWork] = useState<StudentWork | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStats(mockStats);
      setWorks(mockWorks);
      setStudents(mockStudents);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!students.length) {
      message.warning('暂无数据可导出');
      return;
    }

    // 生成CSV内容
    const headers = ['学生ID', '姓名', 'XP', '完成率(%)', '最近活跃', '连续天数'];
    const rows = students.map((s) => [
      s.id,
      s.name,
      s.xp,
      s.completionRate,
      new Date(s.lastActive).toLocaleString('zh-CN'),
      s.streak,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

    // 下载CSV
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `班级数据_${stats?.className}_${new Date().toISOString().split('T')[0]}.csv`,
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success('导出成功');
  };

  const handleCommentWork = (work: StudentWork) => {
    setCurrentWork(work);
    setCommentModalVisible(true);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      message.warning('请输入评论内容');
      return;
    }

    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      message.success('评论成功');
      setCommentModalVisible(false);
      setCommentText('');
      loadData(); // 重新加载数据
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('评论失败:', error);
      message.error('评论失败');
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-gray-100">
        <div className="card" style={{ padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <p>加载班级数据中...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-gray-100">
        <div className="card alert-error" style={{ padding: '40px' }}>
          <h3>加载失败</h3>
          <p>无法加载班级数据</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* 页面标题 */}
      <header
        style={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              marginBottom: '0.5rem',
              color: 'var(--text-primary)',
            }}
          >
            📊 {stats.className}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            最后更新：{new Date(stats.lastUpdated).toLocaleString('zh-CN')}
          </p>
        </div>
        <Button type="primary" onClick={handleExportCSV}>
          📥 导出数据 (CSV)
        </Button>
      </header>

      {/* 统计卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '2rem',
        }}
      >
        <div
          className="card"
          style={{
            padding: '24px',
            background:
              'linear-gradient(135deg, rgba(93, 168, 255, 0.15), rgba(93, 168, 255, 0.05))',
          }}
        >
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
            学生总数
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#5da8ff' }}>
            {stats.totalStudents}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))',
          }}
        >
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
            活跃学生
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#22c55e' }}>
            {stats.activeStudents}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '24px',
            background:
              'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))',
          }}
        >
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
            平均完成率
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#f59e0b' }}>
            {stats.avgCompletionRate.toFixed(1)}%
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '24px',
            background:
              'linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(167, 139, 250, 0.05))',
          }}
        >
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
            平均 XP
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#a78bfa' }}>{stats.avgXP}</div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="card" style={{ padding: '24px' }}>
        <Tabs defaultActiveKey="students">
          <TabPane tab="学生列表" key="students">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(148, 163, 184, 0.2)' }}>
                    <th
                      style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)' }}
                    >
                      学生
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      XP
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      完成率
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      连续天数
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      最近活跃
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      style={{
                        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                        transition: 'background 0.2s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(93, 168, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                      onClick={() => navigate(`/students/${student.id}`)}
                    >
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {student.name}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          textAlign: 'center',
                          color: '#a78bfa',
                          fontWeight: 700,
                        }}
                      >
                        {student.xp}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            background:
                              student.completionRate >= 80
                                ? 'rgba(34, 197, 94, 0.2)'
                                : student.completionRate >= 60
                                  ? 'rgba(245, 158, 11, 0.2)'
                                  : 'rgba(239, 68, 68, 0.2)',
                            color:
                              student.completionRate >= 80
                                ? '#22c55e'
                                : student.completionRate >= 60
                                  ? '#f59e0b'
                                  : '#ef4444',
                            fontWeight: 700,
                          }}
                        >
                          {student.completionRate}%
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          textAlign: 'center',
                          color: 'var(--text-primary)',
                        }}
                      >
                        🔥 {student.streak} 天
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          textAlign: 'center',
                          color: 'var(--text-secondary)',
                          fontSize: '13px',
                        }}
                      >
                        {new Date(student.lastActive).toLocaleString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabPane>

          <TabPane tab="学生作品" key="works">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {works.map((work) => (
                <div
                  key={work.id}
                  className="card"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(93, 168, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow)';
                  }}
                >
                  {/* 封面 */}
                  <div
                    style={{
                      height: 180,
                      background:
                        'linear-gradient(135deg, rgba(93, 168, 255, 0.2), rgba(167, 139, 250, 0.2))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '96px',
                    }}
                  >
                    {work.coverUrl}
                  </div>

                  {/* 信息 */}
                  <div style={{ padding: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <span
                        style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}
                      >
                        {work.studentName}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {work.type.toUpperCase()}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
                      {work.title}
                    </h3>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        marginBottom: '12px',
                      }}
                    >
                      {new Date(work.createdAt).toLocaleDateString('zh-CN')}
                    </div>

                    {/* 操作按钮 */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button size="small" onClick={() => handleCommentWork(work)}>
                        💬 评论 ({work.comments.length})
                      </Button>
                      <Button size="small">❤️ {work.likes}</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabPane>
        </Tabs>
      </div>

      {/* 评论对话框 */}
      <Modal
        title={`评论：${currentWork?.title}`}
        open={commentModalVisible}
        onOk={handleSubmitComment}
        onCancel={() => {
          setCommentModalVisible(false);
          setCommentText('');
        }}
        okText="发布评论"
        cancelText="取消"
      >
        {currentWork && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              作者：{currentWork.studentName}
            </p>
            {currentWork.comments.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>已有评论：</h4>
                {currentWork.comments.map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(148, 163, 184, 0.1)',
                      borderRadius: '8px',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      {comment.author}
                    </div>
                    <div style={{ fontSize: '13px' }}>{comment.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <TextArea
          rows={4}
          placeholder="输入你的评论..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
      </Modal>
    </div>
  );
}
