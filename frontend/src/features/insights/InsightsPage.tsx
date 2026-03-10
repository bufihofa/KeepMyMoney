import { useMemo } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { Area, ComposedChart, Line, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { PERIOD_PRESETS } from '../../db/defaults';
import { buildCategorySpend, buildDailyCashflow, buildWalletDistribution, filterTransactionsByRange, findLargestTransaction, sumTransactions } from '../../domain/analytics';
import { formatCurrency, formatCompactCurrency, getDateRange } from '../../domain/format';
import { useAppData } from '../../hooks/useAppData';
import { shouldReduceMotion } from '../../lib/performance';
import { useUIStore } from '../../stores/uiStore';

const presetLabels: Record<string, string> = { week: 'Tuần', month: 'Tháng', quarter: 'Quý', year: 'Năm', all: 'Tất cả' };

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
                <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(0)}Tr` : val} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }} itemStyle={{ color: '#fff', fontWeight: 600, fontSize: '13px' }} cursor={{ stroke: 'rgba(148,163,184,0.2)', strokeWidth: 2, strokeDasharray: '4 4' }} />
                
                <Area type="monotone" dataKey="income" fillOpacity={1} fill="url(#colorIncome)" stroke="none" tooltipType="none" />
                <Area type="monotone" dataKey="expense" fillOpacity={1} fill="url(#colorExpense)" stroke="none" tooltipType="none" />
                
                <Line type="monotone" dataKey="income" name="Thu nhập" stroke="#10b981" strokeWidth={3.5} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} filter={reduceMotion ? undefined : "url(#glowIncome)"} />
                <Line type="monotone" dataKey="expense" name="Chi tiêu" stroke="#f97316" strokeWidth={3.5} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#f97316' }} filter={reduceMotion ? undefined : "url(#glowExpense)"} />
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
                  <Tooltip formatter={(value: number) => formatCurrency(value, data.preferences.currency)} contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }} itemStyle={{ color: '#fff', fontWeight: 600, fontSize: '13px' }} />
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
              <XAxis type="number" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(0)}Tr` : val} />
              <YAxis type="category" dataKey="name" stroke="var(--text-dim)" width={86} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'rgba(148,163,184,0.06)' }} formatter={(value: number) => formatCurrency(value, data.preferences.currency)} contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }} itemStyle={{ color: '#fff', fontWeight: 600, fontSize: '13px' }} />
              <Bar dataKey="value" name="Số dư" radius={[0, 8, 8, 0]} barSize={24} background={{ fill: 'rgba(148,163,184,0.08)', radius: 8 }}>
                {wallets.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
