/**
 * The characters as billboards: three drawings each, front, side and back (History #98), for the
 * staff watchman in every pose, and for the thief (seen only in the blink view). Side views are the
 * game's own drawings; front and back views are Claude's first takes. Drawn in canvas units: the
 * watchman in its own units (× 1.25 S), the thief in S, body centre at the origin, side facing right.
 */

export type View = 'front' | 'side' | 'back'
export type GuardFace = 'calm' | 'sus' | 'alert' | 'dizzy' | 'out'
export type GuardPose = 'stand' | 'walk' | 'windup' | 'punch' | 'flinch' | 'stagger' | 'down'

export const INK = '#12161b'
const ROOM: [number, number, number] = [20, 20, 28]
const hexRgb = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
export const shade = (h: string, dark: number) => `rgb(${hexRgb(h).map((v, i) => Math.round(v + (ROOM[i] - v) * dark)).join(',')})`
const mixRgb = (a: number[], b: number[], t: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`

export const GUARD_COLOURS = { body: '#3e5a6e', dark: '#2a3e4d', skin: '#c9ced8', feet: '#2a2f38' }

export interface GuardLook {
  view: View
  face: GuardFace
  pose: GuardPose
  time: number
  walk: number
  /** 0–1: how lit it is. */
  light: number
  /** An outline round the whole of it: a takedown is on (History #86). */
  rim: string | null
}

const EYE_Y = -0.44

function guardFace(ctx: CanvasRenderingContext2D, f: GuardFace, fx: number) {
  const eyes = [fx - 0.12, fx + 0.12]
  ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.fillStyle = INK
  const my = EYE_Y + 0.19
  if (f === 'out') {
    for (const x of eyes) { ctx.beginPath(); ctx.moveTo(x - 0.065, EYE_Y); ctx.quadraticCurveTo(x, EYE_Y + 0.05, x + 0.065, EYE_Y); ctx.lineWidth = 0.03; ctx.stroke() }
    ctx.beginPath(); ctx.moveTo(fx - 0.06, my); ctx.lineTo(fx + 0.06, my); ctx.lineWidth = 0.03; ctx.stroke()
    return
  }
  if (f === 'dizzy') {
    for (const x of eyes) { ctx.beginPath(); ctx.arc(x, EYE_Y, 0.045, 0, Math.PI * 1.6); ctx.lineWidth = 0.025; ctx.stroke() }
    ctx.beginPath(); ctx.moveTo(fx - 0.07, my); ctx.quadraticCurveTo(fx - 0.035, my - 0.03, fx, my); ctx.quadraticCurveTo(fx + 0.035, my + 0.03, fx + 0.07, my); ctx.lineWidth = 0.025; ctx.stroke()
    return
  }
  if (f === 'alert') {
    for (const x of eyes) {
      ctx.beginPath(); ctx.ellipse(x, EYE_Y, 0.07, 0.085, 0, 0, Math.PI * 2); ctx.fillStyle = '#f2f2f2'; ctx.fill(); ctx.lineWidth = 0.02; ctx.stroke()
      ctx.beginPath(); ctx.arc(x + (fx ? 0.02 : 0), EYE_Y, 0.028, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill()
    }
    ctx.beginPath(); ctx.ellipse(fx, my, 0.05, 0.04, 0, 0, Math.PI * 2); ctx.fill()
    return
  }
  for (const x of eyes) { ctx.beginPath(); ctx.ellipse(x, EYE_Y, 0.045, f === 'calm' ? 0.04 : 0.06, 0, 0, Math.PI * 2); ctx.fill() }
  if (f === 'sus') {
    ctx.beginPath(); ctx.moveTo(eyes[1] - 0.07, EYE_Y - 0.12); ctx.quadraticCurveTo(eyes[1], EYE_Y - 0.17, eyes[1] + 0.07, EYE_Y - 0.12); ctx.lineWidth = 0.03; ctx.stroke()
    ctx.beginPath(); ctx.arc(fx + 0.02, my, 0.025, 0, Math.PI * 2); ctx.fill()
  } else {
    ctx.beginPath(); ctx.moveTo(fx - 0.07, my); ctx.lineTo(fx + 0.07, my); ctx.lineWidth = 0.03; ctx.stroke()
  }
}

/** Where its hands are, and how big (a punch towards you looms). */
function guardHands(view: View, pose: GuardPose, time: number, walk: number): [number, number, number][] {
  if (view === 'side') {
    switch (pose) {
      case 'windup': return [[-0.62, 0.1, 0.16], [0.22, 0.02, 0.16]]
      case 'punch': return [[-0.55, 0.22, 0.16], [1.02, -0.06, 0.16]]
      case 'flinch': return [[-0.5, -0.12, 0.16], [0.42, -0.2, 0.16]]
      case 'stagger': return [[-0.62, 0.36, 0.16], [0.6, 0.34 + Math.sin(time * 7) * 0.04, 0.16]]
      case 'walk': return [[-0.68 + Math.sin(walk) * 0.08, 0.18, 0.16], [0.68 - Math.sin(walk) * 0.08, 0.18, 0.16]]
      default: return [[-0.68, 0.18 + Math.sin(time * 2) * 0.015, 0.16], [0.68, 0.18 - Math.sin(time * 2) * 0.015, 0.16]]
    }
  }
  const away = view === 'back'
  switch (pose) {
    case 'windup': return [[-0.62, 0.14, 0.16], [0.5, -0.24, away ? 0.14 : 0.18]]
    case 'punch': return away ? [[-0.6, 0.2, 0.16], [0.28, -0.12, 0.11]] : [[-0.6, 0.2, 0.16], [0.16, -0.06, 0.27]]
    case 'flinch': return [[-0.44, -0.22, 0.16], [0.44, -0.22, 0.16]]
    case 'stagger': return [[-0.64 + Math.sin(time * 6) * 0.05, 0.34, 0.16], [0.64 + Math.sin(time * 6) * 0.05, 0.3, 0.16]]
    case 'walk': return [[-0.68, 0.18 + Math.sin(walk) * 0.05, 0.16], [0.68, 0.18 - Math.sin(walk) * 0.05, 0.16]]
    default: return [[-0.68, 0.18 + Math.sin(time * 2) * 0.015, 0.16], [0.68, 0.18 - Math.sin(time * 2) * 0.015, 0.16]]
  }
}

function lean(view: View, pose: GuardPose, time: number): number {
  if (view !== 'side') return pose === 'stagger' ? Math.sin(time * 6) * 0.12 : 0
  if (pose === 'windup') return -0.12
  if (pose === 'punch') return 0.1
  if (pose === 'flinch') return -0.18
  if (pose === 'stagger') return Math.sin(time * 6) * 0.15
  return 0
}

/** The staff watchman (History #81, #84) in one of its three drawings. */
export function drawGuard(ctx: CanvasRenderingContext2D, look: GuardLook) {
  ctx.lineJoin = 'round'
  if (look.rim) { ctx.save(); ctx.globalAlpha = 0.9; guardShapes(ctx, look, look.rim); ctx.restore() }
  guardShapes(ctx, look, null)
}

function guardShapes(ctx: CanvasRenderingContext2D, look: GuardLook, rim: string | null) {
  const dark = 0.88 * (1 - Math.min(1, Math.max(0, look.light)))
  const paint = (fill: string, width: number) => {
    ctx.fillStyle = rim ?? shade(fill, dark)
    ctx.strokeStyle = rim ?? INK
    ctx.lineWidth = rim ? 0.14 : width
    ctx.fill(); ctx.stroke()
  }
  const C = GUARD_COLOURS
  // Lying down, it's the same from every side.
  const view: View = look.pose === 'down' ? 'side' : look.view
  ctx.save()
  if (look.pose === 'down') { ctx.translate(0, 0.62 - 0.44); ctx.rotate(Math.PI / 2); ctx.translate(0, -0.62) }
  else { const a = lean(view, look.pose, look.time); ctx.translate(0, 0.62); ctx.rotate(a); ctx.translate(0, -0.62) }
  const hands = look.pose === 'down' ? ([[-0.5, 0.42, 0.16], [0.5, 0.42, 0.16]] as [number, number, number][]) : guardHands(view, look.pose, look.time, look.walk)
  const drawHands = (which: (h: [number, number, number], i: number) => boolean) => {
    hands.forEach((h, i) => { if (!which(h, i)) return; ctx.beginPath(); ctx.arc(h[0], h[1], h[2], 0, Math.PI * 2); paint(C.skin, 0.04) })
  }
  if (view === 'back') drawHands(() => true)
  const moving = look.pose === 'walk'
  const lift = moving ? Math.sin(look.walk) * 0.05 : 0
  const feet = view === 'side' ? [-0.4, 0.06] : [-0.4, 0.04]
  feet.forEach((x, i) => { ctx.beginPath(); ctx.roundRect(x, 0.4 - Math.max(0, i ? -lift : lift), 0.36, 0.22, 0.05); paint(C.feet, 0.04) })
  ctx.translate(0, moving ? -Math.abs(Math.sin(look.walk)) * 0.03 : 0)
  ctx.beginPath(); ctx.roundRect(-0.42, -0.16, 0.84, 0.66, 0.08); paint(C.body, 0.05)
  if (!rim) { ctx.strokeStyle = shade(C.dark, dark); ctx.lineWidth = 0.07; ctx.beginPath(); ctx.moveTo(-0.4, 0.26); ctx.lineTo(0.4, 0.26); ctx.stroke() }
  ctx.beginPath(); ctx.arc(0, -0.43, 0.28, 0, Math.PI * 2); paint(C.skin, 0.05)
  if (!rim && view !== 'back') guardFace(ctx, look.pose === 'down' ? 'out' : look.face, view === 'side' ? 0.06 : 0)
  // Cap: the peak points forward from the side, spreads both ways from the front, and is a thin edge from behind.
  ctx.beginPath(); ctx.roundRect(-0.22, -0.82, 0.44, 0.16, 0.04); paint(C.dark, 0.03)
  ctx.beginPath()
  if (view === 'side') { ctx.moveTo(-0.3, -0.64); ctx.lineTo(0.44, -0.64); ctx.lineTo(0.38, -0.7); ctx.lineTo(-0.24, -0.7) }
  else if (view === 'back') { ctx.moveTo(-0.26, -0.645); ctx.lineTo(0.26, -0.645); ctx.lineTo(0.24, -0.69); ctx.lineTo(-0.24, -0.69) }
  else { ctx.moveTo(-0.38, -0.62); ctx.lineTo(0.38, -0.62); ctx.lineTo(0.3, -0.7); ctx.lineTo(-0.3, -0.7) }
  ctx.closePath(); paint(C.dark, 0.03)
  if (view !== 'back') drawHands(() => true)
  ctx.restore()
}

// ---------- The thief (for the blink view), from the game's thiefArt.ts ----------

const HERO = [242, 242, 242], TINT = [217, 219, 232], FOOT = [42, 42, 58]
export const KIT = '#20202c'
const K = 0.68
const TRAP = [[-0.32, -0.12], [0.32, -0.12], [0.5, 0.5], [-0.5, 0.5]]
const tie = (ctx: CanvasRenderingContext2D, x: number, y: number, deg: number, len: number) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate((deg * Math.PI) / 180)
  ctx.beginPath(); ctx.moveTo(0, -0.032); ctx.lineTo(len, -0.024); ctx.lineTo(len - 0.045, 0); ctx.lineTo(len, 0.024); ctx.lineTo(0, 0.032); ctx.closePath()
  ctx.fillStyle = KIT; ctx.fill(); ctx.lineWidth = 0.022; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore()
}

export function drawThief(ctx: CanvasRenderingContext2D, o: { view: View; time: number; light: number }) {
  const L = o.light, d = 0.88 * (1 - L), t = o.time
  const side = o.view === 'side', front = o.view === 'front', back = o.view === 'back'
  const hx = side ? 0.03 : 0, hy = -0.42, hr = 0.27, eyeY = -0.43
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  const headPath = () => { ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2) }
  const sway = (i: number) => Math.sin(t * 1.6 + i) * 4
  const knotX = hx - Math.sqrt(hr * hr - (eyeY - hy) ** 2)
  if (side) [118, 140].forEach((a, i) => tie(ctx, knotX, eyeY, a + sway(i), i ? 0.24 : 0.3))
  else if (front) [148, 32].forEach((a, i) => tie(ctx, 0, eyeY, a + sway(i), 0.42))
  const gl = side ? [[-0.76, 0.18], [0.76, 0.18]] : [[-0.74, 0.18], [0.74, 0.18]]
  const gloves = () => { ctx.fillStyle = KIT; ctx.lineWidth = 0.045; ctx.strokeStyle = INK; for (const [gx, gy] of gl) { ctx.beginPath(); ctx.arc(gx, gy, 0.17, 0, Math.PI * 2); ctx.fill(); ctx.stroke() } }
  if (back) gloves()
  ctx.fillStyle = mixRgb(FOOT, ROOM, 0.6 * (1 - L)); ctx.strokeStyle = INK; ctx.lineWidth = 0.04
  for (const [fx, fy] of side ? [[-0.44, 0.4], [0.04, 0.4]] : [[-0.42, 0.4], [0.02, 0.4]]) { ctx.beginPath(); ctx.roundRect(fx, fy, 0.4, 0.22, 0.06); ctx.fill(); ctx.stroke() }
  const g = ctx.createLinearGradient(0, -0.7, 0, 0.5); g.addColorStop(0, mixRgb(HERO, ROOM, d)); g.addColorStop(1, mixRgb(TINT, ROOM, d))
  ctx.fillStyle = g; ctx.lineWidth = 0.06
  ctx.beginPath(); TRAP.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); ctx.stroke()
  headPath(); ctx.fill()
  ctx.save(); headPath(); ctx.clip(); ctx.fillStyle = KIT; ctx.fillRect(-1, eyeY - 0.15 * K, 2, 0.3 * K); ctx.restore()
  headPath(); ctx.stroke()
  if (side) { ctx.beginPath(); ctx.arc(knotX + 0.01, eyeY, 0.05, 0, Math.PI * 2); ctx.fillStyle = KIT; ctx.fill(); ctx.lineWidth = 0.022; ctx.stroke() }
  if (back) {
    ctx.beginPath(); ctx.arc(0, eyeY, 0.06, 0, Math.PI * 2); ctx.fillStyle = KIT; ctx.fill(); ctx.lineWidth = 0.022; ctx.strokeStyle = INK; ctx.stroke()
    ;[102, 80].forEach((a, i) => tie(ctx, 0, eyeY, a + sway(i) * 0.6, i ? 0.26 : 0.32))
  }
  if (!back) {
    const ecx = side ? 0.03 + 0.04 * K : 0
    for (const ex of [ecx - 0.19 * K, ecx + 0.19 * K]) {
      ctx.beginPath(); ctx.ellipse(ex, eyeY, 0.085 * K, 0.1 * K, 0, 0, Math.PI * 2); ctx.fillStyle = '#f2f2f2'; ctx.fill()
      ctx.beginPath(); ctx.arc(ex + (side ? 0.028 * K : 0), eyeY + (side ? 0.005 : 0.012) * K, 0.042 * K, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill()
    }
    const fx = side ? 0.03 : -0.01
    ctx.beginPath(); ctx.moveTo(fx - 0.13 * K, eyeY + 0.27 * K); ctx.quadraticCurveTo(fx + 0.01 * K, eyeY + 0.36 * K, fx + 0.15 * K, eyeY + 0.2 * K)
    ctx.lineWidth = 0.05 * K; ctx.strokeStyle = INK; ctx.stroke()
    gloves()
  }
}

/** Which drawing a character shows, from the way it faces and where it's seen from. */
export function viewFrom(fx: number, fz: number, tx: number, tz: number, current: View): View {
  const tl = Math.hypot(tx, tz) || 1
  const ang = (Math.acos(Math.max(-1, Math.min(1, (fx * tx + fz * tz) / tl))) * 180) / Math.PI
  // A little stickiness at the edges so it doesn't flicker between drawings.
  if (current === 'front') return ang > 50 ? 'side' : 'front'
  if (current === 'back') return ang < 130 ? 'side' : 'back'
  return ang < 40 ? 'front' : ang > 140 ? 'back' : 'side'
}
