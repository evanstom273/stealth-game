import * as Phaser from 'phaser'
import { commands, hud } from '../bridge.ts'
import { Combat } from '../combat/Combat.ts'
import { Guard } from '../enemy/Guard.ts'
import { Controls, type Intent } from '../input/Controls.ts'
import type { Vec } from '../logic/geometry.ts'
import { NOISE_NAMES } from '../logic/noise.ts'
import { glovesFor, HEAD, TRAPEZOID, type Pose } from '../player/thiefArt.ts'
import { Thief } from '../player/Thief.ts'
import { Darkness } from '../room/Darkness.ts'
import { DEPTH, drawLamps, drawRoom } from '../room/RoomView.ts'
import { TEST_ROOM } from '../room/testRoom.ts'
import { POWER } from '../style/tokens.ts'
import { BLINK, MOVE, S, SIGHT_CFG, screenS } from '../tuning.ts'

/** One-frame presses, which mustn't be lost while the game is frozen for a hit-stop. */
const PRESSES = ['jumpPressed', 'sneakPressed', 'grabPressed', 'attackPressed', 'attackReleased', 'dodgePressed'] as const

interface Ring {
  x: number
  y: number
  radius: number
  age: number
  life: number
  color: number
  alpha: number
}

/** The test room: the full thief, no guards, for trying every move (History #37). */
export class TestRoomScene extends Phaser.Scene {
  private thief!: Thief
  private guards: Guard[] = []
  private combat!: Combat
  private hitStop = 0
  /** Presses made during a hit-stop, carried into the first frame after it. */
  private carried: Partial<Intent> = {}
  private reducedMotion = false
  private controls!: Controls
  private darkness!: Darkness
  private fx!: Phaser.GameObjects.Graphics
  private status!: Phaser.GameObjects.Graphics
  private rings: Ring[] = []
  private paused = false
  private lookX = 0
  private debugTimer = 0
  private frames = 0
  private fpsTime = 0
  private fps = 60
  private dashOffset = 0

  constructor() {
    super('TestRoom')
  }

  private get dpr(): number {
    return (this.registry.get('dpr') as number) || 1
  }

  /** World pixels per CSS pixel, for lines that should look the same width on every screen. */
  private get px(): number {
    return this.dpr / this.cameras.main.zoom
  }

  create() {
    const room = TEST_ROOM
    this.rings = []
    this.paused = false
    this.physics.world.gravity.y = MOVE.gravity

    drawRoom(this, room)
    const solids = room.solids.map((s) => {
      const z = this.add.zone(s.x + s.w / 2, s.y + s.h / 2, s.w, s.h)
      this.physics.add.existing(z, true)
      return z
    })
    this.darkness = new Darkness(this)
    drawLamps(this, room)
    this.fx = this.add.graphics().setDepth(DEPTH.effects)
    this.status = this.add.graphics().setDepth(DEPTH.status)

    this.thief = new Thief(this, room)
    this.physics.add.collider(this.thief.zone, solids)
    // `?guards=0` in the address: an empty room, for testing movement on its own.
    const noGuards = new URLSearchParams(window.location.search).get('guards') === '0'
    this.guards = noGuards ? [] : room.guards.map((g, i) => new Guard(this, { x: g.x, y: g.y }, g.facing, i))
    for (const g of this.guards) this.physics.add.collider(g.zone, solids)
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.combat = new Combat(this, this.thief, this.guards, room.solids, {
      hitStop: (s) => {
        this.hitStop = Math.max(this.hitStop, s)
        this.physics.pause()
      },
      shake: () => {
        if (!this.reducedMotion) this.cameras.main.shake(110, 0.004)
      },
      noise: (level, at) => {
        if (hud.get().showNoise) this.rings.push({ x: at.x, y: at.y, radius: (0.6 + level * 1.4) * S, age: 0, life: 0.7, color: 0xe8e8f0, alpha: 0.4 })
      },
    })
    this.thief.onNoise = (level, x, y) => {
      if (hud.get().showNoise) this.rings.push({ x, y, radius: (0.6 + level * 1.4) * S, age: 0, life: 0.7, color: 0xe8e8f0, alpha: 0.4 })
    }
    this.controls = new Controls(this)

    const cam = this.cameras.main
    const b = room.bounds
    cam.setBackgroundColor('#0b0b10')
    cam.setBounds(b.x - 8 * S, b.y - 8 * S, b.w + 16 * S, b.h + 16 * S)
    cam.startFollow(this.thief.zone, true, 0.12, 0.12)
    this.applyZoom()
    this.snapCamera()
    this.scale.on('resize', this.applyZoom, this)

    const stop = commands.listen((c) => {
      if (c === 'pause') this.setPaused(true)
      if (c === 'resume') this.setPaused(false)
      if (c === 'restart') {
        this.combat.reset()
        this.thief.reset()
        for (const g of this.guards) g.reset()
        this.snapCamera()
        this.rings = []
        this.setPaused(false)
      }
    })
    const cleanup = () => {
      stop()
      this.scale.off('resize', this.applyZoom, this)
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup)
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup)

