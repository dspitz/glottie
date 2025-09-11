import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Play, Music } from 'lucide-react'

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
  onClick
}: SongListItemProps) {
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
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Album Thumbnail */}
          <motion.div 
            className="bg-muted rounded-lg flex items-center justify-center overflow-hidden shrink-0 cursor-pointer" 
            style={{ width: '88px', height: '88px' }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {albumArtSmall ? (
              <motion.img
                src={albumArtSmall}
                alt={`${album || title} cover`}
                className="w-full h-full object-cover"
                style={{ viewTransitionName: `album-art-${id}` }}
                layoutId={`album-art-${id}`}
                onError={(e) => {
                  // Fallback to music icon if image fails to load
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <Music className={`w-10 h-10 text-muted-foreground ${albumArtSmall ? 'hidden' : ''}`} />
          </motion.div>
          
          <div className="flex items-start justify-between flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <Link 
                href={songUrl}
                className="group block"
                onClick={handleClick}
              >
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                  {title}
                </h3>
                <p className="text-muted-foreground truncate">
                  by {artist}
                </p>
              </Link>

              {/* Word count */}
              {wordCount && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {wordCount} words
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Learn Button */}
        <div className="ml-4">
          <Link href={songUrl} onClick={handleClick}>
            <Button size="sm" variant="outline">
              <Play className="mr-1 h-4 w-4" />
              Learn
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}