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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLanguageName, getFloodColor, getFloodComplementaryColor } from '@/lib/languageUtils'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { language } = useLanguage()
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

        {/* Center content - Level Dropdown on level pages - truly centered */}
        <div className="flex-1 flex justify-center">
          {isLevelPage && currentLevel && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="font-medium hover:bg-transparent text-white">
                  {languageName} {currentLevel}
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <DropdownMenuItem
                    key={lvl}
                    onClick={() => router.push(`/levels/${lvl}`)}
                    className={lvl === currentLevel ? 'bg-accent' : ''}
                  >
                    {languageName} {lvl}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Right side - Language Selector */}
        <div className="absolute right-6 flex items-center gap-3">
          <LanguageSelector />
        </div>
      </div>
    </header>
  )
}