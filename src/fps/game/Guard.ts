import { shatterPieces, stepPiece, shatterAlpha, type Piece } from '../../game/enemy/shatter.ts'
import { floorAt, tileOf, type GuardSpot, type Level, type V3 } from '../level/level.ts'
import { makeBody, moveBody, type Body } from '../logic/body.ts'
import { findPath, guardSees } from '../logic/rules.ts'
import { GUARD, MOVE, SIGHT } from '../tuning.ts'
import type { GuardFace, GuardPose, View } from '../art/views.ts'

export type GuardState = 'calm' | 'sus' | 'alert' | 'return' | 'stagger' | 'stunned' | 'ko' | 'dead'

/** What a guard knows about him this frame. */
export interface Sighting {
  chest: V3
  feetY: number
  light: number
  /** Mid-blink: nowhere to be seen. */
  hidden: boolean
}

/**
 * The test guard in first person (History #85, now in 3D): stands at its post turning, or walks a
 * patrol; notices him with a cone that reaches further the more lit he is; fills its "?" to "!";
 * comes over, finding its way round walls on its own floor, and punches. It can be hit, staggered,
 * dazed by a blink, knocked out (it lies with Zs) or killed (it shatters), and comes back after a while.
 */
export class Guard {
  readonly L: Level
  spot: GuardSpot
  body: Body
  fx: number
  fz: number
  state: GuardState = 'calm'
  suspicion = 0
  sees = false
  view: View = 'front'
  private turnT = GUARD.turnEvery
  private turned = false
  private lostT = 0
  private lastSeen: V3 | null = null
  private attack: 'none' | 'windup' | 'strike' | 'recover' = 'none'
  private attackT = 0
  private cooldown = 0
  private flinchT = 0
  stateT = 0
  walk = 0
  time = 0
  private held = false
  private path: [number, number][] = []
  private pathT = 0
  private patrolI = 1
  private pause = 0
  private moving = false
  shatter: { age: number; pieces: Piece[]; flip: number } | null = null
  light = 1
  /** Testing: keep it still and facing one way. */
  frozen = false

  constructor(L: Level, spot: GuardSpot) {
    this.L = L
    this.spot = spot
    this.body = makeBody(spot.x, 0, spot.z, GUARD.r, GUARD.h)
    this.fx = spot.facing[0]; this.fz = spot.facing[1]
    this.reset()
  }

  get x() { return this.body.x }
  get y() { return this.body.y }
  get z() { return this.body.z }
  get unaware() { return this.state === 'calm' || this.state === 'sus' || this.state === 'return' }
  get open() { return this.state === 'stagger' || this.state === 'stunned' }
  get down() { return this.state === 'ko' || this.state === 'dead' }
  get eye(): V3 { return { x: this.body.x + this.fx * 0.1, y: this.body.y + GUARD.eye, z: this.body.z + this.fz * 0.1 } }

  reset() {
    // Straight onto the floor of its tile.
    const [c, r] = tileOf(this.spot.x, this.spot.z)
    this.body = makeBody(this.spot.x, floorAt(this.L, c, r), this.spot.z, GUARD.r, GUARD.h)
    this.fx = this.spot.facing[0]; this.fz = this.spot.facing[1]
    this.state = 'calm'
    this.suspicion = 0
    this.attack = 'none'
    this.lastSeen = null
    this.turnT = GUARD.turnEvery
    this.turned = false
    this.held = false
    this.shatter = null
    this.path = []
    this.patrolI = 1
    this.pause = 0
    this.frozen = false
  }

  private alert(at: V3) {
    this.state = 'alert'
    this.suspicion = 1
    this.lastSeen = { ...at }
    this.lostT = 0
  }

  private face(x: number, z: number) {
    const dx = x - this.body.x, dz = z - this.body.z, d = Math.hypot(dx, dz)
    if (d > 1e-3) { this.fx = dx / d; this.fz = dz / d }
  }

  /** Struck by one of his blows; the shove at the end of a combo staggers it. */
  hurt(kind: 'hit' | 'shove', dx: number, dz: number, from: V3) {
    if (this.down) return
    this.attack = 'none'
    this.cooldown = 0.3
    this.alert(from)
    this.face(from.x, from.z)
    if (kind === 'shove') {
      this.state = 'stagger'
      this.stateT = GUARD.stagger
      this.body.vx = dx * 3; this.body.vz = dz * 3
    } else {
      this.flinchT = GUARD.flinch
      this.body.vx = dx * 1.5; this.body.vz = dz * 1.5
    }
  }

