import { isWall, lineBlocked, solidAt, solidsNear, tileOf, wallBetween, type Level, type V3 } from '../level/level.ts'
import { BODY, LIGHT } from '../tuning.ts'
import { makeBody, pushOut, roofAt } from './body.ts'

// ---------- Blink (History #104–#107) ----------

export type Posture = 'stand' | 'crouch' | 'crawl'

export interface BlinkLanding {
  x: number
  y: number
  z: number
  posture: Posture
  /** A thick wall stopped it short. */
  cut: boolean
  /** It went through glass. */
  glass: boolean
  /** What he lands on, and how far up or down that is from where he is. */
  surface: string
  rise: number
}

/** Every surface top at a point on the ground, highest first, with the room above each. */
function surfacesAt(L: Level, x: number, z: number): { top: number; room: number; name: string }[] {
  const solids = solidsNear(L, x - 0.01, z - 0.01, x + 0.01, z + 0.01).filter((s) => x >= s.x0 && x < s.x1 && z >= s.z0 && z < s.z1)
  const out: { top: number; room: number; name: string }[] = []
  for (const s of solids) {
    if (s.y1 > 50) continue
    let above = Infinity
    for (const o of solids) if (o !== s && o.y0 >= s.y1 - 1e-6 && o.y0 < above) above = o.y0
    out.push({ top: s.y1, room: above - s.y1, name: s.name })
  }
  return out.sort((a, b) => b.top - a.top)
}

/**
 * Where a blink aimed at (tx, tz) lands, seen from above: no further than the range, through glass,
 * stopped by thick walls, onto the highest surface there that he fits on, standing or lower.
 */
export function resolveBlink(L: Level, from: V3, tx: number, tz: number, range: number): BlinkLanding | null {
  let dx = tx - from.x, dz = tz - from.z
  const d = Math.hypot(dx, dz)
  if (d > range) { dx *= range / d; dz *= range / d }
  const len = Math.hypot(dx, dz)
  const steps = Math.max(1, Math.ceil(len / 0.05))
  const path: [number, number][] = [[from.x, from.z]]
  let cut = false, glass = false
  for (let i = 1; i <= steps; i++) {
    const x = from.x + (dx * i) / steps, z = from.z + (dz * i) / steps
    const [c, r] = tileOf(x, z)
    if (isWall(L, c, r)) { cut = true; break }
    if (L.thin.some((s) => x >= s.x0 && x < s.x1 && z >= s.z0 && z < s.z1)) glass = true
    path.push([x, z])
  }
  // Back along the path until there's somewhere he fits.
  for (let i = path.length - 1; i >= 1; i--) {
    const [x, z] = path[i]
    const spot = surfacesAt(L, x, z).find((s) => s.room >= BODY.crawlH)
    if (!spot) continue
    if (L.thin.some((s) => x >= s.x0 && x < s.x1 && z >= s.z0 && z < s.z1)) continue
    const posture: Posture = spot.room >= BODY.standH ? 'stand' : spot.room >= BODY.crouchH ? 'crouch' : 'crawl'
    const h = posture === 'stand' ? BODY.standH : posture === 'crouch' ? BODY.crouchH : BODY.crawlH
    // Keep clear of walls at that height.
    const b = makeBody(x, spot.top, z, BODY.r, h)
    pushOut(L, b, 0)
    if (Math.hypot(b.x - x, b.z - z) > 0.45) continue
    const room = roofAt(L, b.x, b.z, b.r * 0.9, b.y + 0.02) - b.y
    if (room < h - 1e-3) continue
    return { x: b.x, y: b.y, z: b.z, posture, cut, glass, surface: spot.name, rise: spot.top - from.y }
  }
  return null
}

// ---------- Sight (History #65, carried over) ----------

export interface SightConfig {
  halfAngle: number
  lightRange: number
  darkRange: number
  vertical: number
}

export const sightRange = (light: number, cfg: SightConfig) => cfg.darkRange + (cfg.lightRange - cfg.darkRange) * Math.min(1, Math.max(0, light))

/**
 * Whether a guard sees him: in range for how lit he is, inside its cone (unless it's alerted and
 * tracking him), not too far above or below, and with nothing solid in between.
 */
export function guardSees(L: Level, eye: V3, fx: number, fz: number, tracking: boolean, target: V3, light: number, cfg: SightConfig): boolean {
  const dx = target.x - eye.x, dy = target.y - eye.y, dz = target.z - eye.z
  const flat = Math.hypot(dx, dz)
  if (Math.hypot(flat, dy) > sightRange(light, cfg)) return false
  if (Math.abs(Math.atan2(dy, flat)) > cfg.vertical) return false
  if (!tracking) {
    if (flat < 1e-3) return false
    const cos = (dx * fx + dz * fz) / flat
    if (cos < Math.cos(cfg.halfAngle)) return false
  }
  return !lineBlocked(L, eye, target, 0.1)
}

// ---------- Takedowns (History #53, #59, #101) ----------

export type TakedownKind = 'behind' | 'drop' | 'finisher' | 'blink'

export interface TakedownConfig {
  behindReach: number
  behindDot: number
  lookArc: number
  finisherReach: number
  dropReach: number
  dropMinAbove: number
  dropMaxAbove: number
}

export interface PlayerView {
  x: number
  y: number
  z: number
  eye: number
  yaw: number
  pitch: number
  grounded: boolean
  climbing: boolean
}

