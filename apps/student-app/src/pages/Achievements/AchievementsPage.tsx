import { useState, useEffect, useMemo } from 'react';
import {
  fetchAchievementList,
  fetchAchievementProfile,
  type AchievementItem,
  type AchievementProfile,
} from '../../services/achievements';

const rarityConfig: Record<
  AchievementItem['rarity'],
  { label: string; color: string; glow: string }
> = {
  common: { label: '普通', color: '#94a3b8', glow: 'rgba(148, 163, 184, 0.3)' },
  rare: { label: '稀有', color: '#5da8ff', glow: 'rgba(93, 168, 255, 0.4)' },
  epic: { label: '史诗', color: '#a78bfa', glow: 'rgba(167, 139, 250, 0.4)' },
  legendary: { label: '传说', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' },
};

const categoryLabels: Record<AchievementItem['category'], string> = {
  streak: '坚持',
  completion: '完成',
  xp: '经验',
  special: '特殊',
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [profile, setProfile] = useState<AchievementProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | AchievementItem['category']>('all');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [profileData, achievementList] = await Promise.all([
          fetchAchievementProfile(),
          fetchAchievementList(),
        ]);
        if (!mounted) return;
        setProfile(profileData);
        setAchievements(achievementList);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const unlockedCount = useMemo(
    () => achievements.filter((a) => a.unlocked).length,
    [achievements],
  );
  const totalCount = achievements.length || 1;
  const totalXPEarned = useMemo(
    () => achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0),
    [achievements],
  );

  const filteredAchievements = useMemo(
    () => achievements.filter((a) => filter === 'all' || a.category === filter),
    [achievements, filter],
  );

  return (
    <div className="kc-container" style={{ padding: '2rem 0' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="kc-section-title" style={{ fontSize: '28px', marginBottom: '1rem' }}>
          🏆 成就中心
        </h1>

        {profile && (
          <div
            className="card"
            style={{
              padding: '24px',
              marginBottom: '16px',
              display: 'flex',
              gap: 24,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div className="text-muted" style={{ fontSize: 14 }}>
                当前等级
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, marginTop: 8 }}>Lv.{profile.level}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                总经验 {profile.xp} XP
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              <div
                style={{
                  height: 12,
                  borderRadius: 999,
                  background: 'rgba(148, 163, 184, 0.2)',
                  overflow: 'hidden',
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(
                      100,
                      ((profile.xp - profile.levelStartXp) /
                        Math.max(profile.nextLevelXp - profile.levelStartXp, 1)) *
                        100,
                    ).toFixed(2)}%`,
                    background: 'linear-gradient(90deg, #5da8ff, #a78bfa)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                距离下一等级还差 {profile.xpForNextLevel} XP
              </div>
            </div>

            <div style={{ minWidth: 160 }}>
              <div className="text-muted" style={{ fontSize: 14 }}>
                宠物状态
              </div>
              <div style={{ fontSize: 28 }}>
                {['🐾', '🐣', '🦊', '🐉', '🌟'][profile.pet.stage - 1] ?? '🌱'}
              </div>
              <div style={{ fontWeight: 600 }}>{profile.pet.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Mood: {profile.pet.mood}
              </div>
            </div>
          </div>
        )}

        <div className="grid duo" style={{ gap: '16px' }}>
          <div className="card kpi-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="text-muted" style={{ fontSize: 14 }}>
                  解锁进度
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>
                  {unlockedCount}/{achievements.length}
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
                    fontSize: 18,
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
            <div className="text-muted" style={{ fontSize: 14 }}>
              成就奖励
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#a78bfa', marginTop: 8 }}>
              +{totalXPEarned} XP
            </div>
            <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
              来自 {unlockedCount} 个成就
            </div>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
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
            onClick={() => setFilter(key as AchievementItem['category'])}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && achievements.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '32px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          正在加载成就数据...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredAchievements.map((achievement) => {
            const rarity = rarityConfig[achievement.rarity];
            const progressRatio =
              achievement.progress && achievement.progress.target > 0
                ? Math.min(100, (achievement.progress.current / achievement.progress.target) * 100)
                : 0;
            return (
              <div
                key={achievement.id}
                className="card"
                style={{
                  padding: '24px',
                  opacity: achievement.unlocked ? 1 : 0.6,
                  border: achievement.unlocked
                    ? `2px solid ${rarity.color}`
                    : '1px solid rgba(148, 163, 184, 0.2)',
                  boxShadow: achievement.unlocked ? `0 8px 24px ${rarity.glow}` : 'var(--shadow)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = achievement.unlocked
                    ? `0 16px 32px ${rarity.glow}`
                    : '0 12px 24px rgba(15, 23, 42, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = achievement.unlocked
                    ? `0 8px 24px ${rarity.glow}`
                    : 'var(--shadow)';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      padding: '8px 14px',
                      borderRadius: 999,
                      background: rarity.glow,
                      color: rarity.color,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {rarity.label}
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      filter: achievement.unlocked ? 'none' : 'grayscale(100%)',
                    }}
                  >
                    {achievement.icon}
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <h3 style={{ fontSize: 18, margin: 0 }}>{achievement.title}</h3>
                  <p className="text-muted" style={{ marginTop: 4, fontSize: 13 }}>
                    {achievement.description}
                  </p>
                </div>

                {achievement.progress && !achievement.unlocked && (
                  <div style={{ marginBottom: 12 }}>
                    <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>
                      {achievement.progress.current} / {achievement.progress.target}
                    </div>
                    <div
                      style={{
                        height: 8,
                        borderRadius: 999,
                        background: 'rgba(148, 163, 184, 0.25)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${progressRatio}%`,
                          height: '100%',
                          background: rarity.color,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div
                  style={{
                    fontSize: 12,
                    padding: '8px 12px',
                    borderRadius: 999,
                    background: achievement.unlocked
                      ? 'rgba(34, 197, 94, 0.12)'
                      : 'rgba(148, 163, 184, 0.12)',
                    color: achievement.unlocked ? '#22c55e' : 'var(--text-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {achievement.unlocked ? '✓ 已解锁' : `+${achievement.xpReward} XP`}
                </div>

                {achievement.unlocked && achievement.unlockedAt && (
                  <div className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>
                    {new Date(achievement.unlockedAt).toLocaleDateString('zh-CN')} 解锁
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
