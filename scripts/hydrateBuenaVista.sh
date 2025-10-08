#!/bin/bash

# Load environment variables
source .env.local

echo "🎵 Starting Buena Vista Social Club songs hydration..."
echo ""

# Array of song IDs to hydrate
SONG_IDS=(
    "cmg6r2to3000011zr7rshgsng"  # Chan Chan (Level 1)
    "cmg6r2to7000111zr7uoa9ngm"  # Dos Gardenias (Level 1)
    "cmg6r2to9000211zrqw4wlxud"  # El Cuarto de Tula (Level 2)
    "cmg6r2toc000311zr26hdzdr8"  # Veinte Años (Level 2)
    "cmg6r2tog000411zrvnsq8b54"  # Candela (Level 3)
    "cmg6r2toh000511zri7oxxsgz"  # De Camino a La Vereda (Level 3)
    "cmg6r2toj000611zr0z8wp7ib"  # Pueblo Nuevo (Level 3)
    "cmg6r2tol000711zr47xb590f"  # El Carretero (Level 4)
    "cmg6r2tom000811zr428o7nnd"  # Orgullecida (Level 4)
    "cmg6r2too000911zr6zd4ub5a"  # La Bayamesa (Level 5)
)

# Counter for progress
TOTAL=${#SONG_IDS[@]}
CURRENT=0
SUCCESS=0
FAILED=0

# Process each song
for SONG_ID in "${SONG_IDS[@]}"; do
    CURRENT=$((CURRENT + 1))
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📀 Processing song $CURRENT of $TOTAL"
    echo "   ID: $SONG_ID"
    echo ""

    # Run the hydration command
    DATABASE_URL="file:./dev.db" \
    SPOTIFY_CLIENT_ID="074c9198ca534a588df3b95c7eaf2e98" \
    SPOTIFY_CLIENT_SECRET="b6911b7446704d61acdb47af4d2c2489" \
    MUSIXMATCH_API_KEY="b6bdee9e895ac0d91209a79a31498440" \
    MUSIXMATCH_FULL_LYRICS="true" \
    TRANSLATOR=openai \
    OPENAI_API_KEY="$OPENAI_API_KEY" \
    npx tsx scripts/songHydration.ts "$SONG_ID"

    # Check if the command was successful
    if [ $? -eq 0 ]; then
        echo "✅ Successfully hydrated song"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "❌ Failed to hydrate song"
        FAILED=$((FAILED + 1))
    fi

    # Add a small delay between requests to avoid rate limiting
    if [ $CURRENT -lt $TOTAL ]; then
        echo ""
        echo "⏱️  Waiting 3 seconds before next song..."
        sleep 3
    fi
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏁 Hydration Complete!"
echo ""
echo "📊 Results:"
echo "   ✅ Success: $SUCCESS songs"
echo "   ❌ Failed: $FAILED songs"
echo "   📝 Total: $TOTAL songs"
echo ""

if [ $SUCCESS -eq $TOTAL ]; then
    echo "🎉 All songs hydrated successfully!"
else
    echo "⚠️  Some songs failed. Please check the logs above."
fi