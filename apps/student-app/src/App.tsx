import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { router } from './routes';
import './App.css';
import './styles/theme.css';
import { useEffect } from 'react';
import { useAuthStore } from './stores/auth';
import { LoginPage } from '@kids/ui-kit';

export default function App() {
  const { isAuthenticated, isLoading, fetchProfile, login, error } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  console.log('App render:', { isLoading, isAuthenticated, isDev: import.meta.env.DEV });

  if (isLoading) {
    return (
      <div style={{ padding: '20px', color: 'white', background: '#0b1020', minHeight: '100vh' }}>
        Loading...
      </div>
    );
  }

  // 开发模式下跳过登录验证
  if (import.meta.env.DEV) {
    return (
      <ErrorBoundary>
        <ConfigProvider locale={zhCN}>
          <RouterProvider router={router} />
        </ConfigProvider>
      </ErrorBoundary>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} isLoading={isLoading} error={error} />;
  }

  return (
    <ErrorBoundary>
      <ConfigProvider locale={zhCN}>
        <RouterProvider router={router} />
      </ConfigProvider>
    </ErrorBoundary>
  );
}
