import { test, expect, Page } from '@playwright/test'

/**
 * Song Reveal Transition Animation Tests
 *
 * Tests the blur-to-clear transition animation when revealing a song:
 * - Cover image transitions from blurred/scaled to clear
 * - Title and artist text animate in with fade/slide
 * - Smooth transitions without jarring effects
 * - Respects prefers-reduced-motion setting
 *
 * Issue 16.16 - Test song reveal transition animations
 *
 * Acceptance criteria:
 * - Transition blur fluide
 * - Texte anime progressivement
 * - Pas de flash/saut
 */

// Helper function to start a game and get to the reveal state
async function setupGameForReveal(page: Page) {
  // Navigate to solo config page
  await page.goto('/solo')
  await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
    timeout: 30000,
  })
  await page.waitForLoadState('networkidle')

  // Start the game
  await page.click('button:has-text("Nouvelle Partie")')
  await page.waitForURL('/game*')

  // Wait for buzzer to appear (indicates PLAYING state)
  const buzzer = page.getByRole('button', { name: 'BUZZ!' })
  await expect(buzzer).toBeVisible({ timeout: 45000 })

  // Click buzzer to enter timer state
  await buzzer.click()

  // Wait for validation buttons to appear
  await expect(
    page.getByRole('button', { name: 'Correct', exact: true })
  ).toBeVisible({
    timeout: 2000,
  })
}

// Helper to trigger reveal transition
async function triggerReveal(page: Page) {
  // Click correct or incorrect to trigger reveal
  const correctButton = page.getByRole('button', {
    name: 'Correct',
    exact: true,
  })
  await correctButton.click()

  // Wait for reveal state - "Chanson suivante" button indicates reveal
  await expect(
    page.getByRole('button', { name: 'Chanson suivante' })
  ).toBeVisible({
    timeout: 3000,
  })
}

test.describe('Song Reveal - Cover Blur-to-Clear Transition', () => {
  test.beforeEach(async ({ page }) => {
    // Enable animations for these tests
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  })

  test('cover image starts with blur effect before reveal', async ({
    page,
  }) => {
    await setupGameForReveal(page)

    // Before clicking validation, get cover image state
    // The cover should be blurred with blur-xl and scale-110 classes
    const coverImage = page.locator('img[alt="Pochette album"]')
    await expect(coverImage).toBeVisible()

    // Check blur classes are applied
    await expect(coverImage).toHaveClass(/blur-xl/)
    await expect(coverImage).toHaveClass(/scale-110/)
  })

  test('cover image removes blur effect after reveal', async ({ page }) => {
    await setupGameForReveal(page)
    await triggerReveal(page)

    // Wait for transition to complete (500ms duration)
    await page.waitForTimeout(600)

    // After reveal, cover should no longer have blur classes
    const coverImage = page.locator('img[alt="Pochette album"]')
    await expect(coverImage).toBeVisible()

    // Blur classes should be removed
    await expect(coverImage).not.toHaveClass(/blur-xl/)
    await expect(coverImage).not.toHaveClass(/scale-110/)
  })

  test('cover has transition-all duration-500 for smooth animation', async ({
    page,
  }) => {
    await setupGameForReveal(page)

    const coverImage = page.locator('img[alt="Pochette album"]')
    await expect(coverImage).toBeVisible()

    // Check transition classes are present
    await expect(coverImage).toHaveClass(/transition-all/)
    await expect(coverImage).toHaveClass(/duration-500/)
  })

  test('blur transition visual - before reveal screenshot', async ({
    page,
  }) => {
    await setupGameForReveal(page)

    // Capture the blurred state
    await expect(page).toHaveScreenshot('reveal-cover-blurred.png', {
      fullPage: true,
    })
  })

  test('blur transition visual - after reveal screenshot', async ({ page }) => {
    await setupGameForReveal(page)
    await triggerReveal(page)

    // Wait for transition to complete
    await page.waitForTimeout(700)

    // Capture the clear state
    await expect(page).toHaveScreenshot('reveal-cover-clear.png', {
      fullPage: true,
    })
  })

  test('music note icon visible when blurred, hidden when revealed', async ({
    page,
  }) => {
    await setupGameForReveal(page)

    // Music note icon should be visible before reveal
    // Uses MusicalNoteIcon from Heroicons (rendered as svg)
    const musicIconContainer = page.locator('.absolute.inset-0 svg')
    await expect(musicIconContainer).toBeVisible()

    // Trigger reveal
    await triggerReveal(page)
    await page.waitForTimeout(600)

    // Music note icon should be hidden after reveal
    await expect(musicIconContainer).not.toBeVisible()
  })
})