    hud.set({ charges: this.thief.charges, maxCharges: BLINK.charges, paused: false })
    if (import.meta.env.DEV) {
      const w = window as unknown as Record<string, unknown>
      w.__thief = () => {
        const t = this.thief
        const c = t.centre
        const p = this.input.activePointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2
        return { mouse: { x: p.x / S, y: p.y / S, px: this.input.activePointer.x, py: this.input.activePointer.y }, aimEnd: t.aim ? { x: t.aim.end.x / S, y: t.aim.end.y / S } : null, trace: t.trace.slice(-8), x: c.x / S, y: c.y / S, mode: t.mode, state: t.state, charges: t.charges, grip: t.grip, facing: t.facing, sneaking: t.sneaking, climb: t.climb?.mode ?? null, light: t.light }
      }
      w.__loop = () => ({ fps: this.game.loop.actualFps, delta: this.game.loop.delta, raw: this.game.loop.rawDelta, physicsSteps: this.physics.world.stepsLastFrame })
      w.__guards = () => this.guards.map((g) => ({ x: g.centre.x / S, state: g.state, facing: g.facing, suspicion: g.suspicion, pieces: g.pieceCount, rim: this.combat.rimFor(g) }))
      w.__combat = () => this.combat.status
      w.__test = {
        /** Stand him with his feet at (x, y), in units of S. */
        placeThief: (x: number, y: number) => {
          this.combat.reset()
          this.thief.teleport({ x: x * S - 0.4 * S, y: y * S - 1.31 * S, w: 0.8 * S, h: 1.31 * S })
          this.thief.body.setVelocity(0, 0)
          this.snapCamera()
        },
        /** Keep a guard calm and facing one way, so tests can get behind it. */
        holdGuard: (i: number, facing: 1 | -1) => {
          const g = this.guards[i]
          g.reset()
          g.facing = facing
          ;(g as unknown as { turnTimer: number }).turnTimer = 1e9
        },
      }
      w.__worldToCss = (x: number, y: number) => {
        const v = this.cameras.main.worldView
        const z = this.cameras.main.zoom / this.dpr
        return { x: (x * S - v.x) * z, y: (y * S - v.y) * z }
      }
    }
  }

  /** Puts the camera straight onto him, instead of gliding in from wherever it was. */
  private snapCamera() {
    this.lookX = -this.thief.facing * 0.8 * S
    const cam = this.cameras.main
    cam.setFollowOffset(this.lookX, 1.0 * S)
    cam.centerOn(this.thief.centre.x - this.lookX, this.thief.centre.y - 1.0 * S)
  }

  private applyZoom() {
    const minCss = Math.min(this.scale.width, this.scale.height) / this.dpr
    const zoom = (this.dpr * screenS(minCss)) / S
    this.cameras.main.setZoom(zoom)
    this.thief?.setZoom(zoom)
    for (const g of this.guards) g.setZoom(zoom)
  }

  private setPaused(on: boolean) {
    this.paused = on
    if (on) this.physics.pause()
    else this.physics.resume()
    hud.set({ paused: on })
  }

  private cssToWorld = (x: number, y: number): Vec => {
    const p = this.cameras.main.getWorldPoint(x * this.dpr, y * this.dpr)
    return { x: p.x, y: p.y }
  }

  update(_time: number, deltaMs: number) {
    const dt = Math.min(deltaMs / 1000, 0.1)
    let intent = this.controls.read(this.cssToWorld)
    if (intent.pausePressed) this.setPaused(!this.paused)
    if (intent.debugPressed) hud.set({ showDebug: !hud.get().showDebug })
    if (this.paused) return
    // Hit-stop: a tiny freeze when a blow lands (guide §7.3). Presses made during it still count.
    if (this.hitStop > 0) {
      this.hitStop -= dt
      for (const k of PRESSES) if (intent[k]) this.carried[k] = true
      if (intent.blinkReleased) this.carried = { ...this.carried, blinkReleased: true, aim: intent.aim }
      if (this.hitStop <= 0) this.physics.resume()
      return
    }
    if (Object.keys(this.carried).length) {
      intent = { ...intent, ...this.carried }
      this.carried = {}
    }

    const t = this.thief
    const moveIntent = this.combat.before(dt, intent)
    t.update(dt, moveIntent)
    const him = { centre: t.centre, feetY: t.box.y + t.box.h, light: t.light, hidden: t.mode === 'blink' }
    for (const g of this.guards) {
      const strike = g.update(dt, him, TEST_ROOM.solids)
      if (strike) this.combat.strike(g, strike)
      g.render(this.combat.rimFor(g))
    }
    this.combat.after(dt)

    // Stand-in checkpoints refill blink charges (History #33).
    for (const c of TEST_ROOM.checkpoints) {
      const box = t.box
      if (t.mode !== 'blink' && Math.abs(box.x + box.w / 2 - c.x) < 0.5 * S && Math.abs(box.y + box.h - c.y) < 0.2 * S && t.refill()) {
        this.rings.push({ x: c.x, y: c.y - 0.8 * S, radius: 1.6 * S, age: 0, life: 0.6, color: POWER, alpha: 0.9 })
      }
    }

    // Look ahead the way he's facing, and keep a little more room above him than below.
    this.lookX += (-t.facing * 0.8 * S - this.lookX) * Math.min(1, dt * 3)
    this.cameras.main.setFollowOffset(this.lookX, 1.0 * S)

    const v = this.cameras.main.worldView
    const pad = 2 * S
    this.darkness.update(new Phaser.Geom.Rectangle(v.x - pad, v.y - pad, v.width + pad * 2, v.height + pad * 2), TEST_ROOM.lamps, t.centre)

    this.dashOffset += dt * 30
    this.drawEffects(dt)
    this.drawStatus()
    this.combat.draw(dt, this.px)

    hud.set({ charges: t.charges, sneaking: t.sneaking, holding: t.mode === 'climb', aiming: !!t.aim })
    this.updateDebug(dt)
  }

  private dashed(g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number, dash: number, gap: number, offset = 0) {
    const len = Math.hypot(x2 - x1, y2 - y1)
    if (len < 1) return
    const ux = (x2 - x1) / len
    const uy = (y2 - y1) / len
    for (let d = -(offset % (dash + gap)); d < len; d += dash + gap) {
      const a = Math.max(0, d)
      const b = Math.min(len, d + dash)
      if (b > a) g.lineBetween(x1 + ux * a, y1 + uy * a, x1 + ux * b, y1 + uy * b)
    }
  }

  private drawEffects(dt: number) {
    const g = this.fx
    const px = this.px
    g.clear()
    for (const r of this.rings) r.age += dt
    this.rings = this.rings.filter((r) => r.age < r.life)
    for (const r of this.rings) {
      const q = r.age / r.life
      const radius = r.radius * (0.25 + 0.75 * (1 - Math.pow(1 - q, 3)))
      g.lineStyle(2.5 * px, r.color, r.alpha * (1 - q))
      g.strokeEllipse(r.x, r.y, radius * 2, radius * 1.2)
    }

    // Sight cones, while testing (History #85): the strong part is how far they see in the dark,
    // the faint part how far in light.
    if (hud.get().showCones) {
      for (const gd of this.guards) {
        if (gd.down || gd.open) continue
        const col = gd.state === 'alert' ? 0xff7a3d : gd.state === 'sus' || gd.state === 'return' ? 0xffb347 : 0xe6eaef
        const e = gd.eye
        const cone = (r: number, a: number) => {
          const pts = [new Phaser.Math.Vector2(e.x, e.y)]
          for (let i = 0; i <= 8; i++) {
            const ang = -SIGHT_CFG.halfAngle + (2 * SIGHT_CFG.halfAngle * i) / 8
            pts.push(new Phaser.Math.Vector2(e.x + gd.facing * Math.cos(ang) * r, e.y + Math.sin(ang) * r))
          }
          g.fillStyle(col, a)
          g.fillPoints(pts, true)
        }
        cone(SIGHT_CFG.lightRange, gd.state === 'calm' ? 0.014 : 0.03)
        cone(SIGHT_CFG.darkRange, gd.state === 'calm' ? 0.04 : 0.08)
      }
    }

    const aim = this.thief.aim
    if (!aim) return
    const c = this.thief.centre
    // Range
    g.lineStyle(1.5 * px, POWER, 0.25)
    const steps = 64
    for (let i = 0; i < steps; i += 2) {
      const a0 = (i / steps) * Math.PI * 2
      const a1 = ((i + 1) / steps) * Math.PI * 2
      g.lineBetween(c.x + Math.cos(a0) * BLINK.range, c.y + Math.sin(a0) * BLINK.range, c.x + Math.cos(a1) * BLINK.range, c.y + Math.sin(a1) * BLINK.range)
    }
    // Aim line, to the wall if a thick one cuts it short.
    g.lineStyle(2 * px, POWER, 0.9)
    this.dashed(g, c.x, c.y, aim.end.x, aim.end.y, 6 * px, 6 * px, this.dashOffset * px)
    if (aim.cut) {
      g.lineStyle(3 * px, POWER, 0.9)
      const dx = aim.end.x - c.x
      const dy = aim.end.y - c.y
      const l = Math.hypot(dx, dy) || 1
      g.lineBetween(aim.end.x - (dy / l) * 8 * px, aim.end.y + (dx / l) * 8 * px, aim.end.x + (dy / l) * 8 * px, aim.end.y - (dx / l) * 8 * px)
    }
    // Landing ghost in the pose he'll arrive in.
    const box = aim.box
    const ox = box.x + box.w / 2
    const oy = box.y + box.h - 0.62 * S
    const pose: Pose = aim.mode === 'wall' ? 'wall' : aim.mode === 'ceiling' ? 'ceiling' : 'stand'
    const f = aim.mode === 'wall' ? aim.side : ox >= c.x ? 1 : -1
    g.lineStyle(2 * px, POWER, 0.8)
    const pts = TRAPEZOID.map(([x, y]) => new Phaser.Math.Vector2(ox + f * x * S, oy + y * S))
    g.strokePoints(pts, true)
    g.strokeCircle(ox + f * HEAD.cx * S, oy + HEAD.cy * S, HEAD.r * S)
    for (const [gx, gy] of glovesFor(pose, 0, 0)) g.strokeCircle(ox + f * gx * S, oy + gy * S, 0.17 * S)
  }

  /** The grip bar: under him in the power colour, hidden when full (guide §10). */
  private drawStatus() {
    const g = this.status
    g.clear()
    const t = this.thief
    if (t.grip >= 1 || t.mode === 'blink') return
    const px = this.px
    const o = t.origin
    const w = 1.1 * S
    const h = 5 * px
    const y = o.y + 0.7 * S + 8 * px
    g.fillStyle(0xffffff, 0.12)
    g.fillRoundedRect(o.x - w / 2, y, w, h, h / 2)
    g.fillStyle(POWER, 1)
    if (t.grip > 0.02) g.fillRoundedRect(o.x - w / 2, y, w * t.grip, h, Math.min(h / 2, (w * t.grip) / 2))
  }

  private updateDebug(dt: number) {
    this.frames++
    this.fpsTime += dt
    if (this.fpsTime >= 0.5) {
      this.fps = Math.round(this.frames / this.fpsTime)
      this.frames = 0
      this.fpsTime = 0
    }
    if (!hud.get().showDebug) return
    this.debugTimer += dt
    if (this.debugTimer < 0.1) return
    this.debugTimer = 0
    const t = this.thief
    hud.set({
      debug: {
        light: t.light,
        noise: NOISE_NAMES[t.noise] ?? 'silent',
        grip: t.grip,
        charges: t.charges,
        state: t.mode === 'blink' ? 'blink' : t.state,
        speed: Math.abs(t.body.velocity.x) / S,
        fps: this.fps,
      },
    })
  }
}

