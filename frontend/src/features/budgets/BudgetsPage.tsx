import { motion } from 'framer-motion';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconGlyph } from '../../components/ui/IconGlyph';
import { formatCurrency, toMonthKey } from '../../domain/format';
import { buildBudgetProgress } from '../../domain/analytics';
import { useAppData } from '../../hooks/useAppData';
import { useUIStore } from '../../stores/uiStore';

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] } }),
};

export function BudgetsPage() {
  const data = useAppData();
  const openBudgetSheet = useUIStore((state) => state.openBudgetSheet);
  const monthKey = toMonthKey();
  const progress = buildBudgetProgress(data.budgets, data.transactions, data.categories, monthKey);
  const totalBudget = progress.reduce((sum, item) => sum + item.budget.limitAmount, 0);
  const totalSpent = progress.reduce((sum, item) => sum + item.spent, 0);
  const overallUsage = totalBudget > 0 ? totalSpent / totalBudget : 0;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Kiểm soát</p>
          <h1>Ngân sách</h1>
          <p className="section-copy">Giám sát hạn mức chi tiêu theo danh mục hàng tháng.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => openBudgetSheet()}>
          <IconGlyph name="plus" size="sm" /> Tạo
        </button>
      </header>

      {/* Overall Summary */}
      <section className="hero-card">
        <div className="hero-card__heading">
          <div>
            <p className="eyebrow">Tháng {monthKey}</p>
            <h2>
              Đã dùng {Math.round(overallUsage * 100)}% ngân sách
            </h2>
          </div>
          <span className={`status-pill status-pill--${overallUsage >= 1 ? 'over' : overallUsage >= 0.9 ? 'danger' : overallUsage >= 0.7 ? 'watch' : 'safe'}`}>
            {overallUsage >= 1 ? 'Vượt' : overallUsage >= 0.9 ? 'Nguy hiểm' : overallUsage >= 0.7 ? 'Cẩn thận' : 'An toàn'}
          </span>
        </div>
        <div className="progress-bar progress-bar--large">
          <span style={{ width: `${Math.min(overallUsage, 1) * 100}%`, background: overallUsage >= 0.9 ? '#ef4444' : overallUsage >= 0.7 ? '#f59e0b' : '#22c55e' }} />
        </div>
        <div className="metric-grid">
          <article className="metric-card">
            <span>Tổng ngân sách</span>
            <strong>{formatCurrency(totalBudget, data.preferences.currency)}</strong>
          </article>
          <article className="metric-card metric-card--negative">
            <span>Đã chi</span>
            <strong>{formatCurrency(totalSpent, data.preferences.currency)}</strong>
          </article>
          <article className="metric-card metric-card--positive">
            <span>Còn lại</span>
            <strong>{formatCurrency(totalBudget - totalSpent, data.preferences.currency)}</strong>
          </article>
        </div>
      </section>

      {/* Individual Budgets */}
      {progress.length > 0 ? (
        <div className="stack-list">
          {progress.map((item, index) => (
            <motion.article
              key={item.budget.id}
              className="panel budget-panel"
              custom={index}
              initial="hidden"
              animate="show"
              variants={staggerItem}
            >
              <div className="panel__header">
                <div>
                  <p className="eyebrow">{monthKey}</p>
                  <h2>{item.category?.name ?? 'Ngân sách'}</h2>
                </div>
                <button type="button" className="soft-button" onClick={() => openBudgetSheet(item.budget)}>
                  <IconGlyph name="edit" size="sm" /> Sửa
                </button>
              </div>
              <div className="progress-bar progress-bar--large">
                <span style={{ width: `${Math.min(item.usage, 1) * 100}%`, background: item.category?.color ?? '#14b8a6' }} />
              </div>
              <div className="budget-stats">
                <div>
                  <span>Đã chi</span>
                  <strong>{formatCurrency(item.spent, data.preferences.currency)}</strong>
                </div>
                <div>
                  <span>Hạn mức</span>
                  <strong>{formatCurrency(item.budget.limitAmount, data.preferences.currency)}</strong>
                </div>
                <div>
                  <span>Dự kiến</span>
                  <strong>{formatCurrency(item.projected, data.preferences.currency)}</strong>
                </div>
                <div>
                  <span>Trạng thái</span>
                  <strong className={`status-text status-text--${item.status}`}>
                    {item.status === 'safe' ? 'An toàn' : item.status === 'watch' ? 'Cẩn thận' : item.status === 'danger' ? 'Nguy hiểm' : 'Vượt ngưỡng'}
                  </strong>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <EmptyState icon="budget" title="Chưa có ngân sách" description="Tạo ngân sách hàng tháng đầu tiên để bắt đầu kiểm soát chi tiêu." action={<button type="button" className="primary-button" onClick={() => openBudgetSheet()}>Tạo ngân sách</button>} />
      )}
    </div>
  );
}
