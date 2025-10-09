#!/bin/bash

# Load environment variables from .env.local (contains OPENAI_API_KEY)
if [ -f .env.local ]; then
  source .env.local
else
  echo "❌ .env.local not found!"
  exit 1
fi

# API credentials from CLAUDE.md
SPOTIFY_CLIENT_ID="074c9198ca534a588df3b95c7eaf2e98"
SPOTIFY_CLIENT_SECRET="b6911b7446704d61acdb47af4d2c2489"
MUSIXMATCH_API_KEY="b6bdee9e895ac0d91209a79a31498440"

# Verify OpenAI API key is loaded
if [ -z "$OPENAI_API_KEY" ]; then
  echo "❌ OPENAI_API_KEY not found in .env.local!"
  exit 1
fi

echo "🎵 Starting comprehensive French song hydration..."
echo "=================================================="
echo "Using API keys from CLAUDE.md and .env.local"
echo ""

# All song IDs that need hydration
SONG_IDS=(
  "cmgibjmik0006le3rl0utadti"  # Formidable - Stromae (Level 2)
  "cmgibjmil0007le3r4ijtsuhu"  # Je veux - Zaz (Level 2)
  "cmgibjmim0008le3rivyqs3dg"  # Tout oublier - Angèle (Level 2)
  "cmgibjmin0009le3rxtsj4gcd"  # L'amour existe encore - Céline Dion (Level 2)
  "cmgivqc7200002az19mnlhom8"  # On ira - Zaz (Level 2)
  "cmgibjmio000ale3ro68enqxt"  # Alors on danse - Stromae (Level 3)
  "cmgibjmip000ble3ryem7meku"  # Balance ton quoi - Angèle (Level 3)
  "cmgivqc7500012az1rlcgdv00"  # Comme des enfants - Cœur de pirate (Level 3)
  "cmgivqc7800022az10lx5y5tr"  # Je l'aime à mourir - Francis Cabrel (Level 4)
  "cmgivqc7900032az1el3ya7l1"  # L'aventurier - Indochine (Level 4)
  "cmgivqc7b00042az1kxk25578"  # L'enfer - Stromae (Level 5)
  "cmgivqc7d00052az1ye91mrze"  # Djadja - Aya Nakamura (Level 5)
)

SUCCESS_COUNT=0
FAIL_COUNT=0

for SONG_ID in "${SONG_IDS[@]}"; do
  echo ""
  echo "Hydrating: $SONG_ID"
  echo "--------------------------------------------------"

  DATABASE_URL="file:./dev.db" \
    SPOTIFY_CLIENT_ID="$SPOTIFY_CLIENT_ID" \
    SPOTIFY_CLIENT_SECRET="$SPOTIFY_CLIENT_SECRET" \
    MUSIXMATCH_API_KEY="$MUSIXMATCH_API_KEY" \
    MUSIXMATCH_FULL_LYRICS="true" \
    TRANSLATOR=openai \
    OPENAI_API_KEY="$OPENAI_API_KEY" \
    npx tsx scripts/songHydration.ts "$SONG_ID" --force

  if [ $? -eq 0 ]; then
    echo "✅ Successfully hydrated: $SONG_ID"
    ((SUCCESS_COUNT++))
  else
    echo "❌ Failed to hydrate: $SONG_ID"
    ((FAIL_COUNT++))
  fi

  # Add a small delay between requests to avoid rate limiting
  sleep 3
done

echo ""
echo "=================================================="
echo "✨ Hydration complete!"
echo "   ✅ Success: $SUCCESS_COUNT"
echo "   ❌ Failed: $FAIL_COUNT"
echo "   📊 Total: ${#SONG_IDS[@]}"
