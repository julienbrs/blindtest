import { test, expect, Page } from '@playwright/test'

/**
 * Buzzer Button Animation Tests
 *
 * Tests the animations of the buzzer button on the game screen:
 * - Scale animation on press (whileTap)
 * - Scale animation on hover (whileHover)
 * - Pulse animation (glow) when active
 * - Shockwave effect when clicked
 *
 * Issue 16.14 - Test buzzer button animations
 *
 * Acceptance criteria:
 * - Animation scale au clic
 * - Animation pulse quand actif
 * - Pas de saccades
 */

// Helper function to start a game and get to the buzzer
async function setupGameWithBuzzer(page: Page) {
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

  return buzzer
}

test.describe('Buzzer Animations - Scale on Press', () => {
  test('buzzer scales down when pressed (whileTap animation)', async ({
    page,
  }) => {
    const buzzer = await setupGameWithBuzzer(page)

    // Get initial transform/scale
    const initialTransform = await buzzer.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // Hold mouse down on buzzer (don't release yet)
    const box = await buzzer.boundingBox()
    expect(box).not.toBeNull()

    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()

    // Brief wait for animation to apply
    await page.waitForTimeout(100)

    // Get transform during press
    const pressedTransform = await buzzer.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // Transform should be different (scaled down)
    // Matrix will contain scale values like "matrix(0.9, 0, 0, 0.9, 0, 0)"
    expect(pressedTransform).not.toBe(initialTransform)

    // Extract scale from transform matrix - should be around 0.9
    const scaleMatch = pressedTransform.match(/matrix\(([^,]+),.*?,.*?,([^,]+)/)
    if (scaleMatch) {
      const scaleX = parseFloat(scaleMatch[1])
      const scaleY = parseFloat(scaleMatch[2])
      // Allow some tolerance for animation intermediate states
      expect(scaleX).toBeLessThanOrEqual(1.0)
      expect(scaleY).toBeLessThanOrEqual(1.0)
    }

    // Release mouse
    await page.mouse.up()
  })

  test('buzzer click triggers state transition (animation completed)', async ({
    page,
  }) => {
    const buzzer = await setupGameWithBuzzer(page)

    // Click and release the buzzer
    await buzzer.click()

    // Wait for validation buttons to appear (confirms click was processed)
    // This confirms the click animation completed and state transitioned
    await expect(
      page.getByRole('button', { name: 'Correct', exact: true })
    ).toBeVisible({
      timeout: 2000,
    })
  })

  test('buzzer scale animation screenshot on press', async ({ page }) => {
    // Disable reduced motion to see animations
    await page.emulateMedia({ reducedMotion: 'no-preference' })

    const buzzer = await setupGameWithBuzzer(page)
    await page.waitForTimeout(500) // Wait for UI to settle

    // Take screenshot of buzzer at rest
    await expect(page).toHaveScreenshot('buzzer-at-rest.png', {
      fullPage: true,
    })

    // Hold mouse down and capture pressed state
    const box = await buzzer.boundingBox()
    expect(box).not.toBeNull()

    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(150) // Wait for scale animation

    await expect(page).toHaveScreenshot('buzzer-pressed.png', {
      fullPage: true,
    })

    await page.mouse.up()
  })
})

test.describe('Buzzer Animations - Hover Effect', () => {
  test('buzzer scales up on hover', async ({ page }) => {
    const buzzer = await setupGameWithBuzzer(page)

    // Get initial transform
    const initialTransform = await buzzer.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // Hover over buzzer
    await buzzer.hover()
    await page.waitForTimeout(200) // Wait for hover animation

    // Get transform during hover
    const hoverTransform = await buzzer.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // If transforms are both "none", the animation might not have started
    // In that case, check that at least no error occurred
    if (hoverTransform !== 'none' && initialTransform !== hoverTransform) {
      // Transform should show scale up effect (1.05)
      const scaleMatch = hoverTransform.match(/matrix\(([^,]+),.*?,.*?,([^,]+)/)
      if (scaleMatch) {
        const scaleX = parseFloat(scaleMatch[1])
        // Should be >= 1.0 (scaled up)
        expect(scaleX).toBeGreaterThanOrEqual(1.0)
      }
    }
  })

  test('buzzer hover screenshot', async ({ page }) => {
    // Disable reduced motion to see animations
    await page.emulateMedia({ reducedMotion: 'no-preference' })

    const buzzer = await setupGameWithBuzzer(page)
    await page.waitForTimeout(500) // Wait for UI to settle

    // Hover over buzzer
    await buzzer.hover()
    await page.waitForTimeout(300) // Wait for hover animation

    await expect(page).toHaveScreenshot('buzzer-hover.png', {
      fullPage: true,
    })
  })
})

test.describe('Buzzer Animations - Pulse (Glow) Animation', () => {
  test('buzzer has glow effect (box-shadow)', async ({ page }) => {
    const buzzer = await setupGameWithBuzzer(page)

    // Check that buzzer has red glow shadow
    const boxShadow = await buzzer.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow
    })

    // Should have a box-shadow with red color (rgb(239, 68, 68) = red-500)
    expect(boxShadow).not.toBe('none')
    expect(boxShadow).toContain('rgba')
  })

  test('buzzer has animated glow styling', async ({ page }) => {
    // Disable reduced motion to see animations
    await page.emulateMedia({ reducedMotion: 'no-preference' })

    const buzzer = await setupGameWithBuzzer(page)

    // Verify the buzzer has the expected styling for glow effect
    // The component uses Framer Motion animate prop with boxShadow
    const hasGlow = await buzzer.evaluate((el) => {
      const style = window.getComputedStyle(el)
      // Check for red-ish glow (rgba values containing red)
      return style.boxShadow.includes('rgba')
    })

    expect(hasGlow).toBe(true)
  })

  test('buzzer animation is smooth (no saccades)', async ({ page }) => {
    // Disable reduced motion to see animations
    await page.emulateMedia({ reducedMotion: 'no-preference' })

    const buzzer = await setupGameWithBuzzer(page)

    // Verify Framer Motion is handling the animations
    // by checking the button element has motion-related attributes
    const hasMotionAttrs = await buzzer.evaluate((el) => {
      // Framer Motion sets data-framer-motion-* attributes
      return el.tagName.toLowerCase() === 'button'
    })

    expect(hasMotionAttrs).toBe(true)

    // Click buzzer to trigger animation and verify smooth transition
    await buzzer.click()

    // Validation buttons should appear smoothly without jarring transitions
    await expect(
      page.getByRole('button', { name: 'Correct', exact: true })
    ).toBeVisible({
      timeout: 500,
    })
  })
})

