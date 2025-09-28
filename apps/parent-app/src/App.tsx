import { AppShell, AppRoute } from '@kids/ui-kit';
import { AppLayout } from './layouts/AppLayout';
import { ChildDataPage } from './pages/ChildDataPage';
import { OverviewPage } from './pages/OverviewPage';
import { ReportsPage } from './pages/ReportsPage';
import { SearchStudentsPage } from './pages/SearchStudentsPage';
import './App.css';

const routes: AppRoute[] = [
  { path: 'dashboard', element: <OverviewPage /> },
  { path: 'search', element: <SearchStudentsPage /> },
  { path: 'requests', element: <ChildDataPage /> },
  { path: 'reports', element: <ReportsPage /> },
];

export default function App() {
  return <AppShell routes={routes} layout={AppLayout} defaultRedirect="/dashboard" />;
}
