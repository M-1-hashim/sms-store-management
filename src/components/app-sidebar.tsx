'use client'

import { useAppStore, type Page } from '@/lib/store'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Receipt, 
  Warehouse, 
  Tags, 
  Users, 
  Truck, 
  DollarSign, 
  BarChart3, 
  ChevronRight,
  Store
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const navItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { page: 'pos', label: 'صندوق فروش', icon: ShoppingCart },
  { page: 'products', label: 'محصولات', icon: Package },
  { page: 'categories', label: 'دسته‌بندی‌ها', icon: Tags },
  { page: 'inventory', label: 'موجودی', icon: Warehouse },
  { page: 'sales', label: 'تاریخچه فروش', icon: Receipt },
  { page: 'customers', label: 'مشتریان', icon: Users },
  { page: 'suppliers', label: 'تأمین‌کنندگان', icon: Truck },
  { page: 'expenses', label: 'هزینه‌ها', icon: DollarSign },
  { page: 'reports', label: 'گزارش‌ها', icon: BarChart3 },
]

export function AppSidebar() {
  const { currentPage, setCurrentPage, sidebarOpen } = useAppStore()

  return (
    <aside
      className={cn(
        'fixed top-0 right-0 z-40 h-screen bg-card border-l border-border transition-all duration-300 flex flex-col',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 p-4 h-16 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shrink-0">
          <Store className="w-5 h-5" />
        </div>
        {sidebarOpen && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold truncate">مدیریت فروشگاه</span>
            <span className="text-xs text-muted-foreground truncate">سیستم جامع</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.page
            return (
              <Button
                key={item.page}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 h-10 transition-all duration-200',
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'text-muted-foreground hover:text-foreground',
                  !sidebarOpen && 'justify-center px-2'
                )}
                onClick={() => setCurrentPage(item.page)}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && (
                  <span className="truncate">{item.label}</span>
                )}
                {sidebarOpen && isActive && (
                  <ChevronRight className="w-4 h-4 mr-auto opacity-50" />
                )}
              </Button>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      {sidebarOpen && (
        <>
          <Separator />
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                م
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium truncate">مدیر سیستم</span>
                <span className="text-xs text-muted-foreground truncate">ادمین</span>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  )
}
