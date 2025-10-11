# Claude Code Guide for Recanta/Glottie

## Project Overview
Recanta (also known as Glottie) is an interactive Spanish learning platform where students learn through song lyrics organized by difficulty levels. The app provides sentence-level translations, word definitions, verb conjugations, and integrated Spotify playback.

## Color System

### Flood Color
The **Flood Color** is the primary background color for each language:
- **Spanish (es)**: `#F77373` - rgba(247, 115, 115)
- **French (fr)**: `#F79F73` - rgba(247, 159, 115)

Usage: `getFloodColor(language, alpha?)`

### Secondary Color
The **Secondary Color** is derived from the Flood Color using:
- **210° hue rotation** (for blue shift from orange/red base)
- **60% saturation**
- **33% lightness**

This produces:
- **Spanish red** → **Dark teal**
- **French orange** → **Dark blue**

Usage: `getSecondaryColor(language, alpha?)`

Both functions are available in `/lib/languageUtils.ts`

## Quick Commands

### Development
```bash
# Start development server
npm run dev

# Start with HTTPS (for Spotify SDK)
npm run dev:https
```

### Database Operations
```bash
# Push schema changes
DATABASE_URL="file:./dev.db" npx prisma db push

# Seed with demo data
DATABASE_URL="file:./dev.db" npm run db:seed

# Migrate to real data
DATABASE_URL="file:./dev.db" npm run db:migrate

# Populate with real songs
DATABASE_URL="file:./dev.db" npm run db:populate
```

### Song Hydration & Translation
```bash
# IMPORTANT: Load the actual OpenAI API key from .env.local
source .env.local

# Hydrate a specific song with lyrics and translations (COMPLETE COMMAND)
DATABASE_URL="file:./dev.db" \
  SPOTIFY_CLIENT_ID="074c9198ca534a588df3b95c7eaf2e98" \
  SPOTIFY_CLIENT_SECRET="b6911b7446704d61acdb47af4d2c2489" \
  MUSIXMATCH_API_KEY="b6bdee9e895ac0d91209a79a31498440" \
  MUSIXMATCH_FULL_LYRICS="true" \
  TRANSLATOR=openai \
  OPENAI_API_KEY="$OPENAI_API_KEY" \
  npx tsx scripts/songHydration.ts [songId]

# Force re-hydration (overwrites existing data)
DATABASE_URL="file:./dev.db" \
  SPOTIFY_CLIENT_ID="074c9198ca534a588df3b95c7eaf2e98" \
  SPOTIFY_CLIENT_SECRET="b6911b7446704d61acdb47af4d2c2489" \
  MUSIXMATCH_API_KEY="b6bdee9e895ac0d91209a79a31498440" \
  MUSIXMATCH_FULL_LYRICS="true" \
  TRANSLATOR=openai \
  OPENAI_API_KEY="$OPENAI_API_KEY" \
  npx tsx scripts/songHydration.ts [songId] --force

# Test OpenAI translation
DATABASE_URL="file:./dev.db" OPENAI_API_KEY="$OPENAI_API_KEY" TRANSLATOR=openai npx tsx scripts/testOpenAITranslation.ts

# Translate a specific song
DATABASE_URL="file:./dev.db" TRANSLATOR=openai OPENAI_API_KEY="$OPENAI_API_KEY" npx tsx scripts/translateSingleSong.ts [songId]
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: SQLite (dev) with Prisma ORM
- **State**: React Query for server state
- **APIs**: Spotify, Musixmatch, OpenAI/DeepL for translations

### Key Directories
```
glottie/
├── app/                    # Next.js App Router pages
│   ├── levels/[level]/     # Level detail pages
│   ├── song/[id]/          # Individual song pages
│   └── api/                # API routes
├── components/             # React components
│   ├── LyricsView.tsx      # Main lyrics display with translations
│   ├── EnhancedAudioPlayer.tsx # Spotify Web SDK player
│   └── SynchronizedLyrics.tsx  # Time-synced lyrics display
├── packages/
│   ├── core/               # Core algorithms
│   │   ├── scoring.ts      # Difficulty scoring (1-10 levels)
│   │   └── morphology.ts   # Spanish language analysis
│   └── adapters/           # External service integrations
│       ├── spotify.ts      # Spotify API integration
│       ├── lyricsProvider.ts # Lyrics fetching (Musixmatch/Genius)
│       └── translate.ts    # Translation services (OpenAI/DeepL)
├── prisma/
│   └── schema.prisma       # Database schema
└── scripts/                # Data management scripts
    ├── songHydration.ts    # Fetch lyrics & translations
    └── manual-translations/ # Fallback translations
