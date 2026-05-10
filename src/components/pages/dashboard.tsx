'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
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
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

// ─── Types ────────────────────────────────────────────────────────────

interface DashboardData {
  salesToday: { count: number; revenue: number }
  salesWeek: { count: number; revenue: number }
  salesMonth: { count: number; revenue: number }
  totalRevenue: number
  totalProducts: number
  lowStockCount: number
  lowStockProducts: Array<Record<string, unknown>>
  recentSales: RecentSale[]
  topSellingProducts: TopProduct[]
  chartData: ChartDataPoint[]
  totalExpensesThisMonth: number
}

interface RecentSale {
  id: string
  invoiceNumber: string
  totalAmount: number
  discount: number
  finalAmount: number
  paymentMethod: string
  createdAt: string
  customer: { id: string; name: string; phone: string } | null
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

// ─── Helpers ──────────────────────────────────────────────────────────

function toFarsi(num: number): string {
  return num.toLocaleString('fa-AF')
}

function getPaymentBadge(method: string) {
  switch (method) {
    case 'نقدی':
      return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">{method}</Badge>
    case 'کارت':
    case 'کارت بانکی':
      return <Badge className="bg-blue-600 hover:bg-blue-700 text-white">{method}</Badge>
    case 'نسیه':
      return <Badge variant="outline" className="border-amber-500 text-amber-700">{method}</Badge>
    default:
      return <Badge variant="secondary">{method}</Badge>
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
    <div className="rounded-lg border bg-background p-3 shadow-lg" dir="rtl">
      <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {toFarsi(entry.value)} {entry.name === 'فروش' ? 'عدد' : 'افغانی'}
        </p>
      ))}
    </div>
  )
}

// ─── Stat Card Skeleton ───────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Dashboard Component ─────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/dashboard?period=7')
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError(json.error || 'خطا در دریافت اطلاعات')
      }
    } catch (err) {
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
        <div>
          <Skeleton className="mb-1 h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-72 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-72 w-full" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
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
        <p className="text-muted-foreground">
          لطفاً اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.
        </p>
        <button
          onClick={fetchDashboard}
          className="mt-2 rounded-lg bg-primary px-6 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          تلاش مجدد
        </button>
      </div>
    )
  }

  const stats = [
    {
      label: 'کل فروش امروز',
      value: `${toFarsi(data.salesToday.revenue)} افغانی`,
      sub: `${toFarsi(data.salesToday.count)} فاکتور`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      trend: 'up' as const,
    },
    {
      label: 'تعداد محصولات',
      value: toFarsi(data.totalProducts),
      sub: 'محصول فعال',
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      trend: 'neutral' as const,
    },
    {
      label: 'موجودی کم',
      value: toFarsi(data.lowStockCount),
      sub: 'محصول نیاز به سفارش',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      trend: 'down' as const,
    },
    {
      label: 'درآمد ماهانه',
      value: `${toFarsi(data.salesMonth.revenue)} افغانی`,
      sub: `${toFarsi(data.salesMonth.count)} فاکتور`,
      icon: DollarSign,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950/40',
      trend: 'up' as const,
    },
  ]

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">داشبورد</h1>
        <p className="text-muted-foreground">
          خلاصه‌ای از فعالیت‌ها و آمار فروشگاه شما
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      {stat.trend === 'up' && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
                      {stat.trend === 'down' && <ArrowDownLeft className="h-3 w-3 text-red-500" />}
                      {stat.sub}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${stat.bg}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">نمودار فروش هفتگی</CardTitle>
            <CardDescription>فروش و درآمد ۷ روز اخیر</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    yAxisId="revenue"
                    orientation="left"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toLocaleString('fa-AF')}K` : toFarsi(v)}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    yAxisId="count"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    allowDecimals={false}
                    className="text-muted-foreground"
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    formatter={(value: string) => <span className="text-sm">{value}</span>}
                  />
                  <Bar
                    yAxisId="revenue"
                    dataKey="revenue"
                    name="درآمد"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    yAxisId="count"
                    dataKey="sales"
                    name="فروش"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">پرفروش‌ترین محصولات</CardTitle>
            <CardDescription>محصولات بر اساس تعداد فروش</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.topSellingProducts.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => toFarsi(v)} />
                  <YAxis
                    type="category"
                    dataKey="productName"
                    width={75}
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const item = payload[0]
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-lg" dir="rtl">
                          <p className="font-medium">{item.payload.productName}</p>
                          <p className="text-sm text-emerald-600">تعداد فروش: {toFarsi(Number(item.value))}</p>
                          <p className="text-sm text-muted-foreground">
                            درآمد: {toFarsi(item.payload.totalRevenue)} افغانی
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey="totalQuantity"
                    name="تعداد فروش"
                    fill="#8b5cf6"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Recent Sales + Low Stock */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Sales Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="h-5 w-5" />
                  فروش‌های اخیر
                </CardTitle>
                <CardDescription>آخرین ۵ فاکتور ثبت‌شده</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>کل فروش: {toFarsi(data.totalRevenue)} افغانی</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingCart className="mb-3 h-12 w-12" />
                <p>هنوز فروشی ثبت نشده است</p>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">شماره فاکتور</TableHead>
                      <TableHead className="text-right">مشتری</TableHead>
                      <TableHead className="text-right">مبلغ کل</TableHead>
                      <TableHead className="text-right">تخفیف</TableHead>
                      <TableHead className="text-right">مبلغ نهایی</TableHead>
                      <TableHead className="text-right">روش پرداخت</TableHead>
                      <TableHead className="text-right">تاریخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentSales.slice(0, 5).map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-sm">{sale.invoiceNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {sale.customer?.name || (
                              <span className="text-muted-foreground">بدون مشتری</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{toFarsi(sale.totalAmount)}</TableCell>
                        <TableCell>
                          {sale.discount > 0 ? (
                            <span className="text-red-500">-{toFarsi(sale.discount)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {toFarsi(sale.finalAmount)}
                        </TableCell>
                        <TableCell>{getPaymentBadge(sale.paymentMethod)}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {formatDateTime(sale.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              هشدار موجودی
            </CardTitle>
            <CardDescription>
              {toFarsi(data.lowStockCount)} محصول با موجودی کم
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="mb-3 h-12 w-12" />
                <p>تمام محصولات موجودی کافی دارند</p>
              </div>
            ) : (
              <ScrollArea className="max-h-80">
                <div className="space-y-3">
                  {(data.lowStockProducts as LowStockProduct[]).map((product) => {
                    const isOutOfStock = product.stock === 0
                    return (
                      <div
                        key={product.id}
                        className={`rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                          isOutOfStock ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20' : 'border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.sku}</p>
                          </div>
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              isOutOfStock
                                ? 'bg-red-100 dark:bg-red-900/50'
                                : 'bg-amber-100 dark:bg-amber-900/50'
                            }`}
                          >
                            {isOutOfStock ? (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            ) : (
                              <ArrowDownLeft className="h-4 w-4 text-amber-600" />
                            )}
                          </div>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">موجودی فعلی:</span>
                          <span className={`font-bold ${isOutOfStock ? 'text-red-600' : 'text-amber-600'}`}>
                            {toFarsi(product.stock)} {product.stock === 0 ? '(ناموجود)' : `/ ${toFarsi(product.minStock)}`}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
