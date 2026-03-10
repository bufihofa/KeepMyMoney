import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CURRENCY_OPTIONS } from '../../db/defaults';
import { completeOnboarding } from '../../db/operations';
import { onboardingSchema, type OnboardingFormValues } from '../../domain/schemas';

export function OnboardingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      currency: 'VND',
      weekStart: 'monday',
      walletName: 'Main Wallet',
      openingBalance: 3500000,
      useSampleData: true,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      await completeOnboarding(values);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="onboarding-page">
      <div className="app-shell__glow app-shell__glow--one" />
      <div className="app-shell__glow app-shell__glow--two" />
      <motion.section className="onboarding-hero" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <p className="eyebrow">KeepMyMoney</p>
        <h1>Personal finance tracking with local-first confidence.</h1>
        <p className="section-copy">
          A modern mobile experience for cashflow visibility, budgets, and full JSON backups without relying on cloud sync.
        </p>
        <div className="feature-points">
          <div className="feature-chip">Fast transaction capture</div>
          <div className="feature-chip">IndexedDB offline storage</div>
          <div className="feature-chip">JSON import/export</div>
          <div className="feature-chip">Capacitor-ready Android build</div>
        </div>
      </motion.section>

      <motion.form className="panel onboarding-form" onSubmit={onSubmit} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div className="panel__header">
          <div>
            <p className="eyebrow">Initial setup</p>
            <h2>Get started in under a minute</h2>
          </div>
        </div>

        <label className="field">
          <span>Currency</span>
          <select {...register('currency')}>
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
          {errors.currency ? <small>{errors.currency.message}</small> : null}
        </label>

        <div className="field-grid">
          <label className="field">
            <span>Week starts on</span>
            <select {...register('weekStart')}>
              <option value="monday">Monday</option>
              <option value="sunday">Sunday</option>
            </select>
          </label>

          <label className="field">
            <span>Opening balance</span>
            <input type="number" step="0.01" {...register('openingBalance')} />
            {errors.openingBalance ? <small>{errors.openingBalance.message}</small> : null}
          </label>
        </div>

        <label className="field">
          <span>First wallet name</span>
          <input type="text" placeholder="Main Wallet" {...register('walletName')} />
          {errors.walletName ? <small>{errors.walletName.message}</small> : null}
        </label>

        <label className="check-field">
          <input type="checkbox" {...register('useSampleData')} />
          <div>
            <strong>Load polished sample data</strong>
            <span>Useful for exploring dashboard, budgets, and insights immediately.</span>
          </div>
        </label>

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? 'Preparing workspace...' : 'Start using KeepMyMoney'}
        </button>
      </motion.form>
    </div>
  );
}
