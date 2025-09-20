'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AuthButton } from '@/components/AuthButton'
import { Button } from '@/components/ui/button'

export function Header() {
  const pathname = usePathname()
  const isHomepage = pathname === '/'
  const isLevelPage = pathname.startsWith('/levels/')

  return (
    <header className={`sticky top-0 z-50 w-full border-b border-white/[0.12] backdrop-blur ${
      isHomepage
        ? 'bg-brand/60 supports-[backdrop-filter]:bg-brand/60'
        : 'bg-white/60 supports-[backdrop-filter]:bg-white/60'
    }`}>
      <div className="container flex h-16 items-center px-6">
        {/* Logo or Back Button */}
        {isLevelPage ? (
          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="bg-background/80 backdrop-blur-sm rounded-full w-9 h-9 mr-6"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to home</span>
            </Button>
          </Link>
        ) : (
          <Link href="/" className="flex items-center space-x-1 mr-6">
            <Image
              src="/images/music_note@2x.png"
              alt="Music note icon"
              width={28}
              height={28}
              style={{ objectFit: 'contain' }}
              className="text-primary w-7 h-7"
            />
            <span className="font-bold text-xl">diddydum</span>
          </Link>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Only show Auth Button for sign in - logged in users use tab navigation */}
        <div className="auth-button-container">
          <AuthButton />
        </div>
      </div>
    </header>
  )
}