import { useMemo } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { Plus, Pencil } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, toMonthKey } from '../../domain/format';
import { buildBudgetProgress } from '../../domain/analytics';
import { useAppData } from '../../hooks/useAppData';
import { shouldReduceMotion } from '../../lib/performance';
import { useUIStore } from '../../stores/uiStore';

function toFiniteNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const stagger = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] } }),
};

export function BudgetsPage() {
  const data = useAppData();
  const openBudgetSheet = useUIStore((s) => s.openBudgetSheet);
  const reduceMotion = shouldReduceMotion();
  const monthKey = toMonthKey();
  const progress = useMemo(() => buildBudgetProgress(data.budgets, data.transactions, data.categories, monthKey), [data.budgets, data.transactions, data.categories, monthKey]);
  const totalBudget = useMemo(() => toFiniteNumber(progress.reduce((s, i) => s + toFiniteNumber(i.budget.limitAmount), 0)), [progress]);
  const totalSpent = useMemo(() => toFiniteNumber(progress.reduce((s, i) => s + toFiniteNumber(i.spent), 0)), [progress]);
  const totalProjected = useMemo(() => toFiniteNumber(progress.reduce((s, i) => s + toFiniteNumber(i.projected), 0)), [progress]);
  const usage = totalBudget > 0 ? toFiniteNumber(totalSpent / totalBudget) : 0;
  const remaining = totalBudget - totalSpent;
  const clampedUsage = Math.max(0, Math.min(usage, 1));
  const statusLabel: Record<string, string> = { safe: 'An toàn', watch: 'Cẩn thận', danger: 'Nguy hiểm', over: 'Vượt ngưỡng' };
  const overallStatus = usage >= 1 ? 'over' : usage >= 0.9 ? 'danger' : usage >= 0.7 ? 'watch' : 'safe';

  return (
    <div className="page budgets-page">
      <header className="page-header budgets-page__header">
        <div>
          <p className="eyebrow">Kiểm soát</p>
          <h1>Ngân sách</h1>
          <p className="section-copy">Giám sát hạn mức chi tiêu theo danh mục hàng tháng.</p>
        </div>
        <button type="button" className="primary-button budgets-page__create" onClick={() => openBudgetSheet()}>
          <Plus size={14} /> Tạo
        </button>
      </header>

      <section className="hero-card budgets-hero">
        <div className="budgets-hero__heading">
          <p className="eyebrow">Tháng {monthKey}</p>
          <span className={`status-pill status-pill--${overallStatus}`}>
            {overallStatus === 'over' ? 'Vượt' : overallStatus === 'danger' ? 'Nguy hiểm' : overallStatus === 'watch' ? 'Cẩn thận' : 'An toàn'}
          </span>
        </div>
        <div className="budgets-hero__kpi">
          <h2>Đã dùng <CountUp end={Math.round(usage * 100)} duration={reduceMotion ? 0 : 0.8} preserveValue />% ngân sách</h2>
          <p className="budgets-hero__subcopy">Đã chi {formatCurrency(totalSpent, data.preferences.currency)} trên tổng {formatCurrency(totalBudget, data.preferences.currency)}</p>
        </div>
        <div className="progress-bar progress-bar--large">
          <span style={{ width: `${clampedUsage * 100}%`, background: usage >= 0.9 ? '#ef4444' : usage >= 0.7 ? '#f59e0b' : '#10b981' }} />
        </div>
        <div className="budgets-hero__footer">
          <small>Dự kiến cuối tháng: {formatCurrency(totalProjected, data.preferences.currency)}</small>
          <small className={remaining < 0 ? 'status-text status-text--danger' : 'status-text status-text--safe'}>
            {remaining < 0 ? `Âm ${formatCurrency(Math.abs(remaining), data.preferences.currency)}` : `Còn ${formatCurrency(remaining, data.preferences.currency)}`}
          </small>
        </div>
        <div className="metric-grid budgets-hero__metrics">
          <article className="metric-card budget-metric-card">
            <span>Tổng</span>
            <strong>{formatCurrency(totalBudget, data.preferences.currency)}</strong>
          </article>
          <article className="metric-card metric-card--negative budget-metric-card">
            <span>Phát sinh</span>
            <strong>{formatCurrency(totalSpent, data.preferences.currency)}</strong>
          </article>
          <article className={`metric-card budget-metric-card${remaining < 0 ? ' metric-card--negative' : ' metric-card--positive'}`}>
            <span>Khả dụng</span>
            <strong>{formatCurrency(remaining, data.preferences.currency)}</strong>
            <small>{remaining < 0 ? 'Đã vượt hạn mức' : 'Số dư khả dụng'}</small>
          </article>
        </div>
      </section>

      {progress.length > 0 ? (
        <div className="stack-list budgets-list">
          {progress.map((item, i) => (
            <motion.article key={item.budget.id} className="panel budget-panel budget-item" custom={i} initial={reduceMotion ? false : 'hidden'} animate={reduceMotion ? undefined : 'show'} variants={reduceMotion ? undefined : stagger}>
              <div className="panel__header">
                <div>
                  <p className="eyebrow">{monthKey}</p>
                  <h2>{item.category?.name ?? 'Ngân sách'}</h2>
                </div>
                <button type="button" className="soft-button" onClick={() => openBudgetSheet(item.budget)}><Pencil size={13} /> Sửa</button>
              </div>
              <div className="budget-item__summary">
                <div className="budget-item__usage">
                  <strong>{Math.round(item.usage * 100)}%</strong>
                  <span>mức sử dụng hiện tại</span>
                </div>
                <span className={`status-pill status-pill--${item.status}`}>{statusLabel[item.status]}</span>
              </div>
              <div className="progress-bar progress-bar--large">
                <span style={{ width: `${Math.min(item.usage, 1) * 100}%`, background: item.category?.color ?? '#10b981' }} />
              </div>
              <div className="budget-stats budget-item__stats-grid">
                <div><span>Đã chi</span><strong>{formatCurrency(item.spent, data.preferences.currency)}</strong></div>
                <div><span>Hạn mức</span><strong>{formatCurrency(item.budget.limitAmount, data.preferences.currency)}</strong></div>
                <div><span>Dự kiến</span><strong>{formatCurrency(item.projected, data.preferences.currency)}</strong></div>
                <div><span>Còn lại</span><strong className={item.remaining < 0 ? 'status-text status-text--danger' : 'status-text status-text--safe'}>{formatCurrency(item.remaining, data.preferences.currency)}</strong></div>
              </div>
            </motion.article>
          ))}
        </div>
      ) : <EmptyState icon="budget" title="Chưa có ngân sách" description="Tạo ngân sách hàng tháng đầu tiên để bắt đầu kiểm soát chi tiêu." action={<button type="button" className="primary-button" onClick={() => openBudgetSheet()}>Tạo ngân sách</button>} />}
    </div>
  );
}
