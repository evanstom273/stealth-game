import * as Phaser from 'phaser'
import type { Guard } from '../enemy/Guard.ts'
import type { Intent } from '../input/Controls.ts'
import { holdOutcome, takedownOn, type TakedownKind } from '../logic/combat.ts'
import { overlaps, type Rect, type Vec } from '../logic/geometry.ts'
import { NOISE } from '../logic/noise.ts'
import type { Pose } from '../player/thiefArt.ts'
import type { Thief } from '../player/Thief.ts'
import { DEPTH } from '../room/RoomView.ts'
import { DUST, POWER } from '../style/tokens.ts'
import { BLINK, BODY, COMBAT, S, TAKEDOWN_CFG } from '../tuning.ts'

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
  size: number
  color: number
}

interface Takedown {
  guard: Guard
  kind: TakedownKind
  lethal: boolean
  from: Rect
  to: Rect
  t: number
  dur: number
  arc: number
  landed: boolean
}

export interface CombatHooks {
  hitStop(seconds: number): void
  shake(): void
  noise(level: number, at: Vec): void
}

const BLOWS: Pose[] = ['jab', 'cross', 'shove']

/**
 * Combat (History #50–#61, #85): the jab, cross and shove combo, the dodge, and takedowns.
 * When a takedown or finisher is possible a power-blue marker shows over the guard; pressing
 * Attack starts it, tap to knock out, hold to kill, with the marker's ring filling as you hold.
 */
export class Combat {
  private step = 0
  private sinceBlow = 99
  private blowT = -1
  private blowHit = false
  /** Presses made mid-blow, carried into the next blows (up to the combo's end). */
  private queued = 0
  private dodgeCd = 0
  private hurtT = 0
  private charge: { guard: Guard; kind: TakedownKind; t: number } | null = null
  private takedown: Takedown | null = null
  private context: { guard: Guard; kind: TakedownKind } | null = null
  private aimTarget: Guard | null = null
  private blinkTarget: Guard | null = null
  private wasBlinking = false
  private sparks: Spark[] = []
  private fx: Phaser.GameObjects.Graphics
  private thief: Thief
  private guards: Guard[]
  private hooks: CombatHooks
  private solids: readonly Rect[]

  constructor(scene: Phaser.Scene, thief: Thief, guards: Guard[], solids: readonly Rect[], hooks: CombatHooks) {
    this.thief = thief
    this.guards = guards
    this.solids = solids
    this.hooks = hooks
    this.fx = scene.add.graphics().setDepth(DEPTH.dust + 1)
  }

  get busy() {
    return !!this.takedown || !!this.charge || this.blowT >= 0
  }

  /** For tests and the debug panel. */
  get status() {
    return { step: this.step, attacking: this.blowT >= 0, charging: !!this.charge, takedown: this.takedown?.kind ?? null, context: this.context?.kind ?? null }
  }

  reset() {
    this.charge = null
    this.takedown = null
    this.blowT = -1
    this.step = 0
    this.thief.combatPose = null
    this.thief.blinkSnap = null
    if (this.thief.locked) this.thief.lock(false)
  }

  private thiefPose() {
    const t = this.thief
    return {
      box: t.box,
      facing: t.facing,
      grounded: t.mode === 'ground' || t.mode === 'slide',
      climb: t.mode === 'climb' && t.climb ? t.climb.mode : null,
      wallSide: t.climb?.side ?? t.facing,
    }
  }

  private guardPose(g: Guard) {
    return { box: g.box, facing: g.facing, unaware: g.unaware, open: g.open, down: g.down }
  }

  private findContext() {
    const tp = this.thiefPose()
    let best: { guard: Guard; kind: TakedownKind; d: number } | null = null
    for (const g of this.guards) {
      const kind = takedownOn(tp, this.guardPose(g), this.solids, TAKEDOWN_CFG)
      if (!kind) continue
      const d = Math.abs(g.centre.x - this.thief.centre.x)
      if (!best || d < best.d) best = { guard: g, kind, d }
    }
    return best ? { guard: best.guard, kind: best.kind } : null
  }

