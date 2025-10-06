import { TrendPage } from './pages/Insights/Trend';
import { AppShell, type AppRoute } from '@kids/ui-kit';
import { AppLayout } from './layouts/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { ReportsPage } from './pages/ReportsPage';
import { SearchStudentsPage } from './pages/SearchStudentsPage';
import { RequestsPage } from './pages/RequestsPage'; // Import the new page
import './App.css';

const routes: AppRoute[] = [
  { path: 'dashboard', element: <OverviewPage /> },
  { path: 'search', element: <SearchStudentsPage /> },
  { path: 'requests', element: <RequestsPage /> },
  { path: 'reports', element: <ReportsPage /> },
  { path: 'insights/trend', element: <TrendPage /> },
];

export default function App() {
  return <AppShell routes={routes} layout={AppLayout} defaultRedirect="/dashboard" />;
}
