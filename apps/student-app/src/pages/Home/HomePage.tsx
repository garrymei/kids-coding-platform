import { useEffect } from 'react';
import { motion } from 'framer-motion';

import { useProgressStore } from '../../stores/progress';
import { DailyTaskCard } from './DailyTaskCard';
import { AchievementsCard } from './AchievementsCard';
import { RecommendedNextLevel } from './RecommendedNextLevel';
import { CreativeShowcaseCard } from './CreativeShowcaseCard';

const MOCK_STUDENT_ID = 'stu_1';

const mockDailyTasks = [
  { id: 1, title: '完成 2 个循环关卡', xp: 50, status: 'done' as const },
  { id: 2, title: '连续登录 3 天', xp: 30, status: 'pending' as const },
  { id: 3, title: '提交一份新作品', xp: 25, status: 'pending' as const },
];

const mockAchievements = [
  { id: 'streak-7', title: '连续学习 7 天', icon: '🔥', unlockedAt: new Date().toISOString() },
  { id: 'maze-5', title: '迷宫大师', icon: '🧭' },
  { id: 'loop-master', title: '循环达人', icon: '♻️' },
  { id: 'pixel-artist', title: '像素画家', icon: '🎨' },
];

const mockNextLevel = {
  id: 'loops-1',
  title: '循环初体验',
  type: 'pixel' as const,
  difficulty: 1,
  xp: 50,
  story: '学习 for 循环的基本语法',
};

export default function HomePage() {
  const { snapshot, loading, fetchHome } = useProgressStore();

  useEffect(() => {
    fetchHome(MOCK_STUDENT_ID).catch(() => {
      /* 忽略演示数据加载失败 */
    });
  }, [fetchHome]);

  if (loading || !snapshot) {
    return (
      <div className="card" style={{ height: 240, padding: '20px', color: 'white' }}>
        Loading home page...
      </div>
    );
  }

  const nextLesson = snapshot.nextLesson;

  return (
    <div className="kc-home">
      <motion.section
        className="card kc-hero"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div>
          <h2 style={{ fontSize: 28, margin: 0 }}>欢迎回来，探索者！</h2>
          <p style={{ marginTop: 12, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            今日已学习 <strong>{snapshot.today.studyMinutes} 分钟</strong>， 连续坚持{' '}
            <strong>{snapshot.streakDays} 天</strong>。保持节奏，就能遇见更棒的自己！
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
            <a
              className="btn btn-cta"
              href={nextLesson ? `/map?focus=${nextLesson.levelId}` : '/courses'}
            >
              🚀 继续学习
            </a>
            <a className="btn btn-secondary" href="/achievements">
              🏆 查看成就
            </a>
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
              {snapshot.today.passes > 0 ? '🌟' : '🔥'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>今日战绩</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              挑战 {snapshot.today.attempts} 次 · 通过 {snapshot.today.passes} 次
            </div>
          </div>
        </motion.div>
      </motion.section>

      <section className="kc-home__stats">
        <article className="card kpi-card">
          <div className="text-muted">连续学习</div>
          <div className="kc-metric-value">
            {snapshot.streakDays}
            <span>天</span>
          </div>
        </article>
        <article className="card kpi-card">
          <div className="text-muted">累计经验</div>
          <div className="kc-metric-value">
            {snapshot.xp}
            <span>XP</span>
          </div>
        </article>
        <article className="card kpi-card">
          <div className="text-muted">今日学习</div>
          <div className="kc-metric-value">
            {snapshot.today.studyMinutes}
            <span>分钟</span>
          </div>
        </article>
      </section>

      <section>
        <RecommendedNextLevel nextLevel={nextLesson ? mockNextLevel : null} />
      </section>

      <section className="grid duo">
        <DailyTaskCard tasks={mockDailyTasks} />
        <AchievementsCard achievements={mockAchievements} totalAchievements={20} />
      </section>

      <CreativeShowcaseCard />

      <section className="card" style={{ padding: 24 }}>
        <div className="kc-section-title">课程概览</div>
        <div className="kc-scroll-row">
          {snapshot.packages.map((pkg) => (
            <article key={pkg.pkgId} className="card" style={{ minWidth: 240 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{pkg.title}</div>
              <div className="text-muted" style={{ fontSize: 14, marginBottom: 12 }}>
                {pkg.completed} / {pkg.total}
              </div>
              <div
                style={{
                  height: 10,
                  width: '100%',
                  borderRadius: 999,
                  background: 'rgba(148,163,184,.25)',
                  overflow: 'hidden',
                }}
                aria-label={`完成进度 ${Math.round(pkg.percent * 100)}%`}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.round(pkg.percent * 100)}%`,
                    background: 'linear-gradient(90deg, #5da8ff, #a78bfa)',
                    borderRadius: 999,
                    transition: 'width .3s ease',
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid duo">
        <article className="card">
          <div className="kc-section-title">最近活动</div>
          <div className="kc-list">
            {snapshot.recent.map((item) => (
              <div key={item.ts} className="kc-list__item">
                <div>
                  <strong>{item.levelId}</strong>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {new Date(item.ts).toLocaleString('zh-CN')}
                  </div>
                </div>
                <span
                  className="kc-tag"
                  style={{ background: item.passed ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.25)' }}
                >
                  {item.passed ? '通过' : '未通过'}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="kc-section-title">最新成就</div>
          <div className="kc-list">
            {snapshot.achievements.map((item) => (
              <div key={item.id} className="kc-list__item">
                <div>
                  <strong>{item.title}</strong>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    获得时间：{item.gainedAt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
