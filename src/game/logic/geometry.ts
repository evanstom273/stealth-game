export interface Vec {
  x: number
  y: number
}

/** An axis-aligned rectangle: x, y is the top-left corner, y grows downwards. */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export const right = (r: Rect) => r.x + r.w
export const bottom = (r: Rect) => r.y + r.h
export const centre = (r: Rect): Vec => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })

/** Below this, rectangles are touching, not overlapping: absorbs floating-point rounding. */
const EPS = 0.01

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w - EPS && a.x + a.w > b.x + EPS && a.y < b.y + b.h - EPS && a.y + a.h > b.y + EPS
}

export function isFree(r: Rect, solids: readonly Rect[]): boolean {
  return !solids.some((s) => overlaps(r, s))
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Where a segment from p0 to p1 first enters a rectangle, as a fraction of its length (0–1),
 * or null if it never does. A segment that starts inside the rectangle enters at 0.
 */
export function segmentEntry(p0: Vec, p1: Vec, r: Rect): number | null {
  const dx = p1.x - p0.x
  const dy = p1.y - p0.y
  let t0 = 0
  let t1 = 1
  const edges: [number, number][] = [
    [-dx, p0.x - r.x],
    [dx, r.x + r.w - p0.x],
    [-dy, p0.y - r.y],
    [dy, r.y + r.h - p0.y],
  ]
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return null
      continue
    }
    const t = q / p
    if (p < 0) {
      if (t > t1) return null
      if (t > t0) t0 = t
    } else {
      if (t < t0) return null
      if (t < t1) t1 = t
    }
  }
  return t0
}