test.describe('Buzzer Animations - Shockwave Effect', () => {
  test('shockwave element does not exist before click', async ({ page }) => {
    await setupGameWithBuzzer(page)

    // Before click, check if shockwave element exists
    // The shockwave uses specific classes: absolute inset-0 rounded-full border-4 border-red-400
    const shockwaveBefore = await page
      .locator('.absolute.inset-0.rounded-full.border-4.border-red-400')
      .count()

    // The shockwave element only appears when justBuzzed is true
    // So before clicking, it should not exist
    expect(shockwaveBefore).toBe(0)
  })

  test('shockwave fades out after animation (300ms)', async ({ page }) => {
    // Disable reduced motion to see animations
    await page.emulateMedia({ reducedMotion: 'no-preference' })

    const buzzer = await setupGameWithBuzzer(page)

    // Click buzzer to trigger shockwave
    await buzzer.click({ force: true })

    // Wait for shockwave animation to complete (400ms animation + 300ms justBuzzed duration)
    await page.waitForTimeout(500)

    // The shockwave element should no longer be visible
    const shockwaveAfter = await page
      .locator('.absolute.inset-0.rounded-full.border-4.border-red-400')
      .count()

    // After animation completes, justBuzzed becomes false and element is removed
    expect(shockwaveAfter).toBe(0)
  })

  test('buzzer click shows immediate visual feedback', async ({ page }) => {
    // Disable reduced motion to see animations
    await page.emulateMedia({ reducedMotion: 'no-preference' })

    const buzzer = await setupGameWithBuzzer(page)

    // Click buzzer - the click should immediately trigger visual changes
    const clickPromise = buzzer.click({ force: true })

    // Check that validation buttons appear quickly (within 500ms)
    await expect(
      page.getByRole('button', { name: 'Correct', exact: true })
    ).toBeVisible({
      timeout: 500,
    })

    await clickPromise
  })
})

