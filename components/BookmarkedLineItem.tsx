'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookmarkedLineItemProps {
  id: string
  songId: string
  songTitle?: string
  songArtist?: string
  lineText: string
  lineTranslation: string
  lineIndex: number
  onDelete?: (id: string) => void
  className?: string
}

export function BookmarkedLineItem({
  id,
  songId,
  songTitle,
  songArtist,
  lineText,
  lineTranslation,
  lineIndex,
  onDelete,
  className
}: BookmarkedLineItemProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onDelete) {
      onDelete(id)
    }
  }

  return (
    <Link href={`/song/${songId}`} className="block">
      <Card className={cn("transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer", className)} style={{ borderRadius: '24px' }}>
        <CardContent className="p-4">
          {/* Song info header */}
          {(songTitle || songArtist) && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                {songTitle && (
                  <h4 className="font-semibold text-sm truncate">{songTitle}</h4>
                )}
                {songArtist && (
                  <p className="text-xs text-muted-foreground truncate">{songArtist}</p>
                )}
              </div>
              <Button
                onClick={handleDelete}
                variant="ghost"
                size="icon"
                className="ml-2 h-8 w-8 text-muted-foreground hover:text-red-500 shrink-0"
                aria-label="Delete bookmark"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Bookmarked line content */}
          <div className="space-y-2 bg-muted/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Quote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-relaxed">{lineText}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{lineTranslation}</p>
              </div>
            </div>
          </div>

          {/* Line number indicator */}
          <div className="mt-2 text-xs text-muted-foreground">
            Line {lineIndex + 1}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
