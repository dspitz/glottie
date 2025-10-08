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
    // Load from localStorage on mount
    const saved = localStorage.getItem('preferredLanguage')
    if (saved) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: string) => {
    setLanguageState(lang)
    localStorage.setItem('preferredLanguage', lang)

    // Optionally: sync to backend for authenticated users
    // This could be done with a separate mutation or API call
    // fetch('/api/user/preferences', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ preferredLanguage: lang })
    // }).catch(err => console.error('Failed to sync language preference:', err))
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
