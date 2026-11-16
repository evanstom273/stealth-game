/**
 * First-person levels: tiles with their own floor and ceiling heights, plus freeform pieces dropped
 * in on top (History #97). One tile is 1 S. y is up; x runs east and z runs south.
 */

export type BoxKind = 'tile' | 'crate' | 'catwalk' | 'pipe' | 'glass'

/** An axis-aligned solid. */
export interface Box {
  x0: number
  y0: number
  z0: number
  x1: number
  y1: number
  z1: number
  kind: BoxKind
  name: string
}

export interface V3 {
  x: number
  y: number
  z: number
}

export interface GuardSpot {
  x: number
  z: number
  /** The way it faces, and the way it turns to every few seconds. */
  facing: [number, number]
  turn?: [number, number]
  /** Walks back and forth between these instead of standing at a post. */
  patrol?: [{ x: number; z: number }, { x: number; z: number }]
}

export interface TileType {
  floor: number
  ceil: number
  name: string
  wall?: boolean
}

export interface Level {
  cols: number
  rows: number
  floor: Float32Array
  ceil: Float32Array
  wall: Uint8Array
  names: string[]
  /** Freeform pieces: crates, the catwalk, the steps of the slanted pipe. */
  boxes: Box[]
  /** Glass walls: thin, full height, solid to walk into, passable for a blink. */
  thin: Box[]
  lamps: V3[]
  checkpoints: { x: number; z: number }[]
  spawn: V3 & { yaw: number }
  guards: GuardSpot[]
  /** The slanted pipe, for drawing it round (its collision is the steps in `boxes`). */
  pipe: { x: number; z0: number; z1: number; y0: number; y1: number; radius: number } | null
}

const BIG = 60

export const idx = (L: Level, c: number, r: number) => r * L.cols + c
export const inside = (L: Level, c: number, r: number) => c >= 0 && r >= 0 && c < L.cols && r < L.rows
export const isWall = (L: Level, c: number, r: number) => !inside(L, c, r) || L.wall[idx(L, c, r)] === 1
export const floorAt = (L: Level, c: number, r: number) => (isWall(L, c, r) ? BIG : L.floor[idx(L, c, r)])
export const ceilAt = (L: Level, c: number, r: number) => (isWall(L, c, r) ? -BIG : L.ceil[idx(L, c, r)])
export const tileOf = (x: number, z: number): [number, number] => [Math.floor(x), Math.floor(z)]

/** Builds a level from rows of characters and a legend of what each character means. */
export function buildLevel(map: string[], legend: Record<string, TileType>, extra: Omit<Level, 'cols' | 'rows' | 'floor' | 'ceil' | 'wall' | 'names'>): Level {
  const rows = map.length
  const cols = map[0].length
  const floor = new Float32Array(cols * rows)
  const ceil = new Float32Array(cols * rows)
  const wall = new Uint8Array(cols * rows)
  const names: string[] = new Array(cols * rows).fill('')
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = legend[map[r][c]]
      if (!t) throw new Error(`No tile type for '${map[r][c]}' at ${c},${r}`)
      const i = r * cols + c
      wall[i] = t.wall ? 1 : 0
      floor[i] = t.floor
      ceil[i] = t.ceil
      names[i] = t.name
    }
  }
  return { cols, rows, floor, ceil, wall, names, ...extra }
}

/** A map grid filled with walls, carved into with rectangles of tile characters. */
export function carveMap(cols: number, rows: number, cuts: [number, number, number, number, string][]): string[] {
  const g = Array.from({ length: rows }, () => Array.from({ length: cols }, () => '#'))
  for (const [x0, z0, x1, z1, ch] of cuts) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) g[z][x] = ch
  return g.map((row) => row.join(''))
}

const overlaps2 = (b: Box, x0: number, z0: number, x1: number, z1: number) => b.x0 < x1 && b.x1 > x0 && b.z0 < z1 && b.z1 > z0

