'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category {
  id: string
  name: string
  color: string
  _count?: { products: number }
}

interface Product {
  id: string
  name: string
  sku: string
  barcode: string | null
  categoryId: string | null
  buyPrice: number
  sellPrice: number
  stock: number
  minStock: number
  unit: string
  isActive: boolean
  description: string | null
  category: Category | null
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

type StockFilter = 'all' | 'inStock' | 'outOfStock' | 'lowStock'

interface ProductFormData {
  name: string
  sku: string
  barcode: string
  categoryId: string
  buyPrice: string
  sellPrice: string
  stock: string
  minStock: string
  unit: string
  description: string
}

const initialFormData: ProductFormData = {
  name: '',
  sku: '',
  barcode: '',
  categoryId: '',
  buyPrice: '',
  sellPrice: '',
  stock: '0',
  minStock: '5',
  unit: 'عدد',
  description: '',
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [submitting, setSubmitting] = useState(false)

  // Dialog states
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)

  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  // ── Fetch data ────────────────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      const json = await res.json()
      if (json.success) setCategories(json.data)
    } catch {
      // silent
    }
  }, [])

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (search.trim()) params.set('search', search.trim())
      if (categoryFilter !== 'all') params.set('categoryId', categoryFilter)

      const res = await fetch(`/api/products?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        let filtered = json.data.products as Product[]
        // Client-side stock filter
        if (stockFilter === 'inStock') {
          filtered = filtered.filter((p) => p.stock > p.minStock && p.stock > 0)
        } else if (stockFilter === 'outOfStock') {
          filtered = filtered.filter((p) => p.stock === 0)
        } else if (stockFilter === 'lowStock') {
          filtered = filtered.filter((p) => p.stock > 0 && p.stock <= p.minStock)
        }
        setProducts(filtered)
        setPagination(json.data.pagination)
      }
    } catch {
      toast.error('خطا در دریافت محصولات')
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, stockFilter])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchProducts(1)
  }, [fetchProducts])

  // ── Generate SKU ──────────────────────────────────────────────────────────

  function generateSku() {
    const prefix = 'PRD'
    const rand = Math.floor(10000 + Math.random() * 90000)
    return `${prefix}-${rand}`
  }

  // ── Open add dialog ───────────────────────────────────────────────────────

  function openAddDialog() {
    setEditingProduct(null)
    setFormData({ ...initialFormData, sku: generateSku() })
    setProductDialogOpen(true)
  }

  // ── Open edit dialog ──────────────────────────────────────────────────────

  function openEditDialog(product: Product) {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      categoryId: product.categoryId || '',
      buyPrice: String(product.buyPrice),
      sellPrice: String(product.sellPrice),
      stock: String(product.stock),
      minStock: String(product.minStock),
      unit: product.unit,
      description: product.description || '',
    })
    setProductDialogOpen(true)
  }

  // ── Submit product ────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('نام محصول الزامی است')
      return
    }
    if (!formData.sellPrice || Number(formData.sellPrice) < 0) {
      toast.error('قیمت فروش الزامی است')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku || undefined,
        barcode: formData.barcode || null,
        categoryId: formData.categoryId || null,
        buyPrice: Number(formData.buyPrice) || 0,
        sellPrice: Number(formData.sellPrice),
        stock: Number(formData.stock) || 0,
        minStock: Number(formData.minStock) || 5,
        unit: formData.unit,
        description: formData.description || null,
      }

      let res: Response
      if (editingProduct) {
        res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const json = await res.json()
      if (json.success) {
        toast.success(editingProduct ? 'محصول با موفقیت ویرایش شد' : 'محصول جدید اضافه شد')
        setProductDialogOpen(false)
        fetchProducts(pagination.page)
        fetchCategories()
      } else {
        toast.error(json.error || 'خطا در ذخیره محصول')
      }
    } catch {
      toast.error('خطا در ارتباط با سرور')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete product ────────────────────────────────────────────────────────

  function confirmDelete(product: Product) {
    setDeletingProduct(product)
    setDeleteDialogOpen(true)
  }

  async function handleDelete() {
    if (!deletingProduct) return
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('محصول حذف شد')
        setDeleteDialogOpen(false)
        setDeletingProduct(null)
        fetchProducts(pagination.page)
      } else {
        toast.error(json.error || 'خطا در حذف محصول')
      }
    } catch {
      toast.error('خطا در ارتباط با سرور')
    }
  }

  // ── Pagination ────────────────────────────────────────────────────────────

  function goToPage(page: number) {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchProducts(page)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Package className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">محصولات</h1>
            <p className="text-sm text-muted-foreground">
              مدیریت و مشاهده‌ی کلیه‌ی محصولات فروشگاه
            </p>
          </div>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="size-4" />
          افزودن محصول
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* Search */}
            <div className="flex-1 space-y-2">
              <Label htmlFor="product-search">جستجو (نام / SKU)</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="product-search"
                  placeholder="جستجوی محصول..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Category filter */}
            <div className="min-w-[180px] space-y-2">
              <Label>دسته‌بندی</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="همه دسته‌بندی‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه دسته‌بندی‌ها</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block size-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stock filter */}
            <div className="min-w-[160px] space-y-2">
              <Label>وضعیت موجودی</Label>
              <Select
                value={stockFilter}
                onValueChange={(v) => setStockFilter(v as StockFilter)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="همه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="inStock">موجود</SelectItem>
                  <SelectItem value="lowStock">کم‌موجود</SelectItem>
                  <SelectItem value="outOfStock">ناموجود</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <ProductsTableSkeleton />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="mb-3 size-12 opacity-30" />
              <p className="text-lg font-medium">محصولی یافت نشد</p>
              <p className="text-sm">فیلترهای جستجو را تغییر دهید یا محصول جدید اضافه کنید</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">نام</TableHead>
                  <TableHead className="text-right">SKU</TableHead>
                  <TableHead className="text-right hidden md:table-cell">دسته‌بندی</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">قیمت خرید</TableHead>
                  <TableHead className="text-right">قیمت فروش</TableHead>
                  <TableHead className="text-right">موجودی</TableHead>
                  <TableHead className="text-right">وضعیت</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const status = getStockStatus(product)
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {product.sku}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
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
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {formatPrice(product.buyPrice)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(product.sellPrice)}
                      </TableCell>
                      <TableCell>
                        <span className="tabular-nums">{formatNumber(product.stock)}</span>
                        <span className="mr-1 text-xs text-muted-foreground">
                          {product.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={status.className}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(product)}
                            title="ویرایش"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => confirmDelete(product)}
                            title="حذف"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              نمایش {formatNumber((pagination.page - 1) * pagination.limit + 1)} تا{' '}
              {formatNumber(Math.min(pagination.page * pagination.limit, pagination.total))} از{' '}
              {formatNumber(pagination.total)} محصول
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
              >
                قبلی
              </Button>
              <span className="text-sm tabular-nums">
                {formatNumber(pagination.page)} / {formatNumber(pagination.totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => goToPage(pagination.page + 1)}
              >
                بعدی
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add / Edit Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'ویرایش محصول' : 'افزودن محصول جدید'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'اطلاعات محصول را ویرایش کنید'
                : 'اطلاعات محصول جدید را وارد کنید'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="form-name">
                  نام محصول <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="form-name"
                  placeholder="نام محصول..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>

              {/* SKU */}
              <div className="space-y-2">
                <Label htmlFor="form-sku">SKU</Label>
                <div className="flex gap-2">
                  <Input
                    id="form-sku"
                    placeholder="PRD-00001"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sku: e.target.value }))
                    }
                  />
                  {!editingProduct && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, sku: generateSku() }))
                      }
                      title="تولید خودکار SKU"
                    >
                      <Package className="size-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Barcode */}
              <div className="space-y-2">
                <Label htmlFor="form-barcode">بارکد</Label>
                <Input
                  id="form-barcode"
                  placeholder="بارکد محصول..."
                  value={formData.barcode}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, barcode: e.target.value }))
                  }
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>دسته‌بندی</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, categoryId: v }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب دسته‌بندی" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block size-2.5 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Buy price */}
              <div className="space-y-2">
                <Label htmlFor="form-buy-price">قیمت خرید (افغانی)</Label>
                <Input
                  id="form-buy-price"
                  type="number"
                  min="0"
                  placeholder="۰"
                  value={formData.buyPrice}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, buyPrice: e.target.value }))
                  }
                />
              </div>

              {/* Sell price */}
              <div className="space-y-2">
                <Label htmlFor="form-sell-price">
                  قیمت فروش (افغانی) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="form-sell-price"
                  type="number"
                  min="0"
                  placeholder="۰"
                  value={formData.sellPrice}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sellPrice: e.target.value }))
                  }
                  required
                />
              </div>

              {/* Stock */}
              <div className="space-y-2">
                <Label htmlFor="form-stock">موجودی</Label>
                <Input
                  id="form-stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, stock: e.target.value }))
                  }
                />
              </div>

              {/* Min stock */}
              <div className="space-y-2">
                <Label htmlFor="form-min-stock">حداقل موجودی</Label>
                <Input
                  id="form-min-stock"
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, minStock: e.target.value }))
                  }
                />
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label>واحد</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, unit: v }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="عدد">عدد</SelectItem>
                    <SelectItem value="کیلو">کیلو</SelectItem>
                    <SelectItem value="لیتر">لیتر</SelectItem>
                    <SelectItem value="بسته">بسته</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="form-desc">توضیحات</Label>
              <Textarea
                id="form-desc"
                placeholder="توضیحات اختیاری..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>

            {/* Submit */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setProductDialogOpen(false)}
                disabled={submitting}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {editingProduct ? 'ذخیره تغییرات' : 'افزودن محصول'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف محصول</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف محصول &laquo;{deletingProduct?.name}&raquo; اطمینان دارید؟
              این عملیات قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ProductsTableSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24 hidden md:block" />
          <Skeleton className="h-4 w-20 hidden lg:block" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}
