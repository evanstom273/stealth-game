import { touch, wantsTouchControls } from '../../game/bridge.ts'
import { attackGlyph, startDevice, trackDevice, type AttackGlyph, type DeviceState } from '../../game/input/device.ts'
import { LOOK } from '../tuning.ts'

/** What the player wants this frame, from keyboard and mouse, gamepad or touch. */
export interface Intent {
  /** Strafe (right +) and forward (+), each -1..1. */
  moveX: number
  moveZ: number
  run: boolean
  /** Turning, in radians. */
  dyaw: number
  dpitch: number
  jumpPressed: boolean
  jumpHeld: boolean
  /** Crouch toggles (sneak, History #100). */
  crouchPressed: boolean
  grabPressed: boolean
  attackPressed: boolean
  /** How many times Attack was pressed since the last frame. */
  attackPresses: number
  attackHeld: boolean
  attackReleased: boolean
  dodgePressed: boolean
  /** -1 left to 1 right. */
  lean: number
  /** Blink opens and closes the top-down view (History #109). */
  blinkPressed: boolean
  /** Picks the spot in the blink view: a click, a tap, or A. */
  selectPressed: boolean
  /** Closes the blink view without blinking: B on a gamepad. */
  backPressed: boolean
  /**
   * Where to aim in the blink view: mouse movement in pixels (mouse captured), a stick's direction,
   * or a point over the view in CSS pixels (the mouse when it isn't captured, or a tap).
   */
  aim: { kind: 'none' | 'delta' | 'stick' | 'point'; x: number; y: number }
  pausePressed: boolean
  debugPressed: boolean
  attackGlyph: AttackGlyph
}

const DEAD = 0.18
const STICK_RUN = 0.92

/**
 * Keyboard and mouse (the mouse is captured for looking once you click the view), gamepad, and the
 * touch controls. Presses are counted from events, so none are lost however short or slow a frame.
 */
export class Controls {
  private held = new Set<string>()
  /** Keys pressed since the last read, counted, so two quick taps in one slow frame are both kept. */
  private downs = new Map<string, number>()
  private ups = new Set<string>()
  private mouseDX = 0
  private mouseDY = 0
  /** Left-button presses with the mouse captured: attacks, and picks in the blink view. */
  private leftPresses = 0
  /** Left-button presses without it captured: only ever picks in the blink view. */
  private loosePicks = 0
  private leftReleases = 0
  private leftHeld = false
  private rightPresses = 0
  /** The pointer over the view when the mouse isn't captured, in CSS pixels. */
  private pointer: { x: number; y: number } | null = null
  private pointerMoved = false
  private padPrev: Record<string, boolean> = {}
  private device: DeviceState = startDevice(wantsTouchControls())
  private keySeen = false
  private mouseSeen = false
  private wasLocked = false
  private target: HTMLElement
  private cleanup: (() => void)[] = []
  /** Called when the mouse is let go by the browser (Esc) while playing. */
  onLockLost: (() => void) | null = null