```

## Important Context

### API Keys & Environment
The `.env.local` file contains:
- **Spotify**: Client ID/Secret for music metadata and playback
- **Musixmatch**: PAID API key for full synchronized lyrics (100% complete songs with timestamps)
- **OpenAI**: GPT-3.5-turbo for translations (currently active)
- **DeepL**: Alternative translation service (free tier: 500k chars/month)

### Complete Song Hydration Process

#### Step 1: Spotify Integration
Fetches from Spotify API:
- **Song ID**: Unique Spotify track identifier
- **Metadata**: Title, artist, album, duration, popularity
- **Artwork**: Album cover URL (high resolution)
- **Preview URL**: 30-second preview clip
- **External URLs**: Direct Spotify links for playback
- **Audio Features**: Tempo, key, energy, danceability

#### Step 2: Musixmatch Lyrics (PAID SERVICE)
Fetches complete song lyrics with:
- **Full Lyrics**: 100% of song content (not excerpts)
- **Line-by-line Timestamps**: Precise timing for each line (NO estimated times)
- **Synchronized Data**: Exact millisecond timing for karaoke-style display
- **Structure**: Verse/chorus markers when available

**IMPORTANT: Smart Track Selection**
Musixmatch often returns multiple versions of the same song (different recordings, remasters, live versions). The hydration system now intelligently prioritizes:
1. **First Priority**: Tracks with synchronized subtitles (`has_subtitles: 1`)
2. **Second Priority**: Tracks with regular lyrics (`has_lyrics: 1`)
3. **Fallback**: First result if no lyrics available

This ensures we get the best possible lyrics data for each song automatically.

#### Step 3: OpenAI Translation
Processes each line individually:
- **Line-by-line Translation**: Maintains 1:1 alignment with original
- **Context Preservation**: Considers song context for idioms
- **Empty Line Handling**: Preserves structure and spacing
- **Artist Name Preservation**: Doesn't translate proper nouns

#### Step 4: Visual Processing
Extracts from album artwork:
- **Dominant Colors**: Uses fast-average-color library
- **Color Palette**: 3-5 main colors for UI theming
- **Contrast Ratios**: Ensures text readability
- **Stored in Database**: Colors saved as hex values

#### Step 5: Database Storage
Final data structure in database:
```typescript
{
  // From Spotify
  id: string,
  spotifyId: string,
  title: string,
  artist: string,
  album: string,
  albumArt: string,
  previewUrl: string,
  spotifyUrl: string,
  duration: number,

  // From Musixmatch (PAID)
  lyricsRaw: JSON.stringify({
    lines: string[],           // Full lyrics array
    synchronized: {
      lines: Array<{
        text: string,
        time: number           // Precise timestamp (not estimated)
      }>
    }
  }),

  // From OpenAI
  translations: {
    targetLang: 'en',
    lyricsLines: string[],     // Aligned 1:1 with original
    provider: 'openai',
    confidence: number
  },

  // From Color Extraction
  dominantColor: string,       // Hex color
  colorPalette: string[],      // Array of hex colors

  // Computed
  difficultyScore: number,     // 1-10 based on linguistic complexity
  difficultyLevel: number      // Rounded score for categorization
}

### Critical Implementation Details

#### Lyrics Storage Format
Lyrics MUST be stored as JSON to preserve synchronization:
```typescript
// Correct format in lyricsRaw field
{
  "lines": ["Line 1", "Line 2"],
  "synchronized": {
    "lines": [
      {"text": "Line 1", "time": 5.2},
      {"text": "Line 2", "time": 8.7}
    ]
  }
}
```

#### Translation Alignment
Translations must maintain 1:1 line correspondence:
- Empty lines stay empty
- Artist names don't get translated
- Use line-by-line translation (not batch) for perfect alignment

#### Z-Index Layers
- Modals: z-50
- Mini-player: z-[60] (stays above modals)
- Popovers: z-40

### Common Issues & Solutions

1. **Timing Issues in Lyrics**
   - Cause: Lyrics stored as plain text instead of JSON
   - Fix: Ensure `songHydration.ts` stores synchronized data as JSON

2. **Translation Misalignment**
   - Cause: Batch translation can shuffle lines
   - Fix: Use line-by-line translation with proper error handling

3. **Translations Showing Original Spanish Text**
   - Cause: OpenAI translator not registered due to missing API key
   - Symptoms: Console shows "Translator 'openai' not found, falling back to demo"
   - Fix: Always run `source .env.local` before hydration to load API keys
   - Verify: Check that translations are in English, not Spanish

4. **API Rate Limits**
   - Musixmatch (PAID): Higher limits based on subscription tier
   - DeepL Free: 500k characters/month
   - OpenAI: Based on tier (RPM varies by plan)
   - Solution: Implement caching and batch where appropriate

