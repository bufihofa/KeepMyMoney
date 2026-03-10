import { AnimatePresence, motion } from 'framer-motion';
import { IconGlyph } from './IconGlyph';

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

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'danger',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="confirm-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onCancel}
                >
                    <motion.div
                        className="confirm-dialog"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="empty-state__icon" style={{ margin: '0 auto' }}>
                            <IconGlyph name={tone === 'danger' ? 'trash' : 'warning'} size="lg" />
                        </div>
                        <h3>{title}</h3>
                        <p>{description}</p>
                        <div className="confirm-dialog__actions">
                            <button type="button" className="soft-button" onClick={onCancel}>
                                {cancelLabel}
                            </button>
                            <button
                                type="button"
                                className={tone === 'danger' ? 'soft-button soft-button--danger' : 'primary-button'}
                                onClick={onConfirm}
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
