import { config } from 'dotenv'
import { getLyricsByTrack, getAvailableProviders, isProviderConfigured } from '../packages/adapters/lyricsProvider'

// Load environment variables
config({ path: '.env.local' })

async function testLyricsIntegration() {
  console.log('🎵 Testing Lyrics Integration System...')
  console.log('')
  
  // Show available providers
  const providers = getAvailableProviders()
  console.log(`🔌 Available providers: ${providers.join(', ')}`)
  console.log('')
  
  // Show provider configuration status
  providers.forEach(provider => {
    const isConfigured = isProviderConfigured(provider)
    const status = isConfigured ? '✅ Configured' : '❌ Not configured'
    console.log(`   ${provider}: ${status}`)
  })
  
  console.log('')
  
  // Test with a few sample artists/songs
  const testSongs = [
    { artist: 'Bad Bunny', title: 'Tití Me Preguntó' },
    { artist: 'Rosalía', title: 'Con Altura' },
    { artist: 'Luis Fonsi', title: 'Despacito' },
    { artist: 'Manu Chao', title: 'Me Gustas Tu' }
  ]
  
  console.log('🔍 Testing lyrics fetching with sample songs...')
  console.log('')
  
  for (const [index, song] of testSongs.entries()) {
    try {
      console.log(`${index + 1}. Testing "${song.title}" by ${song.artist}`)
      
      const result = await getLyricsByTrack(song.artist, song.title)
      
      console.log(`   Provider: ${result.provider}`)
      console.log(`   Licensed: ${result.licensed ? '✅' : '❌'}`)
      console.log(`   Is Excerpt: ${result.isExcerpt ? '✅' : '❌'}`)
      console.log(`   Lines Found: ${result.lines.length}`)
      
      if (result.attribution) {
        console.log(`   Attribution: ${result.attribution}`)
      }
      
      if (result.culturalContext) {
        console.log(`   Cultural Context: ${result.culturalContext}`)
      }
      
      if (result.error) {
        console.log(`   ⚠️  Error: ${result.error}`)
      } else if (result.lines.length > 0) {
        console.log(`   Sample lines:`)
        result.lines.slice(0, 3).forEach((line, i) => {
          console.log(`     ${i + 1}. "${line}"`)
        })
      }
      
      console.log('')
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.error(`   ❌ Failed to test "${song.title}":`, error)
      console.log('')
    }
  }
  
  console.log('📋 Integration Test Summary:')
  console.log('')
  
  // Show current environment configuration
  console.log('⚙️  Current Configuration:')
  console.log(`   LYRICS_PROVIDER: ${process.env.LYRICS_PROVIDER || 'Not set'}`)
  console.log(`   FAIR_USE_MODE: ${process.env.FAIR_USE_MODE || 'Not set'}`)
  console.log(`   MAX_EXCERPT_LINES: ${process.env.MAX_EXCERPT_LINES || 'Not set'}`)
  console.log(`   ATTRIBUTION_REQUIRED: ${process.env.ATTRIBUTION_REQUIRED || 'Not set'}`)
  console.log('')
  
  console.log('💡 Next Steps:')
  if (!process.env.MUSIXMATCH_API_KEY) {
    console.log('   1. Get Musixmatch API key from developer.musixmatch.com')
    console.log('   2. Add MUSIXMATCH_API_KEY to .env.local')
    console.log('   3. Change LYRICS_PROVIDER=musixmatch')
  } else {
    console.log('   1. ✅ Musixmatch API configured')
    console.log('   2. Run real lyrics analysis on database songs')
  }
  
  console.log('   4. Test with larger song database')
  console.log('   5. Implement lyrics caching for performance')
  
  console.log('')
  console.log('✨ Lyrics integration test complete!')
}

testLyricsIntegration()
  .catch(console.error)
  .finally(() => process.exit())