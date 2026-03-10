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
import { formatCompactCurrency, formatCurrency, formatPercent, getDateRange, getGreeting, getPreviousDateRange } from '../../domain/format';
import { PERIOD_PRESETS } from '../../db/defaults';

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] } }),
};

export function HomePage() {
  const data = useAppData();
  const periodPreset = useUIStore((state) => state.periodPreset);
  const setPeriodPreset = useUIStore((state) => state.setPeriodPreset);
  const openTransactionSheet = useUIStore((state) => state.openTransactionSheet);
  const openWalletSheet = useUIStore((state) => state.openWalletSheet);

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
  const activeWallets = data.wallets.filter((w) => !w.isArchived);
  const totalBalance = activeWallets.reduce((sum, w) => sum + w.currentBalanceCache, 0);

  return (
    <div className="page page--home">
      {/* Greeting & Total Balance */}
      <header className="page-header">
        <div>
          <p className="eyebrow">{getGreeting()}</p>
          <h1>
            {formatCurrency(totalBalance, data.preferences.currency)}
          </h1>
          <p className="section-copy">Tổng số dư trên {activeWallets.length} ví hoạt động</p>
        </div>
        <Link to="/settings" className="icon-button icon-button--ghost" aria-label="Cài đặt">
          <IconGlyph name="settings" size="sm" />
        </Link>
      </header>

      {/* Wallet Carousel */}
      {activeWallets.length > 0 && (
        <div className="wallet-carousel">
          {activeWallets.map((wallet, index) => (
            <motion.button
              key={wallet.id}
              type="button"
              className="wallet-card"
              style={{ background: `linear-gradient(135deg, ${wallet.color}, ${wallet.color}cc)` }}
              onClick={() => openWalletSheet(wallet)}
              custom={index}
              initial="hidden"
              animate="show"
              variants={staggerItem}
            >
              <span className="wallet-card__name">{wallet.name}</span>
              <span className="wallet-card__balance">
                {formatCurrency(wallet.currentBalanceCache, wallet.currency)}
              </span>
              <span className="wallet-card__type">{wallet.type}</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Period Selector */}
      <div className="chip-row">
        {PERIOD_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`chip-button${periodPreset === preset ? ' chip-button--active' : ''}`}
            onClick={() => setPeriodPreset(preset)}
          >
            {preset === 'week' ? 'Tuần' : preset === 'month' ? 'Tháng' : preset === 'quarter' ? 'Quý' : preset === 'year' ? 'Năm' : 'Tất cả'}
          </button>
        ))}
      </div>

      {/* Hero Metrics */}
      <motion.section className="hero-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="hero-card__heading">
          <div>
            <p className="eyebrow">{range.label}</p>
            <h2>Dòng tiền ròng {formatCompactCurrency(summary.net, data.preferences.currency)}</h2>
          </div>
          <button type="button" className="soft-button" onClick={() => openTransactionSheet()}>
            <IconGlyph name="plus" size="sm" /> Thêm
          </button>
        </div>
        <div className="metric-grid">
          <article className="metric-card metric-card--positive">
            <span><IconGlyph name="trendUp" size="sm" /> Thu nhập</span>
            <strong>{formatCurrency(summary.income, data.preferences.currency)}</strong>
            <small>{formatPercent(summary.incomeChange)} so với kỳ trước</small>
          </article>
          <article className="metric-card metric-card--negative">
            <span><IconGlyph name="trendDown" size="sm" /> Chi tiêu</span>
            <strong>{formatCurrency(summary.expense, data.preferences.currency)}</strong>
            <small>{formatPercent(summary.expenseChange)} so với kỳ trước</small>
          </article>
          <article className="metric-card">
            <span><IconGlyph name="chart" size="sm" /> Ròng</span>
            <strong>{formatCurrency(summary.net, data.preferences.currency)}</strong>
            <small>{formatPercent(summary.netChange)} so với kỳ trước</small>
          </article>
        </div>
      </motion.section>

      {/* Category Spend + Budget Preview */}
      <section className="split-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Chi tiêu</p>
              <h2>Theo danh mục</h2>
            </div>
          </div>
          {categorySpend.length > 0 ? (
            <div className="chart-card">
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categorySpend} dataKey="total" innerRadius={52} outerRadius={76} paddingAngle={3}>
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
            <EmptyState icon="chart" title="Chưa có dữ liệu" description="Tạo vài khoản chi tiêu để xem phân tích danh mục." />
          )}
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Ngân sách</p>
              <h2>Tháng này</h2>
            </div>
            <Link to="/budgets" className="text-link">Xem tất cả</Link>
          </div>
          {budgetProgress.length > 0 ? (
            <div className="stack-list">
              {budgetProgress.map((item, index) => (
                <motion.article
                  key={item.budget.id}
                  className="budget-card"
                  custom={index}
                  initial="hidden"
                  animate="show"
                  variants={staggerItem}
                >
                  <div className="budget-card__top">
                    <div>
                      <strong>{item.category?.name ?? 'Ngân sách'}</strong>
                      <span>{formatCurrency(item.spent, data.preferences.currency)} đã chi</span>
                    </div>
                    <span className={`status-pill status-pill--${item.status}`}>{item.status}</span>
                  </div>
                  <div className="progress-bar">
                    <span style={{ width: `${Math.min(item.usage, 1) * 100}%`, background: item.category?.color ?? '#14b8a6' }} />
                  </div>
                  <div className="budget-card__bottom">
                    <small>Còn lại {formatCurrency(item.remaining, data.preferences.currency)}</small>
                    <small>Dự kiến {formatCurrency(item.projected, data.preferences.currency)}</small>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <EmptyState icon="budget" title="Chưa có ngân sách" description="Tạo ngân sách tháng để theo dõi chi tiêu theo danh mục." action={<Link to="/budgets" className="soft-button">Tạo ngân sách</Link>} />
          )}
        </article>
      </section>

      {/* Recent Transactions */}
      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Hoạt động gần đây</p>
            <h2>Giao dịch mới nhất</h2>
          </div>
          <Link to="/transactions" className="text-link">Xem tất cả</Link>
        </div>
        {recentTransactions.length > 0 ? (
          <div className="stack-list">
            {recentTransactions.map((transaction, index) => {
              const category = transaction.categoryId ? categoryMap.get(transaction.categoryId) : undefined;
              const wallet = walletMap.get(transaction.walletId);
              const amountTone = transaction.type === 'income' ? 'positive' : transaction.type === 'expense' ? 'negative' : 'neutral';

              return (
                <motion.button
                  key={transaction.id}
                  type="button"
                  className="transaction-row"
                  onClick={() => openTransactionSheet(transaction)}
                  custom={index}
                  initial="hidden"
                  animate="show"
                  variants={staggerItem}
                >
                  <div className="transaction-row__icon" style={{ background: category?.color ?? '#0d9488' }}>
                    <IconGlyph name={category?.icon ?? (transaction.type === 'transfer' ? 'transfer' : 'wallet')} size="sm" />
                  </div>
                  <div className="transaction-row__content">
                    <strong>{category?.name ?? (transaction.type === 'transfer' ? 'Chuyển khoản' : 'Giao dịch')}</strong>
                    <span>{wallet?.name ?? 'Ví không xác định'}{transaction.note ? ` · ${transaction.note}` : ''}</span>
                  </div>
                  <strong className={`amount amount--${amountTone}`}>{formatCurrency(transaction.amount, data.preferences.currency)}</strong>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <EmptyState icon="wallet" title="Chưa có giao dịch" description="Bắt đầu bằng cách thêm khoản chi tiêu, thu nhập hoặc chuyển khoản đầu tiên." action={<button type="button" className="primary-button" onClick={() => openTransactionSheet()}>Thêm giao dịch</button>} />
        )}
      </section>
    </div>
  );
}
