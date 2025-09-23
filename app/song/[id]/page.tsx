'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { LyricsView } from '@/components/LyricsView'
import { SongHeader } from '@/components/SongHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchLyrics } from '@/lib/client'
import { formatPercentage } from '@/lib/utils'
import { Loader2, AlertCircle, ArrowLeft, Music, BarChart3 } from 'lucide-react'

export default function SongPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const songId = params?.id as string


  // Get the level from search params to enable smart back navigation
  const fromLevel = searchParams.get('level')
  const levelNumber = fromLevel ? parseInt(fromLevel) : null

  // State for background color based on album art
  const [pageBackgroundColor, setPageBackgroundColor] = useState('rgb(59, 130, 246)')
  const [isPlaying, setIsPlaying] = useState(false)
  const [playPauseFunction, setPlayPauseFunction] = useState<(() => void) | null>(null)

  // Debug info state
  const [debugInfo, setDebugInfo] = useState<any>({})

  // Debug: Log when playPauseFunction changes
  useEffect(() => {
    console.log('🔵 SongPage: playPauseFunction state changed', {
      hasFunction: !!playPauseFunction,
      type: typeof playPauseFunction,
      functionString: playPauseFunction ? playPauseFunction.toString().substring(0, 50) : 'null'
    })
  }, [playPauseFunction])

  // Debug: Log what we're passing to SongHeader
  console.log('🔵 SongPage: Rendering with playPauseFunction:', !!playPauseFunction)
  
  console.log('SongPage render - pageBackgroundColor:', pageBackgroundColor, 'isClient:', typeof window !== 'undefined')
  
  // Test if client-side JavaScript is working at all
  useEffect(() => {
    console.log('BASIC CLIENT TEST: useEffect ran!')
    
    // Test background with default color immediately
    const testBg = 'rgb(59, 130, 246)40' // Blue with 25% opacity
    console.log('TESTING: Setting background to', testBg)
    document.body.style.backgroundColor = testBg
    document.documentElement.style.backgroundColor = testBg
    
    console.log('TESTING: Background set, checking styles...')
    console.log('Body style:', document.body.style.backgroundColor)
    console.log('HTML style:', document.documentElement.style.backgroundColor)
  }, [])

  // ALL HOOKS MUST BE AT THE TOP - React Query hook
  const { data: lyricsData, isLoading, error } = useQuery({
    queryKey: ['lyrics', songId],
    queryFn: () => fetchLyrics(songId),
    enabled: !!songId,
    staleTime: 0, // Force refetch
    gcTime: 0, // Don't cache
  })

  // Use level from URL params or from song data
  const effectiveLevel = levelNumber || lyricsData?.level || lyricsData?.song?.level

  // Log level detection
  useEffect(() => {
    console.log('🎯 LEVEL DETECTION:', {
      fromURL: levelNumber,
      fromLyricsData: lyricsData?.level,
      fromSongData: lyricsData?.song?.level,
      effectiveLevel: effectiveLevel,
      songId: songId
    })
  }, [levelNumber, lyricsData, effectiveLevel, songId])

  // Fetch songs from the same level for navigation
  const { data: levelSongs } = useQuery({
    queryKey: ['levelSongs', effectiveLevel],
    queryFn: async () => {
      if (!effectiveLevel) {
        setDebugInfo((prev: any) => ({
          ...prev,
          levelSongs: { fetched: false, count: 0, error: 'No effective level' }
        }))
        return []
      }
      const response = await fetch(`/api/songs/level/${effectiveLevel}`)
      if (!response.ok) {
        setDebugInfo((prev: any) => ({
          ...prev,
          levelSongs: { fetched: false, count: 0, error: `Failed to fetch: ${response.status}` }
        }))
        return []
      }
      const songs = await response.json()
      setDebugInfo((prev: any) => ({
        ...prev,
        levelSongs: { fetched: true, count: songs.length, songs }
      }))
      return songs
    },
    enabled: !!effectiveLevel,
  })

  // Calculate previous and next songs
  const { prevSong, nextSong } = useMemo(() => {
    if (!levelSongs || !songId) {
      setDebugInfo((prev: any) => ({
        ...prev,
        navigation: {
          currentSongId: songId,
          currentIndex: -1,
          prevSong: null,
          nextSong: null,
          error: 'No levelSongs or songId'
        }
      }))
      return { prevSong: null, nextSong: null }
    }

    const currentIndex = levelSongs.findIndex((song: any) => song.id === songId)

    if (currentIndex === -1) {
      setDebugInfo((prev: any) => ({
        ...prev,
        navigation: {
          currentSongId: songId,
          currentIndex: -1,
          prevSong: null,
          nextSong: null,
          error: 'Current song not found in level songs'
        }
      }))
      return { prevSong: null, nextSong: null }
    }

    const result = {
      prevSong: currentIndex > 0 ? levelSongs[currentIndex - 1] : null,
      nextSong: currentIndex < levelSongs.length - 1 ? levelSongs[currentIndex + 1] : null,
    }

    setDebugInfo((prev: any) => ({
      ...prev,
      navigation: {
        currentSongId: songId,
        currentIndex,
        prevSong: result.prevSong,
        nextSong: result.nextSong,
        error: null
      }
    }))

    return result
  }, [levelSongs, songId])

  // Debug what we're getting from the API
  useEffect(() => {
    if (lyricsData) {
      console.log('📡 API Response received:', {
        hasData: !!lyricsData,
        hasSynchronized: !!lyricsData.synchronized,
        synchronizedFormat: lyricsData.synchronized?.format,
        synchronizedLines: lyricsData.synchronized?.lines?.length,
        keys: Object.keys(lyricsData)
      })
    }
  }, [lyricsData])
  
  // Apply background color using CSS custom properties
  useEffect(() => {
    if (typeof window === 'undefined') return

    const backgroundColor = pageBackgroundColor
    console.log('Setting CSS custom property --page-bg to:', backgroundColor)

    // Just set the CSS variable, don't inject aggressive styles
    document.documentElement.style.setProperty('--page-bg', backgroundColor)
    document.documentElement.style.backgroundColor = backgroundColor

    return () => {
      document.documentElement.style.removeProperty('--page-bg')
      document.documentElement.style.backgroundColor = ''
    }
  }, [pageBackgroundColor])
  
  
  // Determine back link and text
  const backHref = fromLevel ? `/levels/${fromLevel}` : '/'
  const backText = fromLevel ? `Back to Level ${fromLevel}` : 'Back to Levels'

  if (isLoading) {
    return (
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Loading song...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Song Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The requested song could not be loaded.
          </p>
          <Link href={backHref}>
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backText}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!lyricsData) {
    console.log('❌ No lyricsData available')
    return null
  }

  console.log('📦 lyricsData available:', {
    hasData: !!lyricsData,
    hasSynchronized: !!lyricsData.synchronized,
    keys: Object.keys(lyricsData)
  })

  const isDemo = lyricsData.mode === 'demo'
  
  // Color change handler
  const handleColorChange = (color: string) => {
    console.log('handleColorChange called with:', color)
    setPageBackgroundColor(color)
  }

  // Navigation handlers
  const handlePrevious = () => {
    console.log('🔄 HANDLE PREVIOUS CALLED')
    console.log('Previous song:', prevSong)
    console.log('Effective level:', effectiveLevel)
    console.log('Debug info:', debugInfo)

    if (prevSong && effectiveLevel) {
      const url = `/song/${prevSong.id}?level=${effectiveLevel}`
      console.log('✅ Navigating to:', url)
      router.push(url)
    } else {
      console.log('❌ Cannot navigate - missing data')
    }
  }

  const handleNext = () => {
    console.log('🔄 HANDLE NEXT CALLED')
    console.log('Next song:', nextSong)
    console.log('Effective level:', effectiveLevel)
    console.log('Debug info:', debugInfo)

    if (nextSong && effectiveLevel) {
      const url = `/song/${nextSong.id}?level=${effectiveLevel}`
      console.log('✅ Navigating to:', url)
      router.push(url)
    } else {
      console.log('❌ Cannot navigate - missing data')
    }
  }

  // Update debug info for level information
  useEffect(() => {
    const debugData = {
      level: {
        fromUrl: levelNumber,
        fromData: lyricsData?.level || lyricsData?.song?.level,
        effective: effectiveLevel
      },
      handlers: {
        onPrevious: !!prevSong,
        onNext: !!nextSong,
        onPlayPause: !!playPauseFunction
      }
    }

    console.log('📊 NAVIGATION STATE UPDATE:', {
      effectiveLevel,
      levelSongsCount: levelSongs?.length || 0,
      hasPrevSong: !!prevSong,
      hasNextSong: !!nextSong,
      prevSongTitle: prevSong?.title,
      nextSongTitle: nextSong?.title
    })

    setDebugInfo((prev: any) => ({
      ...prev,
      ...debugData
    }))
  }, [levelNumber, lyricsData?.level, lyricsData?.song?.level, effectiveLevel, prevSong, nextSong, playPauseFunction, levelSongs])

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Enhanced Song Header */}
      <SongHeader
        track={{
          id: lyricsData.trackId || lyricsData.song?.id || songId,
          title: lyricsData.title || lyricsData.song?.title || 'Unknown Title',
          artist: lyricsData.artist || lyricsData.song?.artist || 'Unknown Artist',
          album: lyricsData.album,
          spotifyId: lyricsData.spotifyId,
          spotifyUrl: lyricsData.spotifyUrl,
          previewUrl: lyricsData.previewUrl,
          albumArt: lyricsData.albumArt,
          albumArtSmall: lyricsData.albumArtSmall,
          culturalContext: lyricsData.culturalContext
        }}
        backHref={backHref}
        backText={backText}
        level={lyricsData.level || lyricsData.song?.level}
        difficultyScore={lyricsData.difficultyScore}
        onColorChange={handleColorChange}
        isPlaying={isPlaying}
        onPlayPause={playPauseFunction}
        onPrevious={prevSong ? handlePrevious : undefined}
        onNext={nextSong ? handleNext : undefined}
        devRating={lyricsData.devRating}
        userRating={lyricsData.userRating}
        hasLyrics={lyricsData.hasLyrics}
        hasTranslations={lyricsData.hasTranslations}
        synced={lyricsData.synced}
      />

      {/* Main Content - Full Width */}
      <div className="max-w-4xl mx-auto">
        <LyricsView
          lines={lyricsData.lines || []}
          translations={lyricsData.translations}
          spotifyUrl={lyricsData.spotifyUrl}
          title={lyricsData.title || lyricsData.song?.title || 'Unknown Title'}
          artist={lyricsData.artist || lyricsData.song?.artist || 'Unknown Artist'}
          isDemo={isDemo}
          backgroundColor={pageBackgroundColor}
          synchronized={lyricsData.synchronized}
          track={{
            id: lyricsData.trackId || lyricsData.song?.id || songId,
            title: lyricsData.title || lyricsData.song?.title || 'Unknown Title',
            artist: lyricsData.artist || lyricsData.song?.artist || 'Unknown Artist',
            album: lyricsData.album,
            spotifyId: lyricsData.spotifyId,
            spotifyUrl: lyricsData.spotifyUrl,
            previewUrl: lyricsData.previewUrl,
            albumArt: lyricsData.albumArt,
            albumArtSmall: lyricsData.albumArtSmall
          }}
          onPlayStateChange={(playing) => {
          console.log('🔵 SongPage: Play state changed to:', playing)
          setIsPlaying(playing)
        }}
          onPlayPauseReady={(fn) => {
            console.log('🟢 SongPage: onPlayPauseReady called', {
              hasFunction: !!fn,
              functionType: typeof fn,
              functionString: fn ? fn.toString().substring(0, 50) : 'null'
            })
            if (fn && typeof fn === 'function') {
              // Wrap in a stable function to avoid re-renders
              setPlayPauseFunction(() => {
                return () => {
                  console.log('🎯 SongPage: Wrapped play/pause function called')
                  fn()
                }
              })
              console.log('🟢 SongPage: playPauseFunction state updated with wrapped function')
            }
          }}
        />
      </div>
    </div>
  )
}