export interface GuardView {
  x: number
  y: number
  z: number
  fx: number
  fz: number
  unaware: boolean
  open: boolean
  down: boolean
}

/** Is he looking at the guard's middle, within the arc? */
export function lookingAt(p: PlayerView, g: GuardView, arc: number): boolean {
  const vx = -Math.sin(p.yaw) * Math.cos(p.pitch), vy = Math.sin(p.pitch), vz = -Math.cos(p.yaw) * Math.cos(p.pitch)
  const tx = g.x - p.x, ty = g.y + 0.9 - (p.y + p.eye), tz = g.z - p.z
  const tl = Math.hypot(tx, ty, tz) || 1
  return (vx * tx + vy * ty + vz * tz) / tl >= Math.cos(arc)
}

/**
 * Which takedown he can do on a guard right now: a finisher on a staggered or dazed guard in front
 * of him; dropping onto an unaware one from a ledge, wall or ceiling above it; or from behind on
 * its level. He has to be looking at it.
 */
export function takedownOn(L: Level, p: PlayerView, g: GuardView, cfg: TakedownConfig): TakedownKind | null {
  if (g.down) return null
  if (!lookingAt(p, g, cfg.lookArc)) return null
  const dx = g.x - p.x, dz = g.z - p.z
  const flat = Math.hypot(dx, dz)
  const above = p.y - g.y
  if (g.open && p.grounded && Math.abs(above) < 0.5 && flat <= cfg.finisherReach) return 'finisher'
  if (!g.unaware) return null
  if ((p.grounded || p.climbing) && above >= cfg.dropMinAbove && above <= cfg.dropMaxAbove && flat <= cfg.dropReach) {
    if (!lineBlocked(L, { x: p.x, y: p.y + 0.3, z: p.z }, { x: g.x, y: g.y + 1.2, z: g.z }, 0.1, false)) return 'drop'
    return null
  }
  if (p.grounded && Math.abs(above) < 0.45 && flat <= cfg.behindReach && flat > 1e-3) {
    // Behind it: he's in the half of the floor it isn't facing.
    const dot = (-dx * g.fx + -dz * g.fz) / flat
    if (dot <= cfg.behindDot) return 'behind'
  }
  return null
}

/** Tap Attack to knock out, hold to kill (History #58). */
export function holdOutcome(heldFor: number, released: boolean, killAfter: number): 'ko' | 'kill' | null {
  if (heldFor >= killAfter) return 'kill'
  if (released) return 'ko'
  return null
}

// ---------- Light ----------

/** How lit a point is: full near a lamp, fading out with distance, and none through a thick wall. */
export function lightAt(L: Level, x: number, z: number): number {
  let best = 0
  for (const l of L.lamps) {
    const d = Math.hypot(x - l.x, z - l.z) / LIGHT.radius
    if (d >= 1) continue
    const t = Math.min(1, Math.max(0, (d - LIGHT.clear) / (1 - LIGHT.clear)))
    const v = 1 - t
    if (v > best && !wallBetween(L, l.x, l.z, x, z)) best = v
  }
  return best
}

// ---------- Guards finding their way ----------

/** Can a guard stand on this tile, from a floor at about `floorY`? */
export function guardWalkable(L: Level, c: number, r: number, floorY: number, height: number): boolean {
  if (isWall(L, c, r)) return false
  const i = r * L.cols + c
  const f = L.floor[i]
  if (Math.abs(f - floorY) > 0.4 || L.ceil[i] - f < height) return false
  const x = c + 0.5, z = r + 0.5
  for (const b of L.boxes) if (x >= b.x0 && x < b.x1 && z >= b.z0 && z < b.z1 && b.y1 > f + 0.4 && b.y0 < f + height) return false
  return true
}

const glassBetween = (L: Level, ax: number, az: number, bx: number, bz: number) => {
  const mx = (ax + bx) / 2, mz = (az + bz) / 2
  return L.thin.some((s) => mx >= s.x0 - 0.02 && mx <= s.x1 + 0.02 && mz >= s.z0 - 0.02 && mz <= s.z1 + 0.02)
}

/**
 * A path of tile centres from one tile to another on the same floor, or to the reachable tile
 * nearest the goal if the goal itself can't be reached. Null if it can't move at all.
 */
export function findPath(L: Level, from: [number, number], to: [number, number], floorY: number, height: number): [number, number][] | null {
  const key = (c: number, r: number) => r * L.cols + c
  const prev = new Map<number, number>()
  const start = key(...from)
  prev.set(start, -1)
  const q: [number, number][] = [from]
  let best = from, bestD = Math.hypot(from[0] - to[0], from[1] - to[1])
  while (q.length) {
    const [c, r] = q.shift()!
    const d = Math.hypot(c - to[0], r - to[1])
    if (d < bestD) { best = [c, r]; bestD = d }
    if (c === to[0] && r === to[1]) break
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc, nr = r + dr, k = key(nc, nr)
      if (prev.has(k) || !guardWalkable(L, nc, nr, floorY, height)) continue
      if (glassBetween(L, c + 0.5, r + 0.5, nc + 0.5, nr + 0.5)) continue
      prev.set(k, key(c, r))
      q.push([nc, nr])
    }
  }
  const path: [number, number][] = []
  let k = key(...best)
  while (k !== -1 && k !== undefined) {
    path.push([k % L.cols, Math.floor(k / L.cols)])
    k = prev.get(k)!
  }
  return path.reverse()
}

/** Is there a solid at a point? Re-exported for tests and the game. */
export { solidAt }
