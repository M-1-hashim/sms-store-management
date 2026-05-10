'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { printInvoice } from '@/lib/print-invoice'
import { Search, Eye, CalendarDays, Filter, Receipt, ChevronDown, Printer } from 'lucide-react'

// --- Types ---
interface SaleItem {
  id: string
  productId: string
  productName?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  product?: {
    name: string
    sku: string
  }
}

interface Sale {
  id: string
  invoiceNumber: string
  customerId: string | null
  customer?: { name: string; phone: string } | null
  items?: SaleItem[]
  totalAmount: number
  discount: number
  finalAmount: number
  paymentMethod: string
  paidAmount: number
  change: number
  notes: string | null
  createdAt: string
}

interface SaleDetail {
  id: string
  invoiceNumber: string
  customer?: { name: string; phone: string } | null
  totalAmount: number
  discount: number
  finalAmount: number
  paymentMethod: string
  paidAmount: number
  change: number
  notes: string | null
  createdAt: string
  items: SaleItem[]
}

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
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getPaymentBadgeClass(method: string) {
  switch (method) {
    case 'نقدی':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'کارت بانکی':
      return 'bg-sky-100 text-sky-800 border-sky-200'
    case 'نسیه':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// --- Skeletons ---
function SalesTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-14" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  )
}

function SaleDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Separator />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-36" />
        ))}
      </div>
    </div>
  )
}