test.describe('Song Reveal - Text Animation', () => {
  test.beforeEach(async ({ page }) => {
    // Enable animations for these tests
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  })

  test('song info is hidden before reveal', async ({ page }) => {
    await setupGameForReveal(page)

    // Before reveal, title and artist should not be visible
    // They only appear when isRevealed is true
    const infoContainer = page.locator('.animate-fade-in')
    await expect(infoContainer).not.toBeVisible()
  })

  test('song title appears with fade-in animation after reveal', async ({
    page,
  }) => {
    await setupGameForReveal(page)
    await triggerReveal(page)

    // Title should be visible with fade-in animation
    const title = page.locator('h2')
    await expect(title).toBeVisible()

    // Check it's inside animate-fade-in container
    const infoContainer = page.locator('.animate-fade-in')
    await expect(infoContainer).toBeVisible()
  })

  test('song artist appears with fade-in animation after reveal', async ({
    page,
  }) => {
    await setupGameForReveal(page)
    await triggerReveal(page)

    // Artist should be visible (text-purple-200 styling)
    const artist = page.locator('.text-purple-200')
    await expect(artist).toBeVisible()
  })

  test('album info appears after reveal if available', async ({ page }) => {
    await setupGameForReveal(page)
    await triggerReveal(page)

    // Album text uses text-purple-400 styling
    const album = page.locator('.text-purple-400')
    // Album may or may not be present depending on the song
    // Just verify no errors occur
    await expect(album.or(page.locator('h2'))).toBeVisible()
  })

  test('info container has animate-fade-in class', async ({ page }) => {
    await setupGameForReveal(page)
    await triggerReveal(page)

    // Wait a moment for animation to start
    await page.waitForTimeout(100)

    // Info container should have the fade-in animation class
    const infoContainer = page.locator('.animate-fade-in')
    await expect(infoContainer).toBeVisible()
    await expect(infoContainer).toHaveClass(/animate-fade-in/)
  })

  test('fade-in animation properties are correct', async ({ page }) => {
    await setupGameForReveal(page)
    await triggerReveal(page)

    // Get the computed animation properties
    const infoContainer = page.locator('.animate-fade-in')
    await expect(infoContainer).toBeVisible()

    // Check that animation is applied
    const animationName = await infoContainer.evaluate((el) => {
      return window.getComputedStyle(el).animationName
    })

    // Animation name should be fade-in (or auto if animations disabled)
    expect(animationName).toBeTruthy()
    expect(animationName).not.toBe('none')
  })
})

