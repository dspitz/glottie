import React from 'react'
import Link from 'next/link'
import { Music } from 'lucide-react'
import { AuthButton } from '@/components/AuthButton'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 mr-6">
          <Music className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">Recanta</span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Auth Button */}
        <AuthButton />
      </div>
    </header>
  )
}