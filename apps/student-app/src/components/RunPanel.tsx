import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Level } from '@kids/types';
import { runAndJudge, type RunAndJudgeResult } from '../lib/runAndJudge';

interface RunPanelProps {
  level: Level;
  code: string;
  onCodeChange: (next: string) => void;
  onResult?: (result: RunAndJudgeResult) => void;
  gameRunner?: {
    render?: (result: RunAndJudgeResult | null) => ReactNode;
  };
}

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

  return (
    <div className="grid duo">
      <section className="card" aria-label="代码编辑器">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong>代码编辑器</strong>
          <button className="btn btn-cta" onClick={handleRun} disabled={busy}>
            {busy ? '运行中…' : '▶ 运行代码'}
          </button>
        </div>
        <textarea
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
          rows={14}
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
          }}
          placeholder="在这里编写你的代码..."
        />
      </section>

      <section className="card" aria-live="polite" aria-busy={busy}>
        <strong style={{ display: 'block', marginBottom: 12 }}>运行结果</strong>

        {error && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}

        {result?.structure && !result.structure.valid && (
          <div className="alert alert-warn" role="alert" style={{ marginBottom: 12 }}>
            {result.structure.message || '缺少题目要求的代码结构'}
          </div>
        )}

        {result?.judge && (
          <div
            className={`alert ${result.judge.passed ? 'alert-success' : 'alert-warn'}`}
            role="status"
            style={{ marginBottom: 12 }}
          >
            <strong>{result.judge.message}</strong>
            {result.judge.details && (
              <pre
                style={{
                  marginTop: 8,
                  whiteSpace: 'pre-wrap',
                  background: 'rgba(15, 23, 42, 0.12)',
                  padding: 12,
                  borderRadius: 10,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                }}
              >
                {result.judge.details}
              </pre>
            )}
          </div>
        )}

        {result?.exec.stderr && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 12 }}>
            <strong>stderr</strong>
            <pre
              style={{
                marginTop: 8,
                whiteSpace: 'pre-wrap',
                background: 'rgba(239, 68, 68, 0.12)',
                padding: 10,
                borderRadius: 10,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              }}
            >
              {result.exec.stderr}
            </pre>
          </div>
        )}

        {result?.exec.stdout && (
          <div className="alert" style={{ marginBottom: 12 }}>
            <strong>stdout</strong>
            <pre
              style={{
                marginTop: 8,
                whiteSpace: 'pre-wrap',
                background: 'rgba(15, 23, 42, 0.12)',
                padding: 10,
                borderRadius: 10,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              }}
            >
              {result.exec.stdout}
            </pre>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          {gameRunner?.render?.(result) || <p className="text-muted">运行代码后将在此显示可视化结果。</p>}
        </div>
      </section>
    </div>
  );
}


