import { isWall, floorAt, type Level } from '../level/level.ts'
import type { BlinkLanding } from '../logic/rules.ts'
import { BLINK } from '../tuning.ts'
import { drawGuard, drawThief, INK, KIT, viewFrom, type GuardFace, type GuardPose, type View } from '../art/views.ts'

export type GlovePose = 'idle' | 'jab' | 'cross' | 'shove' | 'grab' | 'wall' | 'ceiling' | 'mantle' | 'dodge'

export interface GloveState {
  pose: GlovePose
  /** 0–1 through the current blow or takedown. */
  t: number
  walk: number
  moveAmt: number
  crouch: boolean
  light: number
  climbPhase: number
  hidden: number
}

interface Hand {
  x: number
  y: number
  r: number
}

/**
 * His gloves, floating at the bottom of the view: his hands, and with how they fade, how hidden he
 * is (History #102). They never vanish completely: a faint edge stays (Claude's default).
 */
export class Gloves {
  private hands: Hand[] = [{ x: 0, y: 0, r: 0 }, { x: 0, y: 0, r: 0 }]
  private ready = false

  private target(s: GloveState, w: number, h: number): Hand[] {
    const r = Math.min(w, h) * 0.11
    const cx = w / 2
    const dx = Math.min(w * 0.3, r * 3.1)
    const bob = Math.sin(s.walk) * r * 0.13 * s.moveAmt
    const idle = Math.sin(performance.now() / 900) * r * 0.03
    let L: Hand = { x: cx - dx, y: h - r * 0.3 + bob + idle + (s.crouch ? r * 0.15 : 0), r }
    let R: Hand = { x: cx + dx, y: h - r * 0.3 - bob - idle + (s.crouch ? r * 0.15 : 0), r }
    const p = Math.sin(Math.PI * Math.min(1, Math.max(0, s.t)))
    const toward = (a: Hand, x: number, y: number, k: number, shrink: number): Hand => ({ x: a.x + (x - a.x) * k, y: a.y + (y - a.y) * k, r: a.r * (1 - shrink * k) })
    switch (s.pose) {
      case 'jab': L = toward(L, cx - r * 0.35, h * 0.56, p, 0.42); break
      case 'cross': R = toward(R, cx + r * 0.35, h * 0.56, p, 0.42); break
      case 'shove': L = toward(L, cx - r * 0.7, h * 0.6, p, 0.35); R = toward(R, cx + r * 0.7, h * 0.6, p, 0.35); break
      case 'grab': L = toward(L, cx - r * 0.55, h * 0.6, p, 0.3); R = toward(R, cx + r * 0.55, h * 0.6, p, 0.3); break
      case 'wall': {
        const a = Math.sin(s.climbPhase) * r * 0.35
        L = { x: cx - r * 1.7, y: h * 0.42 + a, r: r * 0.9 }
        R = { x: cx + r * 1.7, y: h * 0.42 - a, r: r * 0.9 }
        break
      }
      case 'ceiling': {
        const a = Math.sin(s.climbPhase) * r * 0.3
        L = { x: cx - r * 1.5 + a, y: r * 0.15, r: r * 0.95 }
        R = { x: cx + r * 1.5 - a, y: r * 0.15, r: r * 0.95 }
        break
      }
      case 'mantle': L = { x: cx - r * 1.3, y: h * 0.78, r }; R = { x: cx + r * 1.3, y: h * 0.78, r }; break
      case 'dodge': L = { ...L, y: L.y + r * 0.4 }; R = { ...R, y: R.y + r * 0.4 }; break
    }
    return [L, R]
  }

