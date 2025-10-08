# Multi-Language Support Implementation

## Overview
This document outlines the plan to add multi-language support to diddydum, allowing users to learn French (and other languages in the future) in addition to Spanish through music.

## Current State
- App currently supports Spanish songs only (language field defaults to 'es')
- Database schema already includes `language` field on Song model
- Translation infrastructure supports multiple target languages
- All necessary indexes are in place

## Goals
1. Allow users to switch between learning languages (Spanish, French, etc.)
2. Maintain separate song repositories per language
3. Persist language preference across sessions
4. Keep user progress and stats language-specific where appropriate

---

## Implementation Plan

### Phase 1: Database & Backend Infrastructure

#### 1.1 User Language Preference Storage
**File**: `prisma/schema.prisma`

Add user preference field:
```prisma
model User {
  // ... existing fields
  preferredLanguage String @default("es") // ISO 639-1 language code
}
```

**Migration**:
```bash
DATABASE_URL="file:./dev.db" npx prisma db push
```

#### 1.2 API Routes

**File**: `app/api/levels/route.ts`

Update to accept language query parameter:
```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const language = searchParams.get('language') || 'es'

  const songs = await prisma.song.findMany({
    where: {
      isActive: true,
      level: { not: null },
      language: language // Add language filter
    },
    // ... rest of query
  })
  // ... rest of implementation
}
```

**New File**: `app/api/user/preferences/route.ts`

Create endpoint to get/update user language preference:
```typescript
// GET: Fetch user's preferred language
// POST: Update user's preferred language
```

#### 1.3 Client Functions

**File**: `lib/client.ts`

Update fetchLevels to accept language parameter:
```typescript
export async function fetchLevels(language: string = 'es') {
  const response = await fetch(`/api/levels?language=${language}`)
  if (!response.ok) {
    throw new Error('Failed to fetch levels')
  }
  return response.json()
}
```

---

### Phase 2: Language Context & State Management

#### 2.1 Language Context

**New File**: `contexts/LanguageContext.tsx`

Create context for managing selected language:
```typescript
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
    if (saved) setLanguageState(saved)
  }, [])

  const setLanguage = (lang: string) => {
    setLanguageState(lang)
    localStorage.setItem('preferredLanguage', lang)
    // Optionally: sync to backend for authenticated users
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languages }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
```

#### 2.2 Add Provider to App

**File**: `app/providers.tsx`

Wrap existing providers with LanguageProvider:
```typescript
import { LanguageProvider } from '@/contexts/LanguageContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SessionProvider>
    </LanguageProvider>
  )
}
```

---

### Phase 3: UI Components

#### 3.1 Language Selector Component

**New File**: `components/LanguageSelector.tsx`

Create dropdown for language selection:
```typescript
'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

export function LanguageSelector() {
  const { language, setLanguage, languages } = useLanguage()

  const currentLang = languages.find(l => l.code === language) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <span>{currentLang.flag}</span>
          <span>{currentLang.name}</span>
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="gap-2"
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
            {lang.code === language && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

#### 3.2 Add to Homepage

**File**: `app/page.tsx`

Add language selector to top-right of Music tab:
```typescript
import { LanguageSelector } from '@/components/LanguageSelector'
import { useLanguage } from '@/contexts/LanguageContext'

