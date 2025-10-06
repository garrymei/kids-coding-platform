import { useNavigate } from 'react-router-dom';

interface Achievement {
  id: string;
  title: string;
  icon: string;
  description?: string;
  unlockedAt?: string;
}

interface AchievementsCardProps {
  achievements: Achievement[];
  totalAchievements?: number;
}

export function AchievementsCard({ achievements, totalAchievements = 20 }: AchievementsCardProps) {
  const navigate = useNavigate();
  const unlockedCount = achievements.length;

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
          🏆 最近成就
        </h2>
        <span className="kc-tag" style={{ background: 'rgba(245, 158, 11, 0.25)' }}>
          {unlockedCount}/{totalAchievements}
        </span>
      </div>

      {achievements.length === 0 ? (
        <div
          className="text-muted"
          style={{
            textAlign: 'center',
            padding: '40px 20px',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎖️</div>
          <p>继续学习解锁更多成就</p>
        </div>
      ) : (
        <>
          {/* 成就网格 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            {achievements.slice(0, 6).map((achievement) => (
              <div
                key={achievement.id}
                style={{
                  background:
                    'linear-gradient(135deg, rgba(93, 168, 255, 0.15), rgba(167, 139, 250, 0.15))',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  border: '1px solid rgba(93, 168, 255, 0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => navigate('/achievements')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(93, 168, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{achievement.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, wordBreak: 'break-word' }}>
                  {achievement.title}
                </div>
              </div>
            ))}
          </div>

          {/* 最新解锁提示 */}
          {achievements.length > 0 && achievements[0].unlockedAt && (
            <div
              className="alert alert-success"
              style={{
                padding: '12px 16px',
                fontSize: '14px',
                marginBottom: '12px',
              }}
            >
              🎉 刚刚解锁了 "{achievements[0].title}"！
            </div>
          )}
        </>
      )}

      <button
        className="btn btn-ghost"
        style={{ width: '100%' }}
        onClick={() => navigate('/achievements')}
      >
        查看全部成就
      </button>
    </div>
  );
}
