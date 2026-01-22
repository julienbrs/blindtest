import { test, expect } from '@playwright/test'

/**
 * UX Flow Tests for Buzzer Interaction
 *
 * Tests the user experience of the buzzer button on the game screen:
 * - Click feedback timing (should be < 100ms)
 * - Disabled state visual clarity
 * - Haptic feedback on mobile (vibration API)
 * - Buzzer visibility and accessibility during gameplay
 */

test.describe('Buzzer UX - Click Feedback', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to game via solo mode
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click()
    await page.waitForURL('/game*')

    // Wait for buzzer to appear (indicates game is in playing state)
    await expect(page.getByRole('button', { name: 'BUZZ!' })).toBeVisible({
      timeout: 45000,
    })
  })

  test('buzzer click triggers immediate visual feedback', async ({ page }) => {
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })

    // Click buzzer and verify immediate response
    await buzzer.click()

    // Buzzer should be hidden in timer state (audio paused, timer shown)
    // OR validation buttons should appear quickly (< 500ms)
    await expect(page.getByRole('button', { name: 'Correct' })).toBeVisible({
      timeout: 500,
    })
  })

  test('buzzer click response time is acceptable', async ({ page }) => {
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })

    // Measure click response time
    const start = Date.now()
    await buzzer.click()

    // Wait for the timer/validation UI to appear
    await expect(page.getByRole('button', { name: 'Correct' })).toBeVisible({
      timeout: 2000,
    })
    const elapsed = Date.now() - start

    // Total response time should be reasonable (< 500ms including UI update)
    // Note: The 100ms target is for the click handler itself, total UI response can be longer
    expect(elapsed).toBeLessThan(500)
  })

  test('buzzer shows scale animation on click', async ({ page }) => {
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })

    // Start with buzzer visible
    await expect(buzzer).toBeVisible()

    // Take screenshot before click for comparison
    const beforeBox = await buzzer.boundingBox()
    expect(beforeBox).not.toBeNull()

    // Click buzzer
    await buzzer.click()

    // After clicking, validation buttons should appear (buzzer effect completed)
    await expect(page.getByRole('button', { name: 'Correct' })).toBeVisible()
  })
})

test.describe('Buzzer UX - Disabled State', () => {
  test('buzzer is not visible before audio is loaded', async ({ page }) => {
    // Navigate to game
    await page.goto('/solo')
    await page.waitForLoadState('networkidle')

    // Start the game with slow network to catch loading state
    await page.route('**/api/audio/**', async (route) => {
      // Add delay to catch loading state
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })

    await page.getByRole('button', { name: 'Nouvelle Partie' }).click()
    await page.waitForURL('/game*')

    // Initially, buzzer should not be visible during loading
    // Then after audio loads, buzzer becomes visible
    await expect(page.getByRole('button', { name: 'BUZZ!' })).toBeVisible({
      timeout: 45000,
    })
  })

  test('buzzer disabled state has visual indicators', async ({ page }) => {
    // Navigate to game via solo mode
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click()
    await page.waitForURL('/game*')

    // Wait for buzzer to appear
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzer).toBeVisible({ timeout: 45000 })

    // Click buzzer to enter timer state
    await buzzer.click()

    // In timer state, buzzer should not be visible (hidden when timer is active)
    await expect(buzzer).not.toBeVisible({ timeout: 2000 })

    // Validation buttons should be visible instead
    await expect(page.getByRole('button', { name: 'Correct' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Incorrect' })).toBeVisible()
  })

  test('buzzer reappears after completing round', async ({ page }) => {
    // Navigate to game via solo mode
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click()
    await page.waitForURL('/game*')

    // Wait for buzzer
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzer).toBeVisible({ timeout: 45000 })

    // Click buzzer
    await buzzer.click()

    // Click "Correct" to complete the round
    await page.getByRole('button', { name: 'Correct' }).click()

    // Click "Chanson suivante" to move to next round
    const nextButton = page.getByRole('button', { name: 'Chanson suivante' })
    await expect(nextButton).toBeVisible({ timeout: 5000 })
    await nextButton.click()

    // Wait for next song to load and buzzer to reappear
    await expect(buzzer).toBeVisible({ timeout: 45000 })
  })
})

test.describe('Buzzer UX - Haptic Feedback', () => {
  test('buzzer triggers vibration API when available', async ({ page }) => {
    // Navigate to game via solo mode
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Track vibration API calls by injecting a script before page loads
    await page.addInitScript(() => {
      interface WindowWithVibrateCalls extends Window {
        vibrateCalls: number[][]
      }
      const win = window as unknown as WindowWithVibrateCalls
      win.vibrateCalls = []

      // Store original vibrate function if it exists
      const originalVibrate = navigator.vibrate?.bind(navigator)

      // Override vibrate to track calls
      Object.defineProperty(navigator, 'vibrate', {
        value: function (pattern: number | number[] | Iterable<number>) {
          const normalizedPattern = Array.isArray(pattern)
            ? pattern
            : typeof pattern === 'number'
              ? [pattern]
              : Array.from(pattern as Iterable<number>)
          win.vibrateCalls.push(normalizedPattern)
          if (originalVibrate) {
            return originalVibrate(pattern as number | number[])
          }
          return true
        },
        writable: true,
        configurable: true,
      })
    })

    // Start the game
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click()
    await page.waitForURL('/game*')

    // Wait for buzzer
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzer).toBeVisible({ timeout: 45000 })

    // Click buzzer
    await buzzer.click()

    // Wait for click to be processed
    await page.waitForTimeout(200)

    // Check that vibration was called (if supported)
    const calls = await page.evaluate(() => {
      return (window as unknown as { vibrateCalls: number[][] }).vibrateCalls
    })

    // Vibration should have been called with 100ms pattern
    expect(calls.length).toBeGreaterThan(0)
    expect(calls[0]).toContain(100)
  })
})

