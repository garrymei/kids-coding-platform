import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout.js';
import { HomePage } from './pages/HomePage.js';
import { CoursesPage } from './pages/CoursesPage.js';
import { LabPage } from './pages/LabPage.js';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="lab" element={<LabPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
