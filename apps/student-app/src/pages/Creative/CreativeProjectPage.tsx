import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import { CreativeProjectCard } from '../../components/creative/ProjectCard';
import type { CreativeProject } from '../../services/creative.repo';
import { createCreativeLevel } from '../../services/creative.repo';
import { runAndJudge, type RunAndJudgeResult } from '../../lib/runAndJudge';
import { RunFeedback } from '../../components/RunFeedback';
import { useCreativeStore } from '../../store/creative';

const CURRENT_USER_ID = 'student-demo';

export default function CreativeProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    loadProject,
    projects,
    likeProject,
    unlikeProject,
    favoriteProject,
    unfavoriteProject,
    recordRun,
  } =
    useCreativeStore();
  const [project, setProject] = useState<CreativeProject | null>(null);
  const [liked, setLiked] = useState(false);
  const [favored, setFavored] = useState(false);
  const [runResult, setRunResult] = useState<RunAndJudgeResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject(projectId).then((item) => {
        if (item) {
          setProject(item);
        }
      });
    }
  }, [projectId, loadProject]);

  if (!project) {
    return (
      <div className="kc-container" style={{ maxWidth: 1080, padding: 48 }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div className="text-muted">作品不存在或已被隐藏。</div>
          <Link className="btn btn-primary" style={{ marginTop: 12 }} to="/creative">
            返回创作广场
          </Link>
        </div>
      </div>
    );
  }

  const sameAuthorProjects = projects
    .filter((item) => item.ownerId === project.ownerId && item.id !== project.id)
    .slice(0, 3);

  const handleRun = async () => {
    setRunning(true);
    setRunError(null);
    setRunResult(null);
    try {
      const level = createCreativeLevel(project.gameType);
      const result = await runAndJudge({ level, code: project.code });
      setRunResult(result);
      if (result.exec.stderr) {
        setRunError(result.exec.stderr);
      }
      await recordRun(project.id);
      setProject((prev) => (prev ? { ...prev, runs: prev.runs + 1 } : prev));
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '运行失败，请稍后再试';
      setRunError(errMsg);
    } finally {
      setRunning(false);
    }
  };

  const handleLike = async () => {
    if (liked) {
      await unlikeProject(project.id);
      setLiked(false);
      setProject((prev) => (prev ? { ...prev, likes: Math.max(0, prev.likes - 1) } : prev));
    } else {
      await likeProject(project.id);
      setLiked(true);
      setProject((prev) => (prev ? { ...prev, likes: prev.likes + 1 } : prev));
    }
  };

  const handleFavorite = async () => {
    if (favored) {
      await unfavoriteProject(project.id);
      setFavored(false);
      setProject((prev) => (prev ? { ...prev, favorites: Math.max(0, prev.favorites - 1) } : prev));
    } else {
      await favoriteProject(project.id);
      setFavored(true);
      setProject((prev) => (prev ? { ...prev, favorites: prev.favorites + 1 } : prev));
    }
  };

  return (
    <div className="kc-container" style={{ maxWidth: 1040, paddingBottom: 48 }}>
      <div className="kc-breadcrumb" style={{ marginBottom: 12 }}>
        <Link to="/creative">自由创作间</Link>
        <span>{project.title}</span>
      </div>

  <header style={{ marginBottom: 24 }}>
        <h1 className="kc-page-title" style={{ marginBottom: 8 }}>
          {project.title}
        </h1>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="text-muted">作者 {project.ownerName}</span>
          <span className="kc-tag" style={{ textTransform: 'uppercase' }}>
            {project.gameType}
          </span>
          <span className="text-muted" style={{ fontSize: 12 }}>
            发布时间：{new Date(project.updatedAt).toLocaleString('zh-CN')}
          </span>
        </div>
      </header>

      <div className="grid duo" style={{ gap: 20, alignItems: 'flex-start' }}>
        <section className="card" style={{ padding: 24, display: 'grid', gap: 16 }}>
          {project.coverUrl ? (
            <img
              src={project.coverUrl}
              alt={project.title}
              style={{ width: '100%', borderRadius: 16, objectFit: 'cover', maxHeight: 260 }}
            />
          ) : null}
          <h2 style={{ fontSize: 18, marginBottom: 0 }}>作品简介</h2>
          <p className="text-muted" style={{ margin: 0 }}>
            {project.summary || '作者还没有填写简介。'}
          </p>

          <h3 style={{ fontSize: 16 }}>操作说明 & 灵感</h3>
          <p className="text-muted" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {project.description || '暂无说明，欢迎在评论区询问作者。'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, margin: 0 }}>运行预览</h3>
            <button type="button" className="btn btn-primary" onClick={handleRun} disabled={running}>
              {running ? '运行中...' : '运行作品'}
            </button>
          </div>
          <RunFeedback result={runResult} error={runError} />

          <h3 style={{ fontSize: 16 }}>源码</h3>
          <pre
            style={{
              background: '#0f172a',
              color: '#e2e8f0',
              padding: 16,
              borderRadius: 12,
              overflow: 'auto',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {project.code}
          </pre>
        </section>

        <aside className="card" style={{ padding: 24, display: 'grid', gap: 16 }}>
          <strong>互动</strong>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              className={`btn ${liked ? 'btn-primary' : 'btn-ghost'}`}
              onClick={handleLike}
            >
              👍 喜欢 ({project.likes})
            </button>
            <button
              type="button"
              className={`btn ${favored ? 'btn-primary' : 'btn-ghost'}`}
              onClick={handleFavorite}
            >
              ⭐ 收藏 ({project.favorites})
            </button>
          </div>
          <div className="text-muted" style={{ fontSize: 13 }}>
            当前仅提供本地点赞收藏示例，刷新页面后将保留到你的浏览器缓存。
          </div>
          <div style={{ borderTop: '1px solid rgba(148,163,184,0.2)', paddingTop: 16 }}>
            <strong style={{ fontSize: 14 }}>作品数据</strong>
            <ul style={{ margin: 8, paddingLeft: 18, color: 'var(--text-secondary)', fontSize: 13 }}>
              <li>运行次数（示意）：{project.runs}</li>
              <li>可见范围：{project.visibility === 'class' ? '班级' : project.visibility === 'school' ? '全校' : '仅自己'}</li>
            </ul>
          </div>

          <div style={{ borderTop: '1px solid rgba(148,163,184,0.2)', paddingTop: 16 }}>
            <strong style={{ fontSize: 14 }}>相似作品</strong>
            {sameAuthorProjects.length > 0 ? (
              <div className="kc-list" style={{ gap: 12 }}>
                {sameAuthorProjects.map((item) => (
                  <CreativeProjectCard key={item.id} project={item} compact />
                ))}
              </div>
            ) : (
              <div className="text-muted" style={{ fontSize: 13 }}>
                作者暂无更多作品。
              </div>
            )}
          </div>

          <Link
            to={project.ownerId === CURRENT_USER_ID ? `/creative/editor/${project.id}` : '/creative'}
            className="btn btn-ghost"
          >
            {project.ownerId === CURRENT_USER_ID ? '编辑此作品' : '我也要创作'}
          </Link>
        </aside>
      </div>
    </div>
  );
}
