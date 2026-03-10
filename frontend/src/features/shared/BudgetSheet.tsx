import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Modal } from '../../components/ui/Modal';
import { IconGlyph } from '../../components/ui/IconGlyph';
import { upsertBudget } from '../../db/operations';
import { formatCurrency, toMonthKey } from '../../domain/format';
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
  const data = useAppData();
  const categories = data.categories.filter((category) => !category.isHidden && category.kind === 'expense');
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: buildDefaults(),
  });

  useEffect(() => {
    reset(buildDefaults(budgetSheet.record));
  }, [budgetSheet.record, reset]);

  const selectedCategoryId = watch('categoryId');
  const limitAmount = watch('limitAmount');
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const onSubmit = handleSubmit(async (values) => {
    await upsertBudget({ ...values, id: budgetSheet.record?.id });
    addToast({ title: budgetSheet.record ? 'Đã cập nhật ngân sách' : 'Đã tạo ngân sách', tone: 'success' });
    closeBudgetSheet();
  });

  return (
    <Modal
      open={budgetSheet.open}
      onClose={closeBudgetSheet}
      title={budgetSheet.record ? 'Sửa ngân sách' : 'Tạo ngân sách'}
      subtitle="Đặt hạn mức chi tiêu hàng tháng và theo dõi liên tục."
      footer={
        <>
          <button type="button" className="soft-button" onClick={closeBudgetSheet}>Hủy</button>
          <button type="submit" form="budget-form" className="primary-button" disabled={isSubmitting}>
            <IconGlyph name="check" size="sm" /> Lưu
          </button>
        </>
      }
    >
      <form id="budget-form" className="sheet-form" onSubmit={onSubmit}>
        {/* Amount Display */}
        {limitAmount > 0 && (
          <div className="amount-display">
            <div className="amount-display__value">{formatCurrency(limitAmount, data.preferences.currency)}</div>
            <div className="amount-display__currency">Hạn mức hàng tháng</div>
          </div>
        )}

        {/* Category Grid */}
        <div className="field">
          <span>Danh mục chi tiêu</span>
          <div className="category-grid">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                type="button"
                className={`category-grid-item${selectedCategoryId === category.id ? ' category-grid-item--selected' : ''}`}
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

        <div className="field-grid">
          <label className="field">
            <span>Tháng (yyyy-MM)</span>
            <input type="text" placeholder="2026-03" {...register('periodKey')} />
          </label>
          <label className="field">
            <span>Hạn mức</span>
            <input type="number" step="0.01" {...register('limitAmount')} />
            {errors.limitAmount ? <small>{errors.limitAmount.message}</small> : null}
          </label>
        </div>

        {/* Summary */}
        {selectedCategory && limitAmount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-muted)' }}>
            <div className="category-grid-item__icon" style={{ background: selectedCategory.color }}>
              <IconGlyph name={selectedCategory.icon} size="sm" />
            </div>
            <div>
              <strong style={{ fontSize: '0.9rem' }}>{selectedCategory.name}</strong>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Hạn mức {formatCurrency(limitAmount, data.preferences.currency)}/tháng
              </span>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
