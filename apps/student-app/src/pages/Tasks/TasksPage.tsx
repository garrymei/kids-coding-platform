import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Task {
  id: number;
  title: string;
  description: string;
  xp: number;
  status: 'done' | 'pending';
  category: 'daily' | 'weekly' | 'achievement';
  progress?: {
    current: number;
    target: number;
  };
  relatedLevelId?: string;
}

// Mock 数据
const mockTasks: Task[] = [
  {
    id: 1,
    title: '完成2个循环关卡',
    description: '通过任意2个包含循环的编程关卡',
    xp: 50,
    status: 'done',
    category: 'daily',
    progress: { current: 2, target: 2 },
    relatedLevelId: 'loops-1',
  },
  {
    id: 2,
    title: '连续登录3天',
    description: '保持学习热情，连续3天访问平台',
    xp: 30,
    status: 'pending',
    category: 'daily',
    progress: { current: 2, target: 3 },
  },
  {
    id: 3,
    title: '解锁一个新成就',
    description: '完成特定挑战，解锁任意一个新成就',
    xp: 25,
    status: 'pending',
    category: 'daily',
  },
  {
    id: 4,
    title: '本周完成5个关卡',
    description: '本周内完成任意5个编程关卡',
    xp: 100,
    status: 'pending',
    category: 'weekly',
    progress: { current: 3, target: 5 },
  },
  {
    id: 5,
    title: '学习30分钟',
    description: '今日累计学习时长达到30分钟',
    xp: 40,
    status: 'pending',
    category: 'daily',
    progress: { current: 15, target: 30 },
  },
];

export default function TasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly'>('all');

  useEffect(() => {
    // 模拟加载任务数据
    setTasks(mockTasks);
  }, []);

  const filteredTasks = tasks.filter((task) => filter === 'all' || task.category === filter);

  const dailyTasks = tasks.filter((t) => t.category === 'daily');
  const dailyCompleted = dailyTasks.filter((t) => t.status === 'done').length;
  const dailyProgress = dailyTasks.length > 0 ? (dailyCompleted / dailyTasks.length) * 100 : 0;

  const totalXPEarned = tasks.filter((t) => t.status === 'done').reduce((sum, t) => sum + t.xp, 0);

  const totalXPAvailable = tasks
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + t.xp, 0);

  const handleTaskClick = (task: Task) => {
    if (task.relatedLevelId) {
      navigate(`/play/${task.relatedLevelId}`);
    }
  };

  return (
    <div className="kc-container" style={{ padding: '2rem 0' }}>
      {/* 页面标题和统计 */}
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="kc-section-title" style={{ fontSize: '28px', marginBottom: '1rem' }}>
          📅 每日任务
        </h1>
        <div className="grid duo" style={{ gap: '16px' }}>
          <div className="card kpi-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="text-muted" style={{ fontSize: '14px' }}>
                  今日进度
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px' }}>
                  {dailyCompleted}/{dailyTasks.length}
                </div>
              </div>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `conic-gradient(#5da8ff ${dailyProgress}%, rgba(148,163,184,.25) 0)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 700,
                  }}
                >
                  {Math.round(dailyProgress)}%
                </div>
              </div>
            </div>
          </div>
          <div
            className="card"
            style={{
              padding: '20px',
              background:
                'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))',
            }}
          >
            <div className="text-muted" style={{ fontSize: '14px' }}>
              经验值
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b', marginTop: '8px' }}>
              已获得 +{totalXPEarned} XP
            </div>
            <div className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
              还可获得 {totalXPAvailable} XP
            </div>
          </div>
        </div>
      </header>

      {/* 筛选标签 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem' }}>
        {[
          { key: 'all', label: '全部' },
          { key: 'daily', label: '每日' },
          { key: 'weekly', label: '每周' },
        ].map((tab) => (
          <button
            key={tab.key}
            className="btn"
            style={{
              background: filter === tab.key ? 'var(--grad-cta)' : 'rgba(148, 163, 184, 0.12)',
              border: filter === tab.key ? '1px solid #5da8ff' : '1px solid transparent',
            }}
            onClick={() => setFilter(tab.key as typeof filter)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 任务列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="card"
            style={{
              padding: '24px',
              cursor: task.relatedLevelId ? 'pointer' : 'default',
              opacity: task.status === 'done' ? 0.7 : 1,
              transition: 'all 0.2s ease',
              border: task.status === 'done' ? '1px solid rgba(34, 197, 94, 0.3)' : undefined,
            }}
            onClick={() => handleTaskClick(task)}
            onMouseEnter={(e) => {
              if (task.relatedLevelId && task.status !== 'done') {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(93, 168, 255, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow)';
            }}
          >
            <div style={{ display: 'flex', gap: '20px' }}>
              {/* 状态图标 */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 999,
                  border: '3px solid',
                  borderColor: task.status === 'done' ? '#22c55e' : '#5da8ff',
                  background:
                    task.status === 'done' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(93, 168, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                {task.status === 'done' ? '✓' : '📝'}
              </div>

              {/* 任务信息 */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        marginBottom: '4px',
                        textDecoration: task.status === 'done' ? 'line-through' : 'none',
                      }}
                    >
                      {task.title}
                    </h3>
                    <p className="text-muted" style={{ fontSize: '14px', margin: 0 }}>
                      {task.description}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span
                      className="kc-tag"
                      style={{ background: 'rgba(245, 158, 11, 0.25)', fontSize: '14px' }}
                    >
                      +{task.xp} XP
                    </span>
                    {task.category === 'weekly' && (
                      <span className="kc-tag" style={{ background: 'rgba(167, 139, 250, 0.25)' }}>
                        每周
                      </span>
                    )}
                  </div>
                </div>

                {/* 进度条 */}
                {task.progress && (
                  <div style={{ marginTop: '12px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}
                    >
                      <span className="text-muted" style={{ fontSize: '12px' }}>
                        进度
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>
                        {task.progress.current} / {task.progress.target}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        width: '100%',
                        borderRadius: 999,
                        background: 'rgba(148, 163, 184, 0.25)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${(task.progress.current / task.progress.target) * 100}%`,
                          background:
                            task.status === 'done'
                              ? '#22c55e'
                              : 'linear-gradient(90deg, #5da8ff, #a78bfa)',
                          borderRadius: 999,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
