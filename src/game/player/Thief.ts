import * as Phaser from 'phaser'
import type { Intent } from '../input/Controls.ts'
import { clampToRange, resolveBlink, type BlinkResult } from '../logic/blink.ts'
import { climbStep, findGrab, type Climb } from '../logic/climb.ts'
import { isFree, type Rect, type Vec } from '../logic/geometry.ts'
import { stepGrip } from '../logic/grip.ts'
import { lightAt } from '../logic/light.ts'
import { landingNoise, noiseFor, NOISE, type MoveState } from '../logic/noise.ts'
import type { Room } from '../room/testRoom.ts'
import { DUST } from '../style/tokens.ts'
import { BLINK, BLINK_CFG, BODY, CLIMB, CLIMB_CFG, COMBAT, GRIP, LIGHT, MOVE, S, SLIDE } from '../tuning.ts'
import type { Pose } from './thiefArt.ts'
import { ThiefView, type Pixel } from './ThiefView.ts'

export type Mode = 'ground' | 'air' | 'slide' | 'climb' | 'blink'

interface Mote {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
  size: number
  color: number
}

interface BlinkAnim {
  t: number
  result: BlinkResult
  from: (Pixel & { vx: number; vy: number; delay: number })[]
  to: (Pixel & { sx: number; sy: number; delay: number })[]
}

export type NoiseListener = (level: number, x: number, y: number) => void

const hexRgb = (n: number) => [(n >> 16) & 255, (n >> 8) & 255, n & 255]
const mixColor = (a: number, b: number, t: number) => {
  const ca = hexRgb(a)
  const cb = hexRgb(b)
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t))
  return (c[0] << 16) | (c[1] << 8) | c[2]
}
const easeOut = (u: number) => 1 - Math.pow(1 - u, 3)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** The thief: movement, climbing, blink, and how he looks while doing it. */
export class Thief {
  readonly zone: Phaser.GameObjects.Zone
  readonly body: Phaser.Physics.Arcade.Body
  private view: ThiefView
  private dust: Phaser.GameObjects.Graphics

  mode: Mode = 'air'
  climb: Climb | null = null
  facing: 1 | -1 = 1
  sneaking = false
  grip = 1
  charges = BLINK.charges
  aim: BlinkResult | null = null
  light = 1
  noise = 0
  state: MoveState = 'idle'
  onNoise: NoiseListener | null = null
  /** Recent changes of mode, for the debug hook. */
  readonly trace: string[] = []
  /** Set by combat: a pose to draw instead of his movement pose. */
  combatPose: Pose | null = null
  /** Set by combat during takedowns: movement is scripted, not his own. */
  locked = false
  /** A blink aimed at a guard lands here instead, behind it (set by combat). */
  blinkSnap: Vec | null = null
  /** Seconds left of the white flash when he's hit. */
  flash = 0
  private dodgeT = 0
  private dodgeDir = 1

  private coyote = 0
  private jumpBuffer = 0
  private grabBuffer = 0
  private jumpCut = false
  private wasGrounded = false
  private lastVy = 0
  private slideSpeed = 0
  private prevMoveY = 0
  private squash = { x: 1, y: 1, vx: 0, vy: 0 }
  private walkPhase = 0
  private swing = 0
  private climbPhase = 0
  private tie = 0
  private time = 0
  private noiseTimer = 0
  private moving = false
  private blink: BlinkAnim | null = null
  private motes: Mote[] = []

  private room: Room

  constructor(scene: Phaser.Scene, room: Room) {
    this.room = room
    const sp = room.spawn
    this.zone = scene.add.zone(sp.x, sp.y - BODY.h / 2, BODY.w, BODY.h)
    scene.physics.add.existing(this.zone)
    this.body = this.zone.body as Phaser.Physics.Arcade.Body
    this.body.setMaxVelocityY(MOVE.maxFall)
    this.view = new ThiefView(scene)
    this.dust = scene.add.graphics().setDepth(10)
  }

  get box(): Rect {
    return { x: this.body.position.x, y: this.body.position.y, w: this.body.width, h: this.body.height }
  }

  /** His centre as if standing, which is where blinks are measured from. */
  get centre(): Vec {
    const b = this.box
    return { x: b.x + b.w / 2, y: b.y + b.h - BODY.h / 2 }
  }

