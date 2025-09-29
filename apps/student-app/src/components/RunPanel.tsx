import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Level } from '@kids/types';
import { runAndJudge, type RunAndJudgeResult } from '../lib/runAndJudge';

interface GameRunner {
  render?: (result: RunAndJudgeResult | null) => ReactNode;
  toolbar?: ReactNode;
}

interface RunPanelProps {
  level: Level;
  code: string;
  onCodeChange: (next: string) => void;
  onResult?: (result: RunAndJudgeResult) => void;
  gameRunner?: GameRunner;
}

export function RunPanel({ level, code, onCodeChange, onResult, gameRunner }: RunPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RunAndJudgeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    if (!code.trim()) {
      setError('����������������');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await runAndJudge({ level, code });
      setResult(data);
      onResult?.(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : '����ʧ�ܣ����Ժ�����';
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-2">
      <section className="card" aria-label="����༭��">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong>����༭��</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {gameRunner?.toolbar}
            <button type="button" className="btn btn-primary" onClick={handleRun} disabled={loading}>
              {loading ? '�����С�' : '? ���д���'}
            </button>
          </div>
        </div>
        <textarea
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
          rows={14}
          style={{
            width: '100%',
            fontFamily: 'ui-monospace, SFMono-Regular, SFMono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: 14,
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 12,
            resize: 'vertical',
            minHeight: 220,
          }}
          placeholder="�������д��Ĵ��롭"
        />
      </section>

      <section className="card" aria-live="polite" aria-busy={loading}>
        <strong style={{ display: 'block', marginBottom: 12 }}>���н��</strong>

        {error && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}

        {result?.structure && !result.structure.valid && (
          <div className="alert alert-warn" role="alert" style={{ marginBottom: 12 }}>
            {result.structure.message || 'ȱ�ٱ���Ľṹ����������Ҫ��'}
          </div>
        )}

        {result?.judge && (
          <div
            className={lert }
            role="status"
            style={{ marginBottom: 12 }}
          >
            <strong>{result.judge.message}</strong>
            {result.judge.details && (
              <pre
                style={{
                  marginTop: 8,
                  whiteSpace: 'pre-wrap',
                  background: 'rgba(15, 23, 42, 0.04)',
                  padding: 12,
                  borderRadius: 10,
                  fontFamily: 'ui-monospace, SFMono-Regular, SFMono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                }}
              >
                {result.judge.details}
              </pre>
            )}
          </div>
        )}

        {result?.exec?.stderr && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 12 }}>
            <strong>stderr</strong>
            <pre
              style={{
                marginTop: 8,
                whiteSpace: 'pre-wrap',
                background: 'rgba(239, 68, 68, 0.08)',
                padding: 10,
                borderRadius: 10,
                fontFamily: 'ui-monospace, SFMono-Regular, SFMono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              }}
            >
              {result.exec.stderr}
            </pre>
          </div>
        )}

        {result?.exec?.stdout && (
          <div className="alert" style={{ marginBottom: 12, borderColor: '#d1d5db', background: '#f8fafc' }}>
            <strong>stdout</strong>
            <pre
              style={{
                marginTop: 8,
                whiteSpace: 'pre-wrap',
                background: 'rgba(15, 23, 42, 0.04)',
                padding: 10,
                borderRadius: 10,
                fontFamily: 'ui-monospace, SFMono-Regular, SFMono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              }}
            >
              {result.exec.stdout}
            </pre>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          {gameRunner?.render?.(result) || (
            <p className="text-muted">���к��������鿴���ӻ����</p>
          )}
        </div>
      </section>
    </div>
  );
}