export default function HomePage() {
  const { language } = useLanguage()

  const { data: levelsData, isLoading, error } = useQuery({
    queryKey: ['levels', language], // Add language to query key
    queryFn: () => fetchLevels(language), // Pass language to fetch
  })

  return (
    <div className="bg-brand min-h-screen">
      <div className="container py-8">
        {/* Language Selector - Top Right */}
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>

        {/* Hero Section */}
        <div className="mb-12 text-center">
          {/* ... existing content ... */}
          <h1 className="text-[44px] leading-[52px] font-medium tracking-tight mb-4">
            Learn Languages<br />Through Music
          </h1>
          {/* ... rest of content ... */}
        </div>

        {/* ... rest of component ... */}
      </div>
    </div>
  )
}
```

---

### Phase 4: French Song Repository

#### 4.1 Initial French Songs Data

**New File**: `scripts/seedFrenchSongs.ts`

Create script to seed French songs:
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const frenchSongs = [
  // Level 1 - Beginner
  {
    title: 'La Vie en Rose',
    artist: 'Édith Piaf',
    spotifyId: '...',
    language: 'fr',
    level: 1,
    levelName: 'Beginner',
    isActive: true
  },
  {
    title: 'Aux Champs-Élysées',
    artist: 'Joe Dassin',
    spotifyId: '...',
    language: 'fr',
    level: 1,
    levelName: 'Beginner',
    isActive: true
  },
  // Add more songs...
]

async function seedFrenchSongs() {
  console.log('Seeding French songs...')

  for (const song of frenchSongs) {
    await prisma.song.create({
      data: song
    })
    console.log(`Added: ${song.title} by ${song.artist}`)
  }

  console.log('French songs seeded successfully!')
}

seedFrenchSongs()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

#### 4.2 Hydrate French Songs

Use existing hydration script with French songs:
```bash
# For each French song:
DATABASE_URL="file:./dev.db" \
  SPOTIFY_CLIENT_ID="..." \
  SPOTIFY_CLIENT_SECRET="..." \
  MUSIXMATCH_API_KEY="..." \
  MUSIXMATCH_FULL_LYRICS="true" \
  TRANSLATOR=openai \
  OPENAI_API_KEY="$OPENAI_API_KEY" \
  npx tsx scripts/songHydration.ts [frenchSongId] --force
```

**Note**: Translation will be French → English (already supported by Translation model)

---

### Phase 5: Update Related Components

#### 5.1 Level Pages

**File**: `app/levels/[level]/page.tsx`

Update to filter by current language:
```typescript
const { language } = useLanguage()

const { data: songs } = useQuery({
  queryKey: ['level-songs', level, language],
  queryFn: async () => {
    const response = await fetch(`/api/levels?language=${language}`)
    const data = await response.json()
    return data.levels[level] || []
  }
})
```

#### 5.2 User Progress & Stats

Consider language-specific vs. cross-language metrics:
- **Language-specific**: Song completion, quizzes, saved songs
- **Cross-language**: Total time spent, overall level progression
- Update `/api/user/stats` to aggregate appropriately

---

## Future Enhancements

### Additional Languages
- Italian (it)
- German (de)
- Portuguese (pt)
- Mandarin (zh)

### Advanced Features
- Side-by-side language comparison mode
- Cross-language vocabulary building
- Language-specific pronunciation guides
- Community-contributed translations

---

## Testing Checklist

- [ ] Language selection persists across page reloads
- [ ] Switching language updates song listings immediately
- [ ] French songs have proper translations (French → English)
- [ ] User progress is tracked per language
- [ ] Profile stats show aggregate data correctly
- [ ] Saved songs are filtered by language
- [ ] Empty state shown when no songs exist for language
- [ ] Mobile responsive language selector
- [ ] Deep links preserve language context

---

## Rollout Strategy

### Phase 1: Backend Foundation (Week 1)
- Database schema updates
- API route modifications
- Language context implementation

### Phase 2: UI Implementation (Week 1)
- Language selector component
- Homepage integration
- Update all song-listing pages

### Phase 3: Content Addition (Week 2)
- Add 10-15 French songs (Levels 1-2)
- Hydrate with lyrics and translations
- Test and verify quality

### Phase 4: Testing & Polish (Week 2)
- Cross-browser testing
- Mobile testing
- Performance optimization
- User feedback collection

---

## Technical Considerations

### Translation Direction
- **Spanish songs**: ES → EN (current)
- **French songs**: FR → EN (new)
- Translation model already supports this via `targetLang` field

### Morphology & Scoring
- Current morphology package is Spanish-specific
- French will need separate morphological analyzer
- Consider abstracting scoring logic to be language-agnostic

### Lyrics Provider
- Musixmatch supports multiple languages
- Verify French lyrics availability and quality
- May need language-specific API parameters

### Performance
- Language filter adds minimal query overhead (indexed field)
- Consider caching level data per language
- React Query handles cache invalidation on language change

---

## Dependencies

### Existing
- ✅ Database `language` field on Song model
- ✅ Translation model supports multiple target languages
- ✅ Musixmatch API supports French lyrics
- ✅ OpenAI translation supports FR → EN

### New
- Language context/provider
- Language selector UI component
- User preference storage
- French song data/content

---

## Success Metrics

- Users can switch between Spanish and French seamlessly
- At least 10 French songs available at launch
- Language preference persists correctly
- No performance degradation from language filtering
- Positive user feedback on French song quality

---

**Last Updated**: 2025-10-08
**Status**: Planning Phase
**Target Completion**: 2 weeks from approval
