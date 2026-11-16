import { landingNoise, NOISE } from '../../game/logic/noise.ts'
import { solidAt, type Level, type V3 } from '../level/level.ts'
import { headroom, makeBody, moveBody, type Body } from '../logic/body.ts'
import { forward, snapToFace, stepCeiling, stepWall, tryGrab, type Face, type Grab } from '../logic/climb.ts'
import { lightAt, resolveBlink, type BlinkLanding, type Posture } from '../logic/rules.ts'
import { BLINK, BODY, CLIMB, COMBAT, LEAN, MOVE } from '../tuning.ts'
import type { Intent } from './Controls.ts'

export type Mode = 'ground' | 'air' | 'wall' | 'ceiling' | 'mantle' | 'blink' | 'locked'

export interface BlinkState {
  phase: 'enter' | 'aim' | 'travel' | 'exit'
  t: number
  /** Where he's aiming, on the ground. */
  ax: number
  az: number
  landing: BlinkLanding | null
  from: V3
  cancelled: boolean
  resume: Mode
}

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)

/**
 * The thief in first person (History #92–#107): walking, running, crouching to sneak, sliding,
 * crawling, leaning, jumping; climbing walls and ceilings and mantling; and blinking from a
 * top-down view with time slowed. Combat drives him during takedowns.
 */
export class Player {
  readonly L: Level
  body: Body
  yaw: number
  pitch = 0
  mode: Mode = 'ground'
  posture: Posture = 'stand'
  crouchOn = false
  sliding = false
  private slideSpeed = 0
  private slideX = 0
  private slideZ = 0
  face: Face | null = null
  ceilY = 0
  private mantle: { from: V3; to: V3; t: number } | null = null
  grip = 1
  charges = BLINK.charges
  /** Leaning, -1 to 1, as far as there's room. */
  lean = 0
  private leanRoom = 1
  walk = 0
  moveAmt = 0
  climbPhase = 0
  eye = BODY.standEye
  private coyote = 0
  private jumpBuffer = 0
  private grabBuffer = 0
  private jumped = false
  dodgeT = 0
  private dodgeX = 0
  private dodgeZ = 0
  flash = 0
  /** How many times a guard's punch has landed on him (testing). */
  hits = 0
  light = 1
  noise = 0
  state = 'idle'
  private noiseTimer = 0
  blink: BlinkState | null = null
  /** Turns a point over the blink view (CSS pixels) into a spot on the ground: set by the game, which draws the view. */
  fromScreen: ((x: number, y: number) => { x: number; z: number }) | null = null
  readonly trace: string[] = []
  onNoise: ((level: number, at: V3) => void) | null = null
  onDust: ((at: V3, height: number) => void) | null = null
  /** Combat can move a blink's landing (behind a guard) and hear when he arrives. */
  adjustLanding: ((landing: BlinkLanding, ax: number, az: number) => BlinkLanding) | null = null
  onBlinkArrive: (() => void) | null = null

  constructor(L: Level) {
    this.L = L
    this.body = makeBody(L.spawn.x, L.spawn.y, L.spawn.z, BODY.r, BODY.standH)
    this.yaw = L.spawn.yaw
  }

  get pos(): V3 { return { x: this.body.x, y: this.body.y, z: this.body.z } }
  get dodging() { return this.dodgeT > 0 }
  get grounded() { return this.mode === 'ground' }
  get climbing() { return this.mode === 'wall' || this.mode === 'ceiling' }
  /** How fast time runs for everyone else: a fifth while he aims a blink (History #104). */
  get timeScale() { return this.blink && (this.blink.phase === 'enter' || this.blink.phase === 'aim') ? BLINK.slow : 1 }

  private note(s: string) {
    this.trace.push(s)
    if (this.trace.length > 30) this.trace.shift()
  }

