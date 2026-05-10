'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  Flame,
  Wallet,
  BarChart3,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────

interface DashboardData {
  salesToday: { count: number; revenue: number }
  salesWeek: { count: number; revenue: number }
  salesMonth: { count: number; revenue: number }
  prevMonth: { count: number; revenue: number }
  growthPercent: number
  totalRevenue: number
  totalProducts: number
  totalCustomers: number
  lowStockCount: number
  lowStockProducts: Array<Record<string, unknown>>
  recentSales: RecentSale[]
  topSellingProducts: TopProduct[]
  chartData: ChartDataPoint[]
  totalExpensesThisMonth: number
  categoryRevenue: CategoryRevenue[]
}

interface RecentSale {
  id: string
  invoiceNumber: string
  totalAmount: number
  discount: number
  finalAmount: number
  paymentMethod: string
  createdAt: string
  customer: { id: string; name: string; phone: string; image?: string | null } | null
}

interface TopProduct {
  productId: string
  productName: string
  totalQuantity: number
  totalRevenue: number
}

interface ChartDataPoint {
  date: string
  sales: number
  revenue: number
}

interface LowStockProduct {
  id: string
  name: string
  sku: string
  stock: number
  minStock: number
}

interface CategoryRevenue {
  categoryId: string
  categoryName: string
  categoryColor: string
  totalRevenue: number
  totalSales: number
}

// ─── Helpers ──────────────────────────────────────────────────────────

function toFarsi(num: number): string {
  return num.toLocaleString('fa-AF')
}

function toCompactFarsi(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
  return toFarsi(num)
}

function getPaymentBadge(method: string) {
  switch (method) {
    case 'نقدی':
      return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-xs">{method}</Badge>
    case 'کارت':
    case 'کارت بانکی':
      return <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-xs">{method}</Badge>
    case 'نسیه':
      return <Badge variant="outline" className="border-amber-500 text-amber-700 text-xs">{method}</Badge>
    default:
      return <Badge variant="secondary" className="text-xs">{method}</Badge>
  }
}

function formatDateTime(dateStr: string): string {
  try {
    const d = parseISO(dateStr)
    return format(d, 'yyyy/MM/dd HH:mm')
  } catch {
    return dateStr
  }
}

// ─── Custom Tooltip for Charts ────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border bg-white p-3 shadow-xl" dir="rtl">
      <p className="mb-2 text-sm font-semibold text-gray-800">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {toFarsi(entry.value)} افغانی
        </p>
      ))}
    </div>
  )
}

function AreaChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border bg-white p-3 shadow-xl" dir="rtl">
      <p className="mb-2 text-sm font-semibold text-gray-800">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name === 'درآمد' ? `درآمد: ${toFarsi(entry.value)} افغانی` : `فروش: ${toFarsi(entry.value)} عدد`}
        </p>
      ))}
    </div>
  )
}

// ─── Skeleton Components ─────────────────────────────────────────────

function HeroCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </CardContent>
    </Card>
  )
}

function MiniCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-32" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Avatar Component ────────────────────────────────────────────────

