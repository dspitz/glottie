import { prisma } from '../lib/prisma'

async function checkLevel1() {
  const songs = await prisma.song.findMany({
    where: { level: 1 },
    include: { translations: true },
    orderBy: { title: 'asc' }
  });

  console.log('Level 1 Songs Status:');
  console.log('='.repeat(80));

  const results: any[] = [];

  songs.forEach(song => {
    const hasJsonLyrics = song.lyricsRaw?.startsWith('{');
    const hasTranslations = song.translations.length > 0;
    const hasEnglishTrans = song.translations.some(t => t.targetLang === 'en');
    const isReady = song.hasLyrics && hasJsonLyrics && song.synced && hasEnglishTrans;

    console.log('');
    console.log(song.title + ' by ' + song.artist);
    console.log('  ID: ' + song.id);
    console.log('  Has Lyrics: ' + (song.hasLyrics ? '✅' : '❌'));
    console.log('  JSON Format: ' + (hasJsonLyrics ? '✅' : '❌'));
    console.log('  Synced: ' + (song.synced ? '✅' : '❌'));
    console.log('  Provider: ' + (song.lyricsProvider || 'None'));
    console.log('  Has Translations: ' + (hasTranslations ? '✅' : '❌'));
    console.log('  English: ' + (hasEnglishTrans ? '✅' : '❌'));
    console.log('  Status: ' + (isReady ? '✅ READY' : '⚠️ NEEDS HYDRATION'));

    results.push({
      id: song.id,
      title: song.title,
      artist: song.artist,
      needsHydration: !isReady
    });
  });

  const needsWork = results.filter(r => r.needsHydration);

  console.log('');
  console.log('='.repeat(80));
  console.log(`Summary: ${songs.length} total songs, ${needsWork.length} need hydration`);

  if (needsWork.length > 0) {
    console.log('\nSongs needing hydration:');
    needsWork.forEach(s => console.log(`  - ${s.id}: ${s.title} by ${s.artist}`));
    return needsWork;
  }

  return [];
}

checkLevel1().then((needsWork) => {
  if (needsWork.length > 0) {
    console.log('\nTo hydrate these songs, run:');
    console.log('source .env.local');
    needsWork.forEach(s => {
      console.log(`DATABASE_URL="file:./dev.db" SPOTIFY_CLIENT_ID="074c9198ca534a588df3b95c7eaf2e98" SPOTIFY_CLIENT_SECRET="b6911b7446704d61acdb47af4d2c2489" MUSIXMATCH_API_KEY="b6bdee9e895ac0d91209a79a31498440" MUSIXMATCH_FULL_LYRICS="true" TRANSLATOR=openai OPENAI_API_KEY="$OPENAI_API_KEY" npx tsx scripts/songHydration.ts ${s.id} --force`);
    });
  }
  prisma.$disconnect();
});