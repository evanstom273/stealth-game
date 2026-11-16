import { bottom, isFree, right, type Rect, type Vec } from './geometry.ts'

export interface ClimbConfig {
  wallSpeed: number
  ceilingSpeed: number
  reachSide: number
  reachUp: number
  wallGap: number
  ceilingGap: number
  /** Faces shorter than this can't be held as walls; he climbs onto them instead. */
  minWallFace: number
  /** How far onto a ledge's top he lands when he climbs onto it. */
  mantleInset: number
}

export type ClimbMode = 'wall' | 'ceiling'

/** While climbing: which surface he holds, and on which side of him a wall is (1 right, -1 left). */
export interface Climb {
  mode: ClimbMode
  solid: number
  side: 1 | -1
}

export type GrabResult =
  | { kind: 'climb'; climb: Climb; box: Rect }
  | { kind: 'mantle'; box: Rect }

export type ClimbEvent = 'mantle' | 'land' | 'corner' | null

export interface ClimbStepResult {
  climb: Climb | null
  box: Rect
  event: ClimbEvent
  moved: boolean
}

const midY = (b: Rect) => b.y + b.h / 2
const midX = (b: Rect) => b.x + b.w / 2

function free(box: Rect, solids: readonly Rect[]) {
  return isFree(box, solids)
}

/** Where his box goes when he holds a wall face. */
function wallBox(box: Rect, s: Rect, side: 1 | -1, cfg: ClimbConfig): Rect {
  const x = side > 0 ? s.x - cfg.wallGap - box.w : right(s) + cfg.wallGap
  const y = Math.min(bottom(s) - box.h / 2, Math.max(s.y - box.h / 2, box.y))
  return { ...box, x, y }
}

/** Where his box goes when he hangs under a surface. */
function ceilingBox(box: Rect, s: Rect, cfg: ClimbConfig): Rect {
  const x = Math.min(right(s) - box.w / 2, Math.max(s.x - box.w / 2, box.x))
  return { ...box, x, y: bottom(s) + cfg.ceilingGap }
}

/** Where his box goes when he climbs onto a solid's top from the given side. */
function mantleBox(box: Rect, s: Rect, fromSide: 1 | -1, cfg: ClimbConfig): Rect {
  const x = fromSide > 0 ? s.x + cfg.mantleInset : right(s) - box.w - cfg.mantleInset
  return { ...box, x, y: s.y - box.h }
}

function wallsBeside(box: Rect, side: 1 | -1, solids: readonly Rect[], cfg: ClimbConfig) {
  const found: { i: number; gap: number }[] = []
  solids.forEach((s, i) => {
    const gap = side > 0 ? s.x - right(box) : box.x - right(s)
    if (gap < -1 || gap > cfg.reachSide) return
    const overlapTop = Math.max(box.y, s.y)
    const overlapBottom = Math.min(bottom(box), bottom(s))
    if (overlapBottom - overlapTop <= 0) return
    found.push({ i, gap })
  })
  return found.sort((a, b) => a.gap - b.gap)
}

function ceilingAbove(box: Rect, solids: readonly Rect[], reach: number): number | null {
  let best: number | null = null
  let bestGap = Infinity
  const cx = midX(box)
  solids.forEach((s, i) => {
    const gap = box.y - bottom(s)
    if (gap < -1 || gap > reach) return
    if (cx < s.x || cx > right(s)) return
    if (gap < bestGap) {
      bestGap = gap
      best = i
    }
  })
  return best
}

/**
 * Pressing grab: what he takes hold of, in this order: a wall he's facing, a ceiling if he's
 * pressing up, the other wall, a ceiling, or the top of a ledge whose edge is within reach.
 */
export function findGrab(box: Rect, facing: 1 | -1, wantUp: boolean, solids: readonly Rect[], cfg: ClimbConfig): GrabResult | null {
  const tryWall = (side: 1 | -1): GrabResult | null => {
    for (const { i } of wallsBeside(box, side, solids, cfg)) {
      const s = solids[i]
      if (s.h < cfg.minWallFace) continue
      if (midY(box) < s.y - box.h * 0.25 || midY(box) > bottom(s) + box.h * 0.25) continue
      const b = wallBox(box, s, side, cfg)
      if (free(b, solids)) return { kind: 'climb', climb: { mode: 'wall', solid: i, side }, box: b }
    }
    return null
  }
  const tryCeiling = (): GrabResult | null => {
    const i = ceilingAbove(box, solids, cfg.reachUp)
    if (i === null) return null
    const b = ceilingBox(box, solids[i], cfg)
    if (!free(b, solids)) return null
    return { kind: 'climb', climb: { mode: 'ceiling', solid: i, side: 1 }, box: b }
  }
  const tryMantle = (): GrabResult | null => {
    for (const side of [facing, -facing as 1 | -1]) {
      for (const { i } of wallsBeside(box, side, solids, cfg)) {
        const s = solids[i]
        // The top edge has to be within reach of his hands: between a little above his head and his middle.
        if (s.y < box.y - cfg.reachUp || s.y > midY(box)) continue
        const b = mantleBox(box, s, side, cfg)
        if (free(b, solids)) return { kind: 'mantle', box: b }
      }
    }
    return null
  }
  if (wantUp) return tryCeiling() ?? tryWall(facing) ?? tryMantle() ?? tryWall(-facing as 1 | -1)
  return tryWall(facing) ?? tryMantle() ?? tryCeiling() ?? tryWall(-facing as 1 | -1)
}

