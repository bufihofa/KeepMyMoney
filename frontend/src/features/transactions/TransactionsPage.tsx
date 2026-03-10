import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Search, Trash2 } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconGlyph } from '../../components/ui/IconGlyph';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { deleteTransaction } from '../../db/operations';
import { buildCategoryLabelMap, buildWalletLabelMap, groupTransactionsByDay, sortTransactionsDescending, transactionMatchesSearch } from '../../domain/analytics';
import { formatCurrency, formatRelativeDate } from '../../domain/format';
import { useAppData } from '../../hooks/useAppData';
import { shouldReduceMotion } from '../../lib/performance';
import { useUIStore } from '../../stores/uiStore';

const stagger = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] } }),
};

export function TransactionsPage() {
  const data = useAppData();
  const openTransactionSheet = useUIStore((s) => s.openTransactionSheet);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [walletFilter, setWalletFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const reduceMotion = shouldReduceMotion();

  const catMap = useMemo(() => buildCategoryLabelMap(data.categories), [data.categories]);
  const walMap = useMemo(() => buildWalletLabelMap(data.wallets), [data.wallets]);

  const filtered = useMemo(() => {
    const fromTimestamp = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTimestamp = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;

    return sortTransactionsDescending(data.transactions).filter((tx) => {
      if (tx.deletedAt) return false;
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (walletFilter !== 'all' && tx.walletId !== walletFilter) return false;
      if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;
      
      if (fromTimestamp !== null || toTimestamp !== null) {
        const txTimestamp = new Date(tx.occurredAt).getTime();
        if (fromTimestamp !== null && txTimestamp < fromTimestamp) return false;
        if (toTimestamp !== null && txTimestamp > toTimestamp) return false;
      }

      return transactionMatchesSearch(tx, search, walMap, catMap);
    });
  }, [categoryFilter, catMap, data.transactions, search, typeFilter, walletFilter, walMap, fromDate, toDate]);

  const grouped = useMemo(() => groupTransactionsByDay(filtered), [filtered]);
  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, tx) => {
        if (tx.type === 'income') acc.income += tx.amount;
        if (tx.type === 'expense') acc.expense += tx.amount;
        return acc;
      },
      { income: 0, expense: 0 },
    );
  }, [filtered]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteTransaction(deleteTarget);
    toast.success('Đã xóa giao dịch');
    setDeleteTarget(null);
  };

  const types = [
    { v: 'all' as const, l: 'Tất cả' },
    { v: 'expense' as const, l: 'Chi tiêu' },
    { v: 'income' as const, l: 'Thu nhập' },
    { v: 'transfer' as const, l: 'Chuyển' },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Sổ giao dịch</p>
          <h1>Giao dịch</h1>
          <p className="section-copy">Tìm kiếm, lọc và quản lý tất cả giao dịch.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => openTransactionSheet()}>
          <Plus size={14} /> Thêm
        </button>
      </header>

      <section className="panel">
        <div className="toolbar-grid">
          <label className="search-field">
            <Search size={18} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm ghi chú, ví, danh mục..." />
          </label>
          <div className="chip-row">
            {types.map((f) => (
              <button key={f.v} type="button" className={`chip-button${typeFilter === f.v ? ' chip-button--active' : ''}`} onClick={() => setTypeFilter(f.v)}>{f.l}</button>
            ))}
          </div>
          <div className="filter-row">
            <select value={walletFilter} onChange={(e) => setWalletFilter(e.target.value)} style={{ flex: 1, minWidth: '140px' }}>
              <option value="all">Tất cả ví</option>
              {data.wallets.filter((w) => !w.isArchived).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ flex: 1, minWidth: '140px' }}>
              <option value="all">Tất cả danh mục</option>
              {data.categories.filter((c) => !c.isHidden).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} title="Từ ngày" style={{ flex: 1, minWidth: '140px' }} />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} title="Đến ngày" style={{ flex: 1, minWidth: '140px' }} />
          </div>
        </div>
        <div className="summary-strip">
          <div><span>Kết quả</span><strong>{filtered.length}</strong></div>
          <div><span>Thu nhập</span><strong>{formatCurrency(totals.income, data.preferences.currency)}</strong></div>
          <div><span>Chi tiêu</span><strong>{formatCurrency(totals.expense, data.preferences.currency)}</strong></div>
        </div>
      </section>

      {grouped.length > 0 ? (
        <div className="stack-list">
          {grouped.map((g) => (
            <section key={g.date} className="panel panel--dense">
              <div className="panel__header panel__header--compact"><h2>{formatRelativeDate(g.date)}</h2></div>
              <div className="stack-list">
                {g.items.map((tx, i) => {
                  const cat = tx.categoryId ? catMap.get(tx.categoryId) : undefined;
                  const wal = walMap.get(tx.walletId);
                  const tone = tx.type === 'income' ? 'positive' : tx.type === 'expense' ? 'negative' : 'neutral';
                  return (
                    reduceMotion ? (
                      <article key={tx.id} className="transaction-row transaction-row--card">
                        <button type="button" className="transaction-row__main" onClick={() => openTransactionSheet(tx)}>
                          <div className="transaction-row__icon" style={{ background: cat?.color ?? '#0d9488' }}>
                            <IconGlyph name={cat?.icon ?? (tx.type === 'transfer' ? 'transfer' : 'wallet')} size="sm" />
                          </div>
                          <div className="transaction-row__content">
                            <strong>{cat?.name ?? (tx.type === 'transfer' ? 'Chuyển khoản' : 'Giao dịch')}</strong>
                            <span>{wal?.name ?? 'Ví'}{tx.note ? ` · ${tx.note}` : ''}</span>
                          </div>
                          <strong className={`amount amount--${tone}`}>{formatCurrency(tx.amount, data.preferences.currency)}</strong>
                        </button>
                        <button type="button" className="transaction-delete-button" onClick={() => setDeleteTarget(tx.id)} aria-label="Xóa"><Trash2 size={14} /></button>
                      </article>
                    ) : (
                      <motion.article key={tx.id} className="transaction-row transaction-row--card" custom={i} initial="hidden" animate="show" variants={stagger}>
                        <button type="button" className="transaction-row__main" onClick={() => openTransactionSheet(tx)}>
                          <div className="transaction-row__icon" style={{ background: cat?.color ?? '#0d9488' }}>
                            <IconGlyph name={cat?.icon ?? (tx.type === 'transfer' ? 'transfer' : 'wallet')} size="sm" />
                          </div>
                          <div className="transaction-row__content">
                            <strong>{cat?.name ?? (tx.type === 'transfer' ? 'Chuyển khoản' : 'Giao dịch')}</strong>
                            <span>{wal?.name ?? 'Ví'}{tx.note ? ` · ${tx.note}` : ''}</span>
                          </div>
                          <strong className={`amount amount--${tone}`}>{formatCurrency(tx.amount, data.preferences.currency)}</strong>
                        </button>
                        <button type="button" className="transaction-delete-button" onClick={() => setDeleteTarget(tx.id)} aria-label="Xóa"><Trash2 size={13} /></button>
                      </motion.article>
                    )
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : <EmptyState icon="list" title="Không tìm thấy giao dịch" description="Thử bỏ bộ lọc hoặc tạo giao dịch mới." action={<button type="button" className="primary-button" onClick={() => openTransactionSheet()}>Tạo giao dịch</button>} />}

      <ConfirmDialog open={!!deleteTarget} title="Xóa giao dịch?" description="Giao dịch này sẽ bị xóa vĩnh viễn. Bạn có chắc chắn không?" confirmLabel="Xóa" cancelLabel="Hủy" tone="danger" onConfirm={() => void handleDelete()} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
