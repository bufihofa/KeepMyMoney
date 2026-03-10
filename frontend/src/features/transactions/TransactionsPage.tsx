import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconGlyph } from '../../components/ui/IconGlyph';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { deleteTransaction } from '../../db/operations';
import { buildCategoryLabelMap, buildWalletLabelMap, groupTransactionsByDay, sortTransactionsDescending, transactionMatchesSearch } from '../../domain/analytics';
import { formatCurrency, formatRelativeDate } from '../../domain/format';
import { useAppData } from '../../hooks/useAppData';
import { useUIStore } from '../../stores/uiStore';

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] } }),
};

export function TransactionsPage() {
  const data = useAppData();
  const openTransactionSheet = useUIStore((state) => state.openTransactionSheet);
  const addToast = useUIStore((state) => state.addToast);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [walletFilter, setWalletFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const categoryMap = useMemo(() => buildCategoryLabelMap(data.categories), [data.categories]);
  const walletMap = useMemo(() => buildWalletLabelMap(data.wallets), [data.wallets]);

  const filteredTransactions = useMemo(() => {
    return sortTransactionsDescending(data.transactions).filter((transaction) => {
      if (transaction.deletedAt) return false;
      if (typeFilter !== 'all' && transaction.type !== typeFilter) return false;
      if (walletFilter !== 'all' && transaction.walletId !== walletFilter) return false;
      if (categoryFilter !== 'all' && transaction.categoryId !== categoryFilter) return false;
      return transactionMatchesSearch(transaction, search, walletMap, categoryMap);
    });
  }, [categoryFilter, categoryMap, data.transactions, search, typeFilter, walletFilter, walletMap]);

  const grouped = useMemo(() => groupTransactionsByDay(filteredTransactions), [filteredTransactions]);
  const income = filteredTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expense = filteredTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteTransaction(deleteTarget);
    addToast({ title: 'Đã xóa giao dịch', tone: 'success' });
    setDeleteTarget(null);
  };

  const typeFilters = [
    { value: 'all' as const, label: 'Tất cả' },
    { value: 'expense' as const, label: 'Chi tiêu' },
    { value: 'income' as const, label: 'Thu nhập' },
    { value: 'transfer' as const, label: 'Chuyển' },
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
          <IconGlyph name="plus" size="sm" /> Thêm
        </button>
      </header>

      <section className="panel">
        <div className="toolbar-grid">
          <label className="search-field">
            <IconGlyph name="search" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm ghi chú, ví, danh mục..." />
          </label>
          <div className="chip-row">
            {typeFilters.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`chip-button${typeFilter === f.value ? ' chip-button--active' : ''}`}
                onClick={() => setTypeFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="filter-row">
            <select value={walletFilter} onChange={(event) => setWalletFilter(event.target.value)}>
              <option value="all">Tất cả ví</option>
              {data.wallets.filter((wallet) => !wallet.isArchived).map((wallet) => (
                <option key={wallet.id} value={wallet.id}>{wallet.name}</option>
              ))}
            </select>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">Tất cả danh mục</option>
              {data.categories.filter((category) => !category.isHidden).map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="summary-strip">
          <div><span>Kết quả</span><strong>{filteredTransactions.length}</strong></div>
          <div><span>Thu nhập</span><strong>{formatCurrency(income, data.preferences.currency)}</strong></div>
          <div><span>Chi tiêu</span><strong>{formatCurrency(expense, data.preferences.currency)}</strong></div>
        </div>
      </section>

      {grouped.length > 0 ? (
        <div className="stack-list">
          {grouped.map((group) => (
            <section key={group.date} className="panel panel--dense">
              <div className="panel__header panel__header--compact">
                <h2>{formatRelativeDate(group.date)}</h2>
              </div>
              <div className="stack-list">
                {group.items.map((transaction, index) => {
                  const category = transaction.categoryId ? categoryMap.get(transaction.categoryId) : undefined;
                  const wallet = walletMap.get(transaction.walletId);
                  const amountTone = transaction.type === 'income' ? 'positive' : transaction.type === 'expense' ? 'negative' : 'neutral';
                  return (
                    <motion.article
                      key={transaction.id}
                      className="transaction-row transaction-row--card"
                      custom={index}
                      initial="hidden"
                      animate="show"
                      variants={staggerItem}
                    >
                      <button type="button" className="transaction-row__main" onClick={() => openTransactionSheet(transaction)}>
                        <div className="transaction-row__icon" style={{ background: category?.color ?? '#0d9488' }}>
                          <IconGlyph name={category?.icon ?? (transaction.type === 'transfer' ? 'transfer' : 'wallet')} size="sm" />
                        </div>
                        <div className="transaction-row__content">
                          <strong>{category?.name ?? (transaction.type === 'transfer' ? 'Chuyển khoản' : 'Giao dịch')}</strong>
                          <span>{wallet?.name ?? 'Ví không xác định'}{transaction.note ? ` · ${transaction.note}` : ''}</span>
                        </div>
                        <strong className={`amount amount--${amountTone}`}>{formatCurrency(transaction.amount, data.preferences.currency)}</strong>
                      </button>
                      <div className="inline-actions">
                        <button type="button" className="icon-button icon-button--ghost" onClick={() => openTransactionSheet({ ...transaction, id: '' } as typeof transaction)} aria-label="Nhân bản">
                          <IconGlyph name="copy" size="sm" />
                        </button>
                        <button type="button" className="icon-button icon-button--ghost" onClick={() => setDeleteTarget(transaction.id)} aria-label="Xóa">
                          <IconGlyph name="trash" size="sm" />
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState icon="list" title="Không tìm thấy giao dịch" description="Thử bỏ bộ lọc hoặc tạo giao dịch mới." action={<button type="button" className="primary-button" onClick={() => openTransactionSheet()}>Tạo giao dịch</button>} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa giao dịch?"
        description="Giao dịch này sẽ bị xóa vĩnh viễn. Bạn có chắc chắn không?"
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        tone="danger"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
