import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useCreativeStore } from '../../store/creative';
import type { CreativeProject } from '../../services/creative.repo';
import { createCreativeLevel } from '../../services/creative.repo';
import { runAndJudge, type RunAndJudgeResult } from '../../lib/runAndJudge';
import { RunFeedback } from '../../components/RunFeedback';

const CURRENT_USER_ID = 'student-demo';
const CURRENT_USER_NAME = 'Xiao Ming';

type FormState = {
  id?: string;
  title: string;
  summary: string;
  description: string;
  themeId?: string;
  visibility: 'class' | 'school' | 'private';
  gameType: 'music' | 'led' | 'pixel' | 'io';
  code: string;
  coverUrl?: string;
  status: 'draft' | 'published';
};

const DEFAULT_CODE = `# 在这里编写你的创意代码
# 例如：
for beat in range(4):
    print('note', beat, 'C', 1)`;

function deriveInitial(project?: CreativeProject): FormState {
  if (!project) {
    return {
      title: '',
      summary: '',
      description: '',
      themeId: undefined,
      visibility: 'class',
      gameType: 'music',
      code: DEFAULT_CODE,
      coverUrl: '',
      status: 'draft',
    };
  }

  return {
    id: project.id,
    title: project.title,
    summary: project.summary,
    description: project.description,
    themeId: project.themeId,
    visibility: project.visibility,
    gameType: project.gameType,
    code: project.code,
    coverUrl: project.coverUrl,
    status: project.status,
  };
}

