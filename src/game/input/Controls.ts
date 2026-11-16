import * as Phaser from 'phaser'
import { touch } from '../bridge.ts'
import type { Vec } from '../logic/geometry.ts'

/** What the player wants this frame, whatever they're holding: keyboard and mouse, gamepad or touch. */
export interface Intent {
  moveX: number
  moveY: number
  run: boolean
  jumpPressed: boolean
  jumpHeld: boolean
  /** Sneak toggles (History #38). */
  sneakPressed: boolean
  /** Grab toggles: press to grab, press to let go (History #30). */
  grabPressed: boolean
  /** Holding the blink aim. `world` is the aimed point, or null to aim straight ahead. */
  aim: { active: boolean; world: Vec | null; cancel: boolean; fromStick: Vec | null }
  blinkReleased: boolean
  /** Attack: tap to knock out, hold to kill at takedowns and finishers (History #58). */
  attackPressed: boolean
  attackHeld: boolean
  attackReleased: boolean
  dodgePressed: boolean
  pausePressed: boolean
  debugPressed: boolean
}

type Keys = Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'SHIFT' | 'C' | 'SPACE' | 'E' | 'ESC' | 'BACKTICK' | 'F' | 'Q', Phaser.Input.Keyboard.Key>

const DEAD = 0.2

export class Controls {
  private keys: Keys | null
  private rightWasDown = false
  private mouseWasDown = false
  private padPrev: Record<string, boolean> = {}
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.keys = (scene.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT,C,SPACE,E,ESC,BACKTICK,F,Q') as Keys) ?? null
    scene.input.mouse?.disableContextMenu()
  }

  /** @param cssToWorld converts a point over the canvas, in CSS pixels, to world coordinates. */
  read(cssToWorld: (x: number, y: number) => Vec): Intent {
    const k = this.keys
    const down = (key?: Phaser.Input.Keyboard.Key) => !!key?.isDown
    const just = (key?: Phaser.Input.Keyboard.Key) => (key ? Phaser.Input.Keyboard.JustDown(key) : false)

    // Keyboard
    let moveX = (down(k?.D) || down(k?.RIGHT) ? 1 : 0) - (down(k?.A) || down(k?.LEFT) ? 1 : 0)
    let moveY = (down(k?.S) || down(k?.DOWN) ? 1 : 0) - (down(k?.W) || down(k?.UP) ? 1 : 0)
    let run = down(k?.SHIFT)
    let jumpPressed = just(k?.SPACE)
    let jumpHeld = down(k?.SPACE)
    let sneakPressed = just(k?.C)
    let grabPressed = just(k?.E)
    let pausePressed = just(k?.ESC)
    const debugPressed = just(k?.BACKTICK)
    let dodgePressed = just(k?.Q)

    // Mouse: hold the right button to aim a blink, let go to blink.
    const pointer = this.scene.input.activePointer
    const rightDown = pointer.rightButtonDown()
    // Re-read against the camera every frame: the camera keeps moving while the mouse sits still.
    const wp = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2
    const mouseWorld = { x: wp.x, y: wp.y }
    let aim: Intent['aim'] = { active: false, world: null, cancel: false, fromStick: null }
    let blinkReleased = false
    if (rightDown) aim = { active: true, world: mouseWorld, cancel: false, fromStick: null }
    if (!rightDown && this.rightWasDown) {
      blinkReleased = true
      aim = { active: true, world: mouseWorld, cancel: false, fromStick: null }
    }
    this.rightWasDown = rightDown
    // Attack: F, or the left mouse button (mouse only, so taps on a touch screen don't punch).
    // Presses and releases come from key events, so a tap shorter than a frame is never lost.
    const mouseDown = pointer.leftButtonDown() && !pointer.wasTouch
    let attackHeld = down(k?.F) || mouseDown
    let attackPressed = (k?.F ? Phaser.Input.Keyboard.JustDown(k.F) : false) || (mouseDown && !this.mouseWasDown)
    let attackReleased = (k?.F ? Phaser.Input.Keyboard.JustUp(k.F) : false) || (!mouseDown && this.mouseWasDown)
    this.mouseWasDown = mouseDown

    // Gamepad
    const pad = this.scene.input.gamepad?.total ? this.scene.input.gamepad.getPad(0) : null
    if (pad?.connected) {
      const edge = (name: string, now: boolean) => {
        const was = this.padPrev[name] ?? false
        this.padPrev[name] = now
        return now && !was
      }
      const lx = Math.abs(pad.leftStick.x) > DEAD ? pad.leftStick.x : 0
      const ly = Math.abs(pad.leftStick.y) > DEAD ? pad.leftStick.y : 0
      const dx = (pad.right ? 1 : 0) - (pad.left ? 1 : 0)
      const dy = (pad.down ? 1 : 0) - (pad.up ? 1 : 0)
      if (!moveX) moveX = dx || lx
      if (!moveY) moveY = dy || ly
      run ||= pad.R2 > 0.5
      jumpPressed ||= edge('A', pad.A)
      jumpHeld ||= pad.A
      sneakPressed ||= edge('B', pad.B)
      grabPressed ||= edge('X', pad.X)
      pausePressed ||= edge('start', !!pad.buttons[9]?.pressed)
      attackHeld ||= pad.Y
      attackPressed ||= edge('Y', pad.Y)
      attackReleased ||= !pad.Y && !!this.padPrev.Yheld
      this.padPrev.Yheld = pad.Y
      dodgePressed ||= edge('RB', pad.R1 > 0.5)
      const lt = pad.L2 > 0.5
      const rs = { x: pad.rightStick.x, y: pad.rightStick.y }
      if (lt) aim = { active: true, world: null, cancel: false, fromStick: rs }
      if (!lt && this.padPrev.LT) {
        blinkReleased = true
        aim = { active: true, world: null, cancel: false, fromStick: rs }
      }
      this.padPrev.LT = lt
    }

    // Touch
    if (!moveX && !moveY && (touch.moveX || touch.moveY)) {
      moveX = touch.moveX
      moveY = touch.moveY
      run ||= touch.run
    }
    jumpPressed ||= touch.jumpPressed
    jumpHeld ||= touch.jumpHeld
    sneakPressed ||= touch.sneakPressed
    grabPressed ||= touch.grabPressed
    if (touch.aim.active || touch.blinkReleased) {
      const world = touch.aim.hasPoint ? cssToWorld(touch.aim.x, touch.aim.y) : null
      aim = { active: true, world, cancel: touch.aim.cancel, fromStick: null }
      if (touch.blinkReleased) blinkReleased = true
    }
    attackHeld ||= touch.attackHeld
    attackPressed ||= touch.attackPressed
    attackReleased ||= touch.attackReleased
    dodgePressed ||= touch.dodgePressed
    touch.jumpPressed = false
    touch.sneakPressed = false
    touch.grabPressed = false
    touch.blinkReleased = false
    touch.attackPressed = false
    touch.attackReleased = false
    touch.dodgePressed = false

    return { moveX, moveY, run, jumpPressed, jumpHeld, sneakPressed, grabPressed, aim, blinkReleased, attackPressed, attackHeld, attackReleased, dodgePressed, pausePressed, debugPressed }
  }
}
