import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Pencil, Archive, Download, Upload, Copy, Trash2, Zap } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CURRENCY_OPTIONS } from '../../db/defaults';
import { db, setPreferences } from '../../db/database';
import { archiveWallet, clearLocalData, exportSnapshot, importSnapshot } from '../../db/operations';
import { snapshotSchema } from '../../domain/schemas';
import { copyText, impact } from '../../lib/device';
import { useAppData } from '../../hooks/useAppData';
import { shouldReduceMotion } from '../../lib/performance';
import { useUIStore } from '../../stores/uiStore';

export function SettingsPage() {
  const data = useAppData();
  const reduceMotion = shouldReduceMotion();
  const openWalletSheet = useUIStore((s) => s.openWalletSheet);
  const openCategorySheet = useUIStore((s) => s.openCategorySheet);
  const [exportJson, setExportJson] = useState('');
  const [importJson, setImportJson] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | { type: 'archive'; walletId: string } | { type: 'clear' }>(null);

  const importPreview = useMemo(() => {
    if (!importJson.trim()) return null;
    try {
      const parsed = snapshotSchema.parse(JSON.parse(importJson));
      return { wallets: parsed.wallets.length, transactions: parsed.transactions.length, budgets: parsed.budgets.length, exportedAt: parsed.exportedAt };
    } catch { return null; }
  }, [importJson]);

  const handleExport = async () => {
    const snapshot = await exportSnapshot();
    setExportJson(JSON.stringify(snapshot, null, 2));
    toast.success('Đã tạo bản sao lưu', { description: 'Cuộn xuống để sao chép JSON.' });
  };

  const handleCopy = async () => {
    if (!exportJson) return;
    await copyText(exportJson);
    await impact();
    toast.success('Đã sao chép vào clipboard');
  };

  const handleImport = async () => {
    if (!importJson.trim()) return;
    setIsImporting(true);
    try {
      await importSnapshot(importJson);
      await impact();
      toast.success('Đã khôi phục dữ liệu', { description: 'Dữ liệu cục bộ đã được thay thế.' });
      setImportJson('');
    } catch (err) {
      toast.error('Nhập thất bại', { description: err instanceof Error ? err.message : 'JSON không hợp lệ.' });
    } finally { setIsImporting(false); }
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'archive') {
      await archiveWallet(confirmAction.walletId);
      toast.success('Đã lưu trữ ví');
    } else {
      await clearLocalData();
      toast.success('Đã xóa dữ liệu cục bộ');
    }
    setConfirmAction(null);
  };

  return (
    <div className="page">
      <header className="page-header">
        <div><p className="eyebrow">Tùy chỉnh</p><h1>Cài đặt</h1><p className="section-copy">Quản lý ưu tiên, ví, danh mục và dữ liệu cục bộ.</p></div>
      </header>

      {/* Display */}
      <motion.section className="panel" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={reduceMotion ? undefined : { delay: 0.05 }}>
        <div className="panel__header"><div><p className="eyebrow">Hiển thị</p><h2>Cá nhân hóa</h2></div></div>
        <div className="field-grid">
          <label className="field"><span>Giao diện</span>
            <select value={data.preferences.theme} onChange={(e) => void setPreferences({ theme: e.target.value as typeof data.preferences.theme })}>
              <option value="system">Hệ thống</option><option value="light">Sáng</option><option value="dark">Tối</option>
            </select>
          </label>
          <label className="field"><span>Tiền tệ</span>
            <select value={data.preferences.currency} onChange={(e) => void setPreferences({ currency: e.target.value })}>
              {CURRENCY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="field"><span>Tuần bắt đầu</span>
            <select value={data.preferences.weekStart} onChange={(e) => void setPreferences({ weekStart: e.target.value as typeof data.preferences.weekStart })}>
              <option value="monday">Thứ Hai</option><option value="sunday">Chủ Nhật</option>
            </select>
          </label>
        </div>
      </motion.section>

      {/* Wallets */}
      <motion.section className="panel" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={reduceMotion ? undefined : { delay: 0.1 }}>
        <div className="panel__header"><div><p className="eyebrow">Ví tiền</p><h2>Quản lý tài khoản</h2></div>
          <button type="button" className="soft-button" onClick={() => openWalletSheet()}><Plus size={13} /> Thêm ví</button>
        </div>
        <div className="stack-list">
          {data.wallets.map((w) => (
            <article key={w.id} className="setting-row">
              <div><strong><span className="legend-dot" style={{ background: w.color, marginRight: '0.5rem' }} />{w.name}</strong>
                <span>{w.type === 'cash' ? 'Tiền mặt' : w.type === 'bank' ? 'Ngân hàng' : w.type === 'ewallet' ? 'Ví điện tử' : w.type === 'savings' ? 'Tiết kiệm' : 'Khác'} · {w.currency}{w.isArchived ? ' · đã lưu trữ' : ''}</span>
              </div>
              <div className="inline-actions">
                <button type="button" className="icon-button icon-button--ghost" onClick={() => openWalletSheet(w)} aria-label="Sửa"><Pencil size={14} /></button>
                {!w.isArchived && <button type="button" className="icon-button icon-button--ghost" onClick={() => setConfirmAction({ type: 'archive', walletId: w.id })} aria-label="Lưu trữ"><Archive size={14} /></button>}
              </div>
            </article>
          ))}
        </div>
      </motion.section>

      {/* Categories */}
      <motion.section className="panel" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={reduceMotion ? undefined : { delay: 0.15 }}>
        <div className="panel__header"><div><p className="eyebrow">Danh mục</p><h2>Tùy chỉnh nhãn</h2></div>
          <button type="button" className="soft-button" onClick={() => openCategorySheet()}><Plus size={13} /> Thêm</button>
        </div>
        <div className="stack-list">
          {data.categories.map((c) => (
            <article key={c.id} className="setting-row">
              <div><strong><span className="legend-dot" style={{ background: c.color, marginRight: '0.5rem' }} />{c.name}</strong>
                <span>{c.kind === 'expense' ? 'Chi tiêu' : 'Thu nhập'}{c.isSystem ? ' · hệ thống' : ''}{c.isHidden ? ' · ẩn' : ''}</span>
              </div>
              <div className="inline-actions">
                <button type="button" className="icon-button icon-button--ghost" onClick={() => openCategorySheet(c)} aria-label="Sửa"><Pencil size={14} /></button>
              </div>
            </article>
          ))}
        </div>
      </motion.section>

      {/* Import/Export */}
      <motion.section className="panel" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={reduceMotion ? undefined : { delay: 0.2 }}>
        <div className="panel__header"><div><p className="eyebrow">Sao lưu</p><h2>Nhập/Xuất JSON</h2></div></div>
        <div className="inline-actions" style={{ flexWrap: 'wrap' }}>
          <button type="button" className="primary-button" onClick={() => void handleExport()}><Download size={14} /> Tạo bản sao lưu</button>
          <button type="button" className="soft-button" onClick={() => void handleCopy()} disabled={!exportJson}><Copy size={14} /> Sao chép</button>
        </div>
        <label className="field"><span>JSON đã xuất</span><textarea rows={5} readOnly value={exportJson} placeholder="Bản sao lưu JSON sẽ xuất hiện ở đây." /></label>
        <label className="field"><span>Nhập JSON</span><textarea rows={5} value={importJson} onChange={(e) => setImportJson(e.target.value)} placeholder="Dán bản sao lưu KeepMyMoney đầy đủ ở đây." /></label>
        {importPreview ? (
          <div className="preview-card"><strong>Xem trước bản sao lưu</strong><span>{importPreview.wallets} ví · {importPreview.transactions} giao dịch · {importPreview.budgets} ngân sách</span><small>Xuất lúc {importPreview.exportedAt}</small></div>
        ) : importJson.trim() ? <div className="preview-card preview-card--danger"><strong>JSON không hợp lệ</strong><span>Kiểm tra định dạng và phiên bản schema.</span></div> : null}
        <div className="inline-actions" style={{ flexWrap: 'wrap' }}>
          <button type="button" className="primary-button" onClick={() => void handleImport()} disabled={!importPreview || isImporting}><Upload size={14} /> {isImporting ? 'Đang nhập...' : 'Nhập và thay thế'}</button>
          <button type="button" className="soft-button soft-button--danger" onClick={() => setConfirmAction({ type: 'clear' })}><Trash2 size={14} /> Xóa dữ liệu</button>
        </div>
      </motion.section>

      {/* Diagnostics */}
      <motion.section className="panel panel--dense" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={reduceMotion ? undefined : { delay: 0.25 }}>
        <div className="panel__header panel__header--compact"><h2>Chẩn đoán</h2></div>
        <div className="setting-row">
          <div><strong>Bản ghi IndexedDB</strong><span>{data.transactions.length} giao dịch · {data.wallets.length} ví · {data.categories.length} danh mục</span></div>
          <button type="button" className="icon-button icon-button--ghost" onClick={() => void db.open()} aria-label="Kết nối DB"><Zap size={14} /></button>
        </div>
      </motion.section>

      {data.wallets.length === 0 && <EmptyState icon="wallet" title="Chưa cấu hình ví" description="Thêm ví để bắt đầu ghi giao dịch." action={<button type="button" className="primary-button" onClick={() => openWalletSheet()}>Thêm ví</button>} />}

      <ConfirmDialog open={!!confirmAction} title={confirmAction?.type === 'archive' ? 'Lưu trữ ví?' : 'Xóa tất cả dữ liệu?'}
        description={confirmAction?.type === 'archive' ? 'Ví sẽ được lưu trữ. Giao dịch hiện có vẫn được giữ lại.' : 'Tất cả dữ liệu cục bộ sẽ bị xóa và bạn sẽ quay lại trang khởi tạo.'}
        confirmLabel={confirmAction?.type === 'archive' ? 'Lưu trữ' : 'Xóa hết'} cancelLabel="Hủy" tone="danger"
        onConfirm={() => void handleConfirm()} onCancel={() => setConfirmAction(null)} />
    </div>
  );
}
