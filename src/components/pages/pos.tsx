'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Package,
  CheckCircle,
  X,
  ScanBarcode,
  Grid3X3,
  LayoutList,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'

import { useCartStore, type CartItem } from '@/lib/store'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  sku: string
  barcode: string | null
  sellPrice: number
  stock: number
  minStock: number
  unit: string
  isActive: boolean
  category: { id: string; name: string; color: string } | null
}

interface Customer {
  id: string
  name: string
  phone: string
  image?: string | null
}

interface Category {
  id: string
  name: string
  color: string
  _count: { products: number }
}

// ─── Helpers ──────────────────────────────────────────────────────────

function toFarsi(num: number): string {
  return num.toLocaleString('fa-AF')
}

// ─── Product Card Skeleton ────────────────────────────────────────────

function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Payment Method Option ────────────────────────────────────────────

interface PaymentOption {
  value: string
  label: string
  color: string
  activeColor: string
}

const paymentMethods: PaymentOption[] = [
  { value: 'نقدی', label: 'نقدی', color: 'border-emerald-200 text-emerald-700', activeColor: 'bg-emerald-600 border-emerald-600 text-white' },
  { value: 'کارت بانکی', label: 'کارت بانکی', color: 'border-blue-200 text-blue-700', activeColor: 'bg-blue-600 border-blue-600 text-white' },
  { value: 'نسیه', label: 'نسیه', color: 'border-amber-200 text-amber-700', activeColor: 'bg-amber-600 border-amber-600 text-white' },
]

// ─── Main POS Component ──────────────────────────────────────────────

