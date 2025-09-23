import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout.js';
import { ClassesPage } from './pages/ClassesPage.js';
import { AssignmentsPage } from './pages/AssignmentsPage.js';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/classes" replace />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/classes" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
