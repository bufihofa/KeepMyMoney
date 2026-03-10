export type ThemeMode = 'light' | 'dark' | 'system';
export type WeekStart = 'monday' | 'sunday';
export type WalletType = 'cash' | 'bank' | 'ewallet' | 'savings' | 'other';
export type TransactionType = 'expense' | 'income' | 'transfer';
export type CategoryKind = 'expense' | 'income';
export type PeriodPreset = 'week' | 'month' | 'quarter' | 'year' | 'all';

export interface Preferences {
  currency: string;
  theme: ThemeMode;
  weekStart: WeekStart;
  onboardingCompleted: boolean;
  schemaVersion: number;
}

export interface AppMetaEntry {
  key: keyof Preferences;
  value: Preferences[keyof Preferences];
}

export interface WalletRecord {
  id: string;
  name: string;
  type: WalletType;
  currency: string;
  openingBalance: number;
  currentBalanceCache: number;
  color: string;
  icon: string;
  isArchived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRecord {
  id: string;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
  isSystem: boolean;
  isHidden: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagRecord {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface TransactionRecord {
  id: string;
  type: TransactionType;
  amount: number;
  walletId: string;
  toWalletId?: string;
  categoryId?: string;
  tagIds: string[];
  note: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface BudgetRecord {
  id: string;
  categoryId: string;
  periodType: 'monthly';
  periodKey: string;
  limitAmount: number;
  alertThresholds: number[];
  createdAt: string;
  updatedAt: string;
}

export interface SnapshotPayload {
  app: 'KeepMyMoney';
  schemaVersion: number;
  exportedAt: string;
  meta: Preferences;
  wallets: WalletRecord[];
  categories: CategoryRecord[];
  tags: TagRecord[];
  transactions: TransactionRecord[];
  budgets: BudgetRecord[];
}

export interface OnboardingPayload {
  currency: string;
  weekStart: WeekStart;
  walletName: string;
  openingBalance: number;
  useSampleData: boolean;
}

export interface TransactionInput {
  id?: string;
  type: TransactionType;
  amount: number;
  walletId: string;
  toWalletId?: string;
  categoryId?: string;
  tagNames: string[];
  note: string;
  occurredAt: string;
}

export interface WalletInput {
  id?: string;
  name: string;
  type: WalletType;
  currency: string;
  openingBalance: number;
  color: string;
  icon: string;
  isArchived?: boolean;
}

export interface CategoryInput {
  id?: string;
  name: string;
  kind: CategoryKind;
  color: string;
  icon: string;
  isHidden?: boolean;
}

export interface BudgetInput {
  id?: string;
  categoryId: string;
  periodKey: string;
  limitAmount: number;
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
  label: string;
}

export interface SummaryMetrics {
  income: number;
  expense: number;
  net: number;
  incomeChange: number;
  expenseChange: number;
  netChange: number;
}

export interface CategorySpend {
  categoryId: string;
  name: string;
  color: string;
  total: number;
  percentage: number;
}

export interface BudgetProgress {
  budget: BudgetRecord;
  category?: CategoryRecord;
  spent: number;
  remaining: number;
  usage: number;
  projected: number;
  status: 'safe' | 'watch' | 'danger' | 'over';
}

export interface DailyCashflowPoint {
  label: string;
  income: number;
  expense: number;
  net: number;
}
