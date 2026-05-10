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
