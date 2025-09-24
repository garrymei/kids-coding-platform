import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout.js';
import { OverviewPage } from './pages/OverviewPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { SearchStudentsPage } from './pages/SearchStudentsPage.js';
import { ChildDataPage } from './pages/ChildDataPage.js';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<OverviewPage />} />
          <Route path="search" element={<SearchStudentsPage />} />
          <Route path="requests" element={<ChildDataPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
