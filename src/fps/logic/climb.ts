import { solidAt, type Level } from '../level/level.ts'
import { BODY, CLIMB } from '../tuning.ts'
import { headroom, pushOut, roofAt, supportAt, type Body } from './body.ts'

/**
 * Climbing in first person (History #94, Claude's first take): any wall can be held, he climbs up
 * and down and along it, mantles over the top of a ledge, and goes round into a ceiling; ceilings
 * can be hung from and moved along, and going along one into a wall carries him onto the wall.
 */

/** The face of a wall he's holding: its outward normal (one of ±x, ±z) and where its plane is. */
export interface Face {
  nx: number
  nz: number
  plane: number
}

export type Grab =
  | { kind: 'wall'; face: Face }
  | { kind: 'ceiling'; ceilY: number }
  | { kind: 'mantle'; x: number; y: number; z: number }

export const forward = (yaw: number): [number, number] => [-Math.sin(yaw), -Math.cos(yaw)]

/** Walks a probe out from (x, z) along a direction at one height and returns the face of the first solid it meets. */
export function findFace(L: Level, x: number, y: number, z: number, dx: number, dz: number, dist: number): Face | null {
  let px = x, pz = z
  for (let t = 0.04; t <= dist + 1e-6; t += 0.04) {
    const qx = x + dx * t, qz = z + dz * t
    const s = solidAt(L, qx, y, qz)
    if (s) {
      if (px < s.x0 && qx >= s.x0) return { nx: -1, nz: 0, plane: s.x0 }
      if (px >= s.x1 && qx < s.x1) return { nx: 1, nz: 0, plane: s.x1 }
      if (pz < s.z0 && qz >= s.z0) return { nx: 0, nz: -1, plane: s.z0 }
      if (pz >= s.z1 && qz < s.z1) return { nx: 0, nz: 1, plane: s.z1 }
      return null
    }
    px = qx; pz = qz
  }
  return null
}

/** Is the face still there behind him at this height? */
export function faceBehind(L: Level, b: Body, f: Face, y: number): boolean {
  return solidAt(L, b.x - f.nx * (b.r + 0.1), y, b.z - f.nz * (b.r + 0.1)) !== null
}

/** Holds him flat against a face, just off it. */
export function snapToFace(b: Body, f: Face) {
  if (f.nx) b.x = f.plane + f.nx * (b.r + 0.02)
  else b.z = f.plane + f.nz * (b.r + 0.02)
}

/** The top of a ledge just beyond a face, if he could stand or crouch on it. */
export function ledgeTop(L: Level, b: Body, f: Face, below: number): { x: number; y: number; z: number } | null {
  const x = f.nx ? f.plane - f.nx * (b.r + 0.08) : b.x
  const z = f.nz ? f.plane - f.nz * (b.r + 0.08) : b.z
  const top = supportAt(L, x, z, b.r * 0.7, below)
  if (!Number.isFinite(top)) return null
  if (headroom(L, x, z, b.r * 0.9, top) < BODY.crouchH) return null
  return { x, y: top, z }
}

/** Pressing Grab: a ceiling if he's looking up at one in reach, otherwise a wall in front, or a ledge to pull up onto. */
export function tryGrab(L: Level, b: Body, yaw: number, pitch: number): Grab | null {
  const [fx, fz] = forward(yaw)
  if (pitch > CLIMB.lookUp) {
    const c = roofAt(L, b.x, b.z, b.r * 0.8, b.y + b.h)
    if (c - (b.y + b.h) <= CLIMB.ceilingReach) return { kind: 'ceiling', ceilY: c }
  }
  // Probe at chest height for a wall, and at knee height for a low ledge.
  for (const at of [b.h * 0.6, 0.35]) {
    const f = findFace(L, b.x, b.y + at, b.z, fx, fz, b.r + CLIMB.reach)
    if (!f) continue
    const ledge = ledgeTop(L, b, f, b.y + b.h + 0.5)
    if (ledge && ledge.y > b.y + BODY.stepUp) return { kind: 'mantle', ...ledge }
    if (at > 0.5) return { kind: 'wall', face: f }
  }
  if (pitch > CLIMB.lookUp * 0.5) {
    const c = roofAt(L, b.x, b.z, b.r * 0.8, b.y + b.h)
    if (c - (b.y + b.h) <= CLIMB.ceilingReach) return { kind: 'ceiling', ceilY: c }
  }
  return null
}

