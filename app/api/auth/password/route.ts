import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SITE_PASSWORD = process.env.SITE_PASSWORD || 'glottie2024'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (password === SITE_PASSWORD) {
      // Set a secure HTTP-only cookie
      cookies().set('auth-token', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}