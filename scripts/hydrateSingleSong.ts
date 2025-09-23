#!/usr/bin/env tsx

import { prisma } from '../lib/prisma';

async function checkSong() {
  const songId = 'cmfm3ztx200098mv3dmuhrsx0';

  const song = await prisma.song.findUnique({
    where: { id: songId },
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
    }
  });

  console.log('Song details for ID:', songId);
  console.log('==================================');
  console.log('Title:', song?.title || 'NOT FOUND');
  console.log('Artist:', song?.artist || 'NOT FOUND');
  console.log('Has lyrics:', !!song?.lyricsRaw);
  console.log('Has translations:', song?.translations?.length > 0);
  console.log('Summary:', song?.songSummary || 'NO SUMMARY');

  if (song && !song.lyricsRaw) {
    console.log('\n⚠️ This song needs hydration!');
    console.log('\nRun this command to hydrate it:');
    console.log(`DATABASE_URL="file:./dev.db" SPOTIFY_CLIENT_ID="074c9198ca534a588df3b95c7eaf2e98" SPOTIFY_CLIENT_SECRET="b6911b7446704d61acdb47af4d2c2489" MUSIXMATCH_API_KEY="b6bdee9e895ac0d91209a79a31498440" MUSIXMATCH_FULL_LYRICS="true" TRANSLATOR=openai OPENAI_API_KEY="$OPENAI_API_KEY" npx tsx scripts/songHydration.ts ${songId} --force`);
  }

  await prisma.$disconnect();
}

checkSong();