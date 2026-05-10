'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Warehouse,
  AlertTriangle,
  PackageX,
  RefreshCcw,
  TrendingDown,
  Package,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category {
  id: string
  name: string
  color: string
}

interface Product {
  id: string
  name: string
  sku: string
  categoryId: string | null
  buyPrice: number
  sellPrice: number
  stock: number
  minStock: number
  unit: string
  isActive: boolean
  category: Category | null
}

interface LowStockProduct {
  id: string
  name: string
  sku: string
  stock: number
  minStock: number
  buyPrice: number
  unit: string
}

interface DashboardData {
  totalProducts: number
  lowStockCount: number
  lowStockProducts: LowStockProduct[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(value: number): string {
  return `${value.toLocaleString('fa-AF')} افغانی`
}

function formatNumber(value: number): string {
  return value.toLocaleString('fa-AF')
}

function getStockStatus(product: Product): {
  label: string
  className: string
} {
  if (product.stock === 0) {
    return { label: 'ناموجود', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
  }
  if (product.stock <= product.minStock) {
    return { label: 'کم‌موجود', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' }
  }
  return { label: 'موجود', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lowStockLoading, setLowStockLoading] = useState(true)

  // ── Fetch all products ────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products?limit=100')
      const json = await res.json()
      if (json.success) {
        setProducts(json.data.products || [])
      }
    } catch {
      toast.error('خطا در دریافت محصولات')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Fetch dashboard data for low stock ────────────────────────────────────

  const fetchDashboard = useCallback(async () => {
    setLowStockLoading(true)
    try {
      const res = await fetch('/api/dashboard')
      const json = await res.json()
      if (json.success) {
        setDashboardData(json.data)
      }
    } catch {
      // silent
    } finally {
      setLowStockLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchDashboard()
  }, [fetchProducts, fetchDashboard])

  // ── Computed stats ────────────────────────────────────────────────────────

  const totalProducts = products.length
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= p.minStock)
  const outOfStockProducts = products.filter((p) => p.stock === 0)
  const totalInventoryValue = products.reduce((sum, p) => sum + p.stock * p.buyPrice, 0)

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Warehouse className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">مدیریت موجودی</h1>
            <p className="text-sm text-muted-foreground">
              مشاهده و مدیریت موجودی محصولات فروشگاه
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            fetchProducts()
            fetchDashboard()
          }}
        >
          <RefreshCcw className="size-4" />
          بروزرسانی
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Products */}
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">کل محصولات</p>
                <p className="mt-1 text-3xl font-bold tabular-nums">
                  {loading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    formatNumber(totalProducts)
                  )}
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Package className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">موجودی کم</p>
                <p className="mt-1 text-3xl font-bold tabular-nums">
                  {loading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    formatNumber(lowStockProducts.length)
                  )}
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="size-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            {lowStockProducts.length > 0 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                محصولات نیازمند سفارش مجدد
              </p>
            )}
          </CardContent>
        </Card>

        {/* Out of Stock */}
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ناموجود</p>
                <p className="mt-1 text-3xl font-bold tabular-nums">
                  {loading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    formatNumber(outOfStockProducts.length)
                  )}
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                <PackageX className="size-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            {outOfStockProducts.length > 0 && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                موجودی این محصولات صفر شده است
              </p>
            )}
          </CardContent>
        </Card>

        {/* Total Inventory Value */}
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ارزش کل موجودی</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {loading ? (
                    <Skeleton className="h-7 w-28" />
                  ) : (
                    formatPrice(totalInventoryValue)
                  )}
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                <DollarSign className="size-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              بر اساس قیمت خرید
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="size-4" />
            جدول موجودی محصولات
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <InventoryTableSkeleton />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Warehouse className="mb-3 size-12 opacity-30" />
              <p className="text-lg font-medium">محصولی ثبت نشده است</p>
              <p className="text-sm">ابتدا محصولات خود را اضافه کنید</p>
            </div>
          ) : (
            <div className="max-h-[480px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نام محصول</TableHead>
                    <TableHead className="text-right hidden md:table-cell">SKU</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">دسته‌بندی</TableHead>
                    <TableHead className="text-right">موجودی فعلی</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">حداقل موجودی</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">ارزش موجودی</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const status = getStockStatus(product)
                    const stockValue = product.stock * product.buyPrice
                    const isOutOfStock = product.stock === 0
                    const isLowStock = product.stock > 0 && product.stock <= product.minStock

                    return (
                      <TableRow
                        key={product.id}
                        className={
                          isOutOfStock
                            ? 'bg-red-50/60 dark:bg-red-950/15'
                            : isLowStock
                              ? 'bg-amber-50/60 dark:bg-amber-950/15'
                              : ''
                        }
                      >
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                          {product.sku}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {product.category ? (
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block size-2.5 rounded-full"
                                style={{ backgroundColor: product.category.color }}
                              />
                              {product.category.name}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="tabular-nums font-medium">
                            {formatNumber(product.stock)}
                          </span>
                          <span className="mr-1 text-xs text-muted-foreground">
                            {product.unit}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell tabular-nums text-muted-foreground">
                          {formatNumber(product.minStock)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={status.className}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell tabular-nums text-muted-foreground">
                          {formatPrice(stockValue)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alert Section */}
      {lowStockLoading ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-6 w-48" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : dashboardData && dashboardData.lowStockProducts.length > 0 ? (
        <Card className="border-amber-300 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-5" />
              هشدار کمبود موجودی
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatNumber(dashboardData.lowStockProducts.length)} محصول موجودی آن‌ها
              کمتر یا مساوی حداقل موجودی است
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboardData.lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-amber-800 dark:bg-amber-950/20"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800">
                    {product.stock === 0 ? (
                      <PackageX className="size-4 text-amber-700 dark:text-amber-300" />
                    ) : (
                      <TrendingDown className="size-4 text-amber-700 dark:text-amber-300" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.sku} · حداقل: {formatNumber(product.minStock)} {product.unit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className={
                      product.stock === 0
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                    }
                  >
                    موجودی: {formatNumber(product.stock)} {product.unit}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30"
                    onClick={() => toast.info('این قابلیت به زودی اضافه می\u200cشود')}
                  >
                    <RefreshCcw className="size-3.5" />
                    سفارش مجدد
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        !lowStockLoading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Package className="size-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="font-medium text-green-700 dark:text-green-400">
                موجودی تمام محصولات در وضعیت مطلوب است
              </p>
              <p className="text-sm">هیچ محصولی با کمبود موجودی یافت نشد</p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function InventoryTableSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-20 hidden md:block" />
          <Skeleton className="h-4 w-20 hidden lg:block" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16 hidden sm:block" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-28 hidden lg:block" />
        </div>
      ))}
    </div>
  )
}
