'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  CalendarDays,
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

// --- Helpers ---
function formatNumber(n: number): string {
  return n.toLocaleString('fa-AF')
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fa-AF', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function getFirstDayOfMonth(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

// --- Skeletons ---
function ReportCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-32" />
      </CardContent>
    </Card>
  )
}

function ReportTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

// ========================================================
// Sales Report Tab
// API returns:
//   data.summary: { totalSales, totalRevenue, averageSale, ... }
//   data.byPaymentMethod: [{ paymentMethod, _sum: { finalAmount }, _count }]
//   data.dailySales: { "2024-01-01": 1234, "2024-01-02": 5678, ... }
// ========================================================
function SalesReportTab() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null)
  const [dailySales, setDailySales] = useState<{ date: string; count: number; total: number }[]>([])
  const [byPayment, setByPayment] = useState<Record<string, number>>({})
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
        const data = json.data
        setSummary(data.summary || null)

        // Convert dailySales object { "date": amount } → array [{ date, count, total }]
        const raw = data.dailySales || {}
        const days = Object.entries(raw).map(([date, total]) => ({
          date,
          count: 1, // API gives totals per day, count each as 1 entry
          total: total as number,
        }))
        setDailySales(days)

        // Convert byPaymentMethod array → record { "نقدی": amount }
        const rawPay = data.byPaymentMethod || []
        const payMap: Record<string, number> = {}
        for (const item of rawPay) {
          payMap[(item as Record<string, unknown>).paymentMethod as string] =
            ((item as Record<string, unknown>)._sum as Record<string, unknown>)?.finalAmount as number || 0
        }
        setByPayment(payMap)
      } else {
        toast.error('خطا در دریافت گزارش فروش')
      }
    } catch {
      toast.error('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const totalSales = (summary?.totalSales as number) || 0
  const totalRevenue = (summary?.totalRevenue as number) || 0
  const averageSale = (summary?.averageSale as number) || 0

  const bestDay = dailySales.reduce(
    (best, d) => (d.total > (best?.total || 0) ? d : best),
    dailySales[0]
  )

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4" />
              <span>دوره گزارش:</span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">از تاریخ</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">تا تاریخ</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
            <Button variant="outline" onClick={fetchReport} disabled={loading}>
              بارگذاری مجدد
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ReportCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2.5">
                  <TrendingUp className="size-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تعداد فروش</p>
                  <p className="text-2xl font-bold">{formatNumber(totalSales)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sky-100 p-2.5">
                  <DollarSign className="size-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مجموع فروش</p>
                  <p className="text-2xl font-bold">{formatNumber(totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground">افغانی</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-violet-100 p-2.5">
                  <BarChart3 className="size-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">میانگین فروش</p>
                  <p className="text-2xl font-bold">
                    {totalSales > 0 ? formatNumber(Math.round(averageSale)) : '۰'}
                  </p>
                  <p className="text-xs text-muted-foreground">افغانی</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-2.5">
                  <ArrowUpRight className="size-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">بهترین روز</p>
                  <p className="text-lg font-bold">
                    {bestDay ? formatDate(bestDay.date) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bestDay ? `${formatNumber(bestDay.total)} افغانی` : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sales by Payment */}
      {!loading && Object.keys(byPayment).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">فروش بر اساس روش پرداخت</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(byPayment).map(([method, amount]) => (
                <div
                  key={method}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <span className="text-sm font-medium">{method}</span>
                  <Badge variant="secondary">{formatNumber(amount)} افغانی</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">گزارش روزانه فروش</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[400px]">
            {loading ? (
              <ReportTableSkeleton />
            ) : dailySales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>داده‌ای برای نمایش وجود ندارد</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>مبلغ کل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySales.map((day, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{formatDate(day.date)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatNumber(day.total)} افغانی
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

// ========================================================
// Inventory Report Tab
// API returns:
//   data.summary: { totalProducts, totalInventoryValue, ... }
//   data.byCategory: { "لباس": { count, totalStock, value }, ... }
//   data.products: [{ id, name, stock, sellPrice, category, ... }]
// ========================================================
function InventoryReportTab() {
  const [loading, setLoading] = useState(true)
  const [totalValue, setTotalValue] = useState(0)
  const [categories, setCategories] = useState<{ name: string; value: number; count: number }[]>([])
  const [products, setProducts] = useState<{ name: string; stock: number; value: number }[]>([])

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reports?type=inventory')
      const json = await res.json()
      if (json.success) {
        const data = json.data
        setTotalValue(data.summary?.totalInventoryValue || 0)

        // Convert byCategory object → array
        const rawCats = data.byCategory || {}
        const cats = Object.entries(rawCats).map(([name, val]) => ({
          name,
          count: (val as Record<string, unknown>).count as number,
          value: (val as Record<string, unknown>).value as number,
        }))
        setCategories(cats)

        // Map products with calculated value
        const prods = (data.products || []).map((p: Record<string, unknown>) => ({
          name: p.name as string,
          stock: p.stock as number,
          value: (p.sellPrice as number) * (p.stock as number),
        }))
        setProducts(prods)
      } else {
        toast.error('خطا در دریافت گزارش موجودی')
      }
    } catch {
      toast.error('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  return (
    <div className="space-y-6">
      {/* Total Inventory Value */}
      {loading ? (
        <ReportCardSkeleton />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-3">
                <Package className="size-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ارزش کل موجودی</p>
                <p className="text-3xl font-bold">
                  {formatNumber(totalValue)}{' '}
                  <span className="text-base font-normal text-muted-foreground">افغانی</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories */}
      {!loading && categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">موجودی بر اساس دسته‌بندی</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>دسته‌بندی</TableHead>
                    <TableHead>تعداد محصولات</TableHead>
                    <TableHead>ارزش موجودی</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell>{formatNumber(cat.count)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatNumber(cat.value)} افغانی
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">فهرست محصولات و ارزش موجودی</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[400px]">
            {loading ? (
              <ReportTableSkeleton />
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>محصولی برای نمایش وجود ندارد</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>محصول</TableHead>
                    <TableHead>موجودی</TableHead>
                    <TableHead>ارزش موجودی</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant={product.stock > 0 ? 'secondary' : 'destructive'}>
                          {formatNumber(product.stock)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatNumber(product.value)} افغانی
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

// ========================================================
// Profit Report Tab
// API returns:
//   data.summary: { totalRevenue, totalCOGS, grossProfit, totalExpenses, netProfit, profitMargin: "12.5", ... }
//   data.expenseByCategory: { "اجاره": 25000, "حقوق": 34000, ... }
// ========================================================
function ProfitReportTab() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    revenue: number
    cogs: number
    grossProfit: number
    totalExpenses: number
    netProfit: number
    profitMargin: number
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

        // Convert expenseByCategory object → array
        const rawExp = json.data.expenseByCategory || {}
        const expArray = Object.entries(rawExp).map(([category, total]) => ({
          category,
          total: total as number,
        }))

        setData({
          revenue: s.totalRevenue || 0,
          cogs: s.totalCOGS || 0,
          grossProfit: s.grossProfit || 0,
          totalExpenses: s.totalExpenses || 0,
          netProfit: s.netProfit || 0,
          profitMargin: parseFloat(String(s.profitMargin)) || 0,
          expensesByCategory: expArray,
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

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4" />
              <span>دوره گزارش:</span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">از تاریخ</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">تا تاریخ</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
            <Button variant="outline" onClick={fetchReport} disabled={loading}>
              بارگذاری مجدد
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profit Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ReportCardSkeleton key={i} />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-sky-100 p-2.5">
                    <DollarSign className="size-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">درآمد</p>
                    <p className="text-2xl font-bold">{formatNumber(data.revenue)}</p>
                    <p className="text-xs text-muted-foreground">افغانی</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-100 p-2.5">
                    <ArrowDownRight className="size-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">هزینه کالا (COGS)</p>
                    <p className="text-2xl font-bold">{formatNumber(data.cogs)}</p>
                    <p className="text-xs text-muted-foreground">افغانی</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2.5">
                    <TrendingUp className="size-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">سود ناخالص</p>
                    <p className="text-2xl font-bold">{formatNumber(data.grossProfit)}</p>
                    <p className="text-xs text-muted-foreground">افغانی</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-violet-100 p-2.5">
                    <BarChart3 className="size-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">حاشیه سود</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(Math.round(data.profitMargin * 10) / 10)}٪
                    </p>
                    <p className="text-xs text-muted-foreground">درصد</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Net Profit Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">خلاصه سودآوری</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">درآمد کل:</span>
                  <span className="font-medium">{formatNumber(data.revenue)} افغانی</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">هزینه کالا (COGS):</span>
                  <span className="text-orange-600">-{formatNumber(data.cogs)} افغانی</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">سود ناخالص:</span>
                  <span className="font-semibold">{formatNumber(data.grossProfit)} افغانی</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">هزینه‌های عملیاتی:</span>
                  <span className="text-orange-600">-{formatNumber(data.totalExpenses)} افغانی</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>سود خالص:</span>
                  <span className={data.netProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                    {formatNumber(data.netProfit)} افغانی
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-muted-foreground">حاشیه سود خالص:</span>
                  <Badge
                    variant={data.profitMargin >= 0 ? 'default' : 'destructive'}
                  >
                    {formatNumber(Math.round(data.profitMargin * 10) / 10)}٪
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses by Category */}
          {data.expensesByCategory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">هزینه‌ها بر اساس دسته‌بندی</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>دسته‌بندی</TableHead>
                        <TableHead>مبلغ</TableHead>
                        <TableHead>درصد از کل هزینه‌ها</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.expensesByCategory.map((item, idx) => {
                        const percentage =
                          data.totalExpenses > 0
                            ? Math.round((item.total / data.totalExpenses) * 1000) / 10
                            : 0
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.category}</TableCell>
                            <TableCell>{formatNumber(item.total)} افغانی</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[100px]">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatNumber(percentage)}٪
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}

// --- Main Reports Component ---
export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="size-7" />
        <h1 className="text-2xl font-bold">گزارش‌ها</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sales" className="w-full">
        <TabsList>
          <TabsTrigger value="sales">فروش</TabsTrigger>
          <TabsTrigger value="inventory">موجودی</TabsTrigger>
          <TabsTrigger value="profit">سودآوری</TabsTrigger>
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
