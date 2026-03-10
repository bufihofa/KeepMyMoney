import { create } from 'zustand';
import type { BudgetRecord, CategoryRecord, PeriodPreset, TransactionRecord, WalletRecord } from '../domain/models';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone?: 'success' | 'info' | 'danger';
}

interface SheetState<T> {
  open: boolean;
  record?: T;
}

interface UIState {
  periodPreset: PeriodPreset;
  transactionSheet: SheetState<TransactionRecord>;
  walletSheet: SheetState<WalletRecord>;
  categorySheet: SheetState<CategoryRecord>;
  budgetSheet: SheetState<BudgetRecord>;
  toasts: ToastItem[];
  setPeriodPreset: (preset: PeriodPreset) => void;
  openTransactionSheet: (record?: TransactionRecord) => void;
  closeTransactionSheet: () => void;
  openWalletSheet: (record?: WalletRecord) => void;
  closeWalletSheet: () => void;
  openCategorySheet: (record?: CategoryRecord) => void;
  closeCategorySheet: () => void;
  openBudgetSheet: (record?: BudgetRecord) => void;
  closeBudgetSheet: () => void;
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  periodPreset: 'month',
  transactionSheet: { open: false },
  walletSheet: { open: false },
  categorySheet: { open: false },
  budgetSheet: { open: false },
  toasts: [],
  setPeriodPreset: (periodPreset) => set({ periodPreset }),
  openTransactionSheet: (record) => set({ transactionSheet: { open: true, record } }),
  closeTransactionSheet: () => set({ transactionSheet: { open: false } }),
  openWalletSheet: (record) => set({ walletSheet: { open: true, record } }),
  closeWalletSheet: () => set({ walletSheet: { open: false } }),
  openCategorySheet: (record) => set({ categorySheet: { open: true, record } }),
  closeCategorySheet: () => set({ categorySheet: { open: false } }),
  openBudgetSheet: (record) => set({ budgetSheet: { open: true, record } }),
  closeBudgetSheet: () => set({ budgetSheet: { open: false } }),
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { id: crypto.randomUUID(), tone: 'info', ...toast }],
    })),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));
