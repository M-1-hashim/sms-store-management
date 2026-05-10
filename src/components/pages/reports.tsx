'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Package,
  DollarSign,
  BarChart3,
  Wallet,
  ShoppingBag,
  PieChart as PieChartIcon,
  FileBarChart,
  AlertTriangle,
  Receipt,
  Filter,
  RotateCcw,
  Layers,
  BoxesIcon,
  ArrowUpRight,
  ArrowDownRight,
  CircleDollarSign,
  Percent,
  Calculator,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────

function toFarsi(num: number): string {
  return num.toLocaleString('fa-AF')
}

function toCompactFarsi(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
  return toFarsi(num)
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fa-AF', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function getFirstDayOfMonth(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Chart Colors ─────────────────────────────────────────────────────

const CHART_COLORS = [
  '#e11d48', '#0891b2', '#7c3aed', '#ea580c', '#059669',
  '#d97706', '#2563eb', '#dc2626', '#4f46e5', '#16a34a',
]

const PAYMENT_COLORS: Record<string, string> = {
  'نقدی': '#059669',
  'کارت': '#0891b2',
  'کارت بانکی': '#0891b2',
  'نسیه': '#ea580c',
}

// ─── Custom Tooltip ───────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border bg-popover p-3 shadow-xl" dir="rtl">
      <p className="mb-2 text-sm font-semibold text-popover-foreground">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {toFarsi(entry.value)} افغانی
        </p>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border bg-popover p-3 shadow-xl" dir="rtl">
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {toFarsi(entry.value)} افغانی
        </p>
      ))}
    </div>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-4 w-24" />
      </CardContent>
    </Card>
  )
}

function MiniCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
      <CardContent><Skeleton className="h-72 w-full" /></CardContent>
    </Card>
  )
}

// ─── Date Filter Component ────────────────────────────────────────────

function DateFilterCard({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToDateChange,
  onReload,
  loading,
}: {
  dateFrom: string
  dateTo: string
  onDateFromChange: (v: string) => void
  onDateToDateChange: (v: string) => void
  onReload: () => void
  loading: boolean
}) {
  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-l from-sky-50 via-white to-white dark:from-sky-950/30 dark:via-card dark:to-card">
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/40">
              <Filter className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-sm font-medium">دوره گزارش</p>
              <p className="text-[11px] text-muted-foreground">محدوده زمانی دلخواه خود را انتخاب کنید</p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3 flex-1 justify-end">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">از تاریخ</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="w-36 h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">تا تاریخ</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToDateChange(e.target.value)}
                className="w-36 h-9 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onReload}
              disabled={loading}
              className="h-9 gap-1.5"
            >
              <RotateCcw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              بارگذاری
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ════════════════════════════════════════════════════════════════════════
// SALES REPORT TAB
// ════════════════════════════════════════════════════════════════════════

