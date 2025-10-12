import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { progressStore } from '../../store/progress';
import {
  fetchAchievementList,
  fetchAchievementProfile,
  type AchievementItem,
  type AchievementProfile,
} from '../../services/achievements';
import { AchievementsCard } from './AchievementsCard';
import { CreativeShowcaseCard } from './CreativeShowcaseCard';

export default function HomePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AchievementProfile | null>(null);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [localProgress, setLocalProgress] = useState(progressStore.getProgress());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleProgressUpdate = () => {
      setLocalProgress(progressStore.getProgress());
    };

    window.addEventListener('progress-updated', handleProgressUpdate as EventListener);
    return () => {
      window.removeEventListener('progress-updated', handleProgressUpdate as EventListener);
    };
  }, []);

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

  const streakDays = localProgress.streakDays ?? 0;
  const totalXp = profile?.xp ?? localProgress.xp;
  const petEmoji = profile ? (['🐾', '🐣', '🦊', '🐉', '🌟'][profile.pet.stage - 1] ?? '🌱') : '🌱';

  const levelProgress = useMemo(() => {
    if (!profile) {
      return { ratio: 0, remaining: 0 };
    }
    const span = Math.max(profile.nextLevelXp - profile.levelStartXp, 1);
    return {
      ratio: Math.min(100, ((profile.xp - profile.levelStartXp) / span) * 100),
      remaining: profile.xpForNextLevel,
    };
  }, [profile]);

  return (
    <div className="kc-home" style={{ opacity: loading ? 0.6 : 1 }}>
      <motion.section
        className="card kc-hero"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div>
          <h2 style={{ fontSize: 28, margin: 0 }}>欢迎回来，探索者！</h2>
          <p style={{ marginTop: 12, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            目前累计 <strong>{totalXp} XP</strong>，连续坚持
            <strong> {streakDays} 天</strong>。保持节奏，就能遇见更棒的自己！
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
            <button className="btn btn-cta" type="button" onClick={() => navigate('/map')}>
              🚀 继续学习
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => navigate('/achievements')}
            >
              🏆 查看成就
            </button>
          </div>
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 180, damping: 16 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background:
                'conic-gradient(from 180deg, rgba(93, 168, 255, 0.5) 0%, rgba(167, 139, 250, 0.6) 65%, rgba(148, 163, 184, 0.25) 65%)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: 'rgba(11, 16, 32, 0.75)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 30,
              }}
            >
              {petEmoji}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>今日状态</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              金币 {localProgress.coins} · 连续天数 {streakDays}
            </div>
          </div>
        </motion.div>
      </motion.section>

      <section className="kc-home__stats">
        <article className="card kpi-card">
          <div className="text-muted">当前等级</div>
          <div className="kc-metric-value">
            {profile?.level ?? 1}
            <span>Lv</span>
          </div>
          {profile && (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  height: 10,
                  borderRadius: 999,
                  background: 'rgba(148, 163, 184, 0.25)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${levelProgress.ratio.toFixed(2)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #5da8ff, #a78bfa)',
                  }}
                />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                距离下一等级还差 {levelProgress.remaining} XP
              </div>
            </div>
          )}
        </article>

        <article className="card kpi-card">
          <div className="text-muted">累计经验</div>
          <div className="kc-metric-value">
            {totalXp}
            <span>XP</span>
          </div>
        </article>

        <article className="card kpi-card">
          <div className="text-muted">连续学习</div>
          <div className="kc-metric-value">
            {streakDays}
            <span>天</span>
          </div>
        </article>
      </section>

      <section className="grid duo">
        <AchievementsCard
          achievements={achievements.filter((item) => item.unlocked)}
          totalAchievements={profile?.achievements.length ?? achievements.length}
        />
        <CreativeShowcaseCard />
      </section>
    </div>
  );
}
