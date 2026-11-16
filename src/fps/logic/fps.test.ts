import { describe, expect, it } from 'vitest'
import { buildLevel, type Box, type Level } from '../level/level.ts'
import { TEST_WING } from '../level/testWing.ts'
import { mapToScreen, screenToMap } from '../render/hud.ts'
import { BODY, SIGHT, TAKEDOWN } from '../tuning.ts'
import { makeBody, moveBody } from './body.ts'
import { stepCeiling, stepWall, tryGrab } from './climb.ts'
import { findPath, guardSees, holdOutcome, lightAt, resolveBlink, takedownOn, type GuardView, type PlayerView } from './rules.ts'

// A small room: a ledge two high in the middle, a low step, a crate, and a glass wall near the east side.
//   x: 0 1 2 3 4 5 6 7 8 9 10 11
const MAP = [
  '############',
  '#..........#',
  '#..........#',
  '#...bb.....#',
  '#..........#',
  '#..s.......#',
  '#..........#',
  '############',
]
const legend = {
  '#': { floor: 0, ceil: 0, name: 'wall', wall: true },
  '.': { floor: 0, ceil: 3, name: 'floor' },
  b: { floor: 2, ceil: 4, name: 'ledge' },
  s: { floor: 0.3, ceil: 3, name: 'step' },
}
const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, kind: Box['kind'], name: string): Box => ({ x0, y0, z0, x1, y1, z1, kind, name })
const L: Level = buildLevel(MAP, legend, {
  boxes: [box(6, 0, 5, 7, 1, 6, 'crate', 'crate')],
  thin: [box(8.96, 0, 1, 9.04, 3, 3, 'glass', 'glass')],
  lamps: [{ x: 2, y: 2.8, z: 2 }],
  checkpoints: [],
  spawn: { x: 1.5, y: 0, z: 1.5, yaw: 0 },
  guards: [],
  pipe: null,
})

const run = (b: ReturnType<typeof makeBody>, vx: number, vz: number, seconds: number) => {
  for (let t = 0; t < seconds; t += 1 / 60) {
    b.vx = vx; b.vz = vz
    if (!b.grounded) b.vy -= 18 / 60
    moveBody(L, b, 1 / 60, { stepUp: BODY.stepUp, stepDown: BODY.stepDown })
  }
}

describe('moving through the level', () => {
  it('stops at walls', () => {
    const b = makeBody(1.5, 0, 1.5, BODY.r, BODY.standH)
    run(b, -2, 0, 1)
    expect(b.x).toBeGreaterThanOrEqual(1 + BODY.r - 1e-3)
  })
  it('steps up a low step, but not up a ledge two high', () => {
    const b = makeBody(2.5, 0, 5.5, BODY.r, BODY.standH)
    run(b, 1, 0, 0.9)
    expect(b.y).toBeCloseTo(0.3, 3)
    const c = makeBody(4.5, 0, 5.2, BODY.r, BODY.standH)
    run(c, 0, -2, 1.5)
    expect(c.y).toBe(0)
    expect(c.z).toBeGreaterThanOrEqual(4 + BODY.r - 1e-3)
  })
  it('falls and lands, and bumps its head on a ceiling', () => {
    const b = makeBody(2.5, 2, 1.5, BODY.r, BODY.standH)
    b.grounded = false
    run(b, 0, 0, 1)
    expect(b.y).toBe(0)
    expect(b.grounded).toBe(true)
    const c = makeBody(2.5, 0, 1.5, BODY.r, BODY.standH)
    c.vy = 12; c.grounded = false
    moveBody(L, c, 0.2, { stepUp: 0, stepDown: 0 })
    expect(c.y + c.h).toBeLessThanOrEqual(3 + 1e-6)
  })
})

