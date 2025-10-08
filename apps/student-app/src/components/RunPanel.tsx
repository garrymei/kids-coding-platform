import { useState } from 'react';
import type { ReactNode } from 'react';

import type { Level } from '@kids/types';
import { runAndJudge, type RunAndJudgeResult } from '../lib/runAndJudge';
import { RunFeedback } from './RunFeedback';
import { progressStore } from '../store/progress';

interface RunPanelProps {
  level: Level;
  code: string;
  onCodeChange: (next: string) => void;
  onResult?: (result: RunAndJudgeResult) => void;
  gameRunner?: {
    render?: (result: RunAndJudgeResult | null) => ReactNode;
  };
  nextLevelId?: string | null; // 下一关ID
  onGoNext?: () => void; // 进入下一关的回调

  game?: string; // 游戏类型
}

/**
 * 标准化的运行面板，提供统一的代码编辑和运行体验。
 */
export function RunPanel({
  level,
  code,
  onCodeChange,
  onResult,
  gameRunner,
  nextLevelId,
  onGoNext,
  game,
}: RunPanelProps) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RunAndJudgeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const handleRun = async () => {
    if (!code.trim()) {
      setError('请先输入要运行的代码');
      setResult(null);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const data = await runAndJudge({ level, code });
      setResult(data);
      onResult?.(data);

      // 如果通过判题，保存进度
      if (data.judge?.passed) {
        const levelId = (level as any).id || `${game}-${(level as any).level}`;
        const xp = 10; // 基础经验值
        const coins = 5; // 基础金币
        
        progressStore.completeLevel(levelId, xp, coins);
        
        console.log(`关卡 ${levelId} 通关成功！获得 ${xp} 经验值和 ${coins} 金币`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '运行失败，请稍后再试';
      setError(message);
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    onCodeChange(level.starter?.code ?? '');
    setResult(null);
    setError(null);
  };

  const handleFillSolution = () => {
    if (level.solution || (level as any).reference_solution) {
      const solution = level.solution || (level as any).reference_solution;
      onCodeChange(solution);
      setShowSolution(false);
    }
  };



  return (
    <div className="grid duo">
      {/* 代码编辑器 */}
      <section className="card" aria-label="代码编辑器">
        <div style={{ marginBottom: 12 }}>
          <strong style={{ fontSize: 16 }}>✏️ 代码编辑器</strong>
        </div>

        <textarea
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
          rows={14}
          disabled={busy}
          style={{
            width: '100%',
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            fontSize: 14,
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 12,
            resize: 'vertical',
            minHeight: 220,
            background: 'rgba(255,255,255,0.02)',
            color: 'var(--text)',
            opacity: busy ? 0.6 : 1,
            cursor: busy ? 'not-allowed' : 'text',
          }}
          placeholder="请在此输入你的代码..."
          aria-label="代码输入框"
        />

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <button
            className="btn btn-cta"
            onClick={handleRun}
            disabled={busy}
            style={{ minWidth: 120 }}
          >
            {busy ? (
              <>
                <span style={{ marginRight: 8 }}>⏳</span>
                运行中...
              </>
            ) : (
              <>
                <span style={{ marginRight: 8 }}>▶️</span>
                运行代码
              </>
            )}
          </button>

          {(level.solution || (level as any).reference_solution) && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowSolution((s) => !s)}
              disabled={busy}
              title="查看参考答案"
            >
              {showSolution ? '🙈 隐藏答案' : '💡 查看参考答案'}
            </button>
          )}

          {(level.solution || (level as any).reference_solution) && showSolution && (
            <button
              className="btn btn-primary"
              onClick={handleFillSolution}
              disabled={busy}
              title="将参考答案粘贴到编辑器"
            >
              📋 粘贴到编辑器
            </button>
          )}

          <button
            className="btn btn-ghost"
            onClick={handleReset}
            disabled={busy}
            title="恢复为初始模板"
            style={{ marginLeft: 'auto' }}
          >
            🔄 重置代码
          </button>
        </div>

        {/* 代码统计 */}
        <div
          style={{
            marginTop: 12,
            padding: '8px 12px',
            background: 'rgba(93, 168, 255, 0.08)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>字符数：{code.length}</span>
          <span>行数：{code.split('\n').length}</span>
        </div>

        {/* 参考答案显示区 */}
        {showSolution && (level.solution || (level as any).reference_solution) && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                padding: 12,
                background: '#fff3cd',
                border: '1px solid #ffc107',
                color: '#664d03',
                borderRadius: 8,
                marginBottom: 8,
                fontSize: '0.9em',
                fontWeight: 500,
              }}
            >
              ⚠️ 参考答案仅供学习，建议先独立思考再查看
            </div>
            <pre
              style={{
                background: '#1e1e1e',
                color: '#4ec9b0',
                padding: 16,
                borderRadius: 8,
                overflow: 'auto',
                fontFamily: "'Fira Code', 'Consolas', monospace",
                fontSize: 14,
                margin: 0,
              }}
            >
              {level.solution || (level as any).reference_solution}
            </pre>
          </div>
        )}
      </section>

      {/* 运行结果 */}
      <section className="card" aria-live="polite" aria-busy={busy}>
        <div style={{ marginBottom: 16 }}>
          <strong style={{ fontSize: 16 }}>🎯 运行结果</strong>
        </div>

        {busy ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div
              style={{
                fontSize: '48px',
                marginBottom: 12,
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            >
              🚀
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>正在运行代码，请稍候...</p>
          </div>
        ) : (
          <>
            <RunFeedback
              result={result}
              error={error}
              visualization={gameRunner?.render?.(result)}
            />

            {/* 通过判题后显示"进入下一关"按钮 */}
            {result?.judge?.passed && nextLevelId && onGoNext && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background:
                    'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))',
                  border: '2px solid rgba(34, 197, 94, 0.4)',
                  borderRadius: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'rgb(34, 197, 94)',
                      marginBottom: 4,
                    }}
                  >
                    🎉 恭喜通关！
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    你已成功完成本关，继续挑战下一关吧！
                  </div>
                </div>
                <button
                  className="btn btn-cta"
                  onClick={onGoNext}
                  style={{
                    minWidth: 140,
                    background: 'linear-gradient(135deg, rgb(34, 197, 94), rgb(16, 185, 129))',
                  }}
                >
                  进入下一关 →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}


