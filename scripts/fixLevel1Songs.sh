#!/bin/bash

# Load environment variables
source .env.local

echo "Fixing 4 Level 1 songs that need re-hydration..."
echo "=============================================="

# Fix Burbujas de Amor (missing sync flag)
echo ""
echo "1/4: Fixing Burbujas de Amor..."
DATABASE_URL="file:./dev.db" npx tsx -e "
import { prisma } from './lib/prisma';
async function fix() {
  await prisma.song.update({
    where: { id: 'cmfm3ztx100088mv35z8flyzi' },
    data: { synced: true }
  });
  console.log('✅ Fixed sync flag for Burbujas de Amor');
}
fix().then(() => prisma.\$disconnect());
"

# Fix Colgando en tus manos (missing sync flag)
echo ""
echo "2/4: Fixing Colgando en tus manos..."
DATABASE_URL="file:./dev.db" npx tsx -e "
import { prisma } from './lib/prisma';
async function fix() {
  await prisma.song.update({
    where: { id: 'cmfm3ztwv00038mv3v20n7gaa' },
    data: { synced: true }
  });
  console.log('✅ Fixed sync flag for Colgando en tus manos');
}
fix().then(() => prisma.\$disconnect());
"

# Re-hydrate Eres Tú (couldn't find on Musixmatch, needs full re-hydration)
echo ""
echo "3/4: Re-hydrating Eres Tú..."
DATABASE_URL="file:./dev.db" \
  SPOTIFY_CLIENT_ID="074c9198ca534a588df3b95c7eaf2e98" \
  SPOTIFY_CLIENT_SECRET="b6911b7446704d61acdb47af4d2c2489" \
  MUSIXMATCH_API_KEY="b6bdee9e895ac0d91209a79a31498440" \
  MUSIXMATCH_FULL_LYRICS="true" \
  TRANSLATOR=openai \
  OPENAI_API_KEY="$OPENAI_API_KEY" \
  npx tsx scripts/songHydration.ts cmfm3ztwx00058mv36cgbt1wx --force

# Fix La Bamba (has lyrics but flag is false)
echo ""
echo "4/4: Fixing La Bamba..."
DATABASE_URL="file:./dev.db" \
  SPOTIFY_CLIENT_ID="074c9198ca534a588df3b95c7eaf2e98" \
  SPOTIFY_CLIENT_SECRET="b6911b7446704d61acdb47af4d2c2489" \
  MUSIXMATCH_API_KEY="b6bdee9e895ac0d91209a79a31498440" \
  MUSIXMATCH_FULL_LYRICS="true" \
  TRANSLATOR=openai \
  OPENAI_API_KEY="$OPENAI_API_KEY" \
  npx tsx scripts/songHydration.ts cmfm3ztwq00008mv3palj7g00 --force

echo ""
echo "=============================================="
echo "Verification:"
DATABASE_URL="file:./dev.db" npx tsx scripts/checkLevel1Songs.ts | grep "Progress:"