  /** Where his drawing's origin is: the middle of his body. */
  get origin(): Vec {
    const b = this.box
    return { x: b.x + b.w / 2, y: b.y + b.h - 0.62 * S }
  }

  get grounded() {
    return this.body.blocked.down || this.body.touching.down
  }

  setZoom(zoom: number) {
    this.view.setZoom(zoom)
  }

  private setBox(b: Rect) {
    this.body.reset(b.x + b.w / 2, b.y + b.h / 2)
  }

  private setHeight(h: number) {
    if (Math.abs(this.body.height - h) < 0.5) return
    const cx = this.body.center.x
    const bottom = this.body.bottom
    this.body.setSize(BODY.w, h, true)
    this.body.reset(cx, bottom - h / 2)
  }

  private standingBox(): Rect {
    const b = this.box
    return { x: b.x, y: b.y + b.h - BODY.h, w: BODY.w, h: BODY.h }
  }

  private freeze(on: boolean) {
    this.body.moves = !on
    this.body.setAllowGravity(!on)
    if (on) this.body.setVelocity(0, 0)
  }

  private emit(level: number, at?: Vec) {
    if (level <= 0) return
    const p = at ?? this.centre
    this.onNoise?.(level, p.x, p.y)
  }

  private puff(x: number, y: number, n: number, spread: number) {
    for (let i = 0; i < n; i++) {
      this.motes.push({
        x: x + (Math.random() - 0.5) * spread,
        y: y - Math.random() * 4,
        vx: (Math.random() - 0.5) * 2.2 * S,
        vy: -Math.random() * 1.2 * S,
        age: 0,
        life: 0.35 + Math.random() * 0.25,
        size: 3 + Math.random() * 3,
        color: DUST,
      })
    }
  }

  private kick(sx: number, sy: number) {
    this.squash.x = sx
    this.squash.y = sy
    this.squash.vx = 0
    this.squash.vy = 0
  }

  get dodging() {
    return this.dodgeT > 0
  }

  /** Combat: place him exactly (takedowns move him along a scripted path). */
  teleport(b: Rect) {
    this.setBox(b)
  }

  /** Combat: hand his movement over to a takedown, or give it back. */
  lock(on: boolean, landed = true) {
    this.locked = on
    if (on) {
      this.setHeight(BODY.h)
      this.freeze(true)
      this.climb = null
      this.aim = null
    } else {
      this.freeze(false)
      this.mode = landed ? 'ground' : 'air'
      this.wasGrounded = landed
    }
  }

  /** Combat: a guard's punch lands. He's invulnerable for now: a flash and a knock back (History #85). */
  knock(vx: number, vy: number) {
    if (this.mode === 'climb') {
      this.climb = null
      this.freeze(false)
    }
    if (this.mode === 'slide') this.endSlide()
    this.mode = 'air'
    this.wasGrounded = false
    this.body.setVelocity(vx, vy)
    this.flash = 1
    this.kick(1.2, 0.85)
  }

  /** Combat: a quick dash; attacks pass through him while it lasts. */
  startDodge(dir: number, time: number) {
    this.dodgeT = time
    this.dodgeDir = dir >= 0 ? 1 : -1
    this.kick(1.3, 0.75)
    this.puff(this.body.center.x, this.body.bottom, 5, BODY.w)
  }

  refill() {
    if (this.charges >= BLINK.charges) return false
    this.charges = BLINK.charges
    return true
  }

  reset() {
    this.blink = null
    this.climb = null
    this.aim = null
    this.mode = 'air'
    this.charges = BLINK.charges
    this.grip = 1
    this.sneaking = false
    this.setHeight(BODY.h)
    this.freeze(false)
    this.setBox({ x: this.room.spawn.x - BODY.w / 2, y: this.room.spawn.y - BODY.h, w: BODY.w, h: BODY.h })
  }

