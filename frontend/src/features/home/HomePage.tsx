import { motion } from 'framer-motion';
import { Pie, PieChart, ResponsiveContainer, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconGlyph } from '../../components/ui/IconGlyph';
import { useAppData } from '../../hooks/useAppData';
import { useUIStore } from '../../stores/uiStore';
import {
  buildBudgetProgress,
  buildCategoryLabelMap,
  buildCategorySpend,
  buildRecentTransactions,
  buildSummaryMetrics,
  buildWalletLabelMap,
  filterTransactionsByRange,
} from '../../domain/analytics';
import { formatCompactCurrency, formatCurrency, formatPercent, getDateRange, getPreviousDateRange } from '../../domain/format';
import { PERIOD_PRESETS } from '../../db/defaults';

export function HomePage() {
  const data = useAppData();
  const periodPreset = useUIStore((state) => state.periodPreset);
  const setPeriodPreset = useUIStore((state) => state.setPeriodPreset);
  const openTransactionSheet = useUIStore((state) => state.openTransactionSheet);

  const range = getDateRange(periodPreset, data.preferences.weekStart);
  const previousRange = getPreviousDateRange(periodPreset, data.preferences.weekStart);
  const currentTransactions = filterTransactionsByRange(data.transactions, range);
  const previousTransactions = filterTransactionsByRange(data.transactions, previousRange);
  const summary = buildSummaryMetrics(currentTransactions, previousTransactions);
  const budgetProgress = buildBudgetProgress(data.budgets, data.transactions, data.categories).slice(0, 3);
  const categorySpend = buildCategorySpend(currentTransactions, data.categories).slice(0, 5);
  const recentTransactions = buildRecentTransactions(currentTransactions, 6);
  const categoryMap = buildCategoryLabelMap(data.categories);
  const walletMap = buildWalletLabelMap(data.wallets);

  return (
    <div className="page page--home">
      <header className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Welcome back</h1>
          <p className="section-copy">A polished snapshot of your current cashflow and budget pace.</p>
        </div>
        <Link to="/settings" className="icon-button icon-button--ghost" aria-label="Open settings">
          <IconGlyph name="settings" />
        </Link>
      </header>

      <div className="chip-row">
        {PERIOD_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`chip-button${periodPreset === preset ? ' chip-button--active' : ''}`}
            onClick={() => setPeriodPreset(preset)}
          >
            {preset}
          </button>
        ))}
      </div>

      <motion.section className="hero-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="hero-card__heading">
          <div>
            <p className="eyebrow">{range.label}</p>
            <h2>Net cashflow {formatCompactCurrency(summary.net, data.preferences.currency)}</h2>
          </div>
          <button type="button" className="soft-button" onClick={() => openTransactionSheet()}>
            <IconGlyph name="plus" />
            Add transaction
          </button>
        </div>

        <div className="metric-grid">
          <article className="metric-card metric-card--positive">
            <span>Income</span>
            <strong>{formatCurrency(summary.income, data.preferences.currency)}</strong>
            <small>{formatPercent(summary.incomeChange)} vs previous</small>
          </article>
          <article className="metric-card metric-card--negative">
            <span>Expense</span>
            <strong>{formatCurrency(summary.expense, data.preferences.currency)}</strong>
            <small>{formatPercent(summary.expenseChange)} vs previous</small>
          </article>
          <article className="metric-card">
            <span>Net</span>
            <strong>{formatCurrency(summary.net, data.preferences.currency)}</strong>
            <small>{formatPercent(summary.netChange)} vs previous</small>
          </article>
        </div>
      </motion.section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Spending mix</p>
              <h2>Top categories</h2>
            </div>
          </div>
          {categorySpend.length > 0 ? (
            <div className="chart-card">
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={categorySpend} dataKey="total" innerRadius={58} outerRadius={84} paddingAngle={3}>
                      {categorySpend.map((entry) => (
                        <Cell key={entry.categoryId} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="legend-list">
                {categorySpend.map((entry) => (
                  <div key={entry.categoryId} className="legend-row">
                    <div className="legend-row__label">
                      <span className="legend-dot" style={{ background: entry.color }} />
                      <span>{entry.name}</span>
                    </div>
                    <strong>{formatCurrency(entry.total, data.preferences.currency)}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon="chart" title="No category data yet" description="Create a few expense transactions to unlock category insights." />
          )}
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Budget pulse</p>
              <h2>Current month</h2>
            </div>
            <Link to="/budgets" className="text-link">See all</Link>
          </div>
          {budgetProgress.length > 0 ? (
            <div className="stack-list">
              {budgetProgress.map((item) => (
                <article key={item.budget.id} className="budget-card">
                  <div className="budget-card__top">
                    <div>
                      <strong>{item.category?.name ?? 'Untitled budget'}</strong>
                      <span>{formatCurrency(item.spent, data.preferences.currency)} spent</span>
                    </div>
                    <span className={`status-pill status-pill--${item.status}`}>{item.status}</span>
                  </div>
                  <div className="progress-bar">
                    <span style={{ width: `${Math.min(item.usage, 1) * 100}%`, background: item.category?.color ?? '#14b8a6' }} />
                  </div>
                  <div className="budget-card__bottom">
                    <small>Remaining {formatCurrency(item.remaining, data.preferences.currency)}</small>
                    <small>Projected {formatCurrency(item.projected, data.preferences.currency)}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState icon="budget" title="No budgets yet" description="Create a monthly budget to monitor category spending in real time." action={<Link to="/budgets" className="soft-button">Create budget</Link>} />
          )}
        </article>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Recent activity</p>
            <h2>Latest transactions</h2>
          </div>
          <Link to="/transactions" className="text-link">Open ledger</Link>
        </div>
        {recentTransactions.length > 0 ? (
          <div className="stack-list">
            {recentTransactions.map((transaction) => {
              const category = transaction.categoryId ? categoryMap.get(transaction.categoryId) : undefined;
              const wallet = walletMap.get(transaction.walletId);
              const amountTone = transaction.type === 'income' ? 'positive' : transaction.type === 'expense' ? 'negative' : 'neutral';

              return (
                <button key={transaction.id} type="button" className="transaction-row" onClick={() => openTransactionSheet(transaction)}>
                  <div className="transaction-row__icon" style={{ background: category?.color ?? '#0f766e' }}>
                    <IconGlyph name={category?.icon ?? (transaction.type === 'transfer' ? 'transfer' : 'wallet')} />
                  </div>
                  <div className="transaction-row__content">
                    <strong>{category?.name ?? (transaction.type === 'transfer' ? 'Transfer' : 'Transaction')}</strong>
                    <span>{wallet?.name ?? 'Unknown wallet'}{transaction.note ? ` · ${transaction.note}` : ''}</span>
                  </div>
                  <strong className={`amount amount--${amountTone}`}>{formatCurrency(transaction.amount, data.preferences.currency)}</strong>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState icon="wallet" title="No transactions yet" description="Start by adding your first expense, income, or transfer." action={<button type="button" className="primary-button" onClick={() => openTransactionSheet()}>Add transaction</button>} />
        )}
      </section>
    </div>
  );
}
