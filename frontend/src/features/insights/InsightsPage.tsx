import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { PERIOD_PRESETS } from '../../db/defaults';
import { buildCategorySpend, buildDailyCashflow, buildWalletDistribution, filterTransactionsByRange, findLargestTransaction, sumTransactions } from '../../domain/analytics';
import { formatCurrency, getDateRange } from '../../domain/format';
import { useAppData } from '../../hooks/useAppData';
import { useUIStore } from '../../stores/uiStore';

const presetLabels: Record<string, string> = { week: 'Tuần', month: 'Tháng', quarter: 'Quý', year: 'Năm', all: 'Tất cả' };

export function InsightsPage() {
  const data = useAppData();
  const periodPreset = useUIStore((s) => s.periodPreset);
  const setPeriodPreset = useUIStore((s) => s.setPeriodPreset);
  const range = getDateRange(periodPreset, data.preferences.weekStart);
  const txns = filterTransactionsByRange(data.transactions, range);
  const cats = buildCategorySpend(txns, data.categories).slice(0, 6);
  const cashflow = buildDailyCashflow(txns, range);
  const wallets = buildWalletDistribution(data.wallets);
  const largest = findLargestTransaction(txns);
  const totalIncome = sumTransactions(txns, 'income');
  const totalExpense = sumTransactions(txns, 'expense');
  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Phân tích</p>
          <h1>Thống kê tài chính</h1>
          <p className="section-copy">Hiểu rõ nơi tiền ra vào và xu hướng chi tiêu.</p>
        </div>
      </header>

      <div className="chip-row">
        {PERIOD_PRESETS.map((p) => <button key={p} type="button" className={`chip-button${periodPreset === p ? ' chip-button--active' : ''}`} onClick={() => setPeriodPreset(p)}>{presetLabels[p]}</button>)}
      </div>

      <section className="metric-grid metric-grid--tight">
        <motion.article className="metric-card metric-card--positive" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <span><TrendingUp size={13} /> Thu nhập</span>
          <strong><CountUp end={totalIncome} separator="." duration={0.8} preserveValue /></strong>
          <small>{range.label}</small>
        </motion.article>
        <motion.article className="metric-card metric-card--negative" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <span><TrendingDown size={13} /> Chi tiêu</span>
          <strong><CountUp end={totalExpense} separator="." duration={0.8} preserveValue /></strong>
          <small>{range.label}</small>
        </motion.article>
        <motion.article className="metric-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <span><Shield size={13} /> Tỷ lệ tiết kiệm</span>
          <strong><CountUp end={Math.round(savingsRate * 100)} duration={0.8} preserveValue />%</strong>
          <small>{largest ? `Lớn nhất: ${formatCurrency(largest.amount, data.preferences.currency)}` : 'Chưa có'}</small>
        </motion.article>
      </section>

      <div className="split-grid">
        <section className="panel">
          <div className="panel__header"><div><p className="eyebrow">Dòng tiền</p><h2>Xu hướng theo ngày</h2></div></div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={cashflow}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="label" stroke="var(--text-dim)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.92)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 13 }} />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="#f97316" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header"><div><p className="eyebrow">Danh mục</p><h2>Tập trung chi tiêu</h2></div></div>
          <div className="chart-box chart-box--split">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart><Pie data={cats} dataKey="total" innerRadius={42} outerRadius={68} paddingAngle={2}>
                {cats.map((e) => <Cell key={e.categoryId} fill={e.color} />)}
              </Pie><Tooltip contentStyle={{ background: 'rgba(15,23,42,0.92)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 13 }} /></PieChart>
            </ResponsiveContainer>
            <div className="legend-list">{cats.map((e) => (
              <div key={e.categoryId} className="legend-row"><div className="legend-row__label"><span className="legend-dot" style={{ background: e.color }} /><span>{e.name}</span></div><strong>{formatCurrency(e.total, data.preferences.currency)}</strong></div>
            ))}</div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel__header"><div><p className="eyebrow">Phân bổ</p><h2>Số dư theo ví</h2></div></div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={wallets.length * 50 + 36}>
            <BarChart data={wallets} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis type="number" stroke="var(--text-dim)" fontSize={11} tickLine={false} />
              <YAxis type="category" dataKey="name" stroke="var(--text-dim)" width={80} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.92)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 13 }} />
              <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={18}>{wallets.map((e) => <Cell key={e.name} fill={e.color} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
