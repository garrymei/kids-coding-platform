import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { router } from './routes';
import './App.css';

export default function App() {
  return (
    <ErrorBoundary>
      <ConfigProvider locale={zhCN}>
        <RouterProvider router={router} />
      </ConfigProvider>
    </ErrorBoundary>
  );
}
