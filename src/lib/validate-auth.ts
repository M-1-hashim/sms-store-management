import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface AuthInvalid {
  valid: false
  error: string
  status: number
  response: NextResponse
}

interface AuthValid {
  valid: true
  skipAuth?: boolean
}

type AuthResult = AuthInvalid | AuthValid

/**
 * Validate session token from request and return settings if valid.
 * Returns null if invalid or expired.
 */
export async function validateAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false as const, error: 'احراز هویت لازم است', status: 401 }
  }

  const token = authHeader.replace('Bearer ', '')

  if (!token || token.length < 16 || !/^[a-f0-9]+$/.test(token)) {
    return { valid: false as const, error: 'توکن نامعتبر', status: 401 }
  }

  try {
    const settings = await db.settings.findUnique({
      where: { id: 'main' },
      select: {
        sessionToken: true,
        sessionExpiry: true,
        lockoutUntil: true,
        failedAttempts: true,
      },
    })

    if (!settings) {
      return { valid: false as const, error: 'تنظیمات یافت نشد', status: 500 }
    }

    // Check lockout
    if (settings.lockoutUntil && new Date(settings.lockoutUntil) > new Date()) {
      const remainingMinutes = Math.ceil(
        (new Date(settings.lockoutUntil).getTime() - Date.now()) / 60000
      )
      return {
        valid: false as const,
        error: `حساب قفل شده. لطفاً ${remainingMinutes} دقیقه دیگر تلاش کنید`,
        status: 423,
      }
    }

    // Check if password exists (system is set up)
    if (!settings.sessionToken) {
      // No password set yet, skip auth
      return { valid: true as const, skipAuth: true }
    }

    // Validate token match
    if (settings.sessionToken !== token) {
      return { valid: false as const, error: 'توکن نامعتبر', status: 401 }
    }

    // Check expiry
    if (settings.sessionExpiry && new Date(settings.sessionExpiry) < new Date()) {
      return { valid: false as const, error: 'نشست منقضی شده. لطفاً دوباره وارد شوید', status: 401 }
    }

    return { valid: true as const }
  } catch (error) {
    console.error('Auth validation error:', error)
    return { valid: false as const, error: 'خطا در احراز هویت', status: 500 }
  }
}

/**
 * Express-like middleware wrapper for Next.js API routes
 * Usage: const authResult = await withAuth(request); if (!authResult.valid) return authResult.response;
 */
export async function withAuth(request: NextRequest): Promise<AuthResult> {
  const result = await validateAuth(request)
  if (!result.valid) {
    return {
      valid: false,
      error: result.error,
      status: result.status,
      response: NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      ),
    }
  }
  return result
}
