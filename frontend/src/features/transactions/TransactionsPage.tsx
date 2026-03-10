import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconGlyph } from '../../components/ui/IconGlyph';
import { deleteTransaction } from '../../db/operations';
import { buildCategoryLabelMap, buildWalletLabelMap, groupTransactionsByDay, sortTransactionsDescending, transactionMatchesSearch } from '../../domain/analytics';
import { formatCurrency, formatDate } from '../../domain/format';
import { useAppData } from '../../hooks/useAppData';
import { useUIStore } from '../../stores/uiStore';

export function TransactionsPage() {
  const data = useAppData();
  const openTransactionSheet = useUIStore((state) => state.openTransactionSheet);
  const addToast = useUIStore((state) => state.addToast);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [walletFilter, setWalletFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categoryMap = useMemo(() => buildCategoryLabelMap(data.categories), [data.categories]);
  const walletMap = useMemo(() => buildWalletLabelMap(data.wallets), [data.wallets]);

  const filteredTransactions = useMemo(() => {
    return sortTransactionsDescending(data.transactions).filter((transaction) => {
      if (transaction.deletedAt) {
        return false;
      }
      if (typeFilter !== 'all' && transaction.type !== typeFilter) {
        return false;
      }
      if (walletFilter !== 'all' && transaction.walletId !== walletFilter) {
        return false;
      }
      if (categoryFilter !== 'all' && transaction.categoryId !== categoryFilter) {
        return false;
      }
      return transactionMatchesSearch(transaction, search, walletMap, categoryMap);
    });
  }, [categoryFilter, categoryMap, data.transactions, search, typeFilter, walletFilter, walletMap]);

  const grouped = useMemo(() => groupTransactionsByDay(filteredTransactions), [filteredTransactions]);
  const income = filteredTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expense = filteredTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);

  const handleDelete = async (transactionId: string) => {
    if (!window.confirm('Delete this transaction?')) {
      return;
    }

    await deleteTransaction(transactionId);
    addToast({ title: 'Transaction removed', tone: 'success' });
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Ledger</p>
          <h1>Transactions</h1>
          <p className="section-copy">Search, filter, duplicate, and edit every entry in one place.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => openTransactionSheet()}>
          <IconGlyph name="plus" />
          New
        </button>
      </header>

      <section className="panel">
        <div className="toolbar-grid">
          <label className="search-field">
            <IconGlyph name="search" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search note, wallet, category..." />
          </label>
          <div className="filter-row">
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}>
              <option value="all">All types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </select>
            <select value={walletFilter} onChange={(event) => setWalletFilter(event.target.value)}>
              <option value="all">All wallets</option>
              {data.wallets.filter((wallet) => !wallet.isArchived).map((wallet) => (
                <option key={wallet.id} value={wallet.id}>{wallet.name}</option>
              ))}
            </select>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              {data.categories.filter((category) => !category.isHidden).map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="summary-strip">
          <div><span>Results</span><strong>{filteredTransactions.length}</strong></div>
          <div><span>Income</span><strong>{formatCurrency(income, data.preferences.currency)}</strong></div>
          <div><span>Expense</span><strong>{formatCurrency(expense, data.preferences.currency)}</strong></div>
        </div>
      </section>

      {grouped.length > 0 ? (
        <div className="stack-list">
          {grouped.map((group) => (
            <section key={group.date} className="panel panel--dense">
              <div className="panel__header panel__header--compact">
                <h2>{formatDate(group.date)}</h2>
              </div>
              <div className="stack-list">
                {group.items.map((transaction) => {
                  const category = transaction.categoryId ? categoryMap.get(transaction.categoryId) : undefined;
                  const wallet = walletMap.get(transaction.walletId);
                  const amountTone = transaction.type === 'income' ? 'positive' : transaction.type === 'expense' ? 'negative' : 'neutral';
                  return (
                    <article key={transaction.id} className="transaction-row transaction-row--card">
                      <button type="button" className="transaction-row__main" onClick={() => openTransactionSheet(transaction)}>
                        <div className="transaction-row__icon" style={{ background: category?.color ?? '#0f766e' }}>
                          <IconGlyph name={category?.icon ?? (transaction.type === 'transfer' ? 'transfer' : 'wallet')} />
                        </div>
                        <div className="transaction-row__content">
                          <strong>{category?.name ?? (transaction.type === 'transfer' ? 'Transfer' : 'Transaction')}</strong>
                          <span>{wallet?.name ?? 'Unknown wallet'}{transaction.note ? ` · ${transaction.note}` : ''}</span>
                        </div>
                        <strong className={`amount amount--${amountTone}`}>{formatCurrency(transaction.amount, data.preferences.currency)}</strong>
                      </button>
                      <div className="inline-actions">
                        <button
                          type="button"
                          className="icon-button icon-button--ghost"
                          onClick={() => openTransactionSheet({ ...transaction, id: '' } as typeof transaction)}
                          aria-label="Duplicate transaction"
                        >
                          <IconGlyph name="copy" />
                        </button>
                        <button type="button" className="icon-button icon-button--ghost" onClick={() => handleDelete(transaction.id)} aria-label="Delete transaction">
                          <IconGlyph name="trash" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState icon="list" title="No matching transactions" description="Try clearing filters or create a new transaction." action={<button type="button" className="primary-button" onClick={() => openTransactionSheet()}>Create transaction</button>} />
      )}
    </div>
  );
}
