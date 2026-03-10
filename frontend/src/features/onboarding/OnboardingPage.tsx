import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ShieldCheck, Rocket, Zap, BarChart3, Download, Smartphone } from 'lucide-react';
import { CURRENCY_OPTIONS } from '../../db/defaults';
import { completeOnboarding } from '../../db/operations';
import { onboardingSchema, type OnboardingFormValues } from '../../domain/schemas';

const steps = [
  { title: 'Chào mừng', subtitle: 'Chọn tiền tệ và cài đặt cơ bản' },
  { title: 'Tạo ví', subtitle: 'Thiết lập ví đầu tiên cho bạn' },
  { title: 'Sẵn sàng', subtitle: 'Bắt đầu quản lý tài chính ngay' },
];

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { currency: 'VND', weekStart: 'monday', walletName: 'Ví chính', openingBalance: 3500000, useSampleData: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    try { await completeOnboarding(values); } finally { setIsSubmitting(false); }
  });

  return (
    <div className="onboarding-page">
      <div className="app-shell__glow app-shell__glow--one" />
      <div className="app-shell__glow app-shell__glow--two" />

      <motion.div className="onboarding-hero" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
        <div className="empty-state__icon" style={{ margin: '0 auto 1rem', width: '3.5rem', height: '3.5rem' }}>
          <ShieldCheck size={28} />
        </div>
        <p className="eyebrow">KeepMyMoney</p>
        <h1>Quản lý tài chính cá nhân offline-first</h1>
        <p className="section-copy" style={{ textAlign: 'center', margin: '0.5rem auto 0' }}>
          Ghi nhận chi tiêu nhanh, phân tích thông minh, sao lưu đầy đủ — không cần đăng ký, không cần internet.
        </p>
        <div className="feature-points">
          <div className="feature-chip"><Zap size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Nhập nhanh</div>
          <div className="feature-chip"><BarChart3 size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Phân tích</div>
          <div className="feature-chip"><Download size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Sao lưu JSON</div>
          <div className="feature-chip"><Smartphone size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Android</div>
        </div>
      </motion.div>

      <div className="chip-row" style={{ justifyContent: 'center' }}>
        {steps.map((s, i) => (
          <button key={i} type="button" className={`chip-button${step === i ? ' chip-button--active' : ''}`} onClick={() => setStep(i)}
            style={{ minWidth: 'auto', padding: '0.4rem 0.65rem', fontSize: '0.72rem' }}>
            {i + 1}. {s.title}
          </button>
        ))}
      </div>

      <motion.form className="panel onboarding-form" onSubmit={onSubmit}>
        <div className="panel__header"><div><p className="eyebrow">Bước {step + 1} / {steps.length}</p><h2>{steps[step].subtitle}</h2></div></div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="sheet-form">
                <label className="field"><span>Tiền tệ</span><select {...register('currency')}>{CURRENCY_OPTIONS.map((c) => <option key={c}>{c}</option>)}</select>{errors.currency && <small>{errors.currency.message}</small>}</label>
                <label className="field"><span>Tuần bắt đầu</span><select {...register('weekStart')}><option value="monday">Thứ Hai</option><option value="sunday">Chủ Nhật</option></select></label>
              </div>
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="sheet-form">
                <label className="field"><span>Tên ví</span><input type="text" placeholder="Ví chính" {...register('walletName')} />{errors.walletName && <small>{errors.walletName.message}</small>}</label>
                <label className="field"><span>Số dư ban đầu</span><input type="number" step="0.01" {...register('openingBalance')} />{errors.openingBalance && <small>{errors.openingBalance.message}</small>}</label>
              </div>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="sheet-form">
                <label className="check-field">
                  <input type="checkbox" {...register('useSampleData')} />
                  <div><strong>Nạp dữ liệu mẫu</strong><span>Hữu ích để khám phá trang tổng quan, ngân sách và phân tích ngay lập tức.</span></div>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="inline-actions" style={{ justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <button type="button" className="soft-button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>← Quay lại</button>
          {step < steps.length - 1
            ? <button type="button" className="primary-button" onClick={() => setStep((s) => s + 1)}>Tiếp theo →</button>
            : <button type="submit" className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Đang chuẩn bị...' : 'Bắt đầu ngay'} <Rocket size={14} /></button>}
        </div>
      </motion.form>
    </div>
  );
}
