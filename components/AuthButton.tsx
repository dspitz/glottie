'use client'

import React from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogIn, LogOut, User, Crown, Music } from 'lucide-react'

export function AuthButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
      </div>
    )
  }

  // Only show sign-in button for non-authenticated users
  // Authenticated users will use the profile tab navigation
  if (!session) {
    return (
      <Button
        onClick={() => signIn('spotify')}
        variant="outline"
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white border-green-600"
      >
        <LogIn className="w-4 h-4 mr-2" />
        Sign in with Spotify
      </Button>
    )
  }

  // Return null for authenticated users as they have the profile tab
  return null
}