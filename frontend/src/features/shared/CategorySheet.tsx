import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../../components/ui/Modal';
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
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: buildDefaults(),
  });

  useEffect(() => {
    reset(buildDefaults(categorySheet.record));
  }, [categorySheet.record, reset]);

  const onSubmit = handleSubmit(async (values) => {
    await upsertCategory({ ...values, id: categorySheet.record?.id });
    addToast({ title: categorySheet.record ? 'Category updated' : 'Category created', tone: 'success' });
    closeCategorySheet();
  });

  return (
    <Modal
      open={categorySheet.open}
      onClose={closeCategorySheet}
      title={categorySheet.record ? 'Edit category' : 'Add category'}
      subtitle="Customize the language and visual grouping used across the app."
      footer={
        <>
          <button type="button" className="soft-button" onClick={closeCategorySheet}>Cancel</button>
          <button type="submit" form="category-form" className="primary-button" disabled={isSubmitting}>Save category</button>
        </>
      }
    >
      <form id="category-form" className="sheet-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Name</span>
          <input type="text" placeholder="Food" {...register('name')} />
          {errors.name ? <small>{errors.name.message}</small> : null}
        </label>
        <div className="field-grid">
          <label className="field">
            <span>Kind</span>
            <select {...register('kind')}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
          <label className="check-field">
            <input type="checkbox" {...register('isHidden')} />
            <div>
              <strong>Hide category</strong>
              <span>Keep historical data, but remove it from quick selection.</span>
            </div>
          </label>
        </div>
        <div className="field-grid">
          <label className="field">
            <span>Color</span>
            <select {...register('color')}>
              {COLOR_OPTIONS.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Icon</span>
            <select {...register('icon')}>
              {CATEGORY_ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </select>
          </label>
        </div>
      </form>
    </Modal>
  );
}
