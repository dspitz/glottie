'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface LanguageContextType {
  language: string
  setLanguage: (lang: string) => void
  languages: Array<{ code: string; name: string; flag: string }>
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>('es')

  const languages = [
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
  ]

  useEffect(() => {
    // Load from localStorage first (instant)
    const saved = localStorage.getItem('preferredLanguage')
    if (saved) {
      setLanguageState(saved)
    }

    // Then try to fetch from backend for authenticated users
    fetch('/api/user/preferences')
      .then(res => {
        if (res.ok) return res.json()
        throw new Error('Not authenticated')
      })
      .then(data => {
        if (data.preferredLanguage) {
          // Backend preference overrides localStorage
          setLanguageState(data.preferredLanguage)
          localStorage.setItem('preferredLanguage', data.preferredLanguage)
        }
      })
      .catch(() => {
        // Not authenticated or error - use localStorage only
      })
  }, [])

  const setLanguage = (lang: string) => {
    setLanguageState(lang)
    localStorage.setItem('preferredLanguage', lang)

    // Sync to backend for authenticated users (non-blocking)
    fetch('/api/user/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferredLanguage: lang })
    }).catch(err => {
      // Silent fail for unauthenticated users - they use localStorage only
      console.debug('Language preference not synced to backend:', err.message)
    })
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languages }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
