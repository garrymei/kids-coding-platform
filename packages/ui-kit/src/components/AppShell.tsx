import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

export interface AppRoute {
  path: string;
  element: React.ReactNode;
  index?: boolean;
}

export interface AppShellProps {
  routes: AppRoute[];
  layout: React.ComponentType<{ children?: React.ReactNode }>;
  defaultRedirect: string;
}

export function AppShell({ routes, layout: Layout, defaultRedirect }: AppShellProps) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to={defaultRedirect} replace />} />
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
        <Route path="*" element={<Navigate to={defaultRedirect} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
