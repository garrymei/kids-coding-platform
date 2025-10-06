import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Level } from '@kids/types';
import { runAndJudge, type RunAndJudgeResult } from '../lib/runAndJudge';
import { RunFeedback } from './RunFeedback';

interface RunPanelProps {
  level: Level;
  code: string;
  onCodeChange: (next: string) => void;
  onResult?: (result: RunAndJudgeResult) => void;
  gameRunner?: {
    render?: (result: RunAndJudgeResult | null) => ReactNode;
  };
}

/**
 * 标准化的代码运行面板
 * 提供统一的代码编辑和运行结果展示
 */
export function RunPanel({ level, code, onCodeChange, onResult, gameRunner }: RunPanelProps) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RunAndJudgeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    if (!code.trim()) {
      setError('请输入代码后再运行');
      setResult(null);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const data = await runAndJudge({ level, code });
      setResult(data);
      onResult?.(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : '运行失败，请稍后重试';
      setError(message);
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

      const handleReset = () => {
        onCodeChange(level.starter?.code || '');
        setResult(null);
        setError(null);
      };

  return (
    <div className="grid duo">
      {/* 代码编辑区 */}
      <section className="card" aria-label="代码编辑器">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <strong style={{ fontSize: 16 }}>💻 代码编辑器</strong>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-ghost"
              onClick={handleReset}
              disabled={busy}
              title="重置为初始代码"
            >
              ↺ 重置
            </button>
            <button
              className="btn btn-cta"
              onClick={handleRun}
              disabled={busy}
              style={{
                minWidth: 120,
                position: 'relative',
              }}
            >
              {busy ? (
                <>
                  <span style={{ marginRight: 8 }}>⏳</span>
                  运行中...
                </>
              ) : (
                <>
                  <span style={{ marginRight: 8 }}>▶</span>
                  运行代码
                </>
              )}
            </button>
          </div>
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
          placeholder="在这里编写你的代码..."
          aria-label="代码输入区"
        />

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
          <span>字符数: {code.length}</span>
          <span>行数: {code.split('\n').length}</span>
        </div>
      </section>

      {/* 运行结果区 */}
      <section className="card" aria-live="polite" aria-busy={busy}>
        <div style={{ marginBottom: 16 }}>
          <strong style={{ fontSize: 16 }}>📊 运行结果</strong>
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
              ⚙️
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>正在运行代码...</p>
          </div>
        ) : (
          <RunFeedback result={result} error={error} visualization={gameRunner?.render?.(result)} />
        )}
      </section>
    </div>
  );
}
