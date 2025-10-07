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
const TestPage = lazy(() => import('./pages/TestPage'));
const LearnPage = lazy(() => import('./pages/Learn/LearnPage'));

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
        element: withSuspense(<CoursesPage />, '课程加载中...'),
      },
      {
        path: 'map',
        element: withSuspense(<MapPage />, '地图加载中...'),
      },
      {
        path: 'works',
        element: withSuspense(<WorksPage />, '作品加载中...'),
      },
      {
        path: 'tasks',
        element: withSuspense(<TasksPage />, '任务加载中...'),
      },
      {
        path: 'achievements',
        element: withSuspense(<AchievementsPage />, '成就加载中...'),
      },
      {
        path: 'test',
        element: withSuspense(<TestPage />, '测试页面加载中...'),
      },
      {
        path: 'leaderboard',
        element: withSuspense(<LeaderboardPage />, '排行榜加载中...'),
      },
      {
        path: 'rank',
        element: withSuspense(<LeaderboardPage />, '排行榜加载中...'),
      },
      {
        path: 'play/:levelId',
        element: <PlayPage />,
      },
      {
        path: 'learn/:language/:game/:level',
        element: withSuspense(<LearnPage />, '关卡加载中...'),
      },
      {
        path: 'settings',
        element: withSuspense(<SettingsPage />, '设置加载中...'),
      },
      {
        path: 'consents',
        element: withSuspense(<ConsentsPage />, '授权信息加载中...'),
      },
      {
        path: 'my-classes',
        element: withSuspense(<MyClassesPage />, '班级信息加载中...'),
      },
      {
        path: 'packages/:pkgId',
        element: withSuspense(<PackagePage />, '课程包加载中...'),
      },
    ],
  },
  {
    path: '/hub/:lang/:game?',
    element: <HubPage />,
  },
]);
