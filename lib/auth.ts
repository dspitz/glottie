import { NextAuthOptions } from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'

// Spotify scopes required for full playback control
const SPOTIFY_SCOPES = [
  'streaming',                    // Required for Web Playback SDK
  'user-read-email',             // Required for user identification
  'user-read-private',           // Required for user country/premium status
  'user-read-playback-state',    // Read current playback state
  'user-modify-playback-state',  // Control playback (play/pause/skip)
].join(' ')

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  debug: true, // Enable debug logging
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: SPOTIFY_SCOPES
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Persist the OAuth access_token and refresh_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.accessTokenExpires = account.expires_at
        token.spotifyId = account.providerAccountId
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number) * 1000) {
        return token
      }

      // Access token has expired, try to update it
      return await refreshAccessToken(token)
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string
      session.error = token.error as string
      session.user.spotifyId = token.spotifyId as string
      
      return session
    },
    async signIn({ user, account, profile }) {
      console.log('SignIn callback called:', { 
        provider: account?.provider, 
        hasProfile: !!profile,
        userEmail: user?.email,
        profileId: (profile as any)?.id,
        accountId: account?.providerAccountId
      })
      
      // Let the Prisma adapter handle user/account creation
      // We'll just ensure the process succeeds
      return true
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt'
  }
}

async function refreshAccessToken(token: any) {
  try {
    const url = 'https://accounts.spotify.com/api/token'
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
        ).toString('base64')
      },
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}