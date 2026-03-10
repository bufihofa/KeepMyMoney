import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Modal } from '../../components/ui/Modal';
import { IconGlyph } from '../../components/ui/IconGlyph';
import { upsertTransaction } from '../../db/operations';
import { formatCurrency, fromDateTimeLocalValue, toDateTimeLocalValue } from '../../domain/format';
import type { TransactionRecord } from '../../domain/models';
import { transactionSchema, type TransactionFormValues } from '../../domain/schemas';
import { useAppData } from '../../hooks/useAppData';
import { useUIStore } from '../../stores/uiStore';

function buildDefaults(record?: TransactionRecord, tagNames = ''): TransactionFormValues {
  return {
    type: record?.type ?? 'expense',
    amount: record?.amount ?? 0,
    walletId: record?.walletId ?? '',
    toWalletId: record?.toWalletId,
    categoryId: record?.categoryId,
    note: record?.note ?? '',
    tags: tagNames,
    occurredAt: toDateTimeLocalValue(record?.occurredAt ?? new Date().toISOString()),
  };
}

export function TransactionSheet() {
  const transactionSheet = useUIStore((state) => state.transactionSheet);
  const closeTransactionSheet = useUIStore((state) => state.closeTransactionSheet);
  const addToast = useUIStore((state) => state.addToast);
  const data = useAppData();
  const wallets = data.wallets.filter((wallet) => !wallet.isArchived);
  const tagsMap = new Map(data.tags.map((tag) => [tag.id, tag.name]));
  const tagNames = transactionSheet.record?.tagIds.map((tagId) => tagsMap.get(tagId)).filter(Boolean).join(', ') ?? '';
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: buildDefaults(),
  });

  useEffect(() => {
    reset(buildDefaults(transactionSheet.record, tagNames));
  }, [reset, tagNames, transactionSheet.record]);

  const transactionType = watch('type');
  const walletId = watch('walletId');
  const categoryId = watch('categoryId');
  const amount = watch('amount');
  const categoryOptions = data.categories.filter((category) => !category.isHidden && category.kind === (transactionType === 'income' ? 'income' : 'expense'));

  const onSubmit = handleSubmit(async (values) => {
    await upsertTransaction({
      id: transactionSheet.record?.id || undefined,
      type: values.type,
      amount: values.amount,
      walletId: values.walletId,
      toWalletId: values.type === 'transfer' ? values.toWalletId : undefined,
      categoryId: values.type === 'transfer' ? undefined : values.categoryId,
      note: values.note,
      tagNames: values.tags.split(',').map((item) => item.trim()).filter(Boolean),
      occurredAt: fromDateTimeLocalValue(values.occurredAt),
    });
    addToast({ title: transactionSheet.record?.id ? 'Đã cập nhật giao dịch' : 'Đã lưu giao dịch', tone: 'success' });
    closeTransactionSheet();
  });

  const typeOptions = [
    { value: 'expense' as const, label: 'Chi tiêu', icon: 'trendDown' },
    { value: 'income' as const, label: 'Thu nhập', icon: 'trendUp' },
    { value: 'transfer' as const, label: 'Chuyển', icon: 'transfer' },
  ];

  return (
    <Modal
      open={transactionSheet.open}
      onClose={closeTransactionSheet}
      title={transactionSheet.record?.id ? 'Sửa giao dịch' : 'Giao dịch mới'}
      subtitle="Ghi nhận chi tiêu, thu nhập hoặc chuyển khoản."
      footer={
        <>
          <button type="button" className="soft-button" onClick={closeTransactionSheet}>Hủy</button>
          <button type="submit" form="transaction-form" className="primary-button" disabled={isSubmitting}>
            <IconGlyph name="check" size="sm" /> Lưu
          </button>
        </>
      }
    >
      <form id="transaction-form" className="sheet-form" onSubmit={onSubmit}>
        {/* Type Selector */}
        <div className="segmented-control">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`segmented-control__item${transactionType === opt.value ? ' segmented-control__item--active' : ''}`}
              onClick={() => setValue('type', opt.value, { shouldValidate: true })}
            >
              <IconGlyph name={opt.icon} size="sm" /> {opt.label}
            </button>
          ))}
        </div>

        {/* Amount Display */}
        <div className="amount-display">
          <div className="amount-display__value">
            {amount > 0 ? formatCurrency(amount, data.preferences.currency) : '₫0'}
          </div>
          <div className="amount-display__currency">{data.preferences.currency}</div>
        </div>

        <label className="field">
          <span>Số tiền</span>
          <input type="number" step="0.01" placeholder="0" {...register('amount')} />
          {errors.amount ? <small>{errors.amount.message}</small> : null}
        </label>

        {/* Wallet Picker */}
        <div className="field">
          <span>{transactionType === 'transfer' ? 'Ví nguồn' : 'Ví'}</span>
          <div className="wallet-picker">
            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                type="button"
                className={`wallet-picker-item${walletId === wallet.id ? ' wallet-picker-item--selected' : ''}`}
                onClick={() => setValue('walletId', wallet.id, { shouldValidate: true })}
              >
                <div className="wallet-picker-item__icon" style={{ background: wallet.color }}>
                  <IconGlyph name={wallet.icon} size="sm" />
                </div>
                <div className="wallet-picker-item__info">
                  <strong>{wallet.name}</strong>
                  <span>{formatCurrency(wallet.currentBalanceCache, wallet.currency)}</span>
                </div>
                {walletId === wallet.id && <IconGlyph name="check" size="sm" style={{ color: 'var(--primary)' }} />}
              </button>
            ))}
          </div>
          {errors.walletId ? <small style={{ color: 'var(--danger)' }}>{errors.walletId.message}</small> : null}
        </div>

        {/* Category Grid or Destination Wallet */}
        {transactionType === 'transfer' ? (
          <div className="field">
            <span>Ví đích</span>
            <div className="wallet-picker">
              {wallets.filter((w) => w.id !== walletId).map((wallet) => {
                const toWalletId = watch('toWalletId');
                return (
                  <button
                    key={wallet.id}
                    type="button"
                    className={`wallet-picker-item${toWalletId === wallet.id ? ' wallet-picker-item--selected' : ''}`}
                    onClick={() => setValue('toWalletId', wallet.id, { shouldValidate: true })}
                  >
                    <div className="wallet-picker-item__icon" style={{ background: wallet.color }}>
                      <IconGlyph name={wallet.icon} size="sm" />
                    </div>
                    <div className="wallet-picker-item__info">
                      <strong>{wallet.name}</strong>
                      <span>{formatCurrency(wallet.currentBalanceCache, wallet.currency)}</span>
                    </div>
                    {toWalletId === wallet.id && <IconGlyph name="check" size="sm" style={{ color: 'var(--primary)' }} />}
                  </button>
                );
              })}
            </div>
            {errors.toWalletId ? <small style={{ color: 'var(--danger)' }}>{errors.toWalletId.message}</small> : null}
          </div>
        ) : (
          <div className="field">
            <span>Danh mục</span>
            <div className="category-grid">
              {categoryOptions.map((category) => (
                <motion.button
                  key={category.id}
                  type="button"
                  className={`category-grid-item${categoryId === category.id ? ' category-grid-item--selected' : ''}`}
                  onClick={() => setValue('categoryId', category.id, { shouldValidate: true })}
                  whileTap={{ scale: 0.93 }}
                >
                  <div className="category-grid-item__icon" style={{ background: category.color }}>
                    <IconGlyph name={category.icon} size="sm" />
                  </div>
                  {category.name}
                </motion.button>
              ))}
            </div>
            {errors.categoryId ? <small style={{ color: 'var(--danger)' }}>{errors.categoryId.message}</small> : null}
          </div>
        )}

        <label className="field">
          <span>Ngày giờ</span>
          <input type="datetime-local" {...register('occurredAt')} />
          {errors.occurredAt ? <small>{errors.occurredAt.message}</small> : null}
        </label>

        <label className="field">
          <span>Thẻ</span>
          <input type="text" placeholder="Thiết yếu, Công việc" {...register('tags')} />
        </label>

        <label className="field">
          <span>Ghi chú</span>
          <textarea rows={3} placeholder="Giao dịch này dùng cho gì?" {...register('note')} />
        </label>
      </form>
    </Modal>
  );
}
