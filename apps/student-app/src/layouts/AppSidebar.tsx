import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './AppHeader';

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

const extraLinks: Array<{ href: string; label: string }> = [{ href: '/tasks', label: '今日任务' }];

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  return (
    <>
      <aside className={`kc-sidebar${open ? ' is-open' : ''}`}>
        <div className="kc-sidebar__inner">
          <div className="kc-sidebar__heading">
            <span>学习导航</span>
            <button
              type="button"
              className="kc-sidebar__close"
              aria-label="关闭导航"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <nav className="kc-sidebar__nav" aria-label="侧边导航">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  isActive ? 'kc-sidebar__link is-active' : 'kc-sidebar__link'
                }
                onClick={onClose}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="kc-sidebar__section">
            <div className="kc-sidebar__section-title">快速入口</div>
            {extraLinks.map((item) => (
              <a key={item.href} href={item.href} className="kc-sidebar__link" onClick={onClose}>
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </aside>

      {open && <div className="kc-sidebar-backdrop" onClick={onClose} role="presentation" />}
    </>
  );
}
