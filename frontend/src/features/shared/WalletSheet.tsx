import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../../components/ui/Modal';
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

export function WalletSheet() {
  const walletSheet = useUIStore((state) => state.walletSheet);
  const closeWalletSheet = useUIStore((state) => state.closeWalletSheet);
  const addToast = useUIStore((state) => state.addToast);
  const preferences = useAppData().preferences;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: buildDefaults({ name: '', type: 'cash', currency: preferences.currency, openingBalance: 0, color: '#14b8a6', icon: 'wallet', isArchived: false }),
  });

  useEffect(() => {
    reset(buildDefaults(walletSheet.record ?? { name: '', type: 'cash', currency: preferences.currency, openingBalance: 0, color: '#14b8a6', icon: 'wallet', isArchived: false }));
  }, [preferences.currency, reset, walletSheet.record]);

  const onSubmit = handleSubmit(async (values) => {
    await upsertWallet({ ...values, id: walletSheet.record?.id });
    addToast({ title: walletSheet.record ? 'Wallet updated' : 'Wallet created', tone: 'success' });
    closeWalletSheet();
  });

  return (
    <Modal
      open={walletSheet.open}
      onClose={closeWalletSheet}
      title={walletSheet.record ? 'Edit wallet' : 'Add wallet'}
      subtitle="Keep balances clear across cash, bank, and digital wallets."
      footer={
        <>
          <button type="button" className="soft-button" onClick={closeWalletSheet}>Cancel</button>
          <button type="submit" form="wallet-form" className="primary-button" disabled={isSubmitting}>Save wallet</button>
        </>
      }
    >
      <form id="wallet-form" className="sheet-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Name</span>
          <input type="text" placeholder="Daily Wallet" {...register('name')} />
          {errors.name ? <small>{errors.name.message}</small> : null}
        </label>
        <div className="field-grid">
          <label className="field">
            <span>Type</span>
            <select {...register('type')}>
              {WALLET_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Currency</span>
            <input type="text" {...register('currency')} />
          </label>
        </div>
        <label className="field">
          <span>Opening balance</span>
          <input type="number" step="0.01" {...register('openingBalance')} />
        </label>
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
              {WALLET_ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </select>
          </label>
        </div>
      </form>
    </Modal>
  );
}
