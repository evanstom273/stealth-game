import { segmentEntry, type Rect, type Vec } from './geometry.ts'

export interface SightConfig {
  /** Half the cone's width, in radians. */
  halfAngle: number
  /** How far they see him in full light. */
  lightRange: number
  /** How far they see him in full shadow. */
  darkRange: number
}

/** How far a guard can see him, given how lit he is (History #65). */
export function sightRange(light: number, cfg: SightConfig): number {
  const l = Math.min(1, Math.max(0, light))
  return cfg.darkRange + (cfg.lightRange - cfg.darkRange) * l
}

/**
 * Whether a guard sees him. Calm or suspicious guards see in a cone the way they face; an alerted
 * guard tracks him and sees him in any direction. Either way he has to be in range for how lit
 * he is, with nothing solid in between.
 */
export function seesTarget(eye: Vec, facing: number, tracking: boolean, target: Vec, light: number, solids: readonly Rect[], cfg: SightConfig): boolean {
  const dx = target.x - eye.x
  const dy = target.y - eye.y
  const dist = Math.hypot(dx, dy)
  if (dist > sightRange(light, cfg)) return false
  if (!tracking) {
    const ahead = dx * facing
    if (ahead <= 0) return false
    if (Math.abs(Math.atan2(dy, ahead)) > cfg.halfAngle) return false
  }
  return solids.every((s) => segmentEntry(eye, target, s) === null)
}

export type TakedownKind = 'behind' | 'ceiling' | 'wall' | 'finisher' | 'blink'

export interface TakedownConfig {
  /** How close behind a guard he has to be, between centres. */
  behindReach: number
  /** How far to the side a guard can be to drop on it from a ceiling. */
  dropReach: number
  /** How far below him a guard can be for a drop or a wall leap. */
  dropDepth: number
  /** How far out from a wall he can leap at a guard. */
  leapReach: number
  /** How close in front a staggered or stunned guard must be for a finisher. */
  finisherReach: number
}

export interface ThiefPose {
  box: Rect
  facing: 1 | -1
  grounded: boolean
  climb: 'wall' | 'ceiling' | null
  /** For a wall: which side of him it's on. */
  wallSide: 1 | -1
}

export interface GuardPose {
  box: Rect
  facing: 1 | -1
  /** Not alerted: a sneak attack works. */
  unaware: boolean
  /** Staggered or stunned: open to a finisher. */
  open: boolean
  down: boolean
}

const cx = (b: Rect) => b.x + b.w / 2

/**
 * Which takedown, if any, he can do on a guard right now (History #53, #59): a finisher on a
 * staggered guard in front of him; from behind on the ground; dropping from a ceiling onto one
 * below; or leaping off a wall at one below or level with him. Sneak attacks need it unaware.
 */
export function takedownOn(t: ThiefPose, g: GuardPose, solids: readonly Rect[], cfg: TakedownConfig): TakedownKind | null {
  if (g.down) return null
  const dx = cx(g.box) - cx(t.box)
  const tBottom = t.box.y + t.box.h
  const gBottom = g.box.y + g.box.h
  const clear = () => solids.every((s) => segmentEntry({ x: cx(t.box), y: t.box.y + t.box.h / 2 }, { x: cx(g.box), y: g.box.y + g.box.h / 2 }, s) === null)

  if (g.open && t.grounded && !t.climb && Math.abs(gBottom - tBottom) < 0.5 * t.box.h && Math.abs(dx) <= cfg.finisherReach) return 'finisher'
  if (!g.unaware) return null

  if (t.climb === 'ceiling') {
    // Below him: its middle lower than his, and not too far down.
    const below = g.box.y + g.box.h / 2 > t.box.y + t.box.h / 2
    if (Math.abs(dx) <= cfg.dropReach && below && g.box.y - tBottom <= cfg.dropDepth && clear()) return 'ceiling'
    return null
  }
  if (t.climb === 'wall') {
    // He leaps away from the wall, so the guard has to be on the open side.
    if (dx * t.wallSide < 0 && Math.abs(dx) <= cfg.leapReach && gBottom >= tBottom - 0.3 * t.box.h && gBottom - tBottom <= cfg.dropDepth && clear()) return 'wall'
    return null
  }
  if (t.grounded && Math.abs(gBottom - tBottom) < 0.3 * t.box.h && Math.abs(dx) <= cfg.behindReach && dx * g.facing > 0) return 'behind'
  return null
}

/** Tap Attack to knock out, hold to kill (History #58). */
export function holdOutcome(heldFor: number, released: boolean, killAfter: number): 'ko' | 'kill' | null {
  if (heldFor >= killAfter) return 'kill'
  if (released) return 'ko'
  return null
}
