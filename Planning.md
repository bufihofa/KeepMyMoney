# KeepMyMoney - Product & Technical Planning

## 1. Mục tiêu tài liệu

Tài liệu này mô tả thiết kế chi tiết cho ứng dụng điện thoại quản lý chi tiêu cá nhân `KeepMyMoney`, xây dựng bằng `React + Vite + TypeScript`, đóng gói Android bằng `Capacitor`, lưu dữ liệu local bằng `IndexedDB`, hỗ trợ `import/export` toàn bộ dữ liệu qua `JSON` theo hình thức `copy/paste`, và có quy trình `GitHub Actions` để build APK.

Tài liệu hướng đến 4 mục tiêu:

1. Xác định một sản phẩm có UX/UI hiện đại, dễ dùng, chuyên nghiệp.
2. Xác định kiến trúc kỹ thuật rõ ràng, dễ mở rộng, offline-first.
3. Chuẩn hóa data model và business rule để implementation nhất quán.
4. Tạo nền tảng để phát triển MVP nhanh nhưng vẫn có khả năng nâng cấp lên sản phẩm hoàn chỉnh.

---

## 2. Tầm nhìn sản phẩm

### 2.1. Tuyên ngôn sản phẩm

`KeepMyMoney` là ứng dụng quản lý tài chính cá nhân theo hướng:

- Ghi nhận chi tiêu cực nhanh.
- Quan sát sức khỏe tài chính qua dashboard, ngân sách và insight.
- Hoạt động tốt ngay cả khi không có mạng.
- Tôn trọng quyền riêng tư vì dữ liệu được lưu local.

### 2.2. Đối tượng người dùng

1. Người đi làm muốn theo dõi chi tiêu hằng ngày.
2. Người có nhiều ví/tài khoản muốn tổng hợp dòng tiền tại một nơi.
3. Người muốn đặt budget tháng và biết mình đang an toàn hay sắp vượt hạn mức.
4. Người muốn chủ động sao lưu dữ liệu bằng JSON thay vì phụ thuộc cloud.

### 2.3. Giá trị cốt lõi

- `Nhanh`: mở app lên là thêm được giao dịch.
- `Rõ`: số liệu rõ ràng, nhìn là hiểu.
- `Tin cậy`: dữ liệu local, không phụ thuộc server.
- `Mở rộng tốt`: kiến trúc đủ sạch để thêm recurring, goals, notifications, cloud sync trong tương lai.

---

## 3. Phạm vi tính năng

### 3.1. MVP bắt buộc

1. Quản lý ví/tài khoản.
2. Quản lý giao dịch thu, chi, chuyển tiền.
3. Dashboard tổng quan tài chính.
4. Budget theo tháng.
5. Insights và báo cáo theo thời gian, danh mục, ví.
6. Import/export toàn bộ dữ liệu bằng JSON qua copy/paste.
7. Settings cho theme, currency, week start, data management.

### 3.2. Mở rộng sau MVP

- Giao dịch lặp lại.
- Mục tiêu tiết kiệm.
- Nhắc nhở ghi chi tiêu.
- Calendar view.
- PIN/biometric app lock.
- Đa tiền tệ.
- Cloud sync tùy chọn.

---

## 4. Định hướng UI/UX

### 4.1. Phong cách hình ảnh

Hướng thiết kế đề xuất: `Calm Fintech Premium`

- Sạch, tinh tế, chuyên nghiệp, hiện đại.
- Dùng nền gradient nhẹ và các khối card có chiều sâu.
- Bo góc lớn `20-24px`, shadow mềm, không glow gắt.
- Tập trung khả năng đọc số liệu và thao tác bằng một tay.

### 4.2. Typography

- Font UI: `Plus Jakarta Sans`.
- Font hiển thị số tiền/thống kê: `IBM Plex Mono`.
- Scale gợi ý:
  - `12`: meta text.
  - `14`: label/phụ đề.
  - `16`: body mặc định.
  - `20`: section title.
  - `28-36`: hero metric.