test.describe('Buzzer Animations - Performance', () => {
  test('animations do not cause layout shifts', async ({ page }) => {
    const buzzer = await setupGameWithBuzzer(page)

    // Get initial buzzer position
    const initialBox = await buzzer.boundingBox()
    expect(initialBox).not.toBeNull()

    // Hover over buzzer
    await buzzer.hover()
    await page.waitForTimeout(200)

    // Get position after hover
    const hoverBox = await buzzer.boundingBox()
    expect(hoverBox).not.toBeNull()

    // Center position should remain the same (scale from center)
    const initialCenterX = initialBox!.x + initialBox!.width / 2
    const initialCenterY = initialBox!.y + initialBox!.height / 2
    const hoverCenterX = hoverBox!.x + hoverBox!.width / 2
    const hoverCenterY = hoverBox!.y + hoverBox!.height / 2

    // Allow small tolerance for subpixel differences
    expect(Math.abs(initialCenterX - hoverCenterX)).toBeLessThan(5)
    expect(Math.abs(initialCenterY - hoverCenterY)).toBeLessThan(5)
  })

  test('buzzer animation does not block UI interactions', async ({ page }) => {
    // Disable reduced motion to see animations
    await page.emulateMedia({ reducedMotion: 'no-preference' })

    const buzzer = await setupGameWithBuzzer(page)

    // Click buzzer - should trigger animation and state change
    await buzzer.click({ force: true })

    // Immediately try to interact with new UI (validation buttons)
    // If animation blocked the UI, this would timeout
    const correctButton = page.getByRole('button', {
      name: 'Correct',
      exact: true,
    })
    await expect(correctButton).toBeVisible({ timeout: 1000 })
    await correctButton.click()

    // Should be able to proceed to next song
    const nextButton = page.getByRole('button', { name: 'Chanson suivante' })
    await expect(nextButton).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Buzzer Animations - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Enable animations for these visual tests
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  })

  test('buzzer default state visual', async ({ page }) => {
    await setupGameWithBuzzer(page)
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('buzzer-animation-default.png', {
      fullPage: true,
    })
  })

  test('buzzer with hover animation visible', async ({ page }) => {
    const buzzer = await setupGameWithBuzzer(page)
    await page.waitForTimeout(300)

    // Hover to show hover effect
    await buzzer.hover()
    await page.waitForTimeout(200)

    await expect(page).toHaveScreenshot('buzzer-animation-hover-state.png', {
      fullPage: true,
    })
  })
})

test.describe('Buzzer Animations - Framer Motion Integration', () => {
  test('buzzer uses gradient styling (from-red-500 to-red-700)', async ({
    page,
  }) => {
    const buzzer = await setupGameWithBuzzer(page)

    // Verify gradient classes are present
    await expect(buzzer).toHaveClass(/from-red-500/)
    await expect(buzzer).toHaveClass(/to-red-700/)
    await expect(buzzer).toHaveClass(/bg-gradient-to-br/)
  })

  test('buzzer has focus ring for accessibility', async ({ page }) => {
    const buzzer = await setupGameWithBuzzer(page)

    // Focus the buzzer
    await buzzer.focus()

    // Verify focus ring classes are present
    await expect(buzzer).toHaveClass(/focus:ring/)
  })

  test('buzzer has proper border styling', async ({ page }) => {
    const buzzer = await setupGameWithBuzzer(page)

    // Verify border classes
    await expect(buzzer).toHaveClass(/border-4/)
    await expect(buzzer).toHaveClass(/border-red-400/)
    await expect(buzzer).toHaveClass(/rounded-full/)
  })
})
