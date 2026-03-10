import type { PropsWithChildren, ReactNode } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { IconGlyph } from './IconGlyph';

interface ModalProps extends PropsWithChildren {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer?: ReactNode;
}

export function Modal({ open, title, subtitle, onClose, children, footer }: ModalProps) {
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 80 || info.velocity.y > 300) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="modal-backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.aside
            className="modal-sheet"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={handleDragEnd}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <header className="modal-header">
              <div>
                <h3>{title}</h3>
                {subtitle ? <p>{subtitle}</p> : null}
              </div>
              <button type="button" className="icon-button icon-button--ghost" onClick={onClose} aria-label="Close dialog">
                <IconGlyph name="close" size="sm" />
              </button>
            </header>
            <div className="modal-body">{children}</div>
            {footer ? <footer className="modal-footer">{footer}</footer> : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