### 4.3. Color system

```text
Primary 700: #0F766E
Primary 500: #14B8A6
Success:     #16A34A
Warning:     #F59E0B
Danger:      #F97316
Neutral 950: #0F172A
Neutral 800: #1E293B
Neutral 600: #475569
Neutral 200: #E2E8F0
Neutral 50:  #F8FAFC
```

### 4.4. Nguyên tắc UX

1. `Fast Capture`: thêm giao dịch trong 2-3 thao tác.
2. `Data Clarity`: mọi số liệu tài chính phải đọc nhanh được trên mobile.
3. `Local First Confidence`: dữ liệu được lưu ngay, không chờ đồng bộ.
4. `Safe Editing`: import đè, xóa dữ liệu, xóa ví phải có preview/confirm rõ ràng.
5. `Professional Calm`: đẹp nhưng tiết chế, tạo cảm giác tin cậy như sản phẩm fintech tốt.

### 4.5. Motion design

Animation phải có mục đích và tiết chế:

- Bottom sheet spring khi thêm/sửa giao dịch.
- Stagger reveal cho dashboard cards.
- Count-up cho các hero metrics.
- Morph transition khi mở FAB thành form nhập liệu.
- Smooth chart transitions khi đổi time range.
- Swipe actions cho danh sách giao dịch.

Không làm:

- Animation quá dài gây chậm.
- Flashy effect trên mọi thành phần.
- Layout nhảy mạnh làm mất ngữ cảnh.

---

## 5. Kiến trúc thông tin và điều hướng

### 5.1. Navigation model

Dùng `Bottom Tab Navigation` + `Floating Action Button` ở giữa.

5 khu vực chính:

1. `Home`
2. `Transactions`
3. `Add` qua FAB
4. `Budgets`
5. `Insights`

`Settings` được mở qua avatar/menu ở header.

### 5.2. Sơ đồ màn hình

```text
Splash
-> Onboarding
-> Home
   -> Quick Add Transaction
   -> Transaction Detail
   -> Wallet Overview
   -> Settings
Transactions
-> Search / Filter
-> Transaction Detail
-> Edit Transaction
Budgets
-> Budget Detail
-> Create/Edit Budget
Insights
-> Category Analysis
-> Cashflow Trend
-> Wallet Analysis
Settings
-> Wallet Management
-> Category Management
-> Data Import/Export
-> Preferences
```

### 5.3. Mô hình điều hướng chi tiết

- `Home`: màn hình vào chính, tập trung tổng quan và thao tác nhanh.
- `Transactions`: lịch sử đầy đủ, search/filter mạnh.
- `FAB`: luôn hiện để thêm giao dịch nhanh.
- `Budgets`: theo dõi mức sử dụng ngân sách.
- `Insights`: phân tích xu hướng và hành vi chi tiêu.

---

## 6. Thiết kế chi tiết từng màn hình

## 6.1. Splash + Onboarding

### Mục tiêu

- Tạo ấn tượng đầu tiên hiện đại, cao cấp.
- Giải thích rất ngắn giá trị của app.
- Cho phép thiết lập nhanh các thông số cốt lõi.

### Nội dung

1. Splash
   - Logo KeepMyMoney.
   - Gradient nền nhẹ với blur shapes.
   - Tagline: `Track clearly. Spend intentionally.`

2. Onboarding 3 bước
   - Bước 1: Ghi chi tiêu nhanh và rõ.
   - Bước 2: Theo dõi budget và insight.
   - Bước 3: Dữ liệu local, backup bằng JSON.

3. Initial setup
   - Chọn currency.
   - Chọn ngày bắt đầu tuần.
   - Tạo ví đầu tiên.
   - Nút `Start Using App`.

### UX notes

- Có `Skip`.
- Toàn bộ onboarding nên hoàn thành trong dưới 1 phút.
- Nếu đã có dữ liệu trong IndexedDB thì bỏ qua onboarding.

