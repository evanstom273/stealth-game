import { describe, expect, it } from 'vitest'
import { holdOutcome, seesTarget, sightRange, takedownOn, type GuardPose, type ThiefPose } from './combat.ts'

const S = 64
const sight = { halfAngle: (25 * Math.PI) / 180, lightRange: 7 * S, darkRange: 1.6 * S }
const cfg = { behindReach: 1.3 * S, dropReach: 0.9 * S, dropDepth: 4 * S, leapReach: 3 * S, finisherReach: 1.4 * S }

describe('guard sight', () => {
  const eye = { x: 0, y: 0 }
  it('sees further in light than in the dark', () => {
    expect(sightRange(1, sight)).toBe(7 * S)
    expect(sightRange(0, sight)).toBe(1.6 * S)
    expect(seesTarget(eye, 1, false, { x: 5 * S, y: 0 }, 1, [], sight)).toBe(true)
    expect(seesTarget(eye, 1, false, { x: 5 * S, y: 0 }, 0, [], sight)).toBe(false)
    expect(seesTarget(eye, 1, false, { x: 1.2 * S, y: 0 }, 0, [], sight)).toBe(true)
  })
  it('sees only in its cone unless it is tracking him', () => {
    expect(seesTarget(eye, -1, false, { x: 3 * S, y: 0 }, 1, [], sight)).toBe(false)
    expect(seesTarget(eye, 1, false, { x: 2 * S, y: -2 * S }, 1, [], sight)).toBe(false)
    expect(seesTarget(eye, -1, true, { x: 3 * S, y: 0 }, 1, [], sight)).toBe(true)
  })
  it('does not see through walls', () => {
    const wall = { x: S, y: -S, w: 10, h: 2 * S }
    expect(seesTarget(eye, 1, false, { x: 3 * S, y: 0 }, 1, [wall], sight)).toBe(false)
  })
})

describe('takedowns', () => {
  const W = 0.8 * S
  const H = 1.31 * S
  const floor = 768
  const thief = (x: number, extra: Partial<ThiefPose> = {}): ThiefPose => ({ box: { x: x - W / 2, y: floor - H, w: W, h: H }, facing: 1, grounded: true, climb: null, wallSide: 1, ...extra })
  const guard = (x: number, extra: Partial<GuardPose> = {}): GuardPose => ({ box: { x: x - 0.53 * S, y: floor - 1.66 * S, w: 1.05 * S, h: 1.66 * S }, facing: 1, unaware: true, open: false, down: false, ...extra })

  it('from behind an unaware guard, but not in front of it', () => {
    expect(takedownOn(thief(300), guard(360, { facing: 1 }), [], cfg)).toBe('behind')
    expect(takedownOn(thief(300), guard(360, { facing: -1 }), [], cfg)).toBeNull()
    expect(takedownOn(thief(300), guard(360, { unaware: false }), [], cfg)).toBeNull()
    expect(takedownOn(thief(100), guard(360), [], cfg)).toBeNull()
  })
  it('a finisher on a staggered guard in front, aware or not', () => {
    expect(takedownOn(thief(300), guard(370, { facing: -1, unaware: false, open: true }), [], cfg)).toBe('finisher')
  })
  it('dropping from a ceiling onto a guard below', () => {
    const t: ThiefPose = { box: { x: 300 - W / 2, y: floor - 4 * S, w: W, h: H }, facing: 1, grounded: false, climb: 'ceiling', wallSide: 1 }
    expect(takedownOn(t, guard(320), [], cfg)).toBe('ceiling')
    // A tall guard whose head reaches past his feet still counts as below him.
    const low: ThiefPose = { ...t, box: { ...t.box, y: floor - 1.66 * S - 0.4 * S - H / 2 } }
    expect(takedownOn(low, guard(320), [], cfg)).toBe('ceiling')
    expect(takedownOn(t, guard(500), [], cfg)).toBeNull()
  })
  it('leaping off a wall at a guard on the open side', () => {
    const t: ThiefPose = { box: { x: 300 - W / 2, y: floor - H - 1.5 * S, w: W, h: H }, facing: -1, grounded: false, climb: 'wall', wallSide: -1 }
    expect(takedownOn(t, guard(420), [], cfg)).toBe('wall')
    expect(takedownOn(t, guard(180), [], cfg)).toBeNull()
  })
  it('nothing on a guard that is already down', () => {
    expect(takedownOn(thief(300), guard(360, { down: true }), [], cfg)).toBeNull()
  })
})

describe('tap or hold', () => {
  it('knocks out on a quick release and kills once held long enough', () => {
    expect(holdOutcome(0.1, true, 0.35)).toBe('ko')
    expect(holdOutcome(0.2, false, 0.35)).toBeNull()
    expect(holdOutcome(0.35, false, 0.35)).toBe('kill')
  })
})
