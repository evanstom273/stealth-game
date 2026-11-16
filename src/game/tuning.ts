import type { BlinkConfig } from './logic/blink.ts'
import type { ClimbConfig } from './logic/climb.ts'
import type { SightConfig, TakedownConfig } from './logic/combat.ts'

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
  // Ceilings drain at the same rate as walls (History #49).
  wallSeconds: 15,
  ceilingSeconds: 15,
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

/** The test guard (History #85): a staff watchman at 1.25 times his size (History #76, #81). */
export const GUARD = {
  scale: 1.25,
  w: 0.84 * 1.25 * S,
  h: 1.33 * 1.25 * S,
  /** From the hitbox top down to the drawing's origin. */
  originFromTop: 0.71 * 1.25 * S,
  /** From the hitbox top down to its eyes. */
  eyeFromTop: 0.27 * 1.25 * S,
  turnEvery: 2.4,
  chaseSpeed: 2.4 * S,
  returnSpeed: 1.4 * S,
  /** Suspicion per second while he's seen, more when he's close; it fills to 1 to alert. */
  suspicionRate: 0.9,
  suspicionCloseBonus: 2.2,
  suspicionDecay: 0.35,
  /** Seconds without seeing him before an alerted guard gives up and goes back. */
  giveUpAfter: 3.5,
  attackReach: 1.05 * S,
  windup: 0.45,
  strike: 0.1,
  recover: 0.5,
  cooldown: 0.35,
  flinch: 0.22,
  stagger: 1.6,
  blinkStun: 1.2,
  /** Testing convenience: downed guards come back after this long. */
  downFor: 8,
}

export const SIGHT_CFG: SightConfig = {
  halfAngle: (25 * Math.PI) / 180,
  lightRange: 7 * S,
  darkRange: 1.6 * S,
}

export const COMBAT = {
  /** Each blow of the jab, cross, shove combo: its length and when it lands. */
  attackTime: 0.24,
  hitFrom: 0.07,
  /** A press within this long of the last blow carries the combo on. */
  comboWindow: 0.45,
  reach: 1.15 * S,
  dodgeTime: 0.22,
  dodgeSpeed: 7.5 * S,
  dodgeCooldown: 0.35,
  /** Hold Attack this long to kill instead of knocking out. */
  killHold: 0.35,
  hitStop: 0.05,
  /** Knockback when a guard's punch lands on him (he's invulnerable for now). */
  knockback: { x: 3 * S, y: 2 * S },
  hurtLock: 0.25,
}

/** The pounce from a ceiling or wall (History #89). Seconds, except the squash. */
export const POUNCE = {
  windup: 0.25,
  leap: 0.42,
  /** On the guard after the impact, before stepping off. */
  pin: 0.45,
  stepOff: 0.25,
  hitStop: 0.1,
  /** How much he coils against the surface in the wind-up. */
  squash: 0.18,
  ghosts: 3,
  /** How far behind each other the afterimages are, as a share of the leap. */
  ghostGap: 0.09,
  /** The nearest afterimage's opacity; each further one is fainter. */
  ghostAlpha: 0.45,
  /** How long the impact ring takes to spread and fade. */
  ring: 0.5,
}

export const TAKEDOWN_CFG: TakedownConfig = {
  behindReach: 1.3 * S,
  dropReach: 0.9 * S,
  dropDepth: 4 * S,
  leapReach: 4 * S,
  /** Generous, because the shove knocks a guard back and the finisher dashes in. */
  finisherReach: 2.1 * S,
}
