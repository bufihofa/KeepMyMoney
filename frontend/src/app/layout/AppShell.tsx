import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ArrowLeftRight, PieChart, BarChart3, Plus } from 'lucide-react';
import { shouldReduceMotion } from '../../lib/performance';
import { useUIStore } from '../../stores/uiStore';

const tabs = [
  { to: '/', icon: Home, end: true },
  { to: '/transactions', icon: ArrowLeftRight, end: false },
  { to: '/budgets', icon: PieChart, end: false },
  { to: '/insights', icon: BarChart3, end: false },
] as const;

export function AppShell() {
  const openTransactionSheet = useUIStore((s) => s.openTransactionSheet);
  const location = useLocation();
  const reduceMotion = shouldReduceMotion();

  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--one" />
      <div className="app-shell__glow app-shell__glow--two" />

      <main className="app-shell__content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={reduceMotion ? undefined : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Notch Nav Dock ── */}
      <nav className="nav-dock" aria-label="Điều hướng chính">
        <div className="nav-dock__pill">
          {/* Glass background with SVG Mask Cutout */}
          <div className="nav-dock__bg" />
          
          <div className="nav-dock__tabs">
            {/* Left 2 tabs */}
            {tabs.slice(0, 2).map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `nav-dock__tab${isActive ? ' nav-dock__tab--active' : ''}`}>
                {({ isActive }) => (
                  <>
                    <t.icon className="nav-dock__icon" strokeWidth={isActive ? 2.5 : 2} />
                    {isActive && (reduceMotion ? <div className="nav-dock__dot" /> : <motion.div className="nav-dock__dot" layoutId="navDot" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />)}
                  </>
                )}
              </NavLink>
            ))}

            {/* Center Anchor for FAB (Notch Area) */}
            <div className="nav-dock__spacer">
              <motion.button type="button" className="nav-dock__fab" onClick={() => openTransactionSheet()} aria-label="Thêm giao dịch" whileTap={reduceMotion ? undefined : { scale: 0.85, rotate: 90 }}>
                <Plus strokeWidth={2.5} size={28} />
              </motion.button>
            </div>

            {/* Right 2 tabs */}
            {tabs.slice(2).map((t) => (
              <NavLink key={t.to} to={t.to} className={({ isActive }) => `nav-dock__tab${isActive ? ' nav-dock__tab--active' : ''}`}>
                {({ isActive }) => (
                  <>
                    <t.icon className="nav-dock__icon" strokeWidth={isActive ? 2.5 : 2} />
                    {isActive && (reduceMotion ? <div className="nav-dock__dot" /> : <motion.div className="nav-dock__dot" layoutId="navDot" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />)}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
