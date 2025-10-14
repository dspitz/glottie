# Song Modal & Translation Modal Refactor

## Overview
This refactor transforms the learning experience by separating "Song Preparation" from "Play Mode" and adding a post-song quiz system.

## Goals
1. **Prep Phase**: Give users vocabulary and chorus preview before singing
2. **Play Phase**: Immersive line-by-line or list view with auto-open
3. **Quiz Phase**: Test comprehension after listening

---

## Current Architecture

### SongModal (Song Detail Page)
- Opens when user clicks a song from level list
- Shows: Song header, album art, summary, full lyrics list
- User scrolls through all lyrics with language toggle (Spanish | English | Both)
- Click on any line → opens TranslationBottomSheet

### TranslationBottomSheet (Line Detail View)
- Opens when user clicks a specific lyric line
- Shows: Single line with word-by-word translations
- Navigation arrows to move prev/next line
- Word definitions on click
- Playback controls for that specific line

### Current Flow
```
Level List → Click Song → SongModal (prep + lyrics) → Click Line → TranslationBottomSheet (detail)
```

---

## New Architecture

### Phase 1: Song Prep Modal (Enhanced SongModal)

#### 1.1 Key Vocabulary Section
**Purpose**: Help users preview important words before singing

**Features**:
- Extract 10-15 most common/useful words from song
- Display in responsive grid layout
- Two columns: Original language | English translation
- Score words by:
  - Frequency in the song
  - Educational value (prioritize verbs, nouns, adjectives over articles)
  - Difficulty level (avoid too basic words like "el", "la")

**Implementation**:
- Algorithm analyzes `lyricsRaw.lines` array
- Filters out common stop words (el, la, de, y, es, etc.)
- Counts word frequency
- Scores by part-of-speech (verbs > nouns > adjectives > adverbs)
- Returns top 10-15 words with translations

**API**:
```typescript
GET /api/songs/[id]/vocab
Response: {
  vocab: Array<{
    word: string,
    translation: string,
    count: number,
    partOfSpeech: string
  }>
}
```

**Component**:
```tsx
<KeyVocabSection vocab={vocabData} language={song.language} />
```

**Location**: Below song summary, above chorus

---

#### 1.2 Chorus Detection & Display
**Purpose**: Show the most repeated part of the song for easy memorization

**Features**:
- Detect chorus automatically from lyrics
- Display in "both" format (original + translation side-by-side)
- Highlight as the "hook" of the song

**Detection Algorithm**:
1. Check if `lyricsRaw` JSON has Musixmatch section markers (unlikely in LRC format)
2. Fallback: Find sequences of 3+ consecutive lines that repeat 2+ times in the song
3. Select the longest repeated sequence as chorus
4. If multiple sequences found, choose the one that appears most frequently

**Component**:
```tsx
<ChorusSection
  chorusLines={chorusData.lines}
  translations={chorusData.translations}
  language={song.language}
/>
```

**Display Format**:
```
CHORUS
Spanish line 1          English line 1
Spanish line 2          English line 2
Spanish line 3          English line 3
```

**Location**: Between key vocab and "Start Singing" button

---

#### 1.3 Enhanced AI Song Summary
**Purpose**: Provide richer context about the song's content, culture, and learning value

**Current Summary**: Basic 1-2 sentence description of song theme

**Enhanced Summary** includes:
- **Theme/Story**: What the song is about
- **Cultural Context**: Idioms, cultural references, historical context
- **Grammar Patterns**: Key tenses, verb forms, sentence structures featured
- **Learning Opportunities**: Why this song is good for language learning

**Implementation**:
- Update `scripts/songHydration.ts` summary generation prompt
- Expand from ~50 tokens to ~150 tokens
- Create regeneration script for existing songs

**Example**:
```
Current: "A romantic ballad about lost love and memories."

Enhanced: "A romantic ballad exploring themes of lost love and nostalgia.
The song uses past tense (pretérito) extensively, making it excellent for
practicing imperfect vs. preterite distinctions. Cultural note: References
to 'la madrugada' (dawn) carry special romantic significance in Spanish
poetry. Features common expressions like 'te echo de menos' (I miss you)."
```

**Display**: Expand existing summary area in SongHeader, possibly collapsible if too long

---

### Phase 2: Post-Song Quiz System

#### 2.1 Play Count Tracking
**Purpose**: Know how many times user has listened to enable quiz prompts

**Database Changes**:
```typescript
// Update SongProgress model
model SongProgress {
  id            String   @id @default(cuid())
  userId        String
  songId        String
  playCount     Int      @default(0)  // NEW
  completed     Boolean  @default(false)
  playProgress  Float?   // 0-100, percentage of song played
  lastPlayedAt  DateTime?
  quizScore     Int?     // 0-100, null if not completed
  completedAt   DateTime?
  // ... existing fields
}
```