describe('climbing', () => {
  it('holds a wall too high to pull up onto, climbs it, and mantles onto the top', () => {
    const b = makeBody(4.5, 0, 4.4, BODY.r, BODY.standH)
    const g = tryGrab(L, b, 0, 0)
    expect(g?.kind).toBe('wall')
    if (g?.kind !== 'wall') return
    let res = stepWall(L, b, g.face, 1, 0, 1 / 60)
    for (let i = 0; i < 400 && res.kind === 'hold'; i++) res = stepWall(L, b, g.face, 1, 0, 1 / 60)
    expect(res.kind).toBe('mantle')
    if (res.kind === 'mantle') {
      expect(res.y).toBe(2)
      expect(res.z).toBeLessThan(4)
    }
  })
  it('pulls straight up onto a crate within reach', () => {
    const b = makeBody(5.5, 0, 5.5, BODY.r, BODY.standH)
    // Facing east, at the crate.
    const g = tryGrab(L, b, -Math.PI / 2, 0)
    expect(g).toMatchObject({ kind: 'mantle', y: 1 })
  })
  it('climbing down a wall to the floor lets go', () => {
    const b = makeBody(4.5, 1, 4.4, BODY.r, BODY.standH)
    const face = { nx: 0, nz: 1, plane: 4 }
    let res = stepWall(L, b, face, -1, 0, 1 / 60)
    for (let i = 0; i < 200 && res.kind === 'hold'; i++) res = stepWall(L, b, face, -1, 0, 1 / 60)
    expect(res.kind).toBe('ground')
    expect(b.y).toBe(0)
  })
  it('grabs a ceiling in reach when looking up, and moves along it but not past a wall', () => {
    const b = makeBody(2.5, 0.8, 1.5, BODY.r, BODY.standH)
    const g = tryGrab(L, b, 0, 0.6)
    expect(g).toEqual({ kind: 'ceiling', ceilY: 3 })
    const h = makeBody(2.5, 3 - BODY.hangH, 2.5, BODY.r, BODY.hangH)
    for (let i = 0; i < 120; i++) stepCeiling(L, h, 3, 0, -1, 0, 1 / 60)
    expect(h.x).toBeLessThan(2.5)
    expect(h.x).toBeGreaterThan(1)
    // Along the ceiling into the west wall: round onto it.
    let res = stepCeiling(L, h, 3, 0, -1, 0, 1 / 60)
    for (let i = 0; i < 300 && res.kind === 'hold'; i++) res = stepCeiling(L, h, 3, 0, -1, 0, 1 / 60)
    expect(res.kind).toBe('wall')
  })
})

describe('blink, from above', () => {
  const from = { x: 1.5, y: 0, z: 1.5 }
  it('lands on the highest surface it fits on, and says how far up that is', () => {
    const r = resolveBlink(L, from, 4.5, 3.5, 6)
    expect(r).toMatchObject({ y: 2, surface: 'ledge', rise: 2, posture: 'stand', cut: false })
  })
  it('goes through glass but is stopped by a thick wall', () => {
    const g = resolveBlink(L, { x: 7.5, y: 0, z: 2 }, 10.5, 2, 6)
    expect(g?.glass).toBe(true)
    expect(g!.x).toBeGreaterThan(9)
    const w = resolveBlink(L, { x: 7.5, y: 0, z: 2 }, 13, 2, 6)
    expect(w?.cut).toBe(true)
    expect(w!.x).toBeLessThanOrEqual(11 - BODY.r + 1e-3)
  })
  it('never goes further than its range', () => {
    const r = resolveBlink(L, from, 10.5, 1.5, 6)!
    expect(Math.hypot(r.x - from.x, r.z - from.z)).toBeLessThanOrEqual(6 + 1e-6)
  })
  it('lands crouched or crawling where the room is low', () => {
    const vent = resolveBlink(TEST_WING, { x: 4.5, y: 0, z: 15 }, 4.5, 11.5, 6)
    expect(vent?.posture).toBe('crawl')
    const duct = resolveBlink(TEST_WING, { x: 4.5, y: 0, z: 15 }, 4.5, 13.5, 6)
    expect(duct?.posture).toBe('crouch')
  })
})

describe('picking a spot in the blink view', () => {
  const mid = { x: 2.5, y: 0, z: 5.5 }
  it('a click on the ledge or the crate picks the top of it, not the floor its lean falls over', () => {
    for (const [x, y, z] of [[4.6, 2, 3.4], [6.5, 1, 5.5], [8, 0, 2.2]]) {
      const [sx, sy] = mapToScreen(760, 480, mid, x, y, z)
      const p = screenToMap(L, 760, 480, mid, sx, sy)
      expect(p.x).toBeCloseTo(x, 4)
      expect(p.z).toBeCloseTo(z, 4)
    }
  })
})

