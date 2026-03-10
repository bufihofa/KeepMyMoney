import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { usePreferences } from '../hooks/useAppData';
import { useBootstrap } from '../hooks/useBootstrap';
import { resolveTheme } from '../domain/format';
import { AppShell } from './layout/AppShell';
import { HomePage } from '../features/home/HomePage';
import { TransactionsPage } from '../features/transactions/TransactionsPage';
import { BudgetsPage } from '../features/budgets/BudgetsPage';
import { InsightsPage } from '../features/insights/InsightsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';
import { TransactionSheet } from '../features/shared/TransactionSheet';
import { WalletSheet } from '../features/shared/WalletSheet';
import { CategorySheet } from '../features/shared/CategorySheet';
import { BudgetSheet } from '../features/shared/BudgetSheet';
import { Loader2 } from 'lucide-react';

export function App() {
  const { ready, error } = useBootstrap();
  const preferences = usePreferences();

  useEffect(() => {
    document.documentElement.dataset.theme = resolveTheme(preferences.theme);
  }, [preferences.theme]);

  if (error) {
    return (
      <div className="splash-screen">
        <div className="splash-card">
          <p className="eyebrow">Lỗi lưu trữ cục bộ</p>
          <h1>Không thể khởi tạo KeepMyMoney.</h1>
          <p className="section-copy">{error}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="splash-screen">
        <div className="splash-card">
          <div className="splash-loader">
            <Loader2 className="spin-icon" size={32} />
          </div>
          <p className="eyebrow">KeepMyMoney</p>
          <h1>Ghi rõ ràng. Chi có kiểm soát.</h1>
          <p className="section-copy">Đang chuẩn bị không gian làm việc offline…</p>
        </div>
      </div>
    );
  }

  if (!preferences.onboardingCompleted) {
    return <OnboardingPage />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <TransactionSheet />
      <WalletSheet />
      <CategorySheet />
      <BudgetSheet />
    </>
  );
}
