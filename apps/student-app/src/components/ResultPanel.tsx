import type { ReactNode } from 'react';

export interface ExecutionSummary {
  stdout?: string;
  stderr?: string;
  timeMs: number;
  timeout?: boolean;
  meta?: Record<string, unknown>;
  events?: unknown[];
}

export interface JudgeSummary {
  pass: boolean;
  message?: string;
  details?: unknown;
  score?: number;
  stdout?: string;
  stderr?: string;
  timeMs?: number;
  xpAwarded?: number;
}

export interface ResultPanelProps {
  execution: ExecutionSummary | null;
  judge: JudgeSummary | null;
  isRunning: boolean;
  error?: string | null;
  onViewHints?: () => void;
  onViewReference?: () => void;
  showHintButton?: boolean;
  showReferenceButton?: boolean;
  extraFooter?: ReactNode;
}

function renderDetails(details: unknown): ReactNode {
  if (details == null) {
    return null;
  }

  if (typeof details === 'string') {
    return <pre className="result-panel__details-pre">{details}</pre>;
  }

  return <pre className="result-panel__details-pre">{JSON.stringify(details, null, 2)}</pre>;
}

export function ResultPanel({
  execution,
  judge,
  isRunning,
  error,
  onViewHints,
  onViewReference,
  showHintButton = false,
  showReferenceButton = false,
  extraFooter,
}: ResultPanelProps) {
  if (error) {
    return (
      <div className="result-panel result-panel--error" role="alert">
        <div className="result-panel__header">
          <span className="result-panel__emoji">⚠️</span>
          <div>
            <h4 className="result-panel__title">运行出错</h4>
            <p className="result-panel__subtitle">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isRunning) {
    return (
      <div className="result-panel result-panel--pending" role="status">
        <div className="result-panel__header">
          <span className="result-panel__emoji">⏳</span>
          <div>
            <h4 className="result-panel__title">正在运行...</h4>
            <p className="result-panel__subtitle">请稍候，正在执行代码并判题</p>
          </div>
        </div>
      </div>
    );
  }

  if (!execution && !judge) {
    return (
      <div className="result-panel result-panel--placeholder">
        <div className="result-panel__header">
          <span className="result-panel__emoji">🚀</span>
          <div>
            <h4 className="result-panel__title">准备好出发了吗？</h4>
            <p className="result-panel__subtitle">运行代码后，这里会显示输出、判题和奖励。</p>
          </div>
        </div>
      </div>
    );
  }

  const passed = !!judge?.pass;
  const statusClass = passed ? 'result-panel--success' : 'result-panel--warn';

  return (
    <div className={`result-panel ${statusClass}`}>
      <div className="result-panel__header">
        <span className="result-panel__emoji">{passed ? '🎉' : '💡'}</span>
        <div className="result-panel__header-texts">
          <h4 className="result-panel__title">
            {judge?.message || (passed ? '恭喜通关！' : '还差一点点')}
          </h4>
          <p className="result-panel__subtitle">
            {passed
              ? `耗时 ${Math.round(execution?.timeMs ?? 0)}ms · 得分 ${judge?.score ?? 100} · XP +${judge?.xpAwarded ?? 0}`
              : '检查程序输出和提示信息，再试一次吧。'}
          </p>
        </div>
      </div>

      <div className="result-panel__content">
        {/* Execution output */}
        {execution?.stderr ? (
          <div className="result-panel__block result-panel__block--error">
            <header>
              <span>🐛 运行时错误</span>
              <span>{Math.round(execution.timeMs)}ms</span>
            </header>
            <pre className="result-panel__details-pre">{execution.stderr}</pre>
          </div>
        ) : execution?.stdout ? (
          <div className="result-panel__block">
            <header>
              <span>📤 程序输出</span>
              <span>{Math.round(execution.timeMs)}ms</span>
            </header>
            <pre className="result-panel__details-pre">{execution.stdout}</pre>
          </div>
        ) : null}

        {/* Judge details */}
        {judge?.details && (
          <div className="result-panel__block">
            <header>
              <span>🧪 判题详情</span>
              {typeof judge.score === 'number' && <span>得分 {judge.score}</span>}
            </header>
            {renderDetails(judge.details)}
          </div>
        )}

        {/* Extra diagnostic */}
        {execution?.timeout && (
          <div className="result-panel__block result-panel__block--warn">
            <header>
              <span>⌛ 运行超时</span>
            </header>
            <p className="result-panel__subtitle">
              检测到可能的无限循环，尝试增加终止条件或减少循环次数。
            </p>
          </div>
        )}
      </div>

      {!passed && (showHintButton || showReferenceButton) && (
        <div className="result-panel__actions">
          {showHintButton && (
            <button type="button" className="btn btn-secondary" onClick={onViewHints}>
              💡 查看提示
            </button>
          )}
          {showReferenceButton && (
            <button type="button" className="btn" onClick={onViewReference}>
              📖 查看参考答案
            </button>
          )}
        </div>
      )}

      {extraFooter}
    </div>
  );
}
