import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StudentProvider } from './store/studentStore';
import { router } from './routes';
import './App.css';
import './styles/theme.css';

export default function App() {
  return (
    <ErrorBoundary>
      <StudentProvider>
        <ConfigProvider locale={zhCN}>
          <RouterProvider router={router} />
        </ConfigProvider>
      </StudentProvider>
    </ErrorBoundary>
  );
}