function SalesReportTab() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<Record<string, number> | null>(null)
  const [dailySales, setDailySales] = useState<{ date: string; total: number }[]>([])
  const [byPayment, setByPayment] = useState<{ method: string; amount: number; count: number }[]>([])
  const [dateFrom, setDateFrom] = useState(getFirstDayOfMonth())
  const [dateTo, setDateTo] = useState(getToday())

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: 'sales' })
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)

      const res = await fetch(`/api/reports?${params}`)
      const json = await res.json()
      if (json.success) {
        const d = json.data
        setSummary({
          totalSales: d.summary?.totalSales || 0,
          totalRevenue: d.summary?.totalRevenue || 0,
          totalDiscount: d.summary?.totalDiscount || 0,
          averageSale: d.summary?.averageSale || 0,
        })

        const raw = d.dailySales || {}
        setDailySales(
          Object.entries(raw)
            .map(([date, total]) => ({ date, total: total as number }))
            .sort((a, b) => a.date.localeCompare(b.date))
        )

        const rawPay = d.byPaymentMethod || []
        setByPayment(
          rawPay.map((item: Record<string, unknown>) => ({
            method: item.paymentMethod as string,
            amount: ((item._sum as Record<string, unknown>)?.finalAmount as number) || 0,
            count: (item._count as number) || 0,
          }))
        )
      } else {
        toast.error('خطا در دریافت گزارش فروش')
      }
    } catch {
      toast.error('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => { fetchReport() }, [fetchReport])

  const totalSales = summary?.totalSales || 0
  const totalRevenue = summary?.totalRevenue || 0
  const totalDiscount = summary?.totalDiscount || 0
  const averageSale = summary?.averageSale || 0
  const totalPayment = byPayment.reduce((s, p) => s + p.amount, 0)

  const bestDay = dailySales.reduce(
    (best, d) => (d.total > (best?.total || 0) ? d : best),
    dailySales[0]
  )

  // Chart data
  const chartData = dailySales.slice(-20).map((d) => ({
    name: formatDate(d.date),
    revenue: d.total,
  }))

  // Pie data for payment methods
  const pieData = byPayment.map((p, i) => ({
    name: p.method,
    value: p.amount,
    fill: PAYMENT_COLORS[p.method] || CHART_COLORS[i % CHART_COLORS.length],
  }))

  if (loading) {
    return (
      <div className="space-y-5">
        <DateFilterCard dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToDateChange={setDateTo} onReload={fetchReport} loading={loading} />
        <HeroSkeleton />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <MiniCardSkeleton key={i} />)}</div>
        <ChartSkeleton /><ChartSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Date Filter */}
      <DateFilterCard dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToDateChange={setDateTo} onReload={fetchReport} loading={false} />

      {/* Hero Revenue Card */}
      <Card className="overflow-hidden border-0 bg-gradient-to-l from-emerald-50 via-white to-white dark:from-emerald-950/30 dark:via-card dark:to-card">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">مجموع فروش در این دوره</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{toFarsi(totalRevenue)}</h2>
                <span className="text-lg text-muted-foreground">افغانی</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-xs">
                  <ShoppingBag className="h-3 w-3 ml-1" />
                  {toFarsi(totalSales)} فاکتور
                </Badge>
                <span className="text-xs text-muted-foreground">
                  میانگین: {toFarsi(Math.round(averageSale))} افغانی
                </span>
              </div>
            </div>
            <div className="text-left text-sm space-y-1">
              {bestDay && (
                <>
                  <p className="text-xs text-muted-foreground">بهترین روز فروش</p>
                  <p className="font-semibold">{formatDate(bestDay.date)}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{toFarsi(bestDay.total)} افغانی</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                <ShoppingBag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">تعداد فروش</p>
                <p className="text-lg font-bold">{toFarsi(totalSales)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">فاکتور</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/40">
                <DollarSign className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">میانگین فروش</p>
                <p className="text-lg font-bold">{toFarsi(Math.round(averageSale))}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">افغانی هر فاکتور</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/40">
                <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">تخفیف‌ها</p>
                <p className="text-lg font-bold">{toFarsi(totalDiscount)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">افغانی</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
                <CalendarDays className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">روزهای فعال</p>
                <p className="text-lg font-bold">{toFarsi(dailySales.length)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">روز دارای فروش</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Bar Chart - Daily Sales */}
        <Card className="lg:col-span-2 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">نمودار فروش روزانه</CardTitle>
                  <CardDescription className="text-xs">۲۰ روز اخیر</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">{toFarsi(dailySales.length)} روز</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="salesBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => toCompactFarsi(v)} width={55} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                    <Bar dataKey="revenue" name="فروش" radius={[6, 6, 0, 0]} maxBarSize={40} fill="url(#salesBarGradient)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <p className="text-sm">داده‌ای برای نمایش نمودار وجود ندارد</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Payment Methods */}
        {pieData.length > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">روش پرداخت</CardTitle>
                  <CardDescription className="text-xs">توزیع فروش بر اساس</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-2">
                {byPayment.map((p, i) => {
                  const pct = totalPayment > 0 ? Math.round((p.amount / totalPayment) * 100) : 0
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieData[i]?.fill }} />
                        <span className="text-xs">{p.method}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{toFarsi(p.amount)}</span>
                        <span className="text-[10px] text-muted-foreground">({toFarsi(pct)}٪)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Daily Sales Table */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">جزئیات فروش روزانه</CardTitle>
                <CardDescription className="text-xs">لیست فروش هر روز</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">{toFarsi(totalRevenue)} افغانی کل</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {dailySales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileBarChart className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">داده‌ای برای نمایش وجود ندارد</p>
            </div>
          ) : (
            <div style={{ maxHeight: '380px', overflowY: 'auto', overflowX: 'auto' }}>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-right text-xs">#</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground">تاریخ</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground">مبلغ فروش</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySales.map((day, idx) => (
                    <TableRow key={idx} className="group">
                      <TableCell className="text-xs text-muted-foreground">{toFarsi(idx + 1)}</TableCell>
                      <TableCell className="text-xs font-medium">{formatDate(day.date)}</TableCell>
                      <TableCell className="text-xs font-semibold">{toFarsi(day.total)} <span className="font-normal text-muted-foreground">افغانی</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// INVENTORY REPORT TAB
// ════════════════════════════════════════════════════════════════════════

function InventoryReportTab() {
  const [loading, setLoading] = useState(true)
  const [totalValue, setTotalValue] = useState(0)
  const [totalCostValue, setTotalCostValue] = useState(0)
  const [potentialProfit, setPotentialProfit] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalStock, setTotalStock] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [categories, setCategories] = useState<{ name: string; value: number; count: number; totalStock: number }[]>([])
  const [products, setProducts] = useState<{ name: string; stock: number; value: number; sellPrice: number }[]>([])

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reports?type=inventory')
      const json = await res.json()
      if (json.success) {
        const d = json.data
        setTotalValue(d.summary?.totalInventoryValue || 0)
        setTotalCostValue(d.summary?.totalCostValue || 0)
        setPotentialProfit(d.summary?.potentialProfit || 0)
        setTotalProducts(d.summary?.totalProducts || 0)
        setTotalStock(d.summary?.totalStock || 0)
        setLowStockCount(d.summary?.lowStockCount || 0)

        const rawCats = d.byCategory || {}
        setCategories(
          Object.entries(rawCats).map(([name, val]) => ({
            name,
            count: (val as Record<string, unknown>).count as number,
            totalStock: (val as Record<string, unknown>).totalStock as number,
            value: (val as Record<string, unknown>).value as number,
          }))
        )

        setProducts(
          (d.products || [])
            .map((p: Record<string, unknown>) => ({
              name: p.name as string,
              stock: p.stock as number,
              sellPrice: p.sellPrice as number,
              value: (p.sellPrice as number) * (p.stock as number),
            }))
            .sort((a: { value: number }, b: { value: number }) => b.value - a.value)
        )
      } else {
        toast.error('خطا در دریافت گزارش موجودی')
      }
    } catch {
      toast.error('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReport() }, [fetchReport])

  // Category chart data
  const categoryChartData = categories.slice(0, 6).map((cat, i) => ({
    name: cat.name,
    value: cat.value,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }))

  if (loading) {
    return (
      <div className="space-y-5">
        <HeroSkeleton />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <MiniCardSkeleton key={i} />)}</div>
        <ChartSkeleton /><ChartSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Hero Inventory Card */}
      <Card className="overflow-hidden border-0 bg-gradient-to-l from-violet-50 via-white to-white dark:from-violet-950/30 dark:via-card dark:to-card">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">ارزش کل موجودی انبار</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{toFarsi(totalValue)}</h2>
                <span className="text-lg text-muted-foreground">افغانی</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400 text-xs">
                  <Package className="h-3 w-3 ml-1" />
                  {toFarsi(totalProducts)} محصول
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {toFarsi(totalStock)} عدد در انبار
                </span>
              </div>
            </div>
            <div className="text-left text-sm space-y-1">
              <p className="text-xs text-muted-foreground">سود بالقوه</p>
              <p className={cn('text-lg font-bold', potentialProfit >= 0 ? 'text-emerald-600' : 'text-destructive')}>
                {toFarsi(potentialProfit)} افغانی
              </p>
              <p className="text-[10px] text-muted-foreground">تفاوت قیمت خرید و فروش</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
                <Package className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">محصولات</p>
                <p className="text-lg font-bold">{toFarsi(totalProducts)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">محصول فعال</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/40">
                <BoxesIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">کل موجودی</p>
                <p className="text-lg font-bold">{toFarsi(totalStock)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">عدد کالا</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/40">
                <Wallet className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">ارزش خرید</p>
                <p className="text-lg font-bold">{toFarsi(totalCostValue)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">افغانی</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">هشدار موجودی</p>
                <p className="text-lg font-bold">{toFarsi(lowStockCount)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">محصول کم‌موجود</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Chart + Legend */}
      {categoryChartData.length > 0 && (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">موجودی بر اساس دسته‌بندی</CardTitle>
                  <CardDescription className="text-xs">ارزش موجودی هر دسته‌بندی</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => toCompactFarsi(v)} width={55} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar dataKey="value" name="ارزش" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 border-t pt-3">
              {categoryChartData.map((cat, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.fill }} />
                  <span className="text-xs text-muted-foreground">{cat.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">فهرست محصولات</CardTitle>
                <CardDescription className="text-xs">مرتب‌شده بر اساس ارزش موجودی</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">{toFarsi(products.length)} محصول</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">محصولی برای نمایش وجود ندارد</p>
            </div>
          ) : (
            <div style={{ maxHeight: '420px', overflowY: 'auto', overflowX: 'auto' }}>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-right text-xs">#</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground">محصول</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground">موجودی</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground">قیمت فروش</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground">ارزش موجودی</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.slice(0, 50).map((product, idx) => (
                    <TableRow key={idx} className="group">
                      <TableCell className="text-xs text-muted-foreground">{toFarsi(idx + 1)}</TableCell>
                      <TableCell className="text-xs font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={product.stock > 5 ? 'secondary' : 'destructive'}
                          className="text-[10px]"
                        >
                          {toFarsi(product.stock)} عدد
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{toFarsi(product.sellPrice)}</TableCell>
                      <TableCell className="text-xs font-semibold">{toFarsi(product.value)} <span className="font-normal text-muted-foreground">افغانی</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// PROFIT REPORT TAB
// ════════════════════════════════════════════════════════════════════════

function ProfitReportTab() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    revenue: number
    discount: number
    cogs: number
    grossProfit: number
    totalExpenses: number
    netProfit: number
    profitMargin: number
    salesCount: number
    expenseCount: number
    expensesByCategory: { category: string; total: number }[]
  } | null>(null)
  const [dateFrom, setDateFrom] = useState(getFirstDayOfMonth())
  const [dateTo, setDateTo] = useState(getToday())

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: 'profit' })
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)

      const res = await fetch(`/api/reports?${params}`)
      const json = await res.json()
      if (json.success) {
        const s = json.data.summary || {}
        const rawExp = json.data.expenseByCategory || {}
        const expArray = Object.entries(rawExp).map(([category, total]) => ({
          category,
          total: total as number,
        }))

        setData({
          revenue: s.totalRevenue || 0,
          discount: s.totalDiscount || 0,
          cogs: s.totalCOGS || 0,
          grossProfit: s.grossProfit || 0,
          totalExpenses: s.totalExpenses || 0,
          netProfit: s.netProfit || 0,
          profitMargin: parseFloat(String(s.profitMargin)) || 0,
          salesCount: s.totalSalesCount || 0,
          expenseCount: s.totalExpenseCount || 0,
          expensesByCategory: expArray.sort((a: { total: number }, b: { total: number }) => b.total - a.total),
        })
      } else {
        toast.error('خطا در دریافت گزارش سودآوری')
      }
    } catch {
      toast.error('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => { fetchReport() }, [fetchReport])

  const isProfit = data ? data.netProfit >= 0 : true

  // Expense pie chart data
  const expensePieData = (data?.expensesByCategory || []).slice(0, 6).map((e, i) => ({
    name: e.category,
    value: e.total,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }))

  if (loading) {
    return (
      <div className="space-y-5">
        <DateFilterCard dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToDateChange={setDateTo} onReload={fetchReport} loading={loading} />
        <HeroSkeleton />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <MiniCardSkeleton key={i} />)}</div>
        <ChartSkeleton />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-5">
      {/* Date Filter */}
      <DateFilterCard dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToDateChange={setDateTo} onReload={fetchReport} loading={false} />

      {/* Hero Net Profit Card */}
      <Card className="overflow-hidden border-0 bg-gradient-to-l from-emerald-50 via-white to-white dark:from-emerald-950/30 dark:via-card dark:to-card">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">سود خالص</p>
              <div className="flex items-baseline gap-2">
                <h2 className={cn('text-3xl md:text-4xl font-bold tracking-tight', isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
                  {toFarsi(data.netProfit)}
                </h2>
                <span className="text-lg text-muted-foreground">افغانی</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs font-medium px-2 py-0.5',
                    isProfit
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                  )}
                >
                  {isProfit ? <ArrowUpRight className="h-3 w-3 ml-0.5" /> : <ArrowDownRight className="h-3 w-3 ml-0.5" />}
                  حاشیه سود: {toFarsi(Math.round(data.profitMargin * 10) / 10)}٪
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {toFarsi(data.salesCount)} فروش · {toFarsi(data.expenseCount)} هزینه
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/40">
                <DollarSign className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">درآمد کل</p>
                <p className="text-lg font-bold">{toFarsi(data.revenue)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">افغانی</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40">
                <CircleDollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">هزینه کالا (COGS)</p>
                <p className="text-lg font-bold">{toFarsi(data.cogs)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">قیمت خرید کالاهای فروخته‌شده</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/40">
                <Wallet className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">هزینه‌های عملیاتی</p>
                <p className="text-lg font-bold">{toFarsi(data.totalExpenses)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">افغانی</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                <Calculator className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">سود ناخالص</p>
                <p className="text-lg font-bold">{toFarsi(data.grossProfit)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">درآمد − هزینه کالا</p>
          </CardContent>
        </Card>
      </div>

      {/* Profit Breakdown + Expense Chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profit Waterfall Card */}
        <Card className="lg:col-span-1 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">خلاصه سودآوری</CardTitle>
                <CardDescription className="text-xs">تفکیک درآمد و هزینه</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 rounded-xl bg-muted/40 p-4">
              {/* Revenue */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">درآمد کل</span>
                  <span className="font-semibold">{toFarsi(data.revenue)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-sky-100 dark:bg-sky-900/30 overflow-hidden">
                  <div className="h-full rounded-full bg-sky-500 transition-all duration-700" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="flex items-center gap-2 px-2">
                <ArrowDownRight className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-[11px] text-muted-foreground">کاهش</span>
              </div>

              {/* COGS */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">هزینه کالا (COGS)</span>
                  <span className="text-orange-600 font-medium">-{toFarsi(data.cogs)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-orange-100 dark:bg-orange-900/30 overflow-hidden">
                  <div className="h-full rounded-full bg-orange-500 transition-all duration-700" style={{ width: `${data.revenue > 0 ? Math.min((data.cogs / data.revenue) * 100, 100) : 0}%` }} />
                </div>
              </div>

              <Separator />

              {/* Gross Profit */}
              <div className="flex justify-between text-sm">
                <span className="font-medium">سود ناخالص</span>
                <span className={cn('font-semibold', data.grossProfit >= 0 ? 'text-emerald-600' : 'text-destructive')}>
                  {toFarsi(data.grossProfit)}
                </span>
              </div>

              {/* Operating Expenses */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">هزینه‌های عملیاتی</span>
                  <span className="text-orange-600 font-medium">-{toFarsi(data.totalExpenses)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-rose-100 dark:bg-rose-900/30 overflow-hidden">
                  <div className="h-full rounded-full bg-rose-500 transition-all duration-700" style={{ width: `${data.revenue > 0 ? Math.min((data.totalExpenses / data.revenue) * 100, 100) : 0}%` }} />
                </div>
              </div>

              <Separator />

              {/* Net Profit */}
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold">سود خالص</span>
                <div className="flex items-center gap-2">
                  <span className={cn('font-bold', isProfit ? 'text-emerald-600' : 'text-destructive')}>
                    {toFarsi(data.netProfit)}
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5">
                    <Percent className="h-2.5 w-2.5 ml-0.5" />
                    {toFarsi(Math.round(data.profitMargin * 10) / 10)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Pie Chart */}
        {expensePieData.length > 0 && (
          <Card className="lg:col-span-2 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">هزینه‌ها بر اساس دسته‌بندی</CardTitle>
                    <CardDescription className="text-xs">توزیع هزینه‌های عملیاتی</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">{toFarsi(data.totalExpenses)} افغانی</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {expensePieData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Expense List with Progress */}
                <div className="space-y-3">
                  {data.expensesByCategory.map((item, idx) => {
                    const pct = data.totalExpenses > 0 ? Math.round((item.total / data.totalExpenses) * 100) : 0
                    const color = CHART_COLORS[idx % CHART_COLORS.length]
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-xs font-medium">{item.category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{toFarsi(item.total)}</span>
                            <span className="text-[10px] text-muted-foreground">({toFarsi(pct)}٪)</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// MAIN REPORTS PAGE
// ════════════════════════════════════════════════════════════════════════

export default function ReportsPage() {
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/40">
          <BarChart3 className="h-6 w-6 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">گزارش‌ها</h1>
          <p className="text-sm text-muted-foreground">تحلیل و بررسی عملکرد فروشگاه</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="sales" className="gap-1.5 text-xs sm:text-sm">
            <TrendingUp className="h-3.5 w-3.5" />
            فروش
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-1.5 text-xs sm:text-sm">
            <Package className="h-3.5 w-3.5" />
            موجودی
          </TabsTrigger>
          <TabsTrigger value="profit" className="gap-1.5 text-xs sm:text-sm">
            <Calculator className="h-3.5 w-3.5" />
            سودآوری
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <SalesReportTab />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryReportTab />
        </TabsContent>

        <TabsContent value="profit">
          <ProfitReportTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