/** Every solid near an area of the ground: tile columns (below floors, above ceilings, walls), freeform pieces and glass. */
export function solidsNear(L: Level, x0: number, z0: number, x1: number, z1: number): Box[] {
  const out: Box[] = []
  const c0 = Math.floor(x0) - 1, c1 = Math.floor(x1) + 1, r0 = Math.floor(z0) - 1, r1 = Math.floor(z1) + 1
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if (isWall(L, c, r)) out.push({ x0: c, x1: c + 1, z0: r, z1: r + 1, y0: -BIG, y1: BIG, kind: 'tile', name: 'wall' })
      else {
        const i = idx(L, c, r)
        out.push({ x0: c, x1: c + 1, z0: r, z1: r + 1, y0: -BIG, y1: L.floor[i], kind: 'tile', name: L.names[i] })
        out.push({ x0: c, x1: c + 1, z0: r, z1: r + 1, y0: L.ceil[i], y1: BIG, kind: 'tile', name: 'ceiling' })
      }
    }
  }
  for (const b of L.boxes) if (overlaps2(b, x0 - 1, z0 - 1, x1 + 1, z1 + 1)) out.push(b)
  for (const b of L.thin) if (overlaps2(b, x0 - 1, z0 - 1, x1 + 1, z1 + 1)) out.push(b)
  return out
}

const within = (b: Box, x: number, y: number, z: number) => x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1 && z >= b.z0 && z < b.z1

/** The solid at a point, if any. */
export function solidAt(L: Level, x: number, y: number, z: number): Box | null {
  const [c, r] = tileOf(x, z)
  if (isWall(L, c, r)) return { x0: c, x1: c + 1, z0: r, z1: r + 1, y0: -BIG, y1: BIG, kind: 'tile', name: 'wall' }
  const i = idx(L, c, r)
  if (y < L.floor[i]) return { x0: c, x1: c + 1, z0: r, z1: r + 1, y0: -BIG, y1: L.floor[i], kind: 'tile', name: L.names[i] }
  if (y >= L.ceil[i]) return { x0: c, x1: c + 1, z0: r, z1: r + 1, y0: L.ceil[i], y1: BIG, kind: 'tile', name: 'ceiling' }
  for (const b of L.boxes) if (within(b, x, y, z)) return b
  for (const b of L.thin) if (within(b, x, y, z)) return b
  return null
}

export const pointSolid = (L: Level, x: number, y: number, z: number) => solidAt(L, x, y, z) !== null

/** How far a circle on the ground is from a box's footprint: under zero means they overlap. */
export function circleGap(b: Box, x: number, z: number, r: number): number {
  const cx = Math.max(b.x0, Math.min(x, b.x1)), cz = Math.max(b.z0, Math.min(z, b.z1))
  return Math.hypot(x - cx, z - cz) - r
}

/** The highest top under a circle that's no higher than `maxY`, or -Infinity. */
export function groundBelow(solids: readonly Box[], x: number, z: number, r: number, maxY: number): number {
  let best = -Infinity
  for (const s of solids) if (s.y1 <= maxY + 1e-6 && s.y1 > best && circleGap(s, x, z, r) < 0) best = s.y1
  return best
}

/** The lowest underside over a circle that's no lower than `minY`, or Infinity. */
export function ceilingAbove(solids: readonly Box[], x: number, z: number, r: number, minY: number): number {
  let best = Infinity
  for (const s of solids) if (s.y0 >= minY - 1e-6 && s.y0 < best && circleGap(s, x, z, r) < 0) best = s.y0
  return best
}

/** Is anything solid between two points? Steps along the line. */
export function lineBlocked(L: Level, a: V3, b: V3, step = 0.1, ignoreGlass = false): boolean {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z
  const n = Math.max(1, Math.ceil(Math.hypot(dx, dy, dz) / step))
  for (let i = 1; i < n; i++) {
    const t = i / n
    const s = solidAt(L, a.x + dx * t, a.y + dy * t, a.z + dz * t)
    if (s && !(ignoreGlass && s.kind === 'glass')) return true
  }
  return false
}

/** Is a thick wall between two points on the ground? (Light ignores everything else.) */
export function wallBetween(L: Level, ax: number, az: number, bx: number, bz: number): boolean {
  const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.25))
  for (let i = 1; i < n; i++) {
    const t = i / n
    if (isWall(L, Math.floor(ax + (bx - ax) * t), Math.floor(az + (bz - az) * t))) return true
  }
  return false
}
