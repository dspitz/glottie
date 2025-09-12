import 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    error?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      spotifyId?: string
    }
  }

  interface User {
    spotifyId?: string
    isPremium?: boolean
    country?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    spotifyId?: string
    error?: string
  }
}