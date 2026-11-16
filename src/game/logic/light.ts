import type { Vec } from './geometry.ts'

/**
 * How lit a point is by the lamps, from 0 (full shadow) to 1 (full light).
 * Full light inside `clear` of the radius, falling off to nothing at the edge.
 * The vision pool is deliberately not a lamp: it never lights him (History #41).
 */
export function lightAt(p: Vec, lamps: readonly Vec[], radius: number, clear: number): number {
  let best = 0
  for (const l of lamps) {
    const d = Math.hypot(p.x - l.x, p.y - l.y) / radius
    const t = Math.min(1, Math.max(0, (d - clear) / (1 - clear)))
    best = Math.max(best, 1 - t)
  }
  return best
}
