import { NavLink, Outlet } from 'react-router-dom';
import { Badge, Button } from '@kids/ui-kit';

const navItems = [
  { to: '/home', label: '首页' },
  { to: '/courses', label: '课程' },
  { to: '/lab', label: '实验室' },
];

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-shell__nav">
        <div className="app-shell__brand">
          <div className="app-shell__logo" aria-hidden>⚡️</div>
          <div>
            <div className="app-shell__brand-title">Kids Coding</div>
            <Badge text="Beta" tone="info" />
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
        <div className="app-shell__cta">
          <Button rounded>今日任务</Button>
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