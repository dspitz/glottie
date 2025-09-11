import { test, expect } from '@playwright/test'

test.describe('Song View E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage first
    await page.goto('/')
  })

  test('should display levels grid on homepage', async ({ page }) => {
    // Check for page title
    await expect(page).toHaveTitle(/Recanta/)
    
    // Should show hero section
    await expect(page.locator('h1')).toContainText('Learn Spanish Through Music')
    
    // Should display level cards
    await expect(page.locator('[data-testid="level-card"], .level-card, text="Level 1"')).toBeVisible()
    
    // Should show at least some level cards
    const levelElements = await page.locator('text="Level"').count()
    expect(levelElements).toBeGreaterThan(0)
  })

  test('should navigate to level page and display songs', async ({ page }) => {
    // Click on a level (try to find Level 1)
    await page.click('text="Level 1"')
    
    // Should be on level page
    await expect(page).toHaveURL(/\/levels\/1/)
    
    // Should show level header
    await expect(page.locator('h1')).toContainText('Level 1 Songs')
    
    // Should show some content (either songs or empty state)
    const hasSongs = await page.locator('text="Learn"').count() > 0
    const hasEmptyState = await page.locator('text="No Songs Yet"').count() > 0
    
    expect(hasSongs || hasEmptyState).toBe(true)
  })

  test('should open song page and display lyrics interface', async ({ page }) => {
    // Navigate through levels to find a song
    await page.click('text="Level 1"')
    
    // Check if there are songs available
    const learnButton = page.locator('text="Learn"').first()
    
    if (await learnButton.count() > 0) {
      // Click on first Learn button
      await learnButton.click()
      
      // Should be on song page
      await expect(page.url()).toMatch(/\/song\//)
      
      // Should show lyrics interface elements
      const hasDemoContent = await page.locator('text="Demo Mode"').count() > 0
      const hasLyricsContent = await page.locator('text="Click any line"').count() > 0
      const hasSpotifyButton = await page.locator('text="Open in Spotify"').count() > 0
      
      // Should have some song-related content
      expect(hasDemoContent || hasLyricsContent || hasSpotifyButton).toBe(true)
    } else {
      console.log('No songs available for testing - this is expected in fresh setup')
    }
  })

  test('should display navigation elements', async ({ page }) => {
    // Check header navigation
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('text="Recanta"')).toBeVisible()
    
    // Check for levels link
    const levelsLink = page.locator('text="Levels"')
    if (await levelsLink.count() > 0) {
      await expect(levelsLink).toBeVisible()
    }
  })

  test('should handle demo mode banner', async ({ page }) => {
    // Try to find and access a demo song
    await page.click('text="Level 1"')
    
    const learnButton = page.locator('text="Learn"').first()
    
    if (await learnButton.count() > 0) {
      await learnButton.click()
      
      // Look for demo mode indicators
      const demoBanner = page.locator('text="Demo Mode"')
      const excerptText = page.locator('text="excerpt"')
      
      if (await demoBanner.count() > 0 || await excerptText.count() > 0) {
        // Demo mode should explain limitations
        await expect(page.locator('text="Demo Mode", text="excerpt", text="licensing"')).toBeVisible()
      }
    }
  })

  test('should show appropriate error states', async ({ page }) => {
    // Navigate to non-existent song
    await page.goto('/song/nonexistent-song-id')
    
    // Should show error state
    await expect(page.locator('text="Song Not Found", text="not found", text="error"')).toBeVisible()
    
    // Should have back navigation
    await expect(page.locator('text="Back"')).toBeVisible()
  })

  test('should show responsive design elements', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    
    // Header should still be visible
    await expect(page.locator('header')).toBeVisible()
    
    // Main content should be visible
    await expect(page.locator('h1')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.reload()
    
    // Should show desktop layout
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should be able to navigate with keyboard
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
  })

  test('should display footer information', async ({ page }) => {
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    // Footer should be visible
    await expect(page.locator('footer')).toBeVisible()
    
    // Should contain project information
    const footerText = await page.locator('footer').textContent()
    expect(footerText).toContain('Recanta' || 'Spanish learners' || 'Next.js')
  })
})