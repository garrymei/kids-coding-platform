import React from 'react';

// 骨架屏组件
export function Skeleton({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px',
  className = ''
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#e5e7eb',
        background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s infinite',
      }}
    />
  );
}

// 卡片骨架屏
export function CardSkeleton() {
  return (
    <div style={{
      padding: '20px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: '#ffffff'
    }}>
      <Skeleton height="24px" width="60%" style={{ marginBottom: '12px' }} />
      <Skeleton height="16px" width="100%" style={{ marginBottom: '8px' }} />
      <Skeleton height="16px" width="80%" style={{ marginBottom: '8px' }} />
      <Skeleton height="16px" width="90%" />
    </div>
  );
}

// 列表骨架屏
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 0',
          borderBottom: index < count - 1 ? '1px solid #e5e7eb' : 'none'
        }}>
          <Skeleton width="40px" height="40px" borderRadius="50%" style={{ marginRight: '12px' }} />
          <div style={{ flex: 1 }}>
            <Skeleton height="16px" width="70%" style={{ marginBottom: '4px' }} />
            <Skeleton height="14px" width="50%" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 表格骨架屏
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div style={{ overflow: 'hidden' }}>
      {/* 表头 */}
      <div style={{ display: 'flex', padding: '12px 0', borderBottom: '2px solid #e5e7eb' }}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} style={{ flex: 1, padding: '0 8px' }}>
            <Skeleton height="16px" width="80%" />
          </div>
        ))}
      </div>
      
      {/* 表体 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} style={{ 
          display: 'flex', 
          padding: '12px 0',
          borderBottom: rowIndex < rows - 1 ? '1px solid #e5e7eb' : 'none'
        }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} style={{ flex: 1, padding: '0 8px' }}>
              <Skeleton height="14px" width="90%" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// 图表骨架屏
export function ChartSkeleton({ height = '300px' }: { height?: string }) {
  return (
    <div style={{
      height,
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <Skeleton height="20px" width="40%" style={{ marginBottom: '20px' }} />
      
      {/* 模拟图表区域 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'end', gap: '8px' }}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton 
            key={index}
            height={`${Math.random() * 60 + 20}%`}
            width="12%"
            borderRadius="4px 4px 0 0"
          />
        ))}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} height="12px" width="20%" />
        ))}
      </div>
    </div>
  );
}

// 加载状态组件
export function LoadingSpinner({ 
  size = 'medium',
  color = '#3b82f6',
  text = '加载中...'
}: {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}) {
  const sizeMap = {
    small: '16px',
    medium: '24px',
    large: '32px'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      gap: '12px'
    }}>
      <div
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          border: `2px solid #e5e7eb`,
          borderTop: `2px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      {text && (
        <span style={{
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: '500'
        }}>
          {text}
        </span>
      )}
    </div>
  );
}

// 空状态组件
export function EmptyState({ 
  icon = '📭',
  title = '暂无数据',
  description = '这里还没有内容',
  action,
  actionText = '开始探索'
}: {
  icon?: string;
  title?: string;
  description?: string;
  action?: () => void;
  actionText?: string;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      color: '#6b7280'
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '16px',
        opacity: 0.6
      }}>
        {icon}
      </div>
      
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#374151',
        margin: '0 0 8px 0'
      }}>
        {title}
      </h3>
      
      <p style={{
        fontSize: '14px',
        margin: '0 0 20px 0',
        maxWidth: '300px',
        lineHeight: '1.5'
      }}>
        {description}
      </p>
      
      {action && (
        <button
          onClick={action}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

// 错误状态组件
export function ErrorState({ 
  title = '出现错误',
  description = '加载数据时出现问题',
  onRetry,
  retryText = '重试'
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryText?: string;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '8px'
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '16px'
      }}>
        ⚠️
      </div>
      
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#dc2626',
        margin: '0 0 8px 0'
      }}>
        {title}
      </h3>
      
      <p style={{
        fontSize: '14px',
        color: '#7f1d1d',
        margin: '0 0 20px 0',
        maxWidth: '300px',
        lineHeight: '1.5'
      }}>
        {description}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#b91c1c';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
          }}
        >
          {retryText}
        </button>
      )}
    </div>
  );
}

// 延迟显示组件 - 避免加载闪烁
export function DelayedRender({ 
  delay = 300,
  children,
  fallback = null
}: {
  delay?: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return show ? <>{children}</> : <>{fallback}</>;
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes skeleton-loading {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;
document.head.appendChild(style);
