import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  // Clear Spotify-related cookies
  const cookieStore = cookies()

  // Delete the Spotify access token cookie
  cookieStore.delete('spotify_access_token')
  cookieStore.delete('spotify_refresh_token')
  cookieStore.delete('spotify_expires_at')

  // Redirect back to the homepage or login page
  return NextResponse.redirect(new URL('/', request.url))
}

export async function POST(request: NextRequest) {
  // Also support POST requests for logout
  return GET(request)
}