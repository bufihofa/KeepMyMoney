import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IconGlyph } from './IconGlyph';
import { useUIStore } from '../../stores/uiStore';

function toneIcon(tone?: string) {
  switch (tone) {
    case 'success':
      return 'check';
    case 'danger':
      return 'warning';
    default:
      return 'info';
  }
}

export function ToastViewport() {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  useEffect(() => {
    if (toasts.length === 0) {
      return undefined;
    }

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        removeToast(toast.id);
      }, 3200),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [removeToast, toasts]);

  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`toast toast--${toast.tone ?? 'info'}`}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <IconGlyph name={toneIcon(toast.tone)} size="sm" />
            <div>
              <strong>{toast.title}</strong>
              {toast.description ? <span>{toast.description}</span> : null}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
