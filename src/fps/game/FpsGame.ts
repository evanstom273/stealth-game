import * as THREE from 'three'
import { commands, hud } from '../../game/bridge.ts'
import type { AttackGlyph } from '../../game/input/device.ts'
import { NOISE_NAMES } from '../../game/logic/noise.ts'
import { viewFrom } from '../art/views.ts'
import { TEST_WING } from '../level/testWing.ts'
import type { Level, V3 } from '../level/level.ts'
import { forward } from '../logic/climb.ts'
import { lightAt } from '../logic/rules.ts'
import { buildLevelView, type LevelView } from '../render/levelMesh.ts'
import { drawBlinkMap, drawCentre, Gloves, mapScale, mapToScreen, screenToMap } from '../render/hud.ts'
import { GuardSprite, Particles, shadowTexture } from '../render/sprites.ts'
import { BLINK, LEAN, LOOK } from '../tuning.ts'
import { Combat } from './Combat.ts'
import { Controls, type Intent } from './Controls.ts'
import { Guard } from './Guard.ts'
import { Player } from './Player.ts'

/** One-frame presses, which mustn't be lost while the game is frozen for a hit-stop. */
const PRESSES = ['jumpPressed', 'crouchPressed', 'grabPressed', 'attackPressed', 'attackReleased', 'dodgePressed', 'blinkPressed', 'selectPressed', 'backPressed'] as const

/**
 * The first-person game (History #92): Three.js inside the React shell, with our own loop.
 * Owns the scene, the level, the thief, the guards, combat, the controls and the HUD drawn over it.
 */
/** How to pick a spot and close the blink view, for each kind of controls. */
const BLINK_HINT: Record<AttackGlyph, string> = {
  key: 'Click where to blink · right-click to close',
  mouse: 'Click where to blink · right-click to close',
  pad: 'A to blink · B or LT to close',
  touch: 'Tap where to go · Blink to close',
}

export class FpsGame {
  private L: Level = TEST_WING
  private root: HTMLElement
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private levelView: LevelView
  private hudCanvas: HTMLCanvasElement
  private hud: CanvasRenderingContext2D
  private gloves = new Gloves()
  private particles: Particles
  private player: Player
  private guards: Guard[]
  private sprites: GuardSprite[]
  private combat: Combat
  private controls: Controls
  private observer: ResizeObserver
  private stopCommands: () => void
  private raf = 0
  private last = performance.now()
  private w = 1
  private h = 1
  private dpr = 1
  private paused = false
  private hitStop = 0
  private shake = 0
  private carried: Partial<Intent> = {}
  private cpFlash = 0
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  private frames = 0
  private fpsTime = 0
  private fps = 60
  private debugT = 0

