import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { DevQuickLinks } from '../components/DevQuickLinks';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((open) => !open);

  return (
    <div className="kc-app-shell">
      <AppHeader onToggleSidebar={toggleSidebar} />
      <div className="kc-body">
        <AppSidebar open={sidebarOpen} onClose={closeSidebar} />
        <main className="kc-main">
          <div className="kc-container">
            <Outlet />
          </div>
        </main>
      </div>
      <DevQuickLinks />
    </div>
  );
}
