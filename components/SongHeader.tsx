'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Music, Play, Pause, SkipForward, SkipBack } from 'lucide-react'

interface Track {
  id: string
  title: string
  artist: string
  album?: string
  spotifyUrl?: string
  previewUrl?: string
  albumArt?: string
  albumArtSmall?: string
  culturalContext?: string
}

interface SongHeaderProps {
  track: Track
  backHref: string
  backText: string
  level?: number
  difficultyScore?: number
  onColorChange?: (color: string) => void
  onBackClick?: () => void
  isPlaying?: boolean
  onPlayPause?: () => void
  onNext?: () => void
  onPrevious?: () => void
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

// Utility function to extract the most saturated color from image
const extractDominantColor = (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    // Generate a color based on the song title hash for consistency
    const fallbackColors = [
      'rgb(59, 130, 246)',   // blue
      'rgb(139, 69, 19)',    // brown
      'rgb(34, 197, 94)',    // green
      'rgb(239, 68, 68)',    // red
      'rgb(168, 85, 247)',   // purple
      'rgb(245, 158, 11)',   // amber
      'rgb(6, 182, 212)',    // cyan
      'rgb(236, 72, 153)',   // pink
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
          resolve(`rgb(${mostSaturatedColor.r}, ${mostSaturatedColor.g}, ${mostSaturatedColor.b})`)
        } else if (avgCount > 0) {
          // Fallback to average color
          const avgRFinal = Math.floor(avgR / avgCount)
          const avgGFinal = Math.floor(avgG / avgCount)
          const avgBFinal = Math.floor(avgB / avgCount)
          resolve(`rgb(${avgRFinal}, ${avgGFinal}, ${avgBFinal})`)
        } else {
          // Final fallback to hash-based color
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

export function SongHeader({ track, backHref, backText, level, difficultyScore, onColorChange, onBackClick, isPlaying = false, onPlayPause, onNext, onPrevious }: SongHeaderProps) {
  const [localIsPlaying, setLocalIsPlaying] = useState(isPlaying)

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
      const fallbackColors = [
        'rgb(59, 130, 246)',   // blue
        'rgb(139, 69, 19)',    // brown
        'rgb(34, 197, 94)',    // green
        'rgb(239, 68, 68)',    // red
        'rgb(168, 85, 247)',   // purple
        'rgb(245, 158, 11)',   // amber
        'rgb(6, 182, 212)',    // cyan
        'rgb(236, 72, 153)',   // pink
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
      {/* Fixed header with back button */}
      <header className="fixed top-0 left-0 w-auto h-20 bg-transparent z-50 flex items-center px-6 pointer-events-none">
        {onBackClick ? (
          <Button
            variant="outline"
            size="icon"
            className="bg-background/80 backdrop-blur-sm rounded-full w-10 h-10 pointer-events-auto"
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
              className="bg-background/80 backdrop-blur-sm rounded-full w-10 h-10"
              aria-label={backText}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        )}
      </header>

      <div className="relative mb-8">
        {/* Background with gradient */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={backgroundStyle}
        />

        {/* Content */}
        <div className="relative px-8 pt-16">

        {/* Centered header content */}
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Large album art */}
          <div className="relative">
            <div className="w-80 h-80 bg-muted/20 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
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
                  <motion.img
                    ref={imgRef}
                    src={track.albumArt}
                    alt={`${track.album || track.title} cover`}
                    className="w-full h-full object-cover transition-opacity duration-300 hover:scale-105"
                    style={{
                      opacity: isImageLoaded ? 1 : 0,
                      viewTransitionName: `album-art-${track.id}`,
                      transition: 'transform 0.2s ease-in-out'
                    }}
                    layoutId={`album-art-${track.id}`}
                    initial={{ scale: 0.275 }} // 88/320 = 0.275
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                      duration: 0.5
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
            </div>

          </div>

          {/* Song info */}
          <motion.div 
            className="space-y-3 max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: 0.2, 
              duration: 0.6, 
              ease: "easeOut" 
            }}
          >
            <h1 className="text-white font-medium" style={{ fontSize: '36px', lineHeight: '42px', fontFamily: 'Outfit' }}>
              {track.title}
            </h1>
            <p className="text-white/80" style={{ fontSize: '12px', lineHeight: '16px' }}>
              by {track.artist}
            </p>
            {track.culturalContext && (
              <p className="text-white/70 mt-2 max-w-md text-center leading-relaxed" style={{ fontSize: '14px', lineHeight: '20px' }}>
                {track.culturalContext}
              </p>
            )}
          </motion.div>

          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="lg"
              variant="outline"
              onClick={onPrevious}
              disabled={!onPrevious}
              className="w-12 h-12 p-0 bg-white/10 hover:bg-white/20 border-white/20 text-white disabled:opacity-50"
              title="Previous song"
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button
              size="lg"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('🎵 SongHeader: Play/pause button clicked', {
                  hasHandler: !!onPlayPause,
                  isPlaying,
                  handlerType: typeof onPlayPause
                })
                if (onPlayPause && typeof onPlayPause === 'function') {
                  console.log('🎵 SongHeader: Calling onPlayPause handler')
                  try {
                    onPlayPause()
                    console.log('✅ SongHeader: onPlayPause executed')
                  } catch (error) {
                    console.error('❌ SongHeader: Error calling onPlayPause:', error)
                  }
                } else {
                  console.warn('⚠️ SongHeader: No valid onPlayPause handler yet - trying to find audio player')
                  // Try to find and click the audio player's play button as a fallback
                  // Updated selector to find the fixed player at the bottom
                  const audioPlayerButton = document.querySelector('.fixed.left-0.right-0 button.w-10.h-10') as HTMLButtonElement
                  if (audioPlayerButton) {
                    console.log('🔄 SongHeader: Found audio player button, clicking it')
                    audioPlayerButton.click()
                    // Toggle local state for immediate feedback
                    setLocalIsPlaying(!localIsPlaying)
                    console.log('🔄 SongHeader: Toggled local state to:', !localIsPlaying)
                  } else {
                    console.warn('⚠️ SongHeader: Could not find audio player button')
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
              variant="outline"
              onClick={onNext}
              disabled={!onNext}
              className="w-12 h-12 p-0 bg-white/10 hover:bg-white/20 border-white/20 text-white disabled:opacity-50"
              title="Next song"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>
        </div>

      </div>
    </div>
    </>
  )
}