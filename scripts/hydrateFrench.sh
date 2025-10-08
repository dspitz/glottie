#!/bin/bash

# Load environment variables from .env.local
set -a
source .env.local
set +a

# Hydrate all French Level 1 songs
echo "Hydrating French Level 1 songs..."

# Song IDs
SONGS=(
  "cmgibjmi70000le3r5f72m00d"  # La Vie en Rose
  "cmgibjmic0001le3ru8zc6vzf"  # Aux Champs-Élysées
  "cmgibjmih0004le3rr234sx0r"  # La Foule
)

for SONG_ID in "${SONGS[@]}"; do
  echo ""
  echo "Processing song: $SONG_ID"
  DATABASE_URL="file:./dev.db" npx tsx scripts/songHydration.ts "$SONG_ID" --force
done

echo ""
echo "Done!"
