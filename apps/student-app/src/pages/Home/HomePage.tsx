import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgressStore } from '../../stores/progress';

const MOCK_STUDENT_ID = 'stu_1';

export default function HomePage() {
  const navigate = useNavigate();
  const { snapshot, loading, fetchHome } = useProgressStore();

  useEffect(() => {
    fetchHome(MOCK_STUDENT_ID).catch(() => {
      /* noop: 进度数据加载失败时保持占位卡片 */
    });
  }, [fetchHome]);

  if (loading || !snapshot) {
    return <div className="card" style={{ height: 240 }} />;
  }

  const nextLesson = snapshot.nextLesson;

  return (
    <div className="kc-home">
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

      {nextLesson && (
        <section className="card" style={{ padding: 24 }}>
          <div className="kc-home__cta">
            <div>
              <h2 className="kc-section-title" style={{ marginBottom: 6 }}>
                🚀 继续挑战：{nextLesson.title}
              </h2>
              <div className="kc-tag">{nextLesson.pkgId}</div>
            </div>
            <button className="btn btn-cta" onClick={() => navigate(`/play/${nextLesson.levelId}`)}>
              开始学习
            </button>
          </div>
        </section>
      )}

      <section className="card" style={{ padding: 24 }}>
        <div className="kc-section-title">课程包进度</div>
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
          <div className="kc-section-title">近期活动</div>
          <div className="kc-list">
            {snapshot.recent.map((item) => (
              <div key={item.ts} className="kc-list__item">
                <div>
                  <strong>{item.levelId}</strong>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {new Date(item.ts).toLocaleString()}
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
          <div className="kc-section-title">近期成就</div>
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
