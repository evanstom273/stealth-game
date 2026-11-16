export type MoveState = 'idle' | 'walk' | 'sneak' | 'run' | 'slide' | 'air' | 'climb' | 'hang' | 'blink'

/** Noise levels: 0 silent, 1 soft, 2 noticeable, 3 loud. Guards will hear these once they exist. */
export const NOISE = {
  silent: 0,
  soft: 1,
  noticeable: 2,
  loud: 3,
} as const

export const NOISE_NAMES = ['silent', 'soft', 'noticeable', 'loud'] as const

/** The steady noise he makes while doing something. Landings and blinks add one-off noises. */
export function noiseFor(state: MoveState, onMetal: boolean): number {
  switch (state) {
    case 'run':
      return NOISE.loud
    case 'slide':
      return NOISE.noticeable
    case 'walk':
      return NOISE.soft
    case 'climb':
      return onMetal ? NOISE.loud : NOISE.soft
    case 'blink':
      return NOISE.loud
    default:
      return NOISE.silent
  }
}

/** A landing's noise from how fast he hit the ground, in units of his own size per second. */
export function landingNoise(impactSpeedInS: number, sneaking: boolean): number {
  if (impactSpeedInS < 6) return sneaking ? NOISE.silent : NOISE.soft
  if (impactSpeedInS < 11) return NOISE.noticeable
  return NOISE.loud
}
