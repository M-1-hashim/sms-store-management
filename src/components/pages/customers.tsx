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
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, User } from 'lucide-react'

// --- Types ---
interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  balance: number
  totalPurchases?: number
}

interface CustomerFormData {
  name: string
  phone: string
  email: string
  address: string
}

// --- Helpers ---
function formatNumber(n: number): string {
  return n.toLocaleString('fa-AF')
}

// --- Skeletons ---
function CustomersTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-16" />
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
}

// --- Main Component ---
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<CustomerFormData>({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)

      const res = await fetch(`/api/customers?${params}`)
      const json = await res.json()
      if (json.success) {
        setCustomers(json.data || [])
        setTotal(json.total || json.data?.length || 0)
      } else {
        toast.error('خطا در دریافت اطلاعات مشتریان')
      }
    } catch {
      toast.error('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

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

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مشتریان</h1>
        <Button onClick={openAddDialog}>
          <Plus className="size-4 ml-2" />
          افزودن مشتری
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute right-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="جستجو بر اساس نام یا شماره تلفن..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pr-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="pt-6">
          <ScrollArea className="max-h-[520px]">
            {loading ? (
              <CustomersTableSkeleton />
            ) : customers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="size-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg">هیچ مشتری‌ای یافت نشد</p>
                <p className="text-sm mt-1">
                  {search ? 'عبارت جستجو را تغییر دهید' : 'اولین مشتری را اضافه کنید'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام</TableHead>
                    <TableHead>تلفن</TableHead>
                    <TableHead>ایمیل</TableHead>
                    <TableHead>آدرس</TableHead>
                    <TableHead>مانده حساب</TableHead>
                    <TableHead>تعداد خرید</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Phone className="size-3.5 text-muted-foreground" />
                          <span dir="ltr">{customer.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.email ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="size-3.5 text-muted-foreground" />
                            <span>{customer.email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.address ? (
                          <div className="flex items-center gap-1.5 max-w-[200px]">
                            <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{customer.address}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={customer.balance > 0 ? 'destructive' : 'secondary'}
                        >
                          {formatNumber(customer.balance)} افغانی
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {customer.totalPurchases != null
                          ? formatNumber(customer.totalPurchases)
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(customer)}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="size-4" />
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
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <span className="text-sm text-muted-foreground">
                صفحه {formatNumber(page)} از {formatNumber(totalPages)}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  قبلی
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  بعدی
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
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

          <div className="space-y-4">
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
