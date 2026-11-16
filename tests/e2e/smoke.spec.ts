import { expect, test } from '@playwright/test'

test('the game boots: one canvas filling the window, no errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await page.goto('/')

  const canvas = page.locator('canvas')
  await expect(canvas).toHaveCount(1)
  await expect(canvas).toBeVisible()

  // Give Phaser a moment to run, so errors from its first frames are caught,
  // and so React's development double-mount has finished destroying the first game.
  await page.waitForTimeout(1000)
  await expect(canvas).toHaveCount(1)

  const viewport = page.viewportSize()!
  const box = (await canvas.boundingBox())!
  expect(box.width).toBe(viewport.width)
  expect(box.height).toBe(viewport.height)

  expect(errors).toEqual([])
})
