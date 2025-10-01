import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { DevQuickLinks } from '../components/DevQuickLinks';

export default function AppLayout() {
  return (
    <div className="kc-app-shell">
      <AppHeader />
      <main className="kc-main">
        <div className="kc-container">
          <Outlet />
        </div>
      </main>
      <DevQuickLinks />
    </div>
  );
}

