'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Plus, Search, Edit, Trash2, Phone, Mail, MapPin, User,
  Camera, Upload, X, Users, ChevronDown, ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Types ---
interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  balance: number
  image: string | null
}

interface CustomerFormData {
  name: string
  phone: string
  email: string
  address: string
  image: string | null
}

// --- Helpers ---
function formatNumber(n: number): string {
  return n.toLocaleString('fa-AF')
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500',
    'bg-cyan-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500',
  ]
  return colors[name.charCodeAt(0) % colors.length]
}

// --- Image Upload Helper ---
function compressImage(file: File, maxWidth = 200, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ratio = maxWidth / img.width
        canvas.width = maxWidth
        canvas.height = img.height * ratio
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject('Canvas error'); return }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject('Image load error')
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject('File read error')
    reader.readAsDataURL(file)
  })
}

// --- Skeletons ---
function CustomersTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}

const emptyForm: CustomerFormData = {
  name: '',
  phone: '',
  email: '',
  address: '',
  image: null,
}

// --- Image Upload Zone ---
function ImageUploadZone({
  currentImage,
  onImageChange,
  onImageRemove,
}: {
  currentImage: string | null
  onImageChange: (dataUrl: string) => void
  onImageRemove: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('لطفاً فقط فایل تصویری انتخاب کنید')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم تصویر نباید بیشتر از ۵ مگابایت باشد')
      return
    }
    try {
      const compressed = await compressImage(file)
      onImageChange(compressed)
    } catch {
      toast.error('خطا در پردازش تصویر')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-2">
      <Label>تصویر مشتری</Label>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'relative flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed transition-colors cursor-pointer',
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
            currentImage && 'border-solid border-primary/30'
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {currentImage ? (
            <>
              <Avatar className="h-20 w-20 rounded-xl">
                <AvatarImage src={currentImage} alt="Customer" className="object-cover" />
                <AvatarFallback className="rounded-xl">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Upload className="h-5 w-5" />
              <span className="text-[10px]">آپلود</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ''
            }}
          />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">
            تصویر را بکشید و رها کنید یا کلیک کنید
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            فرمت‌های مجاز: JPG, PNG, WebP — حداکثر ۵ مگابایت
          </p>
          {currentImage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 h-7 text-xs text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onImageRemove() }}
            >
              <X className="h-3 w-3 ml-1" />
              حذف تصویر
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Customer Avatar Component ---
function CustomerAvatar({ customer, size = 'md' }: { customer: Customer | { name: string; image?: string | null }; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'md' ? 'h-10 w-10 text-sm' : 'h-14 w-14 text-lg'
  const colorClass = getAvatarColor(customer.name)

  if (customer.image) {
    return (
      <Avatar className={cn(sizeClass, 'rounded-xl')}>
        <AvatarImage src={customer.image} alt={customer.name} className="object-cover" />
        <AvatarFallback className={cn('rounded-xl', colorClass, 'text-white font-bold')}>
          {customer.name.slice(0, 2)}
        </AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Avatar className={cn(sizeClass, colorClass, 'rounded-xl')}>
      <AvatarFallback className="text-white font-bold">
        {customer.name.slice(0, 2)}
      </AvatarFallback>
    </Avatar>
  )
}

// --- Main Component ---
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showAll, setShowAll] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<CustomerFormData>({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)

  // --- Data Fetching ---
  const fetchCustomers = useCallback(async (pageNum: number, append = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '20' })
      if (search) params.set('search', search)

      const res = await fetch(`/api/customers?${params}`)
      const json = await res.json()
      if (json.success) {
        const newCustomers = json.data?.customers || []
        setCustomers(prev => append ? [...prev, ...newCustomers] : newCustomers)
        setTotal(json.data?.pagination?.total || 0)
      } else {
        toast.error('خطا در دریافت اطلاعات مشتریان')
      }
    } catch {
      toast.error('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [search])

  useEffect(() => {
    fetchCustomers(1)
    setShowAll(false)
  }, [fetchCustomers])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchCustomers(nextPage, true)
  }



  // --- Dialog Handlers ---
  const openAddDialog = () => {
    setEditingCustomer(null)
    setFormData({ ...emptyForm })
    setDialogOpen(true)
  }

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      image: customer.image,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('نام مشتری الزامی است')
      return
    }
    if (!formData.phone.trim()) {
      toast.error('شماره تلفن الزامی است')
      return
    }

    setSubmitting(true)
    try {
      const url = editingCustomer
        ? `/api/customers/${editingCustomer.id}`
        : '/api/customers'
      const method = editingCustomer ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()

      if (json.success) {
        toast.success(editingCustomer ? 'مشتری با موفقیت ویرایش شد' : 'مشتری جدید با موفقیت اضافه شد')
        setDialogOpen(false)
        fetchCustomers()
      } else {
        toast.error(json.error || 'خطا در ذخیره اطلاعات')
      }
    } catch {
      toast.error('خطا در اتصال به سرور')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast.success('مشتری با موفقیت حذف شد')
        fetchCustomers()
      } else {
        toast.error(json.error || 'خطا در حذف مشتری')
      }
    } catch {
      toast.error('خطا در اتصال به سرور')
    }
  }

  const hasMore = customers.length < total
  const remainingCount = total - customers.length

  return (
    <div className="space-y-6" dir="rtl">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
            <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">مشتریان</h1>
            <p className="text-sm text-muted-foreground">
              مدیریت اطلاعات مشتریان فروشگاه
            </p>
          </div>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          افزودن مشتری
        </Button>
      </div>

      {/* ═══ Stats Bar ═══ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
                <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">کل مشتریان</p>
                <p className="text-lg font-bold">{formatNumber(total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">با تصویر</p>
                <p className="text-lg font-bold">{formatNumber(customers.filter(c => c.image).length)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                <Phone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">بدهکار</p>
                <p className="text-lg font-bold">
                  {formatNumber(customers.filter(c => c.balance > 0).length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/40">
                <Mail className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">با ایمیل</p>
                <p className="text-lg font-bold">
                  {formatNumber(customers.filter(c => c.email).length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ Search ═══ */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="جستجو بر اساس نام یا شماره تلفن..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pr-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* ═══ Customers Table ═══ */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="overflow-y-auto max-h-[560px]">
            {loading ? (
              <CustomersTableSkeleton />
            ) : customers.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <User className="mx-auto mb-3 h-12 w-12 opacity-30" />
                <p className="text-lg font-medium">هیچ مشتری‌ای یافت نشد</p>
                <p className="text-sm mt-1">
                  {search ? 'عبارت جستجو را تغییر دهید' : 'اولین مشتری را اضافه کنید'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right w-[50px]">تصویر</TableHead>
                    <TableHead className="text-right">نام</TableHead>
                    <TableHead className="text-right">تلفن</TableHead>
                    <TableHead className="text-right hidden md:table-cell">ایمیل</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">آدرس</TableHead>
                    <TableHead className="text-right">مانده حساب</TableHead>
                    <TableHead className="text-right w-[100px]">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id} className="group">
                      <TableCell>
                        <CustomerAvatar customer={customer} size="sm" />
                      </TableCell>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span dir="ltr" className="text-sm">{customer.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {customer.email ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{customer.email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {customer.address ? (
                          <div className="flex items-center gap-1.5 max-w-[180px]">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate text-sm">{customer.address}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={customer.balance > 0 ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {formatNumber(customer.balance)} افغانی
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(customer)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف مشتری</AlertDialogTitle>
                                <AlertDialogDescription>
                                  آیا مطمئن هستید که می‌خواهید مشتری «{customer.name}» را حذف کنید؟
                                  این عمل قابل برگشت نیست.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>انصراف</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(customer.id)}
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Show More */}
          {hasMore && (
            <div className="border-t pt-3 mt-3">
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
                    نمایش بیشتر ({formatNumber(Math.min(remainingCount, 20))} مشتری دیگر)
                  </>
                )}
              </Button>
            </div>
          )}
          {!hasMore && customers.length > 20 && (
            <div className="border-t pt-3 mt-3">
              <p className="text-center text-xs text-muted-foreground">
                نمایش همه {formatNumber(total)} مشتری
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ Add/Edit Dialog ═══ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'ویرایش مشتری' : 'افزودن مشتری جدید'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? 'اطلاعات مشتری را ویرایش کنید'
                : 'اطلاعات مشتری جدید را وارد کنید'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pl-1">
            {/* Image Upload */}
            <ImageUploadZone
              currentImage={formData.image}
              onImageChange={(dataUrl) => setFormData({ ...formData, image: dataUrl })}
              onImageRemove={() => setFormData({ ...formData, image: null })}
            />

            {/* Form Fields */}
            <div className="space-y-2">
              <Label htmlFor="customer-name">نام <span className="text-destructive">*</span></Label>
              <Input
                id="customer-name"
                placeholder="نام مشتری"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">شماره تلفن <span className="text-destructive">*</span></Label>
              <Input
                id="customer-phone"
                placeholder="مثال: ۰۷۷۰۱۲۳۴۵۶"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">ایمیل</Label>
              <Input
                id="customer-email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address">آدرس</Label>
              <Input
                id="customer-address"
                placeholder="آدرس مشتری"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              انصراف
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'در حال ذخیره...' : editingCustomer ? 'ذخیره تغییرات' : 'افزودن'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
