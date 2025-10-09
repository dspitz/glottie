#!/bin/bash

# Load environment variables
source .env.local

# Song IDs from the script output
SONG_IDS=(
  "cmgive23000004jneljca9mdp"  # Tous les mêmes
  "cmgive23400014jne9grdaw0k"  # Carmen
  "cmgive23600024jnejerjqiri"  # Décollage
  "cmgive23800034jnektchrbn5"  # Désenchantée
  "cmgive23a00044jnel6p0v8hc"  # Avenir
  "cmgive23c00054jnewvgn6o4g"  # Pour un infidèle
  "cmgive23e00064jnev0c297qq"  # Ta reine
  "cmgive23f00074jne7ho4mmj8"  # Quand c'est?
  "cmgive23k00084jneezowzira"  # L'enfer
  "cmgive23m00094jnewtcv4oxq"  # La même
  "cmgive23n000a4jneqzn7mcid"  # La grenade
)

echo "🎵 Starting hydration of French songs levels 3-5..."
echo "=================================================="

for SONG_ID in "${SONG_IDS[@]}"; do
  echo ""
  echo "Hydrating song: $SONG_ID"
  echo "--------------------------------------------------"

  DATABASE_URL="file:./dev.db" \
    SPOTIFY_CLIENT_ID="074c9198ca534a588df3b95c7eaf2e98" \
    SPOTIFY_CLIENT_SECRET="b6911b7446704d61acdb47af4d2c2489" \
    MUSIXMATCH_API_KEY="b6bdee9e895ac0d91209a79a31498440" \
    MUSIXMATCH_FULL_LYRICS="true" \
    TRANSLATOR=openai \
    OPENAI_API_KEY="$OPENAI_API_KEY" \
    npx tsx scripts/songHydration.ts "$SONG_ID" --force

  if [ $? -eq 0 ]; then
    echo "✅ Successfully hydrated: $SONG_ID"
  else
    echo "❌ Failed to hydrate: $SONG_ID"
  fi

  # Add a small delay between requests to avoid rate limiting
  sleep 2
done

echo ""
echo "=================================================="
echo "✨ Hydration complete!"
