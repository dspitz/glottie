'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Music, Play, Pause, SkipForward, SkipBack } from 'lucide-react'
import { useSpotifyWebPlayer } from '@/hooks/useSpotifyWebPlayer'
import { useSession } from 'next-auth/react'
import { useSharedTransition, getSharedElementTransition } from '@/contexts/SharedTransitionContext'
import UserFeedback from '@/components/UserFeedback'
import { BookmarkButton } from '@/components/BookmarkButton'

interface Track {
  id: string
  title: string
  artist: string
  album?: string
  spotifyId?: string
  spotifyUrl?: string
  previewUrl?: string
  albumArt?: string
  albumArtSmall?: string
  songSummary?: string
}

interface SongHeaderProps {
  track: Track
  backHref: string
  backText: string
  level?: number
  levelName?: string
  difficultyScore?: number
  genres?: string | null
  wordCount?: number
  verbDensity?: number
  onColorChange?: (color: string) => void
  onBackClick?: () => void
  isPlaying?: boolean
  onPlayPause?: () => void
  onNext?: () => void
  onPrevious?: () => void
  devRating?: number | null
  userRating?: number | null
  hasLyrics?: boolean
  hasTranslations?: boolean
  synced?: boolean
  hideNavigation?: boolean
}

// Helper function to convert RGB to HSV
const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min

  let h = 0
  let s = max === 0 ? 0 : diff / max
  let v = max

  if (diff !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / diff) % 6
        break
      case g:
        h = (b - r) / diff + 2
        break
      case b:
        h = (r - g) / diff + 4
        break
    }
    h /= 6
  }

  if (h < 0) h += 1

  return [h * 360, s * 100, v * 100]
}

// Helper function to convert RGB to HSL
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min

  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / diff) % 6
        break
      case g:
        h = (b - r) / diff + 2
        break
      case b:
        h = (r - g) / diff + 4
        break
    }
    h /= 6
  }

  if (h < 0) h += 1

  return [h * 360, s * 100, l * 100]
}

// Helper function to convert HSL to RGB
const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  h /= 360
  s /= 100
  l /= 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

// Helper function to constrain lightness
const constrainLightness = (h: number, s: number, l: number, minL: number = 33, maxL: number = 50): [number, number, number] => {
  const constrainedL = Math.min(Math.max(l, minL), maxL)
  return [h, s, constrainedL]
}