  constructor(root: HTMLElement) {
    this.root = root
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'
    root.appendChild(this.renderer.domElement)
    this.hudCanvas = document.createElement('canvas')
    this.hudCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none'
    root.appendChild(this.hudCanvas)
    this.hud = this.hudCanvas.getContext('2d')!

    this.scene.background = new THREE.Color(0x07080c)
    this.scene.fog = new THREE.Fog(0x07080c, 5, 24)
    this.scene.add(new THREE.AmbientLight(0x8a98a8, 0.22))
    this.camera = new THREE.PerspectiveCamera(LOOK.fov, 1, 0.05, 80)
    this.camera.rotation.order = 'YXZ'
    this.levelView = buildLevelView(this.L)
    this.scene.add(this.levelView.group)
    this.particles = new Particles(this.scene)

    this.player = new Player(this.L)
    // A click or tap on the blink view: the spot under it (History #109).
    this.player.fromScreen = (x, y) => screenToMap(this.L, this.w, this.h, this.player.blink?.from ?? this.player.pos, x, y)
    const noGuards = new URLSearchParams(window.location.search).get('guards') === '0'
    this.guards = noGuards ? [] : this.L.guards.map((s) => new Guard(this.L, s))
    const shadow = shadowTexture()
    this.sprites = this.guards.map(() => new GuardSprite(this.scene, shadow))
    this.combat = new Combat(this.L, this.player, this.guards, {
      hitStop: (s) => { this.hitStop = Math.max(this.hitStop, s) },
      shake: (a) => { if (!this.reducedMotion) this.shake = Math.max(this.shake, a) },
      noise: () => {},
      sparks: (at, color, n) => this.particles.burst(at.x, at.y, at.z, color, n, 3, 0.4, 6, 0.3),
      flipOf: (g) => this.flipFor(g),
    })
    this.player.onDust = (at, h) => this.particles.dust(at.x, at.y, at.z, h)

    this.controls = new Controls(root)
    this.controls.onLockLost = () => { if (!this.paused) this.setPaused(true) }
    this.stopCommands = commands.listen((c) => {
      if (c === 'pause') this.setPaused(true)
      if (c === 'resume') { this.setPaused(false); this.controls.lock() }
      if (c === 'restart') {
        this.combat.reset()
        this.player.reset()
        for (const g of this.guards) g.reset()
        this.setPaused(false)
        this.controls.lock()
      }
    })

    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(root)
    this.resize()
    hud.set({ charges: this.player.charges, maxCharges: BLINK.charges, paused: false })
    if (import.meta.env.DEV) this.devHooks()
    this.raf = requestAnimationFrame(this.frame)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.observer.disconnect()
    this.stopCommands()
    this.controls.destroy()
    this.levelView.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
    this.hudCanvas.remove()
  }

