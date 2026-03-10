import type { PropsWithChildren, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IconGlyph } from './IconGlyph';

interface ModalProps extends PropsWithChildren {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer?: ReactNode;
}

export function Modal({ open, title, subtitle, onClose, children, footer }: ModalProps) {
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
          />
          <motion.aside
            className="modal-sheet"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <header className="modal-header">
              <div>
                <h3>{title}</h3>
                {subtitle ? <p>{subtitle}</p> : null}
              </div>
              <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog">
                <IconGlyph name="close" />
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
