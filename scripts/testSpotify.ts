import { config } from 'dotenv'
import { searchTopSpanishSongs } from '../packages/adapters/spotify'

// Load environment variables from .env.local
config({ path: '.env.local' })

async function testSpotifyConnection() {
  console.log('🎵 Testing Spotify API connection...')
  
  // Debug: Check if credentials are loaded
  console.log('🔑 Client ID:', process.env.SPOTIFY_CLIENT_ID ? '✅ Loaded' : '❌ Missing')
  console.log('🔑 Client Secret:', process.env.SPOTIFY_CLIENT_SECRET ? '✅ Loaded' : '❌ Missing')
  
  try {
    // Test the connection by searching for Spanish songs
    console.log('📡 Fetching top Spanish songs from Spotify...')
    
    const songs = await searchTopSpanishSongs(10) // Get 10 songs for testing
    
    if (songs.length === 0) {
      console.log('⚠️  No songs returned. This might indicate:')
      console.log('   - API credentials are incorrect')
      console.log('   - API quota exceeded') 
      console.log('   - Network connectivity issues')
      return
    }
    
    console.log(`✅ Success! Found ${songs.length} Spanish songs:`)
    console.log('')
    
    songs.forEach((song, index) => {
      console.log(`${index + 1}. "${song.name}" by ${song.artists[0].name}`)
      console.log(`   Album: ${song.album.name} (${song.album.release_date})`)
      console.log(`   Spotify URL: ${song.external_urls.spotify}`)
      console.log('')
    })
    
    console.log('🎉 Spotify API is working perfectly!')
    console.log('💡 You can now use live mode to discover thousands of Spanish songs')
    
  } catch (error) {
    console.error('❌ Spotify API test failed:')
    
    if (error instanceof Error) {
      if (error.message.includes('credentials not configured')) {
        console.error('🔑 Please add your Spotify credentials to .env.local:')
        console.error('   SPOTIFY_CLIENT_ID=your_actual_client_id')
        console.error('   SPOTIFY_CLIENT_SECRET=your_actual_client_secret')
      } else if (error.message.includes('token request failed')) {
        console.error('🚫 Invalid credentials. Please check:')
        console.error('   1. Client ID and Secret are correct')
        console.error('   2. App is not in development mode restrictions')
        console.error('   3. Credentials have proper scopes')
      } else {
        console.error('📡 API Error:', error.message)
      }
    } else {
      console.error('Unknown error:', error)
    }
    
    console.log('')
    console.log('🔧 Troubleshooting steps:')
    console.log('1. Verify credentials at: https://developer.spotify.com/dashboard')
    console.log('2. Make sure your app is not in development mode')  
    console.log('3. Check that Client Credentials flow is enabled')
    console.log('4. Try regenerating the Client Secret')
  }
}

testSpotifyConnection()