'use client'

import React from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Music, Crown, LogOut, ChevronRight, TrendingUp, Music2, BarChart3, Star, Trophy } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLanguageName, getSecondaryColor } from '@/lib/languageUtils'

const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
)

interface UserStats {
  userLevel: number
  userLevelName: string
  songsCompleted: number
  averageSongLevel: number | null
  averageGrade: number | null
  totalSavedSongs: number
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { language } = useLanguage()
  const languageName = getLanguageName(language)
  const [stats, setStats] = React.useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = React.useState(true)
  const [uploading, setUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Redirect to home if not authenticated
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  // Fetch user stats for current language
  React.useEffect(() => {
    if (session?.user) {
      setStatsLoading(true)
      fetch(`/api/user/stats?language=${language}`)
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
  }, [session, language])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()

      // Refresh the session to get the updated image
      await update()

    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to upload avatar. Please try again.')
    } finally {
      setUploading(false)
    }
  }

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
      <div className="max-w-2xl mx-auto relative">
        {/* Profile Header - Unbounded */}
        <div className="flex flex-col items-center gap-4 mb-6 mt-4">
          <div className="relative group">
            <Avatar
              className="h-24 w-24 cursor-pointer transition-opacity group-hover:opacity-80 ring-1 ring-black/[0.08]"
              onClick={handleAvatarClick}
            >
              <AvatarImage
                src={session.user?.image || ''}
                alt={session.user?.name || ''}
                referrerPolicy="no-referrer"
                className="object-cover"
              />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="text-white text-xs">Uploading...</div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div className="text-center">
            <div className="text-[32px]" style={{ color: getSecondaryColor(language), fontWeight: 500 }}>{session.user?.name || 'User'}</div>
            <div className="text-sm text-black/70">{session.user?.email}</div>
          </div>
        </div>

        {/* Stats Card */}
        <Card className="mb-4 border-0" style={{ borderRadius: '16px', backgroundColor: 'rgba(255, 255, 255, 0.12)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
          <CardHeader className="px-5 pt-8 pb-4">
            <div className="flex flex-col items-center gap-2">
              <Image
                src="/images/trophy_no_bg_black.png"
                alt="Trophy"
                width={138}
                height={138}
                className="h-[138px] w-[138px]"
              />
              <div className="text-center">
                <span className="font-medium text-sm text-black">
                  {statsLoading ? `${languageName} Level 1 - Beginner` : `${languageName} Level ${stats?.userLevel || 1} - ${stats?.userLevelName || 'Beginner'}`}
                </span>
                {stats?.userLevel === 1 && (
                  <p className="text-sm text-black/70 mt-1 px-8">
                    Listen to 5 {languageName.toLowerCase()} songs, and pass the post-song quizzes to advance to level 2
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {statsLoading ? (
              <div className="text-center py-6 text-black/70 text-sm">
                Loading stats...
              </div>
            ) : stats ? (
              <>
                <hr className="mb-6" style={{ borderColor: 'rgba(255, 255, 255, 0.20)' }} />
                <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-[28px] font-semibold text-black">{stats.songsCompleted || 0}/5</div>
                  <p className="text-xs text-black/70">Songs</p>
                </div>

                <div className="text-center">
                  <div className="text-[28px] font-semibold text-black">
                    {(stats.averageSongLevel || 1.0).toFixed(1)}
                  </div>
                  <p className="text-xs text-black/70">Difficulty</p>
                </div>

                <div className="text-center">
                  <div className="text-[28px] font-semibold text-black">
                    {stats.averageGrade ?? 0}%
                  </div>
                  <p className="text-xs text-black/70">Grade</p>
                </div>
              </div>
              </>
            ) : (
              <div className="text-center py-6 text-black/70 text-sm">
                Unable to load stats
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card className="border-0" style={{ borderRadius: '16px', backgroundColor: 'rgba(255, 255, 255, 0.12)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white">
                  <SpotifyIcon style={{ width: '36px', height: '36px' }} className="text-[#1DB954]" />
                </div>
                <div>
                  <span className="font-medium text-sm text-black">Spotify Premium</span>
                  <p className="text-xs text-black/70">Connected account</p>
                </div>
              </div>
              <Button
                onClick={() => signOut()}
                variant="destructive"
                className="bg-[#f3f3f3] hover:bg-[#f3f3f3]/90 text-black h-[44px] w-[112px]"
              >
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}