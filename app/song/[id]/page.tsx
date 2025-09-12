'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'next/navigation'
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
  const songId = params?.id as string
  
  
  // Get the level from search params to enable smart back navigation
  const fromLevel = searchParams.get('level')
  
  // State for background color based on album art
  const [pageBackgroundColor, setPageBackgroundColor] = useState('rgb(59, 130, 246)')
  
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
  })
  
  // Apply background color using CSS custom properties and aggressive styling
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const backgroundColor = pageBackgroundColor // Full opacity
    console.log('Setting CSS custom property --page-bg to:', backgroundColor)
    
    // Set CSS custom property
    document.documentElement.style.setProperty('--page-bg', backgroundColor)
    
    // Create or update style element for more aggressive styling
    let styleEl = document.getElementById('dynamic-bg-style') as HTMLStyleElement
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'dynamic-bg-style'
      document.head.appendChild(styleEl)
    }
    
    styleEl.textContent = `
      html, body {
        background-color: ${backgroundColor} !important;
        background: ${backgroundColor} !important;
        min-height: 100vh !important;
        color: white !important;
      }
      
      body::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: ${backgroundColor};
        z-index: -1;
        pointer-events: none;
      }
      
      /* Ensure all text elements are white */
      body * {
        color: white !important;
      }
      
      /* Handle specific Tailwind classes that might override */
      .text-muted-foreground {
        color: rgba(255, 255, 255, 0.7) !important;
      }
      
      .text-destructive {
        color: #ef4444 !important;
      }
    `
    
    console.log('Applied aggressive background styling:', {
      cssVar: document.documentElement.style.getPropertyValue('--page-bg'),
      styleContent: styleEl.textContent
    })
    
    return () => {
      document.documentElement.style.removeProperty('--page-bg')
      styleEl?.remove()
    }
  }, [pageBackgroundColor])
  
  
  // Determine back link and text
  const backHref = fromLevel ? `/levels/${fromLevel}` : '/'
  const backText = fromLevel ? `Back to Level ${fromLevel}` : 'Back to Levels'

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Loading song...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
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
    return null
  }

  const isDemo = lyricsData.mode === 'demo'
  
  // Color change handler
  const handleColorChange = (color: string) => {
    console.log('handleColorChange called with:', color)
    setPageBackgroundColor(color)
  }

  return (
    <div className="container py-8">
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
          albumArtSmall: lyricsData.albumArtSmall
        }}
        backHref={backHref}
        backText={backText}
        level={lyricsData.level || lyricsData.song?.level}
        difficultyScore={lyricsData.difficultyScore}
        onColorChange={handleColorChange}
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
        />
      </div>
    </div>
  )
}