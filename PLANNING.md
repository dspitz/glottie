# diddydum Development Planning

## Multi-Language Support Expansion

### Overview
diddydum will expand beyond Spanish to support multiple languages for language learning through music. Each language will have its own curated content library and database.

### Architecture

#### Backend
- **Separate Databases**: Each language will have its own dedicated database with language-specific content
  - Spanish: `spanish.db` (currently `dev.db`)
  - French: `french.db`
  - Italian: `italian.db`
  - German: `german.db`
  - Mandarin: `mandarin.db`
- **Content Libraries**: Each database will contain:
  - Curated songs from artists in that language
  - Difficulty-scored lyrics
  - Translations to user's native language
  - Cultural context and notes

#### Frontend

##### Onboarding Flow
- **Language Selection Screen**: Initial onboarding for new users
  - Welcome message
  - Language selection with visual indicators
  - "Coming Soon" badges for unavailable languages
  - Spanish as the only active option initially

##### Navigation
- **Language Switcher**: Dropdown on homepage/root view
  - Current language display with flag/icon
  - Quick switch between available languages
  - "Coming Soon" indicators for future languages
  - Persisted language preference in localStorage/user profile

### Language Rollout Plan

#### Phase 1: Spanish (Active)
- Fully implemented and available
- Complete song library with difficulty levels 1-5
- Translations to English

#### Phase 2: Core European Languages (Coming Soon)
- **French**: Popular music from France, Quebec, and Francophone Africa
- **Italian**: Classical and contemporary Italian music
- **German**: Music from Germany, Austria, and Switzerland

#### Phase 3: Asian Languages (Coming Soon)
- **Mandarin**: Mandopop and traditional Chinese music
- Consider simplified/traditional character options

### Implementation Considerations

#### Database Management
- Connection switching based on selected language
- Migration scripts for each language database
- Shared schema across all language databases

#### Content Curation
- Language-specific difficulty scoring algorithms
- Native speaker validation for translations
- Cultural sensitivity in song selection

#### UI/UX
- RTL support preparation for future Arabic/Hebrew
- Character rendering for Asian languages
- Responsive design for different text lengths

### Technical Requirements
- Environment variables for each database connection
- API endpoints with language parameter
- Caching strategy per language
- CDN distribution for language-specific assets