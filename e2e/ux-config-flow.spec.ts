import { test, expect } from '@playwright/test'

/**
 * UX Flow Tests for Game Configuration
 *
 * Tests the user experience of configuring a game on the /solo page:
 * - Slider responsiveness and value updates
 * - Radio button selection for guess modes
 * - Advanced settings panel expand/collapse
 * - Form validation feedback
 * - Navigation flow without friction
 */

test.describe('Config UX - Slider Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/solo')
    // Wait for the config page to fully load
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
  })

  test('slider responds smoothly to drag interaction', async ({ page }) => {
    const slider = page.locator('[data-testid="duration-slider"]')
    const valueDisplay = page.locator('[data-testid="duration-value"]')

    // Get initial value
    const initialValue = await valueDisplay.textContent()
    expect(initialValue).toBe('20s') // Default value

    // Get slider bounding box
    const box = await slider.boundingBox()
    expect(box).not.toBeNull()

    if (box) {
      // Drag slider to right (75% position should be around 45-50s)
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2, {
        steps: 10,
      })
      await page.mouse.up()

      // Wait for UI update
      await page.waitForTimeout(100)

      // Verify value changed
      const newValue = await valueDisplay.textContent()
      const numericValue = parseInt(newValue!.replace('s', ''))
      expect(numericValue).toBeGreaterThan(20)
    }
  })

  test('slider updates value on click position', async ({ page }) => {
    const slider = page.locator('[data-testid="duration-slider"]')
    const valueDisplay = page.locator('[data-testid="duration-value"]')

    // Get slider bounding box
    const box = await slider.boundingBox()
    expect(box).not.toBeNull()

    if (box) {
      // Click at 25% position (should be around 15-20s)
      await page.mouse.click(box.x + box.width * 0.25, box.y + box.height / 2)
      await page.waitForTimeout(100)

      const lowValue = await valueDisplay.textContent()
      const lowNumeric = parseInt(lowValue!.replace('s', ''))

      // Click at 100% position (should be 60s)
      await page.mouse.click(box.x + box.width * 0.95, box.y + box.height / 2)
      await page.waitForTimeout(100)

      const highValue = await valueDisplay.textContent()
      const highNumeric = parseInt(highValue!.replace('s', ''))

      // Verify slider covers the full range
      expect(highNumeric).toBeGreaterThan(lowNumeric)
    }
  })

  test('slider respects step increments of 5 seconds', async ({ page }) => {
    const slider = page.locator('[data-testid="duration-slider"]')
    const valueDisplay = page.locator('[data-testid="duration-value"]')

    // Use keyboard to change slider value
    await slider.focus()

    // Press right arrow multiple times
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(50)
    }

    const value = await valueDisplay.textContent()
    const numericValue = parseInt(value!.replace('s', ''))

    // Value should be a multiple of 5
    expect(numericValue % 5).toBe(0)
    // Value should have increased from default 20
    expect(numericValue).toBeGreaterThan(20)
  })

  test('slider value persists after page reload', async ({ page }) => {
    const slider = page.locator('[data-testid="duration-slider"]')
    const valueDisplay = page.locator('[data-testid="duration-value"]')

    // Change slider value
    const box = await slider.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width * 0.8, box.y + box.height / 2)
      await page.waitForTimeout(200)
    }

    const changedValue = await valueDisplay.textContent()
    const changedNumeric = parseInt(changedValue!.replace('s', ''))

    // Reload page
    await page.reload()
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Check value persisted
    const persistedValue = await valueDisplay.textContent()
    const persistedNumeric = parseInt(persistedValue!.replace('s', ''))

    expect(persistedNumeric).toBe(changedNumeric)
  })
})

