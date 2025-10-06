import { useNavigate } from 'react-router-dom';

interface DailyTask {
  id: number;
  title: string;
  xp: number;
  status: 'done' | 'pending';
}

interface DailyTaskCardProps {
  tasks: DailyTask[];
}

export function DailyTaskCard({ tasks }: DailyTaskCardProps) {
  const navigate = useNavigate();

  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h2 className="kc-section-title" style={{ margin: 0 }}>
          📅 今日任务
        </h2>
        <span className="kc-tag" style={{ background: 'rgba(93, 168, 255, 0.25)' }}>
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* 进度条 */}
      <div
        style={{
          height: 8,
          width: '100%',
          borderRadius: 999,
          background: 'rgba(148, 163, 184, 0.25)',
          overflow: 'hidden',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #5da8ff, #a78bfa)',
            borderRadius: 999,
            transition: 'width 0.5s ease',
          }}
        />
      </div>

      {/* 任务列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tasks.length === 0 ? (
          <div className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>
            暂无任务
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="kc-list__item"
              style={{
                cursor: 'pointer',
                opacity: task.status === 'done' ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
              onClick={() => navigate('/tasks')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    border: '2px solid',
                    borderColor: task.status === 'done' ? '#22c55e' : '#5da8ff',
                    background: task.status === 'done' ? '#22c55e' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                  }}
                >
                  {task.status === 'done' && '✓'}
                </div>
                <span
                  style={{
                    flex: 1,
                    textDecoration: task.status === 'done' ? 'line-through' : 'none',
                  }}
                >
                  {task.title}
                </span>
              </div>
              <span className="kc-tag" style={{ background: 'rgba(245, 158, 11, 0.25)' }}>
                +{task.xp} XP
              </span>
            </div>
          ))
        )}
      </div>

      {tasks.length > 0 && (
        <button
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: '16px' }}
          onClick={() => navigate('/tasks')}
        >
          查看全部任务
        </button>
      )}
    </div>
  );
}