// Utility function to extract the most saturated color from image
const extractDominantColor = (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    // Generate a color based on the song title hash for consistency
    // These fallback colors are pre-constrained to the 33-50% lightness range
    const fallbackColors = [
      'rgb(77, 112, 168)',   // blue (L: 48%)
      'rgb(139, 92, 46)',    // brown (L: 36%)
      'rgb(71, 139, 71)',    // green (L: 41%)
      'rgb(168, 77, 77)',    // red (L: 48%)
      'rgb(112, 77, 168)',   // purple (L: 48%)
      'rgb(168, 112, 28)',   // amber (L: 38%)
      'rgb(31, 139, 156)',   // cyan (L: 37%)
      'rgb(168, 77, 125)',   // pink (L: 48%)
    ]
    
    // Try to extract color, fallback to hash-based color
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          const hashColor = fallbackColors[imageUrl.length % fallbackColors.length]
          resolve(hashColor)
          return
        }
        
        // Use 100x100 canvas for better sampling
        canvas.width = 100
        canvas.height = 100
        ctx.drawImage(img, 0, 0, 100, 100)
        
        const imageData = ctx.getImageData(0, 0, 100, 100)
        const data = imageData.data
        
        let mostSaturatedColor = { r: 0, g: 0, b: 0 }
        let maxSaturation = 0
        let avgR = 0, avgG = 0, avgB = 0
        let avgCount = 0
        
        // Sample every 8th pixel for good coverage
        for (let i = 0; i < data.length; i += 32) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const a = data[i + 3]
          
          // Skip transparent pixels
          if (a < 128) continue
          
          // Calculate averages for fallback
          avgR += r
          avgG += g
          avgB += b
          avgCount++
          
          // Convert to HSV to find saturation
          const [h, s, v] = rgbToHsv(r, g, b)
          
          // Skip very dark or very light pixels (likely backgrounds)
          if (v < 20 || v > 95) continue
          
          // Find the most saturated color with good brightness
          if (s > maxSaturation && s > 30 && v > 30) {
            maxSaturation = s
            mostSaturatedColor = { r, g, b }
          }
        }
        
        // If we found a good saturated color, use it
        if (maxSaturation > 30) {
          // Convert to HSL and constrain lightness
          const [h, s, l] = rgbToHsl(mostSaturatedColor.r, mostSaturatedColor.g, mostSaturatedColor.b)
          const [constrainedH, constrainedS, constrainedL] = constrainLightness(h, s, l, 33, 50)
          const [finalR, finalG, finalB] = hslToRgb(constrainedH, constrainedS, constrainedL)

          console.log('🎨 Color Extraction (Saturated):')
          console.log('  Original RGB:', `rgb(${mostSaturatedColor.r}, ${mostSaturatedColor.g}, ${mostSaturatedColor.b})`)
          console.log('  Original HSL:', `H: ${h.toFixed(0)}°, S: ${s.toFixed(0)}%, L: ${l.toFixed(0)}%`)
          console.log('  Constrained HSL:', `H: ${constrainedH.toFixed(0)}°, S: ${constrainedS.toFixed(0)}%, L: ${constrainedL.toFixed(0)}%`)
          console.log('  Final RGB:', `rgb(${finalR}, ${finalG}, ${finalB})`)

          resolve(`rgb(${finalR}, ${finalG}, ${finalB})`)
        } else if (avgCount > 0) {
          // Fallback to average color with lightness constraints
          const avgRFinal = Math.floor(avgR / avgCount)
          const avgGFinal = Math.floor(avgG / avgCount)
          const avgBFinal = Math.floor(avgB / avgCount)
          const [h, s, l] = rgbToHsl(avgRFinal, avgGFinal, avgBFinal)
          const [constrainedH, constrainedS, constrainedL] = constrainLightness(h, s, l, 33, 50)
          const [finalR, finalG, finalB] = hslToRgb(constrainedH, constrainedS, constrainedL)

          console.log('🎨 Color Extraction (Average):')
          console.log('  Average RGB:', `rgb(${avgRFinal}, ${avgGFinal}, ${avgBFinal})`)
          console.log('  Original HSL:', `H: ${h.toFixed(0)}°, S: ${s.toFixed(0)}%, L: ${l.toFixed(0)}%`)
          console.log('  Constrained HSL:', `H: ${constrainedH.toFixed(0)}°, S: ${constrainedS.toFixed(0)}%, L: ${constrainedL.toFixed(0)}%`)
          console.log('  Final RGB:', `rgb(${finalR}, ${finalG}, ${finalB})`)

          resolve(`rgb(${finalR}, ${finalG}, ${finalB})`)
        } else {
          // Final fallback to hash-based color (already constrained)
          const hashColor = fallbackColors[imageUrl.length % fallbackColors.length]
          resolve(hashColor)
        }
      } catch (error) {
        // Fallback to hash-based color on any error
        const hashColor = fallbackColors[imageUrl.length % fallbackColors.length]
        resolve(hashColor)
      }
    }
    
    img.onerror = () => {
      // Fallback to hash-based color
      const hashColor = fallbackColors[imageUrl.length % fallbackColors.length]
      resolve(hashColor)
    }
    
    img.src = imageUrl
  })
}

