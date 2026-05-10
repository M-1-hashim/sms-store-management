import { NextResponse } from 'next/server'
import { hash, compare } from 'bcryptjs'
import { randomBytes, timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'

const SALT_ROUNDS = 12
const SESSION_DURATION_HOURS = 24
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

// Timing-safe token comparison
function safeTokenCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

// Generate a secure random session token
function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

// Ensure settings record exists
async function ensureSettings() {
  let settings = await db.settings.findUnique({ where: { id: 'main' } })
  if (!settings) {
    settings = await db.settings.create({ data: { id: 'main' } })
  }
  return settings
}

// GET /api/auth - Check authentication status and whether password is set
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'has-password') {
      // Check if password has been set (for initial setup flow)
      const settings = await ensureSettings()
      return NextResponse.json({
        success: true,
        hasPassword: !!settings.passwordHash,
      })
    }

    // Default: validate session token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'توکن ارسال نشده' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const settings = await ensureSettings()

    if (!settings.sessionToken || !settings.sessionExpiry) {
      return NextResponse.json({ success: false, error: 'نشست معتبر نیست' }, { status: 401 })
    }

    if (!safeTokenCompare(settings.sessionToken, token)) {
      return NextResponse.json({ success: false, error: 'توکن نامعتبر' }, { status: 401 })
    }

    if (new Date(settings.sessionExpiry) < new Date()) {
      // Session expired, clear it
      await db.settings.update({
        where: { id: 'main' },
        data: { sessionToken: null, sessionExpiry: null },
      })
      return NextResponse.json({ success: false, error: 'نشست منقضی شده' }, { status: 401 })
    }

    return NextResponse.json({ success: true, authenticated: true })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ success: false, error: 'خطا در بررسی احراز هویت' }, { status: 500 })
  }
}

