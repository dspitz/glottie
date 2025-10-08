import SpotifyWebApi from 'spotify-web-api-node'

const spotifyApi = new SpotifyWebApi({
  clientId: '074c9198ca534a588df3b95c7eaf2e98',
  clientSecret: 'b6911b7446704d61acdb47af4d2c2489'
})

const songsToSearch = [
  "Chan Chan",
  "Dos Gardenias",
  "El Cuarto de Tula",
  "Veinte Años",
  "Candela",
  "De Camino a La Vereda",
  "Pueblo Nuevo",
  "El Carretero",
  "Orgullecida",
  "La Bayamesa"
]

async function searchForSongs() {
  try {
    // Get access token
    const data = await spotifyApi.clientCredentialsGrant()
    const accessToken = data.body['access_token']
    spotifyApi.setAccessToken(accessToken)

    console.log('🎵 Searching for Buena Vista Social Club songs on Spotify...\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    for (const songTitle of songsToSearch) {
      console.log(`\n🔍 Searching for: "${songTitle}"`)

      try {
        // Search for the track
        const searchResults = await spotifyApi.searchTracks(
          `track:"${songTitle}" artist:"Buena Vista Social Club"`,
          { limit: 5 }
        )

        if (searchResults.body.tracks?.items.length === 0) {
          // Try a broader search
          const broaderSearch = await spotifyApi.searchTracks(
            `${songTitle} Buena Vista Social Club`,
            { limit: 5 }
          )

          if (broaderSearch.body.tracks?.items.length > 0) {
            console.log('  Found with broader search:')
            broaderSearch.body.tracks.items.slice(0, 3).forEach(track => {
              console.log(`    - "${track.name}" by ${track.artists.map(a => a.name).join(', ')}`)
              console.log(`      Album: ${track.album.name}`)
              console.log(`      Spotify ID: ${track.id}`)
              console.log(`      URL: ${track.external_urls.spotify}`)
              console.log(`      Popularity: ${track.popularity}`)
            })
          } else {
            console.log('  ❌ No results found')
          }
        } else {
          console.log('  ✅ Found exact match:')
          const track = searchResults.body.tracks.items[0]
          console.log(`    Title: "${track.name}"`)
          console.log(`    Artists: ${track.artists.map(a => a.name).join(', ')}`)
          console.log(`    Album: ${track.album.name}`)
          console.log(`    Spotify ID: ${track.id}`)
          console.log(`    URL: ${track.external_urls.spotify}`)
          console.log(`    Preview: ${track.preview_url ? 'Available' : 'Not available'}`)
          console.log(`    Popularity: ${track.popularity}`)

          // Show additional results if any
          if (searchResults.body.tracks.items.length > 1) {
            console.log('\n  Other versions found:')
            searchResults.body.tracks.items.slice(1, 3).forEach(track => {
              console.log(`    - "${track.name}" (${track.album.name}) - ID: ${track.id}`)
            })
          }
        }

      } catch (error) {
        console.error(`  Error searching: ${error}`)
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Search complete!')

  } catch (error) {
    console.error('Error:', error)
  }
}

searchForSongs()