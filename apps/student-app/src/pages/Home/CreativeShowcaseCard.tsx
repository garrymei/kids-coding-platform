import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useCreativeStore } from '../../store/creative';

const CURRENT_USER_ID = 'student-demo';

export function CreativeShowcaseCard() {
  const { themes, projects, load, initialized } = useCreativeStore();

  useEffect(() => {
    if (!initialized) {
      void load(CURRENT_USER_ID);
    }
  }, [initialized, load]);

  const latestTheme = themes[0];
  const highlights = projects.slice(0, 3);

  return (
    <section className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <div className="kc-section-title">自由创作间</div>
          <p className="text-muted" style={{ maxWidth: 420, marginBottom: 16 }}>
            完成课程之后，来到创作广场展示你的作品、参与主题挑战、收获老师点评。灵感不断，每周都有新主题。
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link className="btn btn-cta" to="/creative">
              进入创作广场
            </Link>
            {latestTheme ? (
              <span
                className="kc-tag"
                style={{
                  background: 'rgba(167, 139, 250, 0.16)',
                  color: '#7c3aed',
                  border: '1px solid rgba(167,139,250,0.35)',
                }}
              >
                新主题 · {latestTheme.title}
              </span>
            ) : null}
          </div>
        </div>

        <div
          style={{
            flex: '0 0 280px',
            borderRadius: 16,
            padding: 16,
            background: 'linear-gradient(135deg, rgba(93,168,255,0.12), rgba(167,139,250,0.12))',
          }}
        >
          <div className="text-muted" style={{ fontSize: 12, marginBottom: 8 }}>
            最新作品
          </div>
          <div className="kc-list" style={{ gap: 12 }}>
            {highlights.length > 0 ? (
              highlights.map((item) => (
                <Link
                  key={item.id}
                  to={`/creative/${item.id}`}
                  className="kc-list__item"
                  style={{ alignItems: 'flex-start', textDecoration: 'none' }}
                >
                  <div style={{ minWidth: 0 }}>
                    <strong>{item.title}</strong>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      by {item.ownerName}
                    </div>
                  </div>
                  <span className="kc-tag" style={{ textTransform: 'uppercase' }}>
                    {item.gameType}
                  </span>
                </Link>
              ))
            ) : (
              <div className="kc-list__item" style={{ alignItems: 'flex-start' }}>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  还没有作品，快来成为首位创作者吧！
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
