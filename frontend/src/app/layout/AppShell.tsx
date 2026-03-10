import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ArrowLeftRight, PieChart, BarChart3, Settings, Plus } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

const navigation = [
  { to: '/', label: 'Tổng quan', icon: Home, end: true },
  { to: '/transactions', label: 'Giao dịch', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Ngân sách', icon: PieChart },
  { to: '/insights', label: 'Phân tích', icon: BarChart3 },
  { to: '/settings', label: 'Cài đặt', icon: Settings },
] as const;

export function AppShell() {
  const openTransactionSheet = useUIStore((state) => state.openTransactionSheet);
  const location = useLocation();

  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--one" />
      <div className="app-shell__glow app-shell__glow--two" />
      <main className="app-shell__content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <motion.button
        type="button"
        className="fab-button"
        onClick={() => openTransactionSheet()}
        aria-label="Thêm giao dịch"
        whileTap={{ scale: 0.88 }}
      >
        <Plus />
      </motion.button>
      <nav className="bottom-nav" aria-label="Điều hướng chính">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
