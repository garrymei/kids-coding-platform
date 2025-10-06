import { NavLink } from 'react-router-dom';

export const NAV_ITEMS = [
  { href: '/', label: '首页' },
  { href: '/courses', label: '课程' },
  { href: '/map', label: '课程地图' },
  { href: '/works', label: '作品' },
  { href: '/rank', label: '排行榜' },
];

interface AppHeaderProps {
  onToggleSidebar?: () => void;
}

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  return (
    <header className="kc-header">
      <div className="kc-container kc-header-row">
        <div className="kc-brand">
          <button
            type="button"
            className="kc-menu-btn"
            aria-label="打开导航"
            onClick={onToggleSidebar}
          >
            ☰
          </button>
          <img src="/logo.svg" alt="Kids Coding" height={26} />
          <span>Kids Coding</span>
        </div>

        <nav className="kc-nav" aria-label="主导航">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => (isActive ? 'kc-nav__link is-active' : 'kc-nav__link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="kc-actions">
          <a className="btn btn-ghost" href="/tasks">
            今日任务
          </a>
          <img src="/avatar.png" width={32} height={32} className="kc-avatar" alt="当前用户头像" />
        </div>
      </div>
    </header>
  );
}
