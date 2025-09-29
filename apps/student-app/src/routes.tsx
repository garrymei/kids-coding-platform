import { createBrowserRouter } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppLayout } from './layouts/AppLayout';
import { LoadingSpinner } from './components/LoadingStates';

// Eagerly loaded core screens
import HomePage from './pages/Home/HomePage';
import HubPage from './pages/Hub/HubPage';
import PlayPage from './pages/Play/PlayPage';

// Lazy screens
const CoursesPage = lazy(() => import('./pages/CoursesPage').then((m) => ({ default: m.CoursesPage })));
const WorksPage = lazy(() => import('./pages/Works/WorksPage'));
const LeaderboardPage = lazy(() => import('./pages/Leaderboard/LeaderboardPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const ConsentsPage = lazy(() => import('./pages/ConsentsPage').then((m) => ({ default: m.ConsentsPage })));
const MyClassesPage = lazy(() => import('./pages/MyClassesPage').then((m) => ({ default: m.MyClassesPage })));
const PackagePage = lazy(() => import('./pages/PackagePage'));
const MapPage = lazy(() => import('./pages/MapPage').then((m) => ({ default: m.MapPage })));

const withSuspense = (element: JSX.Element, text: string) => (
  <Suspense fallback={<LoadingSpinner text={text} />}>
    {element}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'courses',
        element: withSuspense(<CoursesPage />, '���ؿγ�ҳ��...'),
      },
      {
        path: 'map',
        element: withSuspense(<MapPage />, '���ؿγ̵�ͼ...'),
      },
      {
        path: 'works',
        element: withSuspense(<WorksPage />, '������Ʒҳ��...'),
      },
      {
        path: 'leaderboard',
        element: withSuspense(<LeaderboardPage />, '�������а�...'),
      },
      {
        path: 'rank',
        element: withSuspense(<LeaderboardPage />, '�������а�...'),
      },
      {
        path: 'play/:levelId',
        element: <PlayPage />,
      },
      {
        path: 'settings',
        element: withSuspense(<SettingsPage />, '��������ҳ��...'),
      },
      {
        path: 'consents',
        element: withSuspense(<ConsentsPage />, '������Ȩҳ��...'),
      },
      {
        path: 'my-classes',
        element: withSuspense(<MyClassesPage />, '���ذ༶ҳ��...'),
      },
      {
        path: 'packages/:pkgId',
        element: withSuspense(<PackagePage />, '���ؿγ̰�...'),
      },
    ],
  },
  {
    path: '/hub/:lang/:game?',
    element: <HubPage />,
  },
]);
