import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScoreBadge } from '@/components/ScoreBadge'
import { cn, getLevelColor, getLevelDescription } from '@/lib/utils'
import { Music } from 'lucide-react'

interface LevelSummary {
  id: string
  title: string
  artist: string
  difficultyScore: number
}

interface LevelCardProps {
  level: number
  songs: LevelSummary[]
  className?: string
}

export function LevelCard({ level, songs, className }: LevelCardProps) {
  const featuredSongs = songs.slice(0, 3) // Show top 3 songs
  const totalSongs = songs.length

  return (
    <Link href={`/levels/${level}`} className="block transition-transform hover:scale-105">
      <Card className={cn('h-full cursor-pointer hover:shadow-lg', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Level {level}</CardTitle>
            <ScoreBadge 
              level={level} 
              score={songs[0]?.difficultyScore || level} 
              size="sm"
              showTooltip={false}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {getLevelDescription(level)}
          </p>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Song count */}
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center text-muted-foreground">
                <Music className="mr-1 h-4 w-4" />
                {totalSongs} {totalSongs === 1 ? 'song' : 'songs'}
              </span>
            </div>

            {/* Featured songs */}
            {featuredSongs.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Featured Songs:</h4>
                {featuredSongs.map((song) => (
                  <div key={song.id} className="rounded-md bg-muted/50 p-2">
                    <p className="text-sm font-medium truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      by {song.artist}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {featuredSongs.length === 0 && (
              <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                No songs available yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}