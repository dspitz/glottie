import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Music } from 'lucide-react'
import { useSharedTransition, getSharedElementTransition } from '@/contexts/SharedTransitionContext'

interface SongListItemProps {
  id: string
  title: string
  artist: string
  album?: string
  level?: number
  difficultyScore: number
  spotifyUrl?: string
  previewUrl?: string
  albumArt?: string
  albumArtSmall?: string
  wordCount?: number
  verbDensity?: number
  genres?: string | null
  onClick?: () => void
}

export function SongListItem({
  id,
  title,
  artist,
  album,
  level,
  difficultyScore,
  spotifyUrl,
  previewUrl,
  albumArt,
  albumArtSmall,
  wordCount,
  verbDensity,
  genres,
  onClick
}: SongListItemProps) {
  const { isExiting } = useSharedTransition()

  // Fallback URL for non-modal usage
  const songUrl = level ? `/song/${id}?level=${level}` : `/song/${id}`
  
  // Handle click - prioritize onClick prop, fallback to navigation
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    }
    // If no onClick provided, let the Link handle navigation
  }
  
  return (
    <Link href={songUrl} onClick={handleClick} className="block">
      <Card className="transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer border-0" style={{ borderRadius: '24px', backgroundColor: 'rgba(255, 255, 255, 0.12)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
        <CardContent className="flex items-center p-3" style={{ gap: '16px' }}>
          {/* Album Thumbnail */}
          <motion.div
            className="bg-muted rounded-lg flex items-center justify-center overflow-hidden shrink-0"
            style={{ width: '88px', height: '88px' }}
            layoutId={`album-container-${id}`}
            transition={getSharedElementTransition(isExiting)}
          >
            {albumArtSmall ? (
              <img
                src={albumArtSmall}
                alt={`${album || title} cover`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to music icon if image fails to load
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <Music className={`w-10 h-10 text-muted-foreground ${albumArtSmall ? 'hidden' : ''}`} />
          </motion.div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate text-black">
              {title}
            </h3>
            <p className="text-xs truncate" style={{ marginTop: '8px', color: 'rgba(0, 0, 0, 0.66)' }}>
              {artist}
            </p>

            {/* Genre and word count - always show the row */}
            <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: 'rgba(0, 0, 0, 0.66)' }}>
              {genres ? (
                <span>{genres.split(',')[0].trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
              ) : (
                <span className="italic">Genre pending</span>
              )}
              <span className="text-black/50">•</span>
              {wordCount ? (
                <span>{wordCount} words</span>
              ) : (
                <span className="italic">Word count pending</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}