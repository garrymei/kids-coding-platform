import React, { Suspense, lazy } from 'react';
import { AppShell, AppRoute } from '@kids/ui-kit';
import { AppLayout } from './layouts/AppLayout';
import { CoursesPage } from './pages/CoursesPage';
import { HomePage } from './pages/HomePage';
import './App.css';

// NOTE: Lazy loading is re-enabled with the corrected default export
const LabPage = lazy(() => import('./pages/LabPage'));

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