import * as Phaser from 'phaser'
import { bottom, right, type Rect } from '../logic/geometry.ts'
import { INK } from '../style/tokens.ts'
import { S } from '../tuning.ts'
import type { Room, Solid } from './testRoom.ts'

/** Draw order, back to front, following the style guide's layer order (§12.3). */
export const DEPTH = {
  backdrop: 0,
  room: 1,
  edges: 2,
  props: 3,
  darkness: 5,
  lamps: 6,
  effects: 7,
  status: 8,
  thief: 9,
  dust: 10,
}

const COL = {
  outside: 0x0b0b10,
  wall: 0x14141c,
  panel: 0x1b1b26,
  solid: 0x262634,
  metal: 0x2b3344,
  seam: 0x353e52,
  edge: 0x3c3c52,
  metalEdge: 0x56637e,
  underside: 0x2c2c3c,
}

/** The parts of a solid's top that nothing else sits on: where the lit edge goes. */
function exposedTops(s: Solid, solids: readonly Solid[]): [number, number][] {
  let spans: [number, number][] = [[s.x, right(s)]]
  for (const o of solids) {
    if (o === s || !(o.y < s.y && bottom(o) >= s.y)) continue
    spans = spans.flatMap(([a, b]) => {
      if (right(o) <= a || o.x >= b) return [[a, b] as [number, number]]
      const out: [number, number][] = []
      if (o.x > a) out.push([a, o.x])
      if (right(o) < b) out.push([right(o), b])
      return out
    })
  }
  return spans.filter(([a, b]) => b - a > 2)
}

export function drawRoom(scene: Phaser.Scene, room: Room) {
  const b = room.bounds
  const g = scene.add.graphics().setDepth(DEPTH.backdrop)
  g.fillStyle(COL.outside)
  g.fillRect(b.x - 30 * S, b.y - 30 * S, b.w + 60 * S, b.h + 60 * S)
  g.fillStyle(COL.wall)
  g.fillRect(b.x, b.y, b.w, b.h)
  g.lineStyle(2, COL.panel)
  for (let x = b.x + 0.75 * S; x < right(b); x += 1.5 * S) g.lineBetween(x, b.y, x, bottom(b))

  const solids = scene.add.graphics().setDepth(DEPTH.room)
  for (const s of room.solids) {
    solids.fillStyle(s.metal ? COL.metal : COL.solid)
    solids.fillRect(s.x, s.y, s.w, s.h)
    if (s.metal) {
      solids.lineStyle(2, COL.seam)
      const step = 0.5 * S
      if (s.h > s.w) for (let y = s.y + step; y < bottom(s); y += step) solids.lineBetween(s.x + 4, y, right(s) - 4, y)
      else for (let x = s.x + step; x < right(s); x += step) solids.lineBetween(x, s.y + 4, x, bottom(s) - 4)
    }
    solids.lineStyle(2, INK)
    solids.strokeRect(s.x, s.y, s.w, s.h)
  }

  // Lit top edges on everything he can stand on, so ledges read in the dark (guide §9).
  const edges = scene.add.graphics().setDepth(DEPTH.edges)
  for (const s of room.solids) {
    for (const [a, c] of exposedTops(s, room.solids)) {
      edges.lineStyle(3, s.metal ? COL.metalEdge : COL.edge)
      edges.lineBetween(a, s.y + 1.5, c, s.y + 1.5)
    }
    if (s.y < 0 && bottom(s) <= 1) continue
    if (bottom(s) < bottom(b) - 1) {
      edges.lineStyle(2, COL.underside)
      edges.lineBetween(s.x, bottom(s) - 1, right(s), bottom(s) - 1)
    }
  }

  // Lamp cords hang from the ceiling.
  const cords = scene.add.graphics().setDepth(DEPTH.room)
  cords.lineStyle(3, INK)
  for (const l of room.lamps) cords.lineBetween(l.x, 0, l.x, l.y - 0.25 * S)

  // Stand-in checkpoints: plain dashed posts, clearly not a design.
  const props = scene.add.graphics().setDepth(DEPTH.props)
  for (const c of room.checkpoints) {
    const r: Rect = { x: c.x - 0.3 * S, y: c.y - 1.5 * S, w: 0.6 * S, h: 1.5 * S }
    props.lineStyle(2, 0x9a9ab0, 0.55)
    const dash = 8
    const seg = (x1: number, y1: number, x2: number, y2: number) => {
      const len = Math.hypot(x2 - x1, y2 - y1)
      for (let d = 0; d < len; d += dash * 2) {
        const t0 = d / len
        const t1 = Math.min(1, (d + dash) / len)
        props.lineBetween(x1 + (x2 - x1) * t0, y1 + (y2 - y1) * t0, x1 + (x2 - x1) * t1, y1 + (y2 - y1) * t1)
      }
    }
    seg(r.x, r.y, right(r), r.y)
    seg(right(r), r.y, right(r), bottom(r))
    seg(r.x, r.y, r.x, bottom(r))
    scene.add
      .text(c.x, r.y - 10, 'CHECKPOINT\nSTAND-IN', { fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#9a9ab0', align: 'center' })
      .setOrigin(0.5, 1)
      .setAlpha(0.7)
      .setResolution(3)
      .setDepth(DEPTH.props)
  }
}

/** Lamp shades and their glows, drawn above the darkness. */
export function drawLamps(scene: Phaser.Scene, room: Room) {
  if (!scene.textures.exists('glow')) {
    const tex = scene.textures.createCanvas('glow', 128, 128)
    if (tex) {
      const ctx = tex.context
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
      grad.addColorStop(0, 'rgba(255,255,255,1)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 128, 128)
      tex.refresh()
    }
  }
  const shades = scene.add.graphics().setDepth(DEPTH.lamps)
  for (const l of room.lamps) {
    // Additive glows built from several faint layers (guide §6).
    for (const [radius, alpha] of [[3, 0.1], [1.7, 0.14], [0.7, 0.26]]) {
      scene.add
        .image(l.x, l.y, 'glow')
        .setDisplaySize(radius * 2 * S, radius * 2 * S)
        .setTint(0xffcf7a)
        .setAlpha(alpha)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(DEPTH.lamps)
    }
    const u = 0.28 * S
    shades.fillStyle(0x2a2a3a)
    shades.lineStyle(2.5, INK)
    const pts = [new Phaser.Math.Vector2(l.x - u, l.y), new Phaser.Math.Vector2(l.x + u, l.y), new Phaser.Math.Vector2(l.x + u * 0.5, l.y - u * 0.9), new Phaser.Math.Vector2(l.x - u * 0.5, l.y - u * 0.9)]
    shades.fillPoints(pts, true)
    shades.strokePoints(pts, true)
    shades.fillStyle(0xffe9b8)
    shades.fillCircle(l.x, l.y + 3, 0.08 * S)
  }
}
