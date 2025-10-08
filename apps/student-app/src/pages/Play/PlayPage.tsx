import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { levelRepo, type Level, pickNextLevelInSameGame } from '../../services/level.repo';
import { RunPanel } from '../../components/RunPanel';
import type { RunAndJudgeResult } from '../../lib/runAndJudge';
import { progressStore } from '../../store/progress';

interface ViewState {
  status: 'loading' | 'error' | 'ready';
  level?: Level;
  message?: string;
}

export default function PlayPage() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ViewState>({ status: 'loading' });
  const [code, setCode] = useState('');
  const [runResult, setRunResult] = useState<RunAndJudgeResult | null>(null);
  const [nextLevelId, setNextLevelId] = useState<string | null>(null);

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

        // 计算下一关（使用 progressStore）
        const progress = progressStore.getProgress();
        const next = await pickNextLevelInSameGame(level, progress.completedLevels);
        setNextLevelId(next ? ((next as any).id as string | undefined) ?? null : null);
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

  // useMemo 必须在所有条件返回之前调用
  const visual = useMemo(() => {
    if (state.status === 'ready' && state.level) {
      return renderVisualization(state.level, runResult);
    }
    return null;
  }, [state.status, state.level, runResult]);

  if (state.status === 'loading') {
    return <div className="card" style={{ height: 240 }} />;
  }

  if (state.status === 'error' || !state.level) {
    return <div className="alert alert-error">{state.message ?? '加载失败'}</div>;
  }

  const level = state.level;
  const summary = level.story || (level.goals?.length ? `目标：${level.goals.join('、')}` : '');

  const handleGoNext = () => {
    if (nextLevelId) {
      navigate(`/play/${nextLevelId}`);
    }
  };

  const handleResult = (result: RunAndJudgeResult) => {
    setRunResult(result);
    // 如果通关，重新计算下一关
    if (result.judge.passed && state.level) {
      const progress = progressStore.getProgress();
      pickNextLevelInSameGame(state.level, progress.completedLevels).then((next) => {
        setNextLevelId(next ? ((next as any).id as string | undefined) ?? null : null);
      });
    }
  };

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
        onResult={handleResult}
        gameRunner={{ render: () => visual }}
        nextLevelId={nextLevelId}
        onGoNext={handleGoNext}
        game={level.gameType}
      />
    </div>
  );
}

function renderVisualization(level: Level, result: RunAndJudgeResult | null): ReactNode {
  if (!result) {
    // 如果没有运行结果，根据游戏类型显示默认内容
    switch (level.gameType) {
      case 'pixel': {
        return <div className="text-muted">点击"运行代码"按钮查看像素图案效果。</div>;
      }
      case 'io':
        return <p className="text-muted">运行代码后将在此显示输入输出结果。</p>;
      case 'music':
        return <p className="text-muted">运行代码后将在此显示音乐序列。</p>;
      case 'led':
        return <p className="text-muted">运行代码后将在此显示灯阵状态。</p>;
      case 'maze':
        return <p className="text-muted">运行代码后将在此显示迷宫导航结果。</p>;
      default:
        return <p className="text-muted">运行代码后将在此显示可视化结果。</p>;
    }
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
      return <MazePreview level={level} result={result} />;
    default:
      return <div className="alert alert-warn">暂无 {level.gameType} 类型的可视化。</div>;
  }
}

function IoPreview({ result }: { result: RunAndJudgeResult }): ReactNode {
  const cases = result.artifacts.ioCases ?? [];
  if (!cases.length) {
    return <div className="text-muted">未提供输入输出示例。</div>;
  }
  
  // 将JSON字符串中的转义字符转换为真实字符
  const unescapeString = (str: string): string => {
    return str.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
  };
  
  return (
    <div className="kc-list">
      {cases.map((item, index) => (
        <div key={`${item.input}-${index}`} className="kc-list__item">
          <div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              输入
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {item.input ? unescapeString(item.input) : '(空)'}
            </pre>
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              期望
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {unescapeString(item.expected)}
            </pre>
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              输出
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {item.actual}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}

function PixelPreview({ result }: { result: RunAndJudgeResult }): ReactNode {
  const matrix = result.artifacts.pixelMatrix;
  if (!matrix || matrix.length === 0) {
    return <div className="text-muted">点击"运行代码"按钮查看像素图案效果。</div>;
  }
  
  // 检查是否全为0（空矩阵）
  const isEmptyMatrix = matrix.every(row => row.every(cell => cell === 0));
  if (isEmptyMatrix) {
    return <div className="text-muted">代码执行后未产生像素输出，请检查代码逻辑。</div>;
  }
  
  const columns = Math.max(...matrix.map((row) => row.length));
  const cellSize = Math.min(24, Math.max(12, 360 / Math.max(matrix.length, columns))); // 动态调整单元格大小
  
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
        gap: Math.max(2, cellSize / 4),
        justifyContent: 'start',
        padding: 12,
        background: 'rgba(255,255,255,.04)',
        borderRadius: 12,
        maxHeight: '400px',
        maxWidth: '100%',
        overflow: 'auto', // 添加滚动支持
      }}
    >
      {matrix.flatMap((row, y) =>
        row.map((value, x) => (
          <div
            key={`${x}-${y}`}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: Math.max(2, cellSize / 4),
              border: '1px solid rgba(148,163,184,.35)',
              // 支持 0/1 与 0-255 两种像素值范围
              background: value
                ? `rgba(93,168,255, ${
                    value <= 1
                      ? (value === 1 ? 1 : Math.min(value, 1))
                      : value > 128
                        ? 1
                        : Math.min(value / 255, 1)
                  })`
                : 'rgba(15,23,42,.2)',
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

function MazePreview({ level, result }: { level: Level; result: RunAndJudgeResult }): ReactNode {
  const diff = result.artifacts.raw ?? {};
  
  // 从关卡数据中获取迷宫配置，如果没有则使用默认值
  const mazeData = (diff as any).maze || (level as any).assets?.maze || ['######', '#S...#', '#.##E#', '######'];
  const maxSteps = (level as any).assets?.maxSteps3Star || 10;
  
  // 从执行结果中获取事件和统计信息（从raw数据中解析）
  const events = (diff as any).events || [];
  const steps = (diff as any).steps || 0;
  const code = (diff as any).code || level.starter?.code || '';
  
  // 构建一个兼容的关卡对象
  const mazeLevel = {
    ...level,
    id: level.id || 'preview-maze',
    title: level.title || '迷宫预览',
    lang: level.lang || 'python',
    gameType: 'maze',
    starter: {
      code: code
    },
    assets: {
      maze: mazeData,
      maxSteps3Star: maxSteps
    },
    grader: level.grader || {
      mode: 'event',
      checks: [
        { type: 'goal', name: 'reach_end', must: true },
        { type: 'maxSteps', value: maxSteps }
      ]
    }
  };

  // 导入MazeRunner组件
  const { MazeRunner } = require('../../games/maze/MazeRunner');
  
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <strong>迷宫可视化：</strong>
        {steps > 0 && <span style={{ marginLeft: 8 }}>步数: {steps}</span>}
        {maxSteps && <span style={{ marginLeft: 8 }}>最大步数: {maxSteps}</span>}
      </div>
      <MazeRunner level={mazeLevel} />
      {events.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <strong>事件日志：</strong>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace', fontSize: 12 }}>
            {JSON.stringify(events, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
