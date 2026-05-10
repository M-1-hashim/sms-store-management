---
Task ID: 1
Agent: Main Agent
Task: Implement Settings page for Store Management System

Work Log:
- Added `Settings` model to Prisma schema with fields: storeName, storeNameEn, address, phone, email, logo, taxNumber, invoicePrefix, invoiceFooter, currency, itemsPerPage
- Ran `bun run db:push` to sync schema with SQLite database
- Created `/api/settings` route with GET (fetch/create) and PUT (update) methods
- Created `/api/backup` route with GET (list/download/delete) and POST (create/restore) methods
- Created comprehensive Settings page component with 4 tabs: Store Info, Invoice Settings, Display Settings, Backup & Restore
- Added `settings` to Page type in Zustand store
- Added Settings nav item to sidebar with Settings icon
- Added Settings dynamic import and case to page.tsx
- Integrated settings into print-invoice.ts (async fetch, dynamic rendering)
- All existing lint checks pass (no new errors)

Stage Summary:
- Settings page fully functional with 4 tabbed sections
- Logo upload with image compression (max 200x200, JPEG quality 0.8)
- Unsaved changes detection with warning banner and reset button
- Database backup/restore system with safety dialogs
- Invoice printing now uses store settings dynamically
- Files modified: schema.prisma, store.ts, app-sidebar.tsx, page.tsx, print-invoice.ts
- Files created: settings.tsx, api/settings/route.ts, api/backup/route.ts
