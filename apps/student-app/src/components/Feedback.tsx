import type { ReactNode } from 'react';

interface ErrorViewProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  extra?: ReactNode;
}

export function ErrorView({
  title = '加载失败',
  message = '发生了意外错误，请稍后重试。',
  actionLabel = '重试',
  onAction,
  extra,
}: ErrorViewProps) {
  return (
    <div className="card" role="alert" style={{ textAlign: 'center' }}>
      <h3 style={{ marginBottom: 8 }}>{title}</h3>
      <p className="text-muted" style={{ marginBottom: 16 }}>
        {message}
      </p>
      {onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      {extra && <div style={{ marginTop: 16 }}>{extra}</div>}
    </div>
  );
}

interface EmptyViewProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyView({
  title = '暂无数据',
  description = '试着调整筛选条件或稍后重试。',
  action,
}: EmptyViewProps) {
  return (
    <div className="card" style={{ textAlign: 'center', paddingBlock: 48 }}>
      <h3 style={{ marginBottom: 8 }}>{title}</h3>
      <p className="text-muted" style={{ marginBottom: 16 }}>{description}</p>
      {action}
    </div>
  );
}

interface PageSkeletonProps {
  rows?: number;
}

export function PageSkeleton({ rows = 5 }: PageSkeletonProps) {
  return (
    <div className="card" aria-busy="true" aria-live="polite">
      <div
        style={{
          display: 'grid',
          gap: 12,
        }}
      >
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            style={{
              height: 18,
              borderRadius: 8,
              background: 'linear-gradient(90deg, #eef2ff, #f8fafc, #eef2ff)',
              animation: 'pulse 1.4s ease-in-out infinite',
            }}
          />
        ))}
      </div>
      <style>
        {@keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }}
      </style>
    </div>
  );
}
