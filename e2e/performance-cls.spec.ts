import { test, expect } from '@playwright/test'

/**
 * Cumulative Layout Shift (CLS) Performance Tests
 *
 * These tests measure CLS on main pages to ensure visual stability.
 * Good CLS score: < 0.1
 * Needs Improvement: 0.1 - 0.25
 * Poor: > 0.25
 *
 * Run with:
 *   npx playwright test e2e/performance-cls.spec.ts
 */

// Helper function to measure CLS using PerformanceObserver
async function measureCLS(
  page: import('@playwright/test').Page,
  waitTimeMs: number = 3000
): Promise<number> {
  return page.evaluate((waitTime) => {
    return new Promise<number>((resolve) => {
      let clsValue = 0
      let sessionValue = 0
      let sessionEntries: PerformanceEntry[] = []

      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          // Only count layout shifts without recent user input
          const layoutShiftEntry = entry as PerformanceEntry & {
            hadRecentInput: boolean
            value: number
          }
          if (!layoutShiftEntry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0] as
              | (PerformanceEntry & { value: number })
              | undefined
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1]

            // If the entry occurred less than 1 second after the previous entry
            // and less than 5 seconds after the first entry in the session,
            // include it in the current session. Otherwise, start a new session.
            if (
              sessionValue &&
              entry.startTime - (lastSessionEntry?.startTime ?? 0) < 1000 &&
              entry.startTime - (firstSessionEntry?.startTime ?? 0) < 5000
            ) {
              sessionValue += layoutShiftEntry.value
              sessionEntries.push(entry)
            } else {
              sessionValue = layoutShiftEntry.value
              sessionEntries = [entry]
            }

            // Update max CLS if current session is larger
            if (sessionValue > clsValue) {
              clsValue = sessionValue
            }
          }
        }
      })

      observer.observe({ type: 'layout-shift', buffered: true })

      // Wait for specified time to collect layout shifts
      setTimeout(() => {
        observer.disconnect()
        resolve(clsValue)
      }, waitTime)
    })
  }, waitTimeMs)
}

