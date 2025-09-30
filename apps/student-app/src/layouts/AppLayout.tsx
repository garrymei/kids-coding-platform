import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';

export function AppLayout() {
  return (
    <div className="page-shell">
      <a className="skip-link" href="#main-content">
        ����������
      </a>
      <AppHeader />
      <main id="main-content" style={{ paddingTop: 16, minHeight: '100vh' }}>
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
