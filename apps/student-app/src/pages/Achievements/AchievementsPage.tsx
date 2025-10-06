import { useState, useEffect } from 'react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'completion' | 'xp' | 'special';
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: {
    current: number;
    target: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Mock 数据
const mockAchievements: Achievement[] = [
  {
    id: 'streak-3',
    title: '三天坚持',
    description: '连续登录3天',
    icon: '🔥',
    category: 'streak',
    xpReward: 30,
    unlocked: true,
    unlockedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    rarity: 'common',
  },
  {
    id: 'streak-7',
    title: '一周坚持',
    description: '连续登录7天',
    icon: '🔥',
    category: 'streak',
    xpReward: 100,
    unlocked: true,
    unlockedAt: new Date().toISOString(),
    rarity: 'rare',
  },
  {
    id: 'streak-30',
    title: '月度坚持者',
    description: '连续登录30天',
    icon: '🔥',
    category: 'streak',
    xpReward: 500,
    unlocked: false,
    progress: { current: 7, target: 30 },
    rarity: 'epic',
  },
  {
    id: 'maze-5',
    title: '迷宫新手',
    description: '完成5个迷宫关卡',
    icon: '🎯',
    category: 'completion',
    xpReward: 50,
    unlocked: true,
    unlockedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    rarity: 'common',
  },
  {
    id: 'maze-20',
    title: '迷宫大师',
    description: '完成20个迷宫关卡',
    icon: '🏆',
    category: 'completion',
    xpReward: 200,
    unlocked: false,
    progress: { current: 5, target: 20 },
    rarity: 'rare',
  },
  {
    id: 'loop-master',
    title: '循环达人',
    description: '完成所有循环相关关卡',
    icon: '🔄',
    category: 'completion',
    xpReward: 150,
    unlocked: true,
    unlockedAt: new Date(Date.now() - 86400000).toISOString(),
    rarity: 'rare',
  },
  {
    id: 'pixel-artist',
    title: '像素艺术家',
    description: '创作10个像素作品',
    icon: '🎨',
    category: 'special',
    xpReward: 100,
    unlocked: false,
    progress: { current: 3, target: 10 },
    rarity: 'rare',
  },
  {
    id: 'xp-1000',
    title: '经验新秀',
    description: '累计获得1000 XP',
    icon: '⭐',
    category: 'xp',
    xpReward: 50,
    unlocked: true,
    unlockedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    rarity: 'common',
  },
  {
    id: 'xp-5000',
    title: '经验高手',
    description: '累计获得5000 XP',
    icon: '✨',
    category: 'xp',
    xpReward: 200,
    unlocked: false,
    progress: { current: 1200, target: 5000 },
    rarity: 'epic',
  },
  {
    id: 'perfectionist',
    title: '完美主义者',
    description: '10个关卡全部满星通过',
    icon: '💎',
    category: 'special',
    xpReward: 300,
    unlocked: false,
    progress: { current: 3, target: 10 },
    rarity: 'legendary',
  },
];

const rarityConfig = {
  common: { label: '普通', color: '#94a3b8', glow: 'rgba(148, 163, 184, 0.3)' },
  rare: { label: '稀有', color: '#5da8ff', glow: 'rgba(93, 168, 255, 0.4)' },
  epic: { label: '史诗', color: '#a78bfa', glow: 'rgba(167, 139, 250, 0.4)' },
  legendary: { label: '传说', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' },
};

const categoryLabels = {
  streak: '坚持',
  completion: '完成',
  xp: '经验',
  special: '特殊',
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState<'all' | Achievement['category']>('all');

  useEffect(() => {
    setAchievements(mockAchievements);
  }, []);

  const filteredAchievements = achievements.filter(
    (a) => filter === 'all' || a.category === filter,
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const totalXPEarned = achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.xpReward, 0);

  return (
    <div className="kc-container" style={{ padding: '2rem 0' }}>
      {/* 页面标题和统计 */}
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="kc-section-title" style={{ fontSize: '28px', marginBottom: '1rem' }}>
          🏆 成就中心
        </h1>

        <div className="grid duo" style={{ gap: '16px' }}>
          <div className="card kpi-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="text-muted" style={{ fontSize: '14px' }}>
                  解锁进度
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px' }}>
                  {unlockedCount}/{totalCount}
                </div>
              </div>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `conic-gradient(#a78bfa ${(unlockedCount / totalCount) * 100}%, rgba(148,163,184,.25) 0)`,
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
                  {Math.round((unlockedCount / totalCount) * 100)}%
                </div>
              </div>
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
            <div className="text-muted" style={{ fontSize: '14px' }}>
              成就奖励
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#a78bfa', marginTop: '8px' }}>
              +{totalXPEarned} XP
            </div>
            <div className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
              来自 {unlockedCount} 个成就
            </div>
          </div>
        </div>
      </header>

      {/* 筛选标签 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          className="btn"
          style={{
            background: filter === 'all' ? 'var(--grad-cta)' : 'rgba(148, 163, 184, 0.12)',
            border: filter === 'all' ? '1px solid #5da8ff' : '1px solid transparent',
          }}
          onClick={() => setFilter('all')}
        >
          全部
        </button>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button
            key={key}
            className="btn"
            style={{
              background: filter === key ? 'var(--grad-cta)' : 'rgba(148, 163, 184, 0.12)',
              border: filter === key ? '1px solid #5da8ff' : '1px solid transparent',
            }}
            onClick={() => setFilter(key as Achievement['category'])}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 成就网格 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredAchievements.map((achievement) => {
          const rarity = rarityConfig[achievement.rarity];
          return (
            <div
              key={achievement.id}
              className="card"
              style={{
                padding: '24px',
                opacity: achievement.unlocked ? 1 : 0.6,
                border: achievement.unlocked
                  ? `2px solid ${rarity.color}`
                  : '1px solid var(--border)',
                boxShadow: achievement.unlocked ? `0 8px 24px ${rarity.glow}` : 'var(--shadow)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (achievement.unlocked) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 12px 32px ${rarity.glow}`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = achievement.unlocked
                  ? `0 8px 24px ${rarity.glow}`
                  : 'var(--shadow)';
              }}
            >
              {/* 稀有度标签 */}
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: rarity.color,
                  color: '#fff',
                }}
              >
                {rarity.label}
              </div>

              {/* 图标 */}
              <div
                style={{
                  fontSize: '64px',
                  textAlign: 'center',
                  marginBottom: '16px',
                  filter: achievement.unlocked ? 'none' : 'grayscale(100%)',
                }}
              >
                {achievement.icon}
              </div>

              {/* 标题和描述 */}
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  marginBottom: '8px',
                  textAlign: 'center',
                }}
              >
                {achievement.title}
              </h3>
              <p
                className="text-muted"
                style={{ fontSize: '14px', textAlign: 'center', marginBottom: '12px' }}
              >
                {achievement.description}
              </p>

              {/* 进度条 */}
              {achievement.progress && !achievement.unlocked && (
                <div style={{ marginBottom: '12px' }}>
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
                      {achievement.progress.current} / {achievement.progress.target}
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
                        width: `${(achievement.progress.current / achievement.progress.target) * 100}%`,
                        background: rarity.color,
                        borderRadius: 999,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 奖励 */}
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <span
                  className="kc-tag"
                  style={{
                    background: achievement.unlocked
                      ? 'rgba(34, 197, 94, 0.25)'
                      : 'rgba(245, 158, 11, 0.25)',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {achievement.unlocked ? '✓ 已解锁' : `+${achievement.xpReward} XP`}
                </span>
              </div>

              {/* 解锁时间 */}
              {achievement.unlocked && achievement.unlockedAt && (
                <div
                  className="text-muted"
                  style={{ fontSize: '11px', textAlign: 'center', marginTop: '8px' }}
                >
                  {new Date(achievement.unlockedAt).toLocaleDateString('zh-CN')} 解锁
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
