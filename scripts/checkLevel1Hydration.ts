#!/usr/bin/env tsx

import { prisma } from '../lib/prisma';

async function checkLevel1Hydration() {
  const songs = await prisma.song.findMany({
    where: { level: 1 },
    select: {
      id: true,
      title: true,
      artist: true,
      lyricsRaw: true,
      songSummary: true,
      translations: {
        where: { targetLang: 'en' },
        select: { id: true }
      }
    },
    orderBy: { title: 'asc' }
  });

  console.log('Level 1 Songs Status:');
  console.log('='.repeat(50));

  let needsLyrics = 0;
  let needsTranslations = 0;
  let needsSummary = 0;
  let fullyHydrated = 0;
  const songsToHydrate = [];

  for (const song of songs) {
    const hasLyrics = Boolean(song.lyricsRaw);
    const hasTranslations = song.translations.length > 0;
    const hasSummary = Boolean(song.songSummary);

    if (!hasLyrics) needsLyrics++;
    if (!hasTranslations) needsTranslations++;
    if (!hasSummary) needsSummary++;

    if (hasLyrics && hasTranslations && hasSummary) {
      fullyHydrated++;
    } else {
      console.log(`${song.title} - ${song.artist}`);
      console.log(`  ID: ${song.id}`);
      console.log(`  Status: Lyrics: ${hasLyrics ? '✓' : '✗'} | Translations: ${hasTranslations ? '✓' : '✗'} | Summary: ${hasSummary ? '✓' : '✗'}`);

      // Add to list for hydration
      if (!hasLyrics || !hasTranslations) {
        songsToHydrate.push(song.id);
      }
    }
  }

  console.log('');
  console.log('Summary:');
  console.log(`Total Level 1 songs: ${songs.length}`);
  console.log(`Fully hydrated: ${fullyHydrated}`);
  console.log(`Needs lyrics: ${needsLyrics}`);
  console.log(`Needs translations: ${needsTranslations}`);
  console.log(`Needs summary: ${needsSummary}`);

  if (songsToHydrate.length > 0) {
    console.log('\nSongs needing full hydration (lyrics + translations):');
    songsToHydrate.forEach(id => console.log(`  ${id}`));
  }

  await prisma.$disconnect();

  return { songsToHydrate, needsSummary };
}

checkLevel1Hydration().then(result => {
  if (result.songsToHydrate.length > 0) {
    console.log('\n' + '='.repeat(50));
    console.log('To hydrate these songs, run:');
    result.songsToHydrate.forEach(id => {
      console.log(`DATABASE_URL="file:./dev.db" SPOTIFY_CLIENT_ID="074c9198ca534a588df3b95c7eaf2e98" SPOTIFY_CLIENT_SECRET="b6911b7446704d61acdb47af4d2c2489" MUSIXMATCH_API_KEY="b6bdee9e895ac0d91209a79a31498440" MUSIXMATCH_FULL_LYRICS="true" TRANSLATOR=openai OPENAI_API_KEY="$OPENAI_API_KEY" npx tsx scripts/songHydration.ts ${id} --force`);
    });
  }
});