## 6.2. Home Dashboard

### Mục tiêu

Mở app lên là hiểu ngay tình hình tài chính hiện tại.

### Các khối nội dung

1. Header
   - Lời chào theo thời điểm.
   - Shortcut vào settings.
   - Bộ lọc thời gian nhanh: `This Month`, `This Week`, `Custom`.

2. Hero Summary Card
   - Tổng thu.
   - Tổng chi.
   - Net cashflow.
   - So sánh với kỳ trước.

3. Budget Pulse
   - 3-5 budget quan trọng nhất.
   - Thanh tiến độ và trạng thái `safe/watch/danger/over`.

4. Spending Breakdown
   - Donut chart theo danh mục.
   - Chạm vào segment để drill-down.

5. Recent Transactions
   - 5-10 giao dịch gần nhất.
   - Swipe trái để sửa, swipe phải để nhân bản.

6. Quick Actions
   - Add Expense.
   - Add Income.
   - Transfer.
   - New Budget.

### UX notes

- Sticky time filter.
- Pull-to-refresh chỉ kích hoạt recalculate dữ liệu local.
- Khi đổi period, các card và chart update bằng animation mượt.

## 6.3. Transactions

### Mục tiêu

Xem lịch sử đầy đủ, tìm kiếm nhanh, lọc sâu và thao tác nhanh.

### Cấu trúc

1. Search bar sticky.
2. Filter chips:
   - Type.
   - Wallet.
   - Category.
   - Tag.
   - Date range.
   - Amount range.
3. Summary strip:
   - Tổng số giao dịch theo filter.
   - Tổng thu/tổng chi theo filter.
4. Grouped list theo ngày.

### Empty states

- Chưa có giao dịch.
- Không có kết quả theo bộ lọc.

### Interaction

- Swipe left: edit.
- Swipe right: duplicate.
- Long press: future multi-select mode.

## 6.4. Quick Add / Transaction Form

### Dạng hiển thị

Mở bằng `bottom sheet` full-height từ FAB.

### Trường dữ liệu

- Type: `expense | income | transfer`
- Amount
- Wallet
- To Wallet với transfer
- Category
- Date & time
- Note
- Tags

### UX chi tiết

- Amount là điểm nhấn trung tâm.
- Numeric keypad thân thiện mobile.
- Wallet/category dùng selector card thay vì dropdown thuần.
- Focus vào amount ngay khi mở form.
- Có `Save` và `Save & Add Another`.
- Lưu xong hiện toast ngắn + animation đóng sheet.

### Validation

- `amount > 0`
- Wallet bắt buộc.
- Category bắt buộc với expense/income.
- Transfer phải có `fromWallet != toWallet`.

## 6.5. Transaction Detail

- Hiển thị amount lớn, rõ.
- Metadata: ngày giờ, ví, danh mục, tag, ghi chú.
- Actions: edit, duplicate, delete.
- Transfer hiển thị rõ ví nguồn và ví đích.
- Delete dùng confirm sheet.

## 6.6. Budgets

### Mục tiêu

Giúp người dùng kiểm soát chi tiêu theo tháng trực quan và có định hướng hành động.

### Thành phần

1. Budget overview
   - Tổng budget.
   - Đã dùng.
   - Còn lại.

2. Budget cards
   - Theo danh mục.
   - Progress bar.
   - Đã dùng / hạn mức.
   - Dự báo tới cuối kỳ.

3. Budget detail
   - Daily burn chart.
   - Danh sách giao dịch liên quan.
   - Insight: `Nếu giữ tốc độ hiện tại, bạn sẽ vượt vào ngày X`.

### Trạng thái budget

- `Safe`: < 70%
- `Watch`: 70% - 90%
- `Danger`: > 90%
- `Over`: > 100%

## 6.7. Insights

### Mục tiêu

Biến dữ liệu giao dịch thành insight hữu ích, không chỉ là nhật ký chi tiêu.

### Modules