  draw(g: CanvasRenderingContext2D, s: GloveState, w: number, h: number, dt: number) {
    const t = this.target(s, w, h)
    const k = this.ready ? Math.min(1, dt * (s.pose === 'jab' || s.pose === 'cross' || s.pose === 'shove' || s.pose === 'grab' ? 40 : 14)) : 1
    this.ready = true
    this.hands.forEach((hd, i) => { hd.x += (t[i].x - hd.x) * k; hd.y += (t[i].y - hd.y) * k; hd.r += (t[i].r - hd.r) * k })
    const vis = 1 - s.hidden
    if (vis <= 0.01) return
    const lit = Math.min(1, Math.max(0, s.light))
    for (const hd of this.hands) {
      g.save()
      g.globalAlpha = vis * (0.3 + 0.7 * lit)
      g.fillStyle = KIT; g.beginPath(); g.arc(hd.x, hd.y, hd.r, 0, Math.PI * 2); g.fill()
      g.strokeStyle = INK; g.lineWidth = hd.r * 0.09; g.stroke()
      // A knuckle line, as on the touch Attack button, so they read as fists.
      g.strokeStyle = '#4a4a60'; g.lineWidth = hd.r * 0.08; g.lineCap = 'round'
      g.beginPath(); g.arc(hd.x, hd.y + hd.r * 0.35, hd.r * 0.62, Math.PI * 1.22, Math.PI * 1.78); g.stroke()
      g.restore()
      // The faint edge that stays even in the dark.
      g.save(); g.globalAlpha = vis * 0.34
      g.strokeStyle = '#c8cde0'; g.lineWidth = Math.max(1.5, hd.r * 0.045)
      g.beginPath(); g.arc(hd.x, hd.y, hd.r * 1.01, 0, Math.PI * 2); g.stroke()
      g.restore()
    }
  }
}

/** The aim dot, the light meter under it, and the grip bar when he's holding on. */
export function drawCentre(g: CanvasRenderingContext2D, w: number, h: number, light: number, grip: number, showGrip: boolean, alpha: number) {
  if (alpha <= 0.01) return
  const cx = w / 2, cy = h / 2
  g.save(); g.globalAlpha = alpha
  g.fillStyle = 'rgba(242,242,242,0.8)'; g.beginPath(); g.arc(cx, cy, 2.5, 0, Math.PI * 2); g.fill()
  const mw = 72, mh = 5, my = cy + 24
  g.fillStyle = 'rgba(255,255,255,0.14)'; g.beginPath(); g.roundRect(cx - mw / 2, my, mw, mh, mh / 2); g.fill()
  g.fillStyle = '#ffe2a6'
  if (light > 0.02) { g.beginPath(); g.roundRect(cx - mw / 2, my, Math.max(mh, mw * light), mh, mh / 2); g.fill() }
  if (showGrip) {
    const gy = my + 10
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.roundRect(cx - mw / 2, gy, mw, mh, mh / 2); g.fill()
    g.fillStyle = '#8fd3ff'
    if (grip > 0.02) { g.beginPath(); g.roundRect(cx - mw / 2, gy, Math.max(mh, mw * grip), mh, mh / 2); g.fill() }
  }
  g.restore()
}

// ---------- The blink view: from straight above, time slowed (History #104–#107) ----------

export interface MapGuard {
  x: number
  y: number
  z: number
  fx: number
  fz: number
  face: GuardFace
  pose: GuardPose
  time: number
  walk: number
  hidden: boolean
}

export interface MapState {
  level: Level
  /** Where he is (the middle of the view) and what height he's standing at. */
  x: number
  y: number
  z: number
  showHim: boolean
  aim: { x: number; z: number } | null
  landing: BlinkLanding | null
  litAtLanding: number
  guards: MapGuard[]
  alpha: number
  time: number
}

const GROUND = '#c8d0d5', WALL = '#2c323b', SIDE_GROUND = '#8d969c', SIDE_WALL = '#1d2128'

/** Pixels per S in the blink view: the whole range and a bit, in the shorter side. */
export const mapScale = (w: number, h: number) => Math.min(w, h) / (BLINK.range * 2 + 4.5)

