# Song Hydration Checklist

## Pre-Hydration Check
1. **Verify Spotify Track Has Preview URL**
   ```bash
   # Check if preview URL exists
   curl -H "Authorization: Bearer $TOKEN" \
     "https://api.spotify.com/v1/tracks/{SPOTIFY_ID}" \
     | jq '.preview_url'
   ```
   - If null, sync won't work in demo mode
   - Consider finding alternative tracks with previews

## Hydration Process

### Step 1: Fetch Spotify Metadata
- Album art
- Preview URL (critical for sync)
- Duration
- Popularity

### Step 2: Fetch Lyrics from Musixmatch
- Ensure MUSIXMATCH_FULL_LYRICS=true
- Verify synchronized data is included
- Check format is 'lrc' with timing

### Step 3: Translate with OpenAI
- Use proper API key (not $OPENAI_API_KEY variable)
- Verify translations are in target language
- Maintain line-by-line alignment

### Step 4: Verify Everything Works
```bash
# Check API response
curl http://localhost:3000/api/lyrics/{SONG_ID} | jq '{
  has_preview: .previewUrl != null,
  has_sync: .synchronized != null,
  has_translations: .translations.en != null,
  sync_lines: .synchronized.lines | length,
  translation_lines: .translations.en | length
}'
```

## Common Issues & Fixes

### No Preview URL
- **Impact**: Sync won't work without Spotify login
- **Solutions**:
  1. Find alternative version with preview
  2. Add notice to users about Spotify requirement
  3. Consider YouTube/SoundCloud integration

### Translation Not Working
- **Issue**: OPENAI_API_KEY not loaded properly
- **Fix**: Run scripts directly with npx tsx (loads .env.local)
- **Verify**: First line shouldn't match original

### Sync Not Displaying
- **Check**:
  1. Preview URL exists
  2. Synchronized data in response
  3. User has audio permission
  4. Player mode isn't 'unavailable'

## Testing Checklist
- [ ] Preview URL available or Spotify authenticated
- [ ] Lyrics display correctly
- [ ] Language toggle shows proper translations
- [ ] Sync highlights lines when playing
- [ ] Feedback buttons reflect actual state

## Scripts

### Full Hydration
```bash
DATABASE_URL="file:./prisma/dev.db" \
MUSIXMATCH_FULL_LYRICS=true \
SPOTIFY_CLIENT_ID="..." \
SPOTIFY_CLIENT_SECRET="..." \
npx tsx scripts/songHydration.ts {SONG_ID}
```

### Fix Translations
```bash
DATABASE_URL="file:./prisma/dev.db" \
npx tsx scripts/translateBonitoProper.ts
```

### Update Preview URL
```bash
DATABASE_URL="file:./prisma/dev.db" \
SPOTIFY_CLIENT_ID="..." \
SPOTIFY_CLIENT_SECRET="..." \
npx tsx scripts/updatePreviewUrl.ts {SONG_ID}
```