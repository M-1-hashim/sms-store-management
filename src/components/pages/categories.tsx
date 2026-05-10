'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  Loader2,
  LayoutGrid,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category {
  id: string
  name: string
  description: string | null
  color: string
  createdAt: string
  _count?: { products: number }
}

interface CategoryFormData {
  name: string
  description: string
  color: string
}

const initialFormData: CategoryFormData = {
  name: '',
  description: '',
  color: '#6366f1',
}

// ─── Preset Colors ──────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#84cc16', '#22c55e', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#64748b',
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData)

  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  // ── Fetch categories ──────────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/categories')
      const json = await res.json()
      if (json.success) {
        setCategories(json.data)
      } else {
        toast.error(json.error || 'خطا در دریافت دسته‌بندی‌ها')
      }
    } catch {
      toast.error('خطا در ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // ── Open add dialog ───────────────────────────────────────────────────────

  function openAddDialog() {
    setEditingCategory(null)
    setFormData(initialFormData)
    setDialogOpen(true)
  }

  // ── Open edit dialog ──────────────────────────────────────────────────────

  function openEditDialog(category: Category) {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
    })
    setDialogOpen(true)
  }

  // ── Submit category ───────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('نام دسته‌بندی الزامی است')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description || null,
        color: formData.color,
      }

      let res: Response
      if (editingCategory) {
        res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const json = await res.json()
      if (json.success) {
        toast.success(
          editingCategory
            ? 'دسته‌بندی با موفقیت ویرایش شد'
            : 'دسته‌بندی جدید اضافه شد'
        )
        setDialogOpen(false)
        fetchCategories()
      } else {
        toast.error(json.error || 'خطا در ذخیره دسته‌بندی')
      }
    } catch {
      toast.error('خطا در ارتباط با سرور')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete category ───────────────────────────────────────────────────────

  function confirmDelete(category: Category) {
    setDeletingCategory(category)
    setDeleteDialogOpen(true)
  }

  async function handleDelete() {
    if (!deletingCategory) return
    try {
      const res = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('دسته‌بندی حذف شد')
        setDeleteDialogOpen(false)
        setDeletingCategory(null)
        fetchCategories()
      } else {
        toast.error(json.error || 'خطا در حذف دسته‌بندی')
      }
    } catch {
      toast.error('خطا در ارتباط با سرور')
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <LayoutGrid className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">دسته‌بندی‌ها</h1>
            <p className="text-sm text-muted-foreground">
              مدیریت دسته‌بندی‌های محصولات فروشگاه
            </p>
          </div>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="size-4" />
          افزودن دسته‌بندی
        </Button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-4 rounded-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <div className="flex gap-2">
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderOpen className="mb-3 size-12 opacity-30" />
            <p className="text-lg font-medium">دسته‌بندی‌ای وجود ندارد</p>
            <p className="text-sm">اولین دسته‌بندی خود را ایجاد کنید</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="relative overflow-hidden transition-shadow hover:shadow-md"
            >
              {/* Color indicator */}
              <div
                className="absolute right-0 top-0 bottom-0 w-1 rounded-r-xl"
                style={{ backgroundColor: category.color }}
              />

              <CardHeader className="pr-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="shrink-0 size-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <CardTitle className="truncate text-base">
                      {category.name}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="shrink-0 tabular-nums">
                    {category._count?.products ?? 0} محصول
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pr-5">
                {category.description && (
                  <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                )}

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => openEditDialog(category)}
                  >
                    <Pencil className="size-3.5" />
                    ویرایش
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => confirmDelete(category)}
                  >
                    <Trash2 className="size-3.5" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'اطلاعات دسته‌بندی را ویرایش کنید'
                : 'اطلاعات دسته‌بندی جدید را وارد کنید'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="cat-name">
                نام دسته‌بندی <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cat-name"
                placeholder="نام دسته‌بندی..."
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="cat-desc">توضیحات</Label>
              <Textarea
                id="cat-desc"
                placeholder="توضیحات اختیاری..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>رنگ</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`size-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      formData.color === color
                        ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-foreground/20'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, color }))
                    }
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="cat-color-custom" className="text-xs text-muted-foreground">
                  رنگ سفارشی:
                </Label>
                <Input
                  id="cat-color-custom"
                  type="color"
                  className="h-8 w-12 cursor-pointer p-1"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                />
                <span className="text-xs text-muted-foreground font-mono">
                  {formData.color}
                </span>
              </div>
            </div>

            {/* Submit */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {editingCategory ? 'ذخیره تغییرات' : 'افزودن دسته‌بندی'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف دسته‌بندی</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف دسته‌بندی &laquo;{deletingCategory?.name}&raquo; اطمینان دارید؟
              {deletingCategory && (deletingCategory._count?.products ?? 0) > 0 && (
                <span className="mt-2 block font-medium text-amber-600 dark:text-amber-400">
                  توجه: این دسته‌بندی دارای {(deletingCategory._count?.products ?? 0)} محصول
                  فعال است و قابل حذف نیست.
                </span>
              )}
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
