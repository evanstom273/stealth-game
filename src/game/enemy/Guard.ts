import * as Phaser from 'phaser'
import { cpuCanvasTexture } from '../canvasTexture.ts'
import { seesTarget, sightRange } from '../logic/combat.ts'
import type { Rect, Vec } from '../logic/geometry.ts'
import { DEPTH } from '../room/RoomView.ts'
import { GUARD, S, SIGHT_CFG } from '../tuning.ts'
import { drawGuard, type GuardFace, type GuardPose } from './guardArt.ts'

export type GuardState = 'calm' | 'sus' | 'alert' | 'return' | 'stagger' | 'stunned' | 'ko' | 'dead'

/** What the guard knows about him this frame. */
export interface Sighting {
  centre: Vec
  feetY: number
  light: number
  /** Mid-blink: he isn't anywhere to be seen. */
  hidden: boolean
}

const W = 4 * S
const H = 3 * S
const OX = 2 * S
const OY = 1.7 * S
const MARKER = { sus: 0xffb347, alert: 0xff7a3d }

/**
 * The test guard (History #85): stands at its post turning left and right, notices him with a
 * cone that reaches further the more lit he is, fills its "?" to "!", then comes over and punches.
 * It can be hit, staggered, stunned by a blink, knocked out or killed, and comes back after a while.
 */
export class Guard {
  readonly zone: Phaser.GameObjects.Zone
  readonly body: Phaser.Physics.Arcade.Body
  private image: Phaser.GameObjects.Image
  private tex!: Phaser.Textures.CanvasTexture
  private res = 0
  private badge: Phaser.GameObjects.Graphics
  private glyph: Phaser.GameObjects.Text
  private scene: Phaser.Scene
  private key: string

  readonly home: Vec
  facing: 1 | -1
  state: GuardState = 'calm'
  suspicion = 0
  sees = false
  private turnTimer = GUARD.turnEvery
  private lostTimer = 0
  private lastSeen: Vec | null = null
  private attack: 'none' | 'windup' | 'strike' | 'recover' = 'none'
  private attackT = 0
  private cooldown = 0
  private flinchT = 0
  private stateT = 0
  private walk = 0
  private time = 0

  constructor(scene: Phaser.Scene, home: Vec, facing: 1 | -1, index: number) {
    this.scene = scene
    this.home = home
    this.facing = facing
    this.key = `guard-${index}`
    this.zone = scene.add.zone(home.x, home.y - GUARD.h / 2, GUARD.w, GUARD.h)
    scene.physics.add.existing(this.zone)
    this.body = this.zone.body as Phaser.Physics.Arcade.Body
    this.image = scene.add.image(0, 0, '__DEFAULT').setDepth(DEPTH.thief - 0.5)
    this.badge = scene.add.graphics().setDepth(DEPTH.status)
    this.glyph = scene.add
      .text(0, 0, '', { fontFamily: 'Outfit, ui-sans-serif, system-ui, sans-serif', fontSize: '20px', fontStyle: '900', color: '#ffffff' })
      .setOrigin(0.5, 0.55)
      .setDepth(DEPTH.status + 0.1)
      .setResolution(3)
  }

  get box(): Rect {
    return { x: this.body.position.x, y: this.body.position.y, w: this.body.width, h: this.body.height }
  }
  get centre(): Vec {
    return { x: this.body.center.x, y: this.body.center.y }
  }
  get eye(): Vec {
    return { x: this.body.center.x + this.facing * 0.1 * S, y: this.body.position.y + GUARD.eyeFromTop }
  }
  get unaware() {
    return this.state === 'calm' || this.state === 'sus' || this.state === 'return'
  }
  get open() {
    return this.state === 'stagger' || this.state === 'stunned'
  }
  get down() {
    return this.state === 'ko' || this.state === 'dead'
  }
  get alerted() {
    return this.state === 'alert'
  }
  /** How far it can currently see him, for drawing its cone. */
  range(light: number) {
    return sightRange(light, SIGHT_CFG)
  }

  setZoom(zoom: number) {
    const res = Math.max(1, Math.min(3, Math.ceil(zoom)))
    if (res === this.res) return
    this.res = res
    this.tex = cpuCanvasTexture(this.scene, this.key, Math.ceil(W * res), Math.ceil(H * res))
    this.image.setTexture(this.key)
    this.image.setOrigin(OX / W, OY / H)
  }

  private alert(at: Vec) {
    this.state = 'alert'
    this.suspicion = 1
    this.lastSeen = { ...at }
    this.lostTimer = 0
  }

