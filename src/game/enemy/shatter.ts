/**
 * The kill (History #88): the guard breaks into the shapes it's made of, which scatter, tumble to
 * the floor and fade. Everything here is in the guard's own drawing units (multiply by 1.25 S),
 * measured from its body centre, facing right; the caller flips x for a guard facing left.
 */

export type PieceShape =
  | { kind: 'rect'; w: number; h: number }
  /** A quarter of the head: a wedge from the head's centre, drawn around the piece's position. */
  | { kind: 'wedge'; a0: number; apex: { x: number; y: number } }
  | { kind: 'cap' }
  | { kind: 'circle'; r: number }

export interface Piece {
  shape: PieceShape
  color: 'body' | 'skin' | 'dark' | 'feet'
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  spin: number
  /** Roughly how far the piece reaches below its centre, for resting on the floor. */
  low: number
  resting: boolean
}

export const SHATTER = {
  gravity: 9,
  /** The floor, below the body centre (the guard's feet). */
  floor: 0.62,
  fadeFrom: 1.0,
  fadeFor: 1.0,
}

export const HEAD = { x: 0, y: -0.43, r: 0.28 }

/** The pieces at the moment of the kill, flying apart. `rand` returns 0–1. */
export function shatterPieces(rand: () => number): Piece[] {
  const ps: Piece[] = []
  const piece = (shape: PieceShape, color: Piece['color'], x: number, y: number, vx: number, vy: number, spin: number, low: number) =>
    ps.push({ shape, color, x, y, vx, vy, angle: 0, spin, low, resting: false })

  // The body in four chunks.
  for (const [x, y] of [[-0.42, -0.16], [0, -0.16], [-0.42, 0.17], [0, 0.17]]) {
    piece({ kind: 'rect', w: 0.42, h: 0.33 }, 'body', x + 0.21, y + 0.165, (rand() - 0.5) * 3, -1.5 - rand() * 2, (rand() - 0.5) * 8, 0.2)
  }
  // The head in four wedges.
  for (let a = 0; a < 4; a++) {
    const mid = a * (Math.PI / 2) + Math.PI / 4
    const off = { x: Math.cos(mid) * 0.12, y: Math.sin(mid) * 0.12 }
    piece({ kind: 'wedge', a0: a * (Math.PI / 2), apex: { x: -off.x, y: -off.y } }, 'skin', HEAD.x + off.x, HEAD.y + off.y, (rand() - 0.5) * 3, -2.5 - rand() * 2, (rand() - 0.5) * 9, 0.2)
  }
  piece({ kind: 'cap' }, 'dark', 0, -0.72, 0.8, -3.5, 5, 0.1)
  for (const sx of [-1, 1]) piece({ kind: 'circle', r: 0.16 }, 'skin', sx * 0.68, 0.18, sx * 2, -1.5, sx * 2, 0.16)
  for (const x of [-0.22, 0.24]) piece({ kind: 'rect', w: 0.36, h: 0.22 }, 'feet', x, 0.51, (x > 0 ? 1 : -1) * (0.6 + rand()), -1 - rand(), (rand() - 0.5) * 6, 0.11)
  return ps
}

/** Moves a piece on by dt: it falls, and comes to rest on the floor. */
export function stepPiece(p: Piece, dt: number) {
  if (p.resting) {
    p.vx *= Math.exp(-10 * dt)
    p.spin *= Math.exp(-10 * dt)
  } else p.vy += SHATTER.gravity * dt
  p.x += p.vx * dt
  p.y += p.vy * dt
  p.angle += p.spin * dt
  if (!p.resting && p.y + p.low >= SHATTER.floor && p.vy > 0) {
    p.y = SHATTER.floor - p.low
    p.vy = 0
    p.vx *= 0.35
    p.spin *= 0.3
    p.resting = true
  }
}

/** How visible the pieces are, this long after the kill. */
export function shatterAlpha(age: number): number {
  return Math.max(0, Math.min(1, 1 - (age - SHATTER.fadeFrom) / SHATTER.fadeFor))
}

/** The outline of a piece, in its own units around its position, turned by its angle. */
export function pieceOutline(p: Piece): { x: number; y: number }[] {
  const s = p.shape
  let pts: { x: number; y: number }[]
  if (s.kind === 'rect') pts = [{ x: -s.w / 2, y: -s.h / 2 }, { x: s.w / 2, y: -s.h / 2 }, { x: s.w / 2, y: s.h / 2 }, { x: -s.w / 2, y: s.h / 2 }]
  else if (s.kind === 'wedge') {
    pts = [{ ...s.apex }]
    for (let i = 0; i <= 6; i++) {
      const a = s.a0 + (i / 6) * (Math.PI / 2)
      pts.push({ x: s.apex.x + Math.cos(a) * HEAD.r, y: s.apex.y + Math.sin(a) * HEAD.r })
    }
  } else if (s.kind === 'cap') {
    // The crown and the peak, around the piece's centre.
    pts = [{ x: -0.22, y: -0.1 }, { x: 0.22, y: -0.1 }, { x: 0.22, y: 0.02 }, { x: 0.38, y: 0.02 }, { x: 0.44, y: 0.08 }, { x: -0.3, y: 0.08 }, { x: -0.24, y: 0.02 }, { x: -0.22, y: 0.02 }]
  } else {
    pts = []
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      pts.push({ x: Math.cos(a) * s.r, y: Math.sin(a) * s.r })
    }
  }
  const c = Math.cos(p.angle)
  const sn = Math.sin(p.angle)
  return pts.map((q) => ({ x: q.x * c - q.y * sn, y: q.x * sn + q.y * c }))
}
