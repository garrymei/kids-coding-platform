import { AppShell } from '@kids/ui-kit';
import type { AppRoute } from '@kids/ui-kit';
import { AppLayout } from './layouts/AppLayout';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { ClassesPage } from './pages/ClassesPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { OverviewPage } from './pages/classes/Overview';
import { StudentTrendPage } from './pages/classes/StudentTrend';
import './App.css';
import { useEffect } from 'react';
import { useAuthStore } from './stores/auth';
import { LoginPage } from '@kids/ui-kit';

const routes: AppRoute[] = [
  { path: 'classes', element: <ClassesPage /> },
  { path: 'classes/:classId/approvals', element: <ApprovalsPage /> },
  { path: 'classes/:classId/overview', element: <OverviewPage /> },
  { path: 'classes/students/:studentId/trend', element: <StudentTrendPage /> },
  { path: 'assignments', element: <AssignmentsPage /> },
];

export default function App() {
  const { isAuthenticated, isLoading, fetchProfile, login, error } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading) {
    return <div>Loading...</div>; // Or a proper spinner component
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} isLoading={isLoading} error={error} />;
  }

  return <AppShell routes={routes} layout={AppLayout} defaultRedirect="/classes" />;
}