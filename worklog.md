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
