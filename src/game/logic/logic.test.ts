import { describe, expect, it } from 'vitest'
import { resolveBlink, clampToRange } from './blink.ts'
import { climbStep, findGrab, type ClimbConfig } from './climb.ts'
import { isFree, segmentEntry, type Rect } from './geometry.ts'
import { stepGrip } from './grip.ts'
import { lightAt } from './light.ts'
import { landingNoise, noiseFor, NOISE } from './noise.ts'

const S = 64
const W = 0.8 * S
const H = 1.31 * S

const climbCfg: ClimbConfig = {
  wallSpeed: 1.6 * S,
  ceilingSpeed: 1.3 * S,
  reachSide: 0.6 * S,
  reachUp: 0.8 * S,
  wallGap: 0.35 * S,
  ceilingGap: 0.41 * S,
  minWallFace: 0.6 * S,
  mantleInset: 0.1 * S,
}

const blinkCfg = {
  range: 5 * S,
  thinMax: 0.5 * S,
  body: { w: W, h: H },
  reachSide: 0.6 * S,
  reachUp: 0.8 * S,
  wallGap: 0.35 * S,
  ceilingGap: 0.41 * S,
  minWallFace: 0.6 * S,
  standSnap: 0.35 * S,
}

// A simple room: floor at y = 768, ceiling underside at 0, a tall wall on the right at x = 640.
const floor: Rect = { x: -1000, y: 768, w: 3000, h: 64 }
const ceiling: Rect = { x: -1000, y: -64, w: 3000, h: 64 }
const wall: Rect = { x: 640, y: 0, w: 64, h: 768 }
const room = [floor, ceiling, wall]
const standing = (x: number): Rect => ({ x, y: 768 - H, w: W, h: H })

describe('geometry', () => {
  it('finds where a segment enters a rectangle', () => {
    const r = { x: 10, y: -5, w: 10, h: 10 }
    expect(segmentEntry({ x: 0, y: 0 }, { x: 40, y: 0 }, r)).toBeCloseTo(0.25)
    expect(segmentEntry({ x: 0, y: 20 }, { x: 40, y: 20 }, r)).toBeNull()
    expect(segmentEntry({ x: 15, y: 0 }, { x: 40, y: 0 }, r)).toBe(0)
  })
})

describe('light', () => {
  const lamps = [{ x: 0, y: 0 }]
  it('is full near a lamp and falls to nothing at its edge', () => {
    expect(lightAt({ x: 10, y: 0 }, lamps, 100, 0.25)).toBe(1)
    expect(lightAt({ x: 100, y: 0 }, lamps, 100, 0.25)).toBe(0)
    const mid = lightAt({ x: 62.5, y: 0 }, lamps, 100, 0.25)
    expect(mid).toBeGreaterThan(0.4)
    expect(mid).toBeLessThan(0.6)
  })
  it('takes the brightest lamp', () => {
    expect(lightAt({ x: 200, y: 0 }, [{ x: 0, y: 0 }, { x: 205, y: 0 }], 100, 0.25)).toBe(1)
  })
})

describe('grip', () => {
  const rates = { wallSeconds: 6, ceilingSeconds: 3, recoverSeconds: 1.5 }
  it('drains on walls, twice as fast on ceilings, and recovers on the ground', () => {
    expect(stepGrip(1, 'wall', 3, rates)).toBeCloseTo(0.5)
    expect(stepGrip(1, 'ceiling', 1.5, rates)).toBeCloseTo(0.5)
    expect(stepGrip(0.5, 'ground', 0.75, rates)).toBeCloseTo(1)
    expect(stepGrip(0.5, 'air', 5, rates)).toBe(0.5)
    expect(stepGrip(0.1, 'wall', 10, rates)).toBe(0)
  })
})

describe('noise', () => {
  it('is silent sneaking, soft walking, loud running, and loud climbing metal', () => {
    expect(noiseFor('sneak', false)).toBe(NOISE.silent)
    expect(noiseFor('walk', false)).toBe(NOISE.soft)
    expect(noiseFor('run', false)).toBe(NOISE.loud)
    expect(noiseFor('climb', false)).toBe(NOISE.soft)
    expect(noiseFor('climb', true)).toBe(NOISE.loud)
  })
  it('makes harder landings louder', () => {
    expect(landingNoise(3, true)).toBe(NOISE.silent)
    expect(landingNoise(8, false)).toBe(NOISE.noticeable)
    expect(landingNoise(14, false)).toBe(NOISE.loud)
  })
})

