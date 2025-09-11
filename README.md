# Recanta 🎵

> Learn Spanish through the power of music

Recanta is an interactive Spanish learning platform where students learn through song lyrics organized by difficulty levels. The app provides sentence-level translations, word definitions, verb conjugations, and integrated Spotify playback for an immersive learning experience.

## ✨ Features

### 🎯 Core Learning Features
- **10 Difficulty Levels**: Songs automatically scored and categorized from beginner (Level 1) to expert (Level 10)
- **Interactive Lyrics**: Click sentences for instant translations, select words for definitions
- **Verb Conjugations**: Complete conjugation tables for Spanish verbs with all major tenses
- **Spotify Integration**: Listen to songs while learning with direct Spotify links
- **Smart Scoring**: Algorithm considers word frequency, verb tenses, idioms, and grammatical complexity

### 🔧 Technical Features
- **Demo & Live Modes**: Works out-of-the-box with demo content, scales to live APIs
- **Pluggable Adapters**: Easy integration with different lyrics, translation, and dictionary providers
- **Responsive Design**: Mobile-first UI that works beautifully on all devices
- **TypeScript**: Full type safety throughout the application
- **Real-time Analysis**: Morphological analysis and difficulty scoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Optional: API keys for live mode (see [Configuration](#-configuration))

### Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd recanta
npm install

# Set up database
npm run db:push

# Seed with demo data (10 songs)
npm run db:seed

# Start development server
npm run dev
```

Visit `http://localhost:3000` to start learning! 🎉

### Demo Mode vs Live Mode

**Demo Mode** (Default)
- ✅ Works immediately with no setup
- ✅ 10 curated Spanish songs with excerpt lyrics
- ✅ Pre-computed translations and definitions
- ✅ Full UI functionality for testing
- ❌ Limited to short lyric excerpts due to licensing

**Live Mode** (Requires API Keys)
- ✅ Full song discovery via Spotify API
- ✅ Complete lyrics from licensed providers
- ✅ Real-time translation services
- ✅ Expanded dictionary definitions
- ⚠️ Requires proper API credentials and licensing

## 🏗️ Architecture

### Project Structure
```
recanta/
├── app/                    # Next.js 14 App Router
│   ├── levels/[level]/     # Level detail pages
│   ├── song/[id]/          # Individual song pages
│   └── page.tsx            # Homepage with level grid
├── components/             # Reusable React components
│   ├── ui/                 # shadcn/ui components
│   ├── LyricsView.tsx      # Interactive lyrics display
│   ├── WordPopover.tsx     # Word definition popover
│   └── SentenceModal.tsx   # Translation modal
├── lib/                    # Client-side utilities
├── pages/api/              # API routes
│   ├── levels.ts           # Get all levels with songs
│   ├── lyrics/[trackId].ts # Fetch song lyrics
│   ├── score/[trackId].ts  # Compute difficulty
│   ├── translate.ts        # Translate sentences
│   └── define.ts           # Get word definitions
├── packages/
│   ├── core/               # Core algorithms
│   │   ├── scoring.ts      # Difficulty scoring system
│   │   ├── morphology.ts   # Spanish language analysis
│   │   ├── freq-es.json    # Spanish word frequency data
│   │   └── idioms-es.json  # Common Spanish idioms
│   └── adapters/           # External service integrations
│       ├── spotify.ts      # Music discovery
│       ├── lyricsProvider.ts # Lyrics fetching
│       ├── translate.ts    # Translation services
│       └── dictionary.ts   # Definition lookup
├── prisma/                 # Database schema and seed
├── tests/                  # Unit and E2E tests
└── seed_songs.json         # Demo song data
```

### Technology Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: SQLite (dev) / PostgreSQL (prod) with Prisma ORM
- **State Management**: React Query for server state
- **Language Processing**: Compromise.js for tokenization
- **Testing**: Vitest (unit), Playwright (E2E)

## 📊 Difficulty Scoring Algorithm

Recanta uses a sophisticated scoring system to automatically categorize songs by difficulty:

### Scoring Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| **Word Count** | 12% | Total number of words in lyrics |
| **Type-Token Ratio** | 18% | Vocabulary diversity (unique/total words) |
| **Word Frequency** | 22% | Average frequency of words (Zipf scale 1-7) |
| **Verb Density** | 18% | Percentage of words that are verbs |
| **Tense Complexity** | 22% | Weighted difficulty of verb tenses used |
| **Idiom Count** | 4% | Number of idiomatic expressions |
| **Punctuation Complexity** | 4% | Sentence structure complexity |

### Tense Difficulty Weights
- **Presente**: 0.5 (easiest)
- **Pretérito/Imperfecto**: 1.0
- **Futuro**: 0.8
- **Condicional**: 1.1
- **Subjuntivo**: 1.6 (hardest)

### Level Assignment
Final scores (1-10) are calculated using:
```
score = 1 + 9 × sigmoid(weighted_sum_of_factors)
```

Songs are then rounded to the nearest integer level (1-10).

## ⚙️ Configuration

### Environment Variables

Create `.env.local` with your API keys:

```bash
# Spotify API (for song discovery)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Lyrics Provider (optional - defaults to demo)
LYRICS_PROVIDER=demo|musixmatch|genius
MUSIXMATCH_API_KEY=your_musixmatch_key

# Translation Service (optional - defaults to demo)
TRANSLATOR=demo|libretranslate|deepl|google
DEEPL_API_KEY=your_deepl_key
GOOGLE_TRANSLATE_API_KEY=your_google_key
LIBRETRANSLATE_URL=https://libretranslate.com

# Dictionary Service (optional - defaults to demo)
DICTIONARY_PROVIDER=demo|spanish-dict|wordsapi
SPANISH_DICT_API_KEY=your_spanish_dict_key
WORDS_API_KEY=your_words_api_key

# Database
DATABASE_URL="file:./dev.db"
```

### Provider Configuration

#### Spotify Setup
1. Create a Spotify app at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Get your Client ID and Client Secret
3. No redirect URI needed (using Client Credentials flow)

#### Lyrics Providers
- **Demo**: Works out of the box, limited excerpts
- **Musixmatch**: Requires API key, enterprise license needed for full lyrics
- **Genius**: API available but requires web scraping for lyrics (not implemented for legal reasons)

#### Translation Services
- **Demo**: Built-in translations for common phrases
- **LibreTranslate**: Free, self-hostable translation service
- **DeepL**: Premium API with high-quality translations
- **Google Translate**: Google's translation API

## 🧪 Testing

### Unit Tests
```bash
npm test
```

Tests cover:
- Difficulty scoring algorithm
- Spanish morphological analysis
- Verb conjugation generation
- Edge cases and error handling

### E2E Tests
```bash
npm run e2e
```

Tests cover:
- Complete user flows (level navigation, song learning)
- Interactive features (sentence translation, word lookup)
- Responsive design across devices
- Error state handling

## 📝 API Documentation

### Core Endpoints

#### `GET /api/levels`
Returns all 10 levels with their songs and statistics.

```json
{
  "levels": {
    "1": [{"id": "song1", "title": "...", "difficultyScore": 2.1}],
    "2": [...]
  },
  "stats": {
    "totalSongs": 50,
    "averageDifficulty": 5.2,
    "levelDistribution": {"1": 5, "2": 8, ...}
  }
}
```

#### `GET /api/lyrics/[trackId]`
Fetches lyrics for a specific song.

```json
{
  "trackId": "demo_001",
  "title": "Song Title",
  "artist": "Artist Name",
  "lines": ["Line 1", "Line 2"],
  "translations": ["Translation 1", "Translation 2"],
  "licensed": false,
  "provider": "demo"
}
```

#### `POST /api/translate`
Translates Spanish text to English.

```json
{
  "text": "Hola mundo",
  "targetLang": "en"
}
```

#### `POST /api/define`
Gets definitions and conjugations for Spanish words.

```json
{
  "word": "hablar",
  "lang": "es"
}
```

## 🔧 Extending Recanta

### Adding a New Lyrics Provider

1. **Create Provider Class**:
```typescript
// packages/adapters/newProvider.ts
export class NewLyricsProvider implements LyricsProvider {
  async getLyrics(artist: string, title: string): Promise<LyricsResult> {
    // Implementation
  }
}
```

2. **Register Provider**:
```typescript
// packages/adapters/lyricsProvider.ts
if (process.env.NEW_PROVIDER_KEY) {
  providers.set('newprovider', new NewLyricsProvider(process.env.NEW_PROVIDER_KEY))
}
```

3. **Configure Environment**:
```bash
LYRICS_PROVIDER=newprovider
NEW_PROVIDER_KEY=your_api_key
```

### Customizing Difficulty Scoring

Modify weights in `packages/core/scoring.ts`:

```typescript
// Adjust scoring weights
z += 0.25 * norm(verbDensity, BASELINE_STATS.verbDensity)  // Increase verb importance
z += 0.15 * norm(tenseWeights, BASELINE_STATS.tenseWeights) // Decrease tense importance
```

### Adding More Song Sources

The app includes multiple song discovery sources:

1. **Curated Lists** (Built-in): 35+ handpicked Spanish classics and modern hits
2. **Billboard Charts** (Built-in): Top Latin songs from Billboard charts
3. **Spotify API** (Optional): Real-time discovery with client credentials
4. **Last.fm API** (Optional): Country-specific top tracks

**To populate with real songs:**
```bash
npm run db:populate  # Adds ~50 real Spanish songs
```

**Available song sources include:**
- 🎵 Despacito, Macarena, La Vida Es Una Fiesta
- 🎤 Modern reggaeton: Bad Bunny, J Balvin, Karol G
- 🎸 Spanish rock: Héroes del Silencio, Maná, Soda Stereo
- 🎭 Argentine tango: Carlos Gardel classics
- 🌎 Regional Mexican: Traditional mariachi songs

### Adding New Languages

1. Create frequency lists (`packages/core/freq-[lang].json`)
2. Add morphological rules (`packages/core/morphology.ts`)
3. Update idiom detection (`packages/core/idioms-[lang].json`)
4. Configure language detection in adapters

## 🚀 Deployment

### Database Setup
```bash
# Production database (PostgreSQL recommended)
DATABASE_URL="postgresql://username:password@host:port/database"
npm run db:push
npm run db:seed
```

### Environment Configuration
- Set all required API keys in production environment
- Configure CORS for API endpoints if needed
- Set up SSL certificates for HTTPS

### Recommended Hosting
- **Vercel**: Optimal for Next.js applications
- **Railway**: Good for full-stack apps with databases
- **AWS/GCP/Azure**: For enterprise deployments

## 📚 Learning Methodology

Recanta is based on research showing that music enhances language learning through:

1. **Emotional Connection**: Music creates positive associations with the language
2. **Memory Enhancement**: Melodies help retain vocabulary and phrases
3. **Pronunciation Practice**: Songs provide natural rhythm and intonation patterns
4. **Cultural Context**: Learn language within its cultural framework
5. **Repetitive Learning**: Natural repetition through verse and chorus structures

### Pedagogical Features
- **Scaffolded Difficulty**: Progress from simple to complex language structures
- **Multi-modal Learning**: Visual (lyrics), auditory (music), and interactive (clicking) components
- **Contextual Learning**: Words and grammar learned within meaningful contexts
- **Immediate Feedback**: Instant translations and definitions
- **Spaced Repetition**: Return to lower levels to reinforce learning

## 🤝 Contributing

We welcome contributions! Areas where you can help:

- 🎵 **Music Curation**: Suggest high-quality Spanish songs for different levels
- 🔧 **Provider Integrations**: Add support for new lyrics, translation, or dictionary APIs  
- 🌍 **Language Support**: Extend the platform to other languages
- 🧪 **Testing**: Improve test coverage and add edge cases
- 📚 **Documentation**: Enhance setup guides and API docs
- 🎨 **UI/UX**: Improve the learning interface and user experience

## 📄 License & Legal

### Content Licensing
- **Demo Content**: Provided for educational testing purposes only
- **Live Mode**: Requires proper licensing agreements with lyrics providers
- **Music Streaming**: Spotify integration respects Spotify's terms of service
- **Fair Use**: Educational use may qualify for fair use protections (consult legal advice)

### Data Privacy
- No user accounts or personal data collection in current version
- API keys and user preferences stored locally
- Optional: Add user accounts for progress tracking (requires privacy policy)

### Compliance Notes
- Lyrics display requires appropriate licensing
- Translation and definition APIs have usage limits
- Spotify integration requires adherence to Spotify Developer Terms
- Educational use should comply with local copyright laws

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions for questions and ideas
- **Email**: [Contact maintainers] for licensing or partnership inquiries

---

**Happy Learning!** 🎵📚

*Made with ❤️ for Spanish learners worldwide*