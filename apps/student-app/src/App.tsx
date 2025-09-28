import { Suspense } from 'react';
import { AppShell } from '@kids/ui-kit';
import { AppLayout } from './layouts/AppLayout';
import { routes } from './routes';
import './App.css';

export default function App() {
  return (
    <Suspense fallback={<div>Loading Page...</div>}>
      <AppShell routes={routes} layout={AppLayout} defaultRedirect="/home" />
    </Suspense>
  );
}