describe('grabbing', () => {
  it('takes hold of a wall he is facing, a gap away from it', () => {
    const g = findGrab(standing(640 - W - 10), 1, false, room, climbCfg)
    expect(g?.kind).toBe('climb')
    if (g?.kind !== 'climb') return
    expect(g.climb.mode).toBe('wall')
    expect(g.climb.side).toBe(1)
    expect(g.box.x + g.box.w).toBeCloseTo(640 - climbCfg.wallGap)
  })
  it('hangs from a ceiling within reach when pressing up', () => {
    const box = { x: 200, y: 0.5 * S, w: W, h: H }
    const g = findGrab(box, 1, true, room, climbCfg)
    expect(g?.kind).toBe('climb')
    if (g?.kind !== 'climb') return
    expect(g.climb.mode).toBe('ceiling')
    expect(g.box.y).toBeCloseTo(climbCfg.ceilingGap)
  })
  it('climbs onto a ledge whose edge is within reach', () => {
    const ledge = { x: 300, y: 768 - 1.5 * S, w: 4 * S, h: 0.4 * S }
    const g = findGrab(standing(300 - W - 5), 1, false, [floor, ledge], climbCfg)
    expect(g?.kind).toBe('mantle')
    expect(g?.box.y).toBeCloseTo(ledge.y - H)
  })
  it('climbs onto a ledge he is partly underneath', () => {
    const ledge = { x: 300, y: 768 - 2 * S, w: 4 * S, h: 0.4 * S }
    // Just past the ledge's end, his head a little below its underside.
    const box = { x: 300 - W / 2 + 3, y: ledge.y + ledge.h + 0.28 * S, w: W, h: H }
    const g = findGrab(box, 1, false, [floor, ledge], climbCfg)
    expect(g?.kind).toBe('mantle')
    expect(g?.box.y).toBeCloseTo(ledge.y - H)
  })
  it('finds nothing in the open', () => {
    expect(findGrab(standing(100), 1, false, [floor], climbCfg)).toBeNull()
  })
})

describe('climbing', () => {
  const onWall = () => {
    const g = findGrab(standing(640 - W - 10), 1, false, room, climbCfg)
    if (g?.kind !== 'climb') throw new Error('no grab')
    return g
  }
  it('moves up a wall and turns the corner onto the ceiling', () => {
    let { climb, box } = onWall()
    let corner = false
    for (let i = 0; i < 600 && climb?.mode === 'wall'; i++) {
      const r = climbStep(climb, box, { x: 0, y: -1 }, room, 1 / 60, climbCfg)
      if (r.event === 'corner') corner = true
      climb = r.climb!
      box = r.box
    }
    expect(corner).toBe(true)
    expect(climb.mode).toBe('ceiling')
    expect(box.y).toBeCloseTo(climbCfg.ceilingGap)
    expect(isFree(box, room)).toBe(true)
  })
  it('stands when he climbs down onto the floor', () => {
    const { climb, box } = onWall()
    const raised = { ...box, y: box.y - 20 }
    let c: typeof climb | null = climb
    let b = raised
    let event = null
    for (let i = 0; i < 200 && c; i++) {
      const r = climbStep(c, b, { x: 0, y: 1 }, room, 1 / 60, climbCfg)
      c = r.climb
      b = r.box
      event = r.event
    }
    expect(event).toBe('land')
    expect(b.y + b.h).toBeCloseTo(768)
  })
  it('goes along a ceiling into a wall', () => {
    let climb: Parameters<typeof climbStep>[0] | null = { mode: 'ceiling', solid: 1, side: 1 }
    let box: Rect = { x: 400, y: climbCfg.ceilingGap, w: W, h: H }
    for (let i = 0; i < 600 && climb?.mode === 'ceiling'; i++) {
      const r = climbStep(climb, box, { x: 1, y: 0 }, room, 1 / 60, climbCfg)
      climb = r.climb
      box = r.box
    }
    expect(climb?.mode).toBe('wall')
    expect(climb?.side).toBe(1)
    expect(isFree(box, room)).toBe(true)
  })
  it('climbs up onto a ledge from underneath, off the end of it', () => {
    const ledge = { x: 300, y: 400, w: 4 * S, h: 0.4 * S }
    const solids = [floor, ceiling, ledge]
    let climb: Parameters<typeof climbStep>[0] | null = { mode: 'ceiling', solid: 2, side: 1 }
    let box: Rect = { x: 400, y: 400 + 0.4 * S + climbCfg.ceilingGap, w: W, h: H }
    let event = null
    for (let i = 0; i < 600 && climb; i++) {
      const r = climbStep(climb, box, { x: 1, y: 0 }, solids, 1 / 60, climbCfg)
      climb = r.climb
      box = r.box
      event = r.event
    }
    expect(event).toBe('mantle')
    expect(box.y + box.h).toBeCloseTo(400)
  })
})

