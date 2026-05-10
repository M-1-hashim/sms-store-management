import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/api/auth']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip non-API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Allow public routes (auth setup/login)
  // Only allow setup when no password is set — checked inside the API
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check for Bearer token
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'احراز هویت لازم است' },
      { status: 401 }
    )
  }

  const token = authHeader.replace('Bearer ', '')

  // Validate token server-side by checking against a lightweight endpoint
  // We use a simple check: the token must be non-empty and look like a hex string
  if (!token || token.length < 16 || !/^[a-f0-9]+$/.test(token)) {
    return NextResponse.json(
      { success: false, error: 'توکن نامعتبر' },
      { status: 401 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
