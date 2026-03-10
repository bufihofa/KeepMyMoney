import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Check, TrendingUp, TrendingDown } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { IconGlyph } from '../../components/ui/IconGlyph';
import { CATEGORY_ICON_OPTIONS, COLOR_OPTIONS } from '../../db/defaults';
import { upsertCategory } from '../../db/operations';
import { categorySchema, type CategoryFormValues } from '../../domain/schemas';
import { useUIStore } from '../../stores/uiStore';

function buildDefaults(r?: { name: string; kind: CategoryFormValues['kind']; color: string; icon: string; isHidden: boolean }): CategoryFormValues {
  return { name: r?.name ?? '', kind: r?.kind ?? 'expense', color: r?.color ?? '#14b8a6', icon: r?.icon ?? 'food', isHidden: r?.isHidden ?? false };
}

export function CategorySheet() {
  const sheet = useUIStore((s) => s.categorySheet);
  const close = useUIStore((s) => s.closeCategorySheet);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema), defaultValues: buildDefaults() });

  useEffect(() => { reset(buildDefaults(sheet.record)); }, [sheet.record, reset]);

  const color = watch('color'), icon = watch('icon'), kind = watch('kind'), name = watch('name');

  const onSubmit = handleSubmit(async (v) => {
    await upsertCategory({ ...v, id: sheet.record?.id });
    toast.success(sheet.record ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục');
    close();
  });

  return (
    <Modal open={sheet.open} onClose={close} title={sheet.record ? 'Sửa danh mục' : 'Thêm danh mục'} subtitle="Tùy chỉnh nhãn và phân loại trực quan."
      footer={<><button type="button" className="soft-button" onClick={close}>Hủy</button><button type="submit" form="cat-form" className="primary-button" disabled={isSubmitting}><Check size={14} /> Lưu</button></>}>
      <form id="cat-form" className="sheet-form" onSubmit={onSubmit}>
        <label className="field"><span>Tên</span><input type="text" placeholder="Ăn uống" {...register('name')} />{errors.name && <small>{errors.name.message}</small>}</label>
        <div className="field"><span>Loại</span>
          <div className="segmented-control" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
            <button type="button" className={`segmented-control__item${kind === 'expense' ? ' segmented-control__item--active' : ''}`} onClick={() => setValue('kind', 'expense')} style={kind === 'expense' ? { color: 'var(--expense)' } : undefined}><TrendingDown size={14} /> Chi tiêu</button>
            <button type="button" className={`segmented-control__item${kind === 'income' ? ' segmented-control__item--active' : ''}`} onClick={() => setValue('kind', 'income')} style={kind === 'income' ? { color: 'var(--income)' } : undefined}><TrendingUp size={14} /> Thu nhập</button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-muted)' }}>
          <div className="category-grid-item__icon" style={{ background: color }}><IconGlyph name={icon} size="sm" /></div>
          <div><strong style={{ fontSize: '0.88rem' }}>{name || 'Xem trước'}</strong><span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{kind === 'expense' ? 'Chi tiêu' : 'Thu nhập'}</span></div>
        </div>
        <div className="field"><span>Màu sắc</span><div className="picker-grid">{COLOR_OPTIONS.map((c) => <motion.button key={c} type="button" className={`picker-swatch${color === c ? ' picker-swatch--selected' : ''}`} style={{ background: c }} onClick={() => setValue('color', c)} whileTap={{ scale: 0.85 }}>{color === c && <Check size={14} />}</motion.button>)}</div></div>
        <div className="field"><span>Biểu tượng</span><div className="icon-picker-grid">{CATEGORY_ICON_OPTIONS.map((ic) => <motion.button key={ic} type="button" className={`icon-picker-item${icon === ic ? ' icon-picker-item--selected' : ''}`} onClick={() => setValue('icon', ic)} whileTap={{ scale: 0.9 }}><IconGlyph name={ic} />{ic}</motion.button>)}</div></div>
        <label className="check-field"><input type="checkbox" {...register('isHidden')} /><div><strong>Ẩn danh mục</strong><span>Giữ dữ liệu lịch sử nhưng ẩn khỏi chọn nhanh.</span></div></label>
      </form>
    </Modal>
  );
}