**Tracking Logic**:
- Song completion = user plays 90%+ of the song
- On completion: `playCount++`, `lastPlayedAt = now()`
- Tracked per user per song

---

#### 2.2 Quiz Prompt Component
**Purpose**: Invite users to test their comprehension after listening

**Trigger**: When song completion fires (same time as confetti)

**Behavior**:
- **In TranslationBottomSheet**: Fade out lyrics content → Fade in quiz prompt
- Don't create new sheet/modal
- Smooth crossfade animation (~300ms)

**Content**:
```
🎉 Great job!

You've listened to "[Song Name]" 3 times!

Ready to test what you've learned?

[Take Quiz]  [Replay Song]
```

**Actions**:
- **Take Quiz**: Navigate to `/quiz/[songId]`
- **Replay Song**: Fade back to lyrics view, reset audio to beginning, auto-play

**State Management**:
```typescript
// In TranslationBottomSheet
enum SheetMode {
  LYRICS = 'lyrics',           // Default: showing lyrics
  QUIZ_PROMPT = 'quiz_prompt', // Showing quiz invitation
}

const [sheetMode, setSheetMode] = useState<SheetMode>(SheetMode.LYRICS)
```

---

#### 2.3 Quiz View Page
**Purpose**: Test vocabulary, listening comprehension, and grammar

**Route**: `/app/quiz/[id]/page.tsx`

**Question Types**:

1. **Vocabulary Multiple Choice** (30% of questions)
   - Show a word from the song in target language
   - Provide 4 translation options (1 correct + 3 distractors)
   - Example: "What does 'corazón' mean?" → [Heart, Soul, Mind, Love]

2. **Lyric Reconstruction** (25% of questions)
   - Play 5-second audio clip of a line
   - Show word tiles (correct words + 2-3 distractors)
   - User drags tiles into correct order
   - Example: Audio plays "Me gusta la música"
   - Tiles: [gusta, Me, perro, la, música, el]
   - Correct order: [Me, gusta, la, música]

3. **Verb Conjugation Fill-in-Blank** (25% of questions)
   - Show sentence with blank for verb
   - Provide 4 conjugation options
   - Example: "Yo ___ la canción" → [canto, cantas, canta, cantan]

4. **Listening Comprehension** (20% of questions)
   - Play full line from song
   - Show 4 English translation options
   - User selects correct translation

**Quiz Structure**:
- 10 questions total (mix of types above)
- Pull questions from song's key vocab and lyrics
- Randomize order
- Show progress: "Question 3 of 10"

**Scoring**:
- 1 point per correct answer
- Final score: percentage (0-100)
- Save to `SongProgress.quizScore`
- Show results page with score + option to retake or return to song

**Quiz Results Page**:
```
🎊 Quiz Complete!

Your Score: 8/10 (80%)

✓ Vocabulary: 3/3
✓ Listening: 2/2
~ Verb Conjugation: 2/3
✓ Lyric Reconstruction: 1/2

[Retake Quiz]  [Back to Song]  [Next Song]
```

---

### Phase 3: Unified Play Mode Experience

#### 3.1 Remove Lyrics List from SongModal
**Purpose**: Separate preparation from playing

**Changes**:
- Remove `<LyricsView>` component from SongModal
- SongModal now only shows:
  - Song header with album art
  - AI song summary
  - Key vocabulary section
  - Chorus preview
  - **"Start Singing" button** (large, prominent)

**New Flow**:
```
Before: SongModal shows prep + full lyrics
After:  SongModal shows prep only + "Start Singing" button
```

---

#### 3.2 TranslationBottomSheet Default (No Change)
**Purpose**: Keep current behavior as default

**Current Behavior** (preserve this):
- Single line detail view
- Shows word-by-word breakdown
- Word definitions on click
- Navigation arrows (prev/next line)
- Synchronized highlighting
- Playback controls for current line

**No changes to default mode!**

---

#### 3.3 Add List View Toggle
**Purpose**: Give users option to see all lyrics while playing

**UI Element**: Icon button in top-right corner (where bookmark button currently is)

**Two Modes**:

**Mode 1: Line-by-Line View (DEFAULT)**
- Current single-line focused view
- Shows both original + translation
- Word definitions available
- Navigation arrows
- Icon: **Lines icon** (☰ or three horizontal lines)
- Clicking icon switches to List View

**Mode 2: List View (ALTERNATE)**
- Shows ALL lyrics in scrollable view
- Language toggle visible: Spanish | English | Both
- Synchronized highlighting (current line highlighted as audio plays)
- Lines are clickable → switches back to Line-by-Line view for that line
- Icon: **Grid icon** (⊞ or grid squares)
- Clicking icon switches back to Line-by-Line View