1. Cashflow trend.
2. Category analysis.
3. Wallet distribution.
4. Spending patterns theo ngày/khung giờ.
5. Comparative insights kỳ này vs kỳ trước.

### UX

- Preset chips cho time range.
- Drill-down từ chart sang transaction list đã filter sẵn.
- Ưu tiên chart ít loại nhưng thật rõ, tránh dashboard quá tải.

## 6.8. Wallet Management

- Tạo/sửa/archive ví.
- Chọn loại ví, màu, icon.
- Đặt opening balance.
- Sắp xếp thứ tự hiển thị.
- MVP không cho xóa ví đã có giao dịch, chỉ archive.

## 6.9. Category Management

- Tách `expense` và `income`.
- Chọn màu, icon.
- Có bộ category mặc định khi cài app lần đầu.
- Category hệ thống nên chỉ cho hide, không xóa.

## 6.10. Settings

### Nhóm cài đặt

1. Preferences
   - Currency.
   - Theme.
   - Week start.
   - Number/date formatting.

2. Data
   - Export JSON.
   - Import JSON.
   - Clear local data.

3. App
   - Version.
   - Build info.
   - Privacy note.

## 6.11. Data Import / Export Screen

### Export flow

1. Vào `Settings > Data`.
2. Bấm `Generate Backup JSON`.
3. App tạo snapshot hoàn chỉnh.
4. Hiển thị textarea readonly chứa JSON.
5. Có nút `Copy to Clipboard`.
6. Hiển thị metadata:
   - app version
   - schema version
   - generatedAt
   - số lượng records

### Import flow

1. Paste JSON vào textarea.
2. Validate JSON syntax.
3. Validate schema version.
4. Preview:
   - số wallets
   - số transactions
   - số budgets
   - exportedAt
5. User chọn `Replace local data`.
6. Confirm lần 2.
7. App import trong transaction, recalculate derived data, reload app shell.

### Nguyên tắc

- MVP chỉ hỗ trợ `full snapshot replace`.
- Không làm merge ở MVP để tránh mơ hồ.
- Nếu schema cũ hơn thì migrate.
- Nếu schema mới hơn app hiện tại thì chặn import và báo cần update app.

---

## 7. Data model và IndexedDB design

### 7.1. Lựa chọn kỹ thuật

Dùng `Dexie` để quản lý `IndexedDB` vì:

- API gọn, dễ maintain.
- Hỗ trợ versioning và migration rõ ràng.
- Dễ kết hợp với React qua `liveQuery`.

### 7.2. Database schema đề xuất

Tên DB: `keepmy-money-db`

#### Bảng `app_meta`

- `key`
- `value`

Mục đích:

- theme
- currency
- weekStart
- onboardingCompleted
- schemaVersion

#### Bảng `wallets`

- `id`
- `name`
- `type` (`cash | bank | ewallet | savings | other`)
- `currency`
- `openingBalance`
- `currentBalanceCache`
- `color`
- `icon`
- `isArchived`
- `sortOrder`
- `createdAt`
- `updatedAt`

Indexes:

- `id`
- `type`
- `isArchived`
- `sortOrder`

#### Bảng `categories`

- `id`
- `name`
- `kind` (`expense | income`)
- `icon`
- `color`
- `isSystem`
- `isHidden`
- `sortOrder`
- `createdAt`
- `updatedAt`

Indexes:

- `id`
- `kind`
- `isHidden`
- `sortOrder`

#### Bảng `tags`

- `id`
- `name`
- `color`
- `createdAt`

#### Bảng `transactions`

- `id`
- `type` (`expense | income | transfer`)
- `amount`
- `walletId`
- `toWalletId`
- `categoryId`
- `tagIds`
- `note`
- `occurredAt`
- `createdAt`
- `updatedAt`
- `deletedAt`

Indexes:

- `id`
- `type`
- `walletId`
- `toWalletId`
- `categoryId`
- `occurredAt`
- `[walletId+occurredAt]`
- `[categoryId+occurredAt]`