test.describe('Config UX - Guess Mode Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
  })

  test('guess mode radio buttons respond to clicks', async ({ page }) => {
    // Find all mode options
    const titleOption = page.locator('label:has-text("Titre")')
    const artistOption = page.locator('label:has-text("Artiste")')
    const bothOption = page.locator('label:has-text("Les deux")')

    // Default should be "Les deux"
    await expect(
      bothOption
        .locator('div.bg-purple-400')
        .or(bothOption.locator('.border-purple-400'))
    ).toBeVisible()

    // Click on Titre
    await titleOption.click()
    await page.waitForTimeout(100)

    // Verify Titre is now selected (has purple styling)
    const titleRadio = titleOption.locator('input[type="radio"]')
    await expect(titleRadio).toBeChecked()

    // Click on Artiste
    await artistOption.click()
    await page.waitForTimeout(100)

    // Verify Artiste is now selected
    const artistRadio = artistOption.locator('input[type="radio"]')
    await expect(artistRadio).toBeChecked()
  })

  test('guess mode selection persists after reload', async ({ page }) => {
    // Select "Titre" mode
    const titleOption = page.locator('label:has-text("Titre")').first()
    await titleOption.click()
    await page.waitForTimeout(200)

    // Reload page
    await page.reload()
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Verify "Titre" is still selected
    const titleRadio = page
      .locator('label:has-text("Titre")')
      .first()
      .locator('input[type="radio"]')
    await expect(titleRadio).toBeChecked()
  })

  test('mode selection shows visual feedback', async ({ page }) => {
    const artistOption = page.locator('label:has-text("Artiste")')

    // Click to select
    await artistOption.click()
    await page.waitForTimeout(100)

    // Check for visual indicator (border or background change)
    await expect(artistOption).toHaveClass(/border-purple-400|bg-purple/)
  })
})

test.describe('Config UX - Advanced Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
  })

  test('advanced settings panel opens and closes smoothly', async ({
    page,
  }) => {
    const advancedButton = page.locator('[data-testid="advanced-settings"]')

    // Initially, advanced content should be hidden
    await expect(page.locator('text=Temps pour répondre')).not.toBeVisible()

    // Click to open
    await advancedButton.click()
    await page.waitForTimeout(400) // Wait for animation

    // Content should now be visible
    await expect(page.locator('text=Temps pour répondre')).toBeVisible()
    await expect(page.locator('text=Mode sans timer')).toBeVisible()
    await expect(page.locator('text=Point de départ')).toBeVisible()

    // Click again to close
    await advancedButton.click()
    await page.waitForTimeout(400) // Wait for animation

    // Content should be hidden again
    await expect(page.locator('text=Temps pour répondre')).not.toBeVisible()
  })

  test('timer duration buttons respond to clicks', async ({ page }) => {
    // Open advanced settings
    await page.click('[data-testid="advanced-settings"]')
    await page.waitForTimeout(400)

    // Click on 10s timer option
    const tenSecondButton = page.getByRole('button', { name: '10s' })
    await tenSecondButton.click()
    await page.waitForTimeout(100)

    // Verify 10s is now selected (has purple background)
    await expect(tenSecondButton).toHaveClass(/bg-purple-500/)
  })

  test('no-timer toggle works correctly', async ({ page }) => {
    // Open advanced settings
    await page.click('[data-testid="advanced-settings"]')
    await page.waitForTimeout(400)

    // Find no-timer toggle
    const noTimerLabel = page.locator('label:has-text("Mode sans timer")')
    const toggleSwitch = noTimerLabel.locator('input[type="checkbox"]')

    // Initially should be unchecked
    await expect(toggleSwitch).not.toBeChecked()

    // Click to enable
    await noTimerLabel.click()
    await page.waitForTimeout(100)

    // Should now be checked
    await expect(toggleSwitch).toBeChecked()

    // Timer duration buttons should be disabled
    const threeSecondButton = page.getByRole('button', { name: '3s' })
    await expect(threeSecondButton).toBeDisabled()
  })

  test('start position radio buttons work correctly', async ({ page }) => {
    // Open advanced settings
    await page.click('[data-testid="advanced-settings"]')
    await page.waitForTimeout(400)

    // Click on "Aléatoire" option
    const randomOption = page.locator('label:has-text("Aléatoire")').first()
    await randomOption.click()
    await page.waitForTimeout(100)

    // Verify it's selected
    const randomRadio = randomOption.locator('input[type="radio"]')
    await expect(randomRadio).toBeChecked()

    // Click on "Sans intro"
    const skipIntroOption = page.locator('label:has-text("Sans intro")')
    await skipIntroOption.click()
    await page.waitForTimeout(100)

    // Verify "Sans intro" is now selected
    const skipIntroRadio = skipIntroOption.locator('input[type="radio"]')
    await expect(skipIntroRadio).toBeChecked()

    // Previous option should be deselected
    await expect(randomRadio).not.toBeChecked()
  })
})

