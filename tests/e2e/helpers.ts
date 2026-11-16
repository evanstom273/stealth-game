import { expect, type Page } from '@playwright/test'

export interface ThiefState {
  x: number
  y: number
  mode: string
  state: string
  charges: number
  grip: number
  facing: number
  sneaking: boolean
  climb: string | null
  light: number
}

/** The thief's state, through the development-only debug hook. Positions are in units of S. */
export const thief = (page: Page) => page.evaluate(() => (window as unknown as { __thief: () => ThiefState }).__thief())

export async function boot(page: Page, path = '/') {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto(path)
  await expect(page.locator('canvas')).toHaveCount(1)
  await expect.poll(() => page.evaluate(() => typeof (window as unknown as { __thief?: unknown }).__thief)).toBe('function')
  await expect.poll(async () => (await thief(page)).mode, { timeout: 10_000 }).toBe('ground')
  return errors
}

/** Holds a key until the condition holds (checked against his state), then lets go. */
export async function holdUntil(page: Page, key: string, until: (t: ThiefState) => boolean, timeout = 20_000) {
  await page.keyboard.down(key)
  try {
    await expect.poll(async () => until(await thief(page)), { timeout, intervals: [50] }).toBe(true)
  } finally {
    await page.keyboard.up(key)
  }
}

/** Where a point in the world (units of S) is on screen, in CSS pixels. */
export const worldToCss = (page: Page, x: number, y: number) =>
  page.evaluate(([wx, wy]) => (window as unknown as { __worldToCss: (x: number, y: number) => { x: number; y: number } }).__worldToCss(wx, wy), [x, y])

export interface GuardState {
  x: number
  state: string
  facing: number
  suspicion: number
  /** Pieces still flying or fading from a kill. */
  pieces: number
  /** Its outline: a takedown is on it. */
  rim: 'ko' | 'kill' | null
}

export interface CombatState {
  step: number
  attacking: boolean
  charging: boolean
  takedown: string | null
  /** A pounce's phase, or 'move' for every other takedown. */
  phase: 'windup' | 'leap' | 'pin' | 'off' | 'move' | null
  context: string | null
  rim: 'ko' | 'kill' | null
  /** The Attack button the prompt shows. */
  glyph: 'key' | 'mouse' | 'pad' | 'touch'
}

export const guards = (page: Page) => page.evaluate(() => (window as unknown as { __guards: () => GuardState[] }).__guards())
export const combat = (page: Page) => page.evaluate(() => (window as unknown as { __combat: () => CombatState }).__combat())

/** Starts recording each takedown phase in order, every frame, so short phases aren't missed. */
export const recordPhases = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __combat: () => CombatState; __phases: string[] }
    const seen: string[] = []
    w.__phases = seen
    const tick = () => {
      const p = w.__combat().phase
      if (p && seen[seen.length - 1] !== p) seen.push(p)
      if (!seen.length || p) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
export const phases = (page: Page) => page.evaluate(() => (window as unknown as { __phases: string[] }).__phases)

/** Testing hooks: stand him somewhere, and keep a guard calm facing one way. Units of S. */
export async function setUp(page: Page, thiefX: number, guard?: { i: number; facing: 1 | -1 }) {
  await page.evaluate(
    ([x, g]) => {
      const t = (window as unknown as { __test: { placeThief: (x: number, y: number) => void; holdGuard: (i: number, f: 1 | -1) => void } }).__test
      if (g) t.holdGuard(g.i, g.facing)
      t.placeThief(x, 12)
    },
    [thiefX, guard ?? null] as const,
  )
}