  update(dt: number, intent: Intent) {
    this.time += dt
    this.flash = Math.max(0, this.flash - dt * 6)
    if (this.locked) {
      this.light = lightAt(this.centre, this.room.lamps, LIGHT.lampRadius, LIGHT.lampClear)
      this.render(dt)
      return
    }
    if (this.mode === 'blink') {
      this.updateBlink(dt)
      this.render(dt)
      return
    }

    if (intent.sneakPressed) this.sneaking = !this.sneaking
    this.updateAim(intent)
    if ((this.mode as Mode) === 'blink') {
      this.render(dt)
      return
    }

    if (this.mode === 'climb') this.updateClimb(dt, intent)
    else this.updateGround(dt, intent)
    this.prevMoveY = intent.moveY

    this.light = lightAt(this.centre, this.room.lamps, LIGHT.lampRadius, LIGHT.lampClear)
    this.updateNoise(dt)
    this.render(dt)
  }

  // ---- Blink ----

  private updateAim(intent: Intent) {
    if (!intent.aim.active || this.charges <= 0) {
      this.aim = null
      return
    }
    const c = this.centre
    let point: Vec
    if (intent.aim.world) point = intent.aim.world
    else if (intent.aim.fromStick && Math.hypot(intent.aim.fromStick.x, intent.aim.fromStick.y) > 0.25) {
      point = { x: c.x + intent.aim.fromStick.x * BLINK.range, y: c.y + intent.aim.fromStick.y * BLINK.range }
    } else point = { x: c.x + this.facing * BLINK.range * 0.6, y: c.y }
    if (this.blinkSnap) point = this.blinkSnap
    point = clampToRange(c, point, BLINK.range)
    const solids = this.room.solids
    this.aim = resolveBlink(c, point, solids, BLINK_CFG)
    if (intent.blinkReleased) {
      const result = this.aim
      this.aim = null
      if (!intent.aim.cancel) this.startBlink(result)
    }
  }

  private startBlink(result: BlinkResult) {
    this.charges -= 1
    const o = this.origin
    // His pixels where he stands now.
    const from = this.view.pixels(o.x, o.y, this.facing).map((p) => ({
      ...p,
      vx: ((Math.random() - 0.5) * 0.9 - this.facing * 0.7) * S,
      vy: -(Math.random() * 1.1 + 0.2) * S,
      delay: p.h * 0.28,
    }))
    // His pixels where he'll arrive, drawn in the pose he'll arrive in.
    const tb = result.box
    const destOrigin = { x: tb.x + tb.w / 2, y: tb.y + tb.h - 0.62 * S }
    const destFacing: 1 | -1 = result.mode === 'wall' ? result.side : destOrigin.x >= o.x ? 1 : -1
    const pose: Pose = result.mode === 'wall' ? 'wall' : result.mode === 'ceiling' ? 'ceiling' : result.mode === 'air' ? 'air' : 'stand'
    const destLight = lightAt({ x: destOrigin.x, y: destOrigin.y }, this.room.lamps, LIGHT.lampRadius, LIGHT.lampClear)
    this.view.draw({ light: destLight, time: this.time, speed: 0, swing: 0, pose, climb: 0 })
    const to = this.view.pixels(destOrigin.x, destOrigin.y, destFacing).map((p) => ({
      ...p,
      sx: p.x + (Math.random() - 0.5) * 1.6 * S - destFacing * 0.6 * S,
      sy: p.y + (Math.random() - 0.6) * 1.2 * S,
      delay: (1 - p.h) * 0.2,
    }))
    this.blink = { t: 0, result, from, to }
    this.facing = destFacing
    this.setHeight(BODY.h)
    this.freeze(true)
    this.mode = 'blink'
    this.climb = null
    this.emit(NOISE.loud, { x: o.x, y: o.y })
  }

  private updateBlink(dt: number) {
    const b = this.blink!
    b.t += dt
    if (b.t < BLINK.duration) return
    const r = b.result
    this.blink = null
    this.setBox(r.box)
    this.emit(NOISE.loud)
    if (r.mode === 'wall' || r.mode === 'ceiling') {
      this.mode = 'climb'
      this.climb = { mode: r.mode, solid: r.solid, side: r.side }
      if (r.mode === 'wall') this.facing = r.side
    } else {
      this.freeze(false)
      this.mode = r.mode === 'stand' ? 'ground' : 'air'
      this.wasGrounded = r.mode === 'stand'
    }
    this.kick(1.12, 0.9)
  }

