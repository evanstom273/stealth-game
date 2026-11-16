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
  blinkHeld: boolean
  blinkReleased: boolean
  blinkCancel: boolean
  /** Blink aim: mouse movement in pixels, a stick's direction, or a finger's drag from where it started. */
  aim: { kind: 'none' | 'delta' | 'stick' | 'drag'; x: number; y: number }
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
  private leftPresses = 0
  private leftReleases = 0
  private leftHeld = false
  private rightHeld = false
  private rightReleased = false
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
    on<KeyboardEvent>(window, 'keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'AltLeft', 'AltRight', 'Tab'].includes(e.code) && !(e.target instanceof HTMLButtonElement)) e.preventDefault()
      this.keySeen = true
      if (!e.repeat) this.downs.set(e.code, (this.downs.get(e.code) ?? 0) + 1)
      this.held.add(e.code)
    })
    on<KeyboardEvent>(window, 'keyup', (e) => { this.ups.add(e.code); this.held.delete(e.code) })
    on(window, 'blur', () => { this.held.clear(); this.leftHeld = this.rightHeld = false })
    on<MouseEvent>(document, 'mousemove', (e) => {
      if (document.pointerLockElement === this.target) { this.mouseDX += e.movementX; this.mouseDY += e.movementY }
    })
    on<PointerEvent>(this.target, 'pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return
      this.mouseSeen = true
      if (document.pointerLockElement !== this.target) {
        // The first click takes the mouse for looking; it doesn't attack.
        this.lock()
        if (e.button === 2) this.rightHeld = true
        return
      }
      if (e.button === 0) { this.leftPresses++; this.leftHeld = true }
      if (e.button === 2) this.rightHeld = true
    })
    const up = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (e.button === 0 && this.leftHeld) { this.leftReleases++; this.leftHeld = false }
      if (e.button === 2 && this.rightHeld) { this.rightReleased = true; this.rightHeld = false }
    }
    on<PointerEvent>(window, 'pointerup', up)
    on<MouseEvent>(this.target, 'contextmenu', (e) => e.preventDefault())
    on(document, 'pointerlockchange', () => {
      const locked = document.pointerLockElement === this.target
      if (this.wasLocked && !locked) {
        this.leftHeld = false
        if (this.rightHeld) { this.rightHeld = false; this.rightReleased = true }
        this.onLockLost?.()
      }
      this.wasLocked = locked
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
    let blinkHeld = this.rightHeld
    let blinkReleased = this.rightReleased
    let blinkCancel = false
    let aim: Intent['aim'] = this.mouseDX || this.mouseDY ? { kind: 'delta', x: this.mouseDX, y: this.mouseDY } : { kind: 'none', x: 0, y: 0 }
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
      jumpPressed ||= edge('A', b(0)); jumpHeld ||= b(0)
      crouchPressed ||= edge('B', b(1))
      grabPressed ||= edge('X', b(2))
      const padAttack = edge('Y', b(3))
      attackPressed ||= padAttack; attackPresses += padAttack ? 1 : 0; attackHeld ||= b(3); attackReleased ||= fall('Y', b(3))
      dodgePressed ||= edge('RB', b(5))
      pausePressed ||= edge('Start', b(9))
      const lt = (pad.buttons[6]?.value ?? 0) > 0.5
      if (lt) { blinkHeld = true; aim = { kind: 'stick', x: rx, y: ry } }
      if (fall('LT', lt)) blinkReleased = true
      if (!lt) { dyaw -= rx * LOOK.stick * dt; dpitch -= ry * LOOK.stick * dt }
    }

    // Touch.
    const t = touch
    const touchUsed = !!(t.moveX || t.moveY || t.lookDX || t.lookDY || t.jumpPressed || t.sneakPressed || t.grabPressed || t.attackPressed || t.attackHeld || t.dodgePressed || t.aim.active || t.blinkReleased || t.lean)
    if (t.moveX || t.moveY) { moveX = t.moveX; moveZ = -t.moveY; run ||= Math.hypot(t.moveX, t.moveY) > STICK_RUN }
    dyaw -= t.lookDX * LOOK.mouse * 1.6
    dpitch -= t.lookDY * LOOK.mouse * 1.6
    if (t.lean) lean = t.lean
    jumpPressed ||= t.jumpPressed; jumpHeld ||= t.jumpHeld
    crouchPressed ||= t.sneakPressed
    grabPressed ||= t.grabPressed
    attackPressed ||= t.attackPressed; attackPresses += t.attackPressed ? 1 : 0; attackHeld ||= t.attackHeld; attackReleased ||= t.attackReleased
    dodgePressed ||= t.dodgePressed
    if (t.aim.active || t.blinkReleased) {
      blinkHeld = t.aim.active
      aim = { kind: 'drag', x: t.aim.x, y: t.aim.y }
      if (t.blinkReleased) { blinkReleased = true; blinkCancel = t.aim.cancel }
    }
    t.lookDX = 0; t.lookDY = 0
    t.jumpPressed = t.sneakPressed = t.grabPressed = t.attackPressed = t.attackReleased = t.dodgePressed = t.blinkReleased = false

    this.device = trackDevice(this.device, { key: this.keySeen, keyAttack, mouse: this.mouseSeen, mouseAttack, pad: padUsed, touch: touchUsed })
    this.keySeen = this.mouseSeen = false
    this.downs.clear(); this.ups.clear()
    this.mouseDX = this.mouseDY = 0
    this.leftPresses = this.leftReleases = 0
    this.rightReleased = false

    return { moveX, moveZ, run, dyaw, dpitch, jumpPressed, jumpHeld, crouchPressed, grabPressed, attackPressed, attackPresses, attackHeld, attackReleased, dodgePressed, lean, blinkHeld, blinkReleased, blinkCancel, aim, pausePressed, debugPressed, attackGlyph: attackGlyph(this.device) }
  }
}