test.describe('Song Reveal - No Flash/Jump Effects', () => {
  test.beforeEach(async ({ page }) => {
    // Enable animations for these tests
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  })

  test('transition does not cause layout shift', async ({ page }) => {
    await setupGameForReveal(page)

    // Get position of cover container before reveal
    const coverContainer = page.locator('.relative.overflow-hidden').first()
    await expect(coverContainer).toBeVisible()

    const initialBox = await coverContainer.boundingBox()
    expect(initialBox).not.toBeNull()

    // Trigger reveal
    await triggerReveal(page)
    await page.waitForTimeout(600)

    // Get position after reveal
    const finalBox = await coverContainer.boundingBox()
    expect(finalBox).not.toBeNull()

    // Position and size should remain stable
    expect(Math.abs(initialBox!.x - finalBox!.x)).toBeLessThan(5)
    expect(Math.abs(initialBox!.y - finalBox!.y)).toBeLessThan(5)
    expect(Math.abs(initialBox!.width - finalBox!.width)).toBeLessThan(5)
    expect(Math.abs(initialBox!.height - finalBox!.height)).toBeLessThan(5)
  })

  test('no abrupt opacity changes during transition', async ({ page }) => {
    await setupGameForReveal(page)

    const coverImage = page.locator('img[alt="Pochette album"]')
    await expect(coverImage).toBeVisible()

    // Get initial opacity
    const initialOpacity = await coverImage.evaluate((el) => {
      return window.getComputedStyle(el).opacity
    })

    // Trigger reveal
    await triggerReveal(page)

    // Check opacity during transition (should be 1, not 0 or flickering)
    await page.waitForTimeout(250) // Mid-transition
    const midOpacity = await coverImage.evaluate((el) => {
      return window.getComputedStyle(el).opacity
    })

    await page.waitForTimeout(350) // After transition
    const finalOpacity = await coverImage.evaluate((el) => {
      return window.getComputedStyle(el).opacity
    })

    // All opacities should be 1 (fully visible)
    expect(parseFloat(initialOpacity)).toBe(1)
    expect(parseFloat(midOpacity)).toBe(1)
    expect(parseFloat(finalOpacity)).toBe(1)
  })

  test('cover scales down smoothly (110% to 100%)', async ({ page }) => {
    await setupGameForReveal(page)

    const coverImage = page.locator('img[alt="Pochette album"]')
    await expect(coverImage).toBeVisible()

    // Before reveal: scale should be 1.1 (110%)
    const initialTransform = await coverImage.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // Extract scale from matrix - scale-110 = 1.1
    if (initialTransform !== 'none') {
      const scaleMatch = initialTransform.match(
        /matrix\(([^,]+),.*?,.*?,([^,]+)/
      )
      if (scaleMatch) {
        const scaleX = parseFloat(scaleMatch[1])
        // Should be around 1.1 (scaled up)
        expect(scaleX).toBeGreaterThanOrEqual(1.05)
      }
    }

    // Trigger reveal
    await triggerReveal(page)
    await page.waitForTimeout(600)

    // After reveal: scale should be 1 (100%)
    const finalTransform = await coverImage.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // Scale should be 1 or 'none' (no transform)
    if (finalTransform !== 'none') {
      const scaleMatch = finalTransform.match(/matrix\(([^,]+),.*?,.*?,([^,]+)/)
      if (scaleMatch) {
        const scaleX = parseFloat(scaleMatch[1])
        // Should be around 1 (normal scale)
        expect(scaleX).toBeGreaterThanOrEqual(0.99)
        expect(scaleX).toBeLessThanOrEqual(1.01)
      }
    }
  })

  test('blur filter transitions smoothly', async ({ page }) => {
    await setupGameForReveal(page)

    const coverImage = page.locator('img[alt="Pochette album"]')

    // Before reveal: should have blur filter
    const initialFilter = await coverImage.evaluate((el) => {
      return window.getComputedStyle(el).filter
    })

    // blur-xl class applies blur(24px)
    expect(initialFilter).toContain('blur')

    // Trigger reveal
    await triggerReveal(page)
    await page.waitForTimeout(600)

    // After reveal: blur should be removed
    const finalFilter = await coverImage.evaluate((el) => {
      return window.getComputedStyle(el).filter
    })

    // Should be 'none' or 'blur(0px)'
    expect(
      finalFilter === 'none' ||
        finalFilter === 'blur(0px)' ||
        !finalFilter.includes('blur')
    ).toBe(true)
  })
})

test.describe('Song Reveal - Reduced Motion Support', () => {
  test.beforeEach(async ({ page }) => {
    // Enable reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('blur removal is instant with reduced motion', async ({ page }) => {
    await setupGameForReveal(page)

    // Record timing of reveal
    const startTime = Date.now()
    await triggerReveal(page)

    // With reduced motion, transition should be nearly instant (0.01ms)
    // Check that blur is removed immediately
    const coverImage = page.locator('img[alt="Pochette album"]')

    // Small wait for state change
    await page.waitForTimeout(50)

    // Blur should already be removed
    await expect(coverImage).not.toHaveClass(/blur-xl/)

    const elapsed = Date.now() - startTime
    // Should be much faster than normal 500ms transition
    expect(elapsed).toBeLessThan(200)
  })

  test('fade-in animation is instant with reduced motion', async ({ page }) => {
    await setupGameForReveal(page)
    await triggerReveal(page)

    // With reduced motion, animation duration is 0.01ms
    // Text should appear immediately
    await page.waitForTimeout(50)

    const infoContainer = page.locator('.animate-fade-in')
    await expect(infoContainer).toBeVisible()

    // Check computed animation duration
    const animationDuration = await infoContainer.evaluate((el) => {
      return window.getComputedStyle(el).animationDuration
    })

    // Should be very short (0.01ms or similar)
    const durationMs = parseFloat(animationDuration)
    expect(durationMs).toBeLessThanOrEqual(0.1)
  })

  test('song info still displays correctly with reduced motion', async ({
    page,
  }) => {
    await setupGameForReveal(page)
    await triggerReveal(page)

    // Even with reduced motion, content should be visible and correct
    const title = page.locator('h2')
    await expect(title).toBeVisible()

    const artist = page.locator('.text-purple-200')
    await expect(artist).toBeVisible()
  })

  test('reduced motion screenshot after reveal', async ({ page }) => {
    await setupGameForReveal(page)
    await triggerReveal(page)
    await page.waitForTimeout(100)

    await expect(page).toHaveScreenshot('reveal-reduced-motion.png', {
      fullPage: true,
    })
  })
})

test.describe('Song Reveal - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Enable animations
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  })

  test('full reveal transition sequence', async ({ page }) => {
    await setupGameForReveal(page)

    // Screenshot 1: Before reveal (blurred state with music icon)
    await expect(page).toHaveScreenshot('reveal-sequence-1-blurred.png', {
      fullPage: true,
    })

    // Trigger reveal
    await triggerReveal(page)

    // Screenshot 2: Mid-transition (partial blur removal)
    await page.waitForTimeout(250)
    await expect(page).toHaveScreenshot('reveal-sequence-2-mid.png', {
      fullPage: true,
    })

    // Screenshot 3: After reveal (clear with info)
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot('reveal-sequence-3-complete.png', {
      fullPage: true,
    })
  })

  test('reveal state with song information visible', async ({ page }) => {
    await setupGameForReveal(page)
    await triggerReveal(page)

    // Wait for all animations to complete
    await page.waitForTimeout(700)

    // Final state screenshot
    await expect(page).toHaveScreenshot('reveal-final-state.png', {
      fullPage: true,
    })
  })
})

