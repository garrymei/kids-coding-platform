import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: CSSProperties;
};

export function Skeleton({
  width = "100%",
  height = "20px",
  borderRadius = "4px",
  className = "",
  style,
}: SkeletonProps) {
  injectAnimationStyles();

  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "#e5e7eb",
        backgroundImage: "linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)",
        backgroundSize: "200% 100%",
        animation: "kcp-skeleton-loading 1.5s infinite",
        ...style,
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
        display: "grid",
        gap: "12px",
      }}
    >
      <Skeleton height="24px" width="60%" />
      <Skeleton height="16px" width="100%" />
      <Skeleton height="16px" width="85%" />
      <Skeleton height="16px" width="70%" />
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 0",
            borderBottom: index < count - 1 ? "1px solid #e5e7eb" : "none",
          }}
        >
          <Skeleton width="40px" height="40px" borderRadius="50%" />
          <div style={{ flex: 1 }}>
            <Skeleton height="16px" width="70%" />
            <Skeleton height="14px" width="50%" style={{ marginTop: "6px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", padding: "12px 0", borderBottom: "2px solid #e5e7eb" }}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} style={{ flex: 1, padding: "0 8px" }}>
            <Skeleton height="16px" width="80%" />
          </div>
        ))}
      </div>

      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: "flex",
            padding: "12px 0",
            borderBottom: rowIndex < rows - 1 ? "1px solid #e5e7eb" : "none",
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} style={{ flex: 1, padding: "0 8px" }}>
              <Skeleton height="14px" width="90%" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = "300px" }: { height?: string }) {
  return (
    <div
      style={{
        height,
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "16px",
      }}
    >
      <Skeleton height="20px" width="40%" />
      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "8px" }}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} height={`${30 + index * 5}%`} width="12%" borderRadius="4px 4px 0 0" />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} height="12px" width="20%" />
        ))}
      </div>
    </div>
  );
}

interface LoadingSpinnerProps {
  text?: string;
}

export function LoadingSpinner({ text = "加载中" }: LoadingSpinnerProps) {
  injectAnimationStyles();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <span
        style={{
          display: "inline-block",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          border: "2px solid rgba(37, 99, 235, 0.2)",
          borderTopColor: "#2563eb",
          animation: "kcp-spin 0.8s linear infinite",
        }}
        aria-hidden
      />
      <span>{text}</span>
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  title = "暂无内容",
  description = "稍后再试或者检查筛选条件。",
  action,
}: EmptyStateProps) {
  return (
    <div
      style={{
        padding: "48px 20px",
        textAlign: "center",
        backgroundColor: "#f8fafc",
        borderRadius: "12px",
        border: "1px dashed #cbd5f5",
      }}
    >
      <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
      <h3 style={{ margin: "0 0 8px", fontSize: "18px" }}>{title}</h3>
      <p style={{ margin: "0 0 16px", color: "#64748b" }}>{description}</p>
      {action}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  retryText?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "出现错误",
  description = "加载数据时出现问题，请稍后重试。",
  retryText = "重试",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      style={{
        padding: "40px 20px",
        textAlign: "center",
        backgroundColor: "#fef2f2",
        borderRadius: "12px",
        border: "1px solid #fecaca",
        display: "grid",
        gap: "16px",
      }}
    >
      <div style={{ fontSize: "44px" }}>⚠️</div>
      <h3 style={{ margin: 0, fontSize: "18px", color: "#dc2626" }}>{title}</h3>
      <p style={{ margin: 0, color: "#7f1d1d", lineHeight: 1.6 }}>{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "10px 20px",
            borderRadius: "6px",
            border: "none",
            color: "white",
            backgroundColor: "#dc2626",
            cursor: "pointer",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = "#b91c1c";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = "#dc2626";
          }}
        >
          {retryText}
        </button>
      )}
    </div>
  );
}

interface DelayedRenderProps {
  delay?: number;
  children: ReactNode;
  fallback?: ReactNode;
}

export function DelayedRender({ delay = 300, children, fallback = null }: DelayedRenderProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  return visible ? <>{children}</> : <>{fallback}</>;
}

function injectAnimationStyles() {
  if (typeof document === "undefined") {
    return;
  }

  const styleId = "kcp-loading-animations";
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    @keyframes kcp-skeleton-loading {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    @keyframes kcp-spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;

  document.head.appendChild(style);
}
