'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { AuthButton } from '@/components/AuthButton'
import { LanguageSelector } from '@/components/LanguageSelector'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLanguageName, getFloodColor, getFloodComplementaryColor } from '@/lib/languageUtils'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { language, setLanguage } = useLanguage()
  const languageName = getLanguageName(language)
  const isHomepage = pathname === '/'
  const isLevelPage = pathname.startsWith('/levels/')
  const isSongPage = pathname.startsWith('/song/')

  // Only show header on homepage, level pages, and song pages
  const shouldShowHeader = isHomepage || isLevelPage || isSongPage

  if (!shouldShowHeader) {
    return null
  }

  // Extract current level from pathname
  const currentLevel = isLevelPage ? parseInt(pathname.split('/')[2], 10) : null

  // Determine header background color
  const getHeaderBgClass = () => {
    if (isHomepage || isLevelPage) {
      return 'backdrop-blur-[36px]'
    }
    return 'bg-white/90 supports-[backdrop-filter]:bg-white/90'
  }

  const getHeaderStyle = () => {
    if (isHomepage || isLevelPage) {
      return { backgroundColor: getFloodColor(language, 0.9) }
    }
    return {}
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-white/[0.12] ${getHeaderBgClass()}`}
      style={getHeaderStyle()}
    >
      <div className="container flex h-16 items-center px-6 relative">
        {/* Logo or Back Button - absolute positioned */}
        <div className="absolute left-6">
          {isLevelPage ? (
            <Link href="/">
              <Button
                variant="outline"
                size="icon"
                className="bg-background/80 backdrop-blur-sm rounded-full w-9 h-9"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to home</span>
              </Button>
            </Link>
          ) : (
            <Link href="/" className="flex items-center space-x-1">
              <Image
                src="/images/music_note@2x.png"
                alt="Music note icon"
                width={28}
                height={28}
                style={{ objectFit: 'contain' }}
                className="text-primary w-7 h-7"
              />
              <span className="font-medium text-xl">diddydum</span>
            </Link>
          )}
        </div>

        {/* Center content - Combined Language & Level Selector on level pages */}
        <div className="flex-1 flex justify-center">
          {isLevelPage && currentLevel ? (
            <div className="inline-flex items-center bg-background/80 backdrop-blur-sm rounded-full border border-white/20">
              {/* Language Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="font-medium hover:bg-white/10 text-black rounded-l-full rounded-r-none h-10 px-4 border-r border-black/[0.08] gap-2"
                  >
                    <span className="text-base">{language === 'es' ? '🇪🇸' : '🇫🇷'}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[240px]">
                  {[
                    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
                    { code: 'fr', name: 'French', flag: '🇫🇷' }
                  ].map((lang, index) => (
                    <div key={lang.code}>
                      <DropdownMenuItem
                        onClick={() => setLanguage(lang.code)}
                        className={`gap-3 px-6 py-4 text-lg cursor-pointer text-black ${lang.code === language ? 'bg-accent' : ''}`}
                      >
                        <span className="text-2xl">{lang.flag}</span>
                        <span className="text-lg font-medium">{lang.name}</span>
                        {lang.code === language && <span className="ml-auto text-xl">✓</span>}
                      </DropdownMenuItem>
                      {index < 1 && (
                        <DropdownMenuSeparator className="bg-black/[0.08]" />
                      )}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Level Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="font-medium hover:bg-white/10 text-black rounded-r-full rounded-l-none h-10 px-4 gap-2"
                  >
                    {languageName} {currentLevel}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[240px]">
                  {[1, 2, 3, 4, 5].map((lvl, index) => (
                    <div key={lvl}>
                      <DropdownMenuItem
                        onClick={() => router.push(`/levels/${lvl}`)}
                        className={`gap-3 px-6 py-4 text-lg cursor-pointer text-black ${lvl === currentLevel ? 'bg-accent' : ''}`}
                      >
                        <span className="text-lg font-medium">{languageName} {lvl}</span>
                        {lvl === currentLevel && <span className="ml-auto text-xl">✓</span>}
                      </DropdownMenuItem>
                      {index < 4 && (
                        <DropdownMenuSeparator className="bg-black/[0.08]" />
                      )}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </div>

        {/* Right side - Language Selector (only on non-level pages) */}
        {!isLevelPage && (
          <div className="absolute right-6 flex items-center gap-3">
            <LanguageSelector />
          </div>
        )}
      </div>
    </header>
  )
}