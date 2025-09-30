import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/', label: '首页' },
  { to: '/hub/python', label: '课程地图' },
  { to: '/works', label: '作品集' },
  { to: '/leaderboard', label: '排行榜' },
  { to: '/my-classes', label: '我的班级' },
  { to: '/consents', label: '授权管理' },
];

export function AppHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = () => setMobileOpen((value) => !value);
  const closeMobile = () => setMobileOpen(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    ['app-header__link', isActive ? 'app-header__link--active' : '']
      .filter(Boolean)
      .join(' ');

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="app-header__brand">
          <img src="/logo.svg" alt="Kids Coding" height={28} />
          <span>Kids Coding</span>
        </div>

        <nav className="app-header__nav" aria-label="主导航">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a className="btn btn-ghost" href="/tasks">
            今日任务
          </a>
          <button
            type="button"
            onClick={toggleMobile}
            className="app-header__mobile-toggle"
            aria-label="切换导航"
            aria-expanded={mobileOpen}
          >
            <span aria-hidden>☰</span>
          </button>
          <img
            src="/avatar.png"
            alt="当前用户头像"
            width={36}
            height={36}
            style={{ borderRadius: 12 }}
          />
        </div>
      </div>

      <nav
        className={`app-header__mobile-panel ${mobileOpen ? 'is-open' : ''}`.trim()}
        aria-label="移动版导航"
      >
        {NAV_LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} className={linkClass} onClick={closeMobile}>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}