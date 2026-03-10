import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Modal } from '../../components/ui/Modal';
import { IconGlyph } from '../../components/ui/IconGlyph';
import { CATEGORY_ICON_OPTIONS, COLOR_OPTIONS } from '../../db/defaults';
import { upsertCategory } from '../../db/operations';
import { categorySchema, type CategoryFormValues } from '../../domain/schemas';
import { useUIStore } from '../../stores/uiStore';

function buildDefaults(record?: { name: string; kind: CategoryFormValues['kind']; color: string; icon: string; isHidden: boolean }): CategoryFormValues {
  return {
    name: record?.name ?? '',
    kind: record?.kind ?? 'expense',
    color: record?.color ?? '#14b8a6',
    icon: record?.icon ?? 'food',
    isHidden: record?.isHidden ?? false,
  };
}

export function CategorySheet() {
  const categorySheet = useUIStore((state) => state.categorySheet);
  const closeCategorySheet = useUIStore((state) => state.closeCategorySheet);
  const addToast = useUIStore((state) => state.addToast);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: buildDefaults(),
  });

  useEffect(() => {
    reset(buildDefaults(categorySheet.record));
  }, [categorySheet.record, reset]);

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');
  const selectedKind = watch('kind');

  const onSubmit = handleSubmit(async (values) => {
    await upsertCategory({ ...values, id: categorySheet.record?.id });
    addToast({ title: categorySheet.record ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục', tone: 'success' });
    closeCategorySheet();
  });

  return (
    <Modal
      open={categorySheet.open}
      onClose={closeCategorySheet}
      title={categorySheet.record ? 'Sửa danh mục' : 'Thêm danh mục'}
      subtitle="Tùy chỉnh nhãn và phân loại trực quan trong ứng dụng."
      footer={
        <>
          <button type="button" className="soft-button" onClick={closeCategorySheet}>Hủy</button>
          <button type="submit" form="category-form" className="primary-button" disabled={isSubmitting}>
            <IconGlyph name="check" size="sm" /> Lưu
          </button>
        </>
      }
    >
      <form id="category-form" className="sheet-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Tên</span>
          <input type="text" placeholder="Ăn uống" {...register('name')} />
          {errors.name ? <small>{errors.name.message}</small> : null}
        </label>

        {/* Kind Toggle */}
        <div className="field">
          <span>Loại</span>
          <div className="segmented-control" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
            <button
              type="button"
              className={`segmented-control__item${selectedKind === 'expense' ? ' segmented-control__item--active' : ''}`}
              onClick={() => setValue('kind', 'expense')}
              style={selectedKind === 'expense' ? { color: 'var(--expense)' } : undefined}
            >
              <IconGlyph name="trendDown" size="sm" /> Chi tiêu
            </button>
            <button
              type="button"
              className={`segmented-control__item${selectedKind === 'income' ? ' segmented-control__item--active' : ''}`}
              onClick={() => setValue('kind', 'income')}
              style={selectedKind === 'income' ? { color: 'var(--income)' } : undefined}
            >
              <IconGlyph name="trendUp" size="sm" /> Thu nhập
            </button>
          </div>
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--surface-muted)' }}>
          <div className="category-grid-item__icon" style={{ background: selectedColor }}>
            <IconGlyph name={selectedIcon} size="sm" />
          </div>
          <div>
            <strong style={{ fontSize: '0.9rem' }}>{watch('name') || 'Xem trước'}</strong>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedKind === 'expense' ? 'Chi tiêu' : 'Thu nhập'}</span>
          </div>
        </div>

        {/* Color Swatches */}
        <div className="field">
          <span>Màu sắc</span>
          <div className="picker-grid">
            {COLOR_OPTIONS.map((color) => (
              <motion.button
                key={color}
                type="button"
                className={`picker-swatch${selectedColor === color ? ' picker-swatch--selected' : ''}`}
                style={{ background: color }}
                onClick={() => setValue('color', color)}
                whileTap={{ scale: 0.85 }}
              >
                {selectedColor === color && <IconGlyph name="check" size="sm" />}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Icon Grid */}
        <div className="field">
          <span>Biểu tượng</span>
          <div className="icon-picker-grid">
            {CATEGORY_ICON_OPTIONS.map((icon) => (
              <motion.button
                key={icon}
                type="button"
                className={`icon-picker-item${selectedIcon === icon ? ' icon-picker-item--selected' : ''}`}
                onClick={() => setValue('icon', icon)}
                whileTap={{ scale: 0.9 }}
              >
                <IconGlyph name={icon} />
                {icon}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Hide toggle */}
        <label className="check-field">
          <input type="checkbox" {...register('isHidden')} />
          <div>
            <strong>Ẩn danh mục</strong>
            <span>Giữ lại dữ liệu lịch sử nhưng ẩn khỏi chọn nhanh.</span>
          </div>
        </label>
      </form>
    </Modal>
  );
}
