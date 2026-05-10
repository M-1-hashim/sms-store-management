'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Plus,
  Trash2,
  CalendarDays,
  Filter,
  DollarSign,
  Receipt,
  TrendingDown,
} from 'lucide-react'

// --- Types ---
interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  createdAt: string
}

interface ExpenseFormData {
  description: string
  amount: string
  category: string
  date: string
}

interface ExpenseSummary {
  totalAmount: number
  totalCount: number
}

// --- Constants ---
const EXPENSE_CATEGORIES = [
  'اجاره',
  'حقوق',
  'قبض',
  'تعمیرات',
  'حمل و نقل',
  'بسته‌بندی',
  'سایر',
]

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

function getCategoryColor(cat: string): string {
  switch (cat) {
    case 'اجاره':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'حقوق':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'قبض':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'تعمیرات':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'حمل و نقل':
      return 'bg-teal-100 text-teal-800 border-teal-200'
    case 'بسته‌بندی':
      return 'bg-pink-100 text-pink-800 border-pink-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// --- Skeletons ---
function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ExpensesTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  )
}

const emptyForm: ExpenseFormData = {
  description: '',
  amount: '',
  category: 'سایر',
  date: new Date().toISOString().split('T')[0],
}

// --- Main Component ---
export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('همه')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<ExpenseFormData>({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      if (categoryFilter !== 'همه') params.set('category', categoryFilter)

      const res = await fetch(`/api/expenses?${params}`)
      const json = await res.json()
      if (json.success) {
        setExpenses(json.data.expenses || json.data || [])
        if (json.data.summary) {
          setSummary(json.data.summary)
        } else {
          // Calculate summary from expenses
          const totalAmount = (json.data.expenses || json.data || []).reduce(
            (sum: number, e: Expense) => sum + e.amount,
            0
          )
          const totalCount = (json.data.expenses || json.data || []).length
          setSummary({ totalAmount, totalCount })
        }
      } else {
        toast.error('خطا در دریافت اطلاعات هزینه‌ها')
      }
    } catch {
      toast.error('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, categoryFilter])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      toast.error('توضیحات هزینه الزامی است')
      return
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('مبلغ هزینه باید بیشتر از صفر باشد')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          amount: Number(formData.amount),
          category: formData.category,
          date: formData.date,
        }),
      })
      const json = await res.json()

      if (json.success) {
        toast.success('هزینه با موفقیت ثبت شد')
        setDialogOpen(false)
        setFormData({ ...emptyForm })
        fetchExpenses()
      } else {
        toast.error(json.error || 'خطا در ثبت هزینه')
      }
    } catch {
      toast.error('خطا در اتصال به سرور')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast.success('هزینه با موفقیت حذف شد')
        fetchExpenses()
      } else {
        toast.error(json.error || 'خطا در حذف هزینه')
      }
    } catch {
      toast.error('خطا در اتصال به سرور')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">هزینه‌ها</h1>
        <Button onClick={() => { setFormData({ ...emptyForm }); setDialogOpen(true) }}>
          <Plus className="size-4 ml-2" />
          ثبت هزینه
        </Button>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <SummarySkeleton />
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2.5">
                  <DollarSign className="size-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مجموع هزینه‌ها</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(summary.totalAmount)}{' '}
                    <span className="text-sm font-normal text-muted-foreground">افغانی</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-2.5">
                  <Receipt className="size-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تعداد هزینه‌ها</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(summary.totalCount)}{' '}
                    <span className="text-sm font-normal text-muted-foreground">مورد</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

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
                  onChange={(e) => setDateFrom(e.target.value)}
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
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40 pr-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">دسته‌بندی</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="همه">همه</SelectItem>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardContent className="pt-6">
          <div style={{ maxHeight: '520px', overflowY: 'auto', overflowX: 'auto' }}>
            {loading ? (
              <ExpensesTableSkeleton />
            ) : expenses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingDown className="size-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg">هیچ هزینه‌ای یافت نشد</p>
                <p className="text-sm mt-1">فیلترها را تغییر دهید یا هزینه جدید ثبت کنید</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>توضیحات</TableHead>
                    <TableHead>مبلغ</TableHead>
                    <TableHead>دسته‌بندی</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>{formatNumber(expense.amount)} افغانی</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getCategoryColor(expense.category)}
                        >
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(expense.date)}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف هزینه</AlertDialogTitle>
                              <AlertDialogDescription>
                                آیا مطمئن هستید که می‌خواهید هزینه «{expense.description}» به مبلغ{' '}
                                {formatNumber(expense.amount)} افغانی را حذف کنید؟
                                این عمل قابل برگشت نیست.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>انصراف</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(expense.id)}
                                className="bg-destructive text-white hover:bg-destructive/90"
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ثبت هزینه جدید</DialogTitle>
            <DialogDescription>اطلاعات هزینه جدید را وارد کنید</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-description">توضیحات <span className="text-destructive">*</span></Label>
              <Input
                id="expense-description"
                placeholder="توضیح هزینه..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">مبلغ (افغانی) <span className="text-destructive">*</span></Label>
              <Input
                id="expense-amount"
                type="number"
                placeholder="مبلغ به افغانی"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                min="0"
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-2">
              <Label>دسته‌بندی</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-date">تاریخ</Label>
              <Input
                id="expense-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              انصراف
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'در حال ثبت...' : 'ثبت هزینه'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
