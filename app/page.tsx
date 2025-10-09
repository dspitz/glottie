'use client'

import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LevelCard } from '@/components/LevelCard'
import { fetchLevels } from '@/lib/client'
import { Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLanguageName, getFloodColor, getFloodComplementaryColor } from '@/lib/languageUtils'

export default function HomePage() {
  const { language } = useLanguage()
  const languageName = getLanguageName(language)
  const [animationKey, setAnimationKey] = useState(0)

  const { data: levelsData, isLoading, error } = useQuery({
    queryKey: ['levels', language],
    queryFn: () => fetchLevels(language),
  })

  // Debug logging
  useEffect(() => {
    console.log('🌍 Current language:', language)
    console.log('📊 Levels data:', levelsData)
    if (levelsData?.levels) {
      Object.keys(levelsData.levels).forEach(level => {
        console.log(`  Level ${level}: ${levelsData.levels[level].length} songs`)
      })
    }
  }, [language, levelsData])

  useEffect(() => {
    // Apply language-specific background to body on homepage
    document.body.style.backgroundColor = getFloodColor(language)

    // Trigger animation when language changes
    setAnimationKey(prev => prev + 1)

    // Cleanup: reset when leaving the page
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [language])

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Loading levels...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Levels</h2>
          <p className="text-muted-foreground mb-4">
            There was an error loading the difficulty levels. Please make sure the database is seeded.
          </p>
          <p className="text-sm text-muted-foreground">
            Run: <code className="bg-muted px-2 py-1 rounded">npm run db:push && npm run db:seed</code>
          </p>
        </div>
      </div>
    )
  }

  const levels = levelsData?.levels || {}
  const stats = levelsData?.stats || {}

  return (
    <div className="min-h-screen" style={{ backgroundColor: getFloodColor(language) }}>
      <style jsx>{`
        @keyframes cascadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes cascadeInOffset {
          from {
            opacity: 0;
            transform: translateY(64px);
          }
          to {
            opacity: 1;
            transform: translateY(44px);
          }
        }
        .cascade-item {
          animation: cascadeIn 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }
        .cascade-item-offset {
          animation: cascadeInOffset 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }
      `}</style>
      <div className="container pb-8 relative" key={animationKey}>
      {/* Hero Section */}
      <div className="text-center" style={{ marginBottom: '-24px' }}>
        <h1 className="text-[44px] leading-[52px] font-medium tracking-tight cascade-item-offset" style={{ animationDelay: '0ms', color: getFloodComplementaryColor(language) }}>
          Learn Languages<br />Through Music
        </h1>
        <div className="cascade-item" style={{ animationDelay: '100ms' }}>
          <Image
            src={language === 'fr' ? '/images/Mascot_French.png' : '/images/Mascot_Spanish.png'}
            alt={`${languageName} Music Mascot`}
            width={200}
            height={200}
            className="mx-auto"
            priority
          />
        </div>

      </div>

      {/* Levels Grid */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {Array.from({ length: 5 }, (_, i) => i + 1).map((level) => {
            const levelSongs = levels[level.toString()] || []
            console.log(`🎵 Rendering Level ${level} card with ${levelSongs.length} songs`, levelSongs)
            return (
              <div
                key={level}
                className="cascade-item"
                style={{
                  animationDelay: `${200 + (level - 1) * 2}ms`,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)'
                }}
              >
                <LevelCard
                  level={level}
                  songs={levelSongs}
                  language={language}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="bg-muted/50 rounded-lg p-8 cascade-item" style={{ animationDelay: '700ms' }}>
        <h3 className="text-xl font-semibold mb-4 text-center">How to Use diddydum</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              1
            </div>
            <h4 className="font-medium mb-2">Choose Your Level</h4>
            <p className="text-sm text-muted-foreground">
              Start with {languageName} 1 for beginners or pick a level that matches your {languageName.toLowerCase()} proficiency
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              2
            </div>
            <h4 className="font-medium mb-2">Learn Through Songs</h4>
            <p className="text-sm text-muted-foreground">
              Click on sentences to see translations and select words for definitions and conjugations
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              3
            </div>
            <h4 className="font-medium mb-2">Listen & Practice</h4>
            <p className="text-sm text-muted-foreground">
              Use the Spotify integration to listen to songs while following along with the lyrics
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}