  /** The point he's aiming a blink at, as the thief works it out. */
  private aimPoint(intent: Intent): Vec | null {
    if (!intent.aim.active) return null
    const c = this.thief.centre
    if (intent.aim.world) return intent.aim.world
    const s = intent.aim.fromStick
    if (s && Math.hypot(s.x, s.y) > 0.25) return { x: c.x + s.x * BLINK.range, y: c.y + s.y * BLINK.range }
    return null
  }

  /**
   * Before he moves: decides what Attack and Dodge do this frame, and returns the input he
   * should move with (none while he's mid-blow, charging or in a takedown).
   */
  before(dt: number, intent: Intent): Intent {
    const t = this.thief
    this.sinceBlow += dt
    this.dodgeCd = Math.max(0, this.dodgeCd - dt)
    this.hurtT = Math.max(0, this.hurtT - dt)
    if (this.sinceBlow > COMBAT.comboWindow && this.blowT < 0) this.step = 0

    // Blink takedown: aim at an unaware guard and the blink lands behind it (History #53, first take).
    this.aimTarget = null
    t.blinkSnap = null
    const p = this.aimPoint(intent)
    if (p && t.charges > 0 && !this.takedown) {
      for (const g of this.guards) {
        const b = g.box
        const pad = 0.3 * S
        if (!g.down && g.unaware && p.x > b.x - pad && p.x < b.x + b.w + pad && p.y > b.y - pad && p.y < b.y + b.h + pad) {
          const behind = { x: g.centre.x - g.facing * 0.75 * S, y: b.y + b.h - BODY.h / 2 }
          if (Math.hypot(behind.x - t.centre.x, behind.y - t.centre.y) <= BLINK.range) {
            this.aimTarget = g
            t.blinkSnap = behind
          }
          break
        }
      }
    }
    if (intent.blinkReleased && !intent.aim.cancel && this.aimTarget) this.blinkTarget = this.aimTarget

    if (this.takedown) {
      this.context = null
      return this.still(intent)
    }

    this.context = t.mode === 'blink' || t.locked ? null : this.findContext()

    // Charging a takedown: tap to knock out, hold to kill.
    if (this.charge) {
      const still = this.context && this.context.guard === this.charge.guard
      if (!still) this.charge = null
      else {
        this.charge.t += dt
        const outcome = holdOutcome(this.charge.t, intent.attackReleased || !intent.attackHeld, COMBAT.killHold)
        if (outcome) this.beginTakedown(this.charge.guard, this.charge.kind, outcome === 'kill')
        return this.still(intent)
      }
    }

    if (intent.attackPressed && this.hurtT <= 0 && t.mode !== 'blink') {
      if (this.context) {
        this.charge = { guard: this.context.guard, kind: this.context.kind, t: 0 }
        this.blowT = -1
        t.combatPose = null
        return this.still(intent)
      }
      if (t.mode === 'ground' && !t.dodging) {
        if (this.blowT >= 0) this.queued = Math.min(this.queued + 1, 3 - this.step)
        else this.startBlow()
      }
    }

    if (intent.dodgePressed && this.dodgeCd <= 0 && t.mode === 'ground' && this.hurtT <= 0) {
      const dir = Math.abs(intent.moveX) > 0.1 ? Math.sign(intent.moveX) : -t.facing
      t.startDodge(dir, COMBAT.dodgeTime)
      this.dodgeCd = COMBAT.dodgeTime + COMBAT.dodgeCooldown
      this.blowT = -1
      this.queued = 0
      this.step = 0
      t.combatPose = null
    }

    if (this.blowT >= 0) return this.still(intent)
    return intent
  }

  private still(intent: Intent): Intent {
    return { ...intent, moveX: 0, moveY: 0, jumpPressed: false, grabPressed: false, run: false }
  }

