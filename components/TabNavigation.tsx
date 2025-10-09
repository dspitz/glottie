'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Music, GraduationCap, Brain, Bookmark, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useLanguage } from '@/contexts/LanguageContext'
import { getFloodColor, getSecondaryColor } from '@/lib/languageUtils'

interface TabItem {
  href: string
  icon?: React.ReactNode
  label: string
  requireAuth?: boolean
}

export function TabNavigation() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { language } = useLanguage()
  const isHomepage = pathname === '/' || pathname.startsWith('/levels')

  const tabs: TabItem[] = [
    {
      href: '/',
      icon: <Music className="h-5 w-5" />,
      label: 'Music'
    },
    {
      href: '/vocab',
      icon: <GraduationCap className="h-5 w-5" />,
      label: 'Basics'
    },
    {
      href: '/learnings',
      icon: <Brain className="h-5 w-5" />,
      label: 'Learnings'
    },
    {
      href: '/saved',
      icon: <Bookmark className="h-5 w-5" />,
      label: 'Saved'
    },
    {
      href: '/profile',
      icon: null, // Will use avatar
      label: session?.user?.name?.split(' ')[0] || 'Profile',
      requireAuth: true
    }
  ]

  const initials = session?.user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U'

  // Check if current path is active
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname.startsWith('/levels')
    }
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.12] backdrop-blur-[36px]"
      style={{ backgroundColor: getFloodColor(language, 0.9) }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            // Hide auth-required tabs if not signed in
            if (tab.requireAuth && !session) {
              return null
            }

            const active = isActive(tab.href)

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all
                  ${active
                    ? 'transform scale-110'
                    : 'text-black/50 hover:text-black hover:scale-105'
                  }
                `}
                style={active ? { color: getSecondaryColor(language) } : {}}
              >
                {tab.href === '/profile' && session ? (
                  <Avatar className="h-5 w-5 ring-1 ring-black/[0.08]">
                    <AvatarImage
                      src={session.user?.image || ''}
                      alt={session.user?.name || ''}
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                    <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                  </Avatar>
                ) : (
                  tab.icon
                )}
                <span className="text-xs font-medium">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}