test.describe('Cumulative Layout Shift (CLS)', () => {
  // Run only on chromium as PerformanceObserver behavior may vary
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only')

  test('play selection page has minimal CLS', async ({ page }) => {
    // Navigate to play page
    await page.goto('/play')

    // Wait for page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Measure CLS over 3 seconds
    const cls = await measureCLS(page, 3000)

    // Log the CLS value for debugging
    console.log(`Play page CLS: ${cls}`)

    // CLS should be less than 0.1 (Good score)
    expect(cls).toBeLessThan(0.1)
  })

  test('solo config page has minimal CLS', async ({ page }) => {
    // Navigate to solo config page
    await page.goto('/solo')

    // Wait for page to be fully loaded
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Measure CLS over 3 seconds
    const cls = await measureCLS(page, 3000)

    // Log the CLS value for debugging
    console.log(`Solo config page CLS: ${cls}`)

    // CLS should be less than 0.1 (Good score)
    expect(cls).toBeLessThan(0.1)
  })

  test('game screen has minimal CLS during loading', async ({ page }) => {
    // Navigate to solo config first
    await page.goto('/solo')

    // Wait for config page to load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.click('button:has-text("Nouvelle Partie")')

    // Wait for game page URL
    await page.waitForURL('/game*')

    // Start measuring CLS immediately after navigation
    const cls = await measureCLS(page, 5000)

    // Log the CLS value for debugging
    console.log(`Game screen CLS during loading: ${cls}`)

    // CLS should be less than 0.1 (Good score)
    // Slightly higher tolerance for game screen due to dynamic content
    expect(cls).toBeLessThan(0.1)
  })

  test('game screen has minimal CLS during gameplay', async ({ page }) => {
    // Navigate to solo config first
    await page.goto('/solo')

    // Wait for config page to load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.click('button:has-text("Nouvelle Partie")')

    // Wait for game page to fully load and buzzer to appear
    await page.waitForURL('/game*')
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible({ timeout: 45000 })

    // Measure CLS during playing state
    const cls = await measureCLS(page, 3000)

    // Log the CLS value for debugging
    console.log(`Game screen CLS during gameplay: ${cls}`)

    // CLS should be less than 0.1 (Good score)
    expect(cls).toBeLessThan(0.1)
  })

  test('game screen has minimal CLS during state transitions', async ({
    page,
  }) => {
    // Navigate to solo config first
    await page.goto('/solo')

    // Wait for config page to load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.click('button:has-text("Nouvelle Partie")')

    // Wait for game page to fully load and buzzer to appear
    await page.waitForURL('/game*')
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible({ timeout: 45000 })

    // Start measuring CLS
    const clsPromise = measureCLS(page, 5000)

    // Perform state transitions while measuring
    // Transition: PLAYING -> TIMER (via buzzer)
    await buzzerButton.click()

    // Wait for timer state
    await expect(page.getByRole('button', { name: 'Correct' })).toBeVisible({
      timeout: 10000,
    })

    // Transition: TIMER -> REVEAL (via validation)
    await page.getByRole('button', { name: 'Correct' }).click()

    // Wait for reveal state
    await expect(
      page.getByRole('button', { name: 'Chanson suivante' })
    ).toBeVisible({ timeout: 5000 })

    // Get CLS measurement
    const cls = await clsPromise

    // Log the CLS value for debugging
    console.log(`Game screen CLS during transitions: ${cls}`)

    // CLS should be less than 0.1 (Good score)
    expect(cls).toBeLessThan(0.1)
  })

  test('multiplayer hub has minimal CLS', async ({ page }) => {
    // Navigate to multiplayer page
    await page.goto('/multiplayer')

    // Wait for page to be fully loaded
    await expect(
      page.getByRole('heading', { name: 'Multijoueur' })
    ).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Measure CLS over 3 seconds
    const cls = await measureCLS(page, 3000)

    // Log the CLS value for debugging
    console.log(`Multiplayer hub CLS: ${cls}`)

    // CLS should be less than 0.1 (Good score)
    expect(cls).toBeLessThan(0.1)
  })

  test('no visible layout jumps on initial page load', async ({ page }) => {
    // Navigate to play page
    await page.goto('/play')

    // Start measuring immediately
    const clsPromise = measureCLS(page, 3000)

    // Wait for full page load
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    const cls = await clsPromise

    // Log the CLS value for debugging
    console.log(`Initial page load CLS: ${cls}`)

    // CLS should be less than 0.1 (Good score)
    // A CLS of 0 means perfect stability with no layout shifts
    expect(cls).toBeLessThan(0.1)
  })

  test('font loading does not cause layout shift', async ({ page }) => {
    // Navigate with fonts potentially not cached
    await page.goto('/play', { waitUntil: 'commit' })

    // Measure CLS during font loading phase
    const cls = await measureCLS(page, 4000)

    // Log the CLS value for debugging
    console.log(`Font loading CLS: ${cls}`)

    // Fonts should use font-display: swap with proper fallback sizes
    // CLS should be minimal
    expect(cls).toBeLessThan(0.1)
  })

  test('images and covers do not cause layout shift', async ({ page }) => {
    // Navigate to solo config first
    await page.goto('/solo')

    // Wait for config page to load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.click('button:has-text("Nouvelle Partie")')

    // Wait for game page to load
    await page.waitForURL('/game*')

    // Wait for buzzer (game fully loaded)
    const buzzerButton = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzerButton).toBeVisible({ timeout: 45000 })

    // Click reveal to show the album cover
    const revealButton = page.getByRole('button', {
      name: 'Révéler la réponse',
    })
    await expect(revealButton).toBeVisible()

    // Start measuring CLS before reveal
    const clsPromise = measureCLS(page, 3000)

    // Click reveal - album cover will unblur
    await revealButton.click()

    // Wait for reveal state
    await expect(
      page.getByRole('button', { name: 'Chanson suivante' })
    ).toBeVisible({ timeout: 5000 })

    const cls = await clsPromise

    // Log the CLS value for debugging
    console.log(`Image reveal CLS: ${cls}`)

    // Images should have reserved space, so no layout shift
    expect(cls).toBeLessThan(0.1)
  })
})

test.describe('CLS - Responsive Viewports', () => {
  // Run only on chromium as PerformanceObserver behavior may vary
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only')

  test('mobile viewport has minimal CLS', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Navigate to play page
    await page.goto('/play')

    // Wait for page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Measure CLS
    const cls = await measureCLS(page, 3000)

    // Log the CLS value for debugging
    console.log(`Mobile viewport CLS: ${cls}`)

    // CLS should be less than 0.1 (Good score)
    expect(cls).toBeLessThan(0.1)
  })

  test('tablet viewport has minimal CLS', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    // Navigate to play page
    await page.goto('/play')

    // Wait for page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Measure CLS
    const cls = await measureCLS(page, 3000)

    // Log the CLS value for debugging
    console.log(`Tablet viewport CLS: ${cls}`)

    // CLS should be less than 0.1 (Good score)
    expect(cls).toBeLessThan(0.1)
  })

  test('large desktop viewport has minimal CLS', async ({ page }) => {
    // Set large desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })

    // Navigate to play page
    await page.goto('/play')

    // Wait for page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Measure CLS
    const cls = await measureCLS(page, 3000)

    // Log the CLS value for debugging
    console.log(`Large desktop viewport CLS: ${cls}`)

    // CLS should be less than 0.1 (Good score)
    expect(cls).toBeLessThan(0.1)
  })
})
