import { useNavigate } from 'react-router-dom';

interface NextLevel {
  id: string;
  title: string;
  type: 'io' | 'led' | 'maze' | 'pixel' | 'music';
  difficulty: number;
  xp: number;
  story?: string;
}

interface RecommendedNextLevelProps {
  nextLevel: NextLevel | null;
}

const gameTypeConfig = {
  io: { icon: '💬', label: '输入输出', color: '#5da8ff' },
  led: { icon: '💡', label: 'LED 灯阵', color: '#f59e0b' },
  maze: { icon: '🎯', label: '迷宫探索', color: '#22c55e' },
  pixel: { icon: '🎨', label: '像素绘画', color: '#a78bfa' },
  music: { icon: '🎵', label: '音乐编程', color: '#ec4899' },
};

export function RecommendedNextLevel({ nextLevel }: RecommendedNextLevelProps) {
  const navigate = useNavigate();

  if (!nextLevel) {
    return (
      <div className="card" style={{ padding: '24px' }}>
        <h2 className="kc-section-title" style={{ marginBottom: '16px' }}>
          🚀 继续学习
        </h2>
        <div
          className="text-muted"
          style={{
            textAlign: 'center',
            padding: '40px 20px',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎓</div>
          <p>太棒了！你已经完成了所有推荐课程</p>
          <button
            className="btn btn-cta"
            style={{ marginTop: '16px' }}
            onClick={() => navigate('/courses')}
          >
            探索更多课程
          </button>
        </div>
      </div>
    );
  }

  const config = gameTypeConfig[nextLevel.type];

  return (
    <div
      className="card"
      style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(93, 168, 255, 0.1), rgba(167, 139, 250, 0.1))',
        border: '1px solid rgba(93, 168, 255, 0.3)',
      }}
    >
      <h2 className="kc-section-title" style={{ marginBottom: '16px' }}>
        🚀 继续挑战
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 课程信息 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>{config.icon}</span>
            <span
              className="kc-tag"
              style={{
                background: `${config.color}33`,
                color: config.color,
              }}
            >
              {config.label}
            </span>
            <span className="kc-tag" style={{ background: 'rgba(245, 158, 11, 0.25)' }}>
              难度 {nextLevel.difficulty}
            </span>
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
            {nextLevel.title}
          </h3>
          {nextLevel.story && (
            <p className="text-muted" style={{ fontSize: '14px', lineHeight: 1.5 }}>
              {nextLevel.story}
            </p>
          )}
        </div>

        {/* 奖励信息 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: 'rgba(245, 158, 11, 0.15)',
            borderRadius: '12px',
            border: '1px solid rgba(245, 158, 11, 0.25)',
          }}
        >
          <span style={{ fontSize: '24px' }}>⭐</span>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>完成可获得</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b' }}>
              +{nextLevel.xp} XP
            </div>
          </div>
        </div>

        {/* 开始按钮 */}
        <button
          className="btn btn-cta"
          style={{ width: '100%', fontSize: '16px', height: '48px' }}
          onClick={() => navigate(`/play/${nextLevel.id}`)}
        >
          开始学习 →
        </button>
      </div>
    </div>
  );
}