  private startBlow() {
    this.step = this.sinceBlow <= COMBAT.comboWindow && this.step < 3 ? this.step + 1 : 1
    this.blowT = 0
    this.blowHit = false
    this.sinceBlow = 0
    this.thief.combatPose = BLOWS[this.step - 1]
    this.thief.body.setVelocityX(this.thief.facing * 0.6 * S)
  }

  private beginTakedown(guard: Guard, kind: TakedownKind, lethal: boolean) {
    const t = this.thief
    this.charge = null
    this.blowT = -1
    const from = t.box
    const gb = guard.box
    const floorY = gb.y + gb.h
    // Sneak attacks end behind the guard; finishers end on his own side of it.
    const side = Math.sign(guard.centre.x - t.centre.x) || t.facing
    const endX = kind === 'finisher' || kind === 'blink' ? guard.centre.x - side * 0.75 * S : guard.centre.x - guard.facing * 0.7 * S
    const to: Rect = { x: endX - BODY.w / 2, y: floorY - BODY.h, w: BODY.w, h: BODY.h }
    const dur = kind === 'ceiling' ? 0.45 : kind === 'wall' ? 0.5 : kind === 'behind' ? 0.3 : 0.25
    const arc = kind === 'wall' ? 0.9 * S : kind === 'behind' ? 0.15 * S : 0
    t.facing = guard.centre.x >= endX ? 1 : -1
    t.lock(true)
    this.takedown = { guard, kind, lethal, from, to, t: 0, dur, arc, landed: false }
  }

  /** After everyone has moved: blows landing, takedowns playing out, blinks arriving. */
  after(dt: number) {
    const t = this.thief

    // A blink that was aimed at a guard: it's dazed when he arrives (first take).
    const blinking = t.mode === 'blink'
    if (this.wasBlinking && !blinking && this.blinkTarget && !this.blinkTarget.down) {
      this.blinkTarget.stun()
      t.facing = this.blinkTarget.centre.x >= t.centre.x ? 1 : -1
    }
    if (this.wasBlinking && !blinking) this.blinkTarget = null
    this.wasBlinking = blinking

    if (this.takedown) {
      const td = this.takedown
      td.t += dt
      const u = Math.min(1, td.t / td.dur)
      const e = td.kind === 'ceiling' ? u * u : 1 - Math.pow(1 - u, 2)
      const x = td.from.x + (td.to.x - td.from.x) * e
      const y = td.from.y + (td.to.y - td.from.y) * e - Math.sin(Math.PI * u) * td.arc
      t.teleport({ ...td.to, x, y })
      t.combatPose = u < 0.55 && (td.kind === 'ceiling' || td.kind === 'wall') ? 'air' : td.kind === 'finisher' || td.kind === 'blink' ? 'shove' : 'grab'
      if (!td.landed && u >= 0.75) {
        td.landed = true
        td.guard.takedown(td.lethal)
        const gc = td.guard.centre
        this.burst(gc.x, gc.y - 0.2 * S, td.lethal ? 0x8a8d92 : 0xc9ced8, 14)
        this.burst(gc.x, gc.y - 0.2 * S, 0xffffff, 6)
        this.hooks.hitStop(0.06)
        this.hooks.shake()
        this.hooks.noise(NOISE.soft, gc)
      }
      if (u >= 1) {
        this.takedown = null
        t.combatPose = null
        t.lock(false)
      }
      return
    }

    if (this.blowT >= 0) {
      this.blowT += dt
      t.body.setVelocityX(t.body.velocity.x * Math.exp(-12 * dt))
      // Lands on the first frame past its contact point, however long that frame was.
      if (!this.blowHit && this.blowT >= COMBAT.hitFrom) {
        this.blowHit = true
        const b = t.box
        const cx = b.x + b.w / 2
        const reachBox: Rect = { x: t.facing > 0 ? cx : cx - COMBAT.reach, y: b.y, w: COMBAT.reach, h: b.h }
        for (const g of this.guards) {
          if (g.down || !overlaps(reachBox, g.box)) continue
          const shove = this.step === 3
          g.hurt(shove ? 'shove' : 'hit', t.facing, t.centre)
          const hx = t.facing > 0 ? g.box.x + 4 : g.box.x + g.box.w - 4
          this.burst(hx, b.y + b.h * 0.4, shove ? 0xffffff : 0xe8e8f0, shove ? 12 : 7)
          this.burst(hx, b.y + b.h * 0.4, 0x3e5a6e, 5)
          this.hooks.hitStop(COMBAT.hitStop)
          // Fights are loud (History #54).
          this.hooks.noise(NOISE.loud, t.centre)
        }
      }
      if (this.blowT >= COMBAT.attackTime) {
        this.blowT = -1
        t.combatPose = null
        if (this.queued > 0 && this.step < 3) {
          this.queued--
          this.startBlow()
        } else {
          this.queued = 0
          if (this.step >= 3) this.step = 0
        }
      }
    }
  }

