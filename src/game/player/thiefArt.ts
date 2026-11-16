import { FOOT, HERO, INK } from '../style/tokens.ts'

/**
 * The thief as approved: No. 7 "Stacked" body (circle head on a rounded trapezoid), mask band
 * with ties, the smirk, dark gloves (design doc, History #20–#25). Drawn in units of S with the
 * body's centre at the origin, facing right. Mirror the context to face left.
 */

export type Pose = 'stand' | 'air' | 'slide' | 'wall' | 'ceiling' | 'jab' | 'cross' | 'shove' | 'dodge' | 'grab'

export interface ThiefLook {
  /** How lit he is, 0–1. He fades in shadow but his eyes stay lit (History #17). */
  light: number
  /** Seconds, for the ties' sway. */
  time: number
  /** 0 at rest to 1 at full run: how far the ties trail. */
  speed: number
  /** Walk cycle, -1 to 1: swings the gloves. */
  swing: number
  pose: Pose
  /** Hand-over-hand phase while climbing. */
  climb: number
}

export const KIT = '#20202c'
const ROOM: Rgb = [20, 20, 28]
const TINT: Rgb = [217, 219, 232]
type Rgb = [number, number, number]
const hexRgb = (n: number): Rgb => [(n >> 16) & 255, (n >> 8) & 255, n & 255]
const HERO_RGB = hexRgb(HERO)
const FOOT_RGB = hexRgb(FOOT)
const INK_CSS = '#' + INK.toString(16).padStart(6, '0')
const mix = (a: Rgb, b: Rgb, t: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`

export const HEAD = { cx: 0.03, cy: -0.42, r: 0.27 }
const FACE = { x: 0.03, y: -0.43, k: 0.68 }
const K = FACE.k
const EYE_CX = FACE.x + 0.04 * K
const EYE_Y = FACE.y
const EYES_X = [EYE_CX - 0.19 * K, EYE_CX + 0.19 * K]
const KNOT = { x: HEAD.cx - Math.sqrt(HEAD.r ** 2 - (EYE_Y - HEAD.cy) ** 2), y: EYE_Y }
export const TRAPEZOID: [number, number][] = [[-0.32, -0.12], [0.32, -0.12], [0.5, 0.5], [-0.5, 0.5]]

/** Where his gloves are for a pose, in units of S. */
export function glovesFor(pose: Pose, swing: number, climb: number): [number, number][] {
  switch (pose) {
    case 'ceiling': {
      const a = Math.sin(climb) * 0.07
      return [[-0.3 + a, -0.93], [0.36 - a, -0.93]]
    }
    case 'wall': {
      const a = Math.sin(climb) * 0.1
      return [[0.62, -0.42 + a], [0.62, 0.22 - a]]
    }
    case 'slide':
      return [[-0.92, 0.3], [-0.62, 0.42]]
    // Combat (first takes): his floating gloves do the hitting (History #55).
    case 'jab':
      return [[-0.62, 0.1], [1.02, -0.12]]
    case 'cross':
      return [[0.98, -0.04], [0.42, 0.24]]
    case 'shove':
      return [[0.88, -0.16], [0.94, 0.24]]
    case 'dodge':
      return [[-0.96, -0.04], [-0.7, 0.26]]
    case 'grab':
      return [[0.7, -0.36], [0.8, 0.1]]
    default:
      return [[-0.76 + swing * 0.08, 0.18 - Math.abs(swing) * 0.03], [0.76 - swing * 0.08, 0.18 - Math.abs(swing) * 0.03]]
  }
}

function feetFor(pose: Pose): [number, number][] {
  if (pose === 'ceiling') return [[-0.4, 0.44], [0.02, 0.47]]
  if (pose === 'wall') return [[-0.3, 0.4], [0.12, 0.36]]
  return [[-0.44, 0.4], [0.04, 0.4]]
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function headPath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.arc(HEAD.cx, HEAD.cy, HEAD.r, 0, Math.PI * 2)
}

export function drawThief(ctx: CanvasRenderingContext2D, look: ThiefLook) {
  const { light: L, time: t, speed, pose } = look
  const d = 0.88 * (1 - L)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  // Mask ties: hang at rest, trail with speed (History #25).
  const hanging = pose === 'wall' || pose === 'ceiling'
  const rest = hanging ? [96, 108] : [118, 140]
  const run = [172, 191]
  const trail = pose === 'slide' ? 1 : speed
  for (let i = 0; i < 2; i++) {
    const len = i ? 0.24 : 0.3
    const a = rest[i] + (run[i] - rest[i]) * trail + Math.sin(t * 13 + i * 1.7) * 7 * trail + Math.sin(t * 1.6 + i) * 4 * (1 - trail)
    ctx.save()
    ctx.translate(KNOT.x, KNOT.y)
    ctx.rotate((a * Math.PI) / 180)
    ctx.beginPath()
    ctx.moveTo(0, -0.032)
    ctx.lineTo(len, -0.024)
    ctx.lineTo(len - 0.045, 0)
    ctx.lineTo(len, 0.024)
    ctx.lineTo(0, 0.032)
    ctx.closePath()
    ctx.fillStyle = KIT
    ctx.fill()
    ctx.lineWidth = 0.022
    ctx.strokeStyle = INK_CSS
    ctx.stroke()
    ctx.restore()
  }

  ctx.fillStyle = mix(FOOT_RGB, ROOM, 0.6 * (1 - L))
  ctx.strokeStyle = INK_CSS
  ctx.lineWidth = 0.04
  for (const [fx, fy] of feetFor(pose)) {
    roundRect(ctx, fx, fy, 0.4, 0.22, 0.06)
    ctx.fill()
    ctx.stroke()
  }

  const g = ctx.createLinearGradient(0, -0.7, 0, 0.5)
  g.addColorStop(0, mix(HERO_RGB, ROOM, d))
  g.addColorStop(1, mix(TINT, ROOM, d))
  ctx.fillStyle = g
  ctx.lineWidth = 0.06
  ctx.beginPath()
  TRAPEZOID.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  headPath(ctx)
  ctx.fill()
  ctx.save()
  headPath(ctx)
  ctx.clip()
  ctx.fillStyle = KIT
  ctx.fillRect(-1, EYE_Y - 0.15 * K, 2, 0.3 * K)
  ctx.restore()
  headPath(ctx)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(KNOT.x + 0.01, KNOT.y, 0.05, 0, Math.PI * 2)
  ctx.fillStyle = KIT
  ctx.fill()
  ctx.lineWidth = 0.022
  ctx.stroke()

  // Lit eyes: a soft glow that grows as he darkens.
  if (L < 1) {
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    const rg = ctx.createRadialGradient(EYE_CX, EYE_Y, 0, EYE_CX, EYE_Y, 0.36)
    rg.addColorStop(0, `rgba(255,244,220,${(0.5 * (1 - L)).toFixed(3)})`)
    rg.addColorStop(1, 'rgba(255,244,220,0)')
    ctx.fillStyle = rg
    ctx.beginPath()
    ctx.ellipse(EYE_CX, EYE_Y, 0.36, 0.24, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  const lookDown = pose === 'ceiling' ? 0.025 * K : 0
  for (const ex of EYES_X) {
    ctx.beginPath()
    ctx.ellipse(ex, EYE_Y, 0.085 * K, 0.1 * K, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#f2f2f2'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(ex + 0.028 * K, EYE_Y + 0.005 * K + lookDown, 0.042 * K, 0, Math.PI * 2)
    ctx.fillStyle = INK_CSS
    ctx.fill()
  }

  // The smirk (History #23).
  ctx.beginPath()
  ctx.moveTo(FACE.x - 0.13 * K, EYE_Y + 0.27 * K)
  ctx.quadraticCurveTo(FACE.x + 0.01 * K, EYE_Y + 0.36 * K, FACE.x + 0.15 * K, EYE_Y + 0.2 * K)
  ctx.lineWidth = 0.05 * K
  ctx.strokeStyle = INK_CSS
  ctx.stroke()

  // Dark gloves (History #24).
  ctx.fillStyle = KIT
  ctx.lineWidth = 0.045
  for (const [gx, gy] of glovesFor(pose, look.swing, look.climb)) {
    ctx.beginPath()
    ctx.arc(gx, gy, 0.17, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
}