  /** He's just blinked in behind it: dazed for a moment, open to a finisher. */
  stun() {
    if (this.down) return
    this.attack = 'none'
    this.state = 'stunned'
    this.stateT = GUARD.blinkStun
    this.body.vx = this.body.vz = 0
  }

  /** A takedown has started on it: committed, it can't turn or notice anything (History #90). */
  hold() { this.held = true; this.attack = 'none'; this.body.vx = this.body.vz = 0 }
  release() { this.held = false }

  takedown(lethal: boolean, flip: number) {
    this.held = false
    this.attack = 'none'
    this.state = lethal ? 'dead' : 'ko'
    this.stateT = GUARD.downFor
    this.suspicion = 0
    this.body.vx = this.body.vz = 0
    if (lethal) this.shatter = { age: 0, pieces: shatterPieces(Math.random), flip }
  }

  private walkTo(x: number, z: number, speed: number, dt: number): boolean {
    const dx = x - this.body.x, dz = z - this.body.z, d = Math.hypot(dx, dz)
    if (d < 0.12) { this.body.vx = this.body.vz = 0; return true }
    this.body.vx = (dx / d) * speed; this.body.vz = (dz / d) * speed
    this.fx = dx / d; this.fz = dz / d
    this.moving = true
    this.walk += dt * speed * 3.6
    return false
  }

  /** Follows a path of tiles towards a point on its own floor; recomputed now and then. */
  private follow(x: number, z: number, speed: number, dt: number): boolean {
    this.pathT -= dt
    if (this.pathT <= 0 || !this.path.length) {
      this.path = findPath(this.L, tileOf(this.body.x, this.body.z), tileOf(x, z), this.body.y, GUARD.h) ?? []
      this.path.shift()
      this.pathT = 0.4
    }
    const [tc, tr] = tileOf(x, z)
    while (this.path.length) {
      const [c, r] = this.path[0]
      // The last tile: straight on to the point itself.
      if (c === tc && r === tr) { this.path = []; break }
      if (Math.hypot(c + 0.5 - this.body.x, r + 0.5 - this.body.z) < 0.3) this.path.shift()
      else { this.walkTo(c + 0.5, r + 0.5, speed, dt); return false }
    }
    return this.walkTo(x, z, speed, dt)
  }

