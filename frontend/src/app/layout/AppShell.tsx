import { NavLink, Outlet } from 'react-router-dom';
import { IconGlyph } from '../../components/ui/IconGlyph';
import { useUIStore } from '../../stores/uiStore';

const navigation = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/transactions', label: 'Activity', icon: 'list' },
  { to: '/budgets', label: 'Budgets', icon: 'budget' },
  { to: '/insights', label: 'Insights', icon: 'chart' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
] as const;

export function AppShell() {
  const openTransactionSheet = useUIStore((state) => state.openTransactionSheet);

  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--one" />
      <div className="app-shell__glow app-shell__glow--two" />
      <main className="app-shell__content">
        <Outlet />
      </main>
      <button type="button" className="fab-button" onClick={() => openTransactionSheet()} aria-label="Add transaction">
        <IconGlyph name="plus" />
      </button>
      <nav className="bottom-nav" aria-label="Primary navigation">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
          >
            <IconGlyph name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