  /** Struck by one of his blows. The shove at the end of a combo staggers it. */
  hurt(kind: 'hit' | 'shove', dir: number, from: Vec) {
    if (this.down) return
    this.attack = 'none'
    this.cooldown = 0.3
    this.alert(from)
    this.facing = dir > 0 ? -1 : 1
    if (kind === 'shove') {
      this.state = 'stagger'
      this.stateT = GUARD.stagger
      this.body.setVelocityX(dir * 3 * S)
    } else {
      this.flinchT = GUARD.flinch
      this.body.setVelocityX(dir * 1.5 * S)
    }
  }

  /** He's just blinked onto it: dazed for a moment, open to a takedown. */
  stun() {
    if (this.down) return
    this.attack = 'none'
    this.state = 'stunned'
    this.stateT = GUARD.blinkStun
    this.body.setVelocityX(0)
  }

  takedown(lethal: boolean) {
    this.attack = 'none'
    this.state = lethal ? 'dead' : 'ko'
    this.stateT = GUARD.downFor
    this.suspicion = 0
    this.body.setVelocityX(0)
  }

  reset() {
    this.state = 'calm'
    this.suspicion = 0
    this.attack = 'none'
    this.lastSeen = null
    this.turnTimer = GUARD.turnEvery
    this.body.reset(this.home.x, this.home.y - GUARD.h / 2)
  }

  /** One frame of thinking. Returns its punch's reach when a punch lands this frame. */
  update(dt: number, him: Sighting, solids: readonly Rect[]): Rect | null {
    this.time += dt
    this.cooldown = Math.max(0, this.cooldown - dt)
    const body = this.body
    let strike: Rect | null = null

    if (this.down) {
      body.setVelocityX(0)
      this.stateT -= dt
      if (this.stateT <= 0) {
        if (this.state === 'dead') this.reset()
        else {
          this.state = 'return'
          this.suspicion = 0.3
        }
      }
      this.sees = false
      return null
    }
    if (this.open) {
      body.setVelocityX(body.velocity.x * Math.exp(-6 * dt))
      this.stateT -= dt
      if (this.stateT <= 0) this.alert(him.centre)
      this.sees = false
      return null
    }
    if (this.flinchT > 0) {
      this.flinchT -= dt
      body.setVelocityX(body.velocity.x * Math.exp(-10 * dt))
      return null
    }

    const tracking = this.state === 'alert'
    this.sees = !him.hidden && seesTarget(this.eye, this.facing, tracking, him.centre, him.light, solids, SIGHT_CFG)
    const toward = (x: number): 1 | -1 => (x >= this.centre.x ? 1 : -1)
    let vx = 0

    switch (this.state) {
      case 'calm':
        this.turnTimer -= dt
        if (this.turnTimer <= 0) {
          this.facing = (-this.facing) as 1 | -1
          this.turnTimer = GUARD.turnEvery
        }
        if (this.sees) this.state = 'sus'
        break
      case 'return':
      case 'sus': {
        if (this.sees) {
          const d = Math.hypot(him.centre.x - this.eye.x, him.centre.y - this.eye.y)
          const close = 1 - Math.min(1, d / this.range(him.light))
          this.suspicion += (GUARD.suspicionRate + GUARD.suspicionCloseBonus * close) * dt
          this.facing = toward(him.centre.x)
          this.lastSeen = { ...him.centre }
          this.state = 'sus'
          if (this.suspicion >= 1) this.alert(him.centre)
        } else {
          this.suspicion -= GUARD.suspicionDecay * dt
          if (this.state === 'return') {
            const dx = this.home.x - this.centre.x
            if (Math.abs(dx) > 4) {
              vx = Math.sign(dx) * GUARD.returnSpeed
              this.facing = dx > 0 ? 1 : -1
            } else {
              this.state = 'calm'
              this.turnTimer = GUARD.turnEvery
            }
            this.suspicion = Math.max(0, this.suspicion)
          } else if (this.suspicion <= 0) {
            this.suspicion = 0
            this.state = 'calm'
            this.turnTimer = GUARD.turnEvery
          }
        }
        break
      }
      case 'alert': {
        if (this.sees) {
          this.lastSeen = { ...him.centre }
          this.lostTimer = 0
        } else this.lostTimer += dt
        if (this.lostTimer > GUARD.giveUpAfter) {
          this.state = 'return'
          this.suspicion = 0.5
          this.attack = 'none'
          break
        }
        const target = this.lastSeen ?? him.centre
        const dx = target.x - this.centre.x
        const sameLevel = Math.abs(him.feetY - (this.box.y + this.box.h)) < 1.2 * S
        if (this.attack === 'none') {
          this.facing = toward(target.x)
          if (Math.abs(dx) > GUARD.attackReach) vx = Math.sign(dx) * GUARD.chaseSpeed
          else if (this.sees && sameLevel && this.cooldown <= 0) {
            this.attack = 'windup'
            this.attackT = 0
          }
        }
        break
      }
    }

    // The punch: a wind-up you can read, a quick strike, then a recovery.
    if (this.attack !== 'none') {
      vx = 0
      this.attackT += dt
      if (this.attack === 'windup' && this.attackT >= GUARD.windup) {
        this.attack = 'strike'
        this.attackT = 0
        const reach = GUARD.attackReach + 0.2 * S
        const b = this.box
        strike = { x: this.facing > 0 ? b.x + b.w / 2 : b.x + b.w / 2 - reach, y: b.y, w: reach, h: b.h }
      } else if (this.attack === 'strike' && this.attackT >= GUARD.strike) {
        this.attack = 'recover'
        this.attackT = 0
      } else if (this.attack === 'recover' && this.attackT >= GUARD.recover) {
        this.attack = 'none'
        this.cooldown = GUARD.cooldown
      }
    }

    body.setVelocityX(vx)
    if (vx !== 0) this.walk += dt * 9
    return strike
  }

