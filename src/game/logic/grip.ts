export type GripMode = 'wall' | 'ceiling' | 'ground' | 'air'

export interface GripRates {
  wallSeconds: number
  ceilingSeconds: number
  recoverSeconds: number
}

/**
 * Grip runs from 1 (fresh) to 0 (he lets go). It drains while he holds a wall, twice as fast
 * upside down by default, and recovers on floors and ledges. In the air it holds steady.
 */
export function stepGrip(grip: number, mode: GripMode, dt: number, rates: GripRates): number {
  let g = grip
  if (mode === 'wall') g -= dt / rates.wallSeconds
  else if (mode === 'ceiling') g -= dt / rates.ceilingSeconds
  else if (mode === 'ground') g += dt / rates.recoverSeconds
  return Math.min(1, Math.max(0, g))
}
