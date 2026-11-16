import type { AttackGlyph } from '../../game/input/device.ts'
import { NOISE } from '../../game/logic/noise.ts'
import type { Level, V3 } from '../level/level.ts'
import { forward } from '../logic/climb.ts'
import { holdOutcome, resolveBlink, takedownOn, type BlinkLanding, type TakedownKind } from '../logic/rules.ts'
import type { GlovePose } from '../render/hud.ts'
import { BLINK, COMBAT, GUARD, TAKEDOWN } from '../tuning.ts'
import type { Intent } from './Controls.ts'
import type { Guard } from './Guard.ts'
import type { Player } from './Player.ts'

export interface CombatHooks {
  hitStop(seconds: number): void
  shake(amount: number): void
  noise(level: number, at: V3): void
  sparks(at: V3, color: number, n: number): void
  /** Which way a guard is drawn turned on screen, for its pieces when it shatters. */
  flipOf(g: Guard): number
}

interface Takedown {
  guard: Guard
  kind: TakedownKind
  lethal: boolean
  t: number
  dur: number
  from: V3
  to: V3
  landed: boolean
  recover: number
  after: number
}

const BLOWS: GlovePose[] = ['jab', 'cross', 'shove']

/**
 * Fighting in first person (History #101–#103): the jab, cross and shove thrown by the gloves on
 * screen, the dodge as a sidestep, and takedowns. When one is on, the guard is outlined and shows
 * the badge with your Attack button and "tap · hold"; tap to knock out, hold to kill. From behind
 * or as a finisher the view lunges in and dips at the hit; from above it drops onto the guard.
 */
export class Combat {
  private step = 0
  private sinceBlow = 99
  private blowT = -1
  private blowHit = false
  private queued = 0
  private dodgeCd = 0
  private hurtT = 0
  private charge: { guard: Guard; kind: TakedownKind; t: number } | null = null
  private takedown: Takedown | null = null
  private context: { guard: Guard; kind: TakedownKind } | null = null
  /** A blink aimed at an unaware guard lands behind it and dazes it on arrival. */
  private blinkTarget: Guard | null = null
  glyph: AttackGlyph = 'key'
  /** For the camera: how far it lunges forward, and the dip at impact. */
  lunge = 0
  dip = 0
  private L: Level
  private player: Player
  private guards: Guard[]
  private hooks: CombatHooks

  constructor(L: Level, player: Player, guards: Guard[], hooks: CombatHooks) {
    this.L = L
    this.player = player
    this.guards = guards
    this.hooks = hooks
    player.adjustLanding = (ld, ax, az) => this.adjustLanding(ld, ax, az)
    player.onBlinkArrive = () => this.onBlinkArrive()
  }

  get busy() { return !!this.takedown || !!this.charge || this.blowT >= 0 }

  get status() {
    const g = this.takedown?.guard ?? this.charge?.guard ?? this.context?.guard ?? this.blinkTarget
    return {
      step: this.step,
      attacking: this.blowT >= 0,
      charging: !!this.charge,
      takedown: this.takedown?.kind ?? null,
      context: this.context?.kind ?? null,
      rim: g ? this.rimFor(g) : null,
      glyph: this.glyph,
      target: g ? this.guards.indexOf(g) : -1,
    }
  }

  reset() {
    if (this.takedown && !this.takedown.landed) this.takedown.guard.release()
    this.charge = null
    this.takedown = null
    this.blowT = -1
    this.step = 0
    this.queued = 0
    this.blinkTarget = null
    this.lunge = this.dip = 0
    if (this.player.mode === 'locked') this.player.lock(false)
  }

  rimFor(g: Guard): 'ko' | 'kill' | null {
    const td = this.takedown
    if (td) return td.guard === g && !td.landed ? (td.lethal ? 'kill' : 'ko') : null
    if (this.charge) return this.charge.guard === g ? (this.charge.t >= COMBAT.killHold ? 'kill' : 'ko') : null
    if (this.player.blink && this.blinkTarget === g) return 'ko'
    return this.context?.guard === g ? 'ko' : null
  }

