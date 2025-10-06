import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StudentProvider } from './store/studentStore';
import { ThemeProvider } from '@kids/ui-kit';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <StudentProvider>
        <App />
      </StudentProvider>
    </ThemeProvider>
  </StrictMode>,
);
