import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Pencil, Archive, Download, Upload, Copy, Trash2, Zap } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CURRENCY_OPTIONS } from '../../db/defaults';
import { db, setPreferences } from '../../db/database';
import { archiveWallet, clearLocalData, exportSnapshot, importSnapshot } from '../../db/operations';
import { snapshotSchema } from '../../domain/schemas';
import { toMonthKey } from '../../domain/format';
import { copyText, impact } from '../../lib/device';
import { getAISettings, setAISettings } from '../../lib/ai';
import { useAppData } from '../../hooks/useAppData';
import { shouldReduceMotion } from '../../lib/performance';
import { useUIStore } from '../../stores/uiStore';

type NumericIssue = {
  table: 'wallets' | 'transactions' | 'budgets';
  id: string;
  field: string;
  value: unknown;
};

type SymptomDebug = {
  key: 'budget-usage' | 'month-expense' | 'home-total';
  title: string;
  uiText: string;
  computedValue: unknown;
  isFiniteValue: boolean;
  formula: string;
  steps: Array<{ name: string; value: unknown; finite?: boolean }>;
  note: string;
};

function isFiniteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value);
}

export function SettingsPage() {
  const data = useAppData();
  const reduceMotion = shouldReduceMotion();
  const openWalletSheet = useUIStore((s) => s.openWalletSheet);
  const openCategorySheet = useUIStore((s) => s.openCategorySheet);
  const [exportJson, setExportJson] = useState('');
  const [importJson, setImportJson] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | { type: 'archive'; walletId: string } | { type: 'clear' }>(null);
  const [ai, setAi] = useState(() => getAISettings());
  const [isScanningNumericIssues, setIsScanningNumericIssues] = useState(false);
  const [numericIssues, setNumericIssues] = useState<NumericIssue[]>([]);
  const [symptomDebug, setSymptomDebug] = useState<SymptomDebug[]>([]);
  const [scanAt, setScanAt] = useState('');
  const buildId = import.meta.env.VITE_BUILD_ID || 'local-dev';
  const buildTime = import.meta.env.VITE_BUILD_TIME || 'unknown';
  const buildMode = import.meta.env.MODE;
  const runtime = Capacitor.isNativePlatform() ? `native:${Capacitor.getPlatform()}` : 'web';

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

  const handleSaveAI = () => {
    setAISettings(ai);
    toast.success('Đã lưu cấu hình AI');
  };

  const handleScanNumericIssues = async () => {
    setIsScanningNumericIssues(true);
    try {
      const [wallets, transactions, budgets] = await Promise.all([
        db.wallets.toArray(),
        db.transactions.toArray(),
        db.budgets.toArray(),
      ]);

      const issues: NumericIssue[] = [];

      for (const wallet of wallets) {
        if (!isFiniteNumber((wallet as { openingBalance: unknown }).openingBalance)) {
          issues.push({ table: 'wallets', id: wallet.id, field: 'openingBalance', value: (wallet as { openingBalance: unknown }).openingBalance });
        }
        if (!isFiniteNumber((wallet as { currentBalanceCache: unknown }).currentBalanceCache)) {
          issues.push({ table: 'wallets', id: wallet.id, field: 'currentBalanceCache', value: (wallet as { currentBalanceCache: unknown }).currentBalanceCache });
        }
      }

      for (const transaction of transactions) {
        if (!isFiniteNumber((transaction as { amount: unknown }).amount)) {
          issues.push({ table: 'transactions', id: transaction.id, field: 'amount', value: (transaction as { amount: unknown }).amount });
        }
      }

      for (const budget of budgets) {
        if (!isFiniteNumber((budget as { limitAmount: unknown }).limitAmount)) {
          issues.push({ table: 'budgets', id: budget.id, field: 'limitAmount', value: (budget as { limitAmount: unknown }).limitAmount });
        }

        const thresholds = (budget as { alertThresholds?: unknown }).alertThresholds;
        if (!Array.isArray(thresholds)) {
          issues.push({ table: 'budgets', id: budget.id, field: 'alertThresholds', value: thresholds });
          continue;
        }

        for (let i = 0; i < thresholds.length; i += 1) {
          if (!isFiniteNumber(thresholds[i])) {
            issues.push({ table: 'budgets', id: budget.id, field: `alertThresholds[${i}]`, value: thresholds[i] });
          }
        }
      }

      const monthKey = toMonthKey();
      const activeWallets = wallets.filter((wallet) => !wallet.isArchived);
      const activeTransactions = transactions.filter((transaction) => !transaction.deletedAt);
      const monthTransactions = activeTransactions.filter((transaction) => transaction.occurredAt.startsWith(monthKey));
      const monthExpenseTransactions = monthTransactions.filter((transaction) => transaction.type === 'expense');
      const monthBudgets = budgets.filter((budget) => budget.periodKey === monthKey);

      let homeTotalRaw: unknown = 0;
      for (const wallet of activeWallets) {
        const balance = Number((wallet as { currentBalanceCache: unknown }).currentBalanceCache);
        homeTotalRaw = (homeTotalRaw as number) + balance;
      }

      let monthExpenseRaw: unknown = 0;
      for (const transaction of monthExpenseTransactions) {
        const amount = Number((transaction as { amount: unknown }).amount);
        monthExpenseRaw = (monthExpenseRaw as number) + amount;
      }

      let totalSpentRaw: unknown = 0;
      let totalBudgetRaw: unknown = 0;
      for (const budget of monthBudgets) {
        const budgetSpentForCategory = monthExpenseTransactions
          .filter((transaction) => transaction.categoryId === budget.categoryId)
          .reduce((sum, transaction) => sum + Number((transaction as { amount: unknown }).amount), 0);

        totalSpentRaw = (totalSpentRaw as number) + budgetSpentForCategory;
        totalBudgetRaw = (totalBudgetRaw as number) + Number((budget as { limitAmount: unknown }).limitAmount);
      }

      let budgetUsageRaw: unknown = 0;
      if (typeof totalBudgetRaw === 'number' && totalBudgetRaw > 0) {
        budgetUsageRaw = (totalSpentRaw as number) / totalBudgetRaw;
      }

      const symptomChecks: SymptomDebug[] = [
        {
          key: 'budget-usage',
          title: 'Đã dùng NaN% ngân sách',
          uiText: 'BudgetsPage > CountUp(Math.round(usage * 100))',
          computedValue: budgetUsageRaw,
          isFiniteValue: isFiniteNumber(budgetUsageRaw),
          formula: 'usage = totalSpent / totalBudget',
          steps: [
            { name: 'monthKey', value: monthKey },
            { name: 'monthBudgets.length', value: monthBudgets.length, finite: true },
            { name: 'monthExpenseTransactions.length', value: monthExpenseTransactions.length, finite: true },
            { name: 'totalSpentRaw', value: totalSpentRaw, finite: isFiniteNumber(totalSpentRaw) },
            { name: 'totalBudgetRaw', value: totalBudgetRaw, finite: isFiniteNumber(totalBudgetRaw) },
            { name: 'usageRaw', value: budgetUsageRaw, finite: isFiniteNumber(budgetUsageRaw) },
          ],
          note: isFiniteNumber(budgetUsageRaw)
            ? 'Công thức ngân sách hiện trả về số hữu hạn.'
            : 'NaN xuất hiện trong công thức usage; kiểm tra limitAmount hoặc spent theo danh mục/tháng.',
        },
        {
          key: 'month-expense',
          title: 'Chi tiêu NaN tháng này',
          uiText: 'HomePage > CountUp(summary.expense)',
          computedValue: monthExpenseRaw,
          isFiniteValue: isFiniteNumber(monthExpenseRaw),
          formula: 'summary.expense = Σ(transaction.amount) với type=expense',
          steps: [
            { name: 'monthKey', value: monthKey },
            { name: 'monthExpenseTransactions.length', value: monthExpenseTransactions.length, finite: true },
            { name: 'monthExpenseRaw', value: monthExpenseRaw, finite: isFiniteNumber(monthExpenseRaw) },
          ],
          note: isFiniteNumber(monthExpenseRaw)
            ? 'Tổng chi tiêu tháng hiện ra số hữu hạn.'
            : 'NaN xuất hiện khi cộng transaction.amount trong tháng.',
        },
        {
          key: 'home-total',
          title: 'Chào buổi sáng NaN',
          uiText: 'HomePage > CountUp(total) dưới dòng greeting',
          computedValue: homeTotalRaw,
          isFiniteValue: isFiniteNumber(homeTotalRaw),
          formula: 'total = Σ(activeWallet.currentBalanceCache)',
          steps: [
            { name: 'activeWallets.length', value: activeWallets.length, finite: true },
            { name: 'homeTotalRaw', value: homeTotalRaw, finite: isFiniteNumber(homeTotalRaw) },
          ],
          note: isFiniteNumber(homeTotalRaw)
            ? 'Tổng số dư ví hiện là số hữu hạn.'
            : 'NaN xuất hiện khi cộng currentBalanceCache của ví hoạt động.',
        },
      ];

      setNumericIssues(issues);
      setSymptomDebug(symptomChecks);
      setScanAt(new Date().toISOString());
      const symptomBadCount = symptomChecks.filter((item) => !item.isFiniteValue).length;
      if (issues.length === 0 && symptomBadCount === 0) {
        toast.success('Không phát hiện số liệu lỗi và công thức NaN đều ổn');
      } else {
        toast.success(`Phát hiện ${issues.length} lỗi dữ liệu, ${symptomBadCount} công thức nghi vấn`);
      }
    } catch (err) {
      toast.error('Quét dữ liệu thất bại', { description: err instanceof Error ? err.message : 'Lỗi không xác định' });
    } finally {
      setIsScanningNumericIssues(false);
    }
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
      <motion.section className="panel" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={reduceMotion ? undefined : { delay: 0.23 }}>
        <div className="panel__header"><div><p className="eyebrow">AI</p><h2>LLM trực tiếp trong app</h2></div>
          <Link to="/receipt-import" className="soft-button">Mở nhập hóa đơn AI</Link>
        </div>
        <div className="field-grid">
          <label className="field"><span>Endpoint</span><input value={ai.endpoint} onChange={(e) => setAi((prev) => ({ ...prev, endpoint: e.target.value }))} placeholder="https://nano-gpt.com/api/v1/messages" /></label>
          <label className="field"><span>Model</span><input value={ai.model} onChange={(e) => setAi((prev) => ({ ...prev, model: e.target.value }))} placeholder="moonshotai/kimi-k2.5" /></label>
          <label className="field"><span>API Key</span><input value={ai.apiKey} onChange={(e) => setAi((prev) => ({ ...prev, apiKey: e.target.value }))} placeholder="sk-..." type="password" /></label>
        </div>
        <div className="inline-actions" style={{ marginTop: '0.75rem' }}>
          <button type="button" className="primary-button" onClick={handleSaveAI}>Lưu cấu hình AI</button>
        </div>
      </motion.section>

      <motion.section className="panel panel--dense" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={reduceMotion ? undefined : { delay: 0.25 }}>
        <div className="panel__header panel__header--compact"><h2>Chẩn đoán</h2></div>
        <div className="setting-row">
          <div>
            <strong>Bundle fingerprint</strong>
            <span>{buildId.slice(0, 12)} · {buildTime} · {buildMode} · {runtime}</span>
          </div>
          <button type="button" className="icon-button icon-button--ghost" onClick={() => void copyText(`${buildId}|${buildTime}|${buildMode}|${runtime}`)} aria-label="Sao chép fingerprint"><Copy size={14} /></button>
        </div>
        <div className="setting-row">
          <div><strong>Bản ghi IndexedDB</strong><span>{data.transactions.length} giao dịch · {data.wallets.length} ví · {data.categories.length} danh mục</span></div>
          <button type="button" className="icon-button icon-button--ghost" onClick={() => void db.open()} aria-label="Kết nối DB"><Zap size={14} /></button>
        </div>
        <div className="inline-actions" style={{ marginTop: '0.65rem' }}>
          <button type="button" className="soft-button" onClick={() => void handleScanNumericIssues()} disabled={isScanningNumericIssues}>
            <Zap size={14} /> {isScanningNumericIssues ? 'Đang quét...' : 'Quét số liệu bất thường'}
          </button>
        </div>
        {scanAt && (
          <div className={`preview-card${numericIssues.length > 0 ? ' preview-card--danger' : ''}`} style={{ marginTop: '0.75rem' }}>
            <strong>{numericIssues.length > 0 ? `Phát hiện ${numericIssues.length} lỗi số liệu` : 'Không phát hiện số liệu lỗi'}</strong>
            <small>Quét lúc {scanAt}</small>
            {numericIssues.length > 0 && (
              <textarea
                rows={6}
                readOnly
                value={JSON.stringify(numericIssues.slice(0, 20), null, 2)}
                style={{ marginTop: '0.55rem' }}
              />
            )}
          </div>
        )}
        {scanAt && symptomDebug.length > 0 && (
          <div className={`preview-card${symptomDebug.some((item) => !item.isFiniteValue) ? ' preview-card--danger' : ''}`} style={{ marginTop: '0.75rem' }}>
            <strong>Debug công thức 3 triệu chứng NaN</strong>
            <small>Quét lúc {scanAt}</small>
            <textarea
              rows={10}
              readOnly
              value={JSON.stringify(symptomDebug, null, 2)}
              style={{ marginTop: '0.55rem' }}
            />
          </div>
        )}
      </motion.section>

      {data.wallets.length === 0 && <EmptyState icon="wallet" title="Chưa cấu hình ví" description="Thêm ví để bắt đầu ghi giao dịch." action={<button type="button" className="primary-button" onClick={() => openWalletSheet()}>Thêm ví</button>} />}

      <ConfirmDialog open={!!confirmAction} title={confirmAction?.type === 'archive' ? 'Lưu trữ ví?' : 'Xóa tất cả dữ liệu?'}
        description={confirmAction?.type === 'archive' ? 'Ví sẽ được lưu trữ. Giao dịch hiện có vẫn được giữ lại.' : 'Tất cả dữ liệu cục bộ sẽ bị xóa và bạn sẽ quay lại trang khởi tạo.'}
        confirmLabel={confirmAction?.type === 'archive' ? 'Lưu trữ' : 'Xóa hết'} cancelLabel="Hủy" tone="danger"
        onConfirm={() => void handleConfirm()} onCancel={() => setConfirmAction(null)} />
    </div>
  );
}