export default function POSPage() {
  // ── State ─────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // ── Cart Store ────────────────────────────────────────────────────
  const {
    items,
    customerId,
    discount,
    paymentMethod,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setCustomerId,
    setDiscount,
    setPaymentMethod,
    getTotal,
    getFinalTotal,
  } = useCartStore()

  // ── Derived Values ────────────────────────────────────────────────
  const total = getTotal()
  const finalTotal = getFinalTotal()

  const filteredProducts = useMemo(() => {
    let result = products

    if (selectedCategory) {
      result = result.filter((p) => p.category?.id === selectedCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      )
    }

    return result
  }, [products, selectedCategory, searchQuery])

  // ── Data Fetching ─────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [productsRes, categoriesRes, customersRes] = await Promise.all([
        fetch('/api/products?limit=100'),
        fetch('/api/categories'),
        fetch('/api/customers?limit=100'),
      ])

      const [productsJson, categoriesJson, customersJson] = await Promise.all([
        productsRes.json(),
        categoriesRes.json(),
        customersRes.json(),
      ])

      if (productsJson.success) setProducts(productsJson.data.products)
      if (categoriesJson.success) setCategories(categoriesJson.data)
      if (customersJson.success) setCustomers(customersJson.data.customers)
    } catch {
      toast.error('خطا در دریافت اطلاعات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Handlers ──────────────────────────────────────────────────────
  function handleAddToCart(product: Product) {
    if (product.stock <= 0) return

    const existing = items.find((i) => i.productId === product.id)
    if (existing && existing.quantity >= product.stock) {
      toast.error(`موجودی ${product.name} کافی نیست`)
      return
    }

    addItem({
      productId: product.id,
      productName: product.name,
      price: product.sellPrice,
      quantity: 1,
      maxStock: product.stock,
    })
    toast.success(`${product.name} به سبد اضافه شد`)
  }

  async function handleCompleteSale() {
    if (items.length === 0) {
      toast.error('سبد خرید خالی است')
      return
    }

    if (paymentMethod === 'نسیه' && !customerId) {
      toast.error('برای فروش نسیه، انتخاب مشتری الزامی است')
      return
    }

    try {
      setSubmitting(true)

      const saleData = {
        customerId: customerId || null,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        discount,
        paymentMethod,
        paidAmount: finalTotal,
      }

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      })

      const json = await res.json()

      if (json.success) {
        toast.success('فاکتور با موفقیت ثبت شد', {
          description: `شماره فاکتور: ${json.data.invoiceNumber}`,
          duration: 4000,
        })
        clearCart()
        // Refresh products to update stock
        fetchData()
      } else {
        toast.error(json.error || 'خطا در ثبت فاکتور')
      }
    } catch {
      toast.error('خطا در ارتباط با سرور')
    } finally {
      setSubmitting(false)
    }
  }

  function handleClearCart() {
    if (items.length === 0) return
    clearCart()
    toast.info('سبد خرید پاک شد')
  }

  function handleDiscountChange(value: string) {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0) {
      setDiscount(num)
    } else if (value === '') {
      setDiscount(0)
    }
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6" dir="rtl">
      {/* ─── Right Panel: Product Selection (60%) ────────────────────── */}
      <div className="flex-1 space-y-4 lg:w-[60%]">
        {/* Search & Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="جستجوی محصول با نام، کد SKU یا بارکد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="h-9 w-9"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="h-9 w-9"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Tabs */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-muted text-muted-foreground'
              }`}
            >
              همه ({toFarsi(products.length)})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-muted text-muted-foreground'
                }`}
              >
                {cat.name} ({toFarsi(cat._count.products)})
              </button>
            ))}
          </div>
        )}

        {/* Product Grid / List */}
        {loading ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4'
            : 'space-y-2'
          }>
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-muted-foreground">
            <ScanBarcode className="mb-3 h-12 w-12" />
            <p className="text-lg font-medium">محصولی یافت نشد</p>
            <p className="text-sm">فیلتر جستجو یا دسته‌بندی را تغییر دهید</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0
              const isLowStock = product.stock > 0 && product.stock <= product.minStock
              const inCart = items.find((i) => i.productId === product.id)

              return (
                <Card
                  key={product.id}
                  className={`overflow-hidden transition-all hover:shadow-md ${
                    isOutOfStock
                      ? 'opacity-50 grayscale'
                      : 'cursor-pointer hover:border-primary/50'
                  }`}
                  onClick={() => !isOutOfStock && handleAddToCart(product)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Product Name */}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold leading-tight">
                          {product.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{product.sku}</p>
                      </div>

                      {/* Category Badge */}
                      {product.category && (
                        <Badge variant="outline" className="text-xs">
                          <span
                            className="mr-1 inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: product.category.color }}
                          />
                          {product.category.name}
                        </Badge>
                      )}

                      {/* Price & Stock */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-primary">
                            {toFarsi(product.sellPrice)} <span className="text-xs font-normal text-muted-foreground">افغانی</span>
                          </p>
                          <p className={`text-xs ${isLowStock ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                            موجودی: {toFarsi(product.stock)} {product.unit}
                          </p>
                        </div>

                        {/* Add / In Cart Indicator */}
                        {isOutOfStock ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <X className="h-4 w-4" />
                          </div>
                        ) : inCart ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <span className="text-xs font-bold">{toFarsi(inCart.quantity)}</span>
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <Plus className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0
              const isLowStock = product.stock > 0 && product.stock <= product.minStock
              const inCart = items.find((i) => i.productId === product.id)

              return (
                <Card
                  key={product.id}
                  className={`cursor-pointer transition-all hover:shadow-sm ${
                    isOutOfStock ? 'opacity-50 grayscale' : 'hover:border-primary/50'
                  }`}
                  onClick={() => !isOutOfStock && handleAddToCart(product)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{product.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{product.sku}</span>
                          {product.category && (
                            <>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">{product.category.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <p className="text-sm font-bold text-primary">
                          {toFarsi(product.sellPrice)}
                        </p>
                        <p className={`text-xs ${isLowStock ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                          موجودی: {toFarsi(product.stock)}
                        </p>
                      </div>
                      {isOutOfStock ? (
                        <Badge variant="destructive" className="text-xs">ناموجود</Badge>
                      ) : inCart ? (
                        <Badge className="bg-primary text-xs">
                          {toFarsi(inCart.quantity)} در سبد
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline" className="h-8 gap-1">
                          <Plus className="h-3 w-3" />
                          افزودن
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Product count */}
        {!loading && filteredProducts.length > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {toFarsi(filteredProducts.length)} محصول نمایش داده شده
          </p>
        )}
      </div>

      {/* ─── Left Panel: Cart (40%) ──────────────────────────────────── */}
      <div className="lg:w-[40%]">
        <Card className="sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                سبد خرید
              </div>
              {items.length > 0 && (
                <Badge variant="secondary">{toFarsi(items.length)} محصول</Badge>
              )}
            </CardTitle>
          </CardHeader>

          <Separator />

          <CardContent className="space-y-4 p-4">
            {/* Cart Items */}
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingCart className="mb-3 h-12 w-12" />
                <p className="font-medium">سبد خرید خالی است</p>
                <p className="text-sm">محصولات را از لیست سمت راست اضافه کنید</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[340px]">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="rounded-lg border p-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-medium">
                          {item.productName}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.productId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Price Info */}
                        <div>
                          <p className="text-xs text-muted-foreground">
                            قیمت واحد: {toFarsi(item.price)} افغانی
                          </p>
                          <p className="text-sm font-bold text-primary">
                            {toFarsi(item.price * item.quantity)} افغانی
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.maxStock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <span className="flex h-8 w-10 items-center justify-center rounded-md border bg-muted text-sm font-semibold">
                            {toFarsi(item.quantity)}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Summary Section */}
            {items.length > 0 && (
              <>
                <Separator />

                {/* Customer Selector */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">مشتری (اختیاری)</Label>
                  <div className="flex items-center gap-2">
                    {customerId && (() => {
                      const sel = customers.find(c => c.id === customerId)
                      if (sel) {
                        const colors = ['bg-rose-500','bg-emerald-500','bg-amber-500','bg-violet-500','bg-cyan-500']
                        const colorIdx = sel.name.charCodeAt(0) % colors.length
                        return sel.image ? (
                          <img src={sel.image} alt={sel.name} className="h-7 w-7 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white text-[10px] font-bold', colors[colorIdx])}>
                            {sel.name.slice(0, 2)}
                          </div>
                        )
                      }
                      return null
                    })()}
                    <select
                      value={customerId || ''}
                      onChange={(e) => setCustomerId(e.target.value || null)}
                      className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">بدون مشتری</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.phone}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">روش پرداخت</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map((pm) => (
                      <button
                        key={pm.value}
                        onClick={() => setPaymentMethod(pm.value)}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                          paymentMethod === pm.value
                            ? pm.activeColor
                            : pm.color
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Discount */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">تخفیف (افغانی)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={discount || ''}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    placeholder="مبلغ تخفیف"
                    className="text-left"
                  />
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">جمع کل:</span>
                    <span>{toFarsi(total)} افغانی</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">تخفیف:</span>
                      <span className="text-red-500">-{toFarsi(discount)} افغانی</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <span className="text-base font-semibold">مبلغ نهایی:</span>
                    <span className="text-xl font-bold text-primary">
                      {toFarsi(finalTotal)}
                    </span>
                  </div>
                  <p className="text-left text-xs text-muted-foreground">افغانی</p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    className="h-12 w-full gap-2 bg-emerald-600 text-base font-semibold hover:bg-emerald-700"
                    onClick={handleCompleteSale}
                    disabled={submitting || items.length === 0}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        در حال ثبت...
                      </span>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        تکمیل فروش
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleClearCart}
                    disabled={items.length === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                    پاک کردن سبد
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
