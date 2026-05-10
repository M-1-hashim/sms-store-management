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

---
Task ID: 2
Agent: Main Agent
Task: Add Dark/Light mode toggle and Calculator

Work Log:
- Created `ThemeProvider` wrapper component (src/components/theme-provider.tsx) using next-themes
- Updated layout.tsx to wrap app with ThemeProvider (attribute="class", defaultTheme="light", enableSystem)
- Created ThemeToggle component (src/components/theme-toggle.tsx) with Sun/Moon icon button in top bar
- Created AppCalculator component (src/components/calculator.tsx) as floating button with full calculator
- Added ThemeToggle to header bar in page.tsx
- Added AppCalculator floating button to page.tsx
- Added theme selection UI to Settings page (Display tab) with 3 options: Light/Dark/System
- Used useSyncExternalStore for hydration-safe mounting
- All lint checks pass (only pre-existing electron/main.js errors)

Stage Summary:
- Dark/Light mode fully functional with next-themes
- Theme toggle in top bar (quick access) + Settings page (3 visual options)
- Floating calculator with Persian digits, full keyboard support, and history
- Files modified: layout.tsx, page.tsx, settings.tsx
- Files created: theme-provider.tsx, theme-toggle.tsx, calculator.tsx

---
Task ID: 3
Agent: Main Agent
Task: Add auto-backup and file upload restore

Work Log:
- Added autoBackup, backupFrequency, backupKeepCount, lastAutoBackup fields to Settings model in Prisma schema
- Ran `bun run db:push` to sync schema
- Updated `/api/settings` PUT endpoint to handle new auto-backup fields
- Updated `/api/backup` GET endpoint with `?action=auto` for auto-backup check/creation:
  - Checks settings.autoBackup flag
  - Compares lastAutoBackup timestamp with frequency (hourly/daily/weekly/monthly)
  - Creates backup if due, updates lastAutoBackup timestamp
  - Cleans old auto-backups beyond backupKeepCount
- Updated `/api/backup` POST endpoint to accept `multipart/form-data` for file upload:
  - Accepts .db, .sqlite, .sqlite3 files (max 100MB)
  - Creates pre-restore backup before replacing database
  - Validates file type before processing
- Updated backup list response to include `type` field ('auto' or 'manual')
- Created auto-backup mini-service (mini-services/auto-backup/index.ts):
  - Runs on port 3010, checks every 5 minutes
  - Calls /api/backup?action=auto to trigger backup via Next.js API
  - Uses bun --hot for auto-restart on file changes
- Updated Settings page backup tab with 3 cards:
  1. Auto-backup config (Switch toggle, frequency selector, keep count, last backup info)
  2. Manual backup + Upload file button with validation
  3. Backup list with type badges (auto=blue, manual=green)
- Added Switch, Clock, HardDriveUpload, Zap imports
- All lint checks pass

Stage Summary:
- Auto-backup system fully functional (disabled by default, user enables in settings)
- 4 frequency options: hourly, daily, weekly, monthly
- Automatic cleanup of old backups (keeps N most recent)
- File upload restore with pre-restore safety backup
- Visual distinction between auto and manual backups in list
- Files modified: schema.prisma, api/settings/route.ts, api/backup/route.ts, settings.tsx
- Files created: mini-services/auto-backup/index.ts, mini-services/auto-backup/package.json
