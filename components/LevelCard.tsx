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

  // Get unique album art URLs to ensure 3 different images
  const uniqueSongs: LevelSummary[] = []
  const seenAlbumArt = new Set<string>()

  for (const song of songs) {
    if (song.albumArt && !seenAlbumArt.has(song.albumArt)) {
      uniqueSongs.push(song)
      seenAlbumArt.add(song.albumArt)
      if (uniqueSongs.length === 3) break
    }
  }

  // If we don't have 3 unique album arts, fill with any remaining songs
  if (uniqueSongs.length < 3) {
    for (const song of songs) {
      if (!uniqueSongs.find(s => s.id === song.id)) {
        uniqueSongs.push(song)
        if (uniqueSongs.length === 3) break
      }
    }
  }

  const featuredSongs = uniqueSongs
  const totalSongs = songs.length

  return (
    <Link href={`/levels/${level}`} className="block transition-transform hover:scale-105">
      <Card className={cn('h-full cursor-pointer hover:shadow-lg @container border-0', className)} style={{ backgroundColor: '#00000014', color: 'white' }}>
        <CardContent className="pt-0 pb-8">
          <div className="space-y-6 flex flex-col items-center">
            {/* Fanned stack of album art - container for scaling */}
            {featuredSongs.length > 0 && (
              <div className="flex justify-center items-center mt-8 @sm:mt-10 @md:mt-12 @lg:mt-16 @xl:mt-20 @2xl:mt-24">
                <div
                  className="relative h-32 transition-transform duration-300 origin-center"
                  style={{
                    width: `${80 + (featuredSongs.length - 1) * 30}px`,
                    transform: 'scale(1.23)',
                  }}
                >
                  {featuredSongs.map((song, index) => {
                    // Determine position type
                    const positionType = featuredSongs.length === 3
                      ? (index === 0 ? 'left' : index === 1 ? 'center' : 'right')
                      : (index === 1 ? 'center' : 'side');

                    // Base styles for all thumbnails
                    const baseStyles = "absolute transition-all hover:translate-y-[-4px] rounded-md overflow-hidden border border-white/20";

                    // Base sizes (will be scaled by container)
                    const positionStyles = {
                      left: {
                        className: "w-[86px] h-[86px]",
                        style: {
                          left: `${index * 30 - 16}px`,
                          top: '50%',
                          transform: 'translateY(-50%) rotate(-8deg)',
                          zIndex: 1,
                          boxShadow: '0 12px 28px rgba(0,0,0,0.16)',
                        }
                      },
                      center: {
                        className: "w-[102px] h-[102px]",
                        style: {
                          left: featuredSongs.length === 3 ? '22px' : `${index * 30}px`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 3,
                          boxShadow: '0 12px 28px rgba(0,0,0,0.16)',
                        }
                      },
                      right: {
                        className: "w-[86px] h-[86px]",
                        style: {
                          left: `${index * 30 + 16}px`,
                          top: '50%',
                          transform: 'translateY(-50%) rotate(8deg)',
                          zIndex: 2,
                          boxShadow: '0 12px 28px rgba(0,0,0,0.16)',
                        }
                      },
                      side: {
                        className: "w-[86px] h-[86px]",
                        style: {
                          left: `${index * 30}px`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: index === 0 ? 2 : 1,
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

            {/* Level title and subtitle */}
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-semibold text-white">{languageNames[language] || 'Spanish'} {level}</h2>
              <p className="text-sm text-white/70">
                {getLevelDescription(level)}
              </p>
            </div>

            {/* Song details */}
            <div className="space-y-2 mt-6 text-center w-full">
              <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-white/10 text-sm text-white/90">
                <Music className="mr-1.5 h-4 w-4" />
                {totalSongs} {totalSongs === 1 ? 'song' : 'songs'}
              </div>
            </div>

            {/* Empty state */}
            {featuredSongs.length === 0 && (
              <div className="flex h-32 items-center justify-center text-sm text-white/70">
                No songs available yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}