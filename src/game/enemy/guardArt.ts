/**
 * The staff watchman as approved in the Guard Line-up (History #81, #84): a tall steel-teal
 * rectangle, a circle head under a flat cap, pale floating hands, a face that changes with its
 * state. Drawn in its own units (multiply by 1.25 S), body centre at the origin, facing right.
 */

export type GuardFace = 'calm' | 'sus' | 'alert' | 'dizzy' | 'out'
export type GuardPose = 'stand' | 'walk' | 'windup' | 'punch' | 'flinch' | 'stagger' | 'down'

export interface GuardLook {
  face: GuardFace
  pose: GuardPose
  time: number
  walk: number
  /** Killed: drained to grey (first take). */
  grey: boolean
}

const INK = '#12161b'
const C = { body: '#3e5a6e', dark: '#2a3e4d', skin: '#c9ced8', feet: '#2a2f38' }
const GREY = { body: '#4a4d52', dark: '#3a3c40', skin: '#7a7d82', feet: '#2f3134' }
const EYE_Y = -0.44

function face(ctx: CanvasRenderingContext2D, f: GuardFace) {
  const fx = 0.06
  const eyes = [fx - 0.12, fx + 0.12]
  ctx.lineCap = 'round'
  ctx.strokeStyle = INK
  ctx.fillStyle = INK
  const my = EYE_Y + 0.19
  if (f === 'out') {
    for (const x of eyes) {
      ctx.beginPath()
      ctx.moveTo(x - 0.065, EYE_Y)
      ctx.quadraticCurveTo(x, EYE_Y + 0.05, x + 0.065, EYE_Y)
      ctx.lineWidth = 0.03
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(fx - 0.06, my)
    ctx.lineTo(fx + 0.06, my)
    ctx.lineWidth = 0.03
    ctx.stroke()
    return
  }
  if (f === 'dizzy') {
    for (const x of eyes) {
      ctx.beginPath()
      ctx.arc(x, EYE_Y, 0.045, 0, Math.PI * 1.6)
      ctx.lineWidth = 0.025
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(fx - 0.07, my)
    ctx.quadraticCurveTo(fx - 0.035, my - 0.03, fx, my)
    ctx.quadraticCurveTo(fx + 0.035, my + 0.03, fx + 0.07, my)
    ctx.lineWidth = 0.025
    ctx.stroke()
    return
  }
  if (f === 'alert') {
    for (const x of eyes) {
      ctx.beginPath()
      ctx.ellipse(x, EYE_Y, 0.07, 0.085, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#f2f2f2'
      ctx.fill()
      ctx.lineWidth = 0.02
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x + 0.02, EYE_Y, 0.028, 0, Math.PI * 2)
      ctx.fillStyle = INK
      ctx.fill()
    }
    ctx.beginPath()
    ctx.ellipse(fx, my, 0.05, 0.04, 0, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  for (const x of eyes) {
    ctx.beginPath()
    ctx.ellipse(x, EYE_Y, 0.045, f === 'calm' ? 0.04 : 0.06, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  if (f === 'sus') {
    ctx.beginPath()
    ctx.moveTo(eyes[1] - 0.07, EYE_Y - 0.12)
    ctx.quadraticCurveTo(eyes[1], EYE_Y - 0.17, eyes[1] + 0.07, EYE_Y - 0.12)
    ctx.lineWidth = 0.03
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(fx + 0.02, my, 0.025, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.moveTo(fx - 0.07, my)
    ctx.lineTo(fx + 0.07, my)
    ctx.lineWidth = 0.03
    ctx.stroke()
  }
}

function hands(pose: GuardPose, time: number, walk: number): [number, number][] {
  switch (pose) {
    case 'windup':
      return [[-0.62, 0.1], [0.22, 0.02]]
    case 'punch':
      return [[-0.55, 0.22], [1.02, -0.06]]
    case 'flinch':
      return [[-0.5, -0.12], [0.42, -0.2]]
    case 'stagger':
      return [[-0.62, 0.36], [0.6, 0.34 + Math.sin(time * 7) * 0.04]]
    case 'walk':
      return [[-0.68 + Math.sin(walk) * 0.08, 0.18], [0.68 - Math.sin(walk) * 0.08, 0.18]]
    default:
      return [[-0.68, 0.18 + Math.sin(time * 2) * 0.015], [0.68, 0.18 - Math.sin(time * 2) * 0.015]]
  }
}

function lean(pose: GuardPose, time: number): number {
  if (pose === 'windup') return -0.12
  if (pose === 'punch') return 0.1
  if (pose === 'flinch') return -0.18
  if (pose === 'stagger') return Math.sin(time * 6) * 0.15
  return 0
}

export function drawGuard(ctx: CanvasRenderingContext2D, look: GuardLook) {
  const c = look.grey ? GREY : C
  ctx.lineJoin = 'round'
  ctx.save()
  if (look.pose === 'down') {
    // Lying on his back along the floor, head the way he was facing.
    ctx.translate(0, 0.62 - 0.44)
    ctx.rotate(Math.PI / 2)
    ctx.translate(0, -0.62)
  } else {
    const a = lean(look.pose, look.time)
    ctx.translate(0, 0.62)
    ctx.rotate(a)
    ctx.translate(0, -0.62)
  }
  const bob = look.pose === 'walk' ? Math.abs(Math.sin(look.walk)) * 0.03 : 0

  ctx.fillStyle = c.feet
  ctx.strokeStyle = INK
  ctx.lineWidth = 0.04
  const lift = look.pose === 'walk' ? Math.sin(look.walk) * 0.05 : 0
  for (const [x, y] of [[-0.4, 0.4 - Math.max(0, lift)], [0.06, 0.4 - Math.max(0, -lift)]]) {
    ctx.beginPath()
    ctx.roundRect(x, y, 0.36, 0.22, 0.05)
    ctx.fill()
    ctx.stroke()
  }
  ctx.translate(0, -bob)
  ctx.fillStyle = c.body
  ctx.lineWidth = 0.05
  ctx.beginPath()
  ctx.roundRect(-0.42, -0.16, 0.84, 0.66, 0.08)
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = c.dark
  ctx.lineWidth = 0.07
  ctx.beginPath()
  ctx.moveTo(-0.4, 0.26)
  ctx.lineTo(0.4, 0.26)
  ctx.stroke()

  ctx.fillStyle = c.skin
  ctx.strokeStyle = INK
  ctx.lineWidth = 0.05
  ctx.beginPath()
  ctx.arc(0, -0.43, 0.28, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  face(ctx, look.pose === 'down' ? 'out' : look.face)

  // Cap
  ctx.fillStyle = c.dark
  ctx.strokeStyle = INK
  ctx.lineWidth = 0.03
  ctx.beginPath()
  ctx.roundRect(-0.22, -0.82, 0.44, 0.16, 0.04)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-0.3, -0.64)
  ctx.lineTo(0.44, -0.64)
  ctx.lineTo(0.38, -0.7)
  ctx.lineTo(-0.24, -0.7)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = c.skin
  ctx.lineWidth = 0.04
  const hs = look.pose === 'down' ? ([[-0.5, 0.42], [0.5, 0.42]] as [number, number][]) : hands(look.pose, look.time, look.walk)
  for (const [x, y] of hs) {
    ctx.beginPath()
    ctx.arc(x, y, 0.16, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()
}