// POST /api/auth - Setup password, login, change password, or logout
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, password, currentPassword, newPassword } = body

    if (action === 'setup') {
      // Initial password setup
      if (!password) {
        return NextResponse.json({ success: false, error: 'رمز عبور وارد نشده' }, { status: 400 })
      }

      if (password.length < 6) {
        return NextResponse.json({ success: false, error: 'رمز عبور باید حداقل ۶ کاراکتر باشد' }, { status: 400 })
      }

      // Password complexity check
      const hasLetter = /[a-zA-Z\u0600-\u06FF]/.test(password)
      const hasNumber = /\d/.test(password)
      if (!hasLetter || !hasNumber) {
        return NextResponse.json(
          { success: false, error: 'رمز عبور باید شامل حداقل یک حرف و یک عدد باشد' },
          { status: 400 }
        )
      }

      const settings = await ensureSettings()

      if (settings.passwordHash) {
        return NextResponse.json({ success: false, error: 'رمز عبور قبلاً تنظیم شده. لطفاً از گزینه ورود استفاده کنید.' }, { status: 400 })
      }

      const passwordHash = await hash(password, SALT_ROUNDS)
      const sessionToken = generateSessionToken()
      const sessionExpiry = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000)

      await db.settings.update({
        where: { id: 'main' },
        data: { passwordHash, sessionToken, sessionExpiry, failedAttempts: 0, lockoutUntil: null },
      })

      return NextResponse.json({
        success: true,
        message: 'رمز عبور با موفقیت تنظیم شد',
        token: sessionToken,
        expiresAt: sessionExpiry.toISOString(),
      })
    }

    if (action === 'login') {
      if (!password) {
        return NextResponse.json({ success: false, error: 'رمز عبور وارد نشده' }, { status: 400 })
      }

      const settings = await ensureSettings()

      if (!settings.passwordHash) {
        return NextResponse.json({ success: false, error: 'رمز عبور تنظیم نشده. لطفاً ابتدا رمز عبور تعیین کنید.' }, { status: 400 })
      }

      // Check lockout
      if (settings.lockoutUntil && new Date(settings.lockoutUntil) > new Date()) {
        const remainingMs = new Date(settings.lockoutUntil).getTime() - Date.now()
        const remainingMin = Math.ceil(remainingMs / (60 * 1000))
        return NextResponse.json(
          { success: false, error: `حساب به دلیل تلاش‌های ناموفق قفل شده. لطفاً ${remainingMin} دقیقه دیگر تلاش کنید.` },
          { status: 429 }
        )
      }

      const isValid = await compare(password, settings.passwordHash)

      if (!isValid) {
        const newFailedAttempts = (settings.failedAttempts || 0) + 1
        const updateData: Record<string, unknown> = { failedAttempts: newFailedAttempts }

        // Lock account after max failed attempts
        if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
          updateData.lockoutUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
          await db.settings.update({
            where: { id: 'main' },
            data: updateData,
          })
          return NextResponse.json(
            { success: false, error: `حساب به دلیل ${MAX_FAILED_ATTEMPTS} تلاش ناموفق برای ${LOCKOUT_MINUTES} دقیقه قفل شد.` },
            { status: 429 }
          )
        }

        await db.settings.update({
          where: { id: 'main' },
          data: updateData,
        })

        const remaining = MAX_FAILED_ATTEMPTS - newFailedAttempts
        return NextResponse.json(
          { success: false, error: `رمز عبور اشتباه است. ${remaining} تلاش دیگر باقی مانده.` },
          { status: 401 }
        )
      }

      // Successful login - reset failed attempts and create session
      const sessionToken = generateSessionToken()
      const sessionExpiry = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000)

      await db.settings.update({
        where: { id: 'main' },
        data: {
          sessionToken,
          sessionExpiry,
          failedAttempts: 0,
          lockoutUntil: null,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'ورود موفق',
        token: sessionToken,
        expiresAt: sessionExpiry.toISOString(),
      })
    }

    if (action === 'change-password') {
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ success: false, error: 'رمز عبور فعلی و جدید وارد نشده' }, { status: 400 })
      }

      // Validate new password
      if (newPassword.length < 6) {
        return NextResponse.json({ success: false, error: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد' }, { status: 400 })
      }

      const hasLetter = /[a-zA-Z\u0600-\u06FF]/.test(newPassword)
      const hasNumber = /\d/.test(newPassword)
      if (!hasLetter || !hasNumber) {
        return NextResponse.json(
          { success: false, error: 'رمز عبور جدید باید شامل حداقل یک حرف و یک عدد باشد' },
          { status: 400 }
        )
      }

      if (currentPassword === newPassword) {
        return NextResponse.json({ success: false, error: 'رمز عبور جدید نباید با رمز فعلی یکسان باشد' }, { status: 400 })
      }

      const settings = await ensureSettings()

      if (!settings.passwordHash) {
        return NextResponse.json({ success: false, error: 'رمز عبور تنظیم نشده' }, { status: 400 })
      }

      // Verify session token
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '')

      if (!token || !safeTokenCompare(settings.sessionToken, token)) {
        return NextResponse.json({ success: false, error: 'احراز هویت ناموفق' }, { status: 401 })
      }

      // Check session expiry
      if (settings.sessionExpiry && new Date(settings.sessionExpiry) < new Date()) {
        return NextResponse.json({ success: false, error: 'نشست منقضی شده. لطفاً دوباره وارد شوید.' }, { status: 401 })
      }

      // Verify current password
      const isValid = await compare(currentPassword, settings.passwordHash)
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'رمز عبور فعلی اشتباه است' }, { status: 401 })
      }

      // Update password and refresh session
      const passwordHash = await hash(newPassword, SALT_ROUNDS)
      const sessionToken = generateSessionToken()
      const sessionExpiry = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000)

      await db.settings.update({
        where: { id: 'main' },
        data: {
          passwordHash,
          sessionToken,
          sessionExpiry,
          failedAttempts: 0,
          lockoutUntil: null,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'رمز عبور با موفقیت تغییر کرد',
        token: sessionToken,
        expiresAt: sessionExpiry.toISOString(),
      })
    }

    if (action === 'logout') {
      const settings = await ensureSettings()

      const authHeader = request.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '')

      // Only clear session if token matches
      if (token && safeTokenCompare(settings.sessionToken, token)) {
        await db.settings.update({
          where: { id: 'main' },
          data: { sessionToken: null, sessionExpiry: null },
        })
      }

      return NextResponse.json({ success: true, message: 'با موفقیت خارج شدید' })
    }

    if (action === 'refresh') {
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '')

      if (!token) {
        return NextResponse.json({ success: false, error: 'توکن ارسال نشده' }, { status: 401 })
      }

      const settings = await ensureSettings()

      if (!safeTokenCompare(settings.sessionToken, token)) {
        return NextResponse.json({ success: false, error: 'توکن نامعتبر' }, { status: 401 })
      }

      if (settings.sessionExpiry && new Date(settings.sessionExpiry) < new Date()) {
        await db.settings.update({
          where: { id: 'main' },
          data: { sessionToken: null, sessionExpiry: null },
        })
        return NextResponse.json({ success: false, error: 'نشست منقضی شده' }, { status: 401 })
      }

      // Extend session
      const newExpiry = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000)
      await db.settings.update({
        where: { id: 'main' },
        data: { sessionExpiry: newExpiry },
      })

      return NextResponse.json({
        success: true,
        expiresAt: newExpiry.toISOString(),
      })
    }

    return NextResponse.json({ success: false, error: 'عملیات نامعتبر' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ success: false, error: 'خطا در عملیات احراز هویت' }, { status: 500 })
  }
}
