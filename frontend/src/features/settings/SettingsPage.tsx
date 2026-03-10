import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconGlyph } from '../../components/ui/IconGlyph';
import { CURRENCY_OPTIONS } from '../../db/defaults';
import { db, setPreferences } from '../../db/database';
import { archiveWallet, clearLocalData, exportSnapshot, importSnapshot } from '../../db/operations';
import { snapshotSchema } from '../../domain/schemas';
import { copyText, impact } from '../../lib/device';
import { useAppData } from '../../hooks/useAppData';
import { useUIStore } from '../../stores/uiStore';

export function SettingsPage() {
  const data = useAppData();
  const openWalletSheet = useUIStore((state) => state.openWalletSheet);
  const openCategorySheet = useUIStore((state) => state.openCategorySheet);
  const addToast = useUIStore((state) => state.addToast);
  const [exportJson, setExportJson] = useState('');
  const [importJson, setImportJson] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const importPreview = useMemo(() => {
    if (!importJson.trim()) {
      return null;
    }

    try {
      const parsed = snapshotSchema.parse(JSON.parse(importJson));
      return {
        wallets: parsed.wallets.length,
        transactions: parsed.transactions.length,
        budgets: parsed.budgets.length,
        exportedAt: parsed.exportedAt,
      };
    } catch {
      return null;
    }
  }, [importJson]);

  const handleExport = async () => {
    const snapshot = await exportSnapshot();
    const value = JSON.stringify(snapshot, null, 2);
    setExportJson(value);
    addToast({ title: 'Backup generated', description: 'Scroll down to copy the JSON snapshot.', tone: 'success' });
  };

  const handleCopy = async () => {
    if (!exportJson) {
      return;
    }

    await copyText(exportJson);
    await impact();
    addToast({ title: 'Copied to clipboard', tone: 'success' });
  };

  const handleImport = async () => {
    if (!importJson.trim()) {
      return;
    }

    if (!window.confirm('Replace all local data with this JSON backup?')) {
      return;
    }

    setIsImporting(true);
    try {
      await importSnapshot(importJson);
      await impact();
      addToast({ title: 'Backup restored', description: 'Local data has been replaced.', tone: 'success' });
      setImportJson('');
    } catch (error) {
      addToast({ title: 'Import failed', description: error instanceof Error ? error.message : 'Invalid backup JSON.', tone: 'danger' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleArchiveWallet = async (walletId: string) => {
    if (!window.confirm('Archive this wallet? Existing transactions will be kept.')) {
      return;
    }

    await archiveWallet(walletId);
    addToast({ title: 'Wallet archived', tone: 'success' });
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all local data and return to onboarding?')) {
      return;
    }

    await clearLocalData();
    addToast({ title: 'Local data cleared', tone: 'success' });
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Preferences</p>
          <h1>Settings</h1>
          <p className="section-copy">Manage app preferences, local data, wallets, and custom categories.</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Display</p>
            <h2>Personalization</h2>
          </div>
        </div>
        <div className="field-grid">
          <label className="field">
            <span>Theme</span>
            <select value={data.preferences.theme} onChange={(event) => void setPreferences({ theme: event.target.value as typeof data.preferences.theme })}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="field">
            <span>Currency</span>
            <select value={data.preferences.currency} onChange={(event) => void setPreferences({ currency: event.target.value })}>
              {CURRENCY_OPTIONS.map((currency) => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Week starts on</span>
            <select value={data.preferences.weekStart} onChange={(event) => void setPreferences({ weekStart: event.target.value as typeof data.preferences.weekStart })}>
              <option value="monday">Monday</option>
              <option value="sunday">Sunday</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Wallets</p>
            <h2>Manage accounts</h2>
          </div>
          <button type="button" className="soft-button" onClick={() => openWalletSheet()}>
            Add wallet
          </button>
        </div>
        <div className="stack-list">
          {data.wallets.map((wallet) => (
            <article key={wallet.id} className="setting-row">
              <div>
                <strong>{wallet.name}</strong>
                <span>{wallet.type} · {wallet.currency}{wallet.isArchived ? ' · archived' : ''}</span>
              </div>
              <div className="inline-actions">
                <button type="button" className="icon-button icon-button--ghost" onClick={() => openWalletSheet(wallet)} aria-label="Edit wallet">
                  <IconGlyph name="edit" />
                </button>
                {!wallet.isArchived ? (
                  <button type="button" className="icon-button icon-button--ghost" onClick={() => void handleArchiveWallet(wallet.id)} aria-label="Archive wallet">
                    <IconGlyph name="trash" />
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Categories</p>
            <h2>Customize labels</h2>
          </div>
          <button type="button" className="soft-button" onClick={() => openCategorySheet()}>
            Add category
          </button>
        </div>
        <div className="stack-list">
          {data.categories.map((category) => (
            <article key={category.id} className="setting-row">
              <div>
                <strong>{category.name}</strong>
                <span>{category.kind}{category.isSystem ? ' · system' : ''}{category.isHidden ? ' · hidden' : ''}</span>
              </div>
              <div className="inline-actions">
                <button type="button" className="icon-button icon-button--ghost" onClick={() => openCategorySheet(category)} aria-label="Edit category">
                  <IconGlyph name="edit" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Backup</p>
            <h2>JSON import/export</h2>
          </div>
        </div>
        <div className="inline-actions">
          <button type="button" className="primary-button" onClick={() => void handleExport()}>
            <IconGlyph name="export" />
            Generate backup
          </button>
          <button type="button" className="soft-button" onClick={() => void handleCopy()} disabled={!exportJson}>
            <IconGlyph name="copy" />
            Copy JSON
          </button>
        </div>
        <label className="field">
          <span>Export JSON</span>
          <textarea rows={10} readOnly value={exportJson} placeholder="Backup JSON will appear here." />
        </label>
        <label className="field">
          <span>Import JSON</span>
          <textarea rows={10} value={importJson} onChange={(event) => setImportJson(event.target.value)} placeholder="Paste a full KeepMyMoney backup here." />
        </label>
        {importPreview ? (
          <div className="preview-card">
            <strong>Backup preview</strong>
            <span>{importPreview.wallets} wallets · {importPreview.transactions} transactions · {importPreview.budgets} budgets</span>
            <small>Exported at {importPreview.exportedAt}</small>
          </div>
        ) : importJson.trim() ? (
          <div className="preview-card preview-card--danger">
            <strong>Invalid backup JSON</strong>
            <span>Check the JSON format and schema version before importing.</span>
          </div>
        ) : null}
        <div className="inline-actions">
          <button type="button" className="primary-button" onClick={() => void handleImport()} disabled={!importPreview || isImporting}>
            <IconGlyph name="import" />
            {isImporting ? 'Importing...' : 'Import and replace'}
          </button>
          <button type="button" className="soft-button soft-button--danger" onClick={() => void handleClear()}>
            Clear local data
          </button>
        </div>
      </section>

      <section className="panel panel--dense">
        <div className="panel__header panel__header--compact">
          <h2>Diagnostics</h2>
        </div>
        <div className="setting-row">
          <div>
            <strong>IndexedDB records</strong>
            <span>{data.transactions.length} transactions · {data.wallets.length} wallets · {data.categories.length} categories</span>
          </div>
          <button type="button" className="icon-button icon-button--ghost" onClick={() => void db.open()} aria-label="Open database connection">
            <IconGlyph name="spark" />
          </button>
        </div>
      </section>

      {data.wallets.length === 0 ? <EmptyState icon="wallet" title="No wallets configured" description="Add a wallet to start recording transactions." action={<button type="button" className="primary-button" onClick={() => openWalletSheet()}>Add wallet</button>} /> : null}
    </div>
  );
}
