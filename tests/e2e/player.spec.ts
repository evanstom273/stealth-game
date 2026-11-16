import { expect, test } from '@playwright/test'
import { boot, holdUntil, thief, worldToCss } from './helpers.ts'

test.describe('the thief on keyboard and mouse', () => {
  test('walks, runs faster, and jumps', async ({ page }) => {
    const errors = await boot(page)
    const start = await thief(page)
    await holdUntil(page, 'd', (t) => t.x > start.x + 1)
    expect((await thief(page)).facing).toBe(1)

    await page.keyboard.down('Shift')
    await holdUntil(page, 'a', (t) => t.state === 'run')
    await page.keyboard.up('Shift')

    await expect.poll(async () => (await thief(page)).mode).toBe('ground')
    const before = await thief(page)
    await page.keyboard.down('Space')
    await expect.poll(async () => before.y - (await thief(page)).y).toBeGreaterThan(0.5)
    await page.keyboard.up('Space')
    await expect.poll(async () => (await thief(page)).mode).toBe('ground')
    expect(errors).toEqual([])
  })

  test('sneak toggles on and off with C, and shows the Sneaking tag', async ({ page }) => {
    await boot(page)
    await page.keyboard.press('c')
    await expect(page.getByTestId('sneaking')).toBeVisible()
    await holdUntil(page, 'd', (t) => t.state === 'sneak')
    await page.keyboard.press('c')
    await expect(page.getByTestId('sneaking')).toHaveCount(0)
  })

  test('grabs the wall, climbs it, and lets go', async ({ page }) => {
    await boot(page)
    await holdUntil(page, 'a', (t) => t.x < 0.75)
    await page.keyboard.press('e')
    await expect.poll(async () => (await thief(page)).climb).toBe('wall')
    const on = await thief(page)
    await holdUntil(page, 'w', (t) => t.y < on.y - 1)
    const climbed = await thief(page)
    expect(climbed.grip).toBeLessThan(1)
    await page.keyboard.press('e')
    await expect.poll(async () => (await thief(page)).mode).toBe('ground')
  })

  test('jumps at a ledge, grabs, and climbs up onto it', async ({ page }) => {
    await boot(page)
    // Ledge 1 spans x 8.5 to 13.5 with its top at y 8.6. Stand just short of its left end.
    await holdUntil(page, 'd', (t) => t.x > 7.7)
    await expect.poll(async () => Math.abs((await thief(page)).x)).toBeGreaterThan(7.6)
    // A full jump (holding Space), with grab pressed just after take-off: the grab waits until the edge is in reach.
    await page.keyboard.down('Space')
    await expect.poll(async () => (await thief(page)).mode).toBe('air')
    await page.keyboard.press('e')
    await expect.poll(async () => { const t = await thief(page); return t.mode === 'ground' && t.y < 8.6 }).toBe(true)
    await page.keyboard.up('Space')
  })

  test('blinks with the right mouse button, spending a charge, and a checkpoint refills it', async ({ page }) => {
    await boot(page)
    const start = await thief(page)
    const target = await worldToCss(page, start.x + 3, start.y)
    await page.mouse.move(target.x, target.y)
    await page.mouse.down({ button: 'right' })
    await page.waitForTimeout(150)
    await page.mouse.up({ button: 'right' })
    await expect.poll(async () => (await thief(page)).charges).toBe(start.charges - 1)
    await expect.poll(async () => (await thief(page)).mode, { timeout: 15_000 }).toBe('ground')
    const landed = await thief(page)
    expect(landed.x).toBeGreaterThan(start.x + 2)
    // The stand-in checkpoint is at x = 1.6.
    await holdUntil(page, 'a', (t) => t.charges === start.charges)
  })

  test('pauses with Escape and resumes from the menu', async ({ page }) => {
    await boot(page)
    await page.keyboard.press('Escape')
    const menu = page.getByTestId('pause-menu')
    await expect(menu).toBeVisible()
    await menu.getByRole('button', { name: 'Resume' }).click()
    await expect(menu).toHaveCount(0)
    const start = await thief(page)
    await holdUntil(page, 'd', (t) => t.x > start.x + 0.5)
  })
})