5. **403 Errors from DeepL**
   - Wrong endpoint (Pro vs Free)
   - Quota exceeded
   - Fix: Always use free endpoint, monitor usage

6. **Musixmatch "Track Not Found" Errors**
   - Cause: Invalid `callback=callback` parameter in API URLs
   - Fix: Remove callback parameter from all Musixmatch API calls
   - Verify: Check lyricsProvider.ts lines 434, 465, 501

7. **Musixmatch Returns Wrong Track Without Lyrics**
   - **Cause**: Search returns multiple versions, first result doesn't have synchronized lyrics
   - **Symptoms**: Hydration completes but shows "Has lyrics: No, Has subtitles: No"
   - **Solution**: The lyricsProvider now automatically prioritizes tracks with `has_subtitles: 1`
   - **How it works**:
     - Searches all matching tracks from Musixmatch
     - First tries to find track with synchronized subtitles
     - Falls back to track with regular lyrics
     - Only uses first result if no lyrics available
   - **Location**: `/packages/adapters/lyricsProvider.ts` (lines 476-516)
   - **Example**: For "Frère Jacques" by Raffi, search returned track 100710269 (no lyrics) first, but correctly selects track 57737473 (with synced lyrics) instead

### Testing Songs
Well-hydrated songs for testing:
- Bailando (Level 2): `cmfc13ihq000k1n25tdfuw5c9`
- La Camisa Negra (Level 1): `cmfc13igk000g1n255n70s0b0`
- Burbujas de Amor (Level 1): `cmfm3ztx100088mv35z8flyzi`
- Wavin' Flag (Level 3): `cmfmziuj30000g1k50azzfxmb`

## Development Workflow

### Adding New Songs
1. Use Spotify API to get metadata
2. Fetch lyrics from Musixmatch
3. Translate line-by-line with OpenAI
4. Store in database with proper JSON structure
5. Test synchronization in UI

### Modifying Translation Provider
1. Update `TRANSLATOR` in `.env.local`
2. Ensure API key is set
3. Test with `testOpenAITranslation.ts`
4. Run hydration on specific songs

### UI Component Updates
- Always test z-index changes with modals open
- Verify mobile responsiveness
- Check synchronization timing accuracy

## Helpful Patterns

### Running Scripts with Environment
```bash
# Pattern for all database scripts
DATABASE_URL="file:./dev.db" [ENV_VARS] npx tsx scripts/[script].ts

# Example with multiple env vars
DATABASE_URL="file:./dev.db" \
  TRANSLATOR=openai \
  OPENAI_API_KEY="$OPENAI_API_KEY" \
  npx tsx scripts/songHydration.ts
```

### Debugging Translations
```typescript
// Check what's stored in database
const song = await prisma.song.findUnique({ where: { id: songId } })
console.log('Lyrics type:', typeof song.lyricsRaw)
console.log('First 100 chars:', song.lyricsRaw?.substring(0, 100))

// Verify translation alignment
const lyrics = JSON.parse(song.lyricsRaw)
const translation = await prisma.translation.findFirst({ 
  where: { songId, targetLang: 'en' } 
})
const translatedLines = JSON.parse(translation.lyricsLines)
console.log('Line count match:', lyrics.lines.length === translatedLines.length)
```

## Notes for Future Development

1. **Scaling Considerations**
   - Current SQLite database works for <10k songs
   - Consider PostgreSQL for production
   - Implement Redis caching for translations

2. **Legal Compliance**
   - Musixmatch PAID service provides 100% lyrics with proper licensing
   - API key must have appropriate subscription level for full lyrics
   - Translations are AI-generated (no additional licensing needed)

3. **Performance Optimizations**
   - Batch similar translations to reduce API calls
   - Cache Spotify tokens (1 hour expiry)
   - Preload next/previous songs in levels

4. **Feature Roadmap**
   - User accounts with progress tracking
   - Spaced repetition for vocabulary
   - Pronunciation practice with audio recording
   - Community translations and corrections

## Troubleshooting Checklist

- [ ] Is `DATABASE_URL` set correctly?
- [ ] Are all required API keys in `.env.local`?
- [ ] Is the dev server running on correct port (3000)?
- [ ] Are lyrics stored as JSON (not plain text)?
- [ ] Do translation line counts match lyrics?
- [ ] Is the translation provider configured correctly?
- [ ] Are API rate limits being respected?
- [ ] Is the mini-player z-index higher than modals?

## Contact & Resources

- **Spotify Dashboard**: https://developer.spotify.com/dashboard
- **Musixmatch Docs**: https://developer.musixmatch.com/documentation
- **OpenAI Platform**: https://platform.openai.com
- **DeepL API**: https://www.deepl.com/docs-api

---

*Last updated: Context from recent hydration and translation system improvements*