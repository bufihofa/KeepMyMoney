import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ArrowLeftRight, PieChart, BarChart3, Plus, Camera, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { shouldReduceMotion } from '../../lib/performance';
import { useUIStore } from '../../stores/uiStore';

const FAB_SIZE = 56;
const FAB_MARGIN = 14;
const FAB_BOTTOM_SAFE = 120;

interface FabPosition {
  x: number;
  y: number;
}

interface DragMeta {
  moved: boolean;
  lastX: number;
  lastY: number;
  lastT: number;
  vx: number;
  vy: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const tabs = [
  { to: '/', icon: Home, end: true },
  { to: '/transactions', icon: ArrowLeftRight, end: false },
  { to: '/budgets', icon: PieChart, end: false },
  { to: '/insights', icon: BarChart3, end: false },
] as const;

export function AppShell() {
  const openTransactionSheet = useUIStore((s) => s.openTransactionSheet);
  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = shouldReduceMotion();
  const [cameraFabPos, setCameraFabPos] = useState<FabPosition>({ x: 16, y: 420 });
  const [agentFabPos, setAgentFabPos] = useState<FabPosition>({ x: 320, y: 420 });
  const [activeDrag, setActiveDrag] = useState<'camera' | 'agent' | null>(null);
  const dragMetaRef = useRef<DragMeta>({ moved: false, lastX: 0, lastY: 0, lastT: 0, vx: 0, vy: 0 });

  useEffect(() => {
    const setInitial = () => {
      const y = window.innerHeight - FAB_BOTTOM_SAFE - FAB_SIZE;
      setCameraFabPos({ x: FAB_MARGIN, y: y });
      setAgentFabPos({ x: window.innerWidth - FAB_MARGIN - FAB_SIZE, y: y });
    };

    setInitial();
    window.addEventListener('resize', setInitial);
    return () => window.removeEventListener('resize', setInitial);
  }, []);

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>, current: FabPosition, setPos: (next: FabPosition) => void) {
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = current.x;
    const originY = current.y;
    dragMetaRef.current = { moved: false, lastX: startX, lastY: startY, lastT: performance.now(), vx: 0, vy: 0 };

    const onMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const now = performance.now();
      const dt = Math.max(1, now - dragMetaRef.current.lastT);
      dragMetaRef.current.vx = (moveEvent.clientX - dragMetaRef.current.lastX) / dt;
      dragMetaRef.current.vy = (moveEvent.clientY - dragMetaRef.current.lastY) / dt;
      dragMetaRef.current.lastX = moveEvent.clientX;
      dragMetaRef.current.lastY = moveEvent.clientY;
      dragMetaRef.current.lastT = now;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragMetaRef.current.moved = true;
      }

      const nextX = clamp(originX + dx, FAB_MARGIN, window.innerWidth - FAB_MARGIN - FAB_SIZE);
      const nextY = clamp(originY + dy, 80, window.innerHeight - FAB_BOTTOM_SAFE - FAB_SIZE);
      setPos({ x: nextX, y: nextY });
    };

    const onUp = () => {
      if (dragMetaRef.current.moved) {
        const maxX = window.innerWidth - FAB_MARGIN - FAB_SIZE;
        const minY = 76;
        const maxY = window.innerHeight - FAB_BOTTOM_SAFE - FAB_SIZE;
        const throwX = clamp(originX + (dragMetaRef.current.lastX - startX) + dragMetaRef.current.vx * 95, FAB_MARGIN, maxX);
        const throwY = clamp(originY + (dragMetaRef.current.lastY - startY) + dragMetaRef.current.vy * 95, minY, maxY);

        const distances = [
          { edge: 'left', value: Math.abs(throwX - FAB_MARGIN) },
          { edge: 'right', value: Math.abs(throwX - maxX) },
          { edge: 'top', value: Math.abs(throwY - minY) },
          { edge: 'bottom', value: Math.abs(throwY - maxY) },
        ];

        const nearest = distances.sort((a, b) => a.value - b.value)[0].edge;
        if (nearest === 'left') setPos({ x: FAB_MARGIN, y: throwY });
        if (nearest === 'right') setPos({ x: maxX, y: throwY });
        if (nearest === 'top') setPos({ x: throwX, y: minY });
        if (nearest === 'bottom') setPos({ x: throwX, y: maxY });
      }

      setActiveDrag(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function handleCameraClick() {
    if (dragMetaRef.current.moved) return;
    navigate('/receipt-import');
  }

  function handleAgentClick() {
    if (dragMetaRef.current.moved) return;
    toast.message('Agent hỗ trợ app sẽ được bổ sung sau');
  }

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

      <div className="quick-fab-layer" aria-label="Tác vụ nhanh">
        <motion.button
          type="button"
          className="quick-fab quick-fab--camera"
          style={{ left: 0, top: 0 }}
          animate={{ x: cameraFabPos.x, y: cameraFabPos.y }}
          transition={activeDrag === 'camera' ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 26, mass: 1.05 }}
          onPointerDown={(event) => {
            setActiveDrag('camera');
            startDrag(event, cameraFabPos, setCameraFabPos);
          }}
          onClick={handleCameraClick}
          whileTap={reduceMotion ? undefined : { scale: 0.92 }}
          aria-label="Mở camera hóa đơn"
          title="Mở camera hóa đơn"
        >
          <Camera size={24} />
        </motion.button>

        <motion.button
          type="button"
          className="quick-fab quick-fab--agent"
          style={{ left: 0, top: 0 }}
          animate={{ x: agentFabPos.x, y: agentFabPos.y }}
          transition={activeDrag === 'agent' ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 26, mass: 1.05 }}
          onPointerDown={(event) => {
            setActiveDrag('agent');
            startDrag(event, agentFabPos, setAgentFabPos);
          }}
          onClick={handleAgentClick}
          whileTap={reduceMotion ? undefined : { scale: 0.92 }}
          aria-label="Agent hỗ trợ app (sắp có)"
          title="Agent hỗ trợ app (sắp có)"
        >
          <Bot size={24} />
        </motion.button>
      </div>

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
