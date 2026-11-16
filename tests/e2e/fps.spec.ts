import { expect, test, type Page } from '@playwright/test'

// The first-person game (History #92–#109) in the Test Wing. Positions are in S, y up, z south.
// The headless browser renders on the CPU at a few frames a second, so tests poll generously.
test.use({ viewport: { width: 760, height: 480 } })

interface FpsState {
  x: number
  y: number
  z: number
  yaw: number
  pitch: number
  mode: string
  posture: string
  crouch: boolean
  sliding: boolean
  grip: number
  charges: number
  light: number
  lean: number
  blink: string | null
  landing: { x: number; y: number; z: number; surface: string; glass: boolean; cut: boolean; posture: string } | null
  speed: number
  hits: number
}
interface GuardState { x: number; z: number; state: string; pieces: number; rim: string | null }
interface CombatState { context: string | null; rim: string | null; takedown: string | null; glyph: string }

type Hooks = {
  state: () => FpsState
  guards: () => GuardState[]
  combat: () => CombatState
  place: (x: number, y: number, z: number, yaw?: number, pitch?: number) => void
  look: (yaw: number, pitch: number) => void
  holdGuard: (i: number, fx: number, fz: number) => void
  freezeGuard: (i: number, fx: number, fz: number) => void
  aimBlink: (x: number, z: number) => void
  mapPoint: (x: number, y: number, z: number) => [number, number] | null
}
const run = <A extends unknown[], T>(page: Page, fn: (h: Hooks, ...a: A) => T, ...args: A): Promise<T> =>
  page.evaluate(([src, a]) => new Function('h', 'a', `return (${src})(h, ...a)`)((window as unknown as { __fps: unknown }).__fps, a), [fn.toString(), args] as const) as Promise<T>
const state = (page: Page) => run(page, (h) => h.state())
const guards = (page: Page) => run(page, (h) => h.guards())
const combat = (page: Page) => run(page, (h) => h.combat())

// Facing: yaw 0 looks north (-z), -π/2 east (+x), π/2 west, π south.
const EAST = -Math.PI / 2, NORTH = 0, SOUTH = Math.PI

async function boot(page: Page, query = '') {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto(`/?nolock=1${query}`)
  await expect.poll(() => page.evaluate(() => typeof (window as unknown as { __fps?: unknown }).__fps), { timeout: 20_000 }).toBe('object')
  await expect.poll(async () => (await state(page)).mode, { timeout: 15_000 }).toBe('ground')
  return errors
}

const poll = { timeout: 20_000, intervals: [60] }

test.describe('first person: moving', () => {
  test('boots with no errors, walks, runs faster, crouches to sneak and jumps', async ({ page }) => {
    const errors = await boot(page, '&guards=0')
    await expect(page.locator('canvas')).toHaveCount(2)
    await expect(page.getByTestId('charges')).toBeVisible()
    const start = await state(page)
    await page.keyboard.down('w')
    await expect.poll(async () => (await state(page)).speed, poll).toBeGreaterThan(2.3)
    expect((await state(page)).speed).toBeLessThan(3)
    await page.keyboard.down('Shift')
    await expect.poll(async () => (await state(page)).speed, poll).toBeGreaterThan(4.2)
    await page.keyboard.up('Shift')
    await page.keyboard.up('w')
    expect((await state(page)).x).toBeGreaterThan(start.x + 0.5)
    await page.keyboard.press('c')
    await expect.poll(async () => (await state(page)).posture, poll).toBe('crouch')
    await expect(page.getByTestId('sneaking')).toBeVisible()
    await page.keyboard.press('c')
    await expect.poll(async () => (await state(page)).posture, poll).toBe('stand')
    await page.keyboard.down('Space')
    await expect.poll(async () => (await state(page)).y, poll).toBeGreaterThan(0.4)
    await page.keyboard.up('Space')
    await expect.poll(async () => (await state(page)).mode, poll).toBe('ground')
    expect(errors).toEqual([])
  })

  test('slides from a run, ducks into the duct and crawls into the vent', async ({ page }) => {
    await boot(page, '&guards=0')
    await run(page, (h, n: number) => h.place(4.5, 0, 21, n, 0), NORTH)
    await page.keyboard.down('Shift')
    await page.keyboard.down('w')
    await expect.poll(async () => (await state(page)).speed, poll).toBeGreaterThan(4.2)
    await page.keyboard.press('c')
    await expect.poll(async () => (await state(page)).sliding, poll).toBe(true)
    await page.keyboard.up('Shift')
    await expect.poll(async () => (await state(page)).z, { ...poll, timeout: 40_000 }).toBeLessThan(12.6)
    await page.keyboard.up('w')
    expect((await state(page)).posture).toBe('crawl')
  })

  test('leans round a corner with Alt', async ({ page }) => {
    await boot(page, '&guards=0')
    await page.keyboard.down('Alt')
    await page.keyboard.down('a')
    await expect.poll(async () => (await state(page)).lean, poll).toBeLessThan(-0.3)
    await page.keyboard.up('a')
    await page.keyboard.up('Alt')
    await expect.poll(async () => Math.abs((await state(page)).lean), poll).toBeLessThan(0.05)
  })
})

