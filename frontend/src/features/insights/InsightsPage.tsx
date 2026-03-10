import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PERIOD_PRESETS } from '../../db/defaults';
import { buildCategorySpend, buildDailyCashflow, buildWalletDistribution, filterTransactionsByRange, findLargestTransaction, sumTransactions } from '../../domain/analytics';
import { formatCurrency, getDateRange } from '../../domain/format';
import { useAppData } from '../../hooks/useAppData';
import { useUIStore } from '../../stores/uiStore';

export function InsightsPage() {
  const data = useAppData();
  const periodPreset = useUIStore((state) => state.periodPreset);
  const setPeriodPreset = useUIStore((state) => state.setPeriodPreset);
  const range = getDateRange(periodPreset, data.preferences.weekStart);
  const transactions = filterTransactionsByRange(data.transactions, range);
  const categorySpend = buildCategorySpend(transactions, data.categories).slice(0, 6);
  const cashflow = buildDailyCashflow(transactions, range);
  const wallets = buildWalletDistribution(data.wallets);
  const largest = findLargestTransaction(transactions);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Analysis</p>
          <h1>Insights</h1>
          <p className="section-copy">Understand where money goes and how your current period compares over time.</p>
        </div>
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

      <section className="metric-grid metric-grid--tight">
        <article className="metric-card metric-card--positive">
          <span>Income</span>
          <strong>{formatCurrency(sumTransactions(transactions, 'income'), data.preferences.currency)}</strong>
          <small>{range.label}</small>
        </article>
        <article className="metric-card metric-card--negative">
          <span>Expense</span>
          <strong>{formatCurrency(sumTransactions(transactions, 'expense'), data.preferences.currency)}</strong>
          <small>{range.label}</small>
        </article>
        <article className="metric-card">
          <span>Largest entry</span>
          <strong>{largest ? formatCurrency(largest.amount, data.preferences.currency) : '-'}</strong>
          <small>{largest?.note || 'No data yet'}</small>
        </article>
      </section>

      <div className="split-grid">
        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Cashflow</p>
              <h2>Daily trend</h2>
            </div>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={cashflow}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="label" stroke="currentColor" />
                <YAxis stroke="currentColor" />
                <Tooltip />
                <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="#f97316" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Categories</p>
              <h2>Expense concentration</h2>
            </div>
          </div>
          <div className="chart-box chart-box--split">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categorySpend} dataKey="total" innerRadius={48} outerRadius={74}>
                  {categorySpend.map((entry) => (
                    <Cell key={entry.categoryId} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
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
        </section>
      </div>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Balances</p>
            <h2>Wallet distribution</h2>
          </div>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={wallets} layout="vertical" margin={{ left: 12, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
              <XAxis type="number" stroke="currentColor" />
              <YAxis type="category" dataKey="name" stroke="currentColor" width={90} />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                {wallets.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