  // ---- Climbing ----

  private note(msg: string) {
    this.trace.push(`${this.time.toFixed(2)} ${msg}`)
    if (this.trace.length > 30) this.trace.shift()
  }

  private letGo(vx = 0, vy = 0, why = '') {
    this.note(`let go ${why}`)
    this.climb = null
    this.mode = 'air'
    this.freeze(false)
    this.body.setVelocity(vx, vy)
    this.wasGrounded = false
  }

  private updateClimb(dt: number, intent: Intent) {
    const climb = this.climb!
    if (intent.grabPressed) {
      this.letGo(0, 0, 'grab')
      return
    }
    if (intent.jumpPressed) {
      if (climb.mode === 'wall') {
        this.facing = (-climb.side) as 1 | -1
        this.letGo(-climb.side * CLIMB.wallJump.x, -CLIMB.wallJump.y, 'wall jump')
        this.kick(0.8, 1.22)
      } else this.letGo(0, 0, 'jump')
      return
    }
    this.grip = stepGrip(this.grip, climb.mode, dt, GRIP)
    if (this.grip <= 0) {
      this.letGo(0, 0, 'grip')
      return
    }
    const r = climbStep(climb, this.box, { x: intent.moveX, y: intent.moveY }, this.room.solids, dt, CLIMB_CFG)
    this.moving = r.moved
    if (r.moved) this.climbPhase += dt * 9
    this.setBox(r.box)
    if (r.event) this.note(`climb ${r.event} -> ${r.climb?.mode ?? 'off'}`)
    if (r.climb) {
      this.climb = r.climb
      if (r.climb.mode === 'wall') this.facing = r.climb.side
      else if (Math.abs(intent.moveX) > 0.1) this.facing = intent.moveX > 0 ? 1 : -1
    } else {
      this.climb = null
      this.freeze(false)
      this.mode = 'ground'
      this.wasGrounded = true
      if (r.event === 'mantle') this.kick(1.15, 0.85)
    }
  }

  // ---- On the ground and in the air ----

