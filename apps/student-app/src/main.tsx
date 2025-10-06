import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StudentProvider } from './store/studentStore';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StudentProvider>
      <App />
    </StudentProvider>
  </StrictMode>,
);
