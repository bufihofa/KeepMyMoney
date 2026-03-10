import { eachDayOfInterval, format, parseISO } from 'date-fns';
import type {
  BudgetProgress,
  BudgetRecord,
  CategoryRecord,
  CategorySpend,
  DailyCashflowPoint,
  DateRange,
  SummaryMetrics,
  TransactionRecord,
  WalletRecord,
} from './models';
import { getBudgetStatus } from '../lib/math';
import { isInRange, signedChange, toMonthKey } from './format';

function toFiniteNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getActiveTransactions(transactions: TransactionRecord[]) {
  return transactions.filter((transaction) => !transaction.deletedAt);
}

export function filterTransactionsByRange(transactions: TransactionRecord[], range: DateRange) {
  return getActiveTransactions(transactions).filter((transaction) => isInRange(transaction.occurredAt, range));
}

export function buildSummaryMetrics(current: TransactionRecord[], previous: TransactionRecord[]): SummaryMetrics {
  const income = sumTransactions(current, 'income');
  const expense = sumTransactions(current, 'expense');
  const previousIncome = sumTransactions(previous, 'income');
  const previousExpense = sumTransactions(previous, 'expense');
  const net = income - expense;
  const previousNet = previousIncome - previousExpense;

  return {
    income,
    expense,
    net,
    incomeChange: signedChange(income, previousIncome),
    expenseChange: signedChange(expense, previousExpense),
    netChange: signedChange(net, previousNet),
  };
}

export function sumTransactions(transactions: TransactionRecord[], type: 'income' | 'expense') {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + toFiniteNumber(transaction.amount), 0);
}

export function buildCategorySpend(transactions: TransactionRecord[], categories: CategoryRecord[]): CategorySpend[] {
  const expenseTransactions = transactions.filter((transaction) => transaction.type === 'expense' && transaction.categoryId);
  const total = expenseTransactions.reduce((sum, transaction) => sum + toFiniteNumber(transaction.amount), 0);
  const totals = new Map<string, number>();

  for (const transaction of expenseTransactions) {
    const key = transaction.categoryId!;
    totals.set(key, (totals.get(key) ?? 0) + toFiniteNumber(transaction.amount));
  }

  return categories
    .filter((category) => category.kind === 'expense' && totals.has(category.id))
    .map((category) => {
      const amount = totals.get(category.id) ?? 0;
      return {
        categoryId: category.id,
        name: category.name,
        color: category.color,
        total: amount,
        percentage: total === 0 ? 0 : amount / total,
      };
    })
    .sort((left, right) => right.total - left.total);
}

export function buildBudgetProgress(
  budgets: BudgetRecord[],
  transactions: TransactionRecord[],
  categories: CategoryRecord[],
  monthKey = toMonthKey(),
): BudgetProgress[] {
  return budgets
    .filter((budget) => budget.periodKey === monthKey)
    .map((budget) => {
      const spent = getActiveTransactions(transactions)
        .filter(
          (transaction) =>
            transaction.type === 'expense' &&
            transaction.categoryId === budget.categoryId &&
            transaction.occurredAt.startsWith(monthKey),
        )
        .reduce((sum, transaction) => sum + toFiniteNumber(transaction.amount), 0);

      const limitAmount = toFiniteNumber(budget.limitAmount);
      const usage = limitAmount > 0 ? spent / limitAmount : 0;
      const category = categories.find((item) => item.id === budget.categoryId);
      const now = new Date();
      const dayOfMonth = now.getDate();
      const projected = dayOfMonth === 0 ? spent : (spent / dayOfMonth) * 30;

      return {
        budget: {
          ...budget,
          limitAmount,
        },
        category,
        spent,
        remaining: limitAmount - spent,
        usage,
        projected,
        status: getBudgetStatus(usage),
      };
    })
    .sort((left, right) => right.usage - left.usage);
}

export function buildDailyCashflow(transactions: TransactionRecord[], range: DateRange): DailyCashflowPoint[] {
  if (!range.start || !range.end) {
    const grouped = new Map<string, DailyCashflowPoint>();
    for (const transaction of getActiveTransactions(transactions)) {
      const key = transaction.occurredAt.slice(0, 10);
      const point = grouped.get(key) ?? { label: key.slice(5), income: 0, expense: 0, net: 0 };
      if (transaction.type === 'income') {
        point.income += toFiniteNumber(transaction.amount);
      }
      if (transaction.type === 'expense') {
        point.expense += toFiniteNumber(transaction.amount);
      }
      point.net = point.income - point.expense;
      grouped.set(key, point);
    }

    return [...grouped.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-14)
      .map(([, value]) => value);
  }

  return eachDayOfInterval({ start: range.start, end: range.end }).map((day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayTransactions = transactions.filter((transaction) => !transaction.deletedAt && transaction.occurredAt.startsWith(dateKey));
    const income = dayTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + toFiniteNumber(transaction.amount), 0);
    const expense = dayTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + toFiniteNumber(transaction.amount), 0);

    return {
      label: format(day, 'dd MMM'),
      income,
      expense,
      net: income - expense,
    };
  });
}

export function groupTransactionsByDay(transactions: TransactionRecord[]) {
  const groups = new Map<string, TransactionRecord[]>();
  const ordered = [...getActiveTransactions(transactions)].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));

  for (const transaction of ordered) {
    const key = transaction.occurredAt.slice(0, 10);
    groups.set(key, [...(groups.get(key) ?? []), transaction]);
  }

  return [...groups.entries()].map(([date, items]) => ({ date, items }));
}

export function buildWalletDistribution(wallets: WalletRecord[]) {
  return wallets
    .filter((wallet) => !wallet.isArchived)
    .map((wallet) => ({
      name: wallet.name,
      value: toFiniteNumber(wallet.currentBalanceCache),
      color: wallet.color,
    }))
    .sort((left, right) => right.value - left.value);
}

export function findLargestTransaction(transactions: TransactionRecord[]) {
  return [...getActiveTransactions(transactions)].sort((left, right) => toFiniteNumber(right.amount) - toFiniteNumber(left.amount))[0];
}

export function transactionMatchesSearch(
  transaction: TransactionRecord,
  search: string,
  walletMap: Map<string, WalletRecord>,
  categoryMap: Map<string, CategoryRecord>,
) {
  if (!search.trim()) {
    return true;
  }

  const query = search.toLowerCase();
  const wallet = walletMap.get(transaction.walletId)?.name ?? '';
  const category = transaction.categoryId ? categoryMap.get(transaction.categoryId)?.name ?? '' : '';
  const note = transaction.note ?? '';

  return [wallet, category ?? '', note, transaction.amount.toString()].some((value) =>
    value.toLowerCase().includes(query),
  );
}

export function buildRecentTransactions(transactions: TransactionRecord[], limit = 8) {
  return [...getActiveTransactions(transactions)]
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    .slice(0, limit);
}

export function buildCategoryLabelMap(categories: CategoryRecord[]) {
  return new Map(categories.map((category) => [category.id, category]));
}

export function buildWalletLabelMap(wallets: WalletRecord[]) {
  return new Map(wallets.map((wallet) => [wallet.id, wallet]));
}

export function sortTransactionsDescending(transactions: TransactionRecord[]) {
  return [...transactions].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
}

export function extractMonthKey(iso: string) {
  return format(parseISO(iso), 'yyyy-MM');
}
