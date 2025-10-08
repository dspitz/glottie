# Learning Features Architecture

## Overview

The learning features in Glottie are organized into three main tabs, each serving a distinct purpose in the Spanish language learning journey.

## Navigation Structure

### 1. Music Tab (Home/Levels)
**Path**: `/` and `/levels/[level]`

**Purpose**: Primary content discovery and song-based learning

**Features**:
- Browse songs by difficulty level (1-10)
- View song cards with metadata (title, artist, level, difficulty score)
- Click to open song modal with synchronized lyrics
- Interactive lyrics with word definitions
- Integrated Spotify playback

**User Flow**:
1. User selects a difficulty level
2. Browses available songs at that level
3. Clicks a song to open the modal
4. Interacts with lyrics (click words, bookmark phrases)
5. System tracks word clicks and phrase bookmarks

---

### 2. Vocab Tab
**Path**: `/vocab`

**Purpose**: Curated vocabulary reference

**Features**:
- Displays 100 most important Spanish words
- Organized by usefulness and frequency
- Grid layout for easy browsing
- Click any word to see:
  - Definition
  - Part of speech
  - Examples
  - Conjugations (for verbs)
  - Synonyms

**Content Source**:
- Pre-populated database of essential Spanish vocabulary
- Scored by linguistic frequency and usefulness
- Not personalized (same for all users)

---

### 3. Learnings Tab (NEW)
**Path**: `/learnings`

**Purpose**: Personalized learning progress tracking

**Architecture**: Tabbed interface with two sections

#### Tab 1: Engaged Words (Default)
**Purpose**: Track words the user has actively explored

**Data Source**: `/api/word-clicks`

**Features**:
- Displays words user has clicked on (from song lyrics)
- Sorted by click count (descending)
- Shows engagement frequency with badge (e.g., "3×")
- Displays translation and part of speech
- Clicking opens VocabularyModal with full word details
- Real-time updates (polls every 3 seconds)

**Layout**:
- Vertical list format
- Each item shows:
  - Click count badge (left)
  - Spanish word + English translation (center)
  - Part of speech tag (right)

**Empty State**:
"Start clicking on words in songs to see them here!"

**Use Case**:
User clicks on "bailar" 5 times across different songs → appears at top of engaged words list with "5×" badge

---

#### Tab 2: Saved Phrases
**Purpose**: Store memorable phrases from songs for later review

**Data Source**: `/api/bookmarks/lines`

**Features**:
- Displays bookmarked lyrics lines
- Shows Spanish text with English translation
- Includes song context (title, artist)
- Chronological order (newest first)
- Works with both authenticated users (database) and guest users (localStorage)

**Layout**:
- Vertical list format
- Each item shows:
  - Spanish phrase (bold)
  - English translation (italic, muted)
  - Song title and artist (small text with book icon)

**Empty State**:
"Bookmark lyrics from songs to save them here!"

**Use Case**:
User bookmarks "La vida es un carnaval" from Celia Cruz → appears in saved phrases with full context

---

## Data Flow

### Word Engagement Tracking

```
1. User clicks word in song lyrics
   ↓
2. POST /api/word-clicks
   ↓
3. Increment click count in database/localStorage
   ↓
4. Learnings tab polls /api/word-clicks
   ↓
5. Display updated engaged words list
```

### Phrase Bookmarking

```
1. User clicks bookmark button on lyric line
   ↓
2. POST /api/bookmarks/lines
   ↓
3. Save to database (authenticated) or localStorage (guest)
   ↓
4. Saved Phrases tab fetches /api/bookmarks/lines
   ↓
5. Display bookmarked phrases with song context
```

---

## Component Structure

### Learnings Page
**File**: `/app/learnings/page.tsx`

**Key Components**:
- Tabs (shadcn/ui)
  - TabsList: Navigation between tabs
  - TabsContent: Content for each tab
- VocabularyModal: Word detail popup (shared with Vocab tab)
- Skeleton loaders for loading states

**State Management**:
- `engagedWords`: Array of word engagement data
- `bookmarkedLines`: Array of saved phrases
- `isLoadingEngaged`: Loading state for engaged words
- `isLoadingBookmarks`: Loading state for bookmarks
- `selectedWord`: Currently selected word for modal
- `modalOpen`: Modal visibility state

