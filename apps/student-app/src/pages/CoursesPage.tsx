import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GamePack } from '@kids/types';
import { levelRepo } from '../services/level.repo';
import { useStudentState, useStudentActions } from '../store/studentStore.js';
import { progressStore } from '../store/progress';
import { EmptyView, ErrorView, PageSkeleton } from '../components/Feedback';

type PackProgress = {
  completed: number;
  total: number;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; packs: GamePack[]; progress: Record<string, PackProgress> };

export function CoursesPage() {
  const navigate = useNavigate();
  const { focusCourseId } = useStudentState();
  const actions = useStudentActions();
  const [launching, setLaunching] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setState({ status: 'loading' });
      try {
        actions.refreshStats();
        const packs = await levelRepo.getPacks('python');
        const progress = await computeProgress(packs);
        if (cancelled) return;
        setState({ status: 'ready', packs, progress });
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : '加载课程失败';
        setState({ status: 'error', message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actions]);

  const readyState = state.status === 'ready' ? state : null;

  const focusLabel = useMemo(
    () => (focusCourseId ? `当前主线：${focusCourseId}` : '暂无主线课程'),
    [focusCourseId],
  );

  const startPack = async (pack: GamePack) => {
    try {
      setLaunching(pack.gameType);
      const levels = await levelRepo.getLevels(pack.lang, pack.gameType);
      const first = levels[0];
      if (first) {
        navigate(`/play/${first.id}`);
      } else {
        navigate(`/hub/${pack.lang}/${pack.gameType}`);
      }
    } finally {
      setLaunching(null);
    }
  };

  if (state.status === 'loading') {
    return <PageSkeleton rows={6} />;
  }

  if (state.status === 'error') {
    return (
      <ErrorView
        title="课程加载失败"
        message={state.message}
        actionLabel="重试"
        onAction={() => setState({ status: 'loading' })}
      />
    );
  }

  if (!readyState || readyState.packs.length === 0) {
    return (
      <EmptyView
        title="还没有课程包"
        description="稍后再来看看，或者联系老师获取课程权限。"
      />
    );
  }

  return (
    <div className="grid" style={{ gap: 24 }}>
      <header className="card" style={{ boxShadow: 'none' }}>
        <h1 className="page-title">我的课程</h1>
        <p className="text-muted" style={{ marginBottom: 8 }}>根据课程包逐步解锁，从基础到进阶完成所有挑战。</p>
        <span className="badge">{focusLabel}</span>
      </header>

      <div className="grid grid-2">
        {readyState.packs.map((pack) => {
          const progress = readyState.progress[pack.gameType] ?? { completed: 0, total: 0 };
          const percent = progress.total === 0 ? 0 : (progress.completed / progress.total) * 100;
          const isFocused = pack.gameType === focusCourseId;

          return (
            <article key={pack.gameType} className="card hover-rise" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge">{pack.world}</span>
                    <span className="badge">{pack.levelCount} 关</span>
                    {isFocused && <span className="badge" style={{ background: 'rgba(47,138,255,0.16)' }}>主线</span>}
                  </div>
                  <h2 style={{ margin: 0, fontSize: 20 }}>{pack.name}</h2>
                  <p className="text-muted" style={{ fontSize: 14 }}>{pack.summary}</p>
                </div>

                <ProgressRing percent={percent} label={`${progress.completed}/${progress.total}`} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', display: 'grid', gap: 4 }}>
                  {pack.unlock.requires.length > 0 && (
                    <div>需要完成：{pack.unlock.requires.map((req) => req.split('/')[1]).join(', ')}</div>
                  )}
                  <div>解锁等级：Lv.{pack.unlock.minLevel}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className={`btn ${isFocused ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => actions.setFocusCourse(pack.gameType)}
                  >
                    {isFocused ? '当前主线' : '设为主线'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-cta"
                    onClick={() => startPack(pack)}
                    disabled={launching === pack.gameType}
                  >
                    {launching === pack.gameType ? '跳转中…' : '开始学习'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

async function computeProgress(packs: GamePack[]): Promise<Record<string, PackProgress>> {
  const progress = progressStore.getProgress();
  const result: Record<string, PackProgress> = {};

  for (const pack of packs) {
    const levels = await levelRepo.getLevels('python', pack.gameType);
    const completed = levels.filter((level) => progress.completedLevels.includes(level.id)).length;
    result[pack.gameType] = {
      completed,
      total: levels.length,
    };
  }

  return result;
}

function ProgressRing({ percent, label }: { percent: number; label: string }) {
  const radius = 48;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="progress-ring" style={{ '--size': '120px' } as CSSProperties}>
      <svg className="progress-ring__svg" height={radius * 2} width={radius * 2}>
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="var(--color-primary)"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="progress-ring__label">
        <span>{Math.round(percent)}%</span>
        <small className="text-muted" style={{ fontSize: 12 }}>{label}</small>
      </div>
    </div>
  );
}