  reset() {
    const s = this.L.spawn
    this.body = makeBody(s.x, s.y, s.z, BODY.r, BODY.standH)
    this.yaw = s.yaw
    this.pitch = 0
    this.mode = 'ground'
    this.posture = 'stand'
    this.crouchOn = this.sliding = false
    this.face = null
    this.mantle = null
    this.blink = null
    this.grip = 1
    this.charges = BLINK.charges
    this.lean = 0
    this.dodgeT = 0
    this.flash = 0
  }

  /** Testing: stand him somewhere. */
  place(x: number, y: number, z: number, yaw = this.yaw, pitch = this.pitch) {
    this.reset()
    this.body.x = x; this.body.y = y; this.body.z = z
    this.yaw = yaw; this.pitch = pitch
  }

  private setPosture(p: Posture) {
    if (p === this.posture) return
    this.posture = p
    this.body.h = p === 'stand' ? BODY.standH : p === 'crouch' ? BODY.crouchH : BODY.crawlH
  }

  private emit(level: number, at: V3 = this.pos) {
    if (level > 0) this.onNoise?.(level, at)
  }

  refill() {
    if (this.charges >= BLINK.charges) return false
    this.charges = BLINK.charges
    return true
  }

  knock(vx: number, vz: number, vy: number) {
    if (this.mode === 'wall' || this.mode === 'ceiling') this.letGo()
    if (this.mode === 'blink' || this.mode === 'locked') return
    this.sliding = false
    this.body.vx = vx; this.body.vz = vz; this.body.vy = vy
    this.body.grounded = false
    this.mode = 'air'
    this.flash = 1
    this.hits++
  }

  startDodge(dx: number, dz: number, time: number) {
    this.dodgeT = time
    this.dodgeX = dx; this.dodgeZ = dz
    this.sliding = false
  }

  /** Combat: hand his movement over to a takedown, or give it back. */
  lock(on: boolean) {
    if (on) {
      this.face = null
      this.sliding = false
      this.mantle = null
      this.setPosture('stand')
      this.body.vx = this.body.vy = this.body.vz = 0
      this.mode = 'locked'
    } else {
      this.body.grounded = true
      this.mode = 'ground'
    }
  }

  update(dt: number, I: Intent, pxPerS: number) {
    if (dt <= 0) return
    this.flash = Math.max(0, this.flash - dt * 3)
    if (this.mode !== 'locked' && !this.blink) {
      this.yaw += I.dyaw
      this.pitch = Math.max(-1.48, Math.min(1.48, this.pitch + I.dpitch))
    }
    if (this.blink) this.updateBlink(dt, I, pxPerS)
    else if (I.blinkPressed && this.charges > 0 && (this.mode === 'ground' || this.mode === 'air' || this.mode === 'wall' || this.mode === 'ceiling')) {
      // Blink opens the view; it stays open until he picks a spot or closes it (History #109).
      this.startBlink()
      this.updateBlink(0, { ...I, blinkPressed: false, selectPressed: false, backPressed: false }, pxPerS)
    } else {
      switch (this.mode) {
        case 'ground':
        case 'air':
          this.updateMove(dt, I)
          break
        case 'wall':
          this.updateWall(dt, I)
          break
        case 'ceiling':
          this.updateCeiling(dt, I)
          break
        case 'mantle':
          this.updateMantle(dt)
          break
        case 'locked':
          break
      }
    }
    if (this.mode === 'ground') this.grip = Math.min(1, this.grip + dt / CLIMB.recoverSeconds)
    this.updateLean(dt, I)
    // Eye height eases between postures.
    const target = this.mode === 'ceiling' ? BODY.hangH - 0.2 : this.sliding ? BODY.crawlEye + 0.08 : this.posture === 'stand' ? BODY.standEye : this.posture === 'crouch' ? BODY.crouchEye : BODY.crawlEye
    this.eye += (target - this.eye) * Math.min(1, dt * 12)
    this.light = lightAt(this.L, this.body.x, this.body.z)
    this.updateNoise(dt)
  }

  // ---------- On foot ----------

