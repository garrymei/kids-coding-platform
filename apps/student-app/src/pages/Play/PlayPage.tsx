import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { levelRepo, type Level } from '../../services/level.repo';
import { RunPanel } from '../../components/RunPanel';
import type { RunAndJudgeResult } from '../../lib/runAndJudge';

interface ViewState {
  status: 'loading' | 'error' | 'ready';
  level?: Level;
  message?: string;
}

export default function PlayPage() {
  const { levelId } = useParams();
  const [state, setState] = useState<ViewState>({ status: 'loading' });
  const [code, setCode] = useState('');
  const [runResult, setRunResult] = useState<RunAndJudgeResult | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!levelId) {
        setState({ status: 'error', message: '缺少关卡 ID' });
        return;
      }
      setState({ status: 'loading' });
      try {
        const level = await levelRepo.getLevelById(levelId);
        if (!active) return;
        if (!level) {
          setState({ status: 'error', message: `未找到关卡 ${levelId}` });
          return;
        }
        setCode(level.starter?.code ?? '');
        setState({ status: 'ready', level });
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : '加载关卡失败';
        setState({ status: 'error', message });
      }
    })();
    return () => {
      active = false;
    };
  }, [levelId]);

  if (state.status === 'loading') {
    return <div className="card" style={{ height: 240 }} />;
  }

  if (state.status === 'error' || !state.level) {
    return <div className="alert alert-error">{state.message ?? '加载失败'}</div>;
  }

  const level = state.level;
  const summary = level.story || (level.goals?.length ? `目标：${level.goals.join('、')}` : '');
  const visual = useMemo(() => renderVisualization(level, runResult), [level, runResult]);

  return (
    <div className="kc-container" style={{ maxWidth: 1128 }}>
      <section className="card" style={{ marginBottom: 24 }}>
        <h1 className="kc-section-title" style={{ marginBottom: 8 }}>
          {level.title}
        </h1>
        {summary && <p className="text-muted">{summary}</p>}
      </section>

      <RunPanel
        level={level}
        code={code}
        onCodeChange={setCode}
        onResult={setRunResult}
        gameRunner={{ render: () => visual }}
      />
    </div>
  );
}

function renderVisualization(level: Level, result: RunAndJudgeResult | null): ReactNode {
  if (!result) {
    return <p className="text-muted">运行代码后将在此显示可视化结果。</p>;
  }

  switch (level.gameType) {
    case 'io':
      return <IoPreview result={result} />;
    case 'pixel':
      return <PixelPreview result={result} />;
    case 'music':
      return <MusicPreview result={result} />;
    case 'led':
      return <LedPreview result={result} />;
    case 'maze':
      return <MazePreview result={result} />;
    default:
      return <div className="alert alert-warn">暂无 {level.gameType} 类型的可视化。</div>;
  }
}

function IoPreview({ result }: { result: RunAndJudgeResult }): ReactNode {
  const cases = result.artifacts.ioCases ?? [];
  if (!cases.length) {
    return <div className="text-muted">未提供输入输出示例。</div>;
  }
  return (
    <div className="kc-list">
      {cases.map((item, index) => (
        <div key={`${item.input}-${index}`} className="kc-list__item">
          <div>
            <div className="text-muted" style={{ fontSize: 12 }}>输入</div>
            <div>{item.input || '(空)'}</div>
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: 12 }}>期望</div>
            <div>{item.expected}</div>
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: 12 }}>输出</div>
            <div>{item.actual}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PixelPreview({ result }: { result: RunAndJudgeResult }): ReactNode {
  const matrix = result.artifacts.pixelMatrix;
  if (!matrix || matrix.length === 0) {
    return <div className="text-muted">未生成像素数据。</div>;
  }
  const columns = Math.max(...matrix.map((row) => row.length));
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 24px)`,
        gap: 6,
        justifyContent: 'start',
        padding: 12,
        background: 'rgba(255,255,255,.04)',
        borderRadius: 12,
      }}
    >
      {matrix.flatMap((row, y) =>
        row.map((value, x) => (
          <div
            key={`${x}-${y}`}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              border: '1px solid rgba(148,163,184,.35)',
              background: value ? `rgba(93,168,255, ${Math.min(value / 255, 1)})` : 'rgba(15,23,42,.2)',
              boxShadow: value ? '0 0 12px rgba(93,168,255,.35)' : 'none',
            }}
          />
        )),
      )}
    </div>
  );
}

function MusicPreview({ result }: { result: RunAndJudgeResult }): ReactNode {
  const sequence = result.artifacts.musicSeq;
  if (!sequence || sequence.length === 0) {
    return <div className="text-muted">未生成音符序列。</div>;
  }
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {sequence.map((note, index) => (
        <li key={`${note.pitch}-${index}`} className="kc-list__item">
          <strong>{note.pitch}</strong>
          <span className="text-muted">{note.duration.toFixed(2)} 秒</span>
        </li>
      ))}
    </ul>
  );
}

function LedPreview({ result }: { result: RunAndJudgeResult }): ReactNode {
  return result.exec.stdout ? (
    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace' }}>{result.exec.stdout}</pre>
  ) : (
    <div className="text-muted">运行后将显示灯阵状态。</div>
  );
}

function MazePreview({ result }: { result: RunAndJudgeResult }): ReactNode {
  const diff = result.artifacts.raw ?? {};
  return (
    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace' }}>
      {JSON.stringify(diff, null, 2)}
    </pre>
  );
}
