---
Task ID: 1
Agent: Main Orchestrator
Task: Build comprehensive Store Management System (سیستم مدریتی فروشگاه)

Work Log:
- Designed and created Prisma schema with 7 models: Category, Product, Customer, Sale, SaleItem, Expense, Supplier
- Pushed schema to SQLite database and generated Prisma client
- Created seed script with realistic Farsi data: 9 categories, 28 products, 12 customers, 18 sales, 9 expenses, 7 suppliers
- Built 14 API routes covering full CRUD for all entities plus dashboard and reports endpoints
- Created Zustand store for app navigation state and cart state management
- Updated layout.tsx with RTL support (dir="rtl", lang="fa") and Vazirmatn Farsi font
- Built AppSidebar component with 10 navigation items
- Created 10 page components: Dashboard, Products, Categories, POS, Sales, Inventory, Customers, Suppliers, Expenses, Reports
- Used dynamic imports for code splitting
- All pages use shadcn/ui components, Farsi text, proper loading skeletons, and error handling
- Lint passes cleanly

Stage Summary:
- Full-stack offline Store Management System built with Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma/SQLite
- All data stored locally in SQLite (offline-capable)
- Professional RTL Farsi UI with Vazirmatn font
- 14 API routes with consistent response format
- 10 fully functional pages with charts, tables, CRUD operations, POS interface
- Seeded with realistic Afghan store data (83,830 AFN revenue, 28 products, 18 sales)
