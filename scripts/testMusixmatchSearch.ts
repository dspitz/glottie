async function testMusixmatchSearch() {
  // Load environment variables
  if (!process.env.MUSIXMATCH_API_KEY) {
    console.error('❌ MUSIXMATCH_API_KEY not found in environment')
    console.log('   Please ensure .env.local is loaded or set the environment variable')
    process.exit(1)
  }

  const artist = 'KAROL G';
  const title = 'Un Gatito Me Llamó';
  const apiKey = process.env.MUSIXMATCH_API_KEY;

  console.log(`🔑 Using API key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`)

  // Try different search variations
  const searches = [
    { artist: 'KAROL G', title: 'Un Gatito Me Llamó' },
    { artist: 'Karol G', title: 'Un Gatito Me Llamo' },
    { artist: 'KAROL G', title: 'Un Gatito Me Llamo' },
    { artist: 'Karol G', title: 'Un Gatito' },
    { artist: 'Karol', title: 'Gatito' },
  ];

  for (const search of searches) {
    const url = `https://api.musixmatch.com/ws/1.1/track.search?format=json&q_track=${encodeURIComponent(search.title)}&q_artist=${encodeURIComponent(search.artist)}&apikey=${apiKey}`;

    console.log(`\n🔍 Searching: ${search.artist} - ${search.title}`);

    const response = await fetch(url);
    const data = await response.json();

    if (data.message?.body?.track_list?.length > 0) {
      const track = data.message.body.track_list[0].track;
      console.log(`✅ Found: ${track.artist_name} - ${track.track_name}`);
      console.log(`   Track ID: ${track.track_id}`);
      console.log(`   Album: ${track.album_name}`);
      console.log(`   Has lyrics: ${track.has_lyrics === 1 ? 'Yes' : 'No'}`);
      console.log(`   Has subtitles: ${track.has_subtitles === 1 ? 'Yes' : 'No'}`);
      console.log(`   Instrumental: ${track.instrumental === 1 ? 'Yes' : 'No'}`);

      // If we found it, let's get the lyrics
      if (track.has_lyrics === 1) {
        console.log('\n📝 Fetching lyrics...');

        // Try to get lyrics
        const lyricsUrl = `https://api.musixmatch.com/ws/1.1/track.lyrics.get?format=json&track_id=${track.track_id}&apikey=${apiKey}`;
        const lyricsResponse = await fetch(lyricsUrl);
        const lyricsData = await lyricsResponse.json();

        if (lyricsData.message?.body?.lyrics) {
          const lyrics = lyricsData.message.body.lyrics;
          console.log(`✅ Lyrics found!`);
          console.log(`   Language: ${lyrics.lyrics_language}`);
          console.log(`   Explicit: ${lyrics.explicit === 1 ? 'Yes' : 'No'}`);
          console.log(`   Copyright: ${lyrics.lyrics_copyright}`);
          // Don't print the actual lyrics to avoid copyright issues
          console.log(`   Length: ${lyrics.lyrics_body?.length || 0} characters`);
        }

        // Try to get synchronized lyrics
        console.log('\n🎵 Fetching synchronized lyrics...');
        const syncUrl = `https://api.musixmatch.com/ws/1.1/track.subtitle.get?format=json&track_id=${track.track_id}&subtitle_format=lrc&apikey=${apiKey}`;
        const syncResponse = await fetch(syncUrl);
        const syncData = await syncResponse.json();

        if (syncData.message?.body?.subtitle) {
          const subtitle = syncData.message.body.subtitle;
          console.log(`✅ Synchronized lyrics found!`);
          console.log(`   Language: ${subtitle.subtitle_language}`);
          console.log(`   Length: ${subtitle.subtitle_body?.length || 0} characters`);
        } else {
          console.log(`❌ No synchronized lyrics available`);
        }

        return track.track_id;
      }
    } else {
      console.log(`❌ No results`);
    }
  }

  return null;
}

// Run the test
testMusixmatchSearch().then(trackId => {
  if (trackId) {
    console.log(`\n✅ Successfully found track with ID: ${trackId}`);
  } else {
    console.log('\n❌ Could not find track on Musixmatch');
  }
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});