#### Bảng `budgets`

- `id`
- `categoryId`
- `periodType` (`monthly`)
- `periodKey` (ví dụ `2026-03`)
- `limitAmount`
- `alertThresholds`
- `createdAt`
- `updatedAt`

Indexes:

- `id`
- `categoryId`
- `periodKey`
- `[categoryId+periodKey]`

#### Bảng `recurring_rules` (future-ready)

- `id`
- `transactionTemplate`
- `frequency`
- `nextRunAt`
- `isActive`

#### Bảng `snapshots`

- `id`
- `schemaVersion`
- `generatedAt`
- `payload`

Dùng cho:

- log import/export nội bộ
- rollback tạm trong future phase

### 7.3. Derived data

Không lưu nếu có thể tính lại:

- total income theo kỳ
- total expense theo kỳ
- budget usage
- analytics metrics

Có thể cache:

- `wallet.currentBalanceCache`

Cache phải được recalculate khi:

- thêm/sửa/xóa transaction
- import dữ liệu
- archive wallet

### 7.4. Business rules

1. `Expense`
   - Trừ vào wallet nguồn.

2. `Income`
   - Cộng vào wallet.

3. `Transfer`
   - Trừ wallet nguồn, cộng wallet đích.
   - Không tính vào income/expense summary.

4. `Budget`
   - Chỉ tính trên transaction `expense`.
   - Không tính transfer.

5. `Archive wallet`
   - Không làm mất lịch sử giao dịch.
   - Wallet archived không xuất hiện trong quick add mặc định.

---

## 8. Kiến trúc frontend

### 8.1. Stack đề xuất

- `React`
- `Vite`
- `TypeScript`
- `React Router`
- `Dexie`
- `Zustand`
- `React Hook Form`
- `Zod`
- `Framer Motion`
- `date-fns`
- `Recharts` hoặc `visx`
- `Capacitor`

### 8.2. Nguyên tắc kiến trúc

1. Tách `domain`, `storage`, `ui`, `features`.
2. Không để component UI truy cập IndexedDB trực tiếp.
3. Mọi dữ liệu nhập đều đi qua schema validation.
4. Summary/analytics nên được tính qua service layer hoặc selector layer.
5. Ưu tiên custom hooks tái sử dụng thay vì nhét business logic vào page component.

### 8.3. Cấu trúc thư mục đề xuất

```text
src/
  app/
    router/
    providers/
    layout/
  components/
    ui/
    charts/
    motion/
  features/
    dashboard/
    transactions/
    budgets/
    insights/
    wallets/
    categories/
    settings/
    import-export/
  db/
    dexie.ts
    schema.ts
    migrations.ts
  domain/
    models/
    services/
    selectors/
    formatters/
    validators/
  hooks/
  lib/
  styles/
  assets/
```

### 8.4. State management

1. `Persistent state`
   - Lưu trong IndexedDB.
   - Ví dụ: wallets, categories, transactions, budgets, preferences.

2. `UI state`
   - Quản lý bằng Zustand.
   - Ví dụ: filter hiện tại, tab đang mở, trạng thái sheet.

3. `Derived state`
   - Tính qua selectors/services.
   - Ví dụ: dashboard summary, chart data, budget usage.

### 8.5. Data flow

```text
User action
-> Form validation (Zod + RHF)
-> Feature service
-> Dexie repository
-> IndexedDB updated
-> liveQuery / selector recompute
-> UI rerender + motion feedback
```

---

## 9. Design system và component inventory

### 9.1. Spacing & radius

- 4pt grid.
- Section padding: `16-20`.
- Card padding: `16`.
- Radius:
  - small `12`
  - medium `18`
  - large `24`

### 9.2. Components cốt lõi

1. AppShell
2. HeaderBar
3. TimeRangeSwitcher
4. SummaryCard
5. WalletChip
6. CategoryPill
7. BudgetProgressCard
8. TransactionRow
9. FloatingActionButton
10. BottomSheet
11. InsightChartCard
12. EmptyState
13. JSONPreviewBox
14. ConfirmActionSheet
15. SegmentedControl
16. SearchFilterBar

