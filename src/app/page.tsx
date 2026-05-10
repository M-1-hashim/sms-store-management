'use client'

import { useAppStore } from '@/lib/store'
import { AppSidebar } from '@/components/app-sidebar'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSyncExternalStore } from 'react'

// Lazy imports for page components
import dynamic from 'next/dynamic'

const emptySubscribe = () => () => {}

const Dashboard = dynamic(() => import('@/components/pages/dashboard'), { ssr: false })
const Products = dynamic(() => import('@/components/pages/products'), { ssr: false })
const Categories = dynamic(() => import('@/components/pages/categories'), { ssr: false })
const POS = dynamic(() => import('@/components/pages/pos'), { ssr: false })
const Sales = dynamic(() => import('@/components/pages/sales'), { ssr: false })
const Inventory = dynamic(() => import('@/components/pages/inventory'), { ssr: false })
const Customers = dynamic(() => import('@/components/pages/customers'), { ssr: false })
const Suppliers = dynamic(() => import('@/components/pages/suppliers'), { ssr: false })
const Expenses = dynamic(() => import('@/components/pages/expenses'), { ssr: false })
const Reports = dynamic(() => import('@/components/pages/reports'), { ssr: false })

function PageContent() {
  const { currentPage } = useAppStore()

  switch (currentPage) {
    case 'dashboard': return <Dashboard />
    case 'products': return <Products />
    case 'pos': return <POS />
    case 'sales': return <Sales />
    case 'inventory': return <Inventory />
    case 'categories': return <Categories />
    case 'customers': return <Customers />
    case 'suppliers': return <Suppliers />
    case 'expenses': return <Expenses />
    case 'reports': return <Reports />
    default: return <Dashboard />
  }
}

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export default function HomePage() {
  const { sidebarOpen, toggleSidebar } = useAppStore()
  const mounted = useMounted()

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 rounded-md bg-primary/20" />
          </div>
          <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <main
        className={cn(
          'transition-all duration-300 min-h-screen',
          sidebarOpen ? 'lg:mr-64' : 'lg:mr-16'
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-14 bg-background/80 backdrop-blur-sm border-b border-border flex items-center px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            onClick={toggleSidebar}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden lg:flex"
            onClick={toggleSidebar}
          >
            <Menu className="w-4 h-4" />
          </Button>
          <div className="flex-1" />
          <div className="text-xs text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString('fa-AF', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6">
          <PageContent />
        </div>
      </main>
    </div>
  )
}
