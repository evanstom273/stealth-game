/**
 * Starting values for the first-person game (History #92–#107), in units of S: his height unit,
 * which is one world unit here. Carried over from side-on where they apply.
 */

const deg = (d: number) => (d * Math.PI) / 180

export const BODY = {
  r: 0.3,
  standH: 1.4,
  crouchH: 0.95,
  crawlH: 0.6,
  /** Hanging from a ceiling he tucks up. */
  hangH: 0.9,
  standEye: 1.22,
  crouchEye: 0.78,
  crawlEye: 0.42,
  stepUp: 0.36,
  stepDown: 0.45,
}

export const MOVE = {
  walk: 2.6,
  run: 4.7,
  /** Crouching is sneaking (History #100). */
  sneak: 1.05,
  crawl: 0.8,
  accel: 22,
  airAccel: 7,
  gravity: 18,
  jump: 6.4,
  /** Let go of jump early and he rises no faster than this. */
  jumpCut: 2.2,
  maxFall: 20,
  slideBoost: 1.12,
  slideDecel: 4.2,
  /** A slide needs this much of run speed to start. */
  slideFrom: 0.8,
  coyote: 0.1,
  jumpBuffer: 0.12,
}

export const CLIMB = {
  /** How far past his body a wall can be and still be grabbed. */
  reach: 0.55,
  /** How far above his head a ceiling can be grabbed. */
  ceilingReach: 0.8,
  wallSpeed: 1.6,
  wallDown: 2.2,
  sideSpeed: 1.3,
  ceilingSpeed: 1.3,
  /** Grip: 15 s on walls and ceilings alike, recovering in 1.5 s on the ground (History #47, #49). */
  gripSeconds: 15,
  recoverSeconds: 1.5,
  grabBuffer: 0.25,
  mantleTime: 0.35,
  kickOut: 3.5,
  kickUp: 4.5,
  /** Looking up at least this much, Grab goes for the ceiling. */
  lookUp: deg(20),
}

export const BLINK = {
  charges: 5,
  range: 6,
  /** How long he's gone between leaving and arriving. */
  travel: 0.25,
  /** The camera pulling up into the top-down view, and dropping back. */
  enter: 0.25,
  exit: 0.22,
  /** Time runs at a fifth while he aims (History #104). */
  slow: 0.2,
  /** Lean in the top-down view: this share of distance from the middle per S of height (History #106). */
  lean: 0.05,
}

export const LOOK = {
  fov: 75,
  mouse: 0.0024,
  stick: 2.6,
  keys: 2.0,
  /** Free look up and down (History #99). */
  pitchMax: deg(85),
  bob: 0.035,
}

export const LEAN = { offset: 0.45, roll: 0.14, speed: 8 }

/** Full light within a quarter of the radius of a lamp, fading to nothing at its edge. */
export const LIGHT = { radius: 6, clear: 0.25 }

export const GUARD = {
  r: 0.4,
  h: 1.7,
  eye: 1.45,
  turnEvery: 2.4,
  chaseSpeed: 2.4,
  returnSpeed: 1.4,
  suspicionRate: 0.9,
  suspicionCloseBonus: 2.2,
  suspicionDecay: 0.35,
  giveUpAfter: 3.5,
  attackReach: 1.05,
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

export const SIGHT = {
  halfAngle: deg(25),
  lightRange: 7,
  darkRange: 1.6,
  /** How far up or down a guard can see from straight ahead. */
  vertical: deg(50),
}

export const COMBAT = {
  attackTime: 0.24,
  hitFrom: 0.07,
  comboWindow: 0.45,
  reach: 1.15,
  /** How far off the middle of his view a blow still lands. */
  arc: deg(40),
  dodgeTime: 0.22,
  dodgeSpeed: 7.5,
  dodgeCooldown: 0.35,
  killHold: 0.35,
  hitStop: 0.05,
  knockback: 3,
  knockUp: 2,
  hurtLock: 0.25,
}

export const TAKEDOWN = {
  behindReach: 1.4,
  /** How far round behind a guard counts as behind it (as a dot product). */
  behindDot: -0.3,
  /** He has to be looking at the guard, within this angle. */
  lookArc: deg(45),
  finisherReach: 2.1,
  dropReach: 2.6,
  dropMinAbove: 0.6,
  dropMaxAbove: 5,
}
