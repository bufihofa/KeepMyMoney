import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { IconGlyph } from '../../components/ui/IconGlyph';
import { upsertBudget } from '../../db/operations';
import { formatCurrency, toMonthKey } from '../../domain/format';
import { budgetSchema, type BudgetFormValues } from '../../domain/schemas';
import { useAppData } from '../../hooks/useAppData';
import { shouldReduceMotion } from '../../lib/performance';
import { useUIStore } from '../../stores/uiStore';

function buildDefaults(r?: { categoryId: string; periodKey: string; limitAmount: number }): BudgetFormValues {
  return { categoryId: r?.categoryId ?? '', periodKey: r?.periodKey ?? toMonthKey(), limitAmount: r?.limitAmount ?? 0 };
}

export function BudgetSheet() {
  const sheet = useUIStore((s) => s.budgetSheet);
  const close = useUIStore((s) => s.closeBudgetSheet);
  const data = useAppData();
  const reduceMotion = shouldReduceMotion();
  const cats = data.categories.filter((c) => !c.isHidden && c.kind === 'expense');
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<BudgetFormValues>({ resolver: zodResolver(budgetSchema), defaultValues: buildDefaults() });

  useEffect(() => { reset(buildDefaults(sheet.record)); }, [sheet.record, reset]);

  const catId = watch('categoryId'), limit = watch('limitAmount');
  const selectedCat = cats.find((c) => c.id === catId);

  const onSubmit = handleSubmit(async (v) => {
    await upsertBudget({ ...v, id: sheet.record?.id });
    toast.success(sheet.record ? 'Đã cập nhật ngân sách' : 'Đã tạo ngân sách');
    close();
  });

  return (
    <Modal open={sheet.open} onClose={close} title={sheet.record ? 'Sửa ngân sách' : 'Tạo ngân sách'} subtitle="Đặt hạn mức chi tiêu hàng tháng và theo dõi liên tục."
      footer={<><button type="button" className="soft-button" onClick={close}>Hủy</button><button type="submit" form="budget-form" className="primary-button" disabled={isSubmitting}><Check size={14} /> Lưu</button></>}>
      <form id="budget-form" className="sheet-form" onSubmit={onSubmit}>
        {limit > 0 && <div className="amount-display"><div className="amount-display__value">{formatCurrency(limit, data.preferences.currency)}</div><div className="amount-display__currency">Hạn mức hàng tháng</div></div>}
        <div className="field"><span>Danh mục chi tiêu</span>
          <div className="category-grid">{cats.map((c) => <motion.button key={c.id} type="button" className={`category-grid-item${catId === c.id ? ' category-grid-item--selected' : ''}`} onClick={() => setValue('categoryId', c.id, { shouldValidate: true })} whileTap={reduceMotion ? undefined : { scale: 0.93 }}>
            <div className="category-grid-item__icon" style={{ background: c.color }}><IconGlyph name={c.icon} size="sm" /></div>{c.name}
          </motion.button>)}</div>{errors.categoryId && <small style={{ color: 'var(--danger)' }}>{errors.categoryId.message}</small>}
        </div>
        <div className="field-grid">
          <label className="field"><span>Tháng (yyyy-MM)</span><input type="text" placeholder="2026-03" {...register('periodKey')} /></label>
          <label className="field"><span>Hạn mức</span><input type="number" step="0.01" {...register('limitAmount')} />{errors.limitAmount && <small>{errors.limitAmount.message}</small>}</label>
        </div>
        {selectedCat && limit > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-muted)' }}>
            <div className="category-grid-item__icon" style={{ background: selectedCat.color }}><IconGlyph name={selectedCat.icon} size="sm" /></div>
            <div><strong style={{ fontSize: '0.88rem' }}>{selectedCat.name}</strong><span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Hạn mức {formatCurrency(limit, data.preferences.currency)}/tháng</span></div>
          </div>
        )}
      </form>
    </Modal>
  );
}
