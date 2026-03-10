import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Check, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { IconGlyph } from '../../components/ui/IconGlyph';
import { upsertTransaction } from '../../db/operations';
import { formatCurrency, fromDateTimeLocalValue, toDateTimeLocalValue } from '../../domain/format';
import type { TransactionRecord } from '../../domain/models';
import { transactionSchema, type TransactionFormValues } from '../../domain/schemas';
import { useAppData } from '../../hooks/useAppData';
import { useUIStore } from '../../stores/uiStore';

function buildDefaults(record?: TransactionRecord, tagNames = ''): TransactionFormValues {
  return { type: record?.type ?? 'expense', amount: record?.amount ?? 0, walletId: record?.walletId ?? '', toWalletId: record?.toWalletId, categoryId: record?.categoryId, note: record?.note ?? '', tags: tagNames, occurredAt: toDateTimeLocalValue(record?.occurredAt ?? new Date().toISOString()) };
}

export function TransactionSheet() {
  const sheet = useUIStore((s) => s.transactionSheet);
  const close = useUIStore((s) => s.closeTransactionSheet);
  const data = useAppData();
  const wallets = data.wallets.filter((w) => !w.isArchived);
  const tagsMap = new Map(data.tags.map((t) => [t.id, t.name]));
  const tagNames = sheet.record?.tagIds.map((id) => tagsMap.get(id)).filter(Boolean).join(', ') ?? '';
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<TransactionFormValues>({ resolver: zodResolver(transactionSchema), defaultValues: buildDefaults() });

  useEffect(() => { reset(buildDefaults(sheet.record, tagNames)); }, [reset, tagNames, sheet.record]);

  const txType = watch('type');
  const walletId = watch('walletId');
  const categoryId = watch('categoryId');
  const amount = watch('amount');
  const catOptions = data.categories.filter((c) => !c.isHidden && c.kind === (txType === 'income' ? 'income' : 'expense'));

  const onSubmit = handleSubmit(async (v) => {
    await upsertTransaction({ id: sheet.record?.id || undefined, type: v.type, amount: v.amount, walletId: v.walletId, toWalletId: v.type === 'transfer' ? v.toWalletId : undefined, categoryId: v.type === 'transfer' ? undefined : v.categoryId, note: v.note, tagNames: v.tags.split(',').map((s) => s.trim()).filter(Boolean), occurredAt: fromDateTimeLocalValue(v.occurredAt) });
    toast.success(sheet.record?.id ? 'Đã cập nhật giao dịch' : 'Đã lưu giao dịch');
    close();
  });

  const types = [
    { v: 'expense' as const, l: 'Chi tiêu', Icon: TrendingDown },
    { v: 'income' as const, l: 'Thu nhập', Icon: TrendingUp },
    { v: 'transfer' as const, l: 'Chuyển', Icon: ArrowLeftRight },
  ];

  return (
    <Modal open={sheet.open} onClose={close} title={sheet.record?.id ? 'Sửa giao dịch' : 'Giao dịch mới'} subtitle="Ghi nhận chi tiêu, thu nhập hoặc chuyển khoản."
      footer={<><button type="button" className="soft-button" onClick={close}>Hủy</button><button type="submit" form="tx-form" className="primary-button" disabled={isSubmitting}><Check size={14} /> Lưu</button></>}>
      <form id="tx-form" className="sheet-form" onSubmit={onSubmit}>
        <div className="segmented-control">
          {types.map((t) => <button key={t.v} type="button" className={`segmented-control__item${txType === t.v ? ' segmented-control__item--active' : ''}`} onClick={() => setValue('type', t.v, { shouldValidate: true })}><t.Icon size={14} /> {t.l}</button>)}
        </div>
        <div className="amount-display"><div className="amount-display__value">{amount > 0 ? formatCurrency(amount, data.preferences.currency) : '₫0'}</div><div className="amount-display__currency">{data.preferences.currency}</div></div>
        <label className="field"><span>Số tiền</span><input type="number" step="0.01" placeholder="0" {...register('amount')} />{errors.amount && <small>{errors.amount.message}</small>}</label>
        <div className="field"><span>{txType === 'transfer' ? 'Ví nguồn' : 'Ví'}</span>
          <div className="wallet-picker">{wallets.map((w) => (
            <button key={w.id} type="button" className={`wallet-picker-item${walletId === w.id ? ' wallet-picker-item--selected' : ''}`} onClick={() => setValue('walletId', w.id, { shouldValidate: true })}>
              <div className="wallet-picker-item__icon" style={{ background: w.color }}><IconGlyph name={w.icon} size="sm" /></div>
              <div className="wallet-picker-item__info"><strong>{w.name}</strong><span>{formatCurrency(w.currentBalanceCache, w.currency)}</span></div>
              {walletId === w.id && <Check size={16} style={{ color: 'var(--primary)' }} />}
            </button>
          ))}</div>{errors.walletId && <small style={{ color: 'var(--danger)' }}>{errors.walletId.message}</small>}
        </div>
        {txType === 'transfer' ? (
          <div className="field"><span>Ví đích</span>
            <div className="wallet-picker">{wallets.filter((w) => w.id !== walletId).map((w) => {
              const toId = watch('toWalletId');
              return <button key={w.id} type="button" className={`wallet-picker-item${toId === w.id ? ' wallet-picker-item--selected' : ''}`} onClick={() => setValue('toWalletId', w.id, { shouldValidate: true })}>
                <div className="wallet-picker-item__icon" style={{ background: w.color }}><IconGlyph name={w.icon} size="sm" /></div>
                <div className="wallet-picker-item__info"><strong>{w.name}</strong><span>{formatCurrency(w.currentBalanceCache, w.currency)}</span></div>
                {toId === w.id && <Check size={16} style={{ color: 'var(--primary)' }} />}
              </button>;
            })}</div>{errors.toWalletId && <small style={{ color: 'var(--danger)' }}>{errors.toWalletId.message}</small>}
          </div>
        ) : (
          <div className="field"><span>Danh mục</span>
            <div className="category-grid">{catOptions.map((c) => (
              <motion.button key={c.id} type="button" className={`category-grid-item${categoryId === c.id ? ' category-grid-item--selected' : ''}`} onClick={() => setValue('categoryId', c.id, { shouldValidate: true })} whileTap={{ scale: 0.93 }}>
                <div className="category-grid-item__icon" style={{ background: c.color }}><IconGlyph name={c.icon} size="sm" /></div>{c.name}
              </motion.button>
            ))}</div>{errors.categoryId && <small style={{ color: 'var(--danger)' }}>{errors.categoryId.message}</small>}
          </div>
        )}
        <label className="field"><span>Ngày giờ</span><input type="datetime-local" {...register('occurredAt')} />{errors.occurredAt && <small>{errors.occurredAt.message}</small>}</label>
        <label className="field"><span>Thẻ</span><input type="text" placeholder="Thiết yếu, Công việc" {...register('tags')} /></label>
        <label className="field"><span>Ghi chú</span><textarea rows={3} placeholder="Giao dịch này dùng cho gì?" {...register('note')} /></label>
      </form>
    </Modal>
  );
}