/** Draws the blink view: a bare two-tone room, height shown only by lean, the guards, and the aiming aids. */
export function drawBlinkMap(g: CanvasRenderingContext2D, w: number, h: number, m: MapState) {
  if (m.alpha <= 0.01) return
  const L = m.level
  const sc = mapScale(w, h)
  const cx = w / 2, cy = h / 2
  // Height lean: raised things push away from the middle of the view, lower ones draw in.
  const P = (x: number, z: number, y: number): [number, number] => {
    const f = 1 + Math.max(-1.5, Math.min(3, y - m.y)) * BLINK.lean
    return [cx + (x - m.x) * sc * f, cy + (z - m.z) * sc * f]
  }
  g.save()
  g.globalAlpha = m.alpha
  g.fillStyle = '#15181e'; g.fillRect(0, 0, w, h)
  const halfX = w / 2 / sc + 3, halfZ = h / 2 / sc + 3
  const c0 = Math.max(-1, Math.floor(m.x - halfX)), c1 = Math.min(L.cols, Math.ceil(m.x + halfX))
  const r0 = Math.max(-1, Math.floor(m.z - halfZ)), r1 = Math.min(L.rows, Math.ceil(m.z + halfZ))
  const WALL_TOP = m.y + 3
  const topOf = (c: number, r: number) => (isWall(L, c, r) ? WALL_TOP : floorAt(L, c, r))

  interface Block { top: number; base: (dc: number, dr: number) => number; x0: number; z0: number; x1: number; z1: number; wall: boolean; outline: boolean[] }
  const blocks: Block[] = []
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    const top = topOf(c, r), wall = isWall(L, c, r)
    const nb = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dc, dr]) => topOf(c + dc, r + dr))
    blocks.push({ top, base: (dc, dr) => topOf(c + dc, r + dr), x0: c, z0: r, x1: c + 1, z1: r + 1, wall, outline: nb.map((t) => Math.abs(t - top) > 0.05) })
  }
  for (const b of L.boxes) {
    if (b.x1 < m.x - halfX || b.x0 > m.x + halfX || b.z1 < m.z - halfZ || b.z0 > m.z + halfZ) continue
    const base = Math.max(b.y0, floorAt(L, Math.floor((b.x0 + b.x1) / 2), Math.floor((b.z0 + b.z1) / 2)))
    blocks.push({ top: b.y1, base: () => base, x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1, wall: false, outline: [true, true, true, true] })
  }
  for (const b of L.thin) blocks.push({ top: WALL_TOP, base: () => floorAt(L, Math.floor(b.x0), Math.floor(b.z0)), x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1, wall: true, outline: [true, true, true, true] })
  blocks.sort((a, b) => a.top - b.top)

  for (const b of blocks) {
    const sides: [number, number, [number, number], [number, number]][] = [[0, -1, [b.x0, b.z0], [b.x1, b.z0]], [1, 0, [b.x1, b.z0], [b.x1, b.z1]], [0, 1, [b.x1, b.z1], [b.x0, b.z1]], [-1, 0, [b.x0, b.z1], [b.x0, b.z0]]]
    for (const [dc, dr, a, e] of sides) {
      const base = b.base(dc, dr)
      if (base >= b.top - 0.02) continue
      // Only the sides facing the middle of the view show.
      const mx = (a[0] + e[0]) / 2, mz = (a[1] + e[1]) / 2
      if ((m.x - mx) * dc + (m.z - mz) * dr <= 0) continue
      const pts = [P(a[0], a[1], base), P(e[0], e[1], base), P(e[0], e[1], b.top), P(a[0], a[1], b.top)]
      g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath()
      g.fillStyle = b.wall ? SIDE_WALL : SIDE_GROUND; g.fill(); g.strokeStyle = INK; g.lineWidth = 1; g.stroke()
    }
    const top = [P(b.x0, b.z0, b.top), P(b.x1, b.z0, b.top), P(b.x1, b.z1, b.top), P(b.x0, b.z1, b.top)]
    g.beginPath(); top.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath()
    g.fillStyle = b.wall ? WALL : GROUND; g.fill()
    g.strokeStyle = b.wall ? WALL : GROUND; g.lineWidth = 1; g.stroke()
    g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath()
    for (let i = 0; i < 4; i++) if (b.outline[i]) { g.moveTo(...top[i]); g.lineTo(...top[(i + 1) % 4]) }
    g.stroke()
  }

  // People: face-on badges standing where they are.
  const badge = (x: number, z: number, y: number, draw: () => void) => {
    const [sx, sy] = P(x, z, y)
    g.save(); g.translate(sx, sy)
    g.fillStyle = 'rgba(14,16,22,0.35)'; g.beginPath(); g.ellipse(0, 0, 0.42 * sc, 0.2 * sc, 0, 0, Math.PI * 2); g.fill()
    g.translate(0, -0.62 * sc); draw(); g.restore()
  }
  const people: { z: number; draw: () => void }[] = []
  for (const gd of m.guards) {
    if (gd.hidden) continue
    people.push({ z: gd.z, draw: () => badge(gd.x, gd.z, gd.y, () => {
      const view: View = gd.pose === 'down' ? 'side' : viewFrom(gd.fx, gd.fz, 0, 1, 'side')
      g.scale(sc * 1.25 * (view === 'side' && gd.fx < 0 ? -1 : 1), sc * 1.25)
      drawGuard(g, { view, face: gd.face, pose: gd.pose, time: gd.time, walk: gd.walk, light: 1, rim: null })
    }) })
  }
  if (m.showHim) people.push({ z: m.z, draw: () => badge(m.x, m.z, m.y, () => { g.scale(sc, sc); drawThief(g, { view: 'front', time: m.time, light: 1 }) }) })
  people.sort((a, b) => a.z - b.z).forEach((p) => p.draw())

  // Aiming: the range, the line to where he'll land, the ghost there, and what it is.
  const [px, py] = P(m.x, m.z, m.y)
  g.save(); g.setLineDash([8, 7]); g.strokeStyle = 'rgba(143,211,255,0.6)'; g.lineWidth = 2
  g.beginPath(); g.arc(px, py, BLINK.range * sc, 0, Math.PI * 2); g.stroke(); g.restore()
  const ld = m.landing
  if (ld && m.aim) {
    const [gx, gy] = P(ld.x, ld.z, ld.y)
    g.save(); g.setLineDash([7, 6]); g.lineDashOffset = -m.time * 25; g.strokeStyle = '#8fd3ff'; g.lineWidth = 2.4
    g.beginPath(); g.moveTo(px, py - 0.5 * sc); g.lineTo(gx, gy - 0.5 * sc); g.stroke(); g.restore()
    if (ld.cut) {
      const ang = Math.atan2(gy - py, gx - px), nx = Math.cos(ang + Math.PI / 2) * 0.25 * sc, ny = Math.sin(ang + Math.PI / 2) * 0.25 * sc
      g.strokeStyle = '#8fd3ff'; g.lineWidth = 3; g.beginPath(); g.moveTo(gx + nx, gy - 0.5 * sc + ny); g.lineTo(gx - nx, gy - 0.5 * sc - ny); g.stroke()
    }
    g.save(); g.translate(gx, gy); g.strokeStyle = '#8fd3ff'; g.lineWidth = 2
    g.beginPath(); g.ellipse(0, 0, 0.45 * sc, 0.22 * sc, 0, 0, Math.PI * 2); g.stroke()
    g.translate(0, -0.62 * sc); g.scale(sc, sc); g.lineWidth = 2 / sc
    g.beginPath(); [[-0.32, -0.12], [0.32, -0.12], [0.5, 0.5], [-0.5, 0.5]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke()
    g.beginPath(); g.arc(0, -0.42, 0.27, 0, Math.PI * 2); g.stroke()
    for (const x of [-0.74, 0.74]) { g.beginPath(); g.arc(x, 0.18, 0.17, 0, Math.PI * 2); g.stroke() }
    g.restore()
    const rise = Math.round(ld.rise * 10) / 10
    const parts = [ld.surface + (Math.abs(rise) >= 0.1 ? ` ${rise > 0 ? '+' : '−'}${Math.abs(rise)}` : ''), m.litAtLanding < 0.35 ? 'in the dark' : 'lit']
    if (ld.posture !== 'stand') parts.push(ld.posture === 'crouch' ? 'crouched' : 'crawling')
    if (ld.glass) parts.push('through glass')
    if (ld.cut) parts.push('wall stops it')
    const text = parts.join(' · ')
    g.font = `600 ${Math.max(12, 0.3 * sc)}px Outfit, system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'
    const tw = g.measureText(text).width + 0.4 * sc
    const ty = gy - 2.05 * sc
    g.fillStyle = 'rgba(13,26,36,0.9)'; g.beginPath(); g.roundRect(gx - tw / 2, ty, tw, Math.max(20, 0.46 * sc), 0.14 * sc); g.fill()
    g.strokeStyle = '#8fd3ff'; g.lineWidth = 1.5; g.stroke()
    g.fillStyle = '#e6f4ff'; g.fillText(text, gx, ty + Math.max(20, 0.46 * sc) / 2 + 1)
  }

  // Time slowed: a faint power-blue edge round the view.
  const vg = g.createRadialGradient(cx, cy, Math.min(w, h) * 0.42, cx, cy, Math.max(w, h) * 0.72)
  vg.addColorStop(0, 'rgba(143,211,255,0)'); vg.addColorStop(1, 'rgba(143,211,255,0.16)')
  g.fillStyle = vg; g.fillRect(0, 0, w, h)
  g.restore()
}