  private updateMove(dt: number, I: Intent) {
    const b = this.body
    const speedNow = Math.hypot(b.vx, b.vz)
    if (I.crouchPressed) {
      if (b.grounded && !this.sliding && speedNow >= MOVE.run * MOVE.slideFrom) {
        this.sliding = true
        this.slideSpeed = Math.max(speedNow, MOVE.run * MOVE.slideBoost)
        this.slideX = b.vx / speedNow; this.slideZ = b.vz / speedNow
        this.crouchOn = true
        this.emit(NOISE.noticeable)
      } else {
        this.crouchOn = !this.crouchOn
        this.sliding = false
      }
    }
    // Posture: as asked, if there's room.
    const room = headroom(this.L, b.x, b.z, b.r * 0.9, b.y)
    let want: Posture = this.sliding ? 'crawl' : this.crouchOn ? 'crouch' : 'stand'
    if (want === 'stand' && room < BODY.standH) want = room >= BODY.crouchH ? 'crouch' : 'crawl'
    if (want === 'crouch' && room < BODY.crouchH) want = 'crawl'

    const [fx, fz] = forward(this.yaw)
    const rx = -fz, rz = fx
    let wx = fx * I.moveZ + rx * I.moveX, wz = fz * I.moveZ + rz * I.moveX
    const wm = Math.hypot(wx, wz)
    if (wm > 1) { wx /= wm; wz /= wm }
    // Walking into somewhere too low to stand or crouch, he ducks for it on his own (crawling is automatic).
    if (b.grounded && wm > 0.1) {
      const ahead = BODY.r + 0.2
      const roomAhead = headroom(this.L, b.x + (wx / Math.min(1, wm)) * ahead, b.z + (wz / Math.min(1, wm)) * ahead, b.r * 0.9, b.y)
      const h = want === 'stand' ? BODY.standH : want === 'crouch' ? BODY.crouchH : BODY.crawlH
      if (roomAhead < h && roomAhead >= BODY.crawlH) want = roomAhead >= BODY.crouchH ? 'crouch' : 'crawl'
    }
    this.setPosture(want)
    const running = I.run && this.posture === 'stand' && I.moveZ > 0.1
    const speed = this.posture === 'crawl' ? MOVE.crawl : this.posture === 'crouch' ? MOVE.sneak : running ? MOVE.run : MOVE.walk
    if (this.dodgeT > 0) {
      this.dodgeT -= dt
      b.vx = this.dodgeX * COMBAT.dodgeSpeed; b.vz = this.dodgeZ * COMBAT.dodgeSpeed
    } else if (this.sliding) {
      this.slideSpeed -= MOVE.slideDecel * dt
      b.vx = this.slideX * this.slideSpeed; b.vz = this.slideZ * this.slideSpeed
      if (this.slideSpeed < MOVE.sneak + 0.3) this.sliding = false
    } else {
      const a = (b.grounded ? MOVE.accel : MOVE.airAccel) * dt
      const tx = wx * speed, tz = wz * speed
      const dx = tx - b.vx, dz = tz - b.vz, dl = Math.hypot(dx, dz)
      if (dl <= a * speed || dl < 1e-6) { b.vx = tx; b.vz = tz }
      else { b.vx += (dx / dl) * a * speed; b.vz += (dz / dl) * a * speed }
    }

    // Jumping, with a little forgiveness either side of leaving the ground.
    if (I.jumpPressed) this.jumpBuffer = MOVE.jumpBuffer
    else if (this.jumpBuffer > 0) this.jumpBuffer -= dt
    this.coyote = b.grounded ? MOVE.coyote : this.coyote - dt
    if (this.jumpBuffer > 0 && this.coyote > 0 && room >= BODY.standH) {
      this.sliding = false
      this.crouchOn = false
      this.setPosture('stand')
      b.vy = MOVE.jump
      b.grounded = false
      this.jumped = true
      this.coyote = this.jumpBuffer = 0
    }
    if (this.jumped && !I.jumpHeld && b.vy > MOVE.jumpCut) b.vy = MOVE.jumpCut
    if (!b.grounded) b.vy = Math.max(-MOVE.maxFall, b.vy - MOVE.gravity * dt)
    else if (b.vy < 0) b.vy = 0

    const res = moveBody(this.L, b, dt, { stepUp: BODY.stepUp, stepDown: BODY.stepDown })
    if (res.landed) {
      this.jumped = false
      this.emit(landingNoise(res.impact * 0.9, this.crouchOn))
      this.note('land')
    }
    if (this.sliding && res.hitWall) this.sliding = false
    this.mode = b.grounded ? 'ground' : 'air'

    // Grab, with a quarter of a second's forgiveness (History #31).
    if (I.grabPressed) this.grabBuffer = CLIMB.grabBuffer
    if (this.grabBuffer > 0) {
      this.grabBuffer -= dt
      const g = tryGrab(this.L, b, this.yaw, this.pitch)
      if (g && this.startGrab(g)) this.grabBuffer = 0
    }

    const sp = Math.hypot(b.vx, b.vz)
    this.moveAmt += ((b.grounded ? Math.min(1, sp / MOVE.walk) : 0) - this.moveAmt) * Math.min(1, dt * 8)
    this.walk += dt * sp * 3.4
    this.state = !b.grounded ? 'air' : this.sliding ? 'slide' : sp < 0.2 ? 'idle' : this.posture === 'crawl' ? 'crawl' : this.posture === 'crouch' ? 'sneak' : running && sp > MOVE.walk + 0.3 ? 'run' : 'walk'
  }

