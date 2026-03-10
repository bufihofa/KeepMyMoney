import type {
  BudgetRecord,
  CategoryKind,
  CategoryRecord,
  PeriodPreset,
  Preferences,
  TagRecord,
  TransactionRecord,
  WalletRecord,
  WalletType,
} from '../domain/models';
import { createId } from './database';
import { toMonthKey } from '../domain/format';

export const SCHEMA_VERSION = 1;

export const DEFAULT_PREFERENCES: Preferences = {
  currency: 'VND',
  theme: 'system',
  weekStart: 'monday',
  onboardingCompleted: false,
  schemaVersion: SCHEMA_VERSION,
};

export const CURRENCY_OPTIONS = ['VND', 'USD', 'THB', 'EUR', 'JPY'];
export const PERIOD_PRESETS: PeriodPreset[] = ['week', 'month', 'quarter', 'year', 'all'];
export const WALLET_TYPE_OPTIONS: WalletType[] = ['cash', 'bank', 'ewallet', 'savings', 'other'];
export const WALLET_ICON_OPTIONS = ['wallet', 'bank', 'cash', 'piggy', 'bag'];
export const CATEGORY_ICON_OPTIONS = ['food', 'transport', 'home', 'bill', 'heart', 'shopping', 'spark', 'gift', 'salary', 'bonus'];
export const COLOR_OPTIONS = ['#14b8a6', '#0f766e', '#22c55e', '#f97316', '#f59e0b', '#38bdf8', '#8b5cf6', '#ef4444'];

interface CategorySeed {
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
}

const CATEGORY_SEEDS: CategorySeed[] = [
  { name: 'Food', kind: 'expense', icon: 'food', color: '#14b8a6' },
  { name: 'Transport', kind: 'expense', icon: 'transport', color: '#38bdf8' },
  { name: 'Housing', kind: 'expense', icon: 'home', color: '#8b5cf6' },
  { name: 'Bills', kind: 'expense', icon: 'bill', color: '#f59e0b' },
  { name: 'Health', kind: 'expense', icon: 'heart', color: '#ef4444' },
  { name: 'Shopping', kind: 'expense', icon: 'shopping', color: '#f97316' },
  { name: 'Leisure', kind: 'expense', icon: 'spark', color: '#0ea5e9' },
  { name: 'Gifts', kind: 'expense', icon: 'gift', color: '#f43f5e' },
  { name: 'Salary', kind: 'income', icon: 'salary', color: '#22c55e' },
  { name: 'Bonus', kind: 'income', icon: 'bonus', color: '#14b8a6' },
  { name: 'Freelance', kind: 'income', icon: 'bag', color: '#8b5cf6' },
  { name: 'Refund', kind: 'income', icon: 'spark', color: '#38bdf8' },
];

export function buildSystemCategories() {
  const timestamp = new Date().toISOString();
  return CATEGORY_SEEDS.map<CategoryRecord>((seed, index) => ({
    id: createId('category'),
    name: seed.name,
    kind: seed.kind,
    icon: seed.icon,
    color: seed.color,
    isSystem: true,
    isHidden: false,
    sortOrder: index,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

function daysAgo(days: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 15, 0, 0);
  return date.toISOString();
}

export function buildSampleData(wallet: WalletRecord, categories: CategoryRecord[]) {
  const now = new Date().toISOString();
  const monthKey = toMonthKey();
  const categoryByName = new Map(categories.map((category) => [category.name, category.id]));

  const tags: TagRecord[] = [
    { id: createId('tag'), name: 'Essential', color: '#14b8a6', createdAt: now },
    { id: createId('tag'), name: 'Work', color: '#8b5cf6', createdAt: now },
    { id: createId('tag'), name: 'Weekend', color: '#f59e0b', createdAt: now },
  ];

  const transactions: TransactionRecord[] = [
    {
      id: createId('txn'),
      type: 'income',
      amount: 32000000,
      walletId: wallet.id,
      categoryId: categoryByName.get('Salary'),
      tagIds: [tags[1].id],
      note: 'Monthly salary',
      occurredAt: daysAgo(8, 9),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId('txn'),
      type: 'income',
      amount: 3500000,
      walletId: wallet.id,
      categoryId: categoryByName.get('Freelance'),
      tagIds: [tags[1].id],
      note: 'Landing page side project',
      occurredAt: daysAgo(4, 20),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId('txn'),
      type: 'expense',
      amount: 220000,
      walletId: wallet.id,
      categoryId: categoryByName.get('Food'),
      tagIds: [tags[2].id],
      note: 'Weekend brunch',
      occurredAt: daysAgo(1, 11),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId('txn'),
      type: 'expense',
      amount: 480000,
      walletId: wallet.id,
      categoryId: categoryByName.get('Food'),
      tagIds: [tags[0].id],
      note: 'Groceries',
      occurredAt: daysAgo(5, 18),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId('txn'),
      type: 'expense',
      amount: 280000,
      walletId: wallet.id,
      categoryId: categoryByName.get('Transport'),
      tagIds: [tags[0].id],
      note: 'Fuel refill',
      occurredAt: daysAgo(3, 8),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId('txn'),
      type: 'expense',
      amount: 1500000,
      walletId: wallet.id,
      categoryId: categoryByName.get('Bills'),
      tagIds: [tags[0].id],
      note: 'Internet and utilities',
      occurredAt: daysAgo(6, 19),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId('txn'),
      type: 'expense',
      amount: 950000,
      walletId: wallet.id,
      categoryId: categoryByName.get('Shopping'),
      tagIds: [tags[2].id],
      note: 'Running shoes',
      occurredAt: daysAgo(2, 16),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId('txn'),
      type: 'expense',
      amount: 420000,
      walletId: wallet.id,
      categoryId: categoryByName.get('Leisure'),
      tagIds: [tags[2].id],
      note: 'Cinema and coffee',
      occurredAt: daysAgo(7, 21),
      createdAt: now,
      updatedAt: now,
    },
  ];

  const budgets: BudgetRecord[] = [
    {
      id: createId('budget'),
      categoryId: categoryByName.get('Food')!,
      periodType: 'monthly',
      periodKey: monthKey,
      limitAmount: 4500000,
      alertThresholds: [0.7, 0.9, 1],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId('budget'),
      categoryId: categoryByName.get('Transport')!,
      periodType: 'monthly',
      periodKey: monthKey,
      limitAmount: 2000000,
      alertThresholds: [0.7, 0.9, 1],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId('budget'),
      categoryId: categoryByName.get('Shopping')!,
      periodType: 'monthly',
      periodKey: monthKey,
      limitAmount: 3000000,
      alertThresholds: [0.7, 0.9, 1],
      createdAt: now,
      updatedAt: now,
    },
  ];

  return { tags, transactions, budgets };
}
