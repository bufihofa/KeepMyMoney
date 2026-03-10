import { useMemo } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { Area, ComposedChart, Line, LineChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { format, parseISO, subMonths } from 'date-fns';
import { PERIOD_PRESETS } from '../../db/defaults';
import { buildCategorySpend, buildDailyCashflow, buildWalletDistribution, filterTransactionsByRange, findLargestTransaction, sumTransactions } from '../../domain/analytics';
import { formatCurrency, formatCompactCurrency, getDateRange } from '../../domain/format';
import type { CategoryRecord, TransactionRecord } from '../../domain/models';
import { useAppData } from '../../hooks/useAppData';
import { shouldReduceMotion } from '../../lib/performance';
import { useUIStore } from '../../stores/uiStore';

const presetLabels: Record<string, string> = { week: 'Tuần', month: 'Tháng', quarter: 'Quý', year: 'Năm', all: 'Tất cả' };
const defaultTooltipStyle = {
  background: 'rgba(15,23,42,0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
};

const defaultTooltipItemStyle = {
  color: '#fff',
  fontWeight: 600,
  fontSize: '13px',
};

function axisCurrencyTick(val: number) {
  if (val >= 1_000_000_000) {
    return `${(val / 1_000_000_000).toFixed(1)}Ty`;
  }
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(0)}Tr`;
  }
  if (val >= 1_000) {
    return `${Math.round(val / 1_000)}K`;
  }
  return `${val}`;
}

function buildAccumulatedNet(
  points: Array<{ label: string; net: number }>,
) {
  let running = 0;
  return points.map((point) => {
    running += point.net;
    return {
      label: point.label,
      net: point.net,
      accumulated: running,
    };
  });
}

function buildMonthlyIncomeExpense(
  transactions: TransactionRecord[],
  monthCount = 6,
) {
  const monthMeta = Array.from({ length: monthCount }, (_, index) => {
    const monthDate = subMonths(new Date(), monthCount - 1 - index);
    const key = format(monthDate, 'yyyy-MM');
    return {
      key,
      label: format(monthDate, 'MM/yy'),
    };
  });

  const totals = new Map(monthMeta.map((item) => [item.key, { income: 0, expense: 0 }]));
  for (const transaction of transactions) {
    if (transaction.deletedAt) {
      continue;
    }
    const monthKey = transaction.occurredAt.slice(0, 7);
    const bucket = totals.get(monthKey);
    if (!bucket) {
      continue;
    }
    if (transaction.type === 'income') {
      bucket.income += transaction.amount;
    }
    if (transaction.type === 'expense') {
      bucket.expense += transaction.amount;
    }
  }

  return monthMeta.map((item) => {
    const value = totals.get(item.key) ?? { income: 0, expense: 0 };
    return {
      label: item.label,
      income: value.income,
      expense: value.expense,
      net: value.income - value.expense,
    };
  });
}

function buildWeekdaySpend(
  transactions: TransactionRecord[],
) {
  const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const totals = [0, 0, 0, 0, 0, 0, 0];

  for (const transaction of transactions) {
    if (transaction.deletedAt || transaction.type !== 'expense') {
      continue;
    }
    const dayIndex = parseISO(transaction.occurredAt).getDay();
    totals[dayIndex] += transaction.amount;
  }

  return labels.map((label, index) => ({ label, expense: totals[index] }));
}

function buildExpenseMovingAverage(points: Array<{ label: string; expense: number }>) {
  return points.map((point, index) => {
    const from = Math.max(0, index - 6);
    const window = points.slice(from, index + 1);
    const average = window.length === 0 ? 0 : window.reduce((sum, item) => sum + item.expense, 0) / window.length;
    return {
      label: point.label,
      expense: point.expense,
      avg7: average,
    };
  });
}

function buildCategoryPareto(cats: Array<{ name: string; total: number }>) {
  const top = cats.slice(0, 8);
  const total = top.reduce((sum, item) => sum + item.total, 0);
  let cumulative = 0;
  return top.map((item) => {
    cumulative += item.total;
    return {
      name: item.name,
      total: item.total,
      cumulativePct: total === 0 ? 0 : (cumulative / total) * 100,
    };
  });
}

function buildTopExpenseTransactions(transactions: TransactionRecord[], categories: CategoryRecord[]) {
  const categoryMap = new Map(categories.map((item) => [item.id, item.name]));
  return transactions
    .filter((transaction) => transaction.type === 'expense' && !transaction.deletedAt)
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 8)
    .map((transaction) => {
      const categoryLabel = transaction.categoryId ? categoryMap.get(transaction.categoryId) ?? 'Khác' : 'Không danh mục';
      const dateLabel = format(parseISO(transaction.occurredAt), 'dd/MM');
      return {
        label: `${categoryLabel} ${dateLabel}`,
        amount: transaction.amount,
      };
    });
}

function buildExpenseAmountBuckets(transactions: TransactionRecord[]) {
  const buckets = [
    { label: '<100k', min: 0, max: 100_000 },
    { label: '100-300k', min: 100_000, max: 300_000 },
    { label: '300-700k', min: 300_000, max: 700_000 },
    { label: '700k-1.5M', min: 700_000, max: 1_500_000 },
    { label: '>1.5M', min: 1_500_000, max: Number.POSITIVE_INFINITY },
  ];

  return buckets.map((bucket) => {
    const count = transactions.filter(
      (transaction) =>
        transaction.type === 'expense' &&
        !transaction.deletedAt &&
        transaction.amount >= bucket.min &&
        transaction.amount < bucket.max,
    ).length;
    return {
      label: bucket.label,
      count,
    };
  });
}

function buildMonthlyRunRate(transactions: TransactionRecord[], monthCount = 12) {
  const months = Array.from({ length: monthCount }, (_, index) => {
    const monthDate = subMonths(new Date(), monthCount - 1 - index);
    const key = format(monthDate, 'yyyy-MM');
    return {
      key,
      label: format(monthDate, 'MM/yy'),
      income: 0,
      expense: 0,
    };
  });

  const map = new Map(months.map((month) => [month.key, month]));
  for (const transaction of transactions) {
    if (transaction.deletedAt) {
      continue;
    }
    const key = transaction.occurredAt.slice(0, 7);
    const item = map.get(key);
    if (!item) {
      continue;
    }
    if (transaction.type === 'income') {
      item.income += transaction.amount;
    }
    if (transaction.type === 'expense') {
      item.expense += transaction.amount;
    }
  }

  return months.map((month) => {
    const net = month.income - month.expense;
    return {
      label: month.label,
      net,
      savingsRate: month.income > 0 ? (net / month.income) * 100 : 0,
    };
  });
}

export function InsightsPage() {
  const data = useAppData();
  const periodPreset = useUIStore((s) => s.periodPreset);
  const setPeriodPreset = useUIStore((s) => s.setPeriodPreset);
  const reduceMotion = shouldReduceMotion();
  const range = useMemo(() => getDateRange(periodPreset, data.preferences.weekStart), [periodPreset, data.preferences.weekStart]);
  const txns = useMemo(() => filterTransactionsByRange(data.transactions, range), [data.transactions, range]);
  const cats = useMemo(() => buildCategorySpend(txns, data.categories).slice(0, 6), [txns, data.categories]);
  const cashflow = useMemo(() => buildDailyCashflow(txns, range), [txns, range]);
  const wallets = useMemo(() => buildWalletDistribution(data.wallets), [data.wallets]);
  const largest = useMemo(() => findLargestTransaction(txns), [txns]);
  const totalIncome = useMemo(() => sumTransactions(txns, 'income'), [txns]);
  const totalExpense = useMemo(() => sumTransactions(txns, 'expense'), [txns]);
  const accumulated = useMemo(() => buildAccumulatedNet(cashflow), [cashflow]);
  const monthly = useMemo(() => buildMonthlyIncomeExpense(data.transactions, 6), [data.transactions]);
  const weekdaySpend = useMemo(() => buildWeekdaySpend(txns), [txns]);
  const movingExpense = useMemo(() => buildExpenseMovingAverage(cashflow), [cashflow]);
  const pareto = useMemo(() => buildCategoryPareto(cats), [cats]);
  const topExpenses = useMemo(() => buildTopExpenseTransactions(txns, data.categories), [txns, data.categories]);
  const expenseBuckets = useMemo(() => buildExpenseAmountBuckets(txns), [txns]);
  const runRate = useMemo(() => buildMonthlyRunRate(data.transactions, 12), [data.transactions]);
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
          <strong><CountUp end={totalIncome} separator="." duration={reduceMotion ? 0 : 0.8} preserveValue /></strong>
          <small>{range.label}</small>
        </motion.article>
        <motion.article className="metric-card metric-card--negative" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <span><TrendingDown size={13} /> Chi tiêu</span>
          <strong><CountUp end={totalExpense} separator="." duration={reduceMotion ? 0 : 0.8} preserveValue /></strong>
          <small>{range.label}</small>
        </motion.article>
        <motion.article className="metric-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <span><Shield size={13} /> Tỷ lệ tiết kiệm</span>
          <strong><CountUp end={Math.round(savingsRate * 100)} duration={reduceMotion ? 0 : 0.8} preserveValue />%</strong>
          <small>{largest ? `Lớn nhất: ${formatCurrency(largest.amount, data.preferences.currency)}` : 'Chưa có'}</small>
        </motion.article>
      </section>

      <div className="split-grid">
        <section className="panel">
          <div className="panel__header"><div><p className="eyebrow">Dòng tiền</p><h2>Xu hướng theo ngày</h2></div></div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={cashflow} margin={{ top: 16, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <filter id="glowIncome" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#10b981" floodOpacity="0.4" />
                  </filter>
                  <filter id="glowExpense" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#f97316" floodOpacity="0.4" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickMargin={12} />
                <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={axisCurrencyTick} />
                <Tooltip contentStyle={defaultTooltipStyle} itemStyle={defaultTooltipItemStyle} cursor={{ stroke: 'rgba(148,163,184,0.2)', strokeWidth: 2, strokeDasharray: '4 4' }} formatter={(value: number) => formatCurrency(value, data.preferences.currency)} />
                
                <Area type="monotone" dataKey="income" fillOpacity={1} fill="url(#colorIncome)" stroke="none" tooltipType="none" />
                <Area type="monotone" dataKey="expense" fillOpacity={1} fill="url(#colorExpense)" stroke="none" tooltipType="none" />
                
                <Line type="monotone" dataKey="income" name="Thu nhập" stroke="#10b981" strokeWidth={3.5} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} filter={reduceMotion ? undefined : "url(#glowIncome)"} />
                <Line type="monotone" dataKey="expense" name="Chi tiêu" stroke="#f97316" strokeWidth={3.5} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#f97316' }} filter={reduceMotion ? undefined : "url(#glowExpense)"} />
                <Line type="monotone" dataKey="net" name="Ròng" stroke="#3b82f6" strokeWidth={2.5} dot={false} strokeDasharray="6 4" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header"><div><p className="eyebrow">Danh mục</p><h2>Tập trung chi tiêu</h2></div></div>
          <div className="chart-box chart-box--split">
            <div style={{ position: 'relative', height: 260 }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', top: '-10px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chi tiêu</span>
                <strong style={{ fontSize: '1.25rem' }}>{formatCompactCurrency(totalExpense, data.preferences.currency)}</strong>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="pieShadowDeeper" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="8" stdDeviation="15" floodColor="#000" floodOpacity="0.12" />
                    </filter>
                  </defs>
                  <Tooltip formatter={(value: number) => formatCurrency(value, data.preferences.currency)} contentStyle={defaultTooltipStyle} itemStyle={defaultTooltipItemStyle} />
                  <Pie data={cats} dataKey="total" nameKey="name" innerRadius={80} outerRadius={108} cornerRadius={12} paddingAngle={5} stroke="none" filter={reduceMotion ? undefined : "url(#pieShadowDeeper)"}>
                    {cats.map((e) => <Cell key={e.categoryId} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="legend-list">{cats.map((e) => (
              <div key={e.categoryId} className="legend-row"><div className="legend-row__label"><span className="legend-dot" style={{ background: e.color }} /><span>{e.name}</span></div><strong>{formatCurrency(e.total, data.preferences.currency)}</strong></div>
            ))}</div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel__header"><div><p className="eyebrow">Phân bổ</p><h2>Số dư theo ví</h2></div></div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={wallets.length * 52 + 40}>
            <BarChart data={wallets} layout="vertical" margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.15)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={axisCurrencyTick} />
              <YAxis type="category" dataKey="name" stroke="var(--text-dim)" width={86} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'rgba(148,163,184,0.06)' }} formatter={(value: number) => formatCurrency(value, data.preferences.currency)} contentStyle={defaultTooltipStyle} itemStyle={defaultTooltipItemStyle} />
              <Bar dataKey="value" name="Số dư" radius={[0, 8, 8, 0]} barSize={24} background={{ fill: 'rgba(148,163,184,0.08)', radius: 8 }}>
                {wallets.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="split-grid">
        <section className="panel">
          <div className="panel__header"><div><p className="eyebrow">Lũy kế</p><h2>Đường tài sản ròng</h2></div></div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={accumulated} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickMargin={12} />
                <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={axisCurrencyTick} />
                <Tooltip formatter={(value: number) => formatCurrency(value, data.preferences.currency)} contentStyle={defaultTooltipStyle} itemStyle={defaultTooltipItemStyle} />
                <Area type="monotone" dataKey="accumulated" fill="rgba(59,130,246,0.15)" stroke="none" />
                <Line type="monotone" dataKey="accumulated" name="Lũy kế" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header"><div><p className="eyebrow">Nhịp chi tiêu</p><h2>Chi theo thứ</h2></div></div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weekdaySpend} margin={{ left: -14, right: 12, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={axisCurrencyTick} />
                <Tooltip formatter={(value: number) => formatCurrency(value, data.preferences.currency)} contentStyle={defaultTooltipStyle} itemStyle={defaultTooltipItemStyle} />
                <Bar dataKey="expense" name="Chi tiêu" fill="#f97316" radius={[8, 8, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel__header"><div><p className="eyebrow">So sánh</p><h2>Thu nhập và chi tiêu 6 tháng</h2></div></div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={monthly} margin={{ left: -16, right: 16, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={axisCurrencyTick} />
              <Tooltip formatter={(value: number) => formatCurrency(value, data.preferences.currency)} contentStyle={defaultTooltipStyle} itemStyle={defaultTooltipItemStyle} />
              <Bar dataKey="income" name="Thu nhập" fill="#10b981" radius={[6, 6, 0, 0]} barSize={18} />
              <Bar dataKey="expense" name="Chi tiêu" fill="#f97316" radius={[6, 6, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="split-grid">
        <section className="panel">
          <div className="panel__header"><div><p className="eyebrow">Ổn định</p><h2>Biến động chi tiêu và MA7</h2></div></div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={movingExpense} margin={{ top: 10, right: 14, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={axisCurrencyTick} />
                <Tooltip formatter={(value: number) => formatCurrency(value, data.preferences.currency)} contentStyle={defaultTooltipStyle} itemStyle={defaultTooltipItemStyle} />
                <Line type="monotone" dataKey="expense" name="Chi theo ngày" stroke="#fb923c" strokeWidth={2.4} dot={false} />
                <Line type="monotone" dataKey="avg7" name="Trung bình 7 ngày" stroke="#0ea5e9" strokeWidth={3.1} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header"><div><p className="eyebrow">Pareto</p><h2>Mức độ tập trung danh mục</h2></div></div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={pareto} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} interval={0} angle={-18} textAnchor="end" height={64} />
                <YAxis yAxisId="money" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={axisCurrencyTick} />
                <YAxis yAxisId="pct" orientation="right" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${Math.round(val)}%`} />
                <Tooltip formatter={(value: number, name: string) => name === 'Tích lũy' ? `${Math.round(value)}%` : formatCurrency(value, data.preferences.currency)} contentStyle={defaultTooltipStyle} itemStyle={defaultTooltipItemStyle} />
                <Bar yAxisId="money" dataKey="total" name="Chi tiêu" fill="#f97316" radius={[6, 6, 0, 0]} barSize={20} />
                <Line yAxisId="pct" type="monotone" dataKey="cumulativePct" name="Tích lũy" stroke="#3b82f6" strokeWidth={2.6} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="split-grid">
        <section className="panel">
          <div className="panel__header"><div><p className="eyebrow">Xu hướng dài hạn</p><h2>Run-rate ròng và tỷ lệ tiết kiệm 12 tháng</h2></div></div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={runRate} margin={{ top: 10, right: 18, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="money" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={axisCurrencyTick} />
                <YAxis yAxisId="pct" orientation="right" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${Math.round(val)}%`} />
                <Tooltip formatter={(value: number, name: string) => name === 'Tỷ lệ tiết kiệm' ? `${Math.round(value)}%` : formatCurrency(value, data.preferences.currency)} contentStyle={defaultTooltipStyle} itemStyle={defaultTooltipItemStyle} />
                <Bar yAxisId="money" dataKey="net" name="Dòng tiền" fill="#10b981" radius={[6, 6, 0, 0]} barSize={16} />
                <Line yAxisId="pct" type="monotone" dataKey="savingsRate" name="Tỷ lệ tiết kiệm" stroke="#6366f1" strokeWidth={2.8} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header"><div><p className="eyebrow">Cấu trúc giao dịch</p><h2>Phân bố mức chi tiêu</h2></div></div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={expenseBuckets} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={defaultTooltipStyle} itemStyle={defaultTooltipItemStyle} formatter={(value: number) => `${value} giao dịch`} />
                <Bar dataKey="count" name="Số giao dịch" fill="#0ea5e9" radius={[8, 8, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel__header"><div><p className="eyebrow">Rủi ro</p><h2>Top giao dịch chi lớn nhất trong kỳ</h2></div></div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={topExpenses.length * 42 + 40}>
            <BarChart data={topExpenses} layout="vertical" margin={{ left: 10, right: 20, top: 6, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.15)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={axisCurrencyTick} />
              <YAxis type="category" dataKey="label" stroke="var(--text-dim)" width={132} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value: number) => formatCurrency(value, data.preferences.currency)} contentStyle={defaultTooltipStyle} itemStyle={defaultTooltipItemStyle} />
              <Bar dataKey="amount" name="Giá trị" fill="#ef4444" radius={[0, 8, 8, 0]} barSize={22} background={{ fill: 'rgba(148,163,184,0.08)', radius: 8 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
