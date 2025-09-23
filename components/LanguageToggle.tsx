'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface LanguageToggleProps {
  value: 'spanish' | 'english' | 'both'
  onChange: (value: 'spanish' | 'english' | 'both') => void
  className?: string
}

export function LanguageToggle({ value, onChange, className }: LanguageToggleProps) {
  return (
    <div className={cn("inline-flex h-12 rounded-full bg-white/10 backdrop-blur-sm p-1", className)}>
      <button
        onClick={() => onChange('spanish')}
        className={cn(
          "min-w-[96px] h-10 px-3 rounded-full text-sm font-medium transition-all flex items-center justify-center",
          value === 'spanish'
            ? "bg-white text-gray-900 shadow-sm"
            : "text-white/70 hover:text-white"
        )}
      >
        Español
      </button>
      <button
        onClick={() => onChange('both')}
        className={cn(
          "min-w-[96px] h-10 px-3 rounded-full text-sm font-medium transition-all flex items-center justify-center",
          value === 'both'
            ? "bg-white text-gray-900 shadow-sm"
            : "text-white/70 hover:text-white"
        )}
      >
        Both
      </button>
      <button
        onClick={() => onChange('english')}
        className={cn(
          "min-w-[96px] h-10 px-3 rounded-full text-sm font-medium transition-all flex items-center justify-center",
          value === 'english'
            ? "bg-white text-gray-900 shadow-sm"
            : "text-white/70 hover:text-white"
        )}
      >
        English
      </button>
    </div>
  )
}