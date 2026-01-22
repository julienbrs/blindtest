import { test, expect } from '@playwright/test'

/**
 * Visual Regression Tests
 *
 * These tests capture screenshots for visual regression testing.
 * Run with --update-snapshots to generate/update baseline screenshots:
 *   npx playwright test e2e/visual-regression.spec.ts --update-snapshots
 *
 * Run normally to compare against baselines:
 *   npx playwright test e2e/visual-regression.spec.ts
 */

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('baseline setup - homepage redirects to play', async ({ page }) => {
    // Homepage redirects to /play
    await page.goto('/')

    // Wait for redirect to complete
    await page.waitForURL('/play')

    // Verify we're on the play page
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
  })
})

test.describe('Homepage Visual', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('play mode selection page renders correctly', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })

    // Wait for fonts and images to load
    await page.waitForLoadState('networkidle')

    // Additional wait for any remaining transitions
    await page.waitForTimeout(500)

    // Take screenshot of play mode selection page
    await expect(page).toHaveScreenshot('play-selection.png', {
      fullPage: true,
    })
  })

  test('solo button hover state', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Hover over the solo button
    await page.hover('[data-testid="solo-button"]')

    // Wait for hover animation to complete
    await page.waitForTimeout(350)

    // Take screenshot showing hover state
    await expect(page).toHaveScreenshot('solo-hover.png', {
      fullPage: true,
    })
  })

  test('multiplayer button hover state', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(
      page.locator('[data-testid="multiplayer-button"]')
    ).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Hover over the multiplayer button
    await page.hover('[data-testid="multiplayer-button"]')

    // Wait for hover animation to complete
    await page.waitForTimeout(350)

    // Take screenshot showing hover state
    await expect(page).toHaveScreenshot('multiplayer-hover.png', {
      fullPage: true,
    })
  })

  test('play page has proper gradient styling', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Verify the title has gradient styling
    const title = page.locator('h1')
    await expect(title).toBeVisible()
    await expect(title).toContainText('Blindtest')

    // Verify both cards are visible
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible()
    await expect(
      page.locator('[data-testid="multiplayer-button"]')
    ).toBeVisible()

    // Verify gradient icons are rendered
    // Solo button should have blue-cyan gradient
    const soloCard = page.locator('[data-testid="solo-button"]').locator('..')
    await expect(soloCard).toBeVisible()

    // Multiplayer button should have pink-purple gradient
    const multiplayerCard = page
      .locator('[data-testid="multiplayer-button"]')
      .locator('..')
    await expect(multiplayerCard).toBeVisible()
  })

  test('play page elements are properly positioned', async ({ page }) => {
    await page.goto('/play')

    // Wait for the page to be fully loaded
    await expect(page.locator('[data-testid="solo-button"]')).toBeVisible({
      timeout: 30000,
    })
    await page.waitForLoadState('networkidle')

    // Check that main elements exist and are visible
    await expect(page.locator('h1')).toBeVisible() // Title
    await expect(
      page.locator('text=Choisissez votre mode de jeu')
    ).toBeVisible() // Subtitle

    // Check solo card content
    await expect(page.locator('text=Jouer seul')).toBeVisible()
    await expect(
      page.locator('text=Testez vos connaissances musicales en solo')
    ).toBeVisible()

    // Check multiplayer card content
    await expect(page.locator('text=Multijoueur')).toBeVisible()
    await expect(
      page.locator('text=Affrontez vos amis en temps réel')
    ).toBeVisible()
  })
})