  private resize() {
    const r = this.root.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) return
    this.w = r.width; this.h = r.height
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    this.renderer.setPixelRatio(this.dpr)
    this.renderer.setSize(this.w, this.h, false)
    this.camera.aspect = this.w / this.h
    this.camera.updateProjectionMatrix()
    this.hudCanvas.width = Math.round(this.w * this.dpr)
    this.hudCanvas.height = Math.round(this.h * this.dpr)
    this.levelView.setResolution(this.w * this.dpr, this.h * this.dpr)
  }

  private setPaused(on: boolean) {
    this.paused = on
    if (on) this.controls.unlock()
    hud.set({ paused: on })
  }

  /** Which way a guard's drawing is turned on screen: +1 facing right, -1 left. */
  private flipFor(g: Guard) {
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion)
    return g.fx * right.x + g.fz * right.z >= 0 ? 1 : -1
  }

  private frame = (now: number) => {
    // The first frame's timestamp can come before the game was made: never let time run backwards.
    const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000))
    this.last = Math.max(this.last, now)
    let intent = this.controls.read(dt)
    if (intent.pausePressed) this.setPaused(!this.paused)
    if (intent.debugPressed) hud.set({ showDebug: !hud.get().showDebug })
    if (!this.paused) {
      if (this.hitStop > 0) {
        // Hit-stop: a tiny freeze when a blow lands. Presses made during it still count.
        this.hitStop -= dt
        for (const k of PRESSES) if (intent[k]) this.carried[k] = true
        if (intent.attackPresses) this.carried.attackPresses = (this.carried.attackPresses ?? 0) + intent.attackPresses
        if (intent.aim.kind === 'point') this.carried.aim = intent.aim
      } else {
        if (Object.keys(this.carried).length) {
          intent = { ...intent, ...this.carried, attackPresses: intent.attackPresses + (this.carried.attackPresses ?? 0) }
          this.carried = {}
        }
        this.step(dt, intent)
      }
    }
    this.draw(dt, now)
    this.raf = requestAnimationFrame(this.frame)
  }

  private step(dt: number, intent: Intent) {
    const p = this.player
    const moveIntent = this.combat.before(dt, intent)
    p.update(dt, moveIntent, mapScale(this.w, this.h))
    const wdt = dt * p.timeScale
    const b = p.body
    const him = { chest: { x: b.x, y: b.y + b.h * 0.7, z: b.z }, feetY: b.y, light: p.light, hidden: !!p.blink && p.blink.phase === 'travel' }
    for (const g of this.guards) {
      if (g.update(wdt, him)) this.combat.strike(g)
      g.light = lightAt(this.L, g.x, g.z)
    }
    this.combat.after(dt)
    // Stand-in checkpoints refill blink charges (History #33).
    if (p.mode === 'ground') for (const cp of this.L.checkpoints) {
      if (Math.hypot(b.x - cp.x, b.z - cp.z) < 0.6 && p.refill()) this.cpFlash = 1
    }
    this.particles.update(wdt)
    this.shake = Math.max(0, this.shake - dt * 3)
    this.cpFlash = Math.max(0, this.cpFlash - dt * 2)
    hud.set({ charges: p.charges, sneaking: p.crouchOn || p.posture !== 'stand', holding: p.climbing, aiming: !!p.blink })
    this.updateDebug(dt)
  }

  private placeCamera() {
    const p = this.player, b = p.body
    const [fx, fz] = forward(p.yaw)
    const rx = -fz, rz = fx
    const lean = p.leanAmount
    const bob = this.reducedMotion ? 0 : Math.abs(Math.sin(p.walk)) * LOOK.bob * p.moveAmt
    let x = b.x + rx * lean * LEAN.offset + fx * this.combat.lunge
    let y = b.y + p.eye + bob - this.combat.dip * 0.12
    let z = b.z + rz * lean * LEAN.offset + fz * this.combat.lunge
    let pitch = p.pitch
    // Into and out of the blink view: the camera lifts up out of his head and looks down.
    const lift = p.lift
    if (lift > 0) {
      y += lift * 9
      pitch += (-Math.PI / 2 + 0.01 - pitch) * lift
    }
    if (this.shake > 0) {
      x += (Math.random() - 0.5) * this.shake * 0.06
      y += (Math.random() - 0.5) * this.shake * 0.06
    }
    this.camera.position.set(x, y, z)
    this.camera.rotation.set(pitch, p.yaw, -lean * LEAN.roll)
    this.camera.updateMatrixWorld()
  }

  private draw(dt: number, now: number) {
    this.placeCamera()
    const cam = this.camera.position
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion)
    this.guards.forEach((g, i) => {
      const s = this.sprites[i]
      g.view = g.down ? 'side' : viewFrom(g.fx, g.fz, cam.x - g.x, cam.z - g.z, g.view)
      const flip = g.fx * right.x + g.fz * right.z >= 0 ? 1 : -1
      const rim = this.combat.rimFor(g)
      const badge = this.combat.badgeFor(g)
      s.place(g.x, g.y, g.z, cam.x, cam.z, g.state !== 'dead')
      s.paint({
        view: g.view,
        flip,
        face: g.faceLook,
        pose: g.pose,
        time: g.time,
        walk: g.walk,
        light: g.light,
        rim: rim ? (rim === 'kill' ? '#ff7a3d' : '#8fd3ff') : null,
        marker: g.state === 'alert' ? { kind: 'alert', level: 1 } : (g.state === 'sus' || g.state === 'return') && g.suspicion > 0.01 ? { kind: 'sus', level: g.suspicion } : null,
        zs: g.state === 'ko' ? 8 - g.stateT : null,
        shatter: g.shatter,
        badge: badge ? { ...badge, glyph: this.combat.glyph } : null,
        hidden: g.state === 'dead',
      })
    })
    this.renderer.render(this.scene, this.camera)

    // The HUD over it: the blink view, his gloves, the aim dot and meters.
    const g = this.hud, w = this.w, h = this.h
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    g.clearRect(0, 0, w, h)
    const p = this.player
    const mapA = p.mapAlpha
    if (mapA > 0) {
      const bl = p.blink!
      drawBlinkMap(g, w, h, {
        level: this.L,
        x: bl.from.x, y: bl.from.y, z: bl.from.z,
        showHim: bl.phase !== 'travel' && !(bl.phase === 'exit' && !bl.cancelled),
        aim: bl.phase === 'enter' || bl.phase === 'aim' ? { x: bl.ax, z: bl.az } : null,
        landing: bl.landing,
        litAtLanding: bl.landing ? lightAt(this.L, bl.landing.x, bl.landing.z) : 1,
        guards: this.guards.map((gd) => ({ x: gd.x, y: gd.y, z: gd.z, fx: gd.fx, fz: gd.fz, face: gd.faceLook, pose: gd.pose, time: gd.time, walk: gd.walk, hidden: gd.state === 'dead' })),
        alpha: mapA,
        time: now / 1000,
        hint: BLINK_HINT[this.combat.glyph],
      })
    }
    const gl = this.combat.gloves
    const pose = gl.pose ?? (p.mode === 'wall' ? 'wall' : p.mode === 'ceiling' ? 'ceiling' : p.mode === 'mantle' ? 'mantle' : 'idle')
    this.gloves.draw(g, { pose, t: gl.t, walk: p.walk, moveAmt: p.moveAmt, crouch: p.posture !== 'stand', light: p.light, climbPhase: p.climbPhase, hidden: mapA }, w, h, dt)
    drawCentre(g, w, h, p.light, p.grip, p.climbing || p.grip < 0.999, 1 - mapA)
    if (p.flash > 0) { g.fillStyle = `rgba(255,255,255,${(p.flash * 0.35).toFixed(3)})`; g.fillRect(0, 0, w, h) }
    if (this.cpFlash > 0) {
      const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7)
      vg.addColorStop(0, 'rgba(143,211,255,0)'); vg.addColorStop(1, `rgba(143,211,255,${(this.cpFlash * 0.35).toFixed(3)})`)
      g.fillStyle = vg; g.fillRect(0, 0, w, h)
    }
  }

  private updateDebug(dt: number) {
    this.frames++
    this.fpsTime += dt
    if (this.fpsTime >= 0.5) { this.fps = Math.round(this.frames / this.fpsTime); this.frames = 0; this.fpsTime = 0 }
    if (!hud.get().showDebug) return
    this.debugT += dt
    if (this.debugT < 0.1) return
    this.debugT = 0
    const p = this.player
    hud.set({ debug: { light: p.light, noise: NOISE_NAMES[p.noise] ?? 'silent', grip: p.grip, charges: p.charges, state: p.blink ? 'blink' : `${p.mode} · ${p.state}`, speed: Math.hypot(p.body.vx, p.body.vz), fps: this.fps } })
  }

  private devHooks() {
    const w = window as unknown as Record<string, unknown>
    const p = this.player
    w.__fps = {
      state: () => ({
        x: p.body.x, y: p.body.y, z: p.body.z, yaw: p.yaw, pitch: p.pitch, mode: p.mode, posture: p.posture, crouch: p.crouchOn, sliding: p.sliding,
        grip: p.grip, charges: p.charges, light: p.light, lean: p.leanAmount, eye: p.eye, blink: p.blink?.phase ?? null,
        landing: p.blink?.landing ?? null, state: p.state, trace: p.trace.slice(-8), paused: this.paused,
        speed: Math.hypot(p.body.vx, p.body.vz), hits: p.hits,
      }),
      guards: () => this.guards.map((g) => ({ x: g.x, y: g.y, z: g.z, state: g.state, suspicion: g.suspicion, fx: g.fx, fz: g.fz, view: g.view, pieces: g.shatter?.pieces.length ?? 0, rim: this.combat.rimFor(g) })),
      combat: () => this.combat.status,
      place: (x: number, y: number, z: number, yaw?: number, pitch?: number) => { this.combat.reset(); p.place(x, y, z, yaw, pitch) },
      look: (yaw: number, pitch: number) => { p.yaw = yaw; p.pitch = pitch },
      holdGuard: (i: number, fx: number, fz: number) => this.guards[i].holdStill(fx, fz),
      freezeGuard: (i: number, fx: number, fz: number) => { this.guards[i].holdStill(fx, fz); this.guards[i].frozen = true },
      aimBlink: (x: number, z: number) => p.aimAt(x, z),
      /** Where a spot on the ground shows in the open blink view, in CSS pixels over the game. */
      mapPoint: (x: number, y: number, z: number) => (p.blink ? mapToScreen(this.w, this.h, p.blink.from, x, y, z) : null),
    }
  }
}

export type { V3 }