// --- Main Component ---
export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('همه')
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchSales = useCallback(async (pageNum: number, append = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '20' })
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      if (paymentMethod !== 'همه') params.set('payment', paymentMethod)
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/sales?${params}`)
      const json = await res.json()
      if (json.success) {
        // API returns { data: { sales: [...], pagination: { total, ... } } }
        const newSales = json.data?.sales || []
        setSales(prev => append ? [...prev, ...newSales] : newSales)
        setTotal(json.data?.pagination?.total || 0)
      } else {
        toast.error('خطا در دریافت اطلاعات فروش')
      }
    } catch {
      toast.error('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [dateFrom, dateTo, paymentMethod, searchQuery])

  useEffect(() => {
    fetchSales(1)
  }, [fetchSales])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchSales(nextPage, true)
  }

  const viewSaleDetail = async (saleId: string) => {
    setDetailOpen(true)
    setDetailLoading(true)
    setSelectedSale(null)
    try {
      const res = await fetch(`/api/sales/${saleId}`)
      const json = await res.json()
      if (json.success) {
        // API returns the full sale object with nested customer and items (with product)
        const sale = json.data
        const detail: SaleDetail = {
          id: sale.id,
          invoiceNumber: sale.invoiceNumber,
          customer: sale.customer ? { name: sale.customer.name, phone: sale.customer.phone } : null,
          totalAmount: sale.totalAmount,
          discount: sale.discount,
          finalAmount: sale.finalAmount,
          paymentMethod: sale.paymentMethod,
          paidAmount: sale.paidAmount,
          change: sale.change,
          notes: sale.notes,
          createdAt: sale.createdAt,
          items: (sale.items || []).map((item: Record<string, unknown>) => ({
            id: item.id,
            productId: item.productId,
            productName: (item.product as Record<string, unknown>)?.name || 'نامشخص',
            quantity: item.quantity as number,
            unitPrice: item.unitPrice as number,
            totalPrice: item.totalPrice as number,
          })),
        }
        setSelectedSale(detail)
      } else {
        toast.error('خطا در دریافت جزئیات فروش')
        setDetailOpen(false)
      }
    } catch {
      toast.error('خطا در اتصال به سرور')
      setDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const hasMore = sales.length < total
  const remainingCount = total - sales.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">تاریخچه فروش</h1>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {formatNumber(total)} فاکتور
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="size-4" />
              <span>فیلترها:</span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">از تاریخ</Label>
              <div className="relative">
                <CalendarDays className="absolute right-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); setSales([]); }}
                  className="w-40 pr-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">تا تاریخ</Label>
              <div className="relative">
                <CalendarDays className="absolute right-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); setSales([]); }}
                  className="w-40 pr-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">روش پرداخت</Label>
              <Select value={paymentMethod} onValueChange={(v) => { setPaymentMethod(v); setPage(1) }}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="همه">همه</SelectItem>
                  <SelectItem value="نقدی">نقدی</SelectItem>
                  <SelectItem value="کارت بانکی">کارت بانکی</SelectItem>
                  <SelectItem value="نسیه">نسیه</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">شماره فاکتور</Label>
              <div className="relative">
                <Search className="absolute right-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); setSales([]); }}
                  className="w-48 pr-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardContent className="pt-6 px-0 pb-0">
          <div style={{ maxHeight: '520px', overflowY: 'auto', overflowX: 'auto' }}>
            {loading ? (
              <SalesTableSkeleton />
            ) : sales.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="size-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg">هیچ فروشی یافت نشد</p>
                <p className="text-sm mt-1">فیلترها را تغییر دهید</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>شماره فاکتور</TableHead>
                    <TableHead>مشتری</TableHead>
                    <TableHead>تعداد اقلام</TableHead>
                    <TableHead>مبلغ کل</TableHead>
                    <TableHead>تخفیف</TableHead>
                    <TableHead>مبلغ نهایی</TableHead>
                    <TableHead>روش پرداخت</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow
                      key={sale.id}
                      className="cursor-pointer"
                      onClick={() => viewSaleDetail(sale.id)}
                    >
                      <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                      <TableCell>{sale.customer?.name || '—'}</TableCell>
                      <TableCell>{formatNumber(sale.items?.length || 0)}</TableCell>
                      <TableCell>{formatNumber(sale.totalAmount)} افغانی</TableCell>
                      <TableCell className="text-destructive">
                        {sale.discount > 0 ? `${formatNumber(sale.discount)} افغانی` : '—'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatNumber(sale.finalAmount)} افغانی
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getPaymentBadgeClass(sale.paymentMethod)}
                        >
                          {sale.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(sale.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            viewSaleDetail(sale.id)
                          }}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Show More */}
          {!loading && hasMore && (
            <div className="px-6 py-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                disabled={loadingMore}
                onClick={loadMore}
              >
                {loadingMore ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                    در حال بارگذاری...
                  </span>
                ) : (
                  <>
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                    نمایش بیشتر ({formatNumber(Math.min(remainingCount, 20))} فروش دیگر)
                  </>
                )}
              </Button>
            </div>
          )}
          {!loading && !hasMore && sales.length > 20 && (
            <div className="px-6 py-3 border-t">
              <p className="text-center text-xs text-muted-foreground">
                نمایش همه {formatNumber(total)} فاکتور
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sale Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>جزئیات فاکتور</DialogTitle>
                <DialogDescription>
                  {selectedSale?.invoiceNumber}
                </DialogDescription>
              </div>
              {selectedSale && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    printInvoice({
                      invoiceNumber: selectedSale.invoiceNumber,
                      date: formatDate(selectedSale.createdAt),
                      customer: selectedSale.customer,
                      items: selectedSale.items.map(item => ({
                        name: item.productName,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                      })),
                      totalAmount: selectedSale.totalAmount,
                      discount: selectedSale.discount,
                      finalAmount: selectedSale.finalAmount,
                      paidAmount: selectedSale.paidAmount,
                      change: selectedSale.change,
                      paymentMethod: selectedSale.paymentMethod,
                      notes: selectedSale.notes,
                    })
                  }}
                >
                  <Printer className="h-4 w-4" />
                  چاپ فاکتور
                </Button>
              )}
            </div>
          </DialogHeader>

          {detailLoading ? (
            <SaleDetailSkeleton />
          ) : selectedSale ? (
            <ScrollArea className="max-h-[70vh] pl-1">
              <div className="space-y-5">
                {/* Sale Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">شماره فاکتور</p>
                    <p className="font-semibold">{selectedSale.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">تاریخ</p>
                    <p className="font-semibold">{formatDate(selectedSale.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">مشتری</p>
                    <p className="font-semibold">
                      {selectedSale.customer?.name || 'بدون مشتری'}
                      {selectedSale.customer?.phone && (
                        <span className="text-muted-foreground font-normal mr-2">
                          ({selectedSale.customer.phone})
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">روش پرداخت</p>
                    <Badge
                      variant="outline"
                      className={getPaymentBadgeClass(selectedSale.paymentMethod)}
                    >
                      {selectedSale.paymentMethod}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Items Table */}
                <div>
                  <h3 className="font-semibold mb-3">اقلام فروش</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>محصول</TableHead>
                        <TableHead className="text-center">تعداد</TableHead>
                        <TableHead>قیمت واحد</TableHead>
                        <TableHead>جمع</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-center">{formatNumber(item.quantity)}</TableCell>
                          <TableCell>{formatNumber(item.unitPrice)} افغانی</TableCell>
                          <TableCell className="font-semibold">
                            {formatNumber(item.totalPrice)} افغانی
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Separator />

                {/* Payment Summary */}
                <div className="space-y-3">
                  <h3 className="font-semibold">خلاصه پرداخت</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">جمع کل:</span>
                      <span>{formatNumber(selectedSale.totalAmount)} افغانی</span>
                    </div>
                    {selectedSale.discount > 0 && (
                      <div className="flex justify-between text-sm text-destructive">
                        <span>تخفیف:</span>
                        <span>-{formatNumber(selectedSale.discount)} افغانی</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>مبلغ نهایی:</span>
                      <span>{formatNumber(selectedSale.finalAmount)} افغانی</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">مبلغ پرداخت شده:</span>
                      <span className="text-emerald-600">
                        {formatNumber(selectedSale.paidAmount)} افغانی
                      </span>
                    </div>
                    {selectedSale.change > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">پول برگشتی:</span>
                        <span>{formatNumber(selectedSale.change)} افغانی</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedSale.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">یادداشت:</p>
                      <p className="text-sm">{selectedSale.notes}</p>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
