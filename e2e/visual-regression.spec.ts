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

  test('baseline setup - homepage loads correctly', async ({ page }) => {
    await page.goto('/')

    // Wait for the page to be fully loaded
    await expect(
      page.getByRole('button', { name: 'Nouvelle Partie' })
    ).toBeVisible({ timeout: 30000 })

    // Wait for fonts and images to load
    await page.waitForLoadState('networkidle')

    // Additional wait for any remaining animations
    await page.waitForTimeout(500)

    // Take screenshot of homepage
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
    })
  })

  test('baseline setup - play mode selection page', async ({ page }) => {
    await page.goto('/play')

    // Wait for page to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Take screenshot of play mode selection
    await expect(page).toHaveScreenshot('play-selection.png', {
      fullPage: true,
    })
  })
})
