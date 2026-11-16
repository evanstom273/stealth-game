import type { Rect, Vec } from '../logic/geometry.ts'
import { S } from '../tuning.ts'

export interface Solid extends Rect {
  /** Metal is loud to climb on. */
  metal?: boolean
}

export interface Room {
  bounds: Rect
  solids: Solid[]
  lamps: Vec[]
  /** Stand-in checkpoints: touching one refills blink charges. Not a checkpoint design. */
  checkpoints: Vec[]
  /** Where his feet start. */
  spawn: Vec
}

const r = (x: number, y: number, w: number, h: number, metal = false): Solid => ({ x: x * S, y: y * S, w: w * S, h: h * S, metal })

/**
 * The test room, in units of S with the ceiling's underside at 0 and the floor at 12.
 * Left to right: a lit start with a checkpoint and a rest ledge halfway up the wall, a ledge, a thin wall to blink through or climb
 * over, a high ledge, a thick hanging block with a gap only a slide gets under, then a metal
 * wall and metal ledge to hear the difference, and a second checkpoint.
 */
export const TEST_ROOM: Room = {
  bounds: { x: -1 * S, y: -1 * S, w: 42 * S, h: 14 * S },
  solids: [
    r(-1, -1, 42, 1), // ceiling
    r(-1, 12, 42, 1), // floor
    r(-1, 0, 1, 12), // left wall
    r(40, 0, 1, 12, true), // right wall, metal
    r(0, 6.2, 1.6, 0.4), // rest ledge on the left wall: a full-height climb takes longer than his grip lasts
    r(8.5, 8.6, 5, 0.4), // ledge 1
    r(17.5, 3.5, 0.25, 8.5), // thin wall
    r(20, 6, 5, 0.4), // ledge 2
    r(29, 0, 3, 11.1), // thick hanging block: 0.9 S gap underneath
    r(34.5, 7, 4, 0.4, true), // metal ledge
  ],
  lamps: [
    { x: 5 * S, y: 9.2 * S },
    { x: 22.5 * S, y: 3.4 * S },
    { x: 36.5 * S, y: 9.4 * S },
  ],
  checkpoints: [
    { x: 1.6 * S, y: 12 * S },
    { x: 38.6 * S, y: 12 * S },
  ],
  spawn: { x: 3.5 * S, y: 12 * S },
}
