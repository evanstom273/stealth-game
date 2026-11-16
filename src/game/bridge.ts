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
