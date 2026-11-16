import { expect, test } from '@playwright/test'
import { boot } from './helpers.ts'

test('the game boots: one canvas filling the window, the HUD, no errors', async ({ page }) => {
  const errors = await boot(page)
  const canvas = page.locator('canvas')
  // Give Phaser a moment, so errors from its first frames are caught and React's
  // development double-mount has finished destroying the first game.
  await page.waitForTimeout(800)
  await expect(canvas).toHaveCount(1)
  const viewport = page.viewportSize()!
  const box = (await canvas.boundingBox())!
  expect(Math.round(box.width)).toBe(viewport.width)
  expect(Math.round(box.height)).toBe(viewport.height)
  await expect(page.getByTestId('charges')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await expect(page.getByTestId('touch-controls')).toHaveCount(0)
  expect(errors).toEqual([])
})
