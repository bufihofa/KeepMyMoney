import Dexie, { type Table } from 'dexie';
import type {
  AppMetaEntry,
  BudgetRecord,
  CategoryRecord,
  Preferences,
  TagRecord,
  TransactionRecord,
  WalletRecord,
} from '../domain/models';
import { buildSystemCategories, DEFAULT_PREFERENCES } from './defaults';

class KeepMyMoneyDB extends Dexie {
  appMeta!: Table<AppMetaEntry, AppMetaEntry['key']>;
  wallets!: Table<WalletRecord, string>;
  categories!: Table<CategoryRecord, string>;
  tags!: Table<TagRecord, string>;
  transactions!: Table<TransactionRecord, string>;
  budgets!: Table<BudgetRecord, string>;

  constructor() {
    super('keepmy-money-db');
    this.version(1).stores({
      appMeta: 'key',
      wallets: 'id, type, isArchived, sortOrder',
      categories: 'id, kind, isHidden, sortOrder',
      tags: 'id, name',
      transactions: 'id, type, walletId, toWalletId, categoryId, occurredAt, [walletId+occurredAt], [categoryId+occurredAt], deletedAt',
      budgets: 'id, categoryId, periodKey, [categoryId+periodKey]',
    });
  }
}

export const db = new KeepMyMoneyDB();

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export async function getPreferences(): Promise<Preferences> {
  const entries = await db.appMeta.toArray();
  const value = entries.reduce<Preferences>((accumulator, item) => {
    accumulator[item.key] = item.value as never;
    return accumulator;
  }, { ...DEFAULT_PREFERENCES });

  return value;
}

export async function setPreferences(values: Partial<Preferences>) {
  const entries = Object.entries(values).map(([key, value]) => ({ key: key as keyof Preferences, value }));
  await db.appMeta.bulkPut(entries);
}

export async function ensureAppBootstrapped() {
  const metaCount = await db.appMeta.count();
  if (metaCount === 0) {
    await setPreferences(DEFAULT_PREFERENCES);
  }

  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.bulkPut(buildSystemCategories());
  }
}
