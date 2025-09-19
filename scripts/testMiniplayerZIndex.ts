import { chromium } from 'playwright'
import { prisma } from '../lib/prisma'

async function testMiniplayerZIndex() {
  console.log('🎭 Starting miniplayer z-index visual test...')

  // Get a song with lyrics to test
  const song = await prisma.song.findFirst({
    where: {
      lyricsRaw: { not: null }
    }
  })

  if (!song) {
    console.error('❌ No song with lyrics found')
    await prisma.$disconnect()
    return
  }

  console.log(`📝 Testing with song: ${song.title} by ${song.artist}`)
  console.log(`🔗 Song ID: ${song.id}`)

  // Launch browser
  const browser = await chromium.launch({
    headless: false, // Show the browser for visual inspection
    slowMo: 500 // Slow down actions for visibility
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  })

  const page = await context.newPage()

  try {
    // Navigate to the song page
    await page.goto(`http://localhost:3000/song/${song.id}`)

    console.log('⏳ Waiting for page to load...')
    await page.waitForLoadState('networkidle')

    // Wait for lyrics to appear
    await page.waitForSelector('.lyrics-line', { timeout: 10000 })
    console.log('✅ Lyrics loaded')

    // Find and click the play button to show miniplayer
    const playButton = await page.locator('button:has-text("Play"), button[aria-label*="play"]').first()
    if (await playButton.isVisible()) {
      await playButton.click()
      console.log('▶️ Clicked play button')

      // Wait for miniplayer to appear
      await page.waitForSelector('.fixed.bottom-0', { state: 'visible', timeout: 5000 })
      console.log('✅ Miniplayer appeared')
    }

    // Take screenshot of miniplayer alone
    await page.screenshot({
      path: 'test-screenshots/1-miniplayer-only.png',
      fullPage: false
    })
    console.log('📸 Screenshot 1: Miniplayer only')

    // Click on a lyric line to open translation modal
    const firstLyricLine = await page.locator('.lyrics-line').first()
    await firstLyricLine.click()
    console.log('👆 Clicked on lyric line')

    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5000 })
    console.log('✅ Translation modal opened')

    // Take screenshot showing both miniplayer and modal
    await page.screenshot({
      path: 'test-screenshots/2-miniplayer-and-modal.png',
      fullPage: false
    })
    console.log('📸 Screenshot 2: Miniplayer + Modal')

    // Check z-index values programmatically
    const miniplayerElement = await page.locator('.fixed.bottom-0').first()
    const modalElement = await page.locator('[role="dialog"]').first()

    const miniplayerZIndex = await miniplayerElement.evaluate(el => {
      return window.getComputedStyle(el).zIndex
    })

    const modalZIndex = await modalElement.evaluate(el => {
      return window.getComputedStyle(el).zIndex
    })

    console.log('\n🔍 Z-Index Values:')
    console.log(`   Miniplayer: ${miniplayerZIndex}`)
    console.log(`   Modal: ${modalZIndex}`)

    // Check if miniplayer is visible above modal
    const isMiniplayerVisible = await miniplayerElement.isVisible()
    console.log(`\n✨ Miniplayer visibility: ${isMiniplayerVisible ? '✅ Visible' : '❌ Hidden'}`)

    if (miniplayerZIndex && modalZIndex) {
      const miniplayerZ = parseInt(miniplayerZIndex) || 0
      const modalZ = parseInt(modalZIndex) || 0

      if (miniplayerZ > modalZ) {
        console.log('✅ SUCCESS: Miniplayer z-index is higher than modal!')
      } else {
        console.log('❌ ISSUE: Modal z-index is higher or equal to miniplayer')
      }
    }

    // Keep browser open for manual inspection
    console.log('\n👀 Browser will stay open for 10 seconds for manual inspection...')
    await page.waitForTimeout(10000)

  } catch (error) {
    console.error('❌ Error during test:', error)
    await page.screenshot({
      path: 'test-screenshots/error-state.png',
      fullPage: true
    })
  } finally {
    await browser.close()
    await prisma.$disconnect()
    console.log('\n🏁 Test complete!')
  }
}

// Create screenshots directory if it doesn't exist
import { mkdirSync } from 'fs'
try {
  mkdirSync('test-screenshots', { recursive: true })
} catch {}

// Run the test
testMiniplayerZIndex().catch(console.error)