---

## UI/UX Patterns

### List Layout
Both tabs use vertical list format for:
- Better scannability
- More space for translations
- Consistent reading flow
- Mobile-friendly design

### Visual Hierarchy
- **Engaged Words**: Click count badge → Word → Translation → POS tag
- **Saved Phrases**: Spanish text → Translation → Song metadata

### Color Coding (Part of Speech)
- Noun: Blue (`bg-blue-100 text-blue-800`)
- Verb: Green (`bg-green-100 text-green-800`)
- Adjective: Purple (`bg-purple-100 text-purple-800`)
- Adverb: Orange (`bg-orange-100 text-orange-800`)
- Other: Gray (`bg-gray-100 text-gray-800`)

---

## API Endpoints

### GET /api/word-clicks
**Purpose**: Retrieve user's word engagement data

**Query Params**:
- `limit`: Number of words to return (default: 20)

**Response**:
```typescript
{
  words: Array<{
    word: string
    clickCount: number
    vocabulary: VocabularyWord | null
    translation: string | null
    definition: string | null
    lastClickedAt: string | null
  }>
}
```

### GET /api/bookmarks/lines
**Purpose**: Retrieve user's bookmarked phrases

**Response**:
```typescript
Array<{
  id: string
  songId: string
  songTitle: string
  songArtist: string
  lineText: string
  lineTranslation: string | null
  lineIndex: number
  bookmarkedAt: string
}>
```

### POST /api/bookmarks/lines
**Purpose**: Create new bookmarked phrase

**Body**:
```typescript
{
  songId: string
  lineText: string
  lineTranslation: string
  lineIndex: number
}
```

---

## Database Schema

### WordClick Table
```prisma
model WordClick {
  id            String   @id @default(cuid())
  userId        String?
  word          String
  clickCount    Int      @default(1)
  lastClickedAt DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### BookmarkedLine Table
```prisma
model BookmarkedLine {
  id              String   @id @default(cuid())
  userId          String
  songId          String
  lineText        String
  lineTranslation String?
  lineIndex       Int
  createdAt       DateTime @default(now())

  song Song @relation(fields: [songId], references: [id])
  user User @relation(fields: [userId], references: [id])
}
```

---

## Future Enhancements

### Engaged Words
- [ ] Add "Study" mode for spaced repetition review
- [ ] Show word usage examples from songs where it appeared
- [ ] Add "Mastered" status after N reviews
- [ ] Export to Anki/flashcard apps

### Saved Phrases
- [ ] Add notes/annotations to bookmarks
- [ ] Create custom collections/folders
- [ ] Share bookmarks with other users
- [ ] Practice pronunciation with audio playback
- [ ] Add context (previous/next lines from song)

### Analytics
- [ ] Learning streak tracking
- [ ] Daily/weekly word engagement stats
- [ ] Most challenging words (clicked but not learned)
- [ ] Progress charts and milestones

---

## Migration Notes

**From**: Engaged words were originally on the Vocab tab alongside key vocabulary

**To**: Moved to Learnings tab as first tab in tabbed interface

**Rationale**:
1. Separates curated content (Vocab) from personalized content (Learnings)
2. Groups related learning features together (word engagement + phrase bookmarking)
3. Makes Vocab tab more focused and less cluttered
4. Provides dedicated space for personal learning progress

**Code Changes**:
- Removed engaged words section from `/app/vocab/page.tsx`
- Created new `/app/learnings/page.tsx` with tabbed interface
- Reused existing APIs (`/api/word-clicks`, `/api/bookmarks/lines`)
- Maintained consistent list-based layout across both tabs

---

## Testing Checklist

- [ ] Engaged words load correctly
- [ ] Click count updates in real-time
- [ ] Bookmarked phrases appear immediately after bookmarking
- [ ] Empty states show appropriate messaging
- [ ] VocabularyModal opens when clicking engaged words
- [ ] Translations display correctly
- [ ] Part of speech colors render properly
- [ ] Layout works on mobile devices
- [ ] Loading skeletons display during data fetch
- [ ] Guest users see localStorage data
- [ ] Authenticated users see database data

---

*Last updated: 2025-01-06*
