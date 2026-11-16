import { ceilingAbove, circleGap, groundBelow, solidsNear, type Box, type Level } from '../level/level.ts'

/** Anything that moves through the level: a standing cylinder with its feet at (x, y, z). */
export interface Body {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  r: number
  h: number
  grounded: boolean
}

export const makeBody = (x: number, y: number, z: number, r: number, h: number): Body => ({ x, y, z, vx: 0, vy: 0, vz: 0, r, h, grounded: true })

const near = (L: Level, b: Body, pad = 0) => solidsNear(L, b.x - b.r - pad, b.z - b.r - pad, b.x + b.r + pad, b.z + b.r + pad)

/**
 * Pushes the body's circle out of anything it overlaps at its own height. Solids whose tops are
 * within `stepUp` of its feet are left for it to step onto. Returns the last push direction.
 */
export function pushOut(L: Level, b: Body, stepUp: number): { pushed: boolean; nx: number; nz: number } {
  let pushed = false, nx = 0, nz = 0
  for (let pass = 0; pass < 3; pass++) {
    let moved = false
    for (const s of near(L, b)) {
      if (s.y1 <= b.y + stepUp + 1e-6 || s.y0 >= b.y + b.h - 1e-6) continue
      const cx = Math.max(s.x0, Math.min(b.x, s.x1)), cz = Math.max(s.z0, Math.min(b.z, s.z1))
      let dx = b.x - cx, dz = b.z - cz
      let d = Math.hypot(dx, dz)
      if (d >= b.r) continue
      if (d < 1e-6) {
        // The centre is inside the footprint: out by the shortest way.
        const opts: [number, number][] = [[s.x0 - b.r - b.x, 0], [s.x1 + b.r - b.x, 0], [0, s.z0 - b.r - b.z], [0, s.z1 + b.r - b.z]]
        opts.sort((p, q) => Math.hypot(...p) - Math.hypot(...q))
        b.x += opts[0][0]; b.z += opts[0][1]
        d = Math.hypot(...opts[0]) || 1; dx = opts[0][0]; dz = opts[0][1]
        nx = dx / d; nz = dz / d
      } else {
        const k = (b.r - d) / d
        b.x += dx * k; b.z += dz * k
        nx = dx / d; nz = dz / d
      }
      pushed = moved = true
    }
    if (!moved) break
  }
  return { pushed, nx, nz }
}

/** The ground under him, at or below `maxY`. */
export const supportAt = (L: Level, x: number, z: number, r: number, maxY: number) =>
  groundBelow(solidsNear(L, x - r, z - r, x + r, z + r), x, z, r, maxY)

/** The underside of whatever's above, at or above `minY`. */
export const roofAt = (L: Level, x: number, z: number, r: number, minY: number) =>
  ceilingAbove(solidsNear(L, x - r, z - r, x + r, z + r), x, z, r, minY)

/** How much room there is above a point on the ground. */
export const headroom = (L: Level, x: number, z: number, r: number, y: number) => roofAt(L, x, z, r, y + 0.02) - y

export interface MoveResult {
  landed: boolean
  /** How fast he hit the ground, for landing noise. */
  impact: number
  hitCeiling: boolean
  hitWall: boolean
  wallNx: number
  wallNz: number
}

/**
 * Moves a body by its velocity over dt: sideways first, sliding along walls and stepping up small
 * steps, then up or down, landing on whatever's below or bumping whatever's above.
 */
export function moveBody(L: Level, b: Body, dt: number, opts: { stepUp: number; stepDown: number }): MoveResult {
  const res: MoveResult = { landed: false, impact: 0, hitCeiling: false, hitWall: false, wallNx: 0, wallNz: 0 }
  const dx = b.vx * dt, dz = b.vz * dt
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.12))
  const up = b.grounded ? opts.stepUp : 0.05
  for (let i = 0; i < steps; i++) {
    b.x += dx / steps
    b.z += dz / steps
    const p = pushOut(L, b, up)
    if (p.pushed) {
      res.hitWall = true; res.wallNx = p.nx; res.wallNz = p.nz
      const vn = b.vx * p.nx + b.vz * p.nz
      if (vn < 0) { b.vx -= vn * p.nx; b.vz -= vn * p.nz }
    }
    // Step up onto anything low enough, if there's room to stand on it.
    if (b.grounded) {
      const g = supportAt(L, b.x, b.z, b.r * 0.7, b.y + opts.stepUp)
      if (g > b.y + 1e-4) {
        if (headroom(L, b.x, b.z, b.r * 0.9, g) >= b.h - 1e-3) b.y = g
        else pushOut(L, b, 0)
      }
    }
  }
  // Up and down.
  const prevY = b.y
  b.y += b.vy * dt
  if (b.vy <= 0) {
    // A little above his feet counts too, so feet that end up just under a floor land on it.
    const g = supportAt(L, b.x, b.z, b.r * 0.7, prevY + (b.grounded ? 1e-3 : 0.25))
    if (b.y <= g) {
      res.impact = -b.vy
      res.landed = !b.grounded
      b.y = g; b.vy = 0; b.grounded = true
    } else if (b.grounded && b.vy === 0 && prevY - g <= opts.stepDown) {
      b.y = g
    } else b.grounded = false
  } else {
    b.grounded = false
    const c = roofAt(L, b.x, b.z, b.r * 0.9, prevY + b.h - 1e-3)
    if (b.y + b.h > c) { b.y = c - b.h; b.vy = 0; res.hitCeiling = true }
  }
  return res
}

/** Does the body overlap anything solid where it is? */
export function bodyBlocked(L: Level, b: Body): boolean {
  for (const s of near(L, b)) {
    if (s.y1 <= b.y + 1e-4 || s.y0 >= b.y + b.h - 1e-4) continue
    if (circleGap(s, b.x, b.z, b.r) < -1e-4) return true
  }
  return false
}

export type { Box }
