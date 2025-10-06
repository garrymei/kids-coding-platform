import type { ReactNode } from 'react';
import type { RunAndJudgeResult } from '../lib/runAndJudge';

interface RunFeedbackProps {
  result: RunAndJudgeResult | null;
  error: string | null;
  visualization?: ReactNode;
}

/**
 * 标准化的运行反馈组件
 * 提供三段式反馈：stderr / 判题结果 / 可视化
 */
export function RunFeedback({ result, error, visualization }: RunFeedbackProps) {
  // 1. 错误状态（最高优先级）
  if (error) {
    return (
      <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <strong>运行错误</strong>
        </div>
        <p style={{ margin: 0 }}>{error}</p>
      </div>
    );
  }

  // 2. 无结果状态
  if (!result) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: 12 }}>🚀</div>
        <p style={{ margin: 0 }}>运行代码后将在此显示结果和可视化</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 代码结构验证 */}
      {result.structure && !result.structure.valid && (
        <div className="alert alert-warn" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: '18px' }}>📋</span>
            <strong>代码结构提示</strong>
          </div>
          <p style={{ margin: 0 }}>{result.structure.message || '缺少题目要求的代码结构'}</p>
        </div>
      )}

      {/* stderr - 运行时错误 */}
      {result.exec.stderr && (
        <div className="alert alert-error" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: '18px' }}>🐛</span>
            <strong>运行时错误</strong>
          </div>
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              background: 'rgba(239, 68, 68, 0.12)',
              padding: 12,
              borderRadius: 8,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {result.exec.stderr}
          </pre>
        </div>
      )}

      {/* 判题结果 */}
      {result.judge && (
        <div
          className={`alert ${result.judge.passed ? 'alert-success' : 'alert-warn'}`}
          role="status"
          style={{
            border: result.judge.passed
              ? '2px solid rgba(34, 197, 94, 0.4)'
              : '2px solid rgba(245, 158, 11, 0.4)',
            background: result.judge.passed
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: '24px' }}>{result.judge.passed ? '✅' : '💡'}</span>
            <strong style={{ fontSize: 16 }}>{result.judge.message}</strong>
          </div>

          {result.judge.details && (
            <details style={{ marginTop: 12 }}>
              <summary
                style={{
                  cursor: 'pointer',
                  fontWeight: 600,
                  marginBottom: 8,
                  userSelect: 'none',
                }}
              >
                查看详细信息
              </summary>
              <pre
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  background: 'rgba(15, 23, 42, 0.15)',
                  padding: 12,
                  borderRadius: 8,
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {result.judge.details}
              </pre>
            </details>
          )}

          {/* 通过动画 */}
          {result.judge.passed && (
            <div
              style={{
                marginTop: 16,
                padding: '16px',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: 8,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: 8 }}>🎉</div>
              <p style={{ margin: 0, fontWeight: 600, color: '#22c55e' }}>恭喜！代码运行正确！</p>
              <p style={{ margin: '4px 0 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
                耗时: {result.exec.durationMs.toFixed(0)}ms
              </p>
            </div>
          )}
        </div>
      )}

      {/* stdout - 标准输出（仅在无stderr时显示） */}
      {!result.exec.stderr && result.exec.stdout && (
        <div className="alert" style={{ background: 'rgba(93, 168, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: '18px' }}>📤</span>
            <strong>程序输出</strong>
          </div>
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              background: 'rgba(15, 23, 42, 0.15)',
              padding: 12,
              borderRadius: 8,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {result.exec.stdout}
          </pre>
        </div>
      )}

      {/* I/O测试用例对比 */}
      {result.artifacts.ioCases && result.artifacts.ioCases.length > 0 && (
        <div className="alert" style={{ background: 'rgba(167, 139, 250, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: '18px' }}>🧪</span>
            <strong>测试用例</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {result.artifacts.ioCases.map((testCase, index) => {
              const passed = testCase.actual === testCase.expected;
              return (
                <div
                  key={index}
                  style={{
                    padding: 12,
                    background: passed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderRadius: 8,
                    borderLeft: `4px solid ${passed ? '#22c55e' : '#ef4444'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 16 }}>{passed ? '✅' : '❌'}</span>
                    <strong style={{ fontSize: 14 }}>用例 {index + 1}</strong>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    <div style={{ marginBottom: 4 }}>
                      <strong>输入：</strong>
                      <code
                        style={{
                          background: 'rgba(15, 23, 42, 0.2)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          marginLeft: 8,
                        }}
                      >
                        {testCase.input || '(空)'}
                      </code>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <strong>期望输出：</strong>
                      <code
                        style={{
                          background: 'rgba(15, 23, 42, 0.2)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          marginLeft: 8,
                        }}
                      >
                        {testCase.expected}
                      </code>
                    </div>
                    <div>
                      <strong>实际输出：</strong>
                      <code
                        style={{
                          background: 'rgba(15, 23, 42, 0.2)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          marginLeft: 8,
                          color: passed ? '#22c55e' : '#ef4444',
                        }}
                      >
                        {testCase.actual}
                      </code>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 可视化区域 */}
      {visualization && (
        <div
          className="card"
          style={{
            padding: 20,
            background:
              'linear-gradient(135deg, rgba(93, 168, 255, 0.08), rgba(167, 139, 250, 0.05))',
            border: '1px solid rgba(93, 168, 255, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: '20px' }}>🎨</span>
            <strong style={{ fontSize: 16 }}>可视化展示</strong>
          </div>
          {visualization}
        </div>
      )}
    </div>
  );
}
