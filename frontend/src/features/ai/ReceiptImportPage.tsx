import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { toast } from 'sonner';
import { Camera as CameraIcon, Upload, Sparkles, CheckCircle2, Trash2 } from 'lucide-react';
import { useAppData } from '../../hooks/useAppData';
import { IconGlyph } from '../../components/ui/IconGlyph';
import { extractReceiptItemsWithLLM, getAISettings, type ReceiptItemDraft } from '../../lib/ai';
import { upsertTransaction } from '../../db/operations';
import { formatCurrency, fromDateTimeLocalValue, toDateTimeLocalValue } from '../../domain/format';

function dataUrlToParts(dataUrl: string): { mediaType: string; base64: string } {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) {
    throw new Error('Invalid image data format.');
  }

  return { mediaType: match[1], base64: match[2] };
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ReceiptImportPage() {
  const [searchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const captureRef = useRef<HTMLInputElement | null>(null);
  const data = useAppData();
  const [preview, setPreview] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [merchant, setMerchant] = useState('');
  const [walletId, setWalletId] = useState('');
  const [occurredAtLocal, setOccurredAtLocal] = useState(() => toDateTimeLocalValue(new Date().toISOString()));
  const [items, setItems] = useState<ReceiptItemDraft[]>([]);

  const wallets = useMemo(() => data.wallets.filter((w) => !w.isArchived), [data.wallets]);
  const categories = useMemo(
    () => data.categories.filter((c) => c.kind === 'expense' && !c.isHidden).map((c) => ({ id: c.id, name: c.name, icon: c.icon, color: c.color })),
    [data.categories],
  );

  async function pickFromCamera() {
    if (!Capacitor.isNativePlatform()) {
      captureRef.current?.click();
      return;
    }

    try {
      const permissions = await Camera.checkPermissions();
      if (permissions.camera !== 'granted') {
        const requested = await Camera.requestPermissions({ permissions: ['camera'] });
        if (requested.camera !== 'granted') {
          toast.error('Bạn chưa cấp quyền camera');
          return;
        }
      }

      const photo = await Camera.getPhoto({
        quality: 82,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (!photo.dataUrl) return;
      setPreview(photo.dataUrl);
    } catch {
      toast.error('Không thể mở camera');
    }
  }

  async function pickFromFile() {
    inputRef.current?.click();
  }

  async function onFilePicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);
    event.target.value = '';
  }

  async function runExtraction() {
    if (!preview) {
      toast.error('Chọn ảnh hóa đơn trước');
      return;
    }

    const ai = getAISettings();
    if (!ai.apiKey.trim()) {
      toast.error('Thiếu API key', { description: 'Vào Cài đặt để nhập AI API key.' });
      return;
    }

    if (categories.length === 0) {
      toast.error('Không có danh mục chi tiêu để map');
      return;
    }

    setIsExtracting(true);
    try {
      const img = dataUrlToParts(preview);
      const result = await extractReceiptItemsWithLLM({
        imageBase64: img.base64,
        mediaType: img.mediaType,
        settings: ai,
        categories,
      });

      setMerchant(result.merchant || 'Receipt');
      if (result.occurredAt) {
        setOccurredAtLocal(toDateTimeLocalValue(result.occurredAt));
      }
      setItems(result.items);
      toast.success(`Đã tách ${result.items.length} dòng hóa đơn`);
    } catch (err) {
      toast.error('Tách hóa đơn thất bại', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsExtracting(false);
    }
  }

  function updateItem(index: number, patch: Partial<ReceiptItemDraft>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function getCategoryMeta(categoryId: string) {
    return categories.find((c) => c.id === categoryId) ?? categories[0];
  }

  async function confirmBulkCreate() {
    if (!walletId) {
      toast.error('Chọn ví để ghi giao dịch');
      return;
    }

    if (items.length === 0) {
      toast.error('Không có dòng giao dịch để lưu');
      return;
    }

    setIsSaving(true);
    try {
      const occurredAt = fromDateTimeLocalValue(occurredAtLocal);
      for (const item of items) {
        await upsertTransaction({
          type: 'expense',
          amount: item.amount,
          walletId,
          categoryId: item.category_id,
          note: `${merchant || 'Receipt'} - ${item.name}`,
          tagNames: ['receipt'],
          occurredAt,
        });
      }

      toast.success(`Đã tạo ${items.length} giao dịch`);
      setItems([]);
    } catch (err) {
      toast.error('Lưu giao dịch thất bại', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsSaving(false);
    }
  }

  const total = useMemo(() => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), [items]);

  useEffect(() => {
    if (searchParams.get('autocapture') !== '1') return;
    void pickFromCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="page receipt-import-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">AI Receipt</p>
        </div>
        <Link to="/settings" className="soft-button">Quay lại</Link>
      </header>

      <section className="panel receipt-stage receipt-stage--capture">
        <div className="panel__header">
          <div><p className="eyebrow">Bước 1</p><h2>Chọn ảnh hóa đơn</h2></div>
        </div>
        <div className="inline-actions" style={{ flexWrap: 'wrap' }}>
          <button type="button" className="primary-button" onClick={() => void pickFromCamera()}><CameraIcon size={14} /> Chụp ảnh</button>
          <button type="button" className="soft-button" onClick={() => void pickFromFile()}><Upload size={14} /> Tải ảnh</button>
          <button type="button" className="primary-button" onClick={() => void runExtraction()} disabled={!preview || isExtracting}><Sparkles size={14} /> {isExtracting ? 'Đang tách......' : 'Tách hóa đơn'}</button>
        </div>

        <input ref={inputRef} type="file" accept="image/*" onChange={(e) => void onFilePicked(e)} style={{ display: 'none' }} />
        <input ref={captureRef} type="file" accept="image/*" capture="environment" onChange={(e) => void onFilePicked(e)} style={{ display: 'none' }} />

        {preview && (
          <div className="preview-card receipt-preview" style={{ marginTop: '1rem' }}>
            <strong>Ảnh đã chọn</strong>
            <img src={preview} alt="Receipt preview" style={{ width: '100%', borderRadius: '12px', marginTop: '0.75rem' }} />
          </div>
        )}
      </section>

      <section className="panel receipt-stage receipt-stage--review">
        <div className="panel__header">
          <div><p className="eyebrow">Bước 2</p><h2>Review</h2></div>
        </div>
        <div className="field-grid receipt-meta-grid">
          <label className="field">
            <span>Merchant</span>
            <input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Store name" />
          </label>
          <label className="field">
            <span>Ví ghi nhận</span>
            <select value={walletId} onChange={(e) => setWalletId(e.target.value)}>
              <option value="">Chọn ví</option>
              {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Thời gian hóa đơn</span>
            <input type="datetime-local" value={occurredAtLocal} onChange={(e) => setOccurredAtLocal(e.target.value)} />
          </label>
        </div>

        {items.length > 0 ? (
          <div className="receipt-review-list" style={{ marginTop: '0.9rem' }}>
            {items.map((item, index) => (
              <article key={`${index}-${item.name}`} className="receipt-review-row">
                <button type="button" className="icon-button receipt-delete-button" onClick={() => removeItem(index)} aria-label="Xóa dòng"><Trash2 size={14} /></button>

                <div className="receipt-review-row__top">
                  <input
                    className="receipt-input receipt-input--name"
                    value={item.name}
                    onChange={(e) => updateItem(index, { name: e.target.value })}
                    placeholder="Tên giao dịch"
                  />
                  <input
                    className="receipt-input receipt-input--amount"
                    type="number"
                    min={0}
                    value={item.amount}
                    onChange={(e) => updateItem(index, { amount: Number(e.target.value) || 0 })}
                    placeholder="Số tiền"
                  />
                </div>

                <div className="receipt-category-select">
                  <span className="receipt-category-select__icon" style={{ background: getCategoryMeta(item.category_id)?.color ?? '#14b8a6' }}>
                    <IconGlyph name={getCategoryMeta(item.category_id)?.icon ?? 'tag'} size="sm" />
                  </span>
                  <select value={item.category_id} onChange={(e) => updateItem(index, { category_id: e.target.value })}>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state receipt-empty" style={{ marginTop: '0.9rem' }}>
            <div className="empty-state__icon"><Sparkles size={16} /></div>
            <h3>Chưa có item nào</h3>
          </div>
        )}

        <div className="summary-strip receipt-summary-strip" style={{ marginTop: '0.9rem' }}>
          <div><span>Tổng tiền</span><strong>{formatCurrency(total, data.preferences.currency)}</strong></div>
          <button type="button" className="primary-button" disabled={isSaving || items.length === 0} onClick={() => void confirmBulkCreate()}>
            <CheckCircle2 size={14} /> {isSaving ? 'Đang lưu...' : 'Xác nhận'}
          </button>
        </div>
      </section>
    </div>
  );
}
