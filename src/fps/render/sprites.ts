import * as THREE from 'three'
import { pieceOutline, shatterAlpha, type Piece } from '../../game/enemy/shatter.ts'
import type { AttackGlyph } from '../../game/input/device.ts'
import { drawGuard, GUARD_COLOURS, INK, type GuardFace, type GuardPose, type View } from '../art/views.ts'

const PX = 64
const W_S = 4
const H_S = 3.6
const GU = 1.25 // the watchman's drawing units in S
/** Canvas pixels from the bottom edge to its feet. */
const FOOT = 10

export interface GuardPaint {
  view: View
  flip: number
  face: GuardFace
  pose: GuardPose
  time: number
  walk: number
  light: number
  rim: string | null
  marker: { kind: 'sus' | 'alert'; level: number } | null
  /** Seconds out cold, for the drifting Zs; null when it isn't. */
  zs: number | null
  shatter: { age: number; pieces: Piece[]; flip: number } | null
  badge: { glyph: AttackGlyph; hold: number; showButton: boolean } | null
  hidden: boolean
}

const hex = (c: string) => c

/**
 * A guard as a billboard: its drawing on a canvas, on an upright card that turns to face the
 * camera (left and right only), with a soft ground shadow. Everything about it is drawn into the
 * canvas: the outline, the "?" or "!", the takedown badge, the Zs, the pieces of a kill.
 */
export class GuardSprite {
  readonly mesh: THREE.Mesh
  readonly shadow: THREE.Mesh
  private cv: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private tex: THREE.CanvasTexture

