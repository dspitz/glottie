'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Music, ExternalLink } from 'lucide-react'

interface Track {
  id: string
  title: string
  artist: string
  album?: string
  spotifyUrl?: string
  previewUrl?: string
  albumArt?: string
  albumArtSmall?: string
}

interface SongHeaderProps {
  track: Track
  backHref: string
  backText: string
  level?: number
  difficultyScore?: number
  onColorChange?: (color: string) => void
  onBackClick?: () => void
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

export function SongHeader({ track, backHref, backText, level, difficultyScore, onColorChange, onBackClick }: SongHeaderProps) {
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
    <div className="relative mb-8">
      {/* Background with gradient */}
      <div 
        className="absolute inset-0 rounded-2xl" 
        style={backgroundStyle}
      />
      
      {/* Content */}
      <div className="relative px-8 py-12">
        {/* Back button */}
        <div className="mb-8">
          {onBackClick ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-background/80 backdrop-blur-sm"
              onClick={() => {
                console.log('Back button clicked in modal!')
                onBackClick()
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backText}
            </Button>
          ) : (
            <Link href={backHref}>
              <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backText}
              </Button>
            </Link>
          )}
        </div>

        {/* Centered header content */}
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Vinyl Record Album Art */}
          <div className="relative">
            {/* Vinyl Record Container */}
            <div className="w-80 h-80 relative">
              {/* Outer vinyl record */}
              <motion.div 
                className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-900 via-gray-800 to-black shadow-2xl"
                initial={{ scale: 0.275, rotate: 0 }}
                animate={{ 
                  scale: 1,
                  rotate: 360
                }}
                transition={{ 
                  scale: {
                    type: "spring", 
                    stiffness: 400, 
                    damping: 30,
                    duration: 0.5
                  },
                  rotate: {
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }
                }}
              >
                {/* Vinyl grooves */}
                <div className="absolute inset-2 rounded-full border border-gray-700/30"></div>
                <div className="absolute inset-4 rounded-full border border-gray-700/20"></div>
                <div className="absolute inset-6 rounded-full border border-gray-700/15"></div>
                <div className="absolute inset-8 rounded-full border border-gray-700/10"></div>
                
                {/* Album art in center */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full overflow-hidden shadow-lg ring-2 ring-black/20">
                  {track.albumArt ? (
                    <motion.img
                      ref={imgRef}
                      src={track.albumArt}
                      alt={`${track.album || track.title} cover`}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      style={{ 
                        opacity: isImageLoaded ? 1 : 0,
                        viewTransitionName: `album-art-${track.id}`
                      }}
                      layoutId={`album-art-${track.id}`}
                      onLoad={() => setIsImageLoaded(true)}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        setIsImageLoaded(true)
                      }}
                    />
                  ) : null}
                  
                  {!track.albumArt || !isImageLoaded ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <Music className="w-16 h-16 text-gray-400" />
                    </div>
                  ) : null}
                </div>
                
                {/* Center hole */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black shadow-inner"></div>
              </motion.div>
              
              {/* Needle/Tonearm */}
              <div className="absolute -top-4 -right-8 w-24 h-1 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full transform rotate-45 origin-left shadow-lg z-10">
                <div className="absolute right-0 w-2 h-2 bg-gray-500 rounded-full transform translate-x-1"></div>
              </div>
              
              {/* Glow effect */}
              <motion.div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${dominantColor}20 0%, transparent 70%)`,
                  filter: 'blur(20px)',
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
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
            <h1 className="text-4xl font-bold tracking-tight">
              {track.title}
            </h1>
            <p className="text-xl text-muted-foreground font-medium">
              by {track.artist}
            </p>
          </motion.div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {/* Spotify Button */}
            {track.spotifyUrl && (
              <Button 
                asChild 
                size="lg" 
                className="shadow-lg"
                style={{ 
                  backgroundColor: '#000',
                  borderColor: '#000',
                }}
              >
                <a
                  href={track.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Spotify
                </a>
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}