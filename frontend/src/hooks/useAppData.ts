import { useLiveQuery } from 'dexie-react-hooks';
import { db, getPreferences } from '../db/database';
import { DEFAULT_PREFERENCES } from '../db/defaults';

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

    return {
      preferences,
      wallets,
      categories,
      tags,
      transactions,
      budgets,
    };
  }, [], defaultValue);
}
