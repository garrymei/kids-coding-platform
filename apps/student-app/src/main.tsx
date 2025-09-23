import './sentry';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { StudentProvider } from './store/studentStore.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StudentProvider>
      <App />
    </StudentProvider>
  </StrictMode>,
);