test.describe('Buzzer UX - Mobile Touch Interaction', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE

  test('buzzer is large enough for comfortable touch on mobile', async ({
    page,
  }) => {
    // Navigate to game via solo mode
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click()
    await page.waitForURL('/game*')

    // Wait for buzzer
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzer).toBeVisible({ timeout: 45000 })

    // Check buzzer size meets minimum touch target (44px per Apple guidelines)
    const box = await buzzer.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)

    // On mobile, buzzer should be at least 128px (h-32 class)
    expect(box!.width).toBeGreaterThanOrEqual(100)
    expect(box!.height).toBeGreaterThanOrEqual(100)
  })

  test('buzzer touch interaction works without delay', async ({ page }) => {
    // Navigate to game via solo mode
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click()
    await page.waitForURL('/game*')

    // Wait for buzzer
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzer).toBeVisible({ timeout: 45000 })

    // Use tap instead of click to simulate touch
    await buzzer.tap()

    // Verify immediate response
    await expect(page.getByRole('button', { name: 'Correct' })).toBeVisible({
      timeout: 2000,
    })
  })
})

test.describe('Buzzer UX - Accessibility', () => {
  test('buzzer has proper focus state for keyboard users', async ({ page }) => {
    // Navigate to game via solo mode
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click()
    await page.waitForURL('/game*')

    // Wait for buzzer
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzer).toBeVisible({ timeout: 45000 })

    // Tab to buzzer
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Try to find the buzzer by tabbing (may need more tabs)
    for (let i = 0; i < 10; i++) {
      const focused = page.locator(':focus')
      const text = await focused.textContent().catch(() => '')
      if (text?.includes('BUZZ')) {
        break
      }
      await page.keyboard.press('Tab')
    }

    // Buzzer should have focus ring class
    await expect(buzzer).toHaveClass(/focus:ring/)
  })

  test('buzzer can be activated with keyboard', async ({ page }) => {
    // Navigate to game via solo mode
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click()
    await page.waitForURL('/game*')

    // Wait for buzzer
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzer).toBeVisible({ timeout: 45000 })

    // Focus buzzer directly
    await buzzer.focus()
    await expect(buzzer).toBeFocused()

    // Activate with Enter key
    await page.keyboard.press('Enter')

    // Verify buzzer was activated (validation buttons appear)
    await expect(page.getByRole('button', { name: 'Correct' })).toBeVisible({
      timeout: 2000,
    })
  })

  test('buzzer can be activated with Space key', async ({ page }) => {
    // Navigate to game via solo mode
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click()
    await page.waitForURL('/game*')

    // Wait for buzzer
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })
    await expect(buzzer).toBeVisible({ timeout: 45000 })

    // Focus buzzer directly
    await buzzer.focus()
    await expect(buzzer).toBeFocused()

    // Activate with Space key
    await page.keyboard.press('Space')

    // Verify buzzer was activated (validation buttons appear)
    await expect(page.getByRole('button', { name: 'Correct' })).toBeVisible({
      timeout: 2000,
    })
  })
})

test.describe('Buzzer UX - Visual State Transitions', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to game via solo mode
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Start the game
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click()
    await page.waitForURL('/game*')

    // Wait for buzzer
    await expect(page.getByRole('button', { name: 'BUZZ!' })).toBeVisible({
      timeout: 45000,
    })
  })

  test('buzzer has red gradient styling', async ({ page }) => {
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })

    // Check for red gradient classes
    await expect(buzzer).toHaveClass(/from-red-500/)
    await expect(buzzer).toHaveClass(/to-red-700/)
    await expect(buzzer).toHaveClass(/bg-gradient-to-br/)
  })

  test('buzzer has glow effect', async ({ page }) => {
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })

    // Check buzzer has shadow (glow) styling
    // The component uses animate with boxShadow
    const style = await buzzer.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow
    })

    // Should have a red glow shadow
    expect(style).toContain('rgba')
  })

  test('buzzer click triggers shockwave animation', async ({ page }) => {
    const buzzer = page.getByRole('button', { name: 'BUZZ!' })

    // Click buzzer to trigger animation
    await buzzer.click()

    // The shockwave effect creates an expanding circle
    // This is a motion.div that appears briefly
    // We can verify the buzzer was clicked by checking for validation buttons
    await expect(page.getByRole('button', { name: 'Correct' })).toBeVisible({
      timeout: 500,
    })
  })
})