  /** One frame of thinking. Returns true on the frame a punch lands. */
  update(dt: number, him: Sighting): boolean {
    this.time += dt
    this.cooldown = Math.max(0, this.cooldown - dt)
    this.moving = false
    let strike = false
    if (this.shatter) {
      this.shatter.age += dt
      for (const p of this.shatter.pieces) stepPiece(p, dt)
      if (shatterAlpha(this.shatter.age) <= 0) this.shatter = null
    }
    const settle = () => {
      if (!this.body.grounded) this.body.vy = Math.max(-MOVE.maxFall, this.body.vy - MOVE.gravity * dt)
      moveBody(this.L, this.body, dt, { stepUp: 0.36, stepDown: 0.45 })
    }
    if (this.held || this.frozen) { this.body.vx = this.body.vz = 0; this.sees = false; settle(); return false }
    if (this.down) {
      this.body.vx = this.body.vz = 0
      this.stateT -= dt
      if (this.stateT <= 0) {
        if (this.state === 'dead') this.reset()
        else { this.state = 'return'; this.suspicion = 0.3 }
      }
      this.sees = false
      settle()
      return false
    }
    if (this.open) {
      const f = Math.exp(-6 * dt)
      this.body.vx *= f; this.body.vz *= f
      this.stateT -= dt
      if (this.stateT <= 0) this.alert(him.chest)
      this.sees = false
      settle()
      return false
    }
    if (this.flinchT > 0) {
      this.flinchT -= dt
      const f = Math.exp(-10 * dt)
      this.body.vx *= f; this.body.vz *= f
      settle()
      return false
    }

    const tracking = this.state === 'alert'
    this.sees = !him.hidden && guardSees(this.L, this.eye, this.fx, this.fz, tracking, him.chest, him.light, SIGHT)
    this.body.vx = this.body.vz = 0
    switch (this.state) {
      case 'calm':
        if (this.spot.patrol) {
          if (this.pause > 0) this.pause -= dt
          else {
            const p = this.spot.patrol[this.patrolI]
            if (this.walkTo(p.x, p.z, GUARD.returnSpeed, dt)) { this.pause = 1.2; this.patrolI = 1 - this.patrolI }
          }
        } else if (this.spot.turn) {
          this.turnT -= dt
          if (this.turnT <= 0) {
            this.turned = !this.turned
            const f = this.turned ? this.spot.turn : this.spot.facing
            this.fx = f[0]; this.fz = f[1]
            this.turnT = GUARD.turnEvery
          }
        }
        if (this.sees) this.state = 'sus'
        break
      case 'return':
      case 'sus': {
        if (this.sees) {
          const d = Math.hypot(him.chest.x - this.eye.x, him.chest.z - this.eye.z)
          const close = 1 - Math.min(1, d / (SIGHT.darkRange + (SIGHT.lightRange - SIGHT.darkRange) * him.light))
          this.suspicion += (GUARD.suspicionRate + GUARD.suspicionCloseBonus * close) * dt
          this.face(him.chest.x, him.chest.z)
          this.lastSeen = { ...him.chest }
          this.state = 'sus'
          if (this.suspicion >= 1) this.alert(him.chest)
        } else {
          this.suspicion -= GUARD.suspicionDecay * dt
          if (this.state === 'return') {
            this.suspicion = Math.max(0, this.suspicion)
            if (this.follow(this.spot.x, this.spot.z, GUARD.returnSpeed, dt) || Math.hypot(this.spot.x - this.body.x, this.spot.z - this.body.z) < 0.2) {
              this.state = 'calm'
              this.fx = this.spot.facing[0]; this.fz = this.spot.facing[1]
              this.turned = false
              this.turnT = GUARD.turnEvery
            }
          } else if (this.suspicion <= 0) {
            this.suspicion = 0
            this.state = this.atPost() ? 'calm' : 'return'
            this.turnT = GUARD.turnEvery
          }
        }
        break
      }
      case 'alert': {
        if (this.sees) { this.lastSeen = { ...him.chest }; this.lostT = 0 } else this.lostT += dt
        if (this.lostT > GUARD.giveUpAfter) { this.state = 'return'; this.suspicion = 0.5; this.attack = 'none'; break }
        const target = this.lastSeen ?? him.chest
        const flat = Math.hypot(target.x - this.body.x, target.z - this.body.z)
        const sameLevel = Math.abs(him.feetY - this.body.y) < 0.7
        if (this.attack === 'none') {
          if (flat > GUARD.attackReach) this.follow(target.x, target.z, GUARD.chaseSpeed, dt)
          else {
            this.face(target.x, target.z)
            if (this.sees && sameLevel && this.cooldown <= 0) { this.attack = 'windup'; this.attackT = 0 }
          }
        }
        break
      }
    }

    // The punch: a wind-up you can read, a quick strike, then a recovery.
    if (this.attack !== 'none') {
      this.body.vx = this.body.vz = 0
      this.attackT += dt
      if (this.attack === 'windup' && this.attackT >= GUARD.windup) { this.attack = 'strike'; this.attackT = 0; strike = true }
      else if (this.attack === 'strike' && this.attackT >= GUARD.strike) { this.attack = 'recover'; this.attackT = 0 }
      else if (this.attack === 'recover' && this.attackT >= GUARD.recover) { this.attack = 'none'; this.cooldown = GUARD.cooldown }
    }
    settle()
    return strike
  }

  private atPost() { return Math.hypot(this.spot.x - this.body.x, this.spot.z - this.body.z) < 0.4 }

  /** Testing: keep it at its post facing one way. */
  holdStill(fx: number, fz: number) {
    this.spot = { ...this.spot, facing: [fx, fz], turn: undefined, patrol: undefined }
    this.reset()
    this.turnT = 1e9
  }

  get pose(): GuardPose {
    if (this.down) return 'down'
    if (this.open) return 'stagger'
    if (this.flinchT > 0) return 'flinch'
    if (this.attack === 'windup') return 'windup'
    if (this.attack === 'strike' || (this.attack === 'recover' && this.attackT < 0.15)) return 'punch'
    return this.moving ? 'walk' : 'stand'
  }

  get faceLook(): GuardFace {
    if (this.open) return 'dizzy'
    if (this.state === 'alert') return 'alert'
    if (this.state === 'sus' || this.state === 'return') return 'sus'
    return 'calm'
  }
}