/**
 * One frame of climbing. On a wall he moves up and down; on a ceiling, left and right.
 * He goes round corners: up a wall into a ceiling, along a ceiling into a wall, off the end
 * of a ceiling onto its outside face, and up over the top of a wall or ledge onto it.
 */
export function climbStep(climb: Climb, box: Rect, input: Vec, solids: readonly Rect[], dt: number, cfg: ClimbConfig): ClimbStepResult {
  const s = solids[climb.solid]
  if (climb.mode === 'wall') {
    const vy = Math.sign(input.y) * Math.min(1, Math.abs(input.y)) * cfg.wallSpeed
    if (Math.abs(vy) < 1) return { climb, box, event: null, moved: false }
    const next: Rect = { ...box, y: box.y + vy * dt }
    if (vy < 0) {
      // Up into a ceiling: hang from it.
      const c = ceilingAbove(next, solids, cfg.ceilingGap)
      if (c !== null && c !== climb.solid) {
        const b = ceilingBox(next, solids[c], cfg)
        if (free(b, solids)) return { climb: { mode: 'ceiling', solid: c, side: climb.side }, box: b, event: 'corner', moved: true }
        return { climb, box, event: null, moved: false }
      }
      // Over the top of the wall: climb onto it.
      if (midY(next) < s.y) {
        const b = mantleBox(next, s, climb.side, cfg)
        if (free(b, solids)) return { climb: null, box: b, event: 'mantle', moved: true }
        return { climb, box: { ...box, y: s.y - box.h / 2 }, event: null, moved: false }
      }
    } else {
      // Down onto the floor: stand.
      if (!free(next, solids)) {
        const floor = solids.find((o) => next.x < right(o) && right(next) > o.x && bottom(next) > o.y && box.y < o.y)
        if (floor) return { climb: null, box: { ...box, y: floor.y - box.h }, event: 'land', moved: true }
        return { climb, box, event: null, moved: false }
      }
      // Off the bottom of the wall: round onto its underside, if he fits.
      if (midY(next) > bottom(s)) {
        const under: Rect = { ...next, x: climb.side > 0 ? s.x + cfg.mantleInset : right(s) - box.w - cfg.mantleInset }
        const b = ceilingBox(under, s, cfg)
        if (free(b, solids)) return { climb: { mode: 'ceiling', solid: climb.solid, side: climb.side }, box: b, event: 'corner', moved: true }
        return { climb, box: { ...box, y: bottom(s) - box.h / 2 }, event: null, moved: false }
      }
    }
    if (!free(next, solids)) return { climb, box, event: null, moved: false }
    return { climb, box: next, event: null, moved: true }
  }

  // Ceiling
  const vx = Math.sign(input.x) * Math.min(1, Math.abs(input.x)) * cfg.ceilingSpeed
  if (Math.abs(vx) < 1) return { climb, box, event: null, moved: false }
  const dir: 1 | -1 = vx > 0 ? 1 : -1
  const next: Rect = { ...box, x: box.x + vx * dt }
  // Into a wall: hold it.
  if (!free(next, solids)) {
    for (const { i } of wallsBeside(box, dir, solids, { ...cfg, reachSide: Math.abs(vx * dt) + 2 })) {
      if (i === climb.solid) continue
      const w = solids[i]
      if (w.h < cfg.minWallFace || midY(box) < w.y || midY(box) > bottom(w)) continue
      const b = wallBox(box, w, dir, cfg)
      if (free(b, solids)) return { climb: { mode: 'wall', solid: i, side: dir }, box: b, event: 'corner', moved: true }
    }
    return { climb, box, event: null, moved: false }
  }
  // Off the end of the ceiling.
  if (midX(next) < s.x || midX(next) > right(s)) {
    // Another surface carries straight on at the same height.
    const cont = solids.findIndex((o, i) => i !== climb.solid && Math.abs(bottom(o) - bottom(s)) < 2 && midX(next) >= o.x && midX(next) <= right(o))
    if (cont >= 0) return { climb: { ...climb, solid: cont }, box: next, event: null, moved: true }
    if (s.h >= cfg.minWallFace) {
      // Round the corner onto the outside face, facing back towards it.
      const side: 1 | -1 = dir > 0 ? -1 : 1
      const b: Rect = { ...box, x: dir > 0 ? right(s) + cfg.wallGap : s.x - cfg.wallGap - box.w, y: bottom(s) - box.h / 2 - 0.15 * box.w }
      if (free(b, solids)) return { climb: { mode: 'wall', solid: climb.solid, side }, box: b, event: 'corner', moved: true }
    } else {
      // A ledge: up and onto its top.
      const b = mantleBox(box, s, dir > 0 ? -1 : 1, cfg)
      if (free(b, solids)) return { climb: null, box: b, event: 'mantle', moved: true }
    }
    return { climb, box, event: null, moved: false }
  }
  return { climb, box: next, event: null, moved: true }
}