  private startGrab(g: Grab): boolean {
    const b = this.body
    if (g.kind === 'mantle') { this.startMantle(g); return true }
    if (g.kind === 'wall') {
      if (headroom(this.L, b.x, b.z, b.r * 0.9, b.y) < BODY.standH) return false
      this.setPosture('stand')
      this.mode = 'wall'
      this.face = g.face
      snapToFace(b, g.face)
      this.note('grab wall')
    } else {
      this.mode = 'ceiling'
      this.ceilY = g.ceilY
      this.posture = 'stand'
      b.h = BODY.hangH
      b.y = g.ceilY - BODY.hangH
      this.note('grab ceiling')
    }
    this.sliding = this.crouchOn = false
    b.vx = b.vy = b.vz = 0
    b.grounded = false
    return true
  }

  private letGo() {
    const b = this.body
    if (this.mode === 'ceiling') { b.h = BODY.standH; b.y = this.ceilY - BODY.standH - 0.01 }
    this.mode = 'air'
    this.face = null
    b.grounded = false
    b.vy = 0
    this.jumped = false
    this.note('let go')
  }

  // ---------- Climbing ----------

  private updateWall(dt: number, I: Intent) {
    const b = this.body, f = this.face!
    this.grip -= dt / CLIMB.gripSeconds
    if (this.grip <= 0 || I.grabPressed) { this.grip = Math.max(0, this.grip); this.letGo(); return }
    if (I.jumpPressed) {
      // Kick off away from the wall.
      this.letGo()
      b.vx = f.nx * CLIMB.kickOut; b.vz = f.nz * CLIMB.kickOut; b.vy = CLIMB.kickUp
      this.jumped = true
      return
    }
    const res = stepWall(this.L, b, f, I.moveZ, I.moveX, dt)
    if (I.moveZ || I.moveX) this.climbPhase += dt * 7
    this.state = 'climb'
    if (res.kind === 'mantle') this.startMantle(res)
    else if (res.kind === 'ceiling') {
      this.mode = 'ceiling'
      this.ceilY = res.ceilY
      b.h = BODY.hangH
      b.y = res.ceilY - BODY.hangH
      this.face = null
      this.note('corner ceiling')
    } else if (res.kind === 'ground') {
      this.mode = 'ground'
      this.face = null
      b.grounded = true
      this.note('down to the ground')
    }
  }

