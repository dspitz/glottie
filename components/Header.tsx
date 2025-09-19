'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { AuthButton } from '@/components/AuthButton'

export function Header() {
  const pathname = usePathname()
  const isHomepage = pathname === '/'

  return (
    <header className={`sticky top-0 z-50 w-full border-b border-white/[0.12] backdrop-blur ${
      isHomepage
        ? 'bg-brand/60 supports-[backdrop-filter]:bg-brand/60'
        : 'bg-white/60 supports-[backdrop-filter]:bg-white/60'
    }`}>
      <div className="container flex h-16 items-center px-6">
        {/* Logo */}
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

        {/* Spacer */}
        <div className="flex-1" />

        {/* Auth Button */}
        <AuthButton />
      </div>
    </header>
  )
}