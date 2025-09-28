import { AppShell, AppRoute } from '@kids/ui-kit';
import { AppLayout } from './layouts/AppLayout';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { ClassManagementPage } from './pages/ClassManagementPage';
import { ClassesPage } from './pages/ClassesPage';
import './App.css';

const routes: AppRoute[] = [
  { path: 'classes', element: <ClassesPage /> },
  { path: 'approvals', element: <ClassManagementPage /> },
  { path: 'assignments', element: <AssignmentsPage /> },
];

export default function App() {
  return <AppShell routes={routes} layout={AppLayout} defaultRedirect="/classes" />;
}
