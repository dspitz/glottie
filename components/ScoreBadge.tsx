import React from 'react'
import { cn, getLevelColor, getLevelDescription } from '@/lib/utils'

interface ScoreBadgeProps {
  level: number
  score: number
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  className?: string
}

export function ScoreBadge({ 
  level, 
  score, 
  size = 'md', 
  showTooltip = true,
  className 
}: ScoreBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  }

  const badge = (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        getLevelColor(level),
        sizeClasses[size],
        className
      )}
    >
      Level {level}
      {size !== 'sm' && (
        <span className="ml-1 text-xs opacity-75">
          ({score.toFixed(1)})
        </span>
      )}
    </span>
  )

  if (showTooltip) {
    return (
      <div className="group relative">
        {badge}
        <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform group-hover:block">
          <div className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg">
            {getLevelDescription(level)}
            <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 transform border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    )
  }

  return badge
}