export default function CreativeEditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { themes, loadProject, saveProject, load, initialized } = useCreativeStore();
  const [form, setForm] = useState<FormState>(deriveInitial());
  const [loading, setLoading] = useState<boolean>(!!projectId);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<RunAndJudgeResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!initialized) {
      void load(CURRENT_USER_ID);
    }
  }, [initialized, load]);

  useEffect(() => {
    if (projectId) {
      loadProject(projectId).then((project) => {
        if (project) {
          setForm(deriveInitial(project));
        }
        setLoading(false);
      });
    }
  }, [projectId, loadProject]);

  const selectedTheme = useMemo(
    () => themes.find((item) => item.id === form.themeId),
    [themes, form.themeId],
  );

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!form.title.trim()) {
      setMessage('请填写作品标题');
      return;
    }
    if (status === 'published' && !form.summary.trim()) {
      setMessage('请填写作品简介后再发布');
      return;
    }

    setSaving(true);
    const saved = await saveProject({
      ...form,
      status,
      ownerId: CURRENT_USER_ID,
      ownerName: CURRENT_USER_NAME,
    });
    setSaving(false);
    const wasNew = !form.id;
    setForm(deriveInitial(saved));
    setMessage(status === 'published' ? '作品已发布！等待老师点评。' : '草稿已保存。');

    if (status === 'published') {
      navigate(`/creative/${saved.id}`, { replace: true });
    } else if (wasNew) {
      navigate(`/creative/editor/${saved.id}`, { replace: true });
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setRunError(null);
    setRunResult(null);

    try {
      const level = createCreativeLevel(form.gameType);
      const result = await runAndJudge({ level, code: form.code });
      setRunResult(result);
      if (result.exec.stderr) {
        setRunError(result.exec.stderr);
      }
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : '运行失败，请稍后再试';
      setRunError(errMsg);
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="kc-container" style={{ maxWidth: 1040, padding: 48 }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div className="text-muted">加载草稿...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="kc-container" style={{ maxWidth: 1040, paddingBottom: 48 }}>
      <header style={{ marginBottom: 24 }}>
        <div className="kc-breadcrumb">
          <Link to="/creative">自由创作间</Link>
          <span>创作编辑器</span>
        </div>
        <h1 className="kc-page-title" style={{ marginBottom: 8 }}>
          {form.id ? '编辑作品' : '新建作品'}
        </h1>
        <p className="text-muted" style={{ margin: 0 }}>
          填写作品信息、编写代码，保存草稿或直接发布到创作广场。
        </p>
      </header>

      {message && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          {message}
        </div>
      )}

      <div className="grid duo" style={{ alignItems: 'flex-start', gap: 20 }}>
        <section className="card" style={{ padding: 24, display: 'grid', gap: 16 }}>
          <div>
            <label className="kc-label" htmlFor="creative-title">
              作品标题
            </label>
            <input
              id="creative-title"
              className="kc-input"
              value={form.title}
              onChange={(event) => handleChange('title', event.target.value)}
              placeholder="给作品取一个亮眼的名字"
            />
          </div>

          <div>
            <label className="kc-label" htmlFor="creative-summary">
              简介
            </label>
            <textarea
              id="creative-summary"
              className="kc-textarea"
              rows={3}
              value={form.summary}
              onChange={(event) => handleChange('summary', event.target.value)}
              placeholder="一句话介绍作品亮点、玩法或灵感来源"
            />
          </div>

          <div>
            <label className="kc-label" htmlFor="creative-description">
              作品说明
            </label>
            <textarea
              id="creative-description"
              className="kc-textarea"
              rows={6}
              value={form.description}
              onChange={(event) => handleChange('description', event.target.value)}
              placeholder="补充操作说明、设计思路、想分享给观众的话……"
            />
          </div>

          <div className="grid duo" style={{ gap: 16 }}>
            <div>
              <label className="kc-label" htmlFor="creative-theme">
                参与主题
              </label>
              <select
                id="creative-theme"
                className="kc-select"
                value={form.themeId ?? ''}
                onChange={(event) => handleChange('themeId', event.target.value || undefined)}
              >
                <option value="">自由创作</option>
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.title}
                  </option>
                ))}
              </select>
              {selectedTheme ? (
                <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {selectedTheme.summary}
                </div>
              ) : null}
            </div>

            <div>
              <label className="kc-label" htmlFor="creative-visibility">
                可见范围
              </label>
              <select
                id="creative-visibility"
                className="kc-select"
                value={form.visibility}
                onChange={(event) =>
                  handleChange('visibility', event.target.value as FormState['visibility'])
                }
              >
                <option value="class">班级内可见</option>
                <option value="school">全校可见</option>
                <option value="private">仅自己可见</option>
              </select>
            </div>
          </div>

          <div className="grid duo" style={{ gap: 16 }}>
            <div>
              <label className="kc-label" htmlFor="creative-gameType">
                创作类型
              </label>
              <select
                id="creative-gameType"
                className="kc-select"
                value={form.gameType}
                onChange={(event) =>
                  handleChange('gameType', event.target.value as FormState['gameType'])
                }
              >
                <option value="music">音乐</option>
                <option value="led">灯阵</option>
                <option value="pixel">像素画</option>
                <option value="io">输入输出</option>
              </select>
            </div>

            <div>
              <label className="kc-label" htmlFor="creative-cover">
                封面图（可选）
              </label>
              <input
                id="creative-cover"
                className="kc-input"
                value={form.coverUrl ?? ''}
                onChange={(event) => handleChange('coverUrl', event.target.value)}
                placeholder="输入图片链接或暂时留空"
              />
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: 24, display: 'grid', gap: 16 }}>
          <label className="kc-label" htmlFor="creative-code">
            创作代码
          </label>
          <textarea
            id="creative-code"
            className="kc-textarea"
            rows={20}
            style={{ fontFamily: 'ui-monospace,SFMono-Regular,Menlo,Monaco', fontSize: 13 }}
            value={form.code}
            onChange={(event) => handleChange('code', event.target.value)}
          />
          <div className="text-muted" style={{ fontSize: 12 }}>
            代码目前保存在本地存储，刷新后仍可找回。发布后老师即可在后台看到你的作品。
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-primary" onClick={handleRun} disabled={running}>
              {running ? '运行中...' : '运行预览'}
            </button>
          </div>
          {(runResult || runError) && (
            <div style={{ marginTop: 8 }}>
              <RunFeedback result={runResult} error={runError} />
            </div>
          )}
        </section>
      </div>

      <footer
        className="card"
        style={{
          marginTop: 24,
          padding: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          className="btn"
          onClick={() => handleSave('draft')}
          disabled={saving}
        >
          保存草稿
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => handleSave('published')}
          disabled={saving}
        >
          发布作品
        </button>
      </footer>
    </div>
  );
}