test.describe('Song Reveal - Animation Timing', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  })

  test('cover transition duration is approximately 500ms', async ({ page }) => {
    await setupGameForReveal(page)

    const coverImage = page.locator('img[alt="Pochette album"]')

    // Check transition duration
    const transitionDuration = await coverImage.evaluate((el) => {
      return window.getComputedStyle(el).transitionDuration
    })

    // Should be 0.5s or 500ms
    expect(transitionDuration).toBe('0.5s')
  })

  test('text fade-in duration is approximately 500ms', async ({ page }) => {
    await setupGameForReveal(page)
    await triggerReveal(page)

    const infoContainer = page.locator('.animate-fade-in')
    await expect(infoContainer).toBeVisible()

    // Check animation duration from CSS
    const animationDuration = await infoContainer.evaluate((el) => {
      return window.getComputedStyle(el).animationDuration
    })

    // Should be 0.5s (from .animate-fade-in class)
    expect(animationDuration).toBe('0.5s')
  })

  test('animations complete within reasonable time', async ({ page }) => {
    await setupGameForReveal(page)

    const startTime = Date.now()
    await triggerReveal(page)

    // Wait for animations to complete
    await page.waitForTimeout(700)

    // Verify cover is now clear
    const coverImage = page.locator('img[alt="Pochette album"]')
    await expect(coverImage).not.toHaveClass(/blur-xl/)

    // Verify text is visible
    const title = page.locator('h2')
    await expect(title).toBeVisible()

    const elapsed = Date.now() - startTime
    // Total time should be around 700-1000ms (animation + state change)
    expect(elapsed).toBeLessThan(2000)
  })
})

test.describe('Song Reveal - Integration with Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  })

  test('reveal animation plays after correct answer', async ({ page }) => {
    await setupGameForReveal(page)

    // Verify blurred before
    const coverImage = page.locator('img[alt="Pochette album"]')
    await expect(coverImage).toHaveClass(/blur-xl/)

    // Click correct
    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await correctButton.click()

    // Wait for reveal animation
    await page.waitForTimeout(700)

    // Verify revealed
    await expect(coverImage).not.toHaveClass(/blur-xl/)

    // Score should be visible in header
    const scoreDisplay = page.locator('[data-testid="score-display"]')
    // Score may have updated
    await expect(scoreDisplay).toBeVisible()
  })

  test('reveal animation plays after incorrect answer', async ({ page }) => {
    await setupGameForReveal(page)

    // Verify blurred before
    const coverImage = page.locator('img[alt="Pochette album"]')
    await expect(coverImage).toHaveClass(/blur-xl/)

    // Click incorrect
    const incorrectButton = page.getByRole('button', {
      name: 'Incorrect',
      exact: true,
    })
    await incorrectButton.click()

    // Wait for reveal animation
    await page.waitForTimeout(700)

    // Verify revealed
    await expect(coverImage).not.toHaveClass(/blur-xl/)
  })

  test('can proceed to next song after reveal animation', async ({ page }) => {
    await setupGameForReveal(page)
    await triggerReveal(page)

    // Wait for reveal to complete
    await page.waitForTimeout(700)

    // Click next song
    const nextButton = page.getByRole('button', { name: 'Chanson suivante' })
    await expect(nextButton).toBeVisible()
    await nextButton.click()

    // New song should load with blurred cover again
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzer).toBeVisible({ timeout: 45000 })

    // New cover should be blurred
    const coverImage = page.locator('img[alt="Pochette album"]')
    await expect(coverImage).toHaveClass(/blur-xl/)
  })

  test('reveal does not interfere with UI interactions', async ({ page }) => {
    await setupGameForReveal(page)
    await triggerReveal(page)

    // During and after reveal animation, buttons should be clickable
    const nextButton = page.getByRole('button', { name: 'Chanson suivante' })
    await expect(nextButton).toBeVisible({ timeout: 3000 })

    // Can click even while animation may still be running
    await nextButton.click()

    // Should successfully navigate
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzer).toBeVisible({ timeout: 45000 })
  })
})
