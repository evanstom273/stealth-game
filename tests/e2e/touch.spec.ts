import { expect, test } from '@playwright/test'
import { boot, thief, worldToCss } from './helpers.ts'

// The Fold's outer screen in portrait, with touch.
test.use({ viewport: { width: 412, height: 915 }, hasTouch: true })

test.describe('touch controls on the Fold', () => {
  test('show the stick and the diamond of buttons', async ({ page }) => {
    const errors = await boot(page, '/?touch=1')
    await expect(page.getByTestId('touch-controls')).toBeVisible()
    for (const name of ['Jump', 'Grab', 'Sneak', 'Blink']) await expect(page.getByRole('button', { name })).toBeVisible()
    // Diamond: Blink above Jump, Sneak left of Grab.
    const box = async (name: string) => (await page.getByRole('button', { name }).boundingBox())!
    const [jump, blink, sneak, grab] = [await box('Jump'), await box('Blink'), await box('Sneak'), await box('Grab')]
    expect(blink.y).toBeLessThan(jump.y)
    expect(sneak.x).toBeLessThan(grab.x)
    expect(errors).toEqual([])
  })

  test('the stick walks him, and its edge runs', async ({ page }) => {
    await boot(page, '/?touch=1')
    const stick = (await page.getByTestId('stick').boundingBox())!
    const cx = stick.x + stick.width / 2
    const cy = stick.y + stick.height / 2
    const start = await thief(page)
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx + 25, cy, { steps: 3 })
    await expect.poll(async () => (await thief(page)).state).toBe('walk')
    await page.mouse.move(cx + 70, cy, { steps: 3 })
    await expect.poll(async () => (await thief(page)).state).toBe('run')
    await page.mouse.up()
    expect((await thief(page)).x).toBeGreaterThan(start.x)
  })

  test('dragging from Blink aims and blinks; sliding back onto it cancels', async ({ page }) => {
    await boot(page, '/?touch=1')
    const blink = (await page.getByTestId('blink').boundingBox())!
    const bx = blink.x + blink.width / 2
    const by = blink.y + blink.height / 2

    // Cancel: out and back onto the button.
    let start = await thief(page)
    const full = start.charges
    let target = await worldToCss(page, start.x + 2.5, start.y)
    await page.mouse.move(bx, by)
    await page.mouse.down()
    await page.mouse.move(target.x, target.y, { steps: 5 })
    await page.mouse.move(bx, by, { steps: 5 })
    await page.mouse.up()
    await page.waitForTimeout(300)
    expect((await thief(page)).charges).toBe(full)

    // Blink.
    start = await thief(page)
    target = await worldToCss(page, start.x + 2.5, start.y)
    await page.mouse.move(bx, by)
    await page.mouse.down()
    await page.mouse.move(target.x, target.y, { steps: 5 })
    await page.mouse.up()
    await expect.poll(async () => (await thief(page)).charges).toBe(full - 1)
    await expect.poll(async () => (await thief(page)).mode, { timeout: 15_000 }).toBe('ground')
    expect((await thief(page)).x).toBeGreaterThan(start.x + 1.5)
  })
})
