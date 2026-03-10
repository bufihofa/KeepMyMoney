import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../../components/ui/Modal';
import { upsertBudget } from '../../db/operations';
import { toMonthKey } from '../../domain/format';
import { budgetSchema, type BudgetFormValues } from '../../domain/schemas';
import { useAppData } from '../../hooks/useAppData';
import { useUIStore } from '../../stores/uiStore';

function buildDefaults(record?: { categoryId: string; periodKey: string; limitAmount: number }): BudgetFormValues {
  return {
    categoryId: record?.categoryId ?? '',
    periodKey: record?.periodKey ?? toMonthKey(),
    limitAmount: record?.limitAmount ?? 0,
  };
}

export function BudgetSheet() {
  const budgetSheet = useUIStore((state) => state.budgetSheet);
  const closeBudgetSheet = useUIStore((state) => state.closeBudgetSheet);
  const addToast = useUIStore((state) => state.addToast);
  const categories = useAppData().categories.filter((category) => !category.isHidden && category.kind === 'expense');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: buildDefaults(),
  });

  useEffect(() => {
    reset(buildDefaults(budgetSheet.record));
  }, [budgetSheet.record, reset]);

  const onSubmit = handleSubmit(async (values) => {
    await upsertBudget({ ...values, id: budgetSheet.record?.id });
    addToast({ title: budgetSheet.record ? 'Budget updated' : 'Budget created', tone: 'success' });
    closeBudgetSheet();
  });

  return (
    <Modal
      open={budgetSheet.open}
      onClose={closeBudgetSheet}
      title={budgetSheet.record ? 'Edit budget' : 'Create budget'}
      subtitle="Set monthly limits and keep the burn rate visible throughout the period."
      footer={
        <>
          <button type="button" className="soft-button" onClick={closeBudgetSheet}>Cancel</button>
          <button type="submit" form="budget-form" className="primary-button" disabled={isSubmitting}>Save budget</button>
        </>
      }
    >
      <form id="budget-form" className="sheet-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Category</span>
          <select {...register('categoryId')}>
            <option value="">Choose category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          {errors.categoryId ? <small>{errors.categoryId.message}</small> : null}
        </label>
        <div className="field-grid">
          <label className="field">
            <span>Period key</span>
            <input type="text" placeholder="2026-03" {...register('periodKey')} />
          </label>
          <label className="field">
            <span>Limit amount</span>
            <input type="number" step="0.01" {...register('limitAmount')} />
            {errors.limitAmount ? <small>{errors.limitAmount.message}</small> : null}
          </label>
        </div>
      </form>
    </Modal>
  );
}
