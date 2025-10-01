import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Card, Button } from "@kids/ui-kit";

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
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    this.reportError(error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    if (typeof window === "undefined") {
      return;
    }

    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: window.navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
    };

    fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorReport),
    }).catch((fetchError) => {
      console.error("Failed to report error", fetchError);
    });

    console.error("Error caught by boundary:", error, errorInfo);
  }

  private getCurrentUserId(): string {
    if (typeof window === "undefined") {
      return "anonymous";
    }

    try {
      return window.localStorage.getItem("studentId") || "anonymous";
    } catch {
      return "anonymous";
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    const { children, fallback } = this.props;
    const { hasError, error } = this.state;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      return fallback;
    }

    return (
      <div
        style={{
          padding: "20px",
          maxWidth: "620px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <Card heading="⚠️ 出现了一些问题">
          <div
            style={{
              padding: "20px",
              backgroundColor: "#fef2f2",
              borderRadius: "8px",
              border: "1px solid #fecaca",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ color: "#dc2626", margin: "0 0 10px 0" }}>抱歉，页面遇到了问题</h3>
            <p style={{ color: "#7f1d1d", margin: "0 0 15px 0" }}>
              我们已经记录了这个问题，正在努力修复中。
            </p>

            {import.meta.env.DEV && error && (
              <details
                style={{
                  textAlign: "left",
                  backgroundColor: "#ffffff",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  marginTop: "10px",
                }}
              >
                <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
                  错误详情（开发模式）
                </summary>
                <pre
                  style={{
                    fontSize: "12px",
                    color: "#dc2626",
                    overflow: "auto",
                    marginTop: "10px",
                  }}
                >
                  {error.message}
                  {"\n\n"}
                  {error.stack}
                </pre>
              </details>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <Button
              onClick={this.handleRetry}
              style={{
                backgroundColor: "#3b82f6",
                color: "white",
                padding: "10px 20px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              🔄 重试
            </Button>

            <Button
              onClick={this.handleReload}
              style={{
                backgroundColor: "#6b7280",
                color: "white",
                padding: "10px 20px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              🔃 刷新页面
            </Button>
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              backgroundColor: "#f3f4f6",
              borderRadius: "6px",
              fontSize: "14px",
              color: "#6b7280",
              textAlign: "left",
            }}
          >
            <p style={{ margin: "0 0 10px 0" }}>
              <strong>如果问题持续存在，请尝试：</strong>
            </p>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              <li>检查网络连接</li>
              <li>清除浏览器缓存</li>
              <li>联系技术支持</li>
            </ul>
          </div>
        </Card>
      </div>
    );
  }
}

export function withErrorBoundary<P extends object>(
  ComponentToWrap: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">,
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <ComponentToWrap {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    ComponentToWrap.displayName || ComponentToWrap.name || "Component"
  })`;

  return WrappedComponent;
}