  /** A guard's punch. Misses if he's dodging or mid-takedown. */
  strike(guard: Guard, reach: Rect) {
    const t = this.thief
    if (t.dodging || this.takedown || t.mode === 'blink') {
      if (overlaps(reach, t.box)) this.burst(t.centre.x, t.centre.y, DUST, 4)
      return
    }
    if (!overlaps(reach, t.box)) return
    const dir = guard.centre.x <= t.centre.x ? 1 : -1
    this.charge = null
    this.blowT = -1
    this.step = 0
    this.queued = 0
    t.combatPose = null
    t.knock(dir * COMBAT.knockback.x, -COMBAT.knockback.y)
    this.hurtT = COMBAT.hurtLock
    this.burst(t.centre.x - dir * 0.3 * S, t.centre.y - 0.2 * S, 0xffffff, 10)
    this.hooks.hitStop(0.08)
    this.hooks.noise(NOISE.loud, t.centre)
  }

  private burst(x: number, y: number, color: number, n: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = (1.5 + Math.random() * 3) * S
      this.sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - S, age: 0, life: 0.25 + Math.random() * 0.2, size: 3 + Math.random() * 4, color })
    }
  }

  /** Sparks, and the takedown marker over the guard with its hold ring. */
  draw(dt: number, px: number) {
    const g = this.fx
    g.clear()
    for (const s of this.sparks) {
      s.age += dt
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.vy += 6 * S * dt
    }
    this.sparks = this.sparks.filter((s) => s.age < s.life)
    for (const s of this.sparks) {
      g.fillStyle(s.color, 1 - s.age / s.life)
      g.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size)
    }

    const target = this.charge?.guard ?? (this.takedown ? null : (this.context?.guard ?? this.aimTarget))
    if (!target) return
    const b = target.box
    const mx = b.x + b.w / 2
    const my = b.y - 1.15 * S
    const r = 0.26 * S
    g.fillStyle(0x0d1a24, 0.9)
    g.fillCircle(mx, my, r)
    g.lineStyle(3 * px, POWER, 1)
    g.strokeCircle(mx, my, r)
    // A gloved fist.
    g.fillStyle(POWER, 1)
    g.fillCircle(mx, my + 0.02 * S, 0.1 * S)
    g.lineStyle(2 * px, 0x0d1a24, 1)
    g.beginPath()
    g.arc(mx, my + 0.02 * S, 0.06 * S, Math.PI * 1.1, Math.PI * 1.9)
    g.strokePath()
    if (this.charge) {
      const f = Math.min(1, this.charge.t / COMBAT.killHold)
      g.lineStyle(4 * px, POWER, 1)
      g.beginPath()
      g.arc(mx, my, r + 6 * px, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2)
      g.strokePath()
    }
  }
}
