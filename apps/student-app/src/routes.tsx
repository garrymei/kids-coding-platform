import { lazy } from 'react';
import type { AppRoute } from '@kids/ui-kit';
import { HomePage } from './pages/HomePage';
import { CoursesPage } from './pages/CoursesPage';

// 懒加载页面组件
const LabPage = lazy(() => import('./pages/LabPage').then((m) => ({ default: m.LabPage })));
const WorksPage = lazy(() => import('./pages/WorksPage').then((m) => ({ default: m.WorksPage })));
const LeaderboardPage = lazy(() =>
  import('./pages/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })),
);
const PlayPage = lazy(() => import('./pages/PlayPage').then((m) => ({ default: m.PlayPage })));

export const routes: AppRoute[] = [
  { path: 'home', element: <HomePage /> },
  { path: 'courses', element: <CoursesPage /> },
  { path: 'lab', element: <LabPage /> },
  { path: 'works', element: <WorksPage /> },
  { path: 'leaderboard', element: <LeaderboardPage /> },
  { path: 'play/:levelId', element: <PlayPage /> },
  // 课程地图路由
  { path: 'hub/python', element: <CoursesPage /> },
  { path: 'hub/python/led', element: <LabPage /> },
];

export default routes;