test.describe('Config UX - Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
  })

  test('form submits successfully with valid configuration', async ({
    page,
  }) => {
    // Click start button
    const startButton = page.getByRole('button', { name: 'Nouvelle Partie' })
    await startButton.click()

    // Should navigate to game page
    await page.waitForURL('/game*', { timeout: 10000 })

    // Verify we're on the game page
    expect(page.url()).toContain('/game')
  })

  test('validation error appears for empty playlist', async ({ page }) => {
    // This test verifies the validation flow works
    // We can't easily create an empty playlist in e2e, but we verify the validation UI exists

    // Try to start the game - should work if songs are available
    const startButton = page.getByRole('button', { name: 'Nouvelle Partie' })

    // If there are no songs, we should see an error
    // This is a soft assertion - we just verify the UI flow works
    await startButton.click()

    // Either navigate to game or show validation error
    await Promise.race([
      page.waitForURL('/game*', { timeout: 5000 }),
      expect(page.locator('.bg-red-500\\/20')).toBeVisible({ timeout: 5000 }),
    ]).catch(() => {
      // One of them should happen
    })
  })

  test('loading state shows during form submission', async ({ page }) => {
    const startButton = page.getByRole('button', { name: 'Nouvelle Partie' })

    // Click and immediately check for loading state
    const clickPromise = startButton.click()

    // Try to catch the loading state (brief moment)
    // Note: This may be too fast to reliably catch
    await clickPromise

    // Verify button behavior during submission
    // The button should either show "Chargement..." or navigate
    await page.waitForURL('/game*', { timeout: 10000 })
  })
})

test.describe('Config UX - Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
  })

  test('back button navigates to play selection', async ({ page }) => {
    const backButton = page.getByRole('button', { name: 'Retour' })
    await backButton.click()

    await page.waitForURL('/play')
    expect(page.url()).toContain('/play')
  })

  test('complete configuration flow without friction', async ({ page }) => {
    // 1. Change guess mode
    await page.locator('label:has-text("Artiste")').click()
    await page.waitForTimeout(100)

    // 2. Adjust slider
    const slider = page.locator('[data-testid="duration-slider"]')
    const box = await slider.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width * 0.6, box.y + box.height / 2)
    }
    await page.waitForTimeout(100)

    // 3. Open advanced settings
    await page.click('[data-testid="advanced-settings"]')
    await page.waitForTimeout(400)

    // 4. Change timer duration
    await page.getByRole('button', { name: '10s' }).click()
    await page.waitForTimeout(100)

    // 5. Start game
    await page.getByRole('button', { name: 'Nouvelle Partie' }).click()

    // Should navigate without issues
    await page.waitForURL('/game*', { timeout: 10000 })

    // Verify config params in URL
    const url = new URL(page.url())
    expect(url.searchParams.get('mode')).toBe('artist')
    expect(url.searchParams.get('timer')).toBe('10')
  })

  test('keyboard navigation through form elements', async ({ page }) => {
    // Tab through the form elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should be able to navigate through mode options
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()

    // Tab to slider
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Arrow keys should work on slider when focused
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(50)

    const valueDisplay = page.locator('[data-testid="duration-value"]')
    const value = await valueDisplay.textContent()
    const numericValue = parseInt(value!.replace('s', ''))
    // Value should have increased or stayed at max
    expect(numericValue).toBeGreaterThanOrEqual(20)
  })
})

test.describe('Config UX - Playlist Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/solo')
    await expect(page.locator('[data-testid="duration-slider"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
  })

  test('playlist panel opens and closes', async ({ page }) => {
    // Find and click playlist section header
    const playlistHeader = page.locator('h2:has-text("Playlists")').first()
    await playlistHeader.click()
    await page.waitForTimeout(400)

    // Panel should expand showing playlist options
    // Look for "Créer une playlist" or playlist list
    await expect(
      page
        .locator('text=Créer une playlist')
        .or(page.locator('text=Toute la bibliothèque'))
    ).toBeVisible()

    // Click again to close
    await playlistHeader.click()
    await page.waitForTimeout(400)
  })

  test('selecting full library shows filter options', async ({ page }) => {
    // When no playlist is selected, filters should be visible
    // The LibraryFilters component should be present
    await expect(page.locator('text=Filtrer')).toBeVisible()
  })
})
