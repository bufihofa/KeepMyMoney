import type { PropsWithChildren, ReactNode } from 'react';
import { Drawer } from 'vaul';

interface ModalProps extends PropsWithChildren {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer?: ReactNode;
}

export function Modal({ open, title, subtitle, onClose, children, footer }: ModalProps) {
  return (
    <Drawer.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="drawer-overlay" />
        <Drawer.Content className="drawer-content">
          <div className="drawer-handle" />
          <Drawer.Title className="drawer-title">{title}</Drawer.Title>
          {subtitle ? <Drawer.Description className="drawer-description">{subtitle}</Drawer.Description> : null}
          <div className="drawer-body">{children}</div>
          {footer ? <div className="drawer-footer">{footer}</div> : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