  badgeFor(g: Guard): { hold: number; showButton: boolean } | null {
    if (this.takedown) return null
    if (this.charge) return this.charge.guard === g ? { hold: this.charge.t / COMBAT.killHold, showButton: true } : null
    // Aiming a blink at it, letting go of Blink is what does it, so no Attack button.
    if (this.player.blink && this.blinkTarget === g) return { hold: 0, showButton: false }
    return this.context?.guard === g ? { hold: 0, showButton: true } : null
  }

  /** What his gloves are doing, for the view. */
  get gloves(): { pose: GlovePose | null; t: number } {
    const td = this.takedown
    if (td) {
      const u = Math.min(1, td.t / td.dur), at = td.kind === 'drop' ? 1 : 0.75
      return { pose: 'grab', t: u < at ? (u / at) * 0.5 : 0.5 + ((u - at) / Math.max(0.01, 1 - at)) * 0.5 }
    }
    if (this.blowT >= 0) return { pose: BLOWS[this.step - 1], t: this.blowT / COMBAT.attackTime }
    if (this.player.dodging) return { pose: 'dodge', t: 0 }
    return { pose: null, t: 0 }
  }

  private view() {
    const p = this.player, b = p.body
    return { x: b.x, y: b.y, z: b.z, eye: p.eye, yaw: p.yaw, pitch: p.pitch, grounded: p.mode === 'ground', climbing: p.climbing }
  }

  private findContext() {
    const pv = this.view()
    let best: { guard: Guard; kind: TakedownKind; d: number } | null = null
    for (const g of this.guards) {
      const kind = takedownOn(this.L, pv, { x: g.x, y: g.y, z: g.z, fx: g.fx, fz: g.fz, unaware: g.unaware, open: g.open, down: g.down }, TAKEDOWN)
      if (!kind) continue
      const d = Math.hypot(g.x - pv.x, g.z - pv.z)
      if (!best || d < best.d) best = { guard: g, kind, d }
    }
    return best ? { guard: best.guard, kind: best.kind } : null
  }

  private still(I: Intent): Intent {
    return { ...I, moveX: 0, moveZ: 0, jumpPressed: false, grabPressed: false, crouchPressed: false, run: false, blinkHeld: false }
  }

  /** Before he moves: decides what Attack and Dodge do, and returns the input he moves with. */
  before(dt: number, I: Intent): Intent {
    const p = this.player
    this.glyph = I.attackGlyph
    this.sinceBlow += dt
    this.dodgeCd = Math.max(0, this.dodgeCd - dt)
    this.hurtT = Math.max(0, this.hurtT - dt)
    this.dip = Math.max(0, this.dip - dt * 4)
    if (this.sinceBlow > COMBAT.comboWindow && this.blowT < 0) this.step = 0
    if (!p.blink) this.blinkTarget = null
    if (this.takedown) { this.context = null; return this.still(I) }
    this.context = p.mode === 'blink' || p.mode === 'locked' || p.mode === 'mantle' ? null : this.findContext()

    if (this.charge) {
      if (!this.context || this.context.guard !== this.charge.guard) this.charge = null
      else {
        this.charge.t += dt
        const outcome = holdOutcome(this.charge.t, I.attackReleased || !I.attackHeld, COMBAT.killHold)
        if (outcome) this.beginTakedown(this.charge.guard, this.charge.kind, outcome === 'kill')
        return this.still(I)
      }
    }
    if (I.attackPressed && this.hurtT <= 0 && p.mode !== 'blink') {
      if (this.context) {
        this.charge = { guard: this.context.guard, kind: this.context.kind, t: 0 }
        this.blowT = -1
        return this.still(I)
      }
      if (p.mode === 'ground' && !p.dodging) {
        // Every press counts: the first starts a blow, the rest queue up behind it.
        let n = Math.max(1, I.attackPresses)
        if (this.blowT < 0) { this.startBlow(); n-- }
        this.queued = Math.min(this.queued + n, 3 - this.step)
      }
    }
    if (I.dodgePressed && this.dodgeCd <= 0 && p.mode === 'ground' && this.hurtT <= 0) {
      // A quick sidestep the way he's pushing, or a step back.
      const [fx, fz] = forward(p.yaw)
      let dx = fx * I.moveZ - fz * I.moveX, dz = fz * I.moveZ + fx * I.moveX
      const d = Math.hypot(dx, dz)
      if (d < 0.1) { dx = -fx; dz = -fz } else { dx /= d; dz /= d }
      p.startDodge(dx, dz, COMBAT.dodgeTime)
      this.dodgeCd = COMBAT.dodgeTime + COMBAT.dodgeCooldown
      this.blowT = -1; this.queued = 0; this.step = 0
    }
    if (this.blowT >= 0) return { ...I, moveX: I.moveX * 0.3, moveZ: I.moveZ * 0.3, run: false, jumpPressed: false }
    return I
  }

