import { NavLink, Outlet } from 'react-router-dom';
import { Badge, Button } from '@kids/ui-kit';

const navItems = [
  { to: '/classes', label: '班级概览' },
  { to: '/overview', label: '数据概览' },
  { to: '/assignments', label: '作业批改' },
];

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-shell__nav">
        <div className="app-shell__brand">
          <div className="app-shell__logo" aria-hidden>📚</div>
          <div>
            <div className="app-shell__brand-title">Teacher Console</div>
            <Badge text="Teacher" tone="info" />
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
          <Button variant="primary">新建任务</Button>
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