  private updateCeiling(dt: number, I: Intent) {
    const b = this.body
    this.grip -= dt / CLIMB.gripSeconds
    if (this.grip <= 0 || I.grabPressed || I.jumpPressed) { this.grip = Math.max(0, this.grip); this.letGo(); return }
    const res = stepCeiling(this.L, b, this.ceilY, I.moveZ, I.moveX, this.yaw, dt)
    if (I.moveZ || I.moveX) this.climbPhase += dt * 6
    this.state = 'hang'
    if (res.kind === 'wall') {
      this.mode = 'wall'
      this.face = res.face
      b.h = BODY.standH
      b.y = this.ceilY - BODY.standH - 0.02
      snapToFace(b, res.face)
      this.note('corner wall')
    }
  }

  private startMantle(to: V3) {
    const b = this.body
    this.mantle = { from: { x: b.x, y: b.y, z: b.z }, to: { x: to.x, y: to.y, z: to.z }, t: 0 }
    this.mode = 'mantle'
    this.face = null
    this.setPosture('stand')
    b.vx = b.vy = b.vz = 0
    this.note('mantle')
  }

  private updateMantle(dt: number) {
    const m = this.mantle!, b = this.body
    m.t += dt / CLIMB.mantleTime
    const u = Math.min(1, m.t)
    b.y = m.from.y + (m.to.y - m.from.y) * ease(u / 0.6)
    const h = ease((u - 0.3) / 0.7)
    b.x = m.from.x + (m.to.x - m.from.x) * h
    b.z = m.from.z + (m.to.z - m.from.z) * h
    this.state = 'climb'
    if (u >= 1) {
      this.mantle = null
      const room = headroom(this.L, b.x, b.z, b.r * 0.9, b.y)
      this.crouchOn = room < BODY.standH
      this.setPosture(room >= BODY.standH ? 'stand' : room >= BODY.crouchH ? 'crouch' : 'crawl')
      b.grounded = true
      this.mode = 'ground'
      this.emit(NOISE.soft)
    }
  }

  // ---------- Leaning ----------

  private updateLean(dt: number, I: Intent) {
    const can = this.mode === 'ground' && this.posture !== 'crawl' && !this.sliding
    const want = can ? Math.max(-1, Math.min(1, I.lean)) : 0
    this.lean += (want - this.lean) * Math.min(1, dt * LEAN.speed)
    // Only as far as there's room beside him.
    const [fx, fz] = forward(this.yaw)
    const rx = -fz, rz = fx
    const side = Math.sign(this.lean)
    let room = 1
    if (side) {
      for (const frac of [1, 0.75, 0.5, 0.25, 0]) {
        const off = this.lean * LEAN.offset * frac + side * 0.18
        if (!solidAt(this.L, this.body.x + rx * off, this.body.y + this.eye, this.body.z + rz * off)) { room = frac; break }
      }
    }
    this.leanRoom += (room - this.leanRoom) * Math.min(1, dt * 12)
  }

  /** How far the camera leans: sideways offset and roll. */
  get leanAmount() { return this.lean * this.leanRoom }

  // ---------- Blink (History #104–#109) ----------

  private startBlink() {
    const b = this.body
    const [fx, fz] = forward(this.yaw)
    this.blink = { phase: 'enter', t: 0, ax: b.x + fx * 3, az: b.z + fz * 3, landing: null, from: this.pos, cancelled: false, resume: this.mode }
    this.mode = 'blink'
    this.sliding = false
    b.vx = b.vy = b.vz = 0
    this.note('blink aim')
  }

  /** Testing: aim the blink at a point. */
  aimAt(x: number, z: number) {
    if (!this.blink) return
    this.blink.ax = x; this.blink.az = z
  }

