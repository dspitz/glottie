import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Skip protection in development if no password is set
  if (process.env.NODE_ENV === 'development' && !process.env.SITE_PASSWORD) {
    return NextResponse.next()
  }

  // Check if user has already authenticated with HTTP Basic Auth
  const basicAuth = request.headers.get('authorization')

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')

    // Check credentials from environment variables
    const validUser = process.env.SITE_USERNAME || 'admin'
    const validPassword = process.env.SITE_PASSWORD

    if (validPassword && user === validUser && pwd === validPassword) {
      return NextResponse.next()
    }
  }

  // Only enforce password protection if SITE_PASSWORD is set
  if (!process.env.SITE_PASSWORD) {
    return NextResponse.next()
  }

  // Request authentication with browser popup
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  })
}

// Configure which routes to protect
export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)'
}