function UserAvatar({ name, image, size = 'sm' }: { name: string; image?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const colors = [
    'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500',
    'bg-cyan-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500',
  ]
  const colorIndex = name.charCodeAt(0) % colors.length
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-xs' : size === 'md' ? 'h-9 w-9 text-sm' : 'h-12 w-12 text-base'

  if (image) {
    return (
      <Avatar className={cn(sizeClass, 'rounded-xl')}>
        <AvatarImage src={image} alt={name} className="object-cover" />
        <AvatarFallback className={cn('rounded-xl', colors[colorIndex], 'text-white font-bold')}>
          {name.slice(0, 2)}
        </AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Avatar className={cn(sizeClass, 'rounded-xl', colors[colorIndex])}>
      <AvatarFallback className="text-white font-bold">
        {name.slice(0, 2)}
      </AvatarFallback>
    </Avatar>
  )
}

// ─── Main Dashboard Component ─────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllTopProducts, setShowAllTopProducts] = useState(false)
  const [showAllStockAlerts, setShowAllStockAlerts] = useState(false)
  const [showAllRecentSales, setShowAllRecentSales] = useState(false)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/dashboard?period=30')
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError(json.error || 'خطا در دریافت اطلاعات')
      }
    } catch {
      setError('خطا در ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // ── Loading State ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        <HeroCardSkeleton />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MiniCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
            <CardContent><Skeleton className="h-72 w-full" /></CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
            <CardContent><Skeleton className="h-72 w-full" /></CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
          <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
      </div>
    )
  }

  // ── Error State ───────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20" dir="rtl">
        <AlertTriangle className="h-16 w-16 text-destructive" />
        <h2 className="text-xl font-semibold">{error || 'اطلاعات در دسترس نیست'}</h2>
        <button
          onClick={fetchDashboard}
          className="mt-2 rounded-lg bg-primary px-6 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          تلاش مجدد
        </button>
      </div>
    )
  }

  const isGrowthPositive = data.growthPercent >= 0

  // Category chart colors - warm, modern palette
  const categoryColors = [
    '#e11d48', // rose-600
    '#0891b2', // cyan-600
    '#7c3aed', // violet-600
    '#ea580c', // orange-600
    '#059669', // emerald-600
    '#d97706', // amber-600
    '#2563eb', // blue-600
    '#dc2626', // red-600
    '#4f46e5', // indigo-600
  ]

  const categoryChartData = (data.categoryRevenue || []).slice(0, 6).map((cat, i) => ({
    name: cat.categoryName,
    revenue: cat.totalRevenue,
    sales: cat.totalSales,
    fill: categoryColors[i % categoryColors.length],
  }))

  // Area chart data
  const areaChartData = data.chartData.map((d) => ({
    ...d,
    revenueFormatted: d.revenue,
  }))

  return (
    <div className="space-y-6" dir="rtl">
      {/* ═══ Hero Revenue Card ═══ */}
      <Card className="overflow-hidden border-0 bg-gradient-to-l from-rose-50 via-white to-white dark:from-rose-950/30 dark:via-card dark:to-card">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">درآمد این ماه</p>
              <div className="flex items-baseline gap-3">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  {toFarsi(data.salesMonth.revenue)}
                </h2>
                <span className="text-lg text-muted-foreground">افغانی</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs font-medium px-2 py-0.5',
                    isGrowthPositive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                  )}
                >
                  {isGrowthPositive ? (
                    <ArrowUpRight className="h-3 w-3 ml-0.5" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 ml-0.5" />
                  )}
                  {toFarsi(Math.abs(data.growthPercent))}٪
                </Badge>
                <span className="text-xs text-muted-foreground">
                  مقایسه با ماه قبل: {toFarsi(data.prevMonth.revenue)} افغانی
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 space-x-reverse">
                {data.recentSales.slice(0, 4).map((sale) => (
                  <UserAvatar
                    key={sale.id}
                    name={sale.customer?.name || 'ف'}
                    image={sale.customer?.image}
                    size="md"
                  />
                ))}
              </div>
              <div className="text-sm">
                <p className="font-medium">{toFarsi(data.totalCustomers)} مشتری</p>
                <p className="text-xs text-muted-foreground">{toFarsi(data.salesMonth.count)} فروش</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Mini Stats Cards ═══ */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Today Sales */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">فروش امروز</p>
                <p className="text-lg font-bold truncate">{toFarsi(data.salesToday.revenue)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{toFarsi(data.salesToday.count)} فاکتور</p>
          </CardContent>
        </Card>

        {/* Top Sales (Best Seller) */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                <Flame className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">پرفروش‌ترین</p>
                <p className="text-sm font-bold truncate">
                  {data.topSellingProducts[0]?.productName || '—'}
                </p>
              </div>
            </div>
            {data.topSellingProducts[0] && (
              <p className="mt-2 text-xs text-muted-foreground">
                {toFarsi(data.topSellingProducts[0].totalQuantity)} عدد فروخته شده
              </p>
            )}
          </CardContent>
        </Card>

        {/* Total Products */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
                <Package className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">محصولات</p>
                <p className="text-lg font-bold">{toFarsi(data.totalProducts)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">محصول فعال</p>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/40">
                <Wallet className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">هزینه‌ها</p>
                <p className="text-lg font-bold truncate">{toFarsi(data.totalExpensesThisMonth)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">هزینه این ماه</p>
          </CardContent>
        </Card>
      </div>

      {/* ═══ Charts Section ═══ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Bar Chart - Sales by Category */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">فروش بر اساس دسته‌بندی</CardTitle>
                <CardDescription className="text-xs">درآمد هر دسته‌بندی</CardDescription>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => toCompactFarsi(v)}
                    width={50}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar
                    dataKey="revenue"
                    name="درآمد"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Category Legend */}
            <div className="mt-3 flex flex-wrap gap-3 border-t pt-3">
              {categoryChartData.slice(0, 5).map((cat, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.fill }} />
                  <span className="text-xs text-muted-foreground">{cat.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Line/Area Chart - Sales Trend */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">روند فروش</CardTitle>
                <CardDescription className="text-xs">نمودار درآمد ۳۰ روز اخیر</CardDescription>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0891b2" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => toCompactFarsi(v)}
                    width={50}
                  />
                  <Tooltip content={<AreaChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="درآمد"
                    stroke="#e11d48"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: '#e11d48' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="فروش"
                    stroke="#0891b2"
                    strokeWidth={2}
                    fill="url(#salesGradient)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#0891b2' }}
                    yAxisId={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ Bottom Section: Recent Sales + Sidebar Cards ═══ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent Sales Table */}
        <Card className="lg:col-span-2 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                  <ShoppingCart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">فروش‌های اخیر</CardTitle>
                  <CardDescription className="text-xs">آخرین تراکنش‌های فروش</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {toFarsi(data.totalRevenue)} افغانی کل فروش
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingCart className="mb-3 h-10 w-10 opacity-30" />
                <p className="text-sm">هنوز فروشی ثبت نشده است</p>
              </div>
            ) : (
              <>
              <div style={{ maxHeight: showAllRecentSales ? '500px' : '384px', overflowY: 'auto', overflowX: 'auto' }}>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">فاکتور</TableHead>
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">مشتری</TableHead>
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">مبلغ</TableHead>
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">تخفیف</TableHead>
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">نهایی</TableHead>
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">پرداخت</TableHead>
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">تاریخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentSales.slice(0, showAllRecentSales ? undefined : 7).map((sale) => (
                      <TableRow key={sale.id} className="group">
                        <TableCell className="font-mono text-xs">{sale.invoiceNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserAvatar name={sale.customer?.name || '—'} image={sale.customer?.image} size="sm" />
                            <span className="text-xs">{sale.customer?.name || 'بدون مشتری'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{toFarsi(sale.totalAmount)}</TableCell>
                        <TableCell className="text-xs">
                          {sale.discount > 0 ? (
                            <span className="text-red-500">-{toFarsi(sale.discount)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{toFarsi(sale.finalAmount)}</TableCell>
                        <TableCell>{getPaymentBadge(sale.paymentMethod)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(sale.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                {data.recentSales.length > 7 && (
                  <div className="border-t px-4 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setShowAllRecentSales(!showAllRecentSales)}
                    >
                      {showAllRecentSales ? (
                        <>
                          <ChevronUp className="ml-1 h-3.5 w-3.5" />
                          نمایش کمتر
                        </>
                      ) : (
                        <>
                          <ChevronDown className="ml-1 h-3.5 w-3.5" />
                          نمایش بیشتر ({toFarsi(data.recentSales.length - 7)} فروش دیگر)
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Right Sidebar Cards */}
        <div className="space-y-4">
          {/* Top Products Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                  <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">پرفروش‌ترین‌ها</CardTitle>
                  <CardDescription className="text-xs">بر اساس تعداد فروش</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3" style={{ maxHeight: showAllTopProducts ? '400px' : '280px', overflowY: 'auto' }}>
                {data.topSellingProducts.slice(0, showAllTopProducts ? undefined : 5).map((product, index) => {
                  const maxQty = data.topSellingProducts[0]?.totalQuantity || 1
                  const percentage = (product.totalQuantity / maxQty) * 100
                  const barColors = ['bg-rose-500', 'bg-cyan-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500']
                  return (
                    <div key={product.productId} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white bg-muted-foreground">
                            {toFarsi(index + 1)}
                          </span>
                          <span className="text-xs font-medium truncate max-w-[120px]">{product.productName}</span>
                        </div>
                        <span className="text-xs font-semibold">{toFarsi(product.totalQuantity)}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', barColors[index])}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              {data.topSellingProducts.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAllTopProducts(!showAllTopProducts)}
                >
                  {showAllTopProducts ? (
                    <>
                      <ChevronUp className="ml-1 h-3.5 w-3.5" />
                      نمایش کمتر
                    </>
                  ) : (
                    <>
                      <ChevronDown className="ml-1 h-3.5 w-3.5" />
                      نمایش بیشتر ({toFarsi(data.topSellingProducts.length - 5)} محصول)
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    data.lowStockCount > 0
                      ? 'bg-red-100 dark:bg-red-900/40'
                      : 'bg-emerald-100 dark:bg-emerald-900/40'
                  )}>
                    <AlertTriangle className={cn(
                      'h-4 w-4',
                      data.lowStockCount > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    )} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">هشدار موجودی</CardTitle>
                    <CardDescription className="text-xs">
                      {data.lowStockCount > 0
                        ? `${toFarsi(data.lowStockCount)} محصول در وضعیت هشدار`
                        : 'موجودی تمام محصولات کافی است'
                      }
                    </CardDescription>
                  </div>
                </div>
                {data.lowStockCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5">
                    {data.lowStockProducts.filter((p) => (p as LowStockProduct).stock === 0).length > 0 && (
                      <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    )}
                    {toFarsi(data.lowStockCount)}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {data.lowStockProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <Package className="mb-2 h-8 w-8 opacity-30" />
                  <p className="text-xs">موجودی کافی</p>
                </div>
              ) : (
                <>
                <div style={{ maxHeight: showAllStockAlerts ? '384px' : '288px', overflowY: 'auto', overflowX: 'auto' }}>
                  <div className="space-y-2.5 pr-1">
                  {(data.lowStockProducts as LowStockProduct[]).slice(0, showAllStockAlerts ? undefined : 5).map((product) => {
                    const isOutOfStock = product.stock === 0
                    const isCritical = product.stock === 0 || product.stock <= Math.floor(product.minStock * 0.3)
                    const stockRatio = product.minStock > 0 ? Math.min((product.stock / product.minStock) * 100, 100) : 0
                    const stockPercent = Math.round(stockRatio)

                    return (
                      <div
                        key={product.id}
                        className={cn(
                          'rounded-xl border p-3 transition-colors',
                          isOutOfStock
                            ? 'border-red-200 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/30'
                            : isCritical
                            ? 'border-orange-200 bg-orange-50/60 dark:border-orange-900/50 dark:bg-orange-950/30'
                            : 'border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/30'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              {isOutOfStock && (
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 shrink-0 animate-pulse" />
                              )}
                              <p className="truncate text-xs font-semibold">{product.name}</p>
                            </div>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">کد: {product.sku}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] shrink-0 px-1.5 py-0',
                              isOutOfStock
                                ? 'border-red-300 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-900/60 dark:text-red-400'
                                : isCritical
                                ? 'border-orange-300 bg-orange-100 text-orange-700 dark:border-orange-800 dark:bg-orange-900/60 dark:text-orange-400'
                                : 'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/60 dark:text-amber-400'
                            )}
                          >
                            {isOutOfStock ? 'ناموجود' : `${toFarsi(product.stock)} عدد`}
                          </Badge>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-2 space-y-1">
                          <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                isOutOfStock
                                  ? 'bg-red-500'
                                  : isCritical
                                  ? 'bg-orange-500'
                                  : 'bg-amber-500'
                              )}
                              style={{ width: `${stockPercent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              'text-[10px] font-medium',
                              isOutOfStock
                                ? 'text-red-600 dark:text-red-400'
                                : isCritical
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-amber-600 dark:text-amber-400'
                            )}>
                              {isOutOfStock ? 'نیاز به سفارش فوری' : stockPercent <= 50 ? 'نیاز به سفارش' : 'موجودی کم'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              حداقل: {toFarsi(product.minStock)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  </div>
                </div>
                {(data.lowStockProducts as LowStockProduct[]).length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setShowAllStockAlerts(!showAllStockAlerts)}
                  >
                    {showAllStockAlerts ? (
                      <>
                        <ChevronUp className="ml-1 h-3.5 w-3.5" />
                        نمایش کمتر
                      </>
                    ) : (
                      <>
                        <ChevronDown className="ml-1 h-3.5 w-3.5" />
                        نمایش بیشتر ({toFarsi((data.lowStockProducts as LowStockProduct[]).length - 5)} محصول دیگر)
                      </>
                    )}
                  </Button>
                )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[10px] text-muted-foreground">سود خالص تقریبی</span>
                  </div>
                  <p className="text-sm font-bold">
                    {toFarsi(Math.max(0, data.salesMonth.revenue - data.totalExpensesThisMonth))}
                  </p>
                </div>
                <div className="space-y-1 rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-violet-500" />
                    <span className="text-[10px] text-muted-foreground">فروش هفتگی</span>
                  </div>
                  <p className="text-sm font-bold">{toFarsi(data.salesWeek.count)} فاکتور</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
