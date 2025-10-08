import { TrendPage } from './pages/Insights/Trend';
import { AppShell, type AppRoute } from '@kids/ui-kit';
import { AppLayout } from './layouts/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { ReportsPage } from './pages/ReportsPage';
import { SearchStudentsPage } from './pages/SearchStudentsPage';
import { RequestsPage } from './pages/RequestsPage'; // Import the new page
import './App.css';
import { useEffect } from 'react';
import { useAuthStore } from './stores/auth';
import { LoginPage } from '@kids/ui-kit';

const routes: AppRoute[] = [
  { path: 'dashboard', element: <OverviewPage /> },
  { path: 'search', element: <SearchStudentsPage /> },
  { path: 'requests', element: <RequestsPage /> },
  { path: 'reports', element: <ReportsPage /> },
  { path: 'insights/trend', element: <TrendPage /> },
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

  return <AppShell routes={routes} layout={AppLayout} defaultRedirect="/dashboard" />;
}
