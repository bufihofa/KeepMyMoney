# KeepMyMoney

Ung dung quan ly chi tieu ca nhan local-first, xay dung bang React + Vite + TypeScript, luu du lieu bang IndexedDB, dong goi Android qua Capacitor, va ho tro backup/restore bang JSON copy-paste.

## Tinh nang da implement

- Dashboard tong quan voi cashflow, top category, recent transactions.
- Transactions ledger voi search, filter, duplicate, edit, delete.
- Monthly budgets voi progress va projected spend.
- Insights voi chart cashflow, category concentration, wallet distribution.
- Settings cho theme, currency, week start, wallets, categories.
- Import/export JSON toan bo du lieu.
- Onboarding local-first va option sample data.
- GitHub Actions build Debug/Release APK bang Capacitor.

## Chay local

```bash
cd frontend
npm install
npm run dev
```

Web app mac dinh chay tai [http://localhost:5173](http://localhost:5173).

## Build production

```bash
cd frontend
npm run build
```

## Android voi Capacitor

Lan dau tien:

```bash
cd frontend
npm install
npm run build
npm run android:add
npm run android:sync
npm run android:open
```

Sau khi da co Android project local:

```bash
cd frontend
npm run build
npm run android:sync
npm run android:open
```

## Ghi chu du lieu

- Du lieu duoc luu trong IndexedDB tren thiet bi/trinh duyet.
- Import JSON se thay the toan bo local data sau khi xac nhan.
- Export JSON tao snapshot day du de copy/paste backup.

## APK build tren GitHub Actions

Workflow nam tai [`.github/workflows/build-apk.yml`](/D:/VSFNODE22/KeepMyMoney/.github/workflows/build-apk.yml).

- `push` len `main` se build Debug APK.
- `workflow_dispatch` se build ca Debug va Release APK.
- Workflow tu tao Android platform neu repo chua commit thu muc `frontend/android`.

## Tai lieu planning

- [Planning.md](/D:/VSFNODE22/KeepMyMoney/Planning.md)