  private updateBlink(dt: number, I: Intent, pxPerS: number) {
    const bl = this.blink!, b = this.body
    if (bl.phase === 'enter' || bl.phase === 'aim') {
      if (I.aim.kind === 'delta') { bl.ax += I.aim.x / pxPerS; bl.az += I.aim.y / pxPerS }
      else if (I.aim.kind === 'stick' && Math.hypot(I.aim.x, I.aim.y) > 0.2) { bl.ax = bl.from.x + I.aim.x * BLINK.range; bl.az = bl.from.z + I.aim.y * BLINK.range }
      else if (I.aim.kind === 'point') { const q = this.fromScreen?.(I.aim.x, I.aim.y); if (q) { bl.ax = q.x; bl.az = q.z } }
      const dx = bl.ax - bl.from.x, dz = bl.az - bl.from.z, d = Math.hypot(dx, dz), max = BLINK.range + 1
      if (d > max) { bl.ax = bl.from.x + (dx / d) * max; bl.az = bl.from.z + (dz / d) * max }
      let landing = resolveBlink(this.L, bl.from, bl.ax, bl.az, BLINK.range)
      if (landing && this.adjustLanding) landing = this.adjustLanding(landing, bl.ax, bl.az)
      bl.landing = landing
      bl.t += dt
      if (bl.phase === 'enter' && bl.t >= BLINK.enter) { bl.phase = 'aim'; bl.t = 0 }
      if (I.blinkPressed || I.backPressed) {
        // Blink again (or B) closes the view without going anywhere.
        bl.phase = 'exit'; bl.t = 0; bl.cancelled = true
        this.note('blink cancelled')
      } else if (I.selectPressed && landing && Math.hypot(bl.ax - bl.from.x, bl.az - bl.from.z) >= 0.5) {
        // Picking a spot goes there at once, and the view closes behind him.
        bl.phase = 'travel'; bl.t = 0
        this.charges--
        this.onDust?.(bl.from, b.h)
        this.emit(NOISE.loud, bl.from)
        this.note('blink')
      }
      return
    }
    bl.t += dt
    if (bl.phase === 'travel' && bl.t >= BLINK.travel) {
      const ld = bl.landing!
      b.x = ld.x; b.y = ld.y; b.z = ld.z
      this.crouchOn = ld.posture !== 'stand'
      this.setPosture(ld.posture)
      // He faces the way he blinked (Claude's default).
      const dx = ld.x - bl.from.x, dz = ld.z - bl.from.z
      if (Math.hypot(dx, dz) > 0.1) this.yaw = Math.atan2(-dx, -dz)
      this.pitch = 0
      b.grounded = true
      this.face = null
      this.onDust?.(this.pos, b.h)
      this.emit(NOISE.loud)
      this.onBlinkArrive?.()
      bl.phase = 'exit'; bl.t = 0
      this.note('arrive')
      return
    }
    if (bl.phase === 'exit' && bl.t >= BLINK.exit) {
      this.blink = null
      if (bl.cancelled) this.mode = bl.resume === 'air' ? 'air' : bl.resume
      else this.mode = 'ground'
      if (this.mode === 'air') b.grounded = false
    }
  }

  /** 0–1: how much the top-down blink view covers the screen. */
  get mapAlpha() {
    const bl = this.blink
    if (!bl) return 0
    if (bl.phase === 'enter') return ease(bl.t / BLINK.enter)
    if (bl.phase === 'exit') return 1 - ease(bl.t / BLINK.exit)
    return 1
  }

  /** How far the camera has lifted out of his head into the blink view, 0–1. */
  get lift() { return this.mapAlpha }

  private updateNoise(dt: number) {
    const s = this.state
    this.noise = s === 'run' ? NOISE.loud : s === 'slide' ? NOISE.noticeable : s === 'walk' || s === 'climb' ? NOISE.soft : NOISE.silent
    if (this.mode === 'blink') this.noise = NOISE.silent
    this.noiseTimer += dt
    if (this.noise > 0 && this.noiseTimer > 0.45) { this.noiseTimer = 0; this.emit(this.noise) }
  }
}