export type WallStep =
  | { kind: 'hold' }
  | { kind: 'mantle'; x: number; y: number; z: number }
  | { kind: 'ceiling'; ceilY: number }
  | { kind: 'ground' }

/**
 * One frame on a wall. `up` is -1..1 (W/S); `side` is -1..1 (A/D), along the wall as he faces it.
 * Moves him and says what happened: still holding, over the top, into a ceiling, or down to the ground.
 */
export function stepWall(L: Level, b: Body, f: Face, up: number, side: number, dt: number): WallStep {
  snapToFace(b, f)
  // Along the wall: to his right as he faces it.
  const rx = f.nz, rz = -f.nx
  if (side) {
    const ox = b.x, oz = b.z
    b.x += rx * side * CLIMB.sideSpeed * dt
    b.z += rz * side * CLIMB.sideSpeed * dt
    snapToFace(b, f)
    const p = pushOut(L, b, 0)
    if (!faceBehind(L, b, f, b.y + b.h * 0.6) || p.pushed) { b.x = ox; b.z = oz }
  }
  if (up > 0) {
    const ny = b.y + up * CLIMB.wallSpeed * dt
    // Over the top: the wall has ended below his hands.
    if (!faceBehind(L, b, f, ny + b.h * 0.95)) {
      const ledge = ledgeTop(L, b, f, ny + b.h + 0.3)
      if (ledge && ledge.y > ny + b.h * 0.3) return { kind: 'mantle', ...ledge }
      return { kind: 'hold' }
    }
    // Into a ceiling.
    const c = roofAt(L, b.x, b.z, b.r * 0.8, b.y + b.h - 0.01)
    if (ny + b.h >= c - 0.01) {
      b.y = c - b.h
      return { kind: 'ceiling', ceilY: c }
    }
    b.y = ny
  } else if (up < 0) {
    b.y += up * CLIMB.wallDown * dt
    const g = supportAt(L, b.x, b.z, b.r * 0.7, b.y + b.h * 0.5)
    if (b.y <= g + 0.01) { b.y = g; return { kind: 'ground' } }
  }
  return { kind: 'hold' }
}

export type CeilingStep = { kind: 'hold' } | { kind: 'wall'; face: Face }

/** One frame hanging from a ceiling: moves him the way he's looking, and round onto a wall if he goes into one. */
export function stepCeiling(L: Level, b: Body, ceilY: number, fwd: number, side: number, yaw: number, dt: number): CeilingStep {
  const [fx, fz] = forward(yaw)
  const rx = -fz, rz = fx
  let mx = fx * fwd + rx * side, mz = fz * fwd + rz * side
  const m = Math.hypot(mx, mz)
  if (m < 1e-3) return { kind: 'hold' }
  mx /= m; mz /= m
  const sp = Math.min(1, m) * CLIMB.ceilingSpeed * dt
  const ox = b.x, oz = b.z
  b.x += mx * sp; b.z += mz * sp
  const p = pushOut(L, b, 0)
  if (p.pushed) {
    // Into a wall: round the corner onto it, facing it.
    const nx = Math.abs(p.nx) > Math.abs(p.nz) ? Math.sign(p.nx) : 0
    const nz = nx ? 0 : Math.sign(p.nz)
    const face = findFace(L, b.x, b.y + b.h * 0.6, b.z, -nx, -nz, b.r + 0.3)
    if (face) return { kind: 'wall', face }
    b.x = ox; b.z = oz
    return { kind: 'hold' }
  }
  // The ceiling has to carry on at the same height.
  const c = roofAt(L, b.x, b.z, b.r * 0.6, b.y + b.h - 0.05)
  if (Math.abs(c - ceilY) > 0.06) { b.x = ox; b.z = oz }
  return { kind: 'hold' }
}
