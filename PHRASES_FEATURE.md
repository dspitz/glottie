# Phrases Feature - Implementation Plan & Documentation

## Overview
The Phrases feature extracts useful, common phrases from song lyrics in the Glottie/Recanta library, providing learners with practical Spanish expressions they can use in everyday conversation.

## Core Features

### 1. Phrase Extraction & Scoring
- **Usefulness Scoring**: Algorithm ranks phrases based on:
  - Word frequency (common vocabulary preferred)
  - Phrase length (2-8 words ideal)
  - Verb patterns (common tenses weighted higher)
  - Practical usage patterns (questions, greetings, expressions)

- **Filtering Criteria**:
  - ✅ Include: Common expressions, questions, greetings, everyday phrases
  - ❌ Exclude: Song-specific lyrics, repetitive choruses, proper nouns, artistic expressions

### 2. Categorization System
Phrases are automatically grouped into logical categories:
- **Greetings & Farewells**: Hola, buenos días, hasta luego
- **Questions**: ¿Cómo estás?, ¿Qué tal?, ¿Dónde está?
- **Emotions & Feelings**: Me siento, estoy feliz, tengo miedo
- **Time & Frequency**: Siempre, nunca, a veces, todos los días
- **Actions & Verbs**: Present tense, past tense, commands
- **Common Expressions**: Idioms and colloquialisms
- **Connectors**: Pero, porque, aunque, sin embargo

### 3. Display & Interaction
- **English-First Display**: Shows translated phrase prominently
- **Spanish on Demand**: Click/tap to reveal original Spanish text
- **Song Context**: Shows source song title and artist
- **Audio Playback**: Direct link to play phrase in song context

### 4. Navigation Flow
```
Phrases Tab → Category List → Phrase Cards → Song Modal → Full Song View
                                    ↓
                            Play from timestamp
```

## Technical Implementation

### Database Schema
```prisma
model Phrase {
  id              String   @id @default(cuid())
  songId          String
  originalText    String   // Spanish phrase
  translatedText  String   // English translation
  lineIndex       Int      // Line number in song
  timestamp       Float?   // Time in song (seconds)
  usefulnessScore Float    // 0-1 score
  category        String   // Category name
  song            Song     @relation(fields: [songId], references: [id])
  createdAt       DateTime @default(now())

  @@index([category])
  @@index([usefulnessScore])
}

model PhraseCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  displayName String   // User-friendly name
  icon        String?  // Icon identifier
  order       Int      // Display order
  createdAt   DateTime @default(now())
}
```

### Usefulness Scoring Algorithm
```typescript
// Scoring factors (0-1 scale)
interface UsefulnessFactors {
  wordFrequency: number     // Average Zipf frequency of words
  phraseLength: number       // Ideal: 3-6 words
  verbComplexity: number     // Simple tenses score higher
  questionPattern: number    // Questions are highly useful
  greetingPattern: number    // Greetings score maximum
  commonExpression: number   // Match against phrase database
}

// Weighted composite score
usefulnessScore =
  0.25 * wordFrequency +
  0.15 * phraseLength +
  0.20 * verbComplexity +
  0.15 * questionPattern +
  0.15 * greetingPattern +
  0.10 * commonExpression
```

### API Endpoints
- `GET /api/phrases` - Fetch phrases with filtering
  - Query params: `category`, `search`, `limit`, `offset`
- `GET /api/phrases/categories` - Get all categories
- `GET /api/phrases/[id]` - Get specific phrase with full context

### Component Structure
```
components/
├── phrases/
│   ├── PhraseCard.tsx       // Individual phrase display
│   ├── PhraseCategoryList.tsx // Category navigation
│   ├── PhraseModal.tsx      // Detailed phrase view
│   └── PhraseSearch.tsx     // Search interface
```

## User Experience Flow

### 1. Phrases Tab View
- Grid/list of category cards with icons
- Search bar at top for cross-category search
- Quick stats: "500+ useful phrases from 100 songs"

### 2. Category View
- List of phrase cards in selected category
- English text prominent, Spanish subtitle muted
- Play button and song reference on each card

### 3. Phrase Interaction
- **Tap phrase card**: Expands to show:
  - Full Spanish text with word-by-word breakdown
  - English translation
  - Song: "Artist - Title"
  - "Play from here" button

### 4. Playback Integration
- Clicking "Play from here":
  - Opens song in player
  - Jumps to phrase timestamp
  - Highlights phrase in lyrics view
  - Continues playback from that point

## Implementation Phases

### Phase 1: Infrastructure (Current)
- [x] Database schema design
- [x] Create documentation
- [ ] Update Prisma schema
- [ ] Run database migration

### Phase 2: Core Algorithm
- [ ] Phrase scoring algorithm
- [ ] Category detection logic
- [ ] Phrase extraction script
- [ ] Database population

### Phase 3: UI Components
- [ ] Tab navigation update
- [ ] Phrases page layout
- [ ] PhraseCard component
- [ ] Category navigation

### Phase 4: Integration
- [ ] API routes
- [ ] Client functions
- [ ] Audio player integration
- [ ] Search functionality

### Phase 5: Polish
- [ ] Loading states
- [ ] Error handling
- [ ] Mobile optimization
- [ ] Performance tuning

## Success Metrics
- **Coverage**: 80%+ of songs have extractable phrases
- **Quality**: 90%+ of displayed phrases are genuinely useful
- **Performance**: < 200ms load time for phrase lists
- **Engagement**: Users interact with 5+ phrases per session

## Future Enhancements
- User-submitted phrases
- Phrase favoriting/saving
- Spaced repetition for phrase learning
- Phrase difficulty levels
- Audio pronunciation guides
- Contextual usage examples

## Notes
- Phrases must maintain 1:1 alignment with song lyrics
- All phrases require both Spanish original and English translation
- Timestamp data essential for playback feature
- Consider caching strategy for frequently accessed phrases
- Mobile-first design with touch interactions