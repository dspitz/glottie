'use client'

import { useState, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, ChevronRight, Music2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SpotifyPlayerContext } from '@/app/providers'

interface Phrase {
  id: string
  songId: string
  originalText: string
  translatedText: string
  lineIndex: number
  timestamp?: number | null
  usefulnessScore: number
  category: string
  wordCount: number
  song: {
    id: string
    title: string
    artist: string
    albumArt?: string | null
    spotifyId?: string | null
  }
}

interface PhraseCardProps {
  phrase: Phrase
}

export function PhraseCard({ phrase }: PhraseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()
  const playerRef = useContext(SpotifyPlayerContext)

  const handlePlayFromHere = async () => {
    if (phrase.song.spotifyId && playerRef?.current) {
      // Play the track and seek to timestamp if available
      await playerRef.current.playTrack(phrase.song.spotifyId, phrase.timestamp || 0)

      // Navigate to the song page with the line index
      router.push(`/song/${phrase.songId}?line=${phrase.lineIndex}`)
    }
  }

  const handleOpenSong = () => {
    // Navigate to the song page with the line index highlighted
    router.push(`/song/${phrase.songId}?line=${phrase.lineIndex}`)
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isExpanded && "shadow-lg"
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-4">
        {/* Main Content */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {/* English Translation (Prominent) */}
            <p className="text-base font-medium mb-2">
              {phrase.translatedText}
            </p>

            {/* Spanish Original (Subtle) */}
            <p className="text-sm text-muted-foreground italic">
              "{phrase.originalText}"
            </p>

            {/* Song Info */}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Music2 className="h-3 w-3" />
              <span>{phrase.song.title}</span>
              <span>•</span>
              <span>{phrase.song.artist}</span>
            </div>
          </div>

          {/* Album Art Thumbnail */}
          {phrase.song.albumArt && (
            <div className="flex-shrink-0">
              <img
                src={phrase.song.albumArt}
                alt={phrase.song.title}
                className="w-12 h-12 rounded object-cover"
              />
            </div>
          )}
        </div>

        {/* Expanded Actions */}
        {isExpanded && (
          <div className="mt-4 pt-3 border-t flex items-center gap-2">
            {phrase.song.spotifyId && phrase.timestamp !== null && (
              <Button
                size="sm"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlayFromHere()
                }}
                className="flex items-center gap-2"
              >
                <Play className="h-3 w-3" />
                Play from here
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                handleOpenSong()
              }}
              className="flex items-center gap-2"
            >
              <ChevronRight className="h-3 w-3" />
              Open song
            </Button>

            {/* Usefulness Score Badge */}
            <div className="ml-auto">
              <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                Score: {(phrase.usefulnessScore * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}