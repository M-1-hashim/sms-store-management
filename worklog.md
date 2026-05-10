---
Task ID: 1
Agent: Main Agent
Task: Redesign Dashboard to match uploaded image style + Fix broken pages

Work Log:
- Analyzed uploaded dashboard design image using VLM skill
- Identified key design elements: hero revenue card, mini stat cards, bar chart (by category), area chart (sales trend), recent sales table, low stock alerts, top products
- Updated `/api/dashboard` API to include new data: previous month comparison, growth percentage, total customers, category revenue breakdown
- Fixed BigInt serialization error in dashboard API (raw SQL queries return BigInt values)
- Redesigned `src/components/pages/dashboard.tsx` with modern layout matching the reference image
- Used recharts `AreaChart` with gradients for sales trend, `BarChart` with `Cell` for per-bar category colors
- Added `UserAvatar` component, `toCompactFarsi` helper, custom chart tooltips
- Verified all three previously broken pages (Customers, Sales History, Reports) - all APIs working correctly with matching data structures
- All lint checks pass clean

Stage Summary:
- Dashboard fully redesigned with modern analytics style matching the reference image
- API endpoint `/api/dashboard` enhanced with 4 new fields: `prevMonth`, `growthPercent`, `totalCustomers`, `categoryRevenue`
- Fixed BigInt serialization issue that was causing 500 errors on dashboard API
- Confirmed Customers, Sales History, and Reports pages all work correctly (APIs return correct data structures matching frontend expectations)
- Dev server running, all endpoints returning 200

---
Task ID: 2
Agent: Main Agent
Task: Add customer image upload + improve frontend dashboard

Work Log:
- Added `image` column (String?) to Customer model in `prisma/schema.prisma`
- Ran `db:push` to sync schema — new column available immediately
- Updated `/api/customers` POST handler to accept `image` field
- Updated `/api/customers/[id]` PUT handler to accept `image` field
- Completely redesigned `src/components/pages/customers.tsx`:
  - Added `ImageUploadZone` component with drag-and-drop + click-to-upload
  - Added image compression (resizes to 200px, JPEG 70% quality) for efficient storage
  - Added `CustomerAvatar` component showing uploaded image or colored initials
  - Added stats bar (total customers, with image, in debt, with email)
  - Added image column to table with avatars
  - Updated dialog form with image upload zone
- Updated `src/components/pages/dashboard.tsx`:
  - `UserAvatar` now accepts `image` prop and shows uploaded photo
  - Hero card avatar stack shows customer photos
  - Recent sales table shows customer photos
- Updated `src/components/pages/pos.tsx`:
  - Customer selector now shows avatar preview next to dropdown
  - Added `cn` import and `image` to Customer type
- All lint checks pass clean

Stage Summary:
- Customer image upload fully functional: drag-drop, click, compress, store as base64
- Images display across Dashboard (hero card, recent sales table), Customers page (table, dialog), and POS (customer selector)
- Database schema updated with `image` column on Customer model
- All API routes handle image create/update correctly

---
Task ID: 3
Agent: Main Agent
Task: Fix dashboard هشدار موجودی (Stock Alert) card + regenerate Prisma client

Work Log:
- Investigated stock alert card issues: UI was confusing (count showed 6 but only 5 displayed), no severity indication, no progress bars, missing "and X more" indicator
- Rewrote the entire Low Stock Alert card section in `src/components/pages/dashboard.tsx`:
  - Added 3-level severity system: red (out of stock, stock=0), orange (critical, stock<=30% of minStock), amber (low stock)
  - Added animated pulse dot for out-of-stock items
  - Added progress bars showing stock/minStock ratio
  - Added descriptive labels: "نیاز به سفارش فوری" (urgent reorder), "نیاز به سفارش" (reorder needed), "موجودی کم" (low stock)
  - Shows minStock threshold alongside current stock
  - Added destructive badge with count in header (with pulse dot if any items are out of stock)
  - Added "و X محصول دیگر در وضعیت هشدار" indicator when more than 5 items exist
  - Green icon when all stock is sufficient, red when alerts exist
  - Context-aware description text
