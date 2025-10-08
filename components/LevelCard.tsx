import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, getLevelColor, getLevelDescription } from '@/lib/utils'
import { Music } from 'lucide-react'

interface LevelSummary {
  id: string
  title: string
  artist: string
  difficultyScore: number
  albumArt?: string
}

interface LevelCardProps {
  level: number
  songs: LevelSummary[]
  language?: string
  className?: string
}

export function LevelCard({ level, songs, language = 'es', className }: LevelCardProps) {
  const languageNames: Record<string, string> = {
    es: 'Spanish',
    fr: 'French'
  }
  const featuredSongs = songs.slice(0, 3) // Show top 3 songs
  const totalSongs = songs.length

  return (
    <Link href={`/levels/${level}`} className="block transition-transform hover:scale-105">
      <Card className={cn('h-full cursor-pointer hover:shadow-lg @container', className)}>
        <CardHeader className="pb-3 text-center">
          <CardTitle className="text-lg">{languageNames[language] || 'Spanish'} {level}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {getLevelDescription(level)}
          </p>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-4 flex flex-col items-center">
            {/* Fanned stack of album art - container for scaling */}
            {featuredSongs.length > 0 && (
              <div className="flex justify-center items-center mt-8 mb-3 @sm:mt-10 @sm:mb-5 @md:mt-12 @md:mb-7 @lg:mt-16 @lg:mb-11 @xl:mt-20 @xl:mb-15 @2xl:mt-24 @2xl:mb-19">
                <div
                  className="relative h-32 transition-transform duration-300 origin-center scale-100 @sm:scale-110 @md:scale-125 @lg:scale-[1.5] @xl:scale-[1.75] @2xl:scale-[2.0]"
                  style={{
                    width: `${80 + (featuredSongs.length - 1) * 30}px`,
                  }}
                >
                  {featuredSongs.map((song, index) => {
                    // Determine position type
                    const positionType = featuredSongs.length === 3
                      ? (index === 0 ? 'left' : index === 1 ? 'center' : 'right')
                      : (index === 1 ? 'center' : 'side');

                    // Base styles for all thumbnails
                    const baseStyles = "absolute transition-all hover:translate-y-[-4px] rounded-md overflow-hidden border-[3px] border-white";

                    // Base sizes (will be scaled by container)
                    const positionStyles = {
                      left: {
                        className: "w-[86px] h-[86px]",
                        style: {
                          left: `${index * 30 - 12}px`,
                          top: 0,
                          zIndex: 1,
                          transform: 'rotate(-8deg)',
                          boxShadow: '0 12px 28px rgba(0,0,0,0.16)',
                        }
                      },
                      center: {
                        className: "w-[102px] h-[102px]",
                        style: {
                          left: featuredSongs.length === 3 ? '22px' : `${index * 30}px`,
                          top: -8,
                          zIndex: 3,
                          transform: 'none',
                          boxShadow: '0 12px 28px rgba(0,0,0,0.16)',
                        }
                      },
                      right: {
                        className: "w-[86px] h-[86px]",
                        style: {
                          left: `${index * 30 + 12}px`,
                          top: 0,
                          zIndex: 2,
                          transform: 'rotate(8deg)',
                          boxShadow: '0 12px 28px rgba(0,0,0,0.16)',
                        }
                      },
                      side: {
                        className: "w-[86px] h-[86px]",
                        style: {
                          left: `${index * 30}px`,
                          top: 0,
                          zIndex: index === 0 ? 2 : 1,
                          transform: 'none',
                          boxShadow: '0 12px 28px rgba(0,0,0,0.16)',
                        }
                      }
                    };

                    const currentStyle = positionStyles[positionType];

                    return (
                      <div
                        key={song.id}
                        className={`${baseStyles} ${currentStyle.className}`}
                        style={currentStyle.style}
                      >
                        {song.albumArt ? (
                          <Image
                            src={song.albumArt}
                            alt={`${song.title} album cover`}
                            width={positionType === 'center' ? 102 : 86}
                            height={positionType === 'center' ? 102 : 86}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Music className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Song details */}
            <div className="space-y-2 mt-2 text-center w-full">
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <Music className="mr-1 h-4 w-4" />
                {totalSongs} {totalSongs === 1 ? 'song' : 'songs'}
              </div>

              {featuredSongs.length > 0 && (
                <div className="space-y-1">
                  {featuredSongs.map((song) => (
                    <div key={song.id} className="text-xs">
                      <span className="font-medium truncate block">{song.title}</span>
                      <span className="text-muted-foreground truncate block">
                        {song.artist}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Empty state */}
            {featuredSongs.length === 0 && (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No songs available yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}