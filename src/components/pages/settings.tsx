'use client'

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Store,
  FileText,
  Palette,
  Database,
  Save,
  Upload,
  Download,
  Trash2,
  RotateCcw,
  ImageIcon,
  Loader2,
  Shield,
  Phone,
  Mail,
  MapPin,
  Hash,
  MessageSquare,
  Coins,
  Layers,
  AlertTriangle,
  RefreshCw,
  Sun,
  Moon,
  Monitor,
  Clock,
  HardDriveUpload,
  Zap,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Switch } from '@/components/ui/switch'

// --- Types ---
interface SettingsData {
  id: string
  storeName: string
  storeNameEn: string
  address: string
  phone: string
  email: string
  logo: string | null
  taxNumber: string
  invoicePrefix: string
  invoiceFooter: string
  currency: string
  itemsPerPage: number
  autoBackup: boolean
  backupFrequency: string
  backupKeepCount: number
  lastAutoBackup: string | null
}

interface BackupFile {
  filename: string
  size: string
  date: string
  type: 'auto' | 'manual'
}

type FormDataType = {
  storeName: string
  storeNameEn: string
  address: string
  phone: string
  email: string
  logo: string | null
  taxNumber: string
  invoicePrefix: string
  invoiceFooter: string
  currency: string
  itemsPerPage: number
  autoBackup: boolean
  backupFrequency: string
  backupKeepCount: number
}

// --- Skeleton ---
function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// --- Main Component ---
export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const themeMounted = useSyncExternalStore(() => () => {}, () => true, () => false)

  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [loadingBackups, setLoadingBackups] = useState(false)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [activeTab, setActiveTab] = useState<'store' | 'invoice' | 'display' | 'backup'>('store')
  const [hasChanges, setHasChanges] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<FormDataType>({
    storeName: '',
    storeNameEn: '',
    address: '',
    phone: '',
    email: '',
    logo: null,
    taxNumber: '',
    invoicePrefix: '',
    invoiceFooter: '',
    currency: 'افغانی',
    itemsPerPage: 20,
    autoBackup: false,
    backupFrequency: 'daily',
    backupKeepCount: 10,
  })

  const originalData = useRef<FormDataType>(formData)

  // Fetch settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings')
        const json = await res.json()
        if (json.success && json.data) {
          const s = json.data as SettingsData
          setSettings(s)
          const fd: FormDataType = {
            storeName: s.storeName,
            storeNameEn: s.storeNameEn,
            address: s.address,
            phone: s.phone,
            email: s.email,
            logo: s.logo,
            taxNumber: s.taxNumber,
            invoicePrefix: s.invoicePrefix,
            invoiceFooter: s.invoiceFooter,
            currency: s.currency,
            itemsPerPage: s.itemsPerPage,
            autoBackup: s.autoBackup,
            backupFrequency: s.backupFrequency,
            backupKeepCount: s.backupKeepCount,
          }
          setFormData(fd)
          originalData.current = fd
        }
      } catch {
        toast.error('خطا در دریافت تنظیمات')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  // Check for changes
  useEffect(() => {
    const c = originalData.current
    const changed =
      formData.storeName !== c.storeName ||
      formData.storeNameEn !== c.storeNameEn ||
      formData.address !== c.address ||
      formData.phone !== c.phone ||
      formData.email !== c.email ||
      formData.logo !== c.logo ||
      formData.taxNumber !== c.taxNumber ||
      formData.invoicePrefix !== c.invoicePrefix ||
      formData.invoiceFooter !== c.invoiceFooter ||
      formData.currency !== c.currency ||
      formData.itemsPerPage !== c.itemsPerPage ||
      formData.autoBackup !== c.autoBackup ||
      formData.backupFrequency !== c.backupFrequency ||
      formData.backupKeepCount !== c.backupKeepCount
    setHasChanges(changed)
  }, [formData])

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('تنظیمات با موفقیت ذخیره شد')
        setSettings(json.data as SettingsData)
        originalData.current = { ...formData }
        setHasChanges(false)
      } else {
        toast.error(json.error || 'خطا در ذخیره تنظیمات')
      }
    } catch {
      toast.error('خطا در ارتباط با سرور')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => setFormData({ ...originalData.current })

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('حجم فایل نباید بیشتر از ۲ مگابایت باشد'); return }
    if (!file.type.startsWith('image/')) { toast.error('لطفاً فقط فایل تصویری انتخاب کنید'); return }
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 200
        let { width, height } = img
        if (width > height) { if (width > maxSize) { height = (height * maxSize) / width; width = maxSize } }
        else { if (height > maxSize) { width = (width * maxSize) / height; height = maxSize } }
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', 0.8)
        setFormData((prev) => ({ ...prev, logo: compressed }))
        toast.success('لوگو با موفقیت آپلود شد')
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setFormData((prev) => ({ ...prev, logo: null }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const fetchBackups = useCallback(async () => {
    try {
      setLoadingBackups(true)
      const res = await fetch('/api/backup')
      const json = await res.json()
      if (json.success) setBackups(json.data || [])
    } catch { toast.error('خطا در دریافت لیست پشتیبان‌ها') }
    finally { setLoadingBackups(false) }
  }, [])

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true)
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      })
      const json = await res.json()
      if (json.success) { toast.success(json.message || 'پشتیبان ایجاد شد'); fetchBackups() }
      else toast.error(json.error || 'خطا در ایجاد پشتیبان')
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setCreatingBackup(false) }
  }

  const handleRestoreBackup = async (filename: string) => {
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', filename }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(json.message, { description: 'صفحه به زودی رفرش می‌شود...', duration: 3000 })
        setTimeout(() => window.location.reload(), 2500)
      } else toast.error(json.error || 'خطا در بازیابی')
    } catch { toast.error('خطا در ارتباط با سرور') }
  }

  const handleDeleteBackup = async (filename: string) => {
    try {
      const res = await fetch(`/api/backup?action=delete&file=${encodeURIComponent(filename)}`)
      const json = await res.json()
      if (json.success) { toast.success('پشتیبان حذف شد'); fetchBackups() }
      else toast.error(json.error || 'خطا در حذف')
    } catch { toast.error('خطا در ارتباط با سرور') }
  }

  const handleDownloadBackup = (filename: string) => {
    window.open(`/api/backup?action=download&file=${encodeURIComponent(filename)}`, '_blank')
  }

  const [uploading, setUploading] = useState(false)
  const uploadRef = useRef<HTMLInputElement>(null)

  const handleUploadBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.db') && !file.name.endsWith('.sqlite') && !file.name.endsWith('.sqlite3')) {
      toast.error('لطفاً فقط فایل دیتابیس (.db, .sqlite) انتخاب کنید')
      if (uploadRef.current) uploadRef.current.value = ''
      return
    }

    try {
      setUploading(true)
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/backup', {
        method: 'POST',
        body: form,
      })
      const json = await res.json()

      if (json.success) {
        toast.success(json.message, {
          description: 'صفحه به زودی رفرش می‌شود...',
          duration: 3000,
        })
        setTimeout(() => window.location.reload(), 2500)
      } else {
        toast.error(json.error || 'خطا در آپلود فایل')
      }
    } catch {
      toast.error('خطا در آپلود فایل')
    } finally {
      setUploading(false)
      if (uploadRef.current) uploadRef.current.value = ''
    }
  }

  useEffect(() => { if (activeTab === 'backup') fetchBackups() }, [activeTab, fetchBackups])

  const tabs = [
    { id: 'store' as const, label: 'اطلاعات فروشگاه', icon: Store, color: 'text-violet-500' },
    { id: 'invoice' as const, label: 'تنظیمات فاکتور', icon: FileText, color: 'text-amber-500' },
    { id: 'display' as const, label: 'نمایش و ظاهر', icon: Palette, color: 'text-cyan-500' },
    { id: 'backup' as const, label: 'پشتیبان‌گیری', icon: Database, color: 'text-rose-500' },
  ]

  if (loading) return <SettingsSkeleton />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">تنظیمات</h1>
            <p className="text-sm text-muted-foreground">مدیریت تنظیمات سیستم فروشگاه</p>
          </div>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              بازنشانی
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              ذخیره تغییرات
            </Button>
          </div>
        )}
      </div>

      {hasChanges && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>تغییراتی ذخیره نشده وجود دارد. فراموش نکنید که ذخیره کنید.</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-primary-foreground' : tab.color}`} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ==================== STORE INFO TAB ==================== */}
      {activeTab === 'store' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-violet-500" />
              اطلاعات فروشگاه
            </CardTitle>
            <CardDescription>
              اطلاعات اصلی فروشگاه خود را وارد کنید. این اطلاعات در فاکتورها نمایش داده می‌شود.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo */}
            <div>
              <Label className="text-sm font-medium">لوگو فروشگاه</Label>
              <p className="text-xs text-muted-foreground mb-3">
                لوگوی فروشگاه در فاکتور و سربرگ استفاده می‌شود (حداکثر ۲ مگابایت)
              </p>
              <div className="flex items-center gap-4">
                {formData.logo ? (
                  <div className="relative group">
                    <img src={formData.logo} alt="لوگو" className="h-20 w-20 rounded-xl border-2 border-border object-cover" />
                    <button onClick={removeLogo} className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()} className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-primary hover:bg-primary/5">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1">آپلود</span>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <Upload className="h-4 w-4" />
                  {formData.logo ? 'تغییر لوگو' : 'انتخاب لوگو'}
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </div>
            </div>

            <Separator />

            {/* Store Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName" className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  نام فروشگاه (دری/پشتو)
                </Label>
                <Input id="storeName" value={formData.storeName} onChange={(e) => setFormData((p) => ({ ...p, storeName: e.target.value }))} placeholder="مثلاً: فروشگاه نور" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeNameEn" className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  نام فروشگاه (انگلیسی)
                </Label>
                <Input id="storeNameEn" value={formData.storeNameEn} onChange={(e) => setFormData((p) => ({ ...p, storeNameEn: e.target.value }))} placeholder="e.g. Noor Store" dir="ltr" />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" /> شماره تلفن
                </Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} placeholder="۰۷۷۰۰۰۰۰۰۰" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" /> ایمیل
                </Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} placeholder="info@store.com" dir="ltr" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" /> آدرس
              </Label>
              <Textarea id="address" value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} placeholder="آدرس فروشگاه خود را وارد کنید" rows={2} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxNumber" className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" /> شماره مالیاتی / جواز کسب (اختیاری)
              </Label>
              <Input id="taxNumber" value={formData.taxNumber} onChange={(e) => setFormData((p) => ({ ...p, taxNumber: e.target.value }))} placeholder="شماره ثبت یا مالیاتی" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================== INVOICE TAB ==================== */}
      {activeTab === 'invoice' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-500" />
              تنظیمات فاکتور
            </CardTitle>
            <CardDescription>تنظیمات مربوط به ظاهر و محتوای فاکتور فروش را تغییر دهید.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix" className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" /> پیشوند شماره فاکتور
                </Label>
                <Input id="invoicePrefix" value={formData.invoicePrefix} onChange={(e) => setFormData((p) => ({ ...p, invoicePrefix: e.target.value }))} placeholder="INV" dir="ltr" />
                <p className="text-xs text-muted-foreground">شماره فاکتور به صورت: {formData.invoicePrefix}-۰۰۱ تولید می‌شود</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency" className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-muted-foreground" /> واحد پول
                </Label>
                <Select value={formData.currency} onValueChange={(v) => setFormData((p) => ({ ...p, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="افغانی">افغانی (AFN)</SelectItem>
                    <SelectItem value="دلار">دلار (USD)</SelectItem>
                    <SelectItem value="تومان">تومان (T)</SelectItem>
                    <SelectItem value="ریال">ریال (R)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">واحد پول در فاکتور و گزارش‌ها نمایش داده می‌شود</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="invoiceFooter" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" /> متن فوتر فاکتور
              </Label>
              <Textarea id="invoiceFooter" value={formData.invoiceFooter} onChange={(e) => setFormData((p) => ({ ...p, invoiceFooter: e.target.value }))} placeholder="متن پایین فاکتور..." rows={3} />
              <p className="text-xs text-muted-foreground">این متن در پایین فاکتور چاپی نمایش داده می‌شود</p>
            </div>

            <Separator />

            {/* Invoice Preview */}
            <div>
              <h3 className="text-sm font-medium mb-3">پیش‌نمایش فاکتور</h3>
              <div className="rounded-xl border bg-muted/30 p-6 max-w-md">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-lg font-bold">{formData.storeName || 'نام فروشگاه'}</p>
                    <p className="text-xs text-muted-foreground">{formData.storeNameEn || 'Store Name'}</p>
                  </div>
                  <Badge variant="secondary" dir="ltr">{formData.invoicePrefix}-۰۰۱</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {formData.phone && <p>📞 {formData.phone}</p>}
                  {formData.email && <p>✉️ {formData.email}</p>}
                  {formData.address && <p>📍 {formData.address}</p>}
                </div>
                <div className="mt-3 pt-3 border-t text-xs text-center text-muted-foreground">
                  {formData.invoiceFooter || 'با تشکر از خرید شما'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================== DISPLAY TAB ==================== */}
      {activeTab === 'display' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-cyan-500" />
              تنظیمات نمایش
            </CardTitle>
            <CardDescription>تنظیمات مربوط به نحوه نمایش اطلاعات در سیستم را تغییر دهید.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Sun className="h-4 w-4 text-muted-foreground" />
                حالت نمایش (تم)
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:shadow-sm ${
                    theme === 'light' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <Sun className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="text-xs font-medium">روشن</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:shadow-sm ${
                    theme === 'dark' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                    <Moon className="h-5 w-5 text-slate-200" />
                  </div>
                  <span className="text-xs font-medium">تاریک</span>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:shadow-sm ${
                    theme === 'system' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-slate-800">
                    <Monitor className="h-5 w-5 text-foreground" />
                  </div>
                  <span className="text-xs font-medium">سیستم</span>
                </button>
              </div>
              {themeMounted && (
                <p className="text-xs text-muted-foreground">
                  تم فعلی: {theme === 'light' ? 'روشن ☀️' : theme === 'dark' ? 'تاریک 🌙' : 'هماهنگ با سیستم 🖥️'}
                </p>
              )}
            </div>

            <Separator />

            {/* Items Per Page */}
            <div className="space-y-2">
              <Label htmlFor="itemsPerPage" className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" /> تعداد آیتم در هر صفحه
              </Label>
              <Select value={String(formData.itemsPerPage)} onValueChange={(v) => setFormData((p) => ({ ...p, itemsPerPage: parseInt(v, 10) }))}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">۱۰ آیتم</SelectItem>
                  <SelectItem value="20">۲۰ آیتم</SelectItem>
                  <SelectItem value="50">۵۰ آیتم</SelectItem>
                  <SelectItem value="100">۱۰۰ آیتم</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">تعداد آیتم‌های نمایش داده شده در لیست‌ها و جداول</p>
            </div>

            <Separator />

            {/* System Info */}
            <div>
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" /> اطلاعات سیستم
              </h3>
              <div className="rounded-lg border bg-muted/30 divide-y">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">نسخه سیستم</span>
                  <Badge variant="outline">۱.۰.۰</Badge>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">دیتابیس</span>
                  <Badge variant="outline">SQLite</Badge>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">وضعیت</span>
                  <Badge className="bg-emerald-500 text-white border-emerald-500">فعال</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================== BACKUP TAB ==================== */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Auto Backup Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                پشتیبان‌گیری خودکار
              </CardTitle>
              <CardDescription>سیستم به صورت خودکار از دیتابیس شما پشتیبان می‌گیرد.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">فعال‌سازی پشتیبان خودکار</Label>
                  <p className="text-xs text-muted-foreground">پشتیبان‌گیری در فواصل منظم انجام می‌شود</p>
                </div>
                <Switch
                  checked={formData.autoBackup}
                  onCheckedChange={(checked) => setFormData((p) => ({ ...p, autoBackup: checked }))}
                />
              </div>

              {formData.autoBackup && (
                <>
                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Frequency */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        فاصله پشتیبان‌گیری
                      </Label>
                      <Select
                        value={formData.backupFrequency}
                        onValueChange={(v) => setFormData((p) => ({ ...p, backupFrequency: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">هر ساعت</SelectItem>
                          <SelectItem value="daily">هر روز</SelectItem>
                          <SelectItem value="weekly">هر هفته</SelectItem>
                          <SelectItem value="monthly">هر ماه</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Keep Count */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        تعداد پشتیبان نگهداری
                      </Label>
                      <Select
                        value={String(formData.backupKeepCount)}
                        onValueChange={(v) => setFormData((p) => ({ ...p, backupKeepCount: parseInt(v, 10) }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">۵ نسخه</SelectItem>
                          <SelectItem value="10">۱۰ نسخه</SelectItem>
                          <SelectItem value="20">۲۰ نسخه</SelectItem>
                          <SelectItem value="50">۵۰ نسخه</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {settings?.lastAutoBackup && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      آخرین پشتیبان خودکار:{' '}
                      {new Date(settings.lastAutoBackup).toLocaleDateString('fa-AF', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Manual Backup + Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-rose-500" />
                پشتیبان‌گیری دستی و آپلود
              </CardTitle>
              <CardDescription>به صورت دستی پشتیبان بگیرید یا فایل پشتیبان را آپلود کنید.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleCreateBackup} disabled={creatingBackup} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  {creatingBackup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {creatingBackup ? 'در حال ایجاد...' : 'ایجاد پشتیبان جدید'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => uploadRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDriveUpload className="h-4 w-4" />}
                  {uploading ? 'در حال آپلود...' : 'آپلود فایل پشتیبان'}
                </Button>
                <input
                  ref={uploadRef}
                  type="file"
                  accept=".db,.sqlite,.sqlite3"
                  onChange={handleUploadBackup}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                فایل‌های قابل قبول: .db, .sqlite, .sqlite3 — حداکثر ۱۰۰ مگابایت
              </p>
            </CardContent>
          </Card>

          {/* Backup List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">نسخه‌های پشتیبان</CardTitle>
              <CardDescription>لیست تمام فایل‌های پشتیبان موجود</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBackups ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              ) : backups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Database className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">هنوز پشتیبانی ایجاد نشده</p>
                  <p className="text-sm mt-1">با کلیک روی &quot;ایجاد پشتیبان&quot; اولین پشتیبان را بسازید</p>
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }} className="space-y-2">
                  {backups.map((backup) => (
                    <div key={backup.filename} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Database className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium" dir="ltr">{backup.filename}</p>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${
                                backup.type === 'auto'
                                  ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                              }`}
                            >
                              {backup.type === 'auto' ? 'خودکار' : 'دستی'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(backup.date).toLocaleDateString('fa-AF', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {backup.size}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleDownloadBackup(backup.filename)} className="gap-1 h-8">
                          <Download className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">دانلود</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1 h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                              <RefreshCw className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">بازیابی</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" /> بازیابی پشتیبان
                              </AlertDialogTitle>
                              <AlertDialogDescription dir="rtl">
                                آیا مطمئن هستید که می‌خواهید از فایل پشتیبان <strong dir="ltr">{backup.filename}</strong> بازیابی کنید؟
                                <br />
                                <span className="text-amber-600 font-medium">
                                  ⚠️ توجه: تمام اطلاعات فعلی با این پشتیبان جایگزین می‌شود. یک نسخه پشتیبان از وضعیت فعلی به صورت خودکار ایجاد خواهد شد.
                                </span>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>انصراف</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRestoreBackup(backup.filename)} className="bg-amber-600 hover:bg-amber-700">
                                بله، بازیابی کن
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1 h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف پشتیبان</AlertDialogTitle>
                              <AlertDialogDescription>آیا مطمئن هستید که می‌خواهید این فایل پشتیبان را حذف کنید؟ این عمل قابل بازگشت نیست.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>انصراف</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteBackup(backup.filename)} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
