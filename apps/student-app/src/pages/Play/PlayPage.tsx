import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import type { Level } from '@kids/types';
import { levelRepo } from '../../services/level.repo';
import { RunPanel } from '../../components/RunPanel';
import { ErrorView, PageSkeleton } from '../../components/Feedback';
import type { RunAndJudgeResult } from '../../lib/runAndJudge';

interface RouteParams {
  levelId: string;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; level: Level };

export default function PlayPage() {
  const { levelId } = useParams<RouteParams>();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);
  const [code, setCode] = useState('');
  const [runResult, setRunResult] = useState<RunAndJudgeResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!levelId) {
      setState({ status: 'error', message: '未提供关卡 ID' });
      return;
    }

    (async () => {
      setState({ status: 'loading' });
      try {
        const level = await levelRepo.getLevelById(levelId);
        if (cancelled) return;

        if (!level) {
          setState({ status: 'error', message: `未找到编号为 ${levelId} 的关卡` });
          return;
        }

        setState({ status: 'ready', level });
        setCode(level.starter?.code ?? '');
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : '加载关卡失败';
        setState({ status: 'error', message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [levelId, reloadToken]);

  if (state.status === 'loading') {
    return <PageSkeleton rows={8} />;
  }

  if (state.status === 'error') {
    return (
      <ErrorView
        title="关卡加载失败"
        message={state.message}
        actionLabel="重试"
        onAction={() => setReloadToken((token) => token + 1)}
      />
    );
  }

  const { level } = state;
  const requiredStructures = level.grader?.constraints?.requireStructures ?? [];

  const visualization = useMemo(
    () => renderVisualization(level, runResult),
    [level, runResult],
  );

  return (
    <div className="grid" style={{ gap: 24 }}>
      <section className="card">
        <h1 className="page-title">{level.title}</h1>
        <p className="text-muted" style={{ marginBottom: 16 }}>
          {level.story || '欢迎来到新的编程挑战，动手编写代码完成目标吧！'}
        </p>

        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <strong>任务目标</strong>
            <ul>
              {level.goals.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
          </div>

          {level.hints && level.hints.length > 0 && (
            <div>
              <strong>提示</strong>
              <ul>
                {level.hints.map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
            </div>
          )}

          {requiredStructures.length > 0 && (
            <div className="alert" style={{ borderColor: 'rgba(31, 111, 230, 0.2)', background: 'rgba(47, 138, 255, 0.08)' }}>
              <strong>结构要求</strong>
              <p style={{ marginTop: 8 }}>请在代码中包含：{requiredStructures.join('、')}</p>
            </div>
          )}
        </div>
      </section>

      <RunPanel
        level={level}
        code={code}
        onCodeChange={setCode}
        onResult={(result) => setRunResult(result)}
        gameRunner={{ render: () => visualization }}
      />
    </div>
  );
}

function renderVisualization(level: Level, result: RunAndJudgeResult | null): ReactNode {
  if (!result) {
    return <p className="text-muted">运行后可在这里查看可视化结果或诊断信息。</p>;
  }

  switch (level.gameType) {
    case 'io':
      return <IoVisualization level={level} result={result} />;
    case 'pixel':
      return <PixelVisualization data={result.artifacts.pixelMatrix} />;
    case 'music':
      return <MusicVisualization tempo={result.artifacts.tempo} sequence={result.artifacts.musicSeq} />;
    default:
      return (
        <div className="text-muted">
          <p>该类型暂未提供专属可视化。</p>
          <pre
            style={{
              marginTop: 8,
              whiteSpace: 'pre-wrap',
              background: 'rgba(15, 23, 42, 0.04)',
              padding: 12,
              borderRadius: 10,
            }}
          >
            {JSON.stringify(result.artifacts.raw ?? {}, null, 2)}
          </pre>
        </div>
      );
  }
}

function IoVisualization({ level, result }: { level: Level; result: RunAndJudgeResult }) {
  const cases = level.grader.io?.cases ?? [];

  if (cases.length === 0) {
    return <p className="text-muted">该关卡没有配置示例测试用例。</p>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {cases.map((item, index) => (
        <div key={index} className="card" style={{ padding: 12, boxShadow: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="badge">用例 {index + 1}</span>
            <strong>{result.judge.passed ? '✓ 通过' : '✗ 待通过'}</strong>
          </div>
          <pre style={ioBlockStyle}>输入：{item.in || '（无）'}</pre>
          <pre style={ioBlockStyle}>期望输出：{item.out}</pre>
          {result.exec.stdout && <pre style={ioBlockStyle}>实际输出：{result.exec.stdout.trim()}</pre>}
        </div>
      ))}
    </div>
  );
}

const ioBlockStyle: CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  background: 'rgba(15, 23, 42, 0.04)',
  padding: 8,
  borderRadius: 8,
  whiteSpace: 'pre-wrap',
};

function PixelVisualization({ data }: { data?: number[][] }) {
  if (!data || data.length === 0) {
    return <p className="text-muted">运行后将展示像素矩阵。</p>;
  }

  const cols = Math.max(...data.map((row) => row.length));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 24px)`,
        gap: 4,
        justifyContent: 'start',
      }}
    >
      {data.flatMap((row, y) =>
        Array.from({ length: cols }).map((_, x) => {
          const value = row[x] ?? 0;
          return (
            <div
              key={`${x}-${y}`}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: '1px solid rgba(15, 23, 42, 0.12)',
                background: value > 0 ? `rgba(47, 138, 255, ${Math.min(value / 255, 1)})` : 'rgba(15, 23, 42, 0.05)',
              }}
              aria-label={`像素 (${x}, ${y}) 值 ${value}`}
            />
          );
        }),
      )}
    </div>
  );
}

function MusicVisualization({
  tempo,
  sequence,
}: {
  tempo?: number;
  sequence?: Array<{ pitch: string; duration: number }>;
}) {
  if (!sequence || sequence.length === 0) {
    return <p className="text-muted">运行后将展示生成的乐谱。</p>;
  }

  return (
    <div className="card" style={{ boxShadow: 'none', padding: 16 }}>
      {typeof tempo === 'number' && <p style={{ marginBottom: 12 }}>节奏：{tempo} BPM</p>}
      <ul style={{ listStyle: 'disc', marginLeft: 20 }}>
        {sequence.map((note, index) => (
          <li key={`${note.pitch}-${index}`}>
            音符 {note.pitch}（{note.duration}s）
          </li>
        ))}
      </ul>
    </div>
  );
}



