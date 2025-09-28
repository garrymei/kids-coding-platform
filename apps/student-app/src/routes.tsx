import { createBrowserRouter } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { LoadingSpinner } from './components/LoadingStates';

// 立即加载的核心页面
import HomePage from './pages/Home/HomePage';
import HubPage from './pages/Hub/HubPage';
import PlayPage from './pages/Play/PlayPage';

// 懒加载的页面组件
const WorksPage = lazy(() => import('./pages/Works/WorksPage'));
const LeaderboardPage = lazy(() => import('./pages/Leaderboard/LeaderboardPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ConsentsPage = lazy(() => import('./pages/ConsentsPage').then(m => ({ default: m.ConsentsPage })));
const MyClassesPage = lazy(() => import('./pages/MyClassesPage').then(m => ({ default: m.MyClassesPage })));
const PackagePage = lazy(() => import('./pages/PackagePage'));

// 懒加载包装器
const LazyWorksPage = () => (
  <Suspense fallback={<LoadingSpinner text="加载作品页面..." />}>
    <WorksPage />
  </Suspense>
);

const LazyLeaderboardPage = () => (
  <Suspense fallback={<LoadingSpinner text="加载排行榜..." />}>
    <LeaderboardPage />
  </Suspense>
);

const LazySettingsPage = () => (
  <Suspense fallback={<LoadingSpinner text="加载设置页面..." />}>
    <SettingsPage />
  </Suspense>
);

const LazyConsentsPage = () => (
  <Suspense fallback={<LoadingSpinner text="加载授权页面..." />}>
    <ConsentsPage />
  </Suspense>
);

const LazyMyClassesPage = () => (
  <Suspense fallback={<LoadingSpinner text="加载班级页面..." />}>
    <MyClassesPage />
  </Suspense>
);

const LazyPackagePage = () => (
  <Suspense fallback={<LoadingSpinner text="加载课程包..." />}>
    <PackagePage />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    // Example: /hub/python or /hub/python/led
    path: '/hub/:lang/:game?',
    element: <HubPage />,
  },
  {
    path: '/packages/:pkgId',
    element: <LazyPackagePage />,
  },
  {
    path: '/works',
    element: <LazyWorksPage />,
  },
  {
    path: '/leaderboard',
    element: <LazyLeaderboardPage />,
  },
  {
    path: '/play/:levelId',
    element: <PlayPage />,
  },
  {
    path: '/settings',
    element: <LazySettingsPage />,
  },
  {
    path: '/consents',
    element: <LazyConsentsPage />,
  },
  {
    path: '/my-classes',
    element: <LazyMyClassesPage />,
  },
]);