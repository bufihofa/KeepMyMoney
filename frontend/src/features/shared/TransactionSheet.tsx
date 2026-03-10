import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../../components/ui/Modal';
import { upsertTransaction } from '../../db/operations';
import { fromDateTimeLocalValue, toDateTimeLocalValue } from '../../domain/format';
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

    addToast({ title: transactionSheet.record?.id ? 'Transaction updated' : 'Transaction saved', tone: 'success' });
    closeTransactionSheet();
  });

  return (
    <Modal
      open={transactionSheet.open}
      onClose={closeTransactionSheet}
      title={transactionSheet.record?.id ? 'Edit transaction' : 'New transaction'}
      subtitle="Capture expenses, income, or transfers without leaving your current context."
      footer={
        <>
          <button type="button" className="soft-button" onClick={closeTransactionSheet}>Cancel</button>
          <button type="submit" form="transaction-form" className="primary-button" disabled={isSubmitting}>Save transaction</button>
        </>
      }
    >
      <form id="transaction-form" className="sheet-form" onSubmit={onSubmit}>
        <div className="segmented-control">
          {(['expense', 'income', 'transfer'] as const).map((type) => (
            <button
              key={type}
              type="button"
              className={`segmented-control__item${transactionType === type ? ' segmented-control__item--active' : ''}`}
              onClick={() => setValue('type', type, { shouldValidate: true })}
            >
              {type}
            </button>
          ))}
        </div>

        <label className="field">
          <span>Amount</span>
          <input type="number" step="0.01" placeholder="0" {...register('amount')} />
          {errors.amount ? <small>{errors.amount.message}</small> : null}
        </label>

        <div className="field-grid">
          <label className="field">
            <span>Wallet</span>
            <select {...register('walletId')}>
              <option value="">Choose wallet</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>{wallet.name}</option>
              ))}
            </select>
            {errors.walletId ? <small>{errors.walletId.message}</small> : null}
          </label>

          {transactionType === 'transfer' ? (
            <label className="field">
              <span>Destination</span>
              <select {...register('toWalletId')}>
                <option value="">Choose wallet</option>
                {wallets.filter((wallet) => wallet.id !== walletId).map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>{wallet.name}</option>
                ))}
              </select>
              {errors.toWalletId ? <small>{errors.toWalletId.message}</small> : null}
            </label>
          ) : (
            <label className="field">
              <span>Category</span>
              <select {...register('categoryId')}>
                <option value="">Choose category</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {errors.categoryId ? <small>{errors.categoryId.message}</small> : null}
            </label>
          )}
        </div>

        <label className="field">
          <span>Date and time</span>
          <input type="datetime-local" {...register('occurredAt')} />
          {errors.occurredAt ? <small>{errors.occurredAt.message}</small> : null}
        </label>

        <label className="field">
          <span>Tags</span>
          <input type="text" placeholder="Essential, Work" {...register('tags')} />
        </label>

        <label className="field">
          <span>Note</span>
          <textarea rows={4} placeholder="What was this transaction for?" {...register('note')} />
        </label>
      </form>
    </Modal>
  );
}