**Toggle Behavior**:
```typescript
enum ViewMode {
  LINE_BY_LINE = 'line',  // Default
  LIST = 'list',          // Alternate
}

const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LINE_BY_LINE)
```

**Icon Changes**:
- Line-by-Line mode showing → Display grid icon (click to switch to List)
- List mode showing → Display lines icon (click to switch to Line-by-Line)

**Layout**:
```
┌─────────────────────────────┐
│  [X]            [Language▼] [☰] │  ← Line-by-Line mode
│                             │
│  Me gusta la música         │
│  I like the music           │
│                             │
│  [📖 gusta] [📖 música]    │
│                             │
│  [← Previous]  [Next →]    │
└─────────────────────────────┘

┌─────────────────────────────┐
│  [X]  [Spanish▼ English Both] [⊞] │  ← List mode
│                             │
│  > Me gusta la música       │  ← Current (highlighted)
│    Te amo mucho             │
│    Canto contigo            │
│    ...                      │
│                             │
└─────────────────────────────┘
```

---

#### 3.4 Auto-Open TranslationBottomSheet on Play
**Purpose**: Seamless transition from prep to playing

**Trigger**: "Start Singing" button in SongModal

**Behavior**:
1. User clicks "Start Singing" in SongModal
2. TranslationBottomSheet slides up (opens)
3. Audio starts playing immediately
4. Sheet opens in **Line-by-Line mode** (default)
5. First line is shown with synchronized highlighting
6. User can manually toggle to List View if desired

**State Flow**:
```
SongModal (Prep)
  ↓ Click "Start Singing"
TranslationBottomSheet (Line-by-Line) + Audio Playing
  ↓ User clicks grid icon
TranslationBottomSheet (List View) + Audio Still Playing
  ↓ User clicks line in list
TranslationBottomSheet (Line-by-Line for that line)
```

---

## Implementation Phases

### Phase 1: Song Prep Enhancements
**Timeline**: 2-3 weeks
**Tasks**:
1. Vocabulary extraction algorithm
2. KeyVocabSection component
3. Chorus detection algorithm
4. ChorusSection component
5. Enhanced AI summary prompt
6. Summary regeneration script

### Phase 2: Quiz System
**Timeline**: 2 weeks
**Tasks**:
1. Update SongProgress schema (playCount field)
2. Play count tracking logic
3. Quiz prompt state in TranslationBottomSheet
4. Quiz page route + layout
5. Question generation algorithms
6. Quiz scoring and results

### Phase 3: Unified Play Mode
**Timeline**: 1.5 weeks
**Tasks**:
1. Remove LyricsView from SongModal
2. Add "Start Singing" button
3. Implement view mode toggle in TranslationBottomSheet
4. Build List View mode
5. Auto-open TranslationBottomSheet on play
6. Testing and polish

**Total Timeline**: 5-6 weeks

---

## Technical Considerations

### Performance
- Vocab extraction should be cached per song (compute once, store in DB or cache)
- Chorus detection can be computed on-demand (relatively fast)
- Quiz questions can be generated on page load (not pre-computed)

### Data Storage
- Vocab could be stored in Song model as JSON field
- Chorus indices could be stored as JSON field
- Play counts and quiz scores in SongProgress model

### Accessibility
- Keyboard navigation for quiz tiles
- ARIA labels for mode toggle buttons
- Screen reader announcements for mode changes

### Mobile Considerations
- List view should be scrollable with touch
- Drag-and-drop tiles need mobile-friendly implementation
- Buttons need adequate touch targets (44x44px minimum)

---

## Success Metrics

### User Engagement
- % of users who view key vocab before playing
- % of users who toggle to List View
- Average play count before taking quiz
- Quiz completion rate

### Learning Outcomes
- Average quiz scores by level
- Quiz score improvement on retakes
- Correlation between play count and quiz score

### Feature Adoption
- % of sessions that use "Start Singing" auto-open
- % of time in Line-by-Line vs List View
- Bounce rate from quiz prompt

---

## Future Enhancements

### Phase 4 (Future)
- Spaced repetition for vocab review
- Personalized word lists across songs
- Leaderboards for quiz scores
- Adaptive difficulty (quiz adjusts to user level)
- Voice recording for pronunciation practice
- Collaborative quizzes (challenge friends)

---

## Open Questions

1. Should vocab be generated during hydration or on-demand?
2. How many times should user listen before quiz prompt appears? (Currently: always show after completion)
3. Should quiz be required to "complete" a song or optional?
4. Should chorus detection be manual override-able by admins?
5. Do we need analytics tracking for each phase?

---

## References

- Current SongModal: `/components/SongModal.tsx`
- Current TranslationBottomSheet: `/components/TranslationBottomSheet.tsx`
- Current LyricsView: `/components/LyricsView.tsx`
- Database Schema: `/prisma/schema.prisma`
- Song Hydration: `/scripts/songHydration.ts`
