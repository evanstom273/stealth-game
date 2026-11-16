import type { BlinkConfig } from './logic/blink.ts'
import type { ClimbConfig } from './logic/climb.ts'

/**
 * Starting values for the thief, approved as a starting point (design doc, History #46).
 * All of them are meant to be tuned in play. Distances are world pixels; S is his body width.
 */
export const S = 64

export const BODY = {
  /** Hitbox width: the plain shape, not the floating hands (style guide §3.2). */
  w: 0.8 * S,
  /** Head top to feet bottom. */
  h: 1.31 * S,
  /** Hitbox height while sliding. */
  slideH: 0.62 * S,
  /** From the hitbox top down to the drawing's origin (the body's centre). */
  originFromTop: 0.69 * S,
}

export const MOVE = {
  walk: 2.6 * S,
  run: 4.7 * S,
  sneak: 1.05 * S,
  groundAccel: 38 * S,
  groundDecel: 46 * S,
  airAccel: 22 * S,
  gravity: 31 * S,
  jumpVelocity: 10 * S,
  /** Letting go of jump early cuts the rise to this fraction. */
  jumpCut: 0.45,
  coyoteTime: 0.08,
  jumpBuffer: 0.12,
  /** A grab pressed slightly early still catches a surface that comes into reach. */
  grabBuffer: 0.25,
  maxFall: 16 * S,
}

export const SLIDE = {
  /** He has to be going at least this fraction of run speed to slide. */
  minSpeedFactor: 0.8,
  boost: 1.12,
  friction: 6.5 * S,
  /** Below this speed the slide ends, if there's room to stand. */
  endSpeed: 1.4 * S,
}

export const CLIMB = {
  wallSpeed: 1.6 * S,
  ceilingSpeed: 1.3 * S,
  /** How far from a surface he can still grab it. */
  reachSide: 0.6 * S,
  reachUp: 0.8 * S,
  /** Gap between his hitbox and the wall while he holds on. */
  wallGap: 0.35 * S,
  /** Gap between the top of his head and the ceiling while he hangs. */
  ceilingGap: 0.41 * S,
  wallJump: { x: 3.6 * S, y: 8 * S },
}

export const GRIP = {
  // Lyra's first playtest: 6 s and 3 s were far too little to climb a level (History #47).
  wallSeconds: 15,
  ceilingSeconds: 7.5,
  recoverSeconds: 1.5,
}

export const BLINK = {
  // Raised after Lyra's first playtest, for now (History #48).
  charges: 5,
  range: 6 * S,
  /** Solids thinner than this (in their thinnest direction) can be blinked through. */
  thinMax: 0.5 * S,
  duration: 1.0,
}

export const LIGHT = {
  lampRadius: 6 * S,
  lampClear: 0.25,
  /** The vision pool: lets the player see, never lights him. */
  poolRadius: 3.2 * S,
  poolStrength: 0.5,
  darkness: 0.9,
}

/** How big he is on screen, in CSS pixels, from the screen's shorter side. */
export function screenS(minSideCss: number): number {
  return Math.min(64, Math.max(50, minSideCss / 7.35))
}

export const CLIMB_CFG: ClimbConfig = {
  wallSpeed: CLIMB.wallSpeed,
  ceilingSpeed: CLIMB.ceilingSpeed,
  reachSide: CLIMB.reachSide,
  reachUp: CLIMB.reachUp,
  wallGap: CLIMB.wallGap,
  ceilingGap: CLIMB.ceilingGap,
  minWallFace: 0.6 * S,
  mantleInset: 0.1 * S,
}

export const BLINK_CFG: BlinkConfig = {
  range: BLINK.range,
  thinMax: BLINK.thinMax,
  body: { w: BODY.w, h: BODY.h },
  reachSide: CLIMB.reachSide,
  reachUp: CLIMB.reachUp,
  wallGap: CLIMB.wallGap,
  ceilingGap: CLIMB.ceilingGap,
  minWallFace: 0.6 * S,
  standSnap: 0.35 * S,
}