  constructor(scene: THREE.Scene, shadowTex: THREE.Texture) {
    this.cv = document.createElement('canvas')
    this.cv.width = W_S * PX
    this.cv.height = H_S * PX
    this.ctx = this.cv.getContext('2d')!
    this.tex = new THREE.CanvasTexture(this.cv)
    this.tex.colorSpace = THREE.SRGBColorSpace
    this.tex.anisotropy = 4
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(W_S, H_S), new THREE.MeshBasicMaterial({ map: this.tex, alphaTest: 0.4, fog: true, side: THREE.DoubleSide }))
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.6, 24), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, fog: true }))
    this.shadow.rotation.x = -Math.PI / 2
    scene.add(this.mesh, this.shadow)
  }

  /** Stands it at its feet, turned to the camera. */
  place(x: number, y: number, z: number, camX: number, camZ: number, showShadow: boolean) {
    this.mesh.position.set(x, y + H_S / 2 - FOOT / PX, z)
    this.mesh.rotation.set(0, Math.atan2(camX - x, camZ - z), 0)
    this.shadow.position.set(x, y + 0.012, z)
    this.shadow.visible = showShadow
  }

  paint(p: GuardPaint) {
    const g = this.ctx, w = this.cv.width, h = this.cv.height
    g.setTransform(1, 0, 0, 1, 0, 0)
    g.clearRect(0, 0, w, h)
    this.mesh.visible = !p.hidden || !!p.shatter
    const k = GU * PX
    const ox = w / 2, oy = h - FOOT - 0.62 * k
    if (!p.hidden) {
      g.setTransform(k * (p.view === 'side' ? p.flip : 1), 0, 0, k, ox, oy)
      drawGuard(g, { view: p.view, face: p.face, pose: p.pose, time: p.time, walk: p.walk, light: p.light, rim: p.rim })
    }
    g.setTransform(1, 0, 0, 1, 0, 0)
    if (p.shatter) this.drawShatter(p.shatter, ox, oy, k)
    if (p.zs !== null) this.drawZs(p.zs, ox + (p.flip >= 0 || p.view !== 'side' ? 1 : -1) * 1.05 * k, oy - 0.1 * k)
    const headTop = oy - 0.85 * k
    if (p.marker) this.drawMarker(p.marker, ox, headTop - 0.35 * PX)
    if (p.badge) this.drawBadge(p.badge, ox, headTop - 1.1 * PX)
    this.tex.needsUpdate = true
  }

  private drawZs(out: number, hx: number, hy: number) {
    const g = this.ctx, u = PX / 54
    for (let i = 0; i < 3; i++) {
      const ph = ((out + i * 0.6) % 1.8) / 1.8
      const a = Math.min(1, Math.max(0, Math.sin(ph * Math.PI)))
      if (a < 0.02) continue
      const x = hx + (6 + ph * 18 + i * 3) * u, y = hy - (8 + ph * 40) * u, s = (10 + ph * 8) * u * 0.45
      g.strokeStyle = `rgba(207,234,255,${a})`; g.lineWidth = Math.max(2, s * 0.5); g.lineJoin = 'round'
      g.beginPath(); g.moveTo(x - s, y - s); g.lineTo(x + s, y - s); g.lineTo(x - s, y + s); g.lineTo(x + s, y + s); g.stroke()
    }
  }

  private drawShatter(s: { age: number; pieces: Piece[]; flip: number }, ox: number, oy: number, k: number) {
    const g = this.ctx, a = shatterAlpha(s.age)
    for (const p of s.pieces) {
      const pts = pieceOutline(p)
      g.beginPath()
      pts.forEach((q, i) => {
        const x = ox + s.flip * (p.x + q.x) * k, y = oy + (p.y + q.y) * k
        if (i) g.lineTo(x, y); else g.moveTo(x, y)
      })
      g.closePath()
      g.globalAlpha = a
      g.fillStyle = hex(GUARD_COLOURS[p.color]); g.fill()
      g.strokeStyle = INK; g.lineWidth = 0.04 * k; g.stroke()
      g.globalAlpha = 1
    }
  }

  private drawMarker(m: { kind: 'sus' | 'alert'; level: number }, x: number, y: number) {
    const g = this.ctx, r = 0.24 * PX
    g.lineWidth = 3
    if (m.kind === 'alert') {
      g.fillStyle = '#ff7a3d'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.strokeStyle = INK; g.stroke()
      g.fillStyle = INK; g.font = `900 ${Math.round(r * 1.4)}px Outfit, system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', x, y + 1)
      return
    }
    g.fillStyle = 'rgba(26,29,34,0.92)'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill()
    g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip()
    g.fillStyle = 'rgba(255,179,71,0.65)'; g.fillRect(x - r, y + r - 2 * r * Math.min(1, m.level), 2 * r, 2 * r)
    g.restore()
    g.strokeStyle = '#ffb347'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke()
    g.fillStyle = '#ffffff'; g.font = `900 ${Math.round(r * 1.3)}px Outfit, system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', x, y + 1)
  }

  /** The takedown badge (History #86): the fist, the Attack button for his controls, and "tap · hold". */
  private drawBadge(b: { glyph: AttackGlyph; hold: number; showButton: boolean }, x: number, y: number) {
    const g = this.ctx, r = 0.22 * PX
    g.fillStyle = 'rgba(13,26,36,0.92)'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill()
    g.strokeStyle = '#8fd3ff'; g.lineWidth = 3; g.stroke()
    g.fillStyle = '#8fd3ff'; g.beginPath(); g.arc(x, y + 1, r * 0.4, 0, Math.PI * 2); g.fill()
    g.strokeStyle = '#0d1a24'; g.lineWidth = 2; g.beginPath(); g.arc(x, y + 1, r * 0.24, Math.PI * 1.1, Math.PI * 1.9); g.stroke()
    if (b.hold > 0) {
      g.strokeStyle = '#8fd3ff'; g.lineWidth = 4; g.beginPath()
      g.arc(x, y, r + 5, -Math.PI / 2, -Math.PI / 2 + Math.min(1, b.hold) * Math.PI * 2); g.stroke()
    }
    if (!b.showButton) return
    const gx = x + r * 2.2, gr = r * 0.82
    switch (b.glyph) {
      case 'key':
        g.fillStyle = '#24242f'; g.beginPath(); g.roundRect(gx - gr, y - gr, 2 * gr, 2 * gr, gr * 0.35); g.fill()
        g.strokeStyle = '#4a4a5c'; g.lineWidth = 2; g.stroke()
        g.fillStyle = '#e6eaef'; g.font = `800 ${Math.round(gr * 1.2)}px Outfit, system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('F', gx, y + 1)
        break
      case 'mouse': {
        const w = gr * 0.68
        g.fillStyle = '#24242f'; g.beginPath(); g.roundRect(gx - w, y - gr, 2 * w, 2 * gr, w * 0.9); g.fill()
        g.fillStyle = '#e6eaef'; g.beginPath(); g.roundRect(gx - w, y - gr, w, gr * 0.85, [w * 0.9, 0, 0, 0]); g.fill()
        g.strokeStyle = '#4a4a5c'; g.lineWidth = 2; g.beginPath(); g.roundRect(gx - w, y - gr, 2 * w, 2 * gr, w * 0.9); g.stroke()
        g.beginPath(); g.moveTo(gx - w, y - gr * 0.15); g.lineTo(gx + w, y - gr * 0.15); g.moveTo(gx, y - gr); g.lineTo(gx, y - gr * 0.15); g.stroke()
        break
      }
      case 'pad':
        g.fillStyle = '#2b2b1a'; g.beginPath(); g.arc(gx, y, gr, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#e7c74a'; g.lineWidth = 2; g.stroke()
        g.fillStyle = '#e7c74a'; g.font = `800 ${Math.round(gr * 1.2)}px Outfit, system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Y', gx, y + 1)
        break
      case 'touch':
        g.fillStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.arc(gx, y, gr, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 2; g.stroke()
        g.fillStyle = '#e6eaef'; g.beginPath(); g.arc(gx - gr * 0.1, y, gr * 0.45, 0, Math.PI * 2); g.fill()
        break
    }
    g.font = `700 ${Math.round(0.2 * PX)}px Outfit, system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.lineWidth = 4; g.strokeStyle = '#0d1a24'; g.strokeText('tap · hold', x + r * 0.4, y + r * 2)
    g.fillStyle = '#cfe9ff'; g.fillText('tap · hold', x + r * 0.4, y + r * 2)
  }
}

/** A soft round shadow for the floor under characters. */
export function shadowTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = cv.height = 64
  const g = cv.getContext('2d')!
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  r.addColorStop(0, 'rgba(10,12,18,0.55)'); r.addColorStop(1, 'rgba(10,12,18,0)')
  g.fillStyle = r; g.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

interface Particle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  age: number
  life: number
  r: number
  g: number
  b: number
  grav: number
}

/** Dust and sparks: little squares, the style's effect vocabulary, fading as they go. */
export class Particles {
  private list: Particle[] = []
  private geo: THREE.BufferGeometry
  private pos: Float32Array
  private col: Float32Array
  readonly points: THREE.Points
  private static MAX = 700

  constructor(scene: THREE.Scene) {
    this.pos = new Float32Array(Particles.MAX * 3)
    this.col = new Float32Array(Particles.MAX * 3)
    this.geo = new THREE.BufferGeometry()
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3))
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3))
    this.points = new THREE.Points(this.geo, new THREE.PointsMaterial({ size: 0.07, vertexColors: true, sizeAttenuation: true, fog: true }))
    this.points.frustumCulled = false
    scene.add(this.points)
  }

  burst(x: number, y: number, z: number, color: number, n: number, speed: number, life: number, grav = 6, spread = 0.2) {
    const r = ((color >> 16) & 255) / 255, g = ((color >> 8) & 255) / 255, b = (color & 255) / 255
    for (let i = 0; i < n && this.list.length < Particles.MAX; i++) {
      const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * Math.PI * 0.8, s = speed * (0.4 + Math.random() * 0.8)
      this.list.push({ x: x + (Math.random() - 0.5) * spread, y: y + (Math.random() - 0.5) * spread, z: z + (Math.random() - 0.5) * spread, vx: Math.cos(a) * Math.cos(e) * s, vy: Math.sin(e) * s, vz: Math.sin(a) * Math.cos(e) * s, age: 0, life: life * (0.6 + Math.random() * 0.6), r, g, b, grav })
    }
  }

  /** His body crumbling into dust, or gathering back, for a blink. */
  dust(x: number, y: number, z: number, height: number) {
    for (let i = 0; i < 70 && this.list.length < Particles.MAX; i++) {
      const a = Math.random() * Math.PI * 2, s = 0.3 + Math.random() * 1.2
      this.list.push({ x: x + (Math.random() - 0.5) * 0.6, y: y + Math.random() * height, z: z + (Math.random() - 0.5) * 0.6, vx: Math.cos(a) * s, vy: 0.4 + Math.random() * 0.8, vz: Math.sin(a) * s, age: 0, life: 0.5 + Math.random() * 0.5, r: 0.71, g: 0.71, b: 0.78, grav: 2 })
    }
  }

  update(dt: number) {
    for (const p of this.list) {
      p.age += dt
      p.vy -= p.grav * dt
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt
    }
    this.list = this.list.filter((p) => p.age < p.life)
    let i = 0
    for (const p of this.list) {
      const f = 1 - p.age / p.life
      this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y; this.pos[i * 3 + 2] = p.z
      this.col[i * 3] = p.r * f; this.col[i * 3 + 1] = p.g * f; this.col[i * 3 + 2] = p.b * f
      i++
    }
    this.geo.setDrawRange(0, i)
    this.geo.attributes.position.needsUpdate = true
    this.geo.attributes.color.needsUpdate = true
  }
}
