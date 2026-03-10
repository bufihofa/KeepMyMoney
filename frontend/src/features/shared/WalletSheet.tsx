import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { IconGlyph } from '../../components/ui/IconGlyph';
import { COLOR_OPTIONS, WALLET_ICON_OPTIONS, WALLET_TYPE_OPTIONS } from '../../db/defaults';
import { upsertWallet } from '../../db/operations';
import { walletSchema, type WalletFormValues } from '../../domain/schemas';
import { useAppData } from '../../hooks/useAppData';
import { useUIStore } from '../../stores/uiStore';

function buildDefaults(r?: { name: string; type: WalletFormValues['type']; currency: string; openingBalance: number; color: string; icon: string; isArchived: boolean }): WalletFormValues {
  return { name: r?.name ?? '', type: r?.type ?? 'cash', currency: r?.currency ?? 'VND', openingBalance: r?.openingBalance ?? 0, color: r?.color ?? '#14b8a6', icon: r?.icon ?? 'wallet', isArchived: r?.isArchived ?? false };
}
const typeLabels: Record<string, string> = { cash: 'Tiền mặt', bank: 'Ngân hàng', ewallet: 'Ví điện tử', savings: 'Tiết kiệm', other: 'Khác' };

export function WalletSheet() {
  const sheet = useUIStore((s) => s.walletSheet);
  const close = useUIStore((s) => s.closeWalletSheet);
  const prefs = useAppData().preferences;
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<WalletFormValues>({ resolver: zodResolver(walletSchema), defaultValues: buildDefaults({ name: '', type: 'cash', currency: prefs.currency, openingBalance: 0, color: '#14b8a6', icon: 'wallet', isArchived: false }) });

  useEffect(() => { reset(buildDefaults(sheet.record ?? { name: '', type: 'cash', currency: prefs.currency, openingBalance: 0, color: '#14b8a6', icon: 'wallet', isArchived: false })); }, [prefs.currency, reset, sheet.record]);

  const color = watch('color'), icon = watch('icon'), type = watch('type');

  const onSubmit = handleSubmit(async (v) => {
    await upsertWallet({ ...v, id: sheet.record?.id });
    toast.success(sheet.record ? 'Đã cập nhật ví' : 'Đã tạo ví');
    close();
  });

  return (
    <Modal open={sheet.open} onClose={close} title={sheet.record ? 'Sửa ví' : 'Thêm ví'} subtitle="Giữ số dư rõ ràng cho tiền mặt, ngân hàng và ví điện tử."
      footer={<><button type="button" className="soft-button" onClick={close}>Hủy</button><button type="submit" form="wallet-form" className="primary-button" disabled={isSubmitting}><Check size={14} /> Lưu</button></>}>
      <form id="wallet-form" className="sheet-form" onSubmit={onSubmit}>
        <label className="field"><span>Tên ví</span><input type="text" placeholder="Ví hàng ngày" {...register('name')} />{errors.name && <small>{errors.name.message}</small>}</label>
        <div className="field"><span>Loại</span><div className="chip-row">{WALLET_TYPE_OPTIONS.map((t) => <button key={t} type="button" className={`chip-button${type === t ? ' chip-button--active' : ''}`} onClick={() => setValue('type', t)}>{typeLabels[t]}</button>)}</div></div>
        <div className="field-grid">
          <label className="field"><span>Tiền tệ</span><input type="text" {...register('currency')} /></label>
          <label className="field"><span>Số dư ban đầu</span><input type="number" step="0.01" {...register('openingBalance')} /></label>
        </div>
        <div className="field"><span>Màu sắc</span><div className="picker-grid">{COLOR_OPTIONS.map((c) => <motion.button key={c} type="button" className={`picker-swatch${color === c ? ' picker-swatch--selected' : ''}`} style={{ background: c }} onClick={() => setValue('color', c)} whileTap={{ scale: 0.85 }}>{color === c && <Check size={14} />}</motion.button>)}</div></div>
        <div className="field"><span>Biểu tượng</span><div className="icon-picker-grid">{WALLET_ICON_OPTIONS.map((ic) => <motion.button key={ic} type="button" className={`icon-picker-item${icon === ic ? ' icon-picker-item--selected' : ''}`} onClick={() => setValue('icon', ic)} whileTap={{ scale: 0.9 }}><IconGlyph name={ic} />{ic}</motion.button>)}</div></div>
      </form>
    </Modal>
  );
}
