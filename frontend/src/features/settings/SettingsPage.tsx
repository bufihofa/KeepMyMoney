import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconGlyph } from '../../components/ui/IconGlyph';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CURRENCY_OPTIONS } from '../../db/defaults';
import { db, setPreferences } from '../../db/database';
import { archiveWallet, clearLocalData, exportSnapshot, importSnapshot } from '../../db/operations';
import { snapshotSchema } from '../../domain/schemas';
import { copyText, impact } from '../../lib/device';
import { useAppData } from '../../hooks/useAppData';
import { useUIStore } from '../../stores/uiStore';

export function SettingsPage() {
  const data = useAppData();
  const openWalletSheet = useUIStore((state) => state.openWalletSheet);
  const openCategorySheet = useUIStore((state) => state.openCategorySheet);
  const addToast = useUIStore((state) => state.addToast);
  const [exportJson, setExportJson] = useState('');
  const [importJson, setImportJson] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | { type: 'archive'; walletId: string } | { type: 'clear' }>(null);

  const importPreview = useMemo(() => {
    if (!importJson.trim()) return null;
    try {
      const parsed = snapshotSchema.parse(JSON.parse(importJson));
      return { wallets: parsed.wallets.length, transactions: parsed.transactions.length, budgets: parsed.budgets.length, exportedAt: parsed.exportedAt };
    } catch {
      return null;
    }
  }, [importJson]);

  const handleExport = async () => {
    const snapshot = await exportSnapshot();
    const value = JSON.stringify(snapshot, null, 2);
    setExportJson(value);
    addToast({ title: 'Đã tạo bản sao lưu', description: 'Cuộn xuống để sao chép JSON.', tone: 'success' });
  };

  const handleCopy = async () => {
    if (!exportJson) return;
    await copyText(exportJson);
    await impact();
    addToast({ title: 'Đã sao chép vào clipboard', tone: 'success' });
  };

  const handleImport = async () => {
    if (!importJson.trim()) return;
    setIsImporting(true);
    try {
      await importSnapshot(importJson);
      await impact();
      addToast({ title: 'Đã khôi phục dữ liệu', description: 'Dữ liệu cục bộ đã được thay thế.', tone: 'success' });
      setImportJson('');
    } catch (error) {
      addToast({ title: 'Nhập thất bại', description: error instanceof Error ? error.message : 'JSON sao lưu không hợp lệ.', tone: 'danger' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'archive') {
      await archiveWallet(confirmAction.walletId);
      addToast({ title: 'Đã lưu trữ ví', tone: 'success' });
    } else if (confirmAction.type === 'clear') {
      await clearLocalData();
      addToast({ title: 'Đã xóa dữ liệu cục bộ', tone: 'success' });
    }
    setConfirmAction(null);
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Tùy chỉnh</p>
          <h1>Cài đặt</h1>
          <p className="section-copy">Quản lý ưu tiên, ví, danh mục và dữ liệu cục bộ.</p>
        </div>
      </header>

      {/* Personalization */}
      <motion.section className="panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="panel__header">
          <div>
            <p className="eyebrow">Hiển thị</p>
            <h2>Cá nhân hóa</h2>
          </div>
        </div>
        <div className="field-grid">
          <label className="field">
            <span>Giao diện</span>
            <select value={data.preferences.theme} onChange={(event) => void setPreferences({ theme: event.target.value as typeof data.preferences.theme })}>
              <option value="system">Hệ thống</option>
              <option value="light">Sáng</option>
              <option value="dark">Tối</option>
            </select>
          </label>
          <label className="field">
            <span>Tiền tệ</span>
            <select value={data.preferences.currency} onChange={(event) => void setPreferences({ currency: event.target.value })}>
              {CURRENCY_OPTIONS.map((currency) => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Tuần bắt đầu</span>
            <select value={data.preferences.weekStart} onChange={(event) => void setPreferences({ weekStart: event.target.value as typeof data.preferences.weekStart })}>
              <option value="monday">Thứ Hai</option>
              <option value="sunday">Chủ Nhật</option>
            </select>
          </label>
        </div>
      </motion.section>

      {/* Wallets */}
      <motion.section className="panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="panel__header">
          <div>
            <p className="eyebrow">Ví tiền</p>
            <h2>Quản lý tài khoản</h2>
          </div>
          <button type="button" className="soft-button" onClick={() => openWalletSheet()}>
            <IconGlyph name="plus" size="sm" /> Thêm ví
          </button>
        </div>
        <div className="stack-list">
          {data.wallets.map((wallet) => (
            <article key={wallet.id} className="setting-row">
              <div>
                <strong>
                  <span className="legend-dot" style={{ background: wallet.color, marginRight: '0.5rem' }} />
                  {wallet.name}
                </strong>
                <span>{wallet.type} · {wallet.currency}{wallet.isArchived ? ' · đã lưu trữ' : ''}</span>
              </div>
              <div className="inline-actions">
                <button type="button" className="icon-button icon-button--ghost" onClick={() => openWalletSheet(wallet)} aria-label="Sửa ví">
                  <IconGlyph name="edit" size="sm" />
                </button>
                {!wallet.isArchived ? (
                  <button type="button" className="icon-button icon-button--ghost" onClick={() => setConfirmAction({ type: 'archive', walletId: wallet.id })} aria-label="Lưu trữ ví">
                    <IconGlyph name="trash" size="sm" />
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </motion.section>

      {/* Categories */}
      <motion.section className="panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="panel__header">
          <div>
            <p className="eyebrow">Danh mục</p>
            <h2>Tùy chỉnh nhãn</h2>
          </div>
          <button type="button" className="soft-button" onClick={() => openCategorySheet()}>
            <IconGlyph name="plus" size="sm" /> Thêm
          </button>
        </div>
        <div className="stack-list">
          {data.categories.map((category) => (
            <article key={category.id} className="setting-row">
              <div>
                <strong>
                  <span className="legend-dot" style={{ background: category.color, marginRight: '0.5rem' }} />
                  {category.name}
                </strong>
                <span>{category.kind === 'expense' ? 'Chi tiêu' : 'Thu nhập'}{category.isSystem ? ' · hệ thống' : ''}{category.isHidden ? ' · ẩn' : ''}</span>
              </div>
              <div className="inline-actions">
                <button type="button" className="icon-button icon-button--ghost" onClick={() => openCategorySheet(category)} aria-label="Sửa danh mục">
                  <IconGlyph name="edit" size="sm" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </motion.section>

      {/* Import/Export */}
      <motion.section className="panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="panel__header">
          <div>
            <p className="eyebrow">Sao lưu</p>
            <h2>Nhập/Xuất JSON</h2>
          </div>
        </div>
        <div className="inline-actions" style={{ flexWrap: 'wrap' }}>
          <button type="button" className="primary-button" onClick={() => void handleExport()}>
            <IconGlyph name="export" size="sm" /> Tạo bản sao lưu
          </button>
          <button type="button" className="soft-button" onClick={() => void handleCopy()} disabled={!exportJson}>
            <IconGlyph name="copy" size="sm" /> Sao chép
          </button>
        </div>
        <label className="field">
          <span>JSON đã xuất</span>
          <textarea rows={6} readOnly value={exportJson} placeholder="Bản sao lưu JSON sẽ xuất hiện ở đây." />
        </label>
        <label className="field">
          <span>Nhập JSON</span>
          <textarea rows={6} value={importJson} onChange={(event) => setImportJson(event.target.value)} placeholder="Dán một bản sao lưu KeepMyMoney đầy đủ ở đây." />
        </label>
        {importPreview ? (
          <div className="preview-card">
            <strong>Xem trước bản sao lưu</strong>
            <span>{importPreview.wallets} ví · {importPreview.transactions} giao dịch · {importPreview.budgets} ngân sách</span>
            <small>Xuất lúc {importPreview.exportedAt}</small>
          </div>
        ) : importJson.trim() ? (
          <div className="preview-card preview-card--danger">
            <strong>JSON sao lưu không hợp lệ</strong>
            <span>Kiểm tra định dạng JSON và phiên bản schema trước khi nhập.</span>
          </div>
        ) : null}
        <div className="inline-actions" style={{ flexWrap: 'wrap' }}>
          <button type="button" className="primary-button" onClick={() => void handleImport()} disabled={!importPreview || isImporting}>
            <IconGlyph name="import" size="sm" /> {isImporting ? 'Đang nhập...' : 'Nhập và thay thế'}
          </button>
          <button type="button" className="soft-button soft-button--danger" onClick={() => setConfirmAction({ type: 'clear' })}>
            Xóa dữ liệu
          </button>
        </div>
      </motion.section>

      {/* Diagnostics */}
      <motion.section className="panel panel--dense" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="panel__header panel__header--compact">
          <h2>Chẩn đoán</h2>
        </div>
        <div className="setting-row">
          <div>
            <strong>Bản ghi IndexedDB</strong>
            <span>{data.transactions.length} giao dịch · {data.wallets.length} ví · {data.categories.length} danh mục</span>
          </div>
          <button type="button" className="icon-button icon-button--ghost" onClick={() => void db.open()} aria-label="Mở kết nối DB">
            <IconGlyph name="spark" size="sm" />
          </button>
        </div>
      </motion.section>

      {data.wallets.length === 0 ? <EmptyState icon="wallet" title="Chưa cấu hình ví" description="Thêm một ví để bắt đầu ghi giao dịch." action={<button type="button" className="primary-button" onClick={() => openWalletSheet()}>Thêm ví</button>} /> : null}

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.type === 'archive' ? 'Lưu trữ ví?' : 'Xóa tất cả dữ liệu?'}
        description={confirmAction?.type === 'archive' ? 'Ví sẽ được lưu trữ. Giao dịch hiện có vẫn được giữ lại.' : 'Tất cả dữ liệu cục bộ sẽ bị xóa và bạn sẽ quay lại trang khởi tạo.'}
        confirmLabel={confirmAction?.type === 'archive' ? 'Lưu trữ' : 'Xóa hết'}
        cancelLabel="Hủy"
        tone="danger"
        onConfirm={() => void handleConfirm()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
