import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { CreativeProjectCard } from '../../components/creative/ProjectCard';
import { useCreativeStore } from '../../store/creative';
import type { CreativeTheme } from '../../services/creative.repo';

const CURRENT_USER_ID = 'student-demo';
const CURRENT_USER_NAME = 'Xiao Ming';

function ThemeCard({ theme }: { theme: CreativeTheme }) {
  const label = `${new Date(theme.startAt).toLocaleDateString('zh-CN')} - ${new Date(
    theme.endAt,
  ).toLocaleDateString('zh-CN')}`;
  return (
    <article className="card" style={{ minWidth: 260, padding: 18 }}>
      <div className="kc-tag" style={{ background: 'rgba(93,168,255,0.16)', color: '#2563eb' }}>
        {theme.focus.toUpperCase()}
      </div>
      <h3 style={{ margin: '12px 0 6px', fontSize: 18 }}>{theme.title}</h3>
      <p className="text-muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.4 }}>
        {theme.summary}
      </p>
      <p className="text-muted" style={{ fontSize: 12, marginTop: 12 }}>{label}</p>
      {theme.spotlight ? (
        <div
          style={{
            background: 'rgba(167,139,250,0.12)',
            borderRadius: 12,
            padding: 12,
            fontSize: 12,
            color: '#6b21a8',
          }}
        >
          灵感提示：{theme.spotlight}
        </div>
      ) : null}
    </article>
  );
}

export default function CreativeLandingPage() {
  const navigate = useNavigate();
  const { themes, projects, drafts, load, initialized, loading } = useCreativeStore();

  useEffect(() => {
    if (!initialized) {
      void load(CURRENT_USER_ID);
    }
  }, [initialized, load]);

  const latestThemes = themes.slice(0, 4);
  const published = projects;
  const myDrafts = useMemo(
    () => drafts.filter((item) => item.status === 'draft' && item.ownerId === CURRENT_USER_ID),
    [drafts],
  );

  const handleCreate = () => {
    navigate('/creative/editor');
  };

  return (
    <div className="kc-container" style={{ maxWidth: 1120, paddingBottom: 48 }}>
      <header
        className="card"
        style={{
          marginBottom: 32,
          padding: 36,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(93,168,255,0.12), rgba(167,139,250,0.16))',
          border: '1px solid rgba(93,168,255,0.25)',
        }}
      >
        <div style={{ flex: '1 1 360px', minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700 }}>自由创作间</h1>
          <p className="text-muted" style={{ fontSize: 16, marginTop: 12, marginBottom: 16, lineHeight: 1.6 }}>
            这里是你的创意实验室！写音乐、拼灯阵、画像素、做交互——记录每一个灵感，发布作品收获同学和老师的赞赏。
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" className="btn btn-cta" onClick={handleCreate}>
              新建创作
            </button>
            <Link className="btn btn-ghost" to="/courses">
              先去上课
            </Link>
            <span className="kc-tag" style={{ background: 'rgba(34,197,94,0.16)', color: '#15803d' }}>
              {published.length} 个作品已发布
            </span>
          </div>
        </div>
        <div
          style={{
            flex: '0 0 320px',
            minWidth: 0,
            borderRadius: 18,
            padding: 20,
            background: 'rgba(15,23,42,0.08)',
          }}
        >
          <h2 style={{ fontSize: 18, margin: 0, marginBottom: 12 }}>创作流程</h2>
          <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--text-secondary)', fontSize: 14, display: 'grid', gap: 8 }}>
            <li>选择主题或自由创想，明确作品想表达的内容。</li>
            <li>在编辑器中编写代码，填写封面、亮点、操作说明。</li>
            <li>保存草稿或直接发布，等待老师审核并邀请同学点评。</li>
          </ol>
        </div>
      </header>

      <section style={{ marginBottom: 32 }}>
        <div className="kc-section-title" style={{ marginBottom: 16 }}>
          本月主题
        </div>
        <div className="kc-scroll-row" style={{ gap: 16 }}>
          {latestThemes.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} />
          ))}
          {latestThemes.length === 0 && (
            <article className="card" style={{ padding: 24, minWidth: 260 }}>
              <strong>主题即将更新</strong>
              <p className="text-muted" style={{ marginTop: 8 }}>
                首批主题还在筹备中，先从自由创作开始吧。
              </p>
            </article>
          )}
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <div className="kc-section-title" style={{ marginBottom: 16 }}>
          最新作品
        </div>
        {loading && published.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <div className="text-muted">加载作品中...</div>
          </div>
        ) : published.length > 0 ? (
          <div className="grid tri" style={{ gap: 16 }}>
            {published.map((project) => (
              <CreativeProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>暂无作品</div>
            <p className="text-muted" style={{ marginBottom: 16 }}>
              成为第一位创作者，分享你的作品到全班或全校吧！
            </p>
            <button type="button" className="btn btn-primary" onClick={handleCreate}>
              立即创作
            </button>
          </div>
        )}
      </section>

      <section>
        <div className="kc-section-title" style={{ marginBottom: 16 }}>
          我的草稿
        </div>
        {myDrafts.length > 0 ? (
          <div className="kc-scroll-row" style={{ gap: 14 }}>
            {myDrafts.map((draft) => (
              <Link
                key={draft.id}
                to={`/creative/editor/${draft.id}`}
                className="card"
                style={{
                  padding: 18,
                  minWidth: 260,
                  textDecoration: 'none',
                  border: '1px dashed rgba(148,163,184,0.4)',
                }}
              >
                <div className="text-muted" style={{ fontSize: 12 }}>
                  草稿
                </div>
                <strong style={{ fontSize: 16 }}>{draft.title}</strong>
                <p className="text-muted" style={{ fontSize: 13, margin: '8px 0' }}>
                  {draft.summary || '还没有填写简介'}
                </p>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  上次编辑：{new Date(draft.updatedAt).toLocaleString('zh-CN')}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: 24 }}>
            <div className="text-muted">暂无草稿，点击“新建创作”保存你的第一个草稿。</div>
          </div>
        )}
      </section>

      <footer style={{ marginTop: 40, color: 'var(--text-secondary)', fontSize: 13 }}>
        当前登录：{CURRENT_USER_NAME}（演示账号，仅本地存储数据）
      </footer>
    </div>
  );
}
