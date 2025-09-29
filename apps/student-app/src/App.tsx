import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // 在开发环境下打印详细错误信息
        if (import.meta.env.DEV) {
          console.error('Application Error:', error, errorInfo);
        }
      }}
    >
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;