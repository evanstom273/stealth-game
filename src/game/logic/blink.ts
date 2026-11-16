import { bottom, isFree, overlaps, right, segmentEntry, type Rect, type Vec } from './geometry.ts'

export interface BlinkConfig {
  range: number
  /** Solids thinner than this in their thinnest direction can be blinked through. */
  thinMax: number
  body: { w: number; h: number }
  reachSide: number
  reachUp: number
  wallGap: number
  ceilingGap: number
  minWallFace: number
  /** How close above a floor counts as landing on it. */
  standSnap: number
}

export type BlinkMode = 'stand' | 'wall' | 'ceiling' | 'air'

export interface BlinkResult {
  /** Where his hitbox ends up. */
  box: Rect
  mode: BlinkMode
  /** For a wall landing, which side of him the wall is on. */
  side: 1 | -1
  /** The solid he arrives holding, for wall and ceiling landings. */
  solid: number
  /** Where the aim line ends: at the aim point, or just short of a thick wall. */
  end: Vec
  /** True if a thick wall cut the blink short. */
  cut: boolean
}

const isThin = (s: Rect, thinMax: number) => Math.min(s.w, s.h) < thinMax

/** Clamps the aim point to the blink's range around his centre. */
export function clampToRange(from: Vec, aim: Vec, range: number): Vec {
  const dx = aim.x - from.x
  const dy = aim.y - from.y
  const d = Math.hypot(dx, dy)
  if (d <= range || d === 0) return { ...aim }
  return { x: from.x + (dx / d) * range, y: from.y + (dy / d) * range }
}

/** Pushes a box out of any solids it overlaps, by the shortest way out. */
function pushOut(box: Rect, solids: readonly Rect[]): Rect {
  let b = { ...box }
  for (let pass = 0; pass < 6; pass++) {
    const hit = solids.find((s) => overlaps(b, s))
    if (!hit) return b
    const moves = [
      { x: 0, y: hit.y - bottom(b) },
      { x: 0, y: bottom(hit) - b.y },
      { x: hit.x - right(b), y: 0 },
      { x: right(hit) - b.x, y: 0 },
    ].sort((m1, m2) => Math.hypot(m1.x, m1.y) - Math.hypot(m2.x, m2.y))
    const m = moves.find((mv) => isFree({ ...b, x: b.x + mv.x, y: b.y + mv.y }, solids)) ?? moves[0]
    b = { ...b, x: b.x + m.x, y: b.y + m.y }
  }
  return b
}

/**
 * Works out where a blink takes him. It goes through thin walls but stops short of thick ones,
 * then he arrives standing if there's floor just below, otherwise holding a wall or ceiling
 * within reach, otherwise in the air (History #32, #35).
 */
export function resolveBlink(from: Vec, aim: Vec, solids: readonly Rect[], cfg: BlinkConfig): BlinkResult {
  const target = clampToRange(from, aim, cfg.range)
  const len = Math.hypot(target.x - from.x, target.y - from.y)
  let t = 1
  let cut = false
  for (const s of solids) {
    if (isThin(s, cfg.thinMax)) continue
    const e = segmentEntry(from, target, s)
    if (e !== null && e < t) {
      t = e
      cut = true
    }
  }
  if (cut && len > 0) t = Math.max(0, t - (cfg.body.w * 0.55) / len)
  const end = { x: from.x + (target.x - from.x) * t, y: from.y + (target.y - from.y) * t }

  const { w, h } = cfg.body
  let box: Rect = { x: end.x - w / 2, y: end.y - h / 2, w, h }
  box = pushOut(box, solids)
  if (!isFree(box, solids)) {
    // Walk back along the line until he fits.
    for (let k = 1; k <= 20; k++) {
      const f = 1 - k / 20
      const p = { x: from.x + (end.x - from.x) * f, y: from.y + (end.y - from.y) * f }
      const b = pushOut({ x: p.x - w / 2, y: p.y - h / 2, w, h }, solids)
      if (isFree(b, solids)) {
        box = b
        break
      }
    }
  }
  if (!isFree(box, solids)) box = { x: from.x - w / 2, y: from.y - h / 2, w, h }

  const result = (mode: BlinkMode, b: Rect, side: 1 | -1 = 1, solid = -1): BlinkResult => ({ box: b, mode, side, solid, end, cut })

  // Standing: floor just below his feet.
  const floor = solids
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.y >= bottom(box) - 1 && s.y <= bottom(box) + cfg.standSnap && box.x < right(s) && right(box) > s.x)
    .sort((a, b) => a.s.y - b.s.y)[0]
  if (floor) {
    const b = { ...box, y: floor.s.y - h }
    if (isFree(b, solids)) return result('stand', b)
  }

  // A wall within reach.
  const walls: { i: number; side: 1 | -1; gap: number }[] = []
  solids.forEach((s, i) => {
    if (s.h < cfg.minWallFace) return
    const mid = box.y + h / 2
    if (mid < s.y || mid > bottom(s)) return
    const gr = s.x - right(box)
    const gl = box.x - right(s)
    if (gr >= -1 && gr <= cfg.reachSide) walls.push({ i, side: 1, gap: gr })
    if (gl >= -1 && gl <= cfg.reachSide) walls.push({ i, side: -1, gap: gl })
  })
  walls.sort((a, b) => a.gap - b.gap)
  for (const wl of walls) {
    const s = solids[wl.i]
    const b = { ...box, x: wl.side > 0 ? s.x - cfg.wallGap - w : right(s) + cfg.wallGap }
    if (isFree(b, solids)) return result('wall', b, wl.side, wl.i)
  }

  // A ceiling within reach.
  const cx = box.x + w / 2
  const ceil = solids
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => box.y - bottom(s) >= -1 && box.y - bottom(s) <= cfg.reachUp && cx >= s.x && cx <= right(s))
    .sort((a, b) => bottom(b.s) - bottom(a.s))[0]
  if (ceil) {
    const b = { ...box, y: bottom(ceil.s) + cfg.ceilingGap }
    if (isFree(b, solids)) return result('ceiling', b, 1, ceil.i)
  }

  return result('air', box)
}