  constructor(target: HTMLElement) {
    this.target = target
    const on = <E extends Event>(t: EventTarget, type: string, fn: (e: E) => void) => {
      const h = fn as unknown as EventListener
      t.addEventListener(type, h)
      this.cleanup.push(() => t.removeEventListener(type, h))
    }
    const locked = () => document.pointerLockElement === this.target
    const local = (e: MouseEvent) => {
      const r = this.target.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    on<KeyboardEvent>(window, 'keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'AltLeft', 'AltRight', 'Tab'].includes(e.code) && !(e.target instanceof HTMLButtonElement)) e.preventDefault()
      this.keySeen = true
      if (!e.repeat) this.downs.set(e.code, (this.downs.get(e.code) ?? 0) + 1)
      this.held.add(e.code)
    })
    on<KeyboardEvent>(window, 'keyup', (e) => { this.ups.add(e.code); this.held.delete(e.code) })
    on(window, 'blur', () => { this.held.clear(); this.leftHeld = false })
    on<MouseEvent>(document, 'mousemove', (e) => {
      if (locked()) { this.mouseDX += e.movementX; this.mouseDY += e.movementY }
    })
    on<PointerEvent>(this.target, 'pointermove', (e) => {
      if (e.pointerType !== 'mouse' || locked()) return
      this.pointer = local(e)
      this.pointerMoved = true
    })
    on<PointerEvent>(this.target, 'pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return
      this.mouseSeen = true
      if (e.button === 2) this.rightPresses++
      if (!locked()) {
        // The first click takes the mouse for looking; it doesn't attack. In the blink view it picks the spot.
        if (e.button === 0) { this.pointer = local(e); this.pointerMoved = true; this.loosePicks++ }
        this.lock()
        return
      }
      if (e.button === 0) { this.leftPresses++; this.leftHeld = true }
    })
    on<PointerEvent>(window, 'pointerup', (e) => {
      if (e.pointerType !== 'mouse') return
      if (e.button === 0 && this.leftHeld) { this.leftReleases++; this.leftHeld = false }
    })
    on<MouseEvent>(this.target, 'contextmenu', (e) => e.preventDefault())
    on(document, 'pointerlockchange', () => {
      const now = locked()
      if (this.wasLocked && !now) { this.leftHeld = false; this.onLockLost?.() }
      this.wasLocked = now
    })
  }

  lock() {
    // `?nolock=1`: never capture the mouse (testing); the arrow keys look instead.
    if (wantsTouchControls() || document.pointerLockElement === this.target || new URLSearchParams(window.location.search).get('nolock') === '1') return
    try {
      const p = this.target.requestPointerLock?.() as unknown as Promise<void> | undefined
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } catch {
      /* not allowed here: the arrow keys still look */
    }
  }

  unlock() {
    if (document.pointerLockElement === this.target) document.exitPointerLock()
  }

  destroy() {
    this.unlock()
    this.cleanup.forEach((f) => f())
  }

  read(dt: number): Intent {
    const k = (c: string) => this.held.has(c)
    const just = (c: string) => this.downs.has(c)
    const alt = k('AltLeft') || k('AltRight')
    let moveX = (k('KeyD') ? 1 : 0) - (k('KeyA') ? 1 : 0)
    let moveZ = (k('KeyW') ? 1 : 0) - (k('KeyS') ? 1 : 0)
    // Holding Alt, A and D lean instead of stepping sideways.
    let lean = alt ? moveX : 0
    if (alt) moveX = 0
    let run = k('ShiftLeft') || k('ShiftRight')
    let dyaw = -this.mouseDX * LOOK.mouse
    let dpitch = -this.mouseDY * LOOK.mouse
    // The arrow keys look too, for anyone without a captured mouse.
    dyaw += ((k('ArrowLeft') ? 1 : 0) - (k('ArrowRight') ? 1 : 0)) * LOOK.keys * dt
    dpitch += ((k('ArrowUp') ? 1 : 0) - (k('ArrowDown') ? 1 : 0)) * LOOK.keys * dt * 0.7
    let jumpPressed = just('Space'), jumpHeld = k('Space')
    let crouchPressed = just('KeyC'), grabPressed = just('KeyE')
    const keyAttack = just('KeyF')
    const mouseAttack = this.leftPresses > 0
    let attackPressed = keyAttack || mouseAttack
    let attackPresses = (this.downs.get('KeyF') ?? 0) + this.leftPresses
    let attackHeld = k('KeyF') || this.leftHeld
    let attackReleased = this.ups.has('KeyF') || this.leftReleases > 0
    let dodgePressed = just('KeyQ')
    let blinkPressed = this.rightPresses > 0
    let selectPressed = this.leftPresses > 0 || this.loosePicks > 0
    let backPressed = false
    let aim: Intent['aim'] = { kind: 'none', x: 0, y: 0 }
    if (this.mouseDX || this.mouseDY) aim = { kind: 'delta', x: this.mouseDX, y: this.mouseDY }
    else if (this.pointer && this.pointerMoved) aim = { kind: 'point', x: this.pointer.x, y: this.pointer.y }
    let pausePressed = just('Escape')
    const debugPressed = just('Backquote')

    // Gamepad (standard mapping).
    let padUsed = false
    const pad = navigator.getGamepads?.().find((p) => p && p.connected) ?? null
    if (pad) {
      const b = (i: number) => !!pad.buttons[i]?.pressed
      const edge = (name: string, now: boolean) => { const was = this.padPrev[name] ?? false; this.padPrev[name] = now; return now && !was }
      const fall = (name: string, now: boolean) => { const was = this.padPrev[name + '_'] ?? false; this.padPrev[name + '_'] = now; return !now && was }
      const ax = (i: number) => (Math.abs(pad.axes[i] ?? 0) > DEAD ? pad.axes[i] : 0)
      const lx = ax(0), ly = ax(1), rx = ax(2), ry = ax(3)
      padUsed = pad.buttons.some((x) => x.pressed) || !!(lx || ly || rx || ry)
      const lb = b(4)
      if (lb) lean = lx
      else if (lx || ly) { moveX = lx; moveZ = -ly }
      run ||= (pad.buttons[7]?.value ?? 0) > 0.5
      // A jumps, and picks the spot in the blink view; B crouches, and closes it.
      const a = edge('A', b(0)), bb = edge('B', b(1))
      jumpPressed ||= a; jumpHeld ||= b(0); selectPressed ||= a
      crouchPressed ||= bb; backPressed ||= bb
      grabPressed ||= edge('X', b(2))
      const padAttack = edge('Y', b(3))
      attackPressed ||= padAttack; attackPresses += padAttack ? 1 : 0; attackHeld ||= b(3); attackReleased ||= fall('Y', b(3))
      dodgePressed ||= edge('RB', b(5))
      pausePressed ||= edge('Start', b(9))
      blinkPressed ||= edge('LT', (pad.buttons[6]?.value ?? 0) > 0.5)
      // The right stick looks, and aims in the blink view (the player decides which it is).
      if (rx || ry) aim = { kind: 'stick', x: rx, y: ry }
      dyaw -= rx * LOOK.stick * dt; dpitch -= ry * LOOK.stick * dt
    }

    // Touch.
    const t = touch
    const touchUsed = !!(t.moveX || t.moveY || t.lookDX || t.lookDY || t.jumpPressed || t.sneakPressed || t.grabPressed || t.attackPressed || t.attackHeld || t.dodgePressed || t.blinkPressed || t.tap.pending || t.lean)
    if (t.moveX || t.moveY) { moveX = t.moveX; moveZ = -t.moveY; run ||= Math.hypot(t.moveX, t.moveY) > STICK_RUN }
    dyaw -= t.lookDX * LOOK.mouse * 1.6
    dpitch -= t.lookDY * LOOK.mouse * 1.6
    if (t.lean) lean = t.lean
    jumpPressed ||= t.jumpPressed; jumpHeld ||= t.jumpHeld
    crouchPressed ||= t.sneakPressed
    grabPressed ||= t.grabPressed
    attackPressed ||= t.attackPressed; attackPresses += t.attackPressed ? 1 : 0; attackHeld ||= t.attackHeld; attackReleased ||= t.attackReleased
    dodgePressed ||= t.dodgePressed
    blinkPressed ||= t.blinkPressed
    // A tap on the blink view goes straight there (History #109).
    if (t.tap.pending) { aim = { kind: 'point', x: t.tap.x, y: t.tap.y }; selectPressed = true }
    t.lookDX = 0; t.lookDY = 0
    t.jumpPressed = t.sneakPressed = t.grabPressed = t.attackPressed = t.attackReleased = t.dodgePressed = t.blinkPressed = false
    t.tap.pending = false

    this.device = trackDevice(this.device, { key: this.keySeen, keyAttack, mouse: this.mouseSeen, mouseAttack, pad: padUsed, touch: touchUsed })
    this.keySeen = this.mouseSeen = false
    this.downs.clear(); this.ups.clear()
    this.mouseDX = this.mouseDY = 0
    this.leftPresses = this.leftReleases = this.loosePicks = this.rightPresses = 0
    this.pointerMoved = false

    return { moveX, moveZ, run, dyaw, dpitch, jumpPressed, jumpHeld, crouchPressed, grabPressed, attackPressed, attackPresses, attackHeld, attackReleased, dodgePressed, lean, blinkPressed, selectPressed, backPressed, aim, pausePressed, debugPressed, attackGlyph: attackGlyph(this.device) }
  }
}