test.describe('first person: climbing', () => {
  test('grabs the balcony wall, climbs it and pulls up onto the balcony', async ({ page }) => {
    await boot(page, '&guards=0')
    await run(page, (h, n: number) => h.place(20.5, 0, 9.6, n, 0), NORTH)
    await page.keyboard.press('e')
    await expect.poll(async () => (await state(page)).mode, poll).toBe('wall')
    await page.keyboard.down('w')
    await expect.poll(async () => { const s = await state(page); return s.mode === 'ground' && Math.abs(s.y - 2) < 0.01 }, { ...poll, timeout: 40_000 }).toBe(true)
    await page.keyboard.up('w')
    expect((await state(page)).z).toBeLessThan(9)
  })

  test('jumps and grabs the low corridor ceiling, moves along it, and lets go', async ({ page }) => {
    await boot(page, '&guards=0')
    await run(page, (h, n: number) => h.place(34.5, 0, 12, n, 0.7), EAST)
    // A full jump (Space held), grabbing on the way up.
    await page.keyboard.down('Space')
    await expect.poll(async () => (await state(page)).y, poll).toBeGreaterThan(0.3)
    await page.keyboard.press('e')
    await expect.poll(async () => (await state(page)).mode, poll).toBe('ceiling')
    await page.keyboard.up('Space')
    const hung = await state(page)
    await page.keyboard.down('w')
    await expect.poll(async () => (await state(page)).x, poll).toBeGreaterThan(hung.x + 0.4)
    await page.keyboard.up('w')
    expect((await state(page)).grip).toBeLessThan(1)
    await page.keyboard.press('e')
    await expect.poll(async () => (await state(page)).mode, poll).toBe('ground')
  })
})

