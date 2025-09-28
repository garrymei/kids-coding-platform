import { AppShell } from '@kids/ui-kit';
import type { AppRoute } from '@kids/ui-kit';
import { AppLayout } from './layouts/AppLayout';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { ClassesPage } from './pages/ClassesPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { OverviewPage } from './pages/classes/Overview';
import { StudentTrendPage } from './pages/classes/StudentTrend';
import './App.css';

const routes: AppRoute[] = [
  { path: 'classes', element: <ClassesPage /> },
  { path: 'classes/:classId/approvals', element: <ApprovalsPage /> },
  { path: 'classes/:classId/overview', element: <OverviewPage /> },
  { path: 'classes/students/:studentId/trend', element: <StudentTrendPage /> },
  { path: 'assignments', element: <AssignmentsPage /> },
];

export default function App() {
  return <AppShell routes={routes} layout={AppLayout} defaultRedirect="/classes" />;
}