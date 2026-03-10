import { motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PERIOD_PRESETS } from '../../db/defaults';
import { buildCategorySpend, buildDailyCashflow, buildWalletDistribution, filterTransactionsByRange, findLargestTransaction, sumTransactions } from '../../domain/analytics';
import { formatCurrency, getDateRange } from '../../domain/format';
import { useAppData } from '../../hooks/useAppData';
import { useUIStore } from '../../stores/uiStore';
import { IconGlyph } from '../../components/ui/IconGlyph';

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
  const totalIncome = sumTransactions(transactions, 'income');
  const totalExpense = sumTransactions(transactions, 'expense');
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) : 0;

  const presetLabels: Record<string, string> = { week: 'Tuần', month: 'Tháng', quarter: 'Quý', year: 'Năm', all: 'Tất cả' };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Phân tích</p>
          <h1>Thống kê tài chính</h1>
          <p className="section-copy">Hiểu rõ nơi tiền ra vào và xu hướng chi tiêu theo thời gian.</p>
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
            {presetLabels[preset] ?? preset}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <section className="metric-grid metric-grid--tight">
        <motion.article className="metric-card metric-card--positive" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <span><IconGlyph name="trendUp" size="sm" /> Thu nhập</span>
          <strong>{formatCurrency(totalIncome, data.preferences.currency)}</strong>
          <small>{range.label}</small>
        </motion.article>
        <motion.article className="metric-card metric-card--negative" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <span><IconGlyph name="trendDown" size="sm" /> Chi tiêu</span>
          <strong>{formatCurrency(totalExpense, data.preferences.currency)}</strong>
          <small>{range.label}</small>
        </motion.article>
        <motion.article className="metric-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <span><IconGlyph name="shield" size="sm" /> Tỷ lệ tiết kiệm</span>
          <strong>{Math.round(savingsRate * 100)}%</strong>
          <small>{largest ? `Lớn nhất: ${formatCurrency(largest.amount, data.preferences.currency)}` : 'Chưa có dữ liệu'}</small>
        </motion.article>
      </section>

      <div className="split-grid">
        {/* Income vs Expense Trend */}
        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Dòng tiền</p>
              <h2>Xu hướng theo ngày</h2>
            </div>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={cashflow}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="label" stroke="var(--text-dim)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(15,23,42,0.92)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 13 }}
                  labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                />
                <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="#f97316" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Category Breakdown */}
        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Danh mục</p>
              <h2>Tập trung chi tiêu</h2>
            </div>
          </div>
          <div className="chart-box chart-box--split">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categorySpend} dataKey="total" innerRadius={44} outerRadius={70} paddingAngle={2}>
                  {categorySpend.map((entry) => (
                    <Cell key={entry.categoryId} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'rgba(15,23,42,0.92)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 13 }}
                />
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

      {/* Wallet Distribution */}
      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Phân bổ</p>
            <h2>Số dư theo ví</h2>
          </div>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={wallets.length * 52 + 40}>
            <BarChart data={wallets} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis type="number" stroke="var(--text-dim)" fontSize={11} tickLine={false} />
              <YAxis type="category" dataKey="name" stroke="var(--text-dim)" width={80} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'rgba(15,23,42,0.92)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 13 }}
              />
              <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={20}>
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
