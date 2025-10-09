'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { getLanguageNativeName } from '@/lib/languageUtils'

interface LanguageToggleProps {
  value: 'spanish' | 'english' | 'both'
  onChange: (value: 'spanish' | 'english' | 'both') => void
  className?: string
  language?: string // Language code (e.g., 'es', 'fr')
}

export function LanguageToggle({ value, onChange, className, language = 'es' }: LanguageToggleProps) {
  const nativeName = getLanguageNativeName(language)

  console.log('🔍 LanguageToggle:', { language, nativeName })

  return (
    <div className={cn("inline-flex h-12 rounded-full bg-black/5 backdrop-blur-sm p-1.5", className)}>
      <button
        onClick={() => onChange('spanish')}
        className={cn(
          "min-w-[96px] h-9 px-3 rounded-full text-sm font-medium transition-all flex items-center justify-center",
          value === 'spanish'
            ? "bg-white text-gray-900"
            : "text-white/70 hover:text-white"
        )}
        style={value === 'spanish' ? { boxShadow: '0 6px 3px rgba(0, 0, 0, 0.08)' } : {}}
      >
        {nativeName}
      </button>
      <button
        onClick={() => onChange('both')}
        className={cn(
          "min-w-[96px] h-9 px-3 rounded-full text-sm font-medium transition-all flex items-center justify-center",
          value === 'both'
            ? "bg-white text-gray-900"
            : "text-white/70 hover:text-white"
        )}
        style={value === 'both' ? { boxShadow: '0 6px 3px rgba(0, 0, 0, 0.08)' } : {}}
      >
        Both
      </button>
      <button
        onClick={() => onChange('english')}
        className={cn(
          "min-w-[96px] h-9 px-3 rounded-full text-sm font-medium transition-all flex items-center justify-center",
          value === 'english'
            ? "bg-white text-gray-900"
            : "text-white/70 hover:text-white"
        )}
        style={value === 'english' ? { boxShadow: '0 6px 3px rgba(0, 0, 0, 0.08)' } : {}}
      >
        English
      </button>
    </div>
  )
}