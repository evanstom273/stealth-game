import { expect, test } from '@playwright/test'
import { boot, combat, guards, setUp, thief, worldToCss } from './helpers.ts'

// The test guards (History #85) stand at x = 8, 12.4 and 22 (units of S).
test.describe('combat against the test guards', () => {
  test('a tap from behind knocks out; a hold kills', async ({ page }) => {
    const errors = await boot(page)
    await setUp(page, 7.1, { i: 0, facing: 1 })
    await expect.poll(async () => (await combat(page)).context, { intervals: [30] }).toBe('behind')
    await page.keyboard.press('f')
    await expect.poll(async () => (await guards(page))[0].state).toBe('ko')
    await expect.poll(async () => (await combat(page)).takedown).toBeNull()

    await setUp(page, 11.5, { i: 1, facing: 1 })
    await expect.poll(async () => (await combat(page)).context, { intervals: [30] }).toBe('behind')
    await page.keyboard.down('f')
    await expect.poll(async () => (await guards(page))[1].state).toBe('dead')
    await page.keyboard.up('f')
    expect(errors).toEqual([])
  })

  test('the combo staggers a guard, and a finisher takes it down', async ({ page }) => {
    await boot(page)
    await setUp(page, 21.0, { i: 2, facing: -1 })
    await expect.poll(async () => (await thief(page)).mode).toBe('ground')
    expect((await thief(page)).facing).toBe(1)
    // Three quick blows: jab, cross, shove.
    await page.keyboard.press('f')
    await page.waitForTimeout(90)
    await page.keyboard.press('f')
    await page.waitForTimeout(90)
    await page.keyboard.press('f')
    await expect.poll(async () => (await guards(page))[2].state).toBe('stagger')
    await expect.poll(async () => (await combat(page)).context, { intervals: [30] }).toBe('finisher')
    await page.keyboard.press('f')
    await expect.poll(async () => (await guards(page))[2].state).toBe('ko')
  })

  test('a guard that sees him comes over and punches; he is knocked back but unhurt', async ({ page }) => {
    await boot(page)
    // In the lamplight, in front of the first guard.
    await setUp(page, 5.5, { i: 0, facing: -1 })
    await expect.poll(async () => (await guards(page))[0].state, { timeout: 15_000 }).toBe('alert')
    const before = await thief(page)
    await expect.poll(async () => Math.abs((await thief(page)).x - before.x), { timeout: 15_000 }).toBeGreaterThan(0.3)
    expect((await thief(page)).mode).not.toBe('dead')
  })

  test('dodge dashes him away', async ({ page }) => {
    await boot(page)
    await setUp(page, 3.5)
    await expect.poll(async () => (await thief(page)).mode).toBe('ground')
    const before = await thief(page)
    await page.keyboard.press('q')
    await expect.poll(async () => Math.abs((await thief(page)).x - before.x)).toBeGreaterThan(1)
  })

  test('a blink aimed at an unaware guard lands behind it and stuns it, then Attack finishes it', async ({ page }) => {
    await boot(page)
    await setUp(page, 4.6, { i: 0, facing: 1 })
    const at = await worldToCss(page, 8, 11.2)
    await page.mouse.move(at.x, at.y)
    await page.mouse.down({ button: 'right' })
    await page.waitForTimeout(200)
    await page.mouse.up({ button: 'right' })
    await expect.poll(async () => (await guards(page))[0].state, { timeout: 15_000, intervals: [30] }).toBe('stunned')
    await page.keyboard.press('f')
    expect((await thief(page)).x).toBeLessThan(8)
    await expect.poll(async () => (await guards(page))[0].state).toBe('ko')
  })
})

test.describe('combat on touch', () => {
  test.use({ viewport: { width: 412, height: 915 }, hasTouch: true })

  test('Attack and Dodge sit beside the diamond without overlapping it, and Attack takes a guard down', async ({ page }) => {
    await boot(page, '/?touch=1')
    const names = ['Jump', 'Grab', 'Sneak', 'Blink', 'Attack', 'Dodge']
    const boxes = await Promise.all(names.map(async (n) => (await page.getByRole('button', { name: n }).boundingBox())!))
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]
        const b = boxes[j]
        const apart = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y
        expect(apart, `${names[i]} and ${names[j]} overlap`).toBe(true)
      }
    }
    await setUp(page, 7.1, { i: 0, facing: 1 })
    await expect.poll(async () => (await combat(page)).context).toBe('behind')
    await page.getByTestId('attack').click()
    await expect.poll(async () => (await guards(page))[0].state).toBe('ko')
  })
})