### 9.3. Trạng thái chuẩn cho component

Mọi component khối lớn đều nên có đủ các state:

- default
- loading skeleton
- empty
- error nhẹ
- disabled nếu cần

---

## 10. Animation system

### 10.1. Timing guidelines

- Micro interactions: `150-220ms`.
- Sheet/dialog transitions: `240-320ms`.
- Dùng `spring` cho bottom sheet, `ease-out` cho content fade/slide.

### 10.2. Animation map

1. App load
   - Logo fade + content rise `12px`.

2. Dashboard cards
   - Stagger `40ms` mỗi item.

3. Add transaction
   - FAB morph thành bottom sheet.

4. Transaction success
   - Toast trượt lên, amount flash rất nhẹ.

5. Budget threshold change
   - Progress bar highlight mềm khi qua mốc 70% hoặc 90%.

6. Charts
   - Animate line/arc khi đổi period.

---

## 11. Accessibility và usability

1. Contrast đạt mức AA.
2. Touch target tối thiểu `44x44`.
3. Không dùng màu là tín hiệu duy nhất cho trạng thái budget.
4. Icon-only buttons phải có label/accessibility text.
5. Dark mode hỗ trợ ngay từ đầu.
6. Form amount tối ưu cho keyboard số.
7. Layout hỗ trợ safe-area trên thiết bị có notch.

---

## 12. Bảo mật và riêng tư

### Nguyên tắc

- MVP không cần backend.
- Dữ liệu nằm trên thiết bị người dùng.
- Import/export là hành động chủ động của người dùng.

### Đề xuất bảo vệ dữ liệu

- Confirm 2 bước cho import đè và clear data.
- Hiển thị warning banner khi JSON import sẽ thay thế toàn bộ dữ liệu local.
- Future phase: app lock bằng PIN/biometric qua Capacitor plugin.

---

## 13. Import/Export JSON specification

### 13.1. Mục tiêu

Cho phép sao lưu/phục hồi toàn bộ data ở dạng text để:

- copy vào note app
- gửi qua kênh khác
- lưu trong password manager hoặc cloud note nếu người dùng muốn

### 13.2. Cấu trúc đề xuất

```json
{
  "app": "KeepMyMoney",
  "schemaVersion": 1,
  "exportedAt": "2026-03-10T09:00:00.000Z",
  "meta": {
    "currency": "VND",
    "theme": "system",
    "weekStart": "monday"
  },
  "wallets": [],
  "categories": [],
  "tags": [],
  "transactions": [],
  "budgets": []
}
```

### 13.3. Quy tắc import

1. Parse JSON.
2. Validate bằng Zod schema.
3. Check `app === "KeepMyMoney"`.
4. Check `schemaVersion`.
5. Validate quan hệ:
   - transaction.walletId phải tồn tại.
   - budget.categoryId phải tồn tại.
6. Nếu hợp lệ:
   - clear DB trong transaction.
   - bulk insert theo thứ tự: meta -> wallets -> categories -> tags -> transactions -> budgets.
   - recalculate cache.

### 13.4. Migration strategy

- `schemaVersion` bằng nhau: import trực tiếp.
- `schemaVersion` cũ hơn: chạy migration import.
- `schemaVersion` mới hơn app hiện tại: chặn import và báo cần update app.

---

## 14. Logic budget và analytics

### 14.1. Budget calculation

`budgetUsage = totalExpenseInPeriod / limitAmount`

Trong đó:

- `totalExpenseInPeriod` lấy theo `categoryId + periodKey`.
- Bỏ qua `income` và `transfer`.
- Bỏ qua transaction đã soft-delete.

### 14.2. Insight metrics quan trọng

