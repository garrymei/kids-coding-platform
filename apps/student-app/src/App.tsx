import { lazy, Suspense } from 'react';
import { AppShell } from '@kids/ui-kit';
import type { AppRoute } from '@kids/ui-kit';
import { AppLayout } from './layouts/AppLayout';
import { CoursesPage } from './pages/CoursesPage';
import { HomePage } from './pages/HomePage';
import './App.css';

// Create a simple component without any complex dependencies
const LabPage = () => (
  <div style={{ padding: '20px' }}>
    <h2>🧪 实验室</h2>
    <p>Blockly 编程环境正在开发中...</p>
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f8faff', 
      borderRadius: '10px',
      border: '1px solid #e0e7ff'
    }}>
      <p>功能包括：</p>
      <ul>
        <li>✅ 拖拽式编程界面</li>
        <li>✅ Python 代码生成</li>
        <li>✅ 实时代码执行</li>
        <li>✅ 结果展示</li>
      </ul>
    </div>
  </div>
);

const routes: AppRoute[] = [
  { path: 'home', element: <HomePage /> },
  { path: 'courses', element: <CoursesPage /> },
  { path: 'lab', element: <LabPage /> },
];

export default function App() {
  return (
    <Suspense fallback={<div>Loading Page...</div>}>
      <AppShell routes={routes} layout={AppLayout} defaultRedirect="/home" />
    </Suspense>
  );
}