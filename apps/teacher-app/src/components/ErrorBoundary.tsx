import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    this.reportError(error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userId: typeof window !== 'undefined' ? localStorage.getItem('teacherId') || 'anonymous' : 'anonymous',
      };

      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      }).catch((err) => {
        console.error('Failed to report error:', err);
      });
    } catch (reportError) {
      console.error('Error while reporting error:', reportError);
    }

    console.error('Error caught by boundary:', error, errorInfo);
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: '20px',
            maxWidth: '600px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              padding: '20px',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ color: '#dc2626', margin: '0 0 10px 0' }}>抱歉，页面遇到了问题</h3>
            <p style={{ color: '#7f1d1d', margin: '0 0 15px 0' }}>
              我们已经记录了这个问题，正在努力尽快修复。
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details
                style={{
                  textAlign: 'left',
                  backgroundColor: '#ffffff',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  marginTop: '10px',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  错误详情（开发模式）
                </summary>
                <pre
                  style={{
                    fontSize: '12px',
                    color: '#dc2626',
                    overflow: 'auto',
                    marginTop: '10px',
                  }}
                >
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={this.handleRetry}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              🔄 重试
            </button>

            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              🔃 刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}