describe('guards seeing him', () => {
  const eye = { x: 2, y: 1.45, z: 6 }
  it('sees ahead in its cone, further in light, and not through a ledge', () => {
    expect(guardSees(L, eye, 1, 0, false, { x: 6, y: 1, z: 6 }, 1, SIGHT)).toBe(true)
    expect(guardSees(L, eye, 1, 0, false, { x: 6, y: 1, z: 6 }, 0, SIGHT)).toBe(false)
    expect(guardSees(L, eye, -1, 0, false, { x: 6, y: 1, z: 6 }, 1, SIGHT)).toBe(false)
    expect(guardSees(L, eye, -1, 0, true, { x: 6, y: 1, z: 6 }, 1, SIGHT)).toBe(true)
    expect(guardSees(L, { x: 4.5, y: 1.45, z: 5.5 }, 0, -1, false, { x: 4.5, y: 1, z: 1.5 }, 1, SIGHT)).toBe(false)
  })
})

describe('takedowns', () => {
  const guard = (over: Partial<GuardView> = {}): GuardView => ({ x: 5, y: 0, z: 2, fx: 1, fz: 0, unaware: true, open: false, down: false, ...over })
  // Looking east along x.
  const player = (over: Partial<PlayerView> = {}): PlayerView => ({ x: 4, y: 0, z: 2, eye: 1.22, yaw: -Math.PI / 2, pitch: -0.2, grounded: true, climbing: false, ...over })
  it('from behind, looking at it, but not from in front or looking away', () => {
    expect(takedownOn(L, player(), guard(), TAKEDOWN)).toBe('behind')
    expect(takedownOn(L, player(), guard({ fx: -1 }), TAKEDOWN)).toBeNull()
    expect(takedownOn(L, player({ yaw: Math.PI / 2 }), guard(), TAKEDOWN)).toBeNull()
    expect(takedownOn(L, player(), guard({ unaware: false }), TAKEDOWN)).toBeNull()
  })
  it('a finisher on a staggered guard in front', () => {
    expect(takedownOn(L, player(), guard({ fx: -1, unaware: false, open: true }), TAKEDOWN)).toBe('finisher')
  })
  it('dropping onto one from the ledge above it', () => {
    const p = player({ x: 4.5, y: 2, z: 3.8, yaw: 0, pitch: -0.9 })
    const g = guard({ x: 4.5, z: 5.3, fx: 0, fz: 1 })
    // On the ledge looking north, away: no. Looking down at it to the south: yes.
    expect(takedownOn(L, p, g, TAKEDOWN)).toBeNull()
    expect(takedownOn(L, { ...p, yaw: Math.PI }, g, TAKEDOWN)).toBe('drop')
  })
  it('tap to knock out, hold to kill', () => {
    expect(holdOutcome(0.1, true, 0.35)).toBe('ko')
    expect(holdOutcome(0.1, false, 0.35)).toBeNull()
    expect(holdOutcome(0.35, false, 0.35)).toBe('kill')
  })
})

describe('light and finding the way', () => {
  it('is lit near a lamp, dark far off, and never through a thick wall', () => {
    expect(lightAt(L, 2.2, 2)).toBe(1)
    expect(lightAt(L, 9.5, 6)).toBeLessThan(0.2)
    expect(lightAt(TEST_WING, 4.5, 15)).toBeGreaterThan(0.5)
    // The vault lamp doesn't light the corridor through the wall.
    expect(lightAt(TEST_WING, 12, 17.5)).toBeLessThan(lightAt(TEST_WING, 10, 17.5))
  })
  it('guards path round the ledge and stop short of what they can not reach', () => {
    const path = findPath(L, [2, 3], [7, 3], 0, 1.7)!
    expect(path[0]).toEqual([2, 3])
    expect(path[path.length - 1]).toEqual([7, 3])
    expect(path.some(([c, r]) => r === 3 && (c === 4 || c === 5))).toBe(false)
    // Onto the ledge itself it can't go: it gets as close as it can.
    const up = findPath(L, [2, 3], [4, 3], 0, 1.7)!
    expect(up[up.length - 1]).not.toEqual([4, 3])
  })
})