describe('blink', () => {
  const from = { x: 200, y: 768 - H / 2 }
  it('clamps the aim to its range', () => {
    const p = clampToRange({ x: 0, y: 0 }, { x: 1000, y: 0 }, 5 * S)
    expect(p.x).toBeCloseTo(5 * S)
  })
  it('lands standing when aimed along the floor', () => {
    const r = resolveBlink(from, { x: 400, y: from.y }, room, blinkCfg)
    expect(r.mode).toBe('stand')
    expect(r.box.y + r.box.h).toBeCloseTo(768)
    expect(r.box.x + W / 2).toBeCloseTo(400, 0)
  })
  it('goes through a thin wall', () => {
    const thin = { x: 300, y: 0, w: 0.25 * S, h: 768 }
    const r = resolveBlink(from, { x: 450, y: from.y }, [floor, ceiling, thin], blinkCfg)
    expect(r.cut).toBe(false)
    expect(r.box.x).toBeGreaterThan(300)
  })
  it('stops short of a thick wall', () => {
    const thick = { x: 300, y: 0, w: 3 * S, h: 768 }
    const r = resolveBlink(from, { x: 450, y: from.y }, [floor, ceiling, thick], blinkCfg)
    expect(r.cut).toBe(true)
    expect(r.box.x + r.box.w).toBeLessThanOrEqual(300)
  })
  it('arrives gripping a wall it lands beside', () => {
    const r = resolveBlink({ x: 400, y: 500 }, { x: 640 - W / 2 - 4, y: 400 }, room, blinkCfg)
    expect(r.mode).toBe('wall')
    expect(r.side).toBe(1)
    expect(r.box.x + r.box.w).toBeCloseTo(640 - blinkCfg.wallGap)
  })
  it('arrives hanging from a ceiling it lands under', () => {
    const r = resolveBlink({ x: 300, y: 300 }, { x: 300, y: H / 2 + 10 }, room, blinkCfg)
    expect(r.mode).toBe('ceiling')
    expect(r.box.y).toBeCloseTo(blinkCfg.ceilingGap)
  })
  it('is left in the air in open space', () => {
    const r = resolveBlink({ x: 200, y: 600 }, { x: 300, y: 400 }, room, blinkCfg)
    expect(r.mode).toBe('air')
    expect(isFree(r.box, room)).toBe(true)
  })
  it('never ends up inside a solid', () => {
    for (let ax = 0; ax <= 760; ax += 40) {
      for (let ay = 0; ay <= 760; ay += 40) {
        const r = resolveBlink({ x: 400, y: 600 }, { x: ax, y: ay }, room, blinkCfg)
        expect(isFree(r.box, room)).toBe(true)
      }
    }
  })
})

describe('the test room', async () => {
  const { TEST_ROOM } = await import('../room/testRoom.ts')
  const { CLIMB_CFG } = await import('../tuning.ts')
  it('lets him go along under the rest ledge and up onto it', () => {
    const solids = TEST_ROOM.solids
    const ledge = solids.findIndex((s) => s.x === 0 && s.w === 1.6 * S)
    let climb: Parameters<typeof climbStep>[0] | null = { mode: 'ceiling', solid: ledge, side: 1 }
    let box: Rect = { x: 0.35 * S, y: solids[ledge].y + solids[ledge].h + CLIMB_CFG.ceilingGap, w: W, h: H }
    let event = null
    for (let i = 0; i < 300 && climb; i++) {
      const r = climbStep(climb, box, { x: 1, y: 0 }, solids, 1 / 60, CLIMB_CFG)
      if (!r.moved) break
      climb = r.climb
      box = r.box
      event = r.event
    }
    expect(event).toBe('mantle')
    expect(box.y + box.h).toBeCloseTo(solids[ledge].y)
  })
})