export function SongHeader({ track, backHref, backText, level, levelName, difficultyScore, genres, wordCount, verbDensity, onColorChange, onBackClick, isPlaying = false, onPlayPause, onNext, onPrevious, devRating, userRating, hasLyrics, hasTranslations, synced, hideNavigation = false }: SongHeaderProps) {
  console.log('🎵 SongHeader received track:', {
    title: track?.title,
    artist: track?.artist,
    songSummary: track?.songSummary,
    hasSummary: !!track?.songSummary,
    hideNavigation: hideNavigation
  });
  const [localIsPlaying, setLocalIsPlaying] = useState(isPlaying)
  const { data: session } = useSession()
  const { playTrack, togglePlayPause: sdkTogglePlay, isAuthenticated, isReady } = useSpotifyWebPlayer()
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false)

  // Debug navigation props
  console.log('🎯 SongHeader navigation props:', {
    hasOnNext: !!onNext,
    hasOnPrevious: !!onPrevious,
    onNextType: typeof onNext,
    onPreviousType: typeof onPrevious,
    trackTitle: track?.title
  })

  // Sync local state with prop
  useEffect(() => {
    setLocalIsPlaying(isPlaying)
  }, [isPlaying])

  console.log('🟠 SongHeader rendered with props:', {
    hasOnPlayPause: !!onPlayPause,
    onPlayPauseType: typeof onPlayPause,
    isPlaying: isPlaying,  // Log the actual playing state
    localIsPlaying: localIsPlaying,
    trackTitle: track?.title
  })
  // Early return if track is not defined
  if (!track) {
    return (
      <div className="mb-8">
        <div className="p-4">
          <Link href={backHref} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backText}
          </Link>
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    )
  }

  const [dominantColor, setDominantColor] = useState('rgb(59, 130, 246)')
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const { isExiting } = useSharedTransition()

  console.log('SongHeader render:', { 
    hasAlbumArt: !!track?.albumArt, 
    albumArt: track?.albumArt, 
    hasCallback: !!onColorChange,
    title: track?.title 
  })

  useEffect(() => {
    if (track?.albumArt) {
      extractDominantColor(track.albumArt)
        .then(color => {
          console.log('Color extraction successful:', color)
          setDominantColor(color)
          onColorChange?.(color)
        })
        .catch((error) => {
          console.log('Color extraction failed:', error)
          const fallbackColor = 'rgb(59, 130, 246)'
          setDominantColor(fallbackColor)
          onColorChange?.(fallbackColor)
        })
    } else {
      // Generate consistent color based on track title when no album art
      // These fallback colors are pre-constrained to the 33-55% lightness range
      const fallbackColors = [
        'rgb(86, 125, 188)',   // blue (L: 54%)
        'rgb(139, 92, 46)',    // brown (L: 36%)
        'rgb(71, 139, 71)',    // green (L: 41%)
        'rgb(188, 86, 86)',    // red (L: 54%)
        'rgb(125, 86, 188)',   // purple (L: 54%)
        'rgb(188, 125, 31)',   // amber (L: 43%)
        'rgb(31, 139, 156)',   // cyan (L: 37%)
        'rgb(188, 86, 139)',   // pink (L: 54%)
      ]
      const colorIndex = ((track?.title?.length || 0) + (track?.artist?.length || 0)) % fallbackColors.length
      const selectedColor = fallbackColors[colorIndex]
      setDominantColor(selectedColor)
      onColorChange?.(selectedColor)
    }
  }, [track?.albumArt, track?.title, track?.artist, onColorChange])


  // Create gradient background with the dominant color
  const backgroundStyle = {
    background: `linear-gradient(135deg, ${dominantColor}15, ${dominantColor}05, transparent)`
  }

  return (
    <>
      {/* Fixed header with back button and dev rating */}
      <header
        className="fixed top-0 left-0 right-0 h-20 bg-transparent z-50 flex items-center justify-between px-6 pointer-events-none transition-opacity duration-300"
        style={{ opacity: hideNavigation ? 0 : 1 }}>
        {/* Back button on the left */}
        {onBackClick ? (
          <Button
            variant="outline"
            size="icon"
            className="bg-background/80 backdrop-blur-sm rounded-full w-9 h-9 pointer-events-auto"
            onClick={() => {
              console.log('Back button clicked in modal!')
              onBackClick()
            }}
            aria-label={backText}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <Link href={backHref} className="pointer-events-auto">
            <Button
              variant="outline"
              size="icon"
              className="bg-background/80 backdrop-blur-sm rounded-full w-9 h-9"
              aria-label={backText}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        )}

        {/* Right side controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Bookmark button */}
          <div className="bg-background/80 backdrop-blur-sm rounded-full">
            <BookmarkButton
              songId={track.id}
              songTitle={track.title}
              songArtist={track.artist}
              songAlbum={track.album}
              songAlbumArt={track.albumArt}
              songAlbumArtSmall={track.albumArtSmall}
              songLevel={level}
              songLevelName={levelName}
              songDifficultyScore={difficultyScore}
              songGenres={genres}
              songWordCount={wordCount}
              songVerbDensity={verbDensity}
              size="icon"
              className="h-9 w-9"
            />
          </div>

          {/* User Feedback */}
          <UserFeedback
            songId={track.id}
            initialRating={userRating}
            initialHasLyrics={hasLyrics}
            initialHasTranslations={hasTranslations}
            initialSynced={synced}
          />
        </div>

      </header>

      <div className="relative mb-8">
        {/* Background with gradient */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={backgroundStyle}
        />

        {/* Content */}
        <div className="relative px-2 pt-13">

        {/* Centered header content */}
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Large album art */}
          <div className="relative mt-12">
            <motion.div
              className="w-80 h-80 bg-muted/20 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5"
              layoutId={`album-container-${track.id}`}
              transition={getSharedElementTransition(isExiting)}
            >
              {track.albumArt ? (
                <a
                  href={track.spotifyUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={track.spotifyUrl ? 'cursor-pointer' : 'cursor-default'}
                  onClick={(e) => {
                    if (!track.spotifyUrl) {
                      e.preventDefault()
                    }
                  }}
                >
                  <img
                    ref={imgRef}
                    src={track.albumArt}
                    alt={`${track.album || track.title} cover`}
                    className="w-full h-full object-cover transition-opacity duration-300 hover:scale-105"
                    style={{
                      opacity: isImageLoaded ? 1 : 0,
                      transition: 'transform 0.2s ease-in-out'
                    }}
                    onLoad={() => setIsImageLoaded(true)}
                    onError={(e) => {
                      // Fallback to music icon if image fails to load
                      e.currentTarget.style.display = 'none'
                      setIsImageLoaded(true)
                    }}
                  />
                </a>
              ) : null}

              {!track.albumArt || !isImageLoaded ? (
                <div className="w-full h-full flex items-center justify-center bg-muted/20">
                  <Music className="w-24 h-24 text-muted-foreground/40" />
                </div>
              ) : null}
            </motion.div>

          </div>

          {/* Song info */}
          <motion.div
            className="space-y-3 max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 600,
              damping: 40,
              delay: 0.1
            }}
          >
            <h1 className="text-white font-medium" style={{ fontSize: '36px', lineHeight: '42px', fontFamily: 'Outfit' }}>
              {track.title}
            </h1>
            <p className="text-white/80" style={{ fontSize: '12px', lineHeight: '16px' }}>
              {track.artist}
            </p>
            {track.songSummary && (
              <p className="text-white/70 mt-2 max-w-md text-center leading-relaxed" style={{ fontSize: '14px', lineHeight: '20px' }}>
                {track.songSummary}
              </p>
            )}
          </motion.div>

          {/* Playback Controls */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 600,
              damping: 40,
              delay: 0.15
            }}
          >
            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                if (onPrevious && typeof onPrevious === 'function') {
                  onPrevious()
                }
              }}
              disabled={!onPrevious}
              className={`w-12 h-12 p-0 border-0 text-white relative z-10 transition-all ${
                onPrevious
                  ? 'bg-transparent hover:bg-white/10 cursor-pointer'
                  : 'bg-transparent opacity-50 cursor-not-allowed'
              }`}
              title={onPrevious ? "Previous song" : "At beginning of list"}
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button
              size="lg"
              onClick={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('🎵 SongHeader: Play/pause button clicked', {
                  hasSpotifyId: !!track?.spotifyId,
                  isAuthenticated,
                  isReady,
                  hasStartedPlayback,
                  isPlaying
                })

                // If we have Spotify Web SDK and track ID, use it
                if (isAuthenticated && isReady && track?.spotifyId) {
                  if (!hasStartedPlayback) {
                    // First play - start the track
                    console.log('🎵 SongHeader: Starting Spotify Web SDK playback')
                    setLocalIsPlaying(true)  // Switch button immediately
                    const success = await playTrack(track.spotifyId)
                    if (success) {
                      setHasStartedPlayback(true)
                    } else {
                      setLocalIsPlaying(false)  // Revert on failure
                    }
                  } else {
                    // Toggle play/pause
                    console.log('🎵 SongHeader: Toggling Spotify Web SDK playback')
                    const newState = !localIsPlaying
                    setLocalIsPlaying(newState)  // Switch button immediately
                    const success = await sdkTogglePlay()
                    if (!success) {
                      setLocalIsPlaying(!newState)  // Revert on failure
                    }
                  }
                } else if (onPlayPause && typeof onPlayPause === 'function') {
                  // Fallback to preview or other player
                  console.log('🎵 SongHeader: Using fallback player')
                  // Switch button immediately
                  setLocalIsPlaying(!localIsPlaying)
                  try {
                    onPlayPause()
                    console.log('✅ SongHeader: onPlayPause executed')
                  } catch (error) {
                    console.error('❌ SongHeader: Error calling onPlayPause:', error)
                    // Revert if there's an error
                    setLocalIsPlaying(localIsPlaying)
                  }
                } else {
                  console.warn('⚠️ SongHeader: No playback method available', {
                    isAuthenticated,
                    hasSpotifyId: !!track?.spotifyId,
                    spotifyId: track?.spotifyId,
                    trackTitle: track?.title,
                    isReady,
                    hasOnPlayPause: !!onPlayPause
                  })
                  if (!isAuthenticated) {
                    alert('Please sign in with Spotify to play songs')
                  } else if (!track?.spotifyId) {
                    alert(`This song is not available on Spotify (${track?.title || 'Unknown'})`)
                  }
                }
              }}
              disabled={false}  // Always enabled
              className="w-14 h-14 p-0 bg-white/20 hover:bg-white/30 text-white shadow-lg relative z-10"
              style={{ cursor: 'pointer' }}  // Force pointer cursor
              title={localIsPlaying ? "Pause" : "Play"}
            >
              {localIsPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </Button>

            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                if (onNext && typeof onNext === 'function') {
                  onNext()
                }
              }}
              disabled={!onNext}
              className={`w-12 h-12 p-0 border-0 text-white relative z-10 transition-all ${
                onNext
                  ? 'bg-transparent hover:bg-white/10 cursor-pointer'
                  : 'bg-transparent opacity-50 cursor-not-allowed'
              }`}
              title={onNext ? "Next song" : "At end of list"}
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>

      </div>
    </div>
    </>
  )
}