  private startBlow() {
    this.step = this.sinceBlow <= COMBAT.comboWindow && this.step < 3 ? this.step + 1 : 1
    this.blowT = 0
    this.blowHit = false
    this.sinceBlow = 0
  }

  private beginTakedown(guard: Guard, kind: TakedownKind, lethal: boolean) {
    const p = this.player, b = p.body
    this.charge = null
    this.blowT = -1
    const from = { x: b.x, y: b.y, z: b.z }
    const dx = guard.x - b.x, dz = guard.z - b.z, d = Math.hypot(dx, dz) || 1
    let to: V3, dur: number, recover = 0
    if (kind === 'drop') {
      // He drops onto it, landing on the near side of it.
      to = { x: guard.x - (dx / d) * 0.65, y: guard.y, z: guard.z - (dz / d) * 0.65 }
      dur = 0.45
      recover = 0.25
    } else {
      const stop = Math.max(0, d - 0.75)
      to = { x: b.x + (dx / d) * stop, y: b.y, z: b.z + (dz / d) * stop }
      dur = kind === 'behind' ? 0.3 : 0.25
    }
    p.lock(true)
    guard.hold()
    this.takedown = { guard, kind, lethal, t: 0, dur, from, to, landed: false, recover, after: 0 }
  }

  private adjustLanding(ld: BlinkLanding, ax: number, az: number): BlinkLanding {
    const p = this.player
    this.blinkTarget = null
    for (const g of this.guards) {
      if (g.down || !g.unaware || Math.hypot(g.x - ax, g.z - az) > 0.75) continue
      const sx = g.x - g.fx * 0.85, sz = g.z - g.fz * 0.85
      const snap = resolveBlink(this.L, p.blink?.from ?? p.pos, sx, sz, BLINK.range)
      if (snap && Math.hypot(snap.x - sx, snap.z - sz) < 0.35 && Math.abs(snap.y - g.y) < 0.4) {
        this.blinkTarget = g
        return snap
      }
    }
    return ld
  }

  private onBlinkArrive() {
    const g = this.blinkTarget
    this.blinkTarget = null
    if (!g || g.down) return
    g.stun()
    const b = this.player.body
    this.player.yaw = Math.atan2(-(g.x - b.x), -(g.z - b.z))
  }

