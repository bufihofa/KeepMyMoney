import { z } from 'zod';

export const preferencesSchema = z.object({
  currency: z.string().min(3).max(5),
  theme: z.enum(['light', 'dark', 'system']),
  weekStart: z.enum(['monday', 'sunday']),
  onboardingCompleted: z.boolean(),
  schemaVersion: z.number().int().positive(),
});

export const onboardingSchema = z.object({
  currency: z.string().min(3, 'Choose a currency code').max(5),
  weekStart: z.enum(['monday', 'sunday']),
  walletName: z.string().min(2, 'Wallet name is too short').max(40),
  openingBalance: z.coerce.number().min(0),
  useSampleData: z.boolean(),
});

export const transactionSchema = z
  .object({
    type: z.enum(['expense', 'income', 'transfer']),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    walletId: z.string().min(1, 'Choose a wallet'),
    toWalletId: z.string().optional(),
    categoryId: z.string().optional(),
    note: z.string().max(160).default(''),
    tags: z.string().default(''),
    occurredAt: z.string().min(1, 'Choose a date and time'),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'transfer') {
      if (!value.toWalletId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['toWalletId'], message: 'Choose destination wallet' });
      }
      if (value.toWalletId && value.toWalletId === value.walletId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['toWalletId'], message: 'Destination wallet must be different' });
      }
    }

    if (value.type !== 'transfer' && !value.categoryId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['categoryId'], message: 'Choose a category' });
    }
  });

export const walletSchema = z.object({
  name: z.string().min(2).max(40),
  type: z.enum(['cash', 'bank', 'ewallet', 'savings', 'other']),
  currency: z.string().min(3).max(5),
  openingBalance: z.coerce.number().min(0),
  color: z.string().min(4),
  icon: z.string().min(2),
  isArchived: z.boolean().default(false),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(40),
  kind: z.enum(['expense', 'income']),
  color: z.string().min(4),
  icon: z.string().min(2),
  isHidden: z.boolean().default(false),
});

export const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Choose a category'),
  periodKey: z.string().regex(/^\d{4}-\d{2}$/),
  limitAmount: z.coerce.number().positive('Budget must be greater than 0'),
});

const walletRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['cash', 'bank', 'ewallet', 'savings', 'other']),
  currency: z.string(),
  openingBalance: z.number(),
  currentBalanceCache: z.number(),
  color: z.string(),
  icon: z.string(),
  isArchived: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const categoryRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['expense', 'income']),
  icon: z.string(),
  color: z.string(),
  isSystem: z.boolean(),
  isHidden: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const tagRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  createdAt: z.string(),
});

const transactionRecordSchema = z.object({
  id: z.string(),
  type: z.enum(['expense', 'income', 'transfer']),
  amount: z.number(),
  walletId: z.string(),
  toWalletId: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()),
  note: z.string(),
  occurredAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().optional(),
});

const budgetRecordSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  periodType: z.literal('monthly'),
  periodKey: z.string(),
  limitAmount: z.number(),
  alertThresholds: z.array(z.number()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const snapshotSchema = z.object({
  app: z.literal('KeepMyMoney'),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  meta: preferencesSchema,
  wallets: z.array(walletRecordSchema),
  categories: z.array(categoryRecordSchema),
  tags: z.array(tagRecordSchema),
  transactions: z.array(transactionRecordSchema),
  budgets: z.array(budgetRecordSchema),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
export type TransactionFormValues = z.infer<typeof transactionSchema>;
export type WalletFormValues = z.infer<typeof walletSchema>;
export type CategoryFormValues = z.infer<typeof categorySchema>;
export type BudgetFormValues = z.infer<typeof budgetSchema>;
