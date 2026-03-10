import type {
  AppMetaEntry,
  BudgetInput,
  CategoryInput,
  CategoryRecord,
  OnboardingPayload,
  Preferences,
  SnapshotPayload,
  TagRecord,
  TransactionInput,
  TransactionRecord,
  WalletInput,
  WalletRecord,
} from '../domain/models';
import { snapshotSchema } from '../domain/schemas';
import { db, createId, ensureAppBootstrapped, getPreferences, setPreferences } from './database';
import { buildSampleData, DEFAULT_PREFERENCES, SCHEMA_VERSION } from './defaults';

function nowIso() {
  return new Date().toISOString();
}

function toFiniteNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function completeOnboarding(input: OnboardingPayload) {
  await ensureAppBootstrapped();

  await db.transaction('rw', [db.appMeta, db.wallets, db.categories, db.tags, db.transactions, db.budgets], async () => {
    await setPreferences({
      currency: input.currency,
      weekStart: input.weekStart,
      onboardingCompleted: true,
      schemaVersion: SCHEMA_VERSION,
    });

    const timestamp = nowIso();
    const walletCount = await db.wallets.count();
    const wallet: WalletRecord = {
      id: createId('wallet'),
      name: input.walletName,
      type: 'cash',
      currency: input.currency,
      openingBalance: input.openingBalance,
      currentBalanceCache: input.openingBalance,
      color: '#14b8a6',
      icon: 'wallet',
      isArchived: false,
      sortOrder: walletCount,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.wallets.put(wallet);

    if (input.useSampleData) {
      const categories = await db.categories.toArray();
      const sample = buildSampleData(wallet, categories);
      await db.tags.bulkPut(sample.tags);
      await db.transactions.bulkPut(sample.transactions);
      await db.budgets.bulkPut(sample.budgets);
    }

    await recalculateWalletBalances();
  });
}

export async function recalculateWalletBalances() {
  const [wallets, transactions] = await Promise.all([db.wallets.toArray(), db.transactions.toArray()]);
  const activeTransactions = transactions.filter((transaction) => !transaction.deletedAt);
  const nextBalances = new Map(wallets.map((wallet) => [wallet.id, toFiniteNumber(wallet.openingBalance)]));

  for (const transaction of activeTransactions) {
    const amount = toFiniteNumber(transaction.amount);

    if (transaction.type === 'income') {
      nextBalances.set(transaction.walletId, (nextBalances.get(transaction.walletId) ?? 0) + amount);
    }

    if (transaction.type === 'expense') {
      nextBalances.set(transaction.walletId, (nextBalances.get(transaction.walletId) ?? 0) - amount);
    }

    if (transaction.type === 'transfer' && transaction.toWalletId) {
      nextBalances.set(transaction.walletId, (nextBalances.get(transaction.walletId) ?? 0) - amount);
      nextBalances.set(transaction.toWalletId, (nextBalances.get(transaction.toWalletId) ?? 0) + amount);
    }
  }

  await db.wallets.bulkPut(
    wallets.map((wallet) => ({
      ...wallet,
      currentBalanceCache: toFiniteNumber(nextBalances.get(wallet.id), toFiniteNumber(wallet.openingBalance)),
      updatedAt: nowIso(),
    })),
  );
}

export async function upsertWallet(input: WalletInput) {
  await ensureAppBootstrapped();
  const timestamp = nowIso();
  const count = await db.wallets.count();
  const existing = input.id ? await db.wallets.get(input.id) : undefined;

  const wallet: WalletRecord = {
    id: existing?.id ?? createId('wallet'),
    name: input.name,
    type: input.type,
    currency: input.currency,
    openingBalance: input.openingBalance,
    currentBalanceCache: existing?.currentBalanceCache ?? input.openingBalance,
    color: input.color,
    icon: input.icon,
    isArchived: input.isArchived ?? false,
    sortOrder: existing?.sortOrder ?? count,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  await db.wallets.put(wallet);
  await recalculateWalletBalances();
}

export async function archiveWallet(walletId: string) {
  const wallet = await db.wallets.get(walletId);
  if (!wallet) {
    return;
  }

  await db.wallets.put({
    ...wallet,
    isArchived: true,
    updatedAt: nowIso(),
  });
}

export async function upsertCategory(input: CategoryInput) {
  await ensureAppBootstrapped();
  const timestamp = nowIso();
  const count = await db.categories.count();
  const existing = input.id ? await db.categories.get(input.id) : undefined;

  const category: CategoryRecord = {
    id: existing?.id ?? createId('category'),
    name: input.name,
    kind: input.kind,
    icon: input.icon,
    color: input.color,
    isSystem: existing?.isSystem ?? false,
    isHidden: input.isHidden ?? false,
    sortOrder: existing?.sortOrder ?? count,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  await db.categories.put(category);
}

export async function toggleCategoryHidden(categoryId: string) {
  const category = await db.categories.get(categoryId);
  if (!category) {
    return;
  }

  await db.categories.put({
    ...category,
    isHidden: !category.isHidden,
    updatedAt: nowIso(),
  });
}

function normalizeTags(input: string[]) {
  return [...new Set(input.map((value) => value.trim()).filter(Boolean))];
}

async function ensureTags(names: string[]) {
  const existingTags = await db.tags.toArray();
  const tagMap = new Map(existingTags.map((tag) => [tag.name.toLowerCase(), tag]));
  const created: TagRecord[] = [];

  for (const name of names) {
    if (!tagMap.has(name.toLowerCase())) {
      const tag: TagRecord = {
        id: createId('tag'),
        name,
        color: '#8b5cf6',
        createdAt: nowIso(),
      };
      created.push(tag);
      tagMap.set(name.toLowerCase(), tag);
    }
  }

  if (created.length > 0) {
    await db.tags.bulkPut(created);
  }

  return names.map((name) => tagMap.get(name.toLowerCase())!.id);
}

export async function upsertTransaction(input: TransactionInput) {
  await ensureAppBootstrapped();
  const timestamp = nowIso();
  const existing = input.id ? await db.transactions.get(input.id) : undefined;
  const tagIds = await ensureTags(normalizeTags(input.tagNames));

  const record: TransactionRecord = {
    id: existing?.id ?? createId('txn'),
    type: input.type,
    amount: toFiniteNumber(input.amount),
    walletId: input.walletId,
    toWalletId: input.type === 'transfer' ? input.toWalletId : undefined,
    categoryId: input.type === 'transfer' ? undefined : input.categoryId,
    tagIds,
    note: input.note,
    occurredAt: input.occurredAt,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    deletedAt: undefined,
  };

  await db.transactions.put(record);
  await recalculateWalletBalances();
}

export async function deleteTransaction(transactionId: string) {
  const transaction = await db.transactions.get(transactionId);
  if (!transaction) {
    return;
  }

  await db.transactions.put({
    ...transaction,
    deletedAt: nowIso(),
    updatedAt: nowIso(),
  });
  await recalculateWalletBalances();
}

export async function upsertBudget(input: BudgetInput) {
  await ensureAppBootstrapped();
  const timestamp = nowIso();
  const existing = input.id ? await db.budgets.get(input.id) : await db.budgets.where('[categoryId+periodKey]').equals([input.categoryId, input.periodKey]).first();

  await db.budgets.put({
    id: existing?.id ?? createId('budget'),
    categoryId: input.categoryId,
    periodType: 'monthly',
    periodKey: input.periodKey,
    limitAmount: input.limitAmount,
    alertThresholds: existing?.alertThresholds ?? [0.7, 0.9, 1],
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  });
}

export async function deleteBudget(budgetId: string) {
  const budget = await db.budgets.get(budgetId);
  if (!budget) {
    return;
  }

  await db.budgets.delete(budgetId);
}

export async function exportSnapshot(): Promise<SnapshotPayload> {
  await ensureAppBootstrapped();
  const [meta, wallets, categories, tags, transactions, budgets] = await Promise.all([
    getPreferences(),
    db.wallets.toArray(),
    db.categories.toArray(),
    db.tags.toArray(),
    db.transactions.toArray(),
    db.budgets.toArray(),
  ]);

  return {
    app: 'KeepMyMoney',
    schemaVersion: meta.schemaVersion,
    exportedAt: nowIso(),
    meta,
    wallets,
    categories,
    tags,
    transactions,
    budgets,
  };
}

function validateRelations(snapshot: SnapshotPayload) {
  const walletIds = new Set(snapshot.wallets.map((wallet) => wallet.id));
  const categoryIds = new Set(snapshot.categories.map((category) => category.id));

  for (const transaction of snapshot.transactions) {
    if (!walletIds.has(transaction.walletId)) {
      throw new Error('A transaction references a wallet that does not exist.');
    }

    if (transaction.toWalletId && !walletIds.has(transaction.toWalletId)) {
      throw new Error('A transfer references a destination wallet that does not exist.');
    }

    if (transaction.categoryId && !categoryIds.has(transaction.categoryId)) {
      throw new Error('A transaction references a category that does not exist.');
    }
  }

  for (const budget of snapshot.budgets) {
    if (!categoryIds.has(budget.categoryId)) {
      throw new Error('A budget references a category that does not exist.');
    }
  }
}

export async function importSnapshot(raw: string) {
  const parsed = JSON.parse(raw) as SnapshotPayload;
  const snapshot = snapshotSchema.parse(parsed);

  if (snapshot.schemaVersion > SCHEMA_VERSION) {
    throw new Error('This backup was generated by a newer app version. Update the app before importing.');
  }

  validateRelations(snapshot);

  await db.transaction('rw', [db.appMeta, db.wallets, db.categories, db.tags, db.transactions, db.budgets], async () => {
    await Promise.all([
      db.appMeta.clear(),
      db.wallets.clear(),
      db.categories.clear(),
      db.tags.clear(),
      db.transactions.clear(),
      db.budgets.clear(),
    ]);

    const metaEntries: AppMetaEntry[] = Object.entries({
      ...DEFAULT_PREFERENCES,
      ...snapshot.meta,
      onboardingCompleted: true,
      schemaVersion: SCHEMA_VERSION,
    }).map(([key, value]) => ({ key: key as keyof Preferences, value }));

    await db.appMeta.bulkPut(metaEntries);
    await db.wallets.bulkPut(snapshot.wallets);
    await db.categories.bulkPut(snapshot.categories);
    await db.tags.bulkPut(snapshot.tags);
    await db.transactions.bulkPut(snapshot.transactions);
    await db.budgets.bulkPut(snapshot.budgets);
  });

  await recalculateWalletBalances();
}

export async function clearLocalData() {
  await db.transaction('rw', [db.appMeta, db.wallets, db.categories, db.tags, db.transactions, db.budgets], async () => {
    await Promise.all([
      db.appMeta.clear(),
      db.wallets.clear(),
      db.categories.clear(),
      db.tags.clear(),
      db.transactions.clear(),
      db.budgets.clear(),
    ]);
  });

  await ensureAppBootstrapped();
  await setPreferences({ ...DEFAULT_PREFERENCES });
}