  private updateGround(dt: number, intent: Intent) {
    const body = this.body
    const grounded = this.grounded
    const running = intent.run && Math.abs(intent.moveX) > 0.1

    // Grab: hold a wall or ceiling, or climb onto a ledge in reach.
    this.grabBuffer = intent.grabPressed ? MOVE.grabBuffer : Math.max(0, this.grabBuffer - dt)
    if (this.grabBuffer > 0 && this.mode !== 'slide') {
      const g = findGrab(this.box, this.facing, intent.moveY < -0.5, this.room.solids, CLIMB_CFG)
      if (g) this.grabBuffer = 0
      if (g?.kind === 'climb') {
        this.freeze(true)
        this.setBox(g.box)
        this.climb = g.climb
        this.mode = 'climb'
        if (g.climb.mode === 'wall') this.facing = g.climb.side
        this.kick(0.9, 1.1)
        return
      }
      if (g?.kind === 'mantle') {
        this.setBox(g.box)
        body.setVelocity(0, 0)
        this.mode = 'ground'
        this.kick(1.15, 0.85)
        return
      }
    }

    // Jump timing: a little forgiveness either side of leaving the ground.
    this.coyote = grounded ? MOVE.coyoteTime : Math.max(0, this.coyote - dt)
    this.jumpBuffer = intent.jumpPressed ? MOVE.jumpBuffer : Math.max(0, this.jumpBuffer - dt)

    // Landing
    if (grounded && !this.wasGrounded) {
      const impact = this.lastVy
      const k = clamp01(impact / (14 * S))
      this.kick(1 + 0.4 * k, 1 - 0.4 * k)
      if (impact > 4 * S) this.puff(body.center.x, body.bottom, 6 + Math.round(k * 6), BODY.w)
      this.emit(landingNoise(impact / S, this.sneaking))
    }
    this.wasGrounded = grounded
    if (grounded) this.grip = stepGrip(this.grip, 'ground', dt, GRIP)

    if (this.dodgeT > 0) {
      this.dodgeT -= dt
      body.setVelocityX(this.dodgeDir * (this.dodgeT > 0 ? COMBAT.dodgeSpeed : MOVE.walk * 0.5))
      this.mode = grounded ? 'ground' : 'air'
    } else if (this.mode === 'slide') {
      this.updateSlide(dt, intent, grounded)
    } else {
      // Start a slide: press down while running fast (History #42).
      const downNow = intent.moveY > 0.5 && this.prevMoveY <= 0.5
      if (grounded && running && downNow && Math.abs(body.velocity.x) >= MOVE.run * SLIDE.minSpeedFactor) {
        this.mode = 'slide'
        this.slideSpeed = Math.sign(body.velocity.x) * Math.max(Math.abs(body.velocity.x), MOVE.run) * SLIDE.boost
        this.setHeight(BODY.slideH)
        this.kick(1.25, 0.8)
        this.puff(body.center.x, body.bottom, 8, BODY.w)
      } else {
        const base = running ? MOVE.run : this.sneaking ? MOVE.sneak : MOVE.walk
        const mag = Math.min(1, Math.abs(intent.moveX) / 0.85)
        const target = Math.abs(intent.moveX) > 0.08 ? Math.sign(intent.moveX) * base * (running ? 1 : mag) : 0
        const accel = grounded ? (target === 0 ? MOVE.groundDecel : MOVE.groundAccel) : MOVE.airAccel
        const vx = body.velocity.x
        const dv = target - vx
        body.setVelocityX(vx + Math.sign(dv) * Math.min(Math.abs(dv), accel * dt))
        if (Math.abs(intent.moveX) > 0.1) this.facing = intent.moveX > 0 ? 1 : -1
        this.mode = grounded ? 'ground' : 'air'
      }
    }

    // Jump
    if (this.jumpBuffer > 0 && this.coyote > 0 && (this.mode !== 'slide' || this.canStand())) {
      if (this.mode === 'slide') this.endSlide()
      body.setVelocityY(-MOVE.jumpVelocity)
      this.jumpBuffer = 0
      this.coyote = 0
      this.jumpCut = false
      this.mode = 'air'
      this.wasGrounded = false
      this.kick(0.72, 1.32)
      this.puff(body.center.x, body.bottom, 5, BODY.w)
      this.emit(this.sneaking ? NOISE.silent : NOISE.soft)
    }
    if (!intent.jumpHeld && body.velocity.y < 0 && !this.jumpCut && this.mode === 'air') {
      body.setVelocityY(body.velocity.y * MOVE.jumpCut)
      this.jumpCut = true
    }
    if (grounded) this.jumpCut = false
    this.lastVy = body.velocity.y

    // Walk cycle for the gloves.
    const speed = Math.abs(body.velocity.x)
    this.moving = speed > 5
    if (grounded && this.moving && this.mode === 'ground') {
      this.walkPhase += dt * (speed / MOVE.walk) * 8
      this.swing = Math.sin(this.walkPhase)
    } else this.swing *= Math.exp(-10 * dt)
  }

  private canStand() {
    return isFree(this.standingBox(), this.room.solids)
  }

  private endSlide() {
    this.setHeight(BODY.h)
    this.mode = 'ground'
  }

  private updateSlide(dt: number, intent: Intent, grounded: boolean) {
    const body = this.body
    if (!grounded) {
      if (this.canStand()) this.endSlide()
      this.mode = 'air'
      return
    }
    const sign = Math.sign(this.slideSpeed) || this.facing
    const mag = Math.abs(this.slideSpeed) - SLIDE.friction * dt
    if (mag > SLIDE.endSpeed) {
      this.slideSpeed = sign * mag
    } else if (this.canStand()) {
      body.setVelocityX(sign * mag)
      this.endSlide()
      return
    } else {
      // Under something low: crawl along at a sneak.
      this.slideSpeed = Math.abs(intent.moveX) > 0.1 ? Math.sign(intent.moveX) * MOVE.sneak : 0
      if (this.slideSpeed) this.facing = this.slideSpeed > 0 ? 1 : -1
    }
    if (this.slideSpeed && (body.blocked.left || body.blocked.right)) this.slideSpeed = 0
    body.setVelocityX(this.slideSpeed)
    if (Math.abs(this.slideSpeed) > MOVE.walk && Math.random() < dt * 20) this.puff(body.center.x - sign * BODY.w * 0.4, body.bottom, 1, 6)
  }