1. Total income.
2. Total expense.
3. Net cashflow.
4. Average daily spend.
5. Highest spending category.
6. Wallet balance distribution.
7. Month-over-month change.
8. Largest transaction.

### 14.3. Drill-down behavior

Mọi insight card quan trọng đều phải drill-down được sang transaction list đã áp filter tương ứng.

Ví dụ:

- Chạm danh mục `Food` trên donut chart.
- App mở Transactions với filter `category = Food`, `period = current month`.

---

## 15. Capacitor và mobile packaging

### 15.1. Mục tiêu

Dùng `Capacitor` để đóng gói web app thành Android APK nhưng vẫn giữ codebase React/Vite thống nhất.

### 15.2. Cấu hình đề xuất

- `appId`: `com.keepmymoney.app`
- `appName`: `KeepMyMoney`
- `webDir`: `dist`

### 15.3. Plugin ưu tiên

MVP:

- App
- Splash Screen
- Status Bar
- Keyboard
- Haptics
- Clipboard

Future phase:

- Local Notifications
- Biometric / Secure Storage

### 15.4. Mobile UX notes

- Tối ưu cho thao tác một tay.
- Bottom nav/FAB có kích thước đủ chạm.
- Form nhập tiền ưu tiên cảm giác gần native.
- Cần xử lý safe-area, keyboard overlap, smooth scrolling.

---

## 16. GitHub Actions và đề xuất sửa build-apk.yml

### 16.1. Mục tiêu pipeline

Pipeline cần:

1. Build web app từ Vite.
2. Sync Capacitor Android.
3. Build `debug APK` cho kiểm tra thường xuyên.
4. Build `release APK` khi manual dispatch.
5. Upload artifact với tên đúng theo sản phẩm.

### 16.2. Nhận xét workflow hiện tại

File [`.github/workflows/build-apk.yml`](/D:/VSFNODE22/KeepMyMoney/.github/workflows/build-apk.yml) đã có nền tảng tốt nhưng cần chỉnh để khớp app mới:

1. Tên artifact hiện là `MakeUsBetter`, cần đổi thành `KeepMyMoney`.
2. Nếu app vẫn nằm trong `frontend/` thì giữ trigger path hiện tại là hợp lý.
3. Bước `google-services.json` có thể bỏ nếu app local-first không dùng Firebase.
4. Nên thêm `concurrency` để tránh nhiều build chồng nhau trên cùng branch.
5. Nên chuẩn hóa debug/release naming rõ ràng.
6. Khi dự án vào giai đoạn code ổn định, nên thêm `lint` và `test` trước khi build APK.

### 16.3. Cấu trúc workflow đề xuất

- Trigger:
  - `push` vào `main` khi thay đổi `frontend/**` hoặc workflow file.
  - `workflow_dispatch` cho build thủ công.
- Jobs:
  - `build-debug` chạy trên push và manual.
  - `build-release` chỉ chạy trên manual khi có signing secrets.
- Steps:
  1. Checkout.
  2. Setup Node 22.
  3. Setup Java 21.
  4. `npm ci`.
  5. `npm run build`.
  6. `npx cap sync android`.
  7. `./gradlew assembleDebug` hoặc `assembleRelease`.
  8. Upload artifact.

### 16.4. Workflow mẫu đề xuất