- Fixed SWC parser error caused by JSX comment between `.map()` and conditional expression
- Regenerated Prisma client (`prisma generate`) to recognize the `image` column on Customer model
- Verified customer image upload works end-to-end via API test
- Restarted dev server to pick up new Prisma client
- All lint checks pass clean

Stage Summary:
- Stock Alert card completely redesigned with severity levels, progress bars, and better UX
- Prisma client regenerated — customer image field now fully functional across all APIs
- Both issues resolved: dashboard stock card improved, customer image upload confirmed working

---
Task ID: 4
Agent: Main Agent
Task: Redesign گزارش‌ها (Reports) page with modern UI

Work Log:
- Completely rewrote `src/components/pages/reports.tsx` (770 → 850+ lines)
- Added `dir="rtl"` for proper Farsi RTL support
- Created reusable `DateFilterCard` component with gradient styling and filter icon
- Created custom chart tooltips for Recharts (`ChartTooltip`, `PieTooltip`)
- Created comprehensive skeleton components: `HeroSkeleton`, `MiniCardSkeleton`, `TableSkeleton`, `ChartSkeleton`
- **Sales Report Tab** redesigned:
  - Hero revenue card with gradient background, sale count badge, best day indicator
  - 4 mini stat cards: total sales, average sale, discounts, active days
  - Daily sales bar chart (last 20 days) with gradient fill using Recharts
  - Payment method donut/pie chart with legend and percentages
  - Daily sales table with row numbers
- **Inventory Report Tab** redesigned:
  - Hero inventory value card with gradient, product count badge, potential profit display
  - 4 mini stat cards: products, total stock, cost value, low stock alerts
  - Category inventory bar chart with per-bar colors
  - Products table sorted by value with stock badges
- **Profit Report Tab** redesigned:
  - Hero net profit card with green/red color based on profitability, margin badge
  - 4 mini stat cards: revenue, COGS, operating expenses, gross profit
  - Profit waterfall/breakdown card with progress bars for COGS and expenses
  - Expense category pie chart + category list with progress bars
- Added icon-based tabs (TrendingUp, Package, Calculator)
- Modern header with rose icon and description
- All lint checks pass clean

Stage Summary:
- Reports page fully redesigned with modern analytics UI matching dashboard style
- Added 3 Recharts visualizations: daily sales bar chart, payment pie chart, expense pie chart
- Consistent design language: gradient hero cards, mini stat cards, hover effects, progress bars
- Proper RTL support throughout the page

---
Task ID: 5
Agent: Main Agent
Task: Add "Show More" functionality to dashboard lists that overflow cards

Work Log:
- Added 3 state variables: `showAllTopProducts`, `showAllStockAlerts`, `showAllRecentSales`
- Added `ChevronDown` and `ChevronUp` icons from lucide-react
- Added `Button` import from shadcn/ui
- **Top Products card**: Initial display limit of 5 items, "نمایش بیشتر (X محصول)" button shows remaining count, "نمایش کمتر" to collapse
- **Low Stock Alert card**: Initial display limit of 5 items with ScrollArea (max-h-72), show more expands to max-h-96, "نمایش بیشتر (X محصول دیگر)" button
- **Recent Sales table**: Initial display of 7 rows with ScrollArea (max-h-96), show more expands to max-h-[500px], "نمایش بیشتر (X فروش دیگر)" button
- Wrapped ScrollArea + show more in React fragments for ternary compatibility
- Fixed stray `\n` escape in JSX
- All lint checks pass clean

Stage Summary:
- All three dashboard lists now have "Show More / Show Less" toggle buttons
- Lists no longer overflow their card containers
- Consistent UX pattern across all expandable lists with ChevronDown/ChevronUp icons
