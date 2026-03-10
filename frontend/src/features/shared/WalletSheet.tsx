import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Modal } from '../../components/ui/Modal';
import { IconGlyph } from '../../components/ui/IconGlyph';
import { COLOR_OPTIONS, WALLET_ICON_OPTIONS, WALLET_TYPE_OPTIONS } from '../../db/defaults';
import { upsertWallet } from '../../db/operations';
import { walletSchema, type WalletFormValues } from '../../domain/schemas';
import { useAppData } from '../../hooks/useAppData';
import { useUIStore } from '../../stores/uiStore';

function buildDefaults(record?: { name: string; type: WalletFormValues['type']; currency: string; openingBalance: number; color: string; icon: string; isArchived: boolean }): WalletFormValues {
  return {
    name: record?.name ?? '',
    type: record?.type ?? 'cash',
    currency: record?.currency ?? 'VND',
    openingBalance: record?.openingBalance ?? 0,
    color: record?.color ?? '#14b8a6',
    icon: record?.icon ?? 'wallet',
    isArchived: record?.isArchived ?? false,
  };
}

const typeLabels: Record<string, string> = { cash: 'Tiền mặt', bank: 'Ngân hàng', ewallet: 'Ví điện tử', savings: 'Tiết kiệm', other: 'Khác' };

export function WalletSheet() {
  const walletSheet = useUIStore((state) => state.walletSheet);
  const closeWalletSheet = useUIStore((state) => state.closeWalletSheet);
  const addToast = useUIStore((state) => state.addToast);
  const preferences = useAppData().preferences;
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: buildDefaults({ name: '', type: 'cash', currency: preferences.currency, openingBalance: 0, color: '#14b8a6', icon: 'wallet', isArchived: false }),
  });

  useEffect(() => {
    reset(buildDefaults(walletSheet.record ?? { name: '', type: 'cash', currency: preferences.currency, openingBalance: 0, color: '#14b8a6', icon: 'wallet', isArchived: false }));
  }, [preferences.currency, reset, walletSheet.record]);

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');
  const selectedType = watch('type');

  const onSubmit = handleSubmit(async (values) => {
    await upsertWallet({ ...values, id: walletSheet.record?.id });
    addToast({ title: walletSheet.record ? 'Đã cập nhật ví' : 'Đã tạo ví', tone: 'success' });
    closeWalletSheet();
  });

  return (
    <Modal
      open={walletSheet.open}
      onClose={closeWalletSheet}
      title={walletSheet.record ? 'Sửa ví' : 'Thêm ví'}
      subtitle="Giữ số dư rõ ràng cho tiền mặt, ngân hàng và ví điện tử."
      footer={
        <>
          <button type="button" className="soft-button" onClick={closeWalletSheet}>Hủy</button>
          <button type="submit" form="wallet-form" className="primary-button" disabled={isSubmitting}>
            <IconGlyph name="check" size="sm" /> Lưu
          </button>
        </>
      }
    >
      <form id="wallet-form" className="sheet-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Tên ví</span>
          <input type="text" placeholder="Ví hàng ngày" {...register('name')} />
          {errors.name ? <small>{errors.name.message}</small> : null}
        </label>

        {/* Type visual selector */}
        <div className="field">
          <span>Loại</span>
          <div className="chip-row">
            {WALLET_TYPE_OPTIONS.map((type) => (
              <button
                key={type}
                type="button"
                className={`chip-button${selectedType === type ? ' chip-button--active' : ''}`}
                onClick={() => setValue('type', type)}
              >
                {typeLabels[type] ?? type}
              </button>
            ))}
          </div>
        </div>

        <div className="field-grid">
          <label className="field">
            <span>Tiền tệ</span>
            <input type="text" {...register('currency')} />
          </label>
          <label className="field">
            <span>Số dư ban đầu</span>
            <input type="number" step="0.01" {...register('openingBalance')} />
          </label>
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
            {WALLET_ICON_OPTIONS.map((icon) => (
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
      </form>
    </Modal>
  );
}
