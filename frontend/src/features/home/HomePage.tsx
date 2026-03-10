import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';
import CountUp from 'react-countup';
import { TrendingUp, TrendingDown, Activity, Settings, Plus, ArrowRight, Wallet, CreditCard, PiggyBank, Banknote, ChevronRight } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconGlyph } from '../../components/ui/IconGlyph';
import { useAppData } from '../../hooks/useAppData';
import { shouldReduceMotion } from '../../lib/performance';
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

const stagger = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }),
};

const walletTypeIcon: Record<string, typeof Wallet> = { cash: Banknote, bank: CreditCard, ewallet: Wallet, savings: PiggyBank, other: Wallet };
const presetLabels: Record<string, string> = { week: 'Tuần', month: 'Tháng', quarter: 'Quý', year: 'Năm', all: 'Tất cả' };
const walletTypeLabel: Record<string, string> = {
  cash: 'Tiền mặt',
  bank: 'Ngân hàng',
  ewallet: 'Ví điện tử',
  savings: 'Tiết kiệm',
  other: 'Khác',
};

function toFiniteNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function HomePage() {
  const data = useAppData();
  const periodPreset = useUIStore((s) => s.periodPreset);
  const setPeriodPreset = useUIStore((s) => s.setPeriodPreset);
  const openTransactionSheet = useUIStore((s) => s.openTransactionSheet);
  const openWalletSheet = useUIStore((s) => s.openWalletSheet);
  const reduceMotion = shouldReduceMotion();

  const range = useMemo(() => getDateRange(periodPreset, data.preferences.weekStart), [periodPreset, data.preferences.weekStart]);
  const prevRange = useMemo(() => getPreviousDateRange(periodPreset, data.preferences.weekStart), [periodPreset, data.preferences.weekStart]);
  const txns = useMemo(() => filterTransactionsByRange(data.transactions, range), [data.transactions, range]);
  const prevTxns = useMemo(() => filterTransactionsByRange(data.transactions, prevRange), [data.transactions, prevRange]);
  const summary = useMemo(() => buildSummaryMetrics(txns, prevTxns), [txns, prevTxns]);
  const budgets = useMemo(() => buildBudgetProgress(data.budgets, data.transactions, data.categories).slice(0, 3), [data.budgets, data.transactions, data.categories]);
  const cats = useMemo(() => buildCategorySpend(txns, data.categories).slice(0, 5), [txns, data.categories]);
  const recent = useMemo(() => buildRecentTransactions(txns, 6), [txns]);
  const catMap = useMemo(() => buildCategoryLabelMap(data.categories), [data.categories]);
  const walMap = useMemo(() => buildWalletLabelMap(data.wallets), [data.wallets]);
  const activeWallets = useMemo(() => data.wallets.filter((w) => !w.isArchived), [data.wallets]);
  const total = useMemo(() => toFiniteNumber(activeWallets.reduce((s, w) => s + toFiniteNumber(w.currentBalanceCache), 0)), [activeWallets]);
  const safeSummary = useMemo(() => ({
    income: toFiniteNumber(summary.income),
    expense: toFiniteNumber(summary.expense),
    net: toFiniteNumber(summary.net),
  }), [summary.income, summary.expense, summary.net]);

  return (
    <div className="page page--home">
      {/* Header */}
      <header className="page-header">
        <div>
          <p className="eyebrow">{getGreeting()}</p>
          <h1>
            <CountUp key={`home-total-${total}`} end={total} separator="." prefix={data.preferences.currency === 'VND' ? '₫' : '$'} duration={reduceMotion ? 0 : 1.2} preserveValue={false} />
          </h1>
          <p className="section-copy">Bạn đang quản lý {activeWallets.length} ví hoạt động</p>
        </div>
        <Link to="/settings" className="icon-button icon-button--ghost" aria-label="Cài đặt">
          <Settings size={16} />
        </Link>
      </header>

      {/* Wallet Carousel */}
      {activeWallets.length > 0 && (
        <div className="wallet-carousel">
          {activeWallets.map((wallet, i) => {
            const WIcon = walletTypeIcon[wallet.type] ?? Wallet;
            return (
              reduceMotion ? (
                <button key={wallet.id} type="button" className="wallet-card" style={{ background: `linear-gradient(135deg, ${wallet.color}, ${wallet.color}bb)` }} onClick={() => openWalletSheet(wallet)}>
                  <span className="wallet-card__name"><WIcon size={12} className="wallet-card__name-icon" />{wallet.name}</span>
                  <span className="wallet-card__balance">{formatCurrency(wallet.currentBalanceCache, wallet.currency)}</span>
                  <span className="wallet-card__type">{walletTypeLabel[wallet.type] ?? 'Khác'}</span>
                </button>
              ) : (
                <motion.button key={wallet.id} type="button" className="wallet-card"
                  style={{ background: `linear-gradient(135deg, ${wallet.color}, ${wallet.color}bb)` }}
                  onClick={() => openWalletSheet(wallet)} custom={i} initial="hidden" animate="show" variants={stagger}>
                  <span className="wallet-card__name"><WIcon size={12} className="wallet-card__name-icon" />{wallet.name}</span>
                  <span className="wallet-card__balance">{formatCurrency(wallet.currentBalanceCache, wallet.currency)}</span>
                  <span className="wallet-card__type">{walletTypeLabel[wallet.type] ?? 'Khác'}</span>
                </motion.button>
              )
            );
          })}
        </div>
      )}

      {/* Period */}
      <div className="chip-row">
        {PERIOD_PRESETS.map((p) => (
          <button key={p} type="button" className={`chip-button${periodPreset === p ? ' chip-button--active' : ''}`} onClick={() => setPeriodPreset(p)}>
            {presetLabels[p]}
          </button>
        ))}
      </div>

      {/* Hero Metrics */}
      <motion.section className="hero-card" initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={reduceMotion ? undefined : { delay: 0.1 }}>
        <div className="hero-card__heading">
          <div>
            <p className="eyebrow">{range.label}</p>
            <h2>{formatCompactCurrency(summary.net, data.preferences.currency)}</h2>
          </div>
        </div>
        <div className="metric-grid">
          <article className="metric-card metric-card--positive">
            <span><TrendingUp size={13} /> Thu nhập</span>
            <strong><CountUp key={`home-income-${safeSummary.income}`} end={safeSummary.income} duration={reduceMotion ? 0 : 0.8} preserveValue={false} formattingFn={(value) => formatCompactCurrency(value, data.preferences.currency)} /></strong>
            <small>{formatPercent(summary.incomeChange)} so với kỳ trước</small>
          </article>
          <article className="metric-card metric-card--negative">
            <span><TrendingDown size={13} /> Chi tiêu</span>
            <strong><CountUp key={`home-expense-${safeSummary.expense}`} end={safeSummary.expense} duration={reduceMotion ? 0 : 0.8} preserveValue={false} formattingFn={(value) => formatCompactCurrency(value, data.preferences.currency)} /></strong>
            <small>{formatPercent(summary.expenseChange)} so với kỳ trước</small>
          </article>
          <article className="metric-card metric-card--net">
            <span><Activity size={13} /> Ròng</span>
            <strong><CountUp key={`home-net-${safeSummary.net}`} end={safeSummary.net} duration={reduceMotion ? 0 : 0.8} preserveValue={false} formattingFn={(value) => formatCompactCurrency(value, data.preferences.currency)} /></strong>
            <small>{formatPercent(summary.netChange)} so với kỳ trước</small>
          </article>
        </div>
      </motion.section>

      {/* Categories + Budgets */}
      <section className="split-grid">
        <article className="panel">
          <div className="panel__header">
            <div><p className="eyebrow">Chi tiêu</p><h2>Theo danh mục</h2></div>
          </div>
          {cats.length > 0 ? (
            <div className="chart-card">
              <div className="donut-wrap" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', top: '-10px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Top {cats.length}</span>
                  <strong style={{ fontSize: '1.25rem' }}>{formatCompactCurrency(cats.reduce((s, c) => s + c.total, 0), data.preferences.currency)}</strong>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <defs>
                      <filter id="pieShadowDeeper" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="8" stdDeviation="15" floodColor="#000" floodOpacity="0.12" />
                      </filter>
                    </defs>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value, data.preferences.currency)} 
                      contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }} 
                      itemStyle={{ color: '#fff', fontWeight: 600, fontSize: '13px' }} 
                    />
                    <Pie data={cats} dataKey="total" nameKey="name" innerRadius={80} outerRadius={108} cornerRadius={12} paddingAngle={6} stroke="none" filter={reduceMotion ? undefined : "url(#pieShadowDeeper)"}>
                      {cats.map((e) => <Cell key={e.categoryId} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="legend-list">
                {cats.map((e) => (
                  <div key={e.categoryId} className="legend-row">
                    <div className="legend-row__label"><span className="legend-dot" style={{ background: e.color }} /><span>{e.name}</span></div>
                    <strong>{formatCurrency(e.total, data.preferences.currency)}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyState icon="chart" title="Chưa có dữ liệu" description="Tạo vài khoản chi tiêu để xem phân tích." />}
        </article>

        <article className="panel">
          <div className="panel__header">
            <div><p className="eyebrow">Ngân sách</p><h2>Tháng này</h2></div>
            <Link to="/budgets" className="text-link">Xem tất cả <ChevronRight size={14} /></Link>
          </div>
          {budgets.length > 0 ? (
            <div className="stack-list">
              {budgets.map((item, i) => (
                <motion.article key={item.budget.id} className="budget-card" custom={i} initial={reduceMotion ? false : 'hidden'} animate={reduceMotion ? undefined : 'show'} variants={reduceMotion ? undefined : stagger}>
                  <div className="budget-card__top">
                    <div><strong>{item.category?.name ?? 'Ngân sách'}</strong><span>{formatCurrency(item.spent, data.preferences.currency)} đã chi</span></div>
                    <span className={`status-pill status-pill--${item.status}`}>{item.status === 'safe' ? 'An toàn' : item.status === 'watch' ? 'Cẩn thận' : item.status === 'danger' ? 'Nguy hiểm' : 'Vượt'}</span>
                  </div>
                  <div className="progress-bar"><span style={{ width: `${Math.min(item.usage, 1) * 100}%`, background: item.category?.color ?? '#10b981' }} /></div>
                  <div className="budget-card__bottom"><small>Còn {formatCurrency(item.remaining, data.preferences.currency)}</small><small>Dự kiến {formatCurrency(item.projected, data.preferences.currency)}</small></div>
                </motion.article>
              ))}
            </div>
          ) : <EmptyState icon="budget" title="Chưa có ngân sách" description="Tạo ngân sách tháng." action={<Link to="/budgets" className="soft-button">Tạo ngân sách</Link>} />}
        </article>
      </section>

      {/* Recent Transactions */}
      <section className="panel">
        <div className="panel__header">
          <div><p className="eyebrow">Hoạt động gần đây</p><h2>Giao dịch mới nhất</h2></div>
          <Link to="/transactions" className="text-link">Xem tất cả <ChevronRight size={14} /></Link>
        </div>
        {recent.length > 0 ? (
            <div className="stack-list">
            {recent.map((tx, i) => {
              const cat = tx.categoryId ? catMap.get(tx.categoryId) : undefined;
              const wal = walMap.get(tx.walletId);
              const tone = tx.type === 'income' ? 'positive' : tx.type === 'expense' ? 'negative' : 'neutral';
              return (
                  <motion.button key={tx.id} type="button" className="transaction-row" onClick={() => openTransactionSheet(tx)} custom={i} initial={reduceMotion ? false : 'hidden'} animate={reduceMotion ? undefined : 'show'} variants={reduceMotion ? undefined : stagger}>
                  <div className="transaction-row__icon" style={{ background: cat?.color ?? '#0d9488' }}>
                    <IconGlyph name={cat?.icon ?? (tx.type === 'transfer' ? 'transfer' : 'wallet')} size="sm" />
                  </div>
                  <div className="transaction-row__content">
                    <strong>{cat?.name ?? (tx.type === 'transfer' ? 'Chuyển khoản' : 'Giao dịch')}</strong>
                    <span>{wal?.name ?? 'Ví'}{tx.note ? ` · ${tx.note}` : ''}</span>
                  </div>
                  <strong className={`amount amount--${tone}`}>{formatCurrency(tx.amount, data.preferences.currency)}</strong>
                </motion.button>
              );
            })}
          </div>
        ) : <EmptyState icon="wallet" title="Chưa có giao dịch" description="Bắt đầu bằng cách thêm khoản chi tiêu, thu nhập đầu tiên." action={<button type="button" className="primary-button" onClick={() => openTransactionSheet()}>Thêm giao dịch</button>} />}
      </section>
    </div>
  );
}
