#!/bin/bash

# Load environment variables
source .env.local

# Songs that need hydration in Level 1
SONG_IDS=(
  "cmfm3ztx100088mv35z8flyzi"  # Burbujas de Amor
  "cmfm3ztwz00068mv33x93idcb"  # Bésame Mucho
  "cmfm3ztwv00038mv3v20n7gaa"  # Colgando en tus manos
  "cmfm3ztx7000d8mv312g34aba"  # Color Esperanza
  "cmfm3ztx3000a8mv3scc1qe2h"  # Corazón Partío
  "cmfm3ztwx00058mv36cgbt1wx"  # Eres Tú
  "cmfm3ztwq00008mv3palj7g00"  # La Bamba
  "cmfm3ztwu00028mv3zavdddvn"  # La Camisa Negra
  "cmfm3ztxd000j8mv36pi3gqn9"  # La Vida es un Carnaval
  "cmfm3ztx7000e8mv3fq5tiktm"  # Limón y Sal
  "cmfm3ztx8000f8mv3maetjuk4"  # Me Enamora
  "cmfm3ztx4000b8mv34jhnvhl9"  # Vente Pa' Ca
  "cmfm3ztwt00018mv3p8miwo2e"  # Vivir Mi Vida
)

echo "Starting Level 1 songs hydration..."
echo "=================================="

for SONG_ID in "${SONG_IDS[@]}"
do
  echo ""
  echo "Hydrating song: $SONG_ID"
  DATABASE_URL="file:./dev.db" \
    SPOTIFY_CLIENT_ID="074c9198ca534a588df3b95c7eaf2e98" \
    SPOTIFY_CLIENT_SECRET="b6911b7446704d61acdb47af4d2c2489" \
    MUSIXMATCH_API_KEY="b6bdee9e895ac0d91209a79a31498440" \
    MUSIXMATCH_FULL_LYRICS="true" \
    TRANSLATOR=openai \
    OPENAI_API_KEY="$OPENAI_API_KEY" \
    npx tsx scripts/songHydration.ts "$SONG_ID" --force

  # Add a small delay between requests to avoid rate limiting
  sleep 2
done

echo ""
echo "=================================="
echo "Level 1 hydration complete!"
echo ""
echo "Running verification..."
DATABASE_URL="file:./dev.db" npx tsx scripts/checkLevel1Songs.ts