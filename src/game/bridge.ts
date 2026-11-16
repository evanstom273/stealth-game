/**
 * The bridge between the Phaser game and the React interface drawn over it.
 * The game publishes what the HUD shows; the touch controls write input for the game to read.
 */

export interface DebugInfo {
  light: number
  noise: string
  grip: number
  charges: number
  state: string
  speed: number
  fps: number
}

export interface HudState {
  charges: number
  maxCharges: number
  sneaking: boolean
  holding: boolean
  aiming: boolean
  paused: boolean
  showDebug: boolean
  showNoise: boolean
  /** Testing switch: draw the guards' sight cones (History #85). */
  showCones: boolean
  debug: DebugInfo | null
}

type Listener = () => void

class Store<T extends object> {
  private state: T
  private listeners = new Set<Listener>()
  constructor(initial: T) {
    this.state = initial
  }
  get = (): T => this.state
  set(patch: Partial<T>) {
    let changed = false
    for (const k in patch) {
      if (!Object.is(this.state[k], patch[k])) {
        changed = true
        break
      }
    }
    if (!changed) return
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((l) => l())
  }
  subscribe = (l: Listener) => {
    this.listeners.add(l)
    return () => {
      this.listeners.delete(l)
    }
  }
}

export const hud = new Store<HudState>({
  charges: 3,
  maxCharges: 3,
  sneaking: false,
  holding: false,
  aiming: false,
  paused: false,
  showDebug: false,
  showNoise: false,
  showCones: true,
  debug: null,
})

/** Touch input, written by the on-screen controls and read once per frame by the game. */
export const touch = {
  moveX: 0,
  moveY: 0,
  run: false,
  jumpHeld: false,
  jumpPressed: false,
  sneakPressed: false,
  grabPressed: false,
  /** Blink aiming: the finger's position over the game canvas, in CSS pixels. */
  aim: { active: false, x: 0, y: 0, hasPoint: false, cancel: false },
  blinkReleased: false,
  attackPressed: false,
  attackHeld: false,
  attackReleased: false,
  dodgePressed: false,
  /** First person: dragging to look, in CSS pixels since the last frame, and leaning (-1 to 1). */
  lookDX: 0,
  lookDY: 0,
  lean: 0,
}

const coarse = () => typeof window !== 'undefined' && window.matchMedia('(any-pointer: coarse)').matches

/** Touch controls show on touch screens. `?touch=1` or `?touch=0` in the address forces them on or off. */
export function wantsTouchControls(): boolean {
  const force = new URLSearchParams(window.location.search).get('touch')
  if (force === '1') return true
  if (force === '0') return false
  return coarse()
}

type Command = 'pause' | 'resume' | 'restart'
const commandListeners = new Set<(c: Command) => void>()
export const commands = {
  send(c: Command) {
    commandListeners.forEach((l) => {
      try {
        l(c)
      } catch (e) {
        console.error(e)
      }
    })
  },
  listen(l: (c: Command) => void) {
    commandListeners.add(l)
    return () => {
      commandListeners.delete(l)
    }
  },
}