```yaml
name: Build Android APK

permissions:
  contents: write

on:
  push:
    branches: [main]
    paths:
      - "frontend/**"
      - ".github/workflows/build-apk.yml"
  workflow_dispatch:

concurrency:
  group: build-apk-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build-debug:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Build web
        working-directory: frontend
        run: npm run build

      - name: Sync Capacitor
        working-directory: frontend
        run: npx cap sync android

      - name: Make gradlew executable
        working-directory: frontend/android
        run: chmod +x ./gradlew

      - name: Build debug APK
        working-directory: frontend/android
        run: ./gradlew assembleDebug

      - name: Upload debug artifact
        uses: actions/upload-artifact@v4
        with:
          name: KeepMyMoney-debug
          path: frontend/android/app/build/outputs/apk/debug/app-debug.apk

  build-release:
    if: github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
      - name: Install dependencies
        working-directory: frontend
        run: npm ci
      - name: Build web
        working-directory: frontend
        run: npm run build
      - name: Sync Capacitor
        working-directory: frontend
        run: npx cap sync android
      - name: Decode keystore
        working-directory: frontend/android
        run: echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > keystore.jks
      - name: Make gradlew executable
        working-directory: frontend/android
        run: chmod +x ./gradlew
      - name: Build release APK
        working-directory: frontend/android
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: ./gradlew assembleRelease
      - name: Upload release artifact
        uses: actions/upload-artifact@v4
        with:
          name: KeepMyMoney-release
          path: frontend/android/app/build/outputs/apk/release/app-release.apk
```

### 16.5. Ghi chú thực thi

- Nếu không dùng Firebase, bỏ hẳn bước `google-services.json`.
- Nếu muốn phát hành bản build gần nhất qua GitHub Release, có thể giữ `softprops/action-gh-release`.
- Khi triển khai thực tế, cần đồng bộ tên app, artifact và package name theo `KeepMyMoney`.

---

## 17. Kiểm thử và quality gate

### 17.1. Test levels

1. Unit test
   - Tính tổng thu/chi.
   - Budget calculation.
   - Import/export validation.
   - Migration logic.

2. Component test
   - Transaction form validation.
   - Budget card states.
   - Import preview screen.

3. E2E test
   - Tạo giao dịch.
   - Export JSON.
   - Import JSON.
   - Budget warning.

### 17.2. Công cụ đề xuất

- `Vitest`
- `Testing Library`
- `Playwright`

### 17.3. Definition of Done

Một tính năng được xem là hoàn thành khi:

1. Có UI đúng design system.
2. Có validation và empty/error/loading states.
3. Có test cho business logic quan trọng.
4. Không làm vỡ schema import/export.
5. Chạy được trong web shell và Android shell.

---

## 18. Lộ trình implementation đề xuất

### Phase 1 - Foundation

- Khởi tạo React + Vite + TS.
- Setup router, Dexie, Zustand, RHF, Zod.
- Tạo design tokens, AppShell, navigation.
- Setup Capacitor Android.

### Phase 2 - Core data

- Wallets.
- Categories.
- Transactions CRUD.
- Balance recalc.

### Phase 3 - Dashboard + Budgets

- Dashboard summary.
- Recent transactions.
- Monthly budgets.
- Budget alerts UI.

### Phase 4 - Insights + Import/Export

- Analytics charts.
- Export JSON copy.
- Import JSON paste + preview + replace.

### Phase 5 - Polish

- Motion system.
- Dark mode.
- Empty states.
- Performance pass.
- CI/CD APK build.

---

## 19. Rủi ro và cách giảm thiểu

1. `IndexedDB complexity`
   - Giảm bằng Dexie + migration strategy rõ ràng.

2. `Import overwrite nguy hiểm`
   - Giảm bằng preview + confirm 2 bước + snapshot tạm.

3. `Chart performance trên mobile`
   - Giảm bằng data aggregation trước khi render.

4. `Android build workflow phức tạp`
   - Giảm bằng chuẩn hóa Capacitor config và GitHub Actions từ sớm.

5. `UI đẹp nhưng khó maintain`
   - Giảm bằng design tokens + reusable components.

---

## 20. Kết luận

`KeepMyMoney` nên được xây dựng như một ứng dụng quản lý chi tiêu `offline-first`, hiện đại, chuyên nghiệp và rất dễ mở rộng. Hướng thiết kế này không chỉ giải quyết nhu cầu ghi chép chi tiêu cơ bản, mà còn tạo nền tảng vững chắc cho budget, insight tài chính cá nhân, backup/restore minh bạch, và mobile packaging rõ ràng.

Tài liệu này nên được xem là `single source of truth` cho giai đoạn thiết kế và implementation ban đầu.