  render() {
    if (!this.tex) return
    const pose: GuardPose = this.down
      ? 'down'
      : this.open
        ? 'stagger'
        : this.flinchT > 0
          ? 'flinch'
          : this.attack === 'windup'
            ? 'windup'
            : this.attack === 'strike' || (this.attack === 'recover' && this.attackT < 0.15)
              ? 'punch'
              : Math.abs(this.body.velocity.x) > 5
                ? 'walk'
                : 'stand'
    const face: GuardFace = this.open ? 'dizzy' : this.state === 'alert' ? 'alert' : this.state === 'sus' || this.state === 'return' ? 'sus' : 'calm'
    const ctx = this.tex.context
    const r = this.res
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.tex.width, this.tex.height)
    const k = GUARD.scale * S * r
    ctx.setTransform(k, 0, 0, k, OX * r, OY * r)
    drawGuard(ctx, { face, pose, time: this.time, walk: this.walk, grey: this.state === 'dead' })
    this.tex.refresh()

    const b = this.box
    const ox = b.x + b.w / 2
    const oy = b.y + GUARD.originFromTop
    this.image.setPosition(ox, oy)
    this.image.setScale(1 / r)
    this.image.setFlipX(this.facing < 0)
    this.image.setAlpha(this.state === 'dead' ? 0.85 : 1)

    // The suspicion marker: a "?" that fills, turning to "!" (History #66).
    const g = this.badge
    g.clear()
    const showSus = (this.state === 'sus' || this.state === 'return') && this.suspicion > 0.01
    const showAlert = this.state === 'alert'
    this.glyph.setVisible(showSus || showAlert)
    if (!showSus && !showAlert) return
    const mx = ox
    const my = b.y - 0.55 * S
    const rad = 0.25 * S
    if (showAlert) {
      g.fillStyle(MARKER.alert, 1)
      g.fillCircle(mx, my, rad)
      g.lineStyle(2, 0x12161b, 1)
      g.strokeCircle(mx, my, rad)
      this.glyph.setText('!').setColor('#12161b')
    } else {
      g.fillStyle(0x1a1d22, 0.9)
      g.fillCircle(mx, my, rad)
      // Fill from the bottom up with how suspicious it is.
      const level = my + rad - 2 * rad * Math.min(1, this.suspicion)
      const pts: Phaser.Math.Vector2[] = []
      const steps = 24
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2
        const px = mx + Math.cos(a) * rad
        const py = my + Math.sin(a) * rad
        pts.push(new Phaser.Math.Vector2(px, Math.max(py, level)))
      }
      g.fillStyle(MARKER.sus, 0.6)
      g.fillPoints(pts, true)
      g.lineStyle(2.5, MARKER.sus, 1)
      g.strokeCircle(mx, my, rad)
      this.glyph.setText('?').setColor('#ffffff')
    }
    this.glyph.setPosition(mx, my)
    this.glyph.setFontSize(Math.round(rad * 1.3))
  }
}
