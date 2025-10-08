'use client'

import { useEffect } from 'react'
import { getProviders, signIn, getSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Music, ExternalLink, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push(callbackUrl)
      }
    })
  }, [callbackUrl, router])

  const handleSpotifySignIn = async () => {
    try {
      // console.log('Attempting Spotify sign in...')
      const result = await signIn('spotify', {
        callbackUrl,
        redirect: false
      })

      // console.log('Sign in result:', result)

      if (result?.error) {
        console.error('Sign in error:', result.error)
      } else if (result?.ok) {
        // console.log('Sign in successful, redirecting...')
        router.push(callbackUrl)
      }
    } catch (error) {
      console.error('Sign in failed:', error)
    }
  }

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'OAuthSignin':
        return 'Error occurred during OAuth sign in process'
      case 'OAuthCallback':
        return 'Error occurred during OAuth callback'
      case 'OAuthCreateAccount':
        return 'Could not create OAuth account'
      case 'EmailCreateAccount':
        return 'Could not create email account'
      case 'Callback':
        return 'Error occurred during callback'
      case 'OAuthAccountNotLinked':
        return 'OAuth account not linked. Please try signing in with a different account.'
      case 'SessionRequired':
        return 'Please sign in to access this page'
      case 'spotify':
        return 'Error connecting to Spotify. Please check your credentials and try again.'
      default:
        return error ? `Authentication error: ${error}` : null
    }
  }

  const errorMessage = getErrorMessage(error)

  return (
    <div className="container py-8">
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Music className="h-12 w-12 text-primary" />
            </div>
            <CardTitle>Sign In to diddydum</CardTitle>
            <CardDescription>
              Sign in with your Spotify account to unlock full song playback and personalized features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            
            <Button 
              onClick={handleSpotifySignIn}
              className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white"
              size="lg"
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              Sign in with Spotify
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>
                By signing in, you agree to our terms and can access:
              </p>
              <ul className="mt-2 text-xs space-y-1">
                <li>• Full song playback (Spotify Premium required)</li>
                <li>• Personalized learning recommendations</li>
                <li>• Progress tracking across devices</li>
              </ul>
            </div>
            
            <div className="text-center">
              <Link href={callbackUrl} className="text-sm text-muted-foreground hover:text-foreground">
                Continue without signing in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}