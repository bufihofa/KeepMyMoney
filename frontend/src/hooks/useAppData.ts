import { useLiveQuery } from 'dexie-react-hooks';
import { db, getPreferences } from '../db/database';
import { DEFAULT_PREFERENCES } from '../db/defaults';

function toFiniteNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const defaultValue = {
  preferences: DEFAULT_PREFERENCES,
  wallets: [],
  categories: [],
  tags: [],
  transactions: [],
  budgets: [],
};

export function usePreferences() {
  return useLiveQuery(() => getPreferences(), [], DEFAULT_PREFERENCES);
}

export function useAppData() {
  return useLiveQuery(async () => {
    const [preferences, wallets, categories, tags, transactions, budgets] = await Promise.all([
      getPreferences(),
      db.wallets.orderBy('sortOrder').toArray(),
      db.categories.orderBy('sortOrder').toArray(),
      db.tags.toArray(),
      db.transactions.orderBy('occurredAt').reverse().toArray(),
      db.budgets.toArray(),
    ]);

    const normalizedWallets = wallets.map((wallet) => ({
      ...wallet,
      openingBalance: toFiniteNumber(wallet.openingBalance),
      currentBalanceCache: toFiniteNumber(wallet.currentBalanceCache),
      sortOrder: toFiniteNumber(wallet.sortOrder),
    }));

    const normalizedTransactions = transactions.map((transaction) => ({
      ...transaction,
      amount: toFiniteNumber(transaction.amount),
    }));

    const normalizedBudgets = budgets.map((budget) => ({
      ...budget,
      limitAmount: toFiniteNumber(budget.limitAmount),
      alertThresholds: Array.isArray(budget.alertThresholds)
        ? budget.alertThresholds
            .map((value) => toFiniteNumber(value, 0))
            .filter((value) => value >= 0)
        : [0.7, 0.9, 1],
    }));

    return {
      preferences,
      wallets: normalizedWallets,
      categories,
      tags,
      transactions: normalizedTransactions,
      budgets: normalizedBudgets,
    };
  }, [], defaultValue);
}