  /** After everyone has moved: blows landing, takedowns playing out. */
  after(dt: number) {
    const p = this.player, b = p.body
    if (this.takedown) {
      const td = this.takedown
      td.t += dt
      const u = Math.min(1, td.t / td.dur)
      const e = 1 - Math.pow(1 - u, 2)
      b.x = td.from.x + (td.to.x - td.from.x) * e
      b.z = td.from.z + (td.to.z - td.from.z) * e
      b.y = td.from.y + (td.to.y - td.from.y) * (td.kind === 'drop' ? u * u : e)
      // Turn to face it, and look down at it when dropping.
      const want = Math.atan2(-(td.guard.x - b.x), -(td.guard.z - b.z))
      let da = want - p.yaw
      da = Math.atan2(Math.sin(da), Math.cos(da))
      p.yaw += da * Math.min(1, dt * 14)
      if (td.kind === 'drop') p.pitch += (-0.55 - p.pitch) * Math.min(1, dt * 10)
      this.lunge = td.kind === 'drop' ? 0 : Math.sin(Math.PI * u) * 0.28
      const at = td.kind === 'drop' ? 1 : 0.75
      if (!td.landed && u >= at) {
        td.landed = true
        td.guard.takedown(td.lethal, this.hooks.flipOf(td.guard))
        const c = { x: td.guard.x, y: td.guard.y + 1, z: td.guard.z }
        this.hooks.sparks(c, td.lethal ? 0x3e5a6e : 0xc9ced8, 16)
        this.hooks.sparks(c, 0xffffff, 8)
        this.hooks.hitStop(td.kind === 'drop' ? 0.1 : 0.06)
        this.hooks.shake(td.kind === 'drop' ? 0.6 : 0.35)
        this.hooks.noise(NOISE.soft, c)
        this.dip = 1
      }
      if (u >= 1) {
        td.after += dt
        if (td.after >= td.recover) { this.takedown = null; this.lunge = 0; p.lock(false) }
      }
      return
    }
    if (this.blowT >= 0) {
      this.blowT += dt
      // Lands on the first frame past its contact point, however long that frame was.
      if (!this.blowHit && this.blowT >= COMBAT.hitFrom) {
        this.blowHit = true
        const [fx, fz] = forward(p.yaw)
        for (const g of this.guards) {
          if (g.down) continue
          const dx = g.x - b.x, dz = g.z - b.z, d = Math.hypot(dx, dz)
          if (d > COMBAT.reach + GUARD.r || Math.abs(g.y - b.y) > 0.9 || d < 1e-3) continue
          if ((dx * fx + dz * fz) / d < Math.cos(COMBAT.arc)) continue
          const shove = this.step === 3
          g.hurt(shove ? 'shove' : 'hit', dx / d, dz / d, p.pos)
          this.hooks.sparks({ x: g.x - (dx / d) * 0.35, y: g.y + 1.1, z: g.z - (dz / d) * 0.35 }, shove ? 0xffffff : 0xe8e8f0, shove ? 12 : 7)
          this.hooks.hitStop(COMBAT.hitStop)
          // Fights are loud (History #54).
          this.hooks.noise(NOISE.loud, p.pos)
        }
      }
      if (this.blowT >= COMBAT.attackTime) {
        this.blowT = -1
        if (this.queued > 0 && this.step < 3) { this.queued--; this.startBlow() }
        else { this.queued = 0; if (this.step >= 3) this.step = 0 }
      }
    }
  }

  /** A guard's punch: misses if he's dodging, mid-blink or mid-takedown, or not in reach in front of it. */
  strike(g: Guard) {
    const p = this.player, b = p.body
    const dx = b.x - g.x, dz = b.z - g.z, d = Math.hypot(dx, dz)
    const inReach = d <= GUARD.attackReach + 0.35 && d > 1e-3 && (dx * g.fx + dz * g.fz) / d >= 0.3 && Math.abs(b.y - g.y) < 0.9
    if (!inReach) return
    if (p.dodging || this.takedown || p.mode === 'blink') {
      this.hooks.sparks({ x: b.x, y: b.y + 1, z: b.z }, 0xb4b4c6, 5)
      return
    }
    this.charge = null
    this.blowT = -1; this.step = 0; this.queued = 0
    p.knock((dx / d) * COMBAT.knockback, (dz / d) * COMBAT.knockback, COMBAT.knockUp)
    this.hurtT = COMBAT.hurtLock
    this.hooks.hitStop(0.08)
    this.hooks.shake(0.5)
    this.hooks.noise(NOISE.loud, p.pos)
  }
}