test.describe('first person: blink from the top-down view', () => {
  /** Where a spot on the ground shows in the open blink view, in page pixels. */
  const onMap = async (page: Page, x: number, y: number, z: number) => {
    const box = (await page.locator('[data-game-root]').boundingBox())!
    const p = (await run(page, (h, a: number, b: number, c: number) => h.mapPoint(a, b, c), x, y, z))!
    return { x: box.x + p[0], y: box.y + p[1] }
  }

  test('the right button opens the view and it stays open; a click on the catwalk blinks there and it closes', async ({ page }) => {
    const errors = await boot(page, '&guards=0')
    await run(page, (h, n: number) => h.place(20, 0, 15, n, 0), EAST)
    const box = (await page.locator('[data-game-root]').boundingBox())!
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' })
    await expect.poll(async () => (await state(page)).blink, poll).toBe('aim')
    // Let go long since: still open.
    await page.waitForTimeout(400)
    expect((await state(page)).blink).toBe('aim')
    const at = await onMap(page, 23.5, 2.75, 13.7)
    await page.mouse.move(at.x, at.y)
    await expect.poll(async () => (await state(page)).landing?.surface, poll).toBe('catwalk')
    await page.mouse.down()
    await page.mouse.up()
    await expect.poll(async () => { const s = await state(page); return s.blink === null && Math.abs(s.y - 2.75) < 0.01 }, poll).toBe(true)
    expect((await state(page)).charges).toBe(4)
    expect(errors).toEqual([])
  })

  test('the right button again closes it without blinking or spending a charge', async ({ page }) => {
    await boot(page, '&guards=0')
    await run(page, (h, n: number) => h.place(20, 0, 15, n, 0), EAST)
    await page.mouse.click(380, 240, { button: 'right' })
    await expect.poll(async () => (await state(page)).blink, poll).toBe('aim')
    await run(page, (h) => h.aimBlink(23.5, 13.7))
    await page.mouse.click(380, 240, { button: 'right' })
    await expect.poll(async () => (await state(page)).blink, poll).toBeNull()
    const s = await state(page)
    expect(s.charges).toBe(5)
    expect(Math.hypot(s.x - 20, s.z - 15)).toBeLessThan(0.05)
    expect(s.y).toBeCloseTo(0, 3)
  })

  test('goes through the glass office wall, and a thick wall stops it', async ({ page }) => {
    await boot(page, '&guards=0')
    await run(page, (h, n: number) => h.place(23.5, 0, 20.5, n, 0), EAST)
    await page.mouse.click(380, 240, { button: 'right' })
    await expect.poll(async () => (await state(page)).blink, poll).toBe('aim')
    await run(page, (h) => h.aimBlink(28, 23.5))
    await expect.poll(async () => (await state(page)).landing?.cut, poll).toBe(true)
    const at = await onMap(page, 19.5, 0, 20.5)
    await page.mouse.move(at.x, at.y)
    await expect.poll(async () => (await state(page)).landing?.glass, poll).toBe(true)
    await page.mouse.down()
    await page.mouse.up()
    await expect.poll(async () => (await state(page)).x, poll).toBeLessThan(21.9)
  })
})

test.describe('first person: guards and fighting', () => {
  test('from behind: the guard is outlined, a tap knocks it out, a hold kills it and it shatters', async ({ page }) => {
    const errors = await boot(page)
    await run(page, (h, n: number) => { h.holdGuard(0, 1, 0); h.place(13.4, 0, 17.5, n, -0.15) }, EAST)
    await expect.poll(async () => (await combat(page)).context, poll).toBe('behind')
    expect(await combat(page)).toMatchObject({ rim: 'ko', glyph: 'key' })
    await page.keyboard.press('f')
    await expect.poll(async () => (await guards(page))[0].state, poll).toBe('ko')
    await expect.poll(async () => (await combat(page)).takedown, poll).toBeNull()

    await run(page, (h, n: number) => { h.holdGuard(0, 1, 0); h.place(13.4, 0, 17.5, n, -0.15) }, EAST)
    await expect.poll(async () => (await combat(page)).context, poll).toBe('behind')
    await page.keyboard.down('f')
    await expect.poll(async () => (await guards(page))[0].state, poll).toBe('dead')
    await page.keyboard.up('f')
    expect((await guards(page))[0].pieces).toBeGreaterThan(0)
    expect(errors).toEqual([])
  })

  test('drops onto the guard below the balcony', async ({ page }) => {
    await boot(page)
    await run(page, (h, n: number) => { h.holdGuard(1, 0, 1); h.place(24.5, 2, 8.4, n, -0.5) }, SOUTH)
    await expect.poll(async () => (await combat(page)).context, poll).toBe('drop')
    await page.keyboard.press('f')
    await expect.poll(async () => (await guards(page))[1].state, poll).toBe('ko')
    await expect.poll(async () => { const s = await state(page); return s.mode === 'ground' && s.y < 0.05 }, poll).toBe(true)
  })

  test('the combo staggers a guard, and a finisher takes it down', async ({ page }) => {
    await boot(page)
    await run(page, (h, n: number) => { h.freezeGuard(0, -1, 0); h.place(13.6, 0, 17.5, n, -0.15) }, EAST)
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('f')
      await page.waitForTimeout(120)
    }
    await expect.poll(async () => (await guards(page))[0].state, poll).toBe('stagger')
    await expect.poll(async () => (await combat(page)).context, poll).toBe('finisher')
    await page.keyboard.press('f')
    await expect.poll(async () => (await guards(page))[0].state, poll).toBe('ko')
  })

  test('a guard that sees him comes over and punches; he is knocked back but unhurt', async ({ page }) => {
    await boot(page)
    // In the corridor's lamplight, in front of the first guard, facing it.
    await run(page, (h, n: number) => { h.holdGuard(0, -1, 0); h.place(11.5, 0, 17.5, n, 0) }, EAST)
    await expect.poll(async () => (await guards(page))[0].state, { ...poll, timeout: 40_000 }).toBe('alert')
    await expect.poll(async () => (await state(page)).hits, { ...poll, timeout: 40_000 }).toBeGreaterThan(0)
    expect((await state(page)).mode).not.toBe('dead')
  })

  test('the dodge dashes him away', async ({ page }) => {
    await boot(page, '&guards=0')
    const before = await state(page)
    await page.keyboard.press('q')
    await expect.poll(async () => Math.abs((await state(page)).x - before.x), poll).toBeGreaterThan(0.6)
  })
})

