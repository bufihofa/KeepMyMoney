import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, toMonthKey } from '../../domain/format';
import { buildBudgetProgress } from '../../domain/analytics';
import { useAppData } from '../../hooks/useAppData';
import { useUIStore } from '../../stores/uiStore';

export function BudgetsPage() {
  const data = useAppData();
  const openBudgetSheet = useUIStore((state) => state.openBudgetSheet);
  const monthKey = toMonthKey();
  const progress = buildBudgetProgress(data.budgets, data.transactions, data.categories, monthKey);
  const totalBudget = progress.reduce((sum, item) => sum + item.budget.limitAmount, 0);
  const totalSpent = progress.reduce((sum, item) => sum + item.spent, 0);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Control</p>
          <h1>Budgets</h1>
          <p className="section-copy">Monitor monthly category limits before they become a problem.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => openBudgetSheet()}>
          Create budget
        </button>
      </header>

      <section className="metric-grid metric-grid--tight">
        <article className="metric-card">
          <span>Total budget</span>
          <strong>{formatCurrency(totalBudget, data.preferences.currency)}</strong>
          <small>Month {monthKey}</small>
        </article>
        <article className="metric-card metric-card--negative">
          <span>Spent</span>
          <strong>{formatCurrency(totalSpent, data.preferences.currency)}</strong>
          <small>{progress.length} active budgets</small>
        </article>
        <article className="metric-card metric-card--positive">
          <span>Remaining</span>
          <strong>{formatCurrency(totalBudget - totalSpent, data.preferences.currency)}</strong>
          <small>Across all monthly budgets</small>
        </article>
      </section>

      {progress.length > 0 ? (
        <div className="stack-list">
          {progress.map((item) => (
            <article key={item.budget.id} className="panel budget-panel">
              <div className="panel__header">
                <div>
                  <p className="eyebrow">{monthKey}</p>
                  <h2>{item.category?.name ?? 'Budget'}</h2>
                </div>
                <button type="button" className="soft-button" onClick={() => openBudgetSheet(item.budget)}>
                  Edit
                </button>
              </div>
              <div className="progress-bar progress-bar--large">
                <span style={{ width: `${Math.min(item.usage, 1) * 100}%`, background: item.category?.color ?? '#14b8a6' }} />
              </div>
              <div className="budget-stats">
                <div>
                  <span>Spent</span>
                  <strong>{formatCurrency(item.spent, data.preferences.currency)}</strong>
                </div>
                <div>
                  <span>Limit</span>
                  <strong>{formatCurrency(item.budget.limitAmount, data.preferences.currency)}</strong>
                </div>
                <div>
                  <span>Projected</span>
                  <strong>{formatCurrency(item.projected, data.preferences.currency)}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong className={`status-text status-text--${item.status}`}>{item.status}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon="budget" title="No budgets yet" description="Create your first monthly budget to start tracking category burn rate." action={<button type="button" className="primary-button" onClick={() => openBudgetSheet()}>Create budget</button>} />
      )}
    </div>
  );
}
