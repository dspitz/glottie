'use client'

import React from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Music, Crown, LogOut, ChevronRight, TrendingUp, Music2, BarChart3, Star } from 'lucide-react'

interface UserStats {
  userLevel: number
  userLevelName: string
  songsCompleted: number
  averageSongLevel: number | null
  averageGrade: number | null
  totalSavedSongs: number
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = React.useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = React.useState(true)

  // Redirect to home if not authenticated
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  // Fetch user stats
  React.useEffect(() => {
    if (session?.user) {
      fetch('/api/user/stats')
        .then(res => res.json())
        .then(data => {
          setStats(data)
          setStatsLoading(false)
        })
        .catch(error => {
          console.error('Error fetching stats:', error)
          setStatsLoading(false)
        })
    }
  }, [session])

  if (status === 'loading') {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse">Loading profile...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const initials = session.user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <div className="container py-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="mb-6" style={{ fontSize: '44px', lineHeight: '52px', fontWeight: 500 }}>Profile</h1>
        {/* Profile Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={session.user?.image || ''}
                  alt={session.user?.name || ''}
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <CardTitle className="text-2xl">{session.user?.name || 'User'}</CardTitle>
                <CardDescription>{session.user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-0">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-3">
              <Crown className="h-5 w-5 text-yellow-600" />
              <div>
                <span className="font-medium text-sm">Spotify Premium</span>
                <p className="text-xs text-muted-foreground">Connected account</p>
              </div>
            </div>
            <div className="border-t border-border -mx-6"></div>
            <div className="flex items-center justify-between px-3 py-4 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-sm">Edit Profile</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            {statsLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading stats...
              </div>
            ) : stats ? (
              <div className="space-y-4">
                {/* Level Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full font-medium text-sm">
                  <TrendingUp className="h-4 w-4" />
                  Level {stats.userLevel}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.songsCompleted}</div>
                    <p className="text-xs text-muted-foreground mt-1">Songs Completed</p>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {stats.averageSongLevel !== null && stats.averageSongLevel !== undefined ? stats.averageSongLevel.toFixed(1) : '—'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Avg Difficulty</p>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {stats.averageGrade !== null ? `${stats.averageGrade}%` : '—'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.averageGrade === null ? 'No Quizzes' : 'Avg Grade'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Unable to load stats
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <Button
              onClick={() => signOut()}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}