test.describe('first person on touch', () => {
  test.use({ viewport: { width: 412, height: 915 }, hasTouch: true })

  test('buttons sit apart, the pad walks, and Attack takes a guard down', async ({ page }) => {
    await boot(page, '&touch=1')
    const names = ['Attack', 'Jump', 'Crouch', 'Grab', 'Blink', 'Dodge', 'Lean left', 'Lean right']
    const boxes = await Promise.all(names.map(async (n) => (await page.getByRole('button', { name: n }).boundingBox())!))
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j]
        const apart = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y
        expect(apart, `${names[i]} and ${names[j]} overlap`).toBe(true)
      }
    }
    await run(page, (h, n: number) => { h.holdGuard(0, 1, 0); h.place(13.4, 0, 17.5, n, -0.15) }, EAST)
    await expect.poll(async () => (await combat(page)).context, poll).toBe('behind')
    expect((await combat(page)).glyph).toBe('touch')
    await page.getByTestId('attack').click()
    await expect.poll(async () => (await guards(page))[0].state, poll).toBe('ko')
  })

  test('tapping Blink opens the view, a tap on the catwalk goes straight there, and Blink again closes it', async ({ page }) => {
    await boot(page, '&touch=1&guards=0')
    await run(page, (h, n: number) => h.place(20, 0, 15, n, 0), EAST)
    const blink = page.getByTestId('blink')
    await blink.tap()
    await expect(blink).toHaveAttribute('aria-pressed', 'true', { timeout: 20_000 })
    await blink.tap()
    await expect(blink).toHaveAttribute('aria-pressed', 'false', { timeout: 20_000 })
    expect((await state(page)).charges).toBe(5)
    await blink.tap()
    await expect(blink).toHaveAttribute('aria-pressed', 'true', { timeout: 20_000 })
    const box = (await page.locator('[data-game-root]').boundingBox())!
    const p = (await run(page, (h) => h.mapPoint(23.5, 2.75, 13.7)))!
    await page.touchscreen.tap(box.x + p[0], box.y + p[1])
    await expect.poll(async () => { const s = await state(page); return s.blink === null && Math.abs(s.y - 2.75) < 0.01 }, poll).toBe(true)
    expect((await state(page)).charges).toBe(4)
  })
})
