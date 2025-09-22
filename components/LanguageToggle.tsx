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
    <div className={cn("inline-flex rounded-lg bg-white/10 backdrop-blur-sm p-1", className)}>
      <button
        onClick={() => onChange('spanish')}
        className={cn(
          "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
          value === 'spanish'
            ? "bg-white text-gray-900 shadow-sm"
            : "text-white/70 hover:text-white"
        )}
      >
        Español
      </button>
      <button
        onClick={() => onChange('english')}
        className={cn(
          "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
          value === 'english'
            ? "bg-white text-gray-900 shadow-sm"
            : "text-white/70 hover:text-white"
        )}
      >
        English
      </button>
      <button
        onClick={() => onChange('both')}
        className={cn(
          "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
          value === 'both'
            ? "bg-white text-gray-900 shadow-sm"
            : "text-white/70 hover:text-white"
        )}
      >
        Both
      </button>
    </div>
  )
}