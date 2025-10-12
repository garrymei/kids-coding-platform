import { useEffect, useState } from 'react';
import { fetchAchievementProfile, type AchievementProfile } from '../../services/achievements';

export default function ProfilePage() {
  const [profile, setProfile] = useState<AchievementProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchAchievementProfile();
        if (mounted) {
          setProfile(data);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading && !profile) {
    return (
      <div className="kc-container" style={{ padding: '2rem 0' }}>
        <div
          className="card"
          style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}
        >
          正在加载个人数据...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="kc-container" style={{ padding: '2rem 0' }}>
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          暂无个人数据
        </div>
      </div>
    );
  }

  const completionRatio = Math.min(
    100,
    ((profile.xp - profile.levelStartXp) /
      Math.max(profile.nextLevelXp - profile.levelStartXp, 1)) *
      100,
  );

  return (
    <div
      className="kc-container"
      style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      <section
        className="card"
        style={{ padding: '24px', display: 'flex', gap: 32, flexWrap: 'wrap' }}
      >
        <div>
          <div className="text-muted" style={{ fontSize: 14 }}>
            当前等级
          </div>
          <div style={{ fontSize: 42, fontWeight: 800 }}>Lv.{profile.level}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>累计 XP {profile.xp}</div>
        </div>

        <div style={{ flex: 1, minWidth: 240 }}>
          <div
            style={{
              height: 12,
              borderRadius: 999,
              background: 'rgba(148, 163, 184, 0.2)',
              overflow: 'hidden',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${completionRatio.toFixed(2)}%`,
                background: 'linear-gradient(90deg, #5da8ff, #a78bfa)',
              }}
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            距离下一等级还差 {profile.xpForNextLevel} XP
          </div>
        </div>

        <div style={{ minWidth: 200 }}>
          <div className="text-muted" style={{ fontSize: 14 }}>
            宠物伙伴
          </div>
          <div style={{ fontSize: 32, margin: '8px 0' }}>
            {['🐾', '🐣', '🦊', '🐉', '🌟'][profile.pet.stage - 1] ?? '🌱'}
          </div>
          <div style={{ fontWeight: 600 }}>{profile.pet.label}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            心情：{profile.pet.mood}
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: '24px' }}>
        <h2 className="kc-section-title" style={{ fontSize: 20, marginBottom: 16 }}>
          已解锁徽章
        </h2>
        {profile.badges.length === 0 ? (
          <div className="text-muted" style={{ fontSize: 14 }}>
            还没有解锁徽章，继续完成关卡获取更多奖励吧！
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {profile.badges.map((badge) => (
              <div
                key={badge}
                style={{
                  padding: '10px 16px',
                  borderRadius: 999,
                  background: 'rgba(93, 168, 255, 0.12)',
                  border: '1px solid rgba(93, 168, 255, 0.4)',
                }}
              >
                {badge}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
