import React, { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { LoadingSpinner } from './components/LoadingStates';

// Eagerly loaded core screens
import HomePage from './pages/Home/HomePage';
import HubPage from './pages/Hub/HubPage';
import PlayPage from './pages/Play/PlayPage';

// Lazy screens
const CoursesPage = lazy(() =>
  import('./pages/CoursesPage').then((m) => ({ default: m.CoursesPage })),
);
const WorksPage = lazy(() => import('./pages/Works/WorksPage'));
const LeaderboardPage = lazy(() => import('./pages/Leaderboard/LeaderboardPage'));
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const CreativeLandingPage = lazy(() => import('./pages/Creative/CreativeLandingPage'));
const CreativeEditorPage = lazy(() => import('./pages/Creative/CreativeEditorPage'));
const CreativeProjectPage = lazy(() => import('./pages/Creative/CreativeProjectPage'));
const ConsentsPage = lazy(() =>
  import('./pages/ConsentsPage').then((m) => ({ default: m.ConsentsPage })),
);
const MyClassesPage = lazy(() =>
  import('./pages/MyClassesPage').then((m) => ({ default: m.MyClassesPage })),
);
const PackagePage = lazy(() => import('./pages/PackagePage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const TasksPage = lazy(() => import('./pages/Tasks/TasksPage'));
const AchievementsPage = lazy(() => import('./pages/Achievements/AchievementsPage'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'));
const TestPage = lazy(() => import('./pages/TestPage'));
const LearnPage = lazy(() => import('./pages/Learn/LearnPage'));
const GameTesterPage = lazy(() => import('./pages/GameTesterPage'));

const withSuspense = (element: React.JSX.Element, text: string) => (
  <Suspense fallback={<LoadingSpinner text={text} />}>{element}</Suspense>
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
        element: withSuspense(<CoursesPage />, 'Loading courses...'),
      },
      {
        path: 'map',
        element: withSuspense(<MapPage />, 'Loading map...'),
      },
      {
        path: 'works',
        element: withSuspense(<WorksPage />, 'Loading works...'),
      },
      {
        path: 'creative',
        element: withSuspense(<CreativeLandingPage />, 'Loading creative hub...'),
      },
      {
        path: 'creative/editor',
        element: withSuspense(<CreativeEditorPage />, 'Loading creative editor...'),
      },
      {
        path: 'creative/editor/:projectId',
        element: withSuspense(<CreativeEditorPage />, 'Loading creative editor...'),
      },
      {
        path: 'creative/:projectId',
        element: withSuspense(<CreativeProjectPage />, 'Loading project...'),
      },
      {
        path: 'tasks',
        element: withSuspense(<TasksPage />, 'Loading tasks...'),
      },
      {
        path: 'achievements',
        element: withSuspense(<AchievementsPage />, 'Loading achievements...'),
      },
      {
        path: 'profile',
        element: withSuspense(<ProfilePage />, 'Loading profile...'),
      },
      {
        path: 'test',
        element: withSuspense(<TestPage />, 'Loading test page...'),
      },
      {
        path: 'game-tester',
        element: withSuspense(<GameTesterPage />, 'Loading game tester...'),
      },
      {
        path: 'leaderboard',
        element: withSuspense(<LeaderboardPage />, 'Loading leaderboard...'),
      },
      {
        path: 'rank',
        element: withSuspense(<LeaderboardPage />, 'Loading leaderboard...'),
      },
      {
        path: 'play/:levelId',
        element: <PlayPage />,
      },
      {
        path: 'learn/:language/:game/:level',
        element: withSuspense(<LearnPage />, 'Loading level...'),
      },
      {
        path: 'settings',
        element: withSuspense(<SettingsPage />, 'Loading settings...'),
      },
      {
        path: 'consents',
        element: withSuspense(<ConsentsPage />, 'Loading consents...'),
      },
      {
        path: 'my-classes',
        element: withSuspense(<MyClassesPage />, 'Loading classes...'),
      },
      {
        path: 'packages/:pkgId',
        element: withSuspense(<PackagePage />, 'Loading package...'),
      },
    ],
  },
  {
    path: '/hub/:lang/:game?',
    element: <HubPage />,
  },
]);
