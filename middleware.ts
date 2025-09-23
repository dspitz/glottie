import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Skip protection in development if no password is set
  if (process.env.NODE_ENV === 'development' && !process.env.SITE_PASSWORD) {
    return NextResponse.next()
  }

  // Allow access to login page and API routes
  if (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Check for auth cookie
  const token = request.cookies.get('auth-token')

  if (token?.value === 'authenticated') {
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  const loginUrl = new URL('/login', request.url)
  return NextResponse.redirect(loginUrl)
}

// Configure which routes to protect
export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)'
}