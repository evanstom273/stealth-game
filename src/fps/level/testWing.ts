import { buildLevel, carveMap, type Box, type Level, type TileType } from './level.ts'

/**
 * Test Wing: one level with something for every first-person mechanic.
 * - The start room (spawn, a checkpoint, a crate to climb onto) leads east to a corridor with a guard at its post.
 * - A crouch duct and a crawl-only vent run north from the start room to the vault, with a second checkpoint.
 * - The hall: a balcony two up along its north side, over a guard to drop onto; a catwalk across it
 *   reached by a slanted pipe; crates; a loading pit; a glass office to blink through.
 * - A low corridor east of the hall, its ceiling in reach of a jump, with a guard walking below.
 * Thick walls everywhere else stop a blink.
 */

const T: Record<string, TileType> = {
  '#': { floor: 0, ceil: 0, name: 'wall', wall: true },
  '.': { floor: 0, ceil: 3, name: 'floor' },
  v: { floor: 0, ceil: 0.66, name: 'vent' },
  g: { floor: 0, ceil: 1.05, name: 'duct' },
  h: { floor: 0, ceil: 4.5, name: 'hall floor' },
  b: { floor: 2, ceil: 4.5, name: 'balcony' },
  p: { floor: -1, ceil: 4.5, name: 'loading pit' },
}

const MAP = carveMap(40, 26, [
  [1, 3, 8, 10, '.'], // vault
  [4, 11, 5, 12, 'v'], // vent
  [4, 13, 5, 13, 'g'], // crouch duct
  [1, 14, 8, 22, '.'], // start room
  [9, 16, 16, 19, '.'], // corridor
  [17, 9, 31, 22, 'h'], // hall
  [17, 6, 31, 8, 'b'], // balcony
  [25, 16, 29, 19, 'p'], // loading pit
  [32, 11, 32, 13, '.'], // way through to the low corridor
  [33, 10, 38, 14, '.'], // low corridor
])

const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, kind: Box['kind'], name: string): Box => ({ x0, y0, z0, x1, y1, z1, kind, name })

// The slanted pipe: from the hall floor up to the catwalk, walked as a run of shallow steps.
const PIPE = { x: 23.5, z0: 20.6, z1: 14.2, y0: 0.1, y1: 2.75, radius: 0.22 }
const pipeSteps: Box[] = []
{
  const n = 12
  for (let i = 0; i < n; i++) {
    const za = PIPE.z0 + ((PIPE.z1 - PIPE.z0) * i) / n
    const zb = PIPE.z0 + ((PIPE.z1 - PIPE.z0) * (i + 1)) / n
    const top = PIPE.y0 + ((PIPE.y1 - PIPE.y0) * (i + 1)) / n
    pipeSteps.push(box(PIPE.x - 0.25, top - 0.3, Math.min(za, zb), PIPE.x + 0.25, top, Math.max(za, zb), 'pipe', 'pipe'))
  }
}

export const TEST_WING: Level = buildLevel(MAP, T, {
  boxes: [
    box(6, 0, 15, 7, 1, 16, 'crate', 'crate'),
    box(28, 0, 9, 29, 1, 10, 'crate', 'crate'),
    box(29, 0, 9, 30, 2, 10, 'crate', 'stacked crates'),
    box(26, 0, 14, 27, 1, 15, 'crate', 'crate'),
    box(17, 2.6, 13.2, 32, 2.75, 14.2, 'catwalk', 'catwalk'),
    ...pipeSteps,
  ],
  thin: [
    box(17, 0, 17.96, 22, 4.5, 18.04, 'glass', 'glass'),
    box(21.96, 0, 18, 22.04, 4.5, 21, 'glass', 'glass'),
    box(21.96, 0, 22, 22.04, 4.5, 23, 'glass', 'glass'),
  ],
  lamps: [
    { x: 4.5, y: 2.75, z: 6.5 },
    { x: 4.5, y: 2.75, z: 18 },
    { x: 10, y: 2.75, z: 17.5 },
    { x: 21, y: 4.25, z: 11 },
    { x: 28, y: 4.25, z: 20.5 },
    { x: 19.5, y: 4.25, z: 20.5 },
    { x: 37.5, y: 2.75, z: 12 },
  ],
  checkpoints: [
    { x: 2.5, z: 21.5 },
    { x: 2.5, z: 4.5 },
    { x: 37.5, z: 13.5 },
  ],
  spawn: { x: 3.5, y: 0, z: 19.5, yaw: -Math.PI / 2 },
  guards: [
    { x: 14.5, z: 17.5, facing: [1, 0], turn: [-1, 0] },
    { x: 24.5, z: 10.5, facing: [0, 1], turn: [-1, 0] },
    { x: 33.5, z: 12, facing: [1, 0], patrol: [{ x: 33.5, z: 12 }, { x: 37.5, z: 12 }] },
  ],
  pipe: PIPE,
})
