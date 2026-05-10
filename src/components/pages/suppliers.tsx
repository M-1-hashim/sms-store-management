'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Plus, Edit, Trash2, Phone, Mail, MapPin, Truck } from 'lucide-react'

// --- Types ---
interface Supplier {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  createdAt: string
}

interface SupplierFormData {
  name: string
  phone: string
  email: string
  address: string
}

// --- Skeletons ---
function SuppliersTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}

const emptyForm: SupplierFormData = {
  name: '',
  phone: '',
  email: '',
  address: '',
}

// --- Main Component ---
export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState<SupplierFormData>({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)

  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/suppliers')
      const json = await res.json()
      if (json.success) {
        setSuppliers(json.data || [])
      } else {
        toast.error('خطا در دریافت اطلاعات تأمین‌کنندگان')
      }
    } catch {
      toast.error('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  const openAddDialog = () => {
    setEditingSupplier(null)
    setFormData({ ...emptyForm })
    setDialogOpen(true)
  }

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('نام تأمین‌کننده الزامی است')
      return
    }
    if (!formData.phone.trim()) {
      toast.error('شماره تلفن الزامی است')
      return
    }

    setSubmitting(true)
    try {
      const url = editingSupplier
        ? `/api/suppliers/${editingSupplier.id}`
        : '/api/suppliers'
      const method = editingSupplier ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()

      if (json.success) {
        toast.success(
          editingSupplier
            ? 'تأمین‌کننده با موفقیت ویرایش شد'
            : 'تأمین‌کننده جدید با موفقیت اضافه شد'
        )
        setDialogOpen(false)
        fetchSuppliers()
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
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast.success('تأمین‌کننده با موفقیت حذف شد')
        fetchSuppliers()
      } else {
        toast.error(json.error || 'خطا در حذف تأمین‌کننده')
      }
    } catch {
      toast.error('خطا در اتصال به سرور')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">تأمین‌کنندگان</h1>
        <Button onClick={openAddDialog}>
          <Plus className="size-4 ml-2" />
          افزودن تأمین‌کننده
        </Button>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardContent className="pt-6">
          <ScrollArea className="max-h-[520px]">
            {loading ? (
              <SuppliersTableSkeleton />
            ) : suppliers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Truck className="size-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg">هیچ تأمین‌کننده‌ای یافت نشد</p>
                <p className="text-sm mt-1">اولین تأمین‌کننده را اضافه کنید</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام</TableHead>
                    <TableHead>تلفن</TableHead>
                    <TableHead>ایمیل</TableHead>
                    <TableHead>آدرس</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Phone className="size-3.5 text-muted-foreground" />
                          <span dir="ltr">{supplier.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.email ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="size-3.5 text-muted-foreground" />
                            <span>{supplier.email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {supplier.address ? (
                          <div className="flex items-center gap-1.5 max-w-[200px]">
                            <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{supplier.address}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(supplier)}
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
                                <AlertDialogTitle>حذف تأمین‌کننده</AlertDialogTitle>
                                <AlertDialogDescription>
                                  آیا مطمئن هستید که می‌خواهید تأمین‌کننده «{supplier.name}» را حذف کنید؟
                                  این عمل قابل برگشت نیست.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>انصراف</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(supplier.id)}
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
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'ویرایش تأمین‌کننده' : 'افزودن تأمین‌کننده جدید'}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? 'اطلاعات تأمین‌کننده را ویرایش کنید'
                : 'اطلاعات تأمین‌کننده جدید را وارد کنید'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-name">نام <span className="text-destructive">*</span></Label>
              <Input
                id="supplier-name"
                placeholder="نام تأمین‌کننده"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-phone">شماره تلفن <span className="text-destructive">*</span></Label>
              <Input
                id="supplier-phone"
                placeholder="مثال: ۰۷۷۰۱۲۳۴۵۶"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-email">ایمیل</Label>
              <Input
                id="supplier-email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-address">آدرس</Label>
              <Input
                id="supplier-address"
                placeholder="آدرس تأمین‌کننده"
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
              {submitting ? 'در حال ذخیره...' : editingSupplier ? 'ذخیره تغییرات' : 'افزودن'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
