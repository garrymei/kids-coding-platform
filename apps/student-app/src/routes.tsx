import React, { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
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

const withSuspense = (element: React.JSX.Element, text: string) => (
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
        element: withSuspense(<CoursesPage />, 'Loading Courses...'),
      },
      {
        path: 'map',
        element: withSuspense(<MapPage />, 'Loading Map...'),
      },
      {
        path: 'works',
        element: withSuspense(<WorksPage />, 'Loading Works...'),
      },
      {
        path: 'leaderboard',
        element: withSuspense(<LeaderboardPage />, 'Loading Leaderboard...'),
      },
      {
        path: 'rank',
        element: withSuspense(<LeaderboardPage />, 'Loading Leaderboard...'),
      },
      {
        path: 'play/:levelId',
        element: <PlayPage />,
      },
      {
        path: 'settings',
        element: withSuspense(<SettingsPage />, 'Loading Settings...'),
      },
      {
        path: 'consents',
        element: withSuspense(<ConsentsPage />, 'Loading Consents...'),
      },
      {
        path: 'my-classes',
        element: withSuspense(<MyClassesPage />, 'Loading Classes...'),
      },
      {
        path: 'packages/:pkgId',
        element: withSuspense(<PackagePage />, 'Loading Package...'),
      },
    ],
  },
  {
    path: '/hub/:lang/:game?',
    element: <HubPage />,
  },
]);