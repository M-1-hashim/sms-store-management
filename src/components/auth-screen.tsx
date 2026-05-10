'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import { useAuthStore, getStoredToken } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock, Eye, EyeOff, Loader2, Shield, ShieldCheck, KeyRound, Store } from 'lucide-react'
import { toast } from 'sonner'

const emptySubscribe = () => () => {}

// Password strength calculator
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 8) score++
  if (/[a-zA-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[\u0600-\u06FF]/.test(password)) score++
  if (/[^a-zA-Z0-9\u0600-\u06FF]/.test(password)) score++

  if (score <= 2) return { score, label: 'ضعیف', color: 'bg-red-500' }
  if (score <= 3) return { score, label: 'متوسط', color: 'bg-amber-500' }
  if (score <= 4) return { score, label: 'خوب', color: 'bg-emerald-500' }
  return { score, label: 'عالی', color: 'bg-emerald-600' }
}

export function AuthScreen() {
  const {
    isAuthenticated,
    isInitialized,
    hasPassword,
    setAuthenticated,
    setHasPassword,
    setInitialized,
    logout,
  } = useAuthStore()

  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  // Setup mode
  const [setupPassword, setSetupPassword] = useState('')
  const [setupConfirm, setSetupConfirm] = useState('')
  const [setupLoading, setSetupLoading] = useState(false)

  // Login mode
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // UI
  const [showPassword, setShowPassword] = useState(false)
  const [shake, setShake] = useState(false)

  // Check if password is set and validate existing session on mount
  useEffect(() => {
    async function init() {
      try {
        // Check if password has been set
        const hasPwRes = await fetch('/api/auth?action=has-password')
        const hasPwJson = await hasPwRes.json()
        if (hasPwJson.success) {
          setHasPassword(hasPwJson.hasPassword)
        }

        // If there's a stored token, validate it
        const stored = getStoredToken()
        if (stored.token && stored.expiresAt) {
          // Check if expired locally
          if (new Date(stored.expiresAt) > new Date()) {
            const validateRes = await fetch('/api/auth', {
              headers: { Authorization: `Bearer ${stored.token}` },
            })
            if (validateRes.ok) {
              const validateJson = await validateRes.json()
              if (validateJson.success) {
                setAuthenticated(stored.token, stored.expiresAt)
                // Refresh session
                await fetch('/api/auth', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${stored.token}`,
                  },
                  body: JSON.stringify({ action: 'refresh' }),
                })
              }
            }
          }
        }
      } catch {
        // Silently fail - user will see login screen
      } finally {
        setInitialized(true)
      }
    }
    init()
  }, [setAuthenticated, setHasPassword, setInitialized])

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleSetup = async () => {
    if (!setupPassword) {
      toast.error('لطفاً رمز عبور را وارد کنید')
      return
    }
    if (setupPassword.length < 6) {
      toast.error('رمز عبور باید حداقل ۶ کاراکتر باشد')
      return
    }
    if (setupPassword !== setupConfirm) {
      toast.error('رمز عبور و تکرار آن مطابقت ندارند')
      return
    }

    const strength = getPasswordStrength(setupPassword)
    if (strength.score <= 2) {
      toast.error('رمز عبور خیلی ضعیف است. لطفاً از ترکیب حروف و اعداد استفاده کنید.')
      return
    }

    try {
      setSetupLoading(true)
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup', password: setupPassword }),
      })
      const json = await res.json()

      if (json.success) {
        toast.success(json.message)
        setAuthenticated(json.token, json.expiresAt)
      } else {
        toast.error(json.error || 'خطا در تنظیم رمز عبور')
      }
    } catch {
      toast.error('خطا در ارتباط با سرور')
    } finally {
      setSetupLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!loginPassword) {
      toast.error('لطفاً رمز عبور را وارد کنید')
      return
    }

    try {
      setLoginLoading(true)
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password: loginPassword }),
      })
      const json = await res.json()

      if (json.success) {
        toast.success(json.message)
        setAuthenticated(json.token, json.expiresAt)
        setLoginPassword('')
      } else {
        triggerShake()
        toast.error(json.error || 'خطا در ورود')
      }
    } catch {
      toast.error('خطا در ارتباط با سرور')
    } finally {
      setLoginLoading(false)
    }
  }

  // Keyboard support
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') action()
  }

  // Loading / not mounted
  if (!mounted || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  // Already authenticated
  if (isAuthenticated) {
    return null
  }

  // Password not set - Setup screen
  if (!hasPassword) {
    const strength = getPasswordStrength(setupPassword)

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <div className={`w-full max-w-md transition-transform ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
          <Card className="shadow-xl border-border/50">
            <CardHeader className="text-center space-y-4 pb-2">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Store className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div>
                <CardTitle className="text-xl">تنظیم رمز عبور</CardTitle>
                <CardDescription className="mt-2">
                  برای اولین بار، رمز عبوری امن برای سیستم تنظیم کنید
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              {/* Password Requirements */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                <p className="text-xs font-medium flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                  شرایط رمز عبور:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 mr-5">
                  <li className={setupPassword.length >= 6 ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                    {setupPassword.length >= 6 ? '✓' : '○'} حداقل ۶ کاراکتر
                  </li>
                  <li className={/[a-zA-Z\u0600-\u06FF]/.test(setupPassword) ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                    {/[a-zA-Z\u0600-\u06FF]/.test(setupPassword) ? '✓' : '○'} حداقل یک حرف
                  </li>
                  <li className={/\d/.test(setupPassword) ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                    {/\d/.test(setupPassword) ? '✓' : '○'} حداقل یک عدد
                  </li>
                </ul>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="setup-password" className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-muted-foreground" />
                  رمز عبور
                </Label>
                <div className="relative">
                  <Input
                    id="setup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleSetup)}
                    placeholder="رمز عبور امن وارد کنید"
                    className="pl-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength Indicator */}
                {setupPassword.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${Math.min((strength.score / 6) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{strength.label}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="setup-confirm">تکرار رمز عبور</Label>
                <Input
                  id="setup-confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={setupConfirm}
                  onChange={(e) => setSetupConfirm(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleSetup)}
                  placeholder="رمز عبور را دوباره وارد کنید"
                  className={setupConfirm.length > 0 && setupPassword !== setupConfirm ? 'border-destructive' : ''}
                />
                {setupConfirm.length > 0 && setupPassword !== setupConfirm && (
                  <p className="text-xs text-destructive">رمز عبور و تکرار آن مطابقت ندارند</p>
                )}
              </div>

              {/* Setup Button */}
              <Button
                onClick={handleSetup}
                disabled={setupLoading || !setupPassword || !setupConfirm}
                className="w-full gap-2 h-11"
              >
                {setupLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                {setupLoading ? 'در حال تنظیم...' : 'تنظیم رمز عبور و ورود'}
              </Button>

              <p className="text-[11px] text-center text-muted-foreground">
                رمز عبور شما با امنیت بالا ذخیره می‌شود و قابل بازیابی نیست
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Login screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className={`w-full max-w-sm transition-transform ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        <Card className="shadow-xl border-border/50">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div>
              <CardTitle className="text-xl">ورود به سیستم</CardTitle>
              <CardDescription className="mt-2">
                رمز عبور خود را وارد کنید
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="login-password" className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                رمز عبور
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleLogin)}
                  placeholder="رمز عبور را وارد کنید"
                  className="pl-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleLogin}
              disabled={loginLoading || !loginPassword}
              className="w-full gap-2 h-11"
            >
              {loginLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {loginLoading ? 'در حال بررسی...' : 'ورود'}
            </Button>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Badge variant="outline" className="text-[10px] gap-1">
                <Shield className="w-3 h-3" />
                محافظت شده
              </Badge>
              <span className="text-[11px] text-muted-foreground">تلاش‌های ناموفق بیش از حد باعث قفل شدن حساب می‌شود</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
