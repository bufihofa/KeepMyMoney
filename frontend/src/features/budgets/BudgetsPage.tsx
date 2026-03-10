import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Plus, Pencil } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, toMonthKey } from '../../domain/format';
import { buildBudgetProgress } from '../../domain/analytics';
import { useAppData } from '../../hooks/useAppData';
import { useUIStore } from '../../stores/uiStore';

const stagger = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] } }),
};

export function BudgetsPage() {
  const data = useAppData();
  const openBudgetSheet = useUIStore((s) => s.openBudgetSheet);
  const monthKey = toMonthKey();
  const progress = buildBudgetProgress(data.budgets, data.transactions, data.categories, monthKey);
  const totalBudget = progress.reduce((s, i) => s + i.budget.limitAmount, 0);
  const totalSpent = progress.reduce((s, i) => s + i.spent, 0);
  const usage = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const [listRef] = useAutoAnimate();
  const statusLabel: Record<string, string> = { safe: 'An toàn', watch: 'Cẩn thận', danger: 'Nguy hiểm', over: 'Vượt ngưỡng' };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Kiểm soát</p>
          <h1>Ngân sách</h1>
          <p className="section-copy">Giám sát hạn mức chi tiêu theo danh mục hàng tháng.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => openBudgetSheet()}>
          <Plus size={14} /> Tạo
        </button>
      </header>

      <section className="hero-card">
        <div className="hero-card__heading">
          <div>
            <p className="eyebrow">Tháng {monthKey}</p>
            <h2>Đã dùng <CountUp end={Math.round(usage * 100)} duration={0.8} preserveValue />% ngân sách</h2>
          </div>
          <span className={`status-pill status-pill--${usage >= 1 ? 'over' : usage >= 0.9 ? 'danger' : usage >= 0.7 ? 'watch' : 'safe'}`}>
            {usage >= 1 ? 'Vượt' : usage >= 0.9 ? 'Nguy hiểm' : usage >= 0.7 ? 'Cẩn thận' : 'An toàn'}
          </span>
        </div>
        <div className="progress-bar progress-bar--large">
          <span style={{ width: `${Math.min(usage, 1) * 100}%`, background: usage >= 0.9 ? '#ef4444' : usage >= 0.7 ? '#f59e0b' : '#10b981' }} />
        </div>
        <div className="metric-grid">
          <article className="metric-card"><span>Tổng ngân sách</span><strong><CountUp end={totalBudget} separator="." duration={0.8} preserveValue /></strong></article>
          <article className="metric-card metric-card--negative"><span>Đã chi</span><strong><CountUp end={totalSpent} separator="." duration={0.8} preserveValue /></strong></article>
          <article className="metric-card metric-card--positive"><span>Còn lại</span><strong><CountUp end={totalBudget - totalSpent} separator="." duration={0.8} preserveValue /></strong></article>
        </div>
      </section>

      {progress.length > 0 ? (
        <div className="stack-list" ref={listRef}>
          {progress.map((item, i) => (
            <motion.article key={item.budget.id} className="panel budget-panel" custom={i} initial="hidden" animate="show" variants={stagger}>
              <div className="panel__header">
                <div><p className="eyebrow">{monthKey}</p><h2>{item.category?.name ?? 'Ngân sách'}</h2></div>
                <button type="button" className="soft-button" onClick={() => openBudgetSheet(item.budget)}><Pencil size={13} /> Sửa</button>
              </div>
              <div className="progress-bar progress-bar--large">
                <span style={{ width: `${Math.min(item.usage, 1) * 100}%`, background: item.category?.color ?? '#10b981' }} />
              </div>
              <div className="budget-stats">
                <div><span>Đã chi</span><strong>{formatCurrency(item.spent, data.preferences.currency)}</strong></div>
                <div><span>Hạn mức</span><strong>{formatCurrency(item.budget.limitAmount, data.preferences.currency)}</strong></div>
                <div><span>Dự kiến</span><strong>{formatCurrency(item.projected, data.preferences.currency)}</strong></div>
                <div><span>Trạng thái</span><strong className={`status-text status-text--${item.status}`}>{statusLabel[item.status]}</strong></div>
              </div>
            </motion.article>
          ))}
        </div>
      ) : <EmptyState icon="budget" title="Chưa có ngân sách" description="Tạo ngân sách hàng tháng đầu tiên để bắt đầu kiểm soát chi tiêu." action={<button type="button" className="primary-button" onClick={() => openBudgetSheet()}>Tạo ngân sách</button>} />}
    </div>
  );
}