  // ---- Noise ----

  private updateNoise(dt: number) {
    const onMetal = !!(this.climb && this.room.solids[this.climb.solid]?.metal)
    let s: MoveState
    if (this.mode === 'climb') s = this.moving ? 'climb' : 'hang'
    else if (this.mode === 'slide') s = 'slide'
    else if (this.mode === 'air') s = 'air'
    else if (!this.moving) s = 'idle'
    else if (Math.abs(this.body.velocity.x) > MOVE.walk * 1.2) s = 'run'
    else if (this.sneaking) s = 'sneak'
    else s = 'walk'
    this.state = s
    this.noise = noiseFor(s, onMetal)
    this.noiseTimer += dt
    if (this.noise > 0 && this.noiseTimer > 0.45) {
      this.noiseTimer = 0
      this.emit(this.noise)
    }
  }

  // ---- Drawing ----

  private render(dt: number) {
    // Squash and stretch springs back (guide §7.1).
    const sq = this.squash
    const k = 300
    const c = 20
    const step = Math.min(dt, 1 / 30)
    sq.vx += (k * (1 - sq.x) - c * sq.vx) * step
    sq.vy += (k * (1 - sq.y) - c * sq.vy) * step
    sq.x += sq.vx * step
    sq.y += sq.vy * step

    const speed = Math.abs(this.body.velocity.x)
    const tieTarget = this.mode === 'climb' ? 0 : clamp01(speed / MOVE.run)
    this.tie += (tieTarget - this.tie) * Math.min(1, dt * 5)

    const pose: Pose =
      this.combatPose ??
      (this.dodgeT > 0 ? 'dodge' : this.mode === 'climb' && this.climb ? this.climb.mode : this.mode === 'slide' ? 'slide' : this.mode === 'air' ? 'air' : 'stand')
    let sx = sq.x
    let sy = sq.y
    if (pose === 'slide') {
      sx *= 1.22
      sy *= 0.58
    } else if (pose === 'dodge') {
      sx *= 1.12
      sy *= 0.86
    } else if (this.sneaking && (pose === 'stand' || pose === 'air')) sy *= 0.9
    const anchor = pose === 'ceiling' ? -1.1 * S : pose === 'wall' ? 0 : 0.62 * S
    const o = this.origin

    if (this.mode !== 'blink') {
      this.view.draw({ light: this.light, time: this.time, speed: this.tie, swing: this.swing, pose, climb: this.climbPhase }, this.flash)
    }
    this.view.place(o.x, o.y + anchor * (1 - sy), this.facing, sx, sy, this.mode !== 'blink')
    this.drawDust(dt)
  }

  private drawDust(dt: number) {
    const g = this.dust
    g.clear()
    for (const m of this.motes) {
      m.age += dt
      m.x += m.vx * dt
      m.y += m.vy * dt
      m.vy += 2 * S * dt
    }
    this.motes = this.motes.filter((m) => m.age < m.life)
    for (const m of this.motes) {
      g.fillStyle(m.color, 1 - m.age / m.life)
      g.fillRect(m.x - m.size / 2, m.y - m.size / 2, m.size, m.size)
    }
    const b = this.blink
    if (!b) return
    // Turning to dust (History #36): he crumbles from the head down, and gathers at the far end.
    const T = b.t
    const size = 2.4
    for (const p of b.from) {
      const a = clamp01((T - p.delay) / 0.5)
      if (a >= 1) continue
      g.fillStyle(a > 0 ? mixColor(p.color, DUST, 0.45) : p.color, 1 - a)
      g.fillRect(p.x + p.vx * a * 0.6, p.y + p.vy * a * 0.6 + 0.5 * S * a * a, size, size)
    }
    for (const p of b.to) {
      const q = clamp01((T - 0.45 - p.delay) / 0.45)
      if (q <= 0) continue
      const e = easeOut(q)
      g.fillStyle(q < 1 ? mixColor(p.color, DUST, 0.45 * (1 - q)) : p.color, q)
      g.fillRect(p.sx + (p.x - p.sx) * e, p.sy + (p.y - p.sy) * e, size, size)
    }
  }
}
