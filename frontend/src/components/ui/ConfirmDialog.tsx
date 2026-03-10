import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, AlertTriangle, Info } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

const toneIcons = { danger: Trash2, warning: AlertTriangle, info: Info };

export function ConfirmDialog({ open, title, description, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy', tone = 'danger', onConfirm, onCancel }: ConfirmDialogProps) {
    const Icon = toneIcons[tone];
    
    if (typeof document === 'undefined') return null;
    
    return createPortal(
        <AnimatePresence>
            {open ? (
                <motion.div className="confirm-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
                    <motion.div className="confirm-dialog" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }} onClick={(e) => e.stopPropagation()}>
                        <div className="empty-state__icon" style={{ margin: '0 auto' }}>
                            <Icon size={24} />
                        </div>
                        <h3>{title}</h3>
                        <p>{description}</p>
                        <div className="confirm-dialog__actions">
                            <button type="button" className="soft-button" onClick={onCancel}>{cancelLabel}</button>
                            <button type="button" className={tone === 'danger' ? 'soft-button soft-button--danger' : 'primary-button'} onClick={onConfirm}>{confirmLabel}</button>
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>,
        document.body
    );
}
