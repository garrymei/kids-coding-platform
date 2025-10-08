import { NavLink, Outlet } from 'react-router-dom';
import { Badge, Button, Avatar, UserProfile } from '@kids/ui-kit';
import { useState } from 'react';
import { useAuthStore } from '../stores/auth';

const navItems = [
  { to: '/dashboard', label: '家庭面板' },
  { to: '/reports', label: '学习报告' },
];

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const [isProfileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <div className="app-shell">
      <header className="app-shell__nav">
        <div className="app-shell__brand">
          <div className="app-shell__logo" aria-hidden>👪</div>
          <div>
            <div className="app-shell__brand-title">Family Portal</div>
            <Badge text="Parent" tone="info" />
          </div>
        </div>

        <nav className="app-shell__nav-links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                ['app-shell__nav-link', isActive ? 'app-shell__nav-link--active' : '']
                  .filter(Boolean)
                  .join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="app-shell__cta" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Button variant="primary">邀请家长</Button>
          {user && (
            <div style={{ position: 'relative' }}>
              <Avatar name={user.name} onClick={() => setProfileOpen((prev) => !prev)} />
              {isProfileOpen && <UserProfile user={user} onLogout={handleLogout} />}
            </div>
          )}
        </div>
      </header>

      <main className="app-shell__main">
        <div className="app-shell__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
