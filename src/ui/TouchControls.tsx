import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { touch } from '../game/bridge.ts'
import { BlinkIcon, GrabIcon, JumpIcon, SneakIcon } from './icons.tsx'
import { useHud } from './useHud.ts'

/**
 * Touch controls as approved in the Thief Control Layout (History #43–#45): a fixed thumbstick
 * (push it to the edge to run), and a diamond of buttons: Jump bottom, Grab right, Sneak left,
 * Blink top. Drag out from Blink to aim; let go to blink, or slide back onto it to cancel.
 */

const STICK_MAX = 46
const RUN_AT = 0.85

// Diamond: button centre measured from the bottom-right corner, and diameter.
const BUTTONS = {
  jump: { right: 104, bottom: 58, size: 66 },
  grab: { right: 44, bottom: 124, size: 66 },
  sneak: { right: 164, bottom: 124, size: 66 },
  blink: { right: 104, bottom: 190, size: 66 },
} as const

function gameRect() {
  return document.querySelector('[data-game-root]')?.getBoundingClientRect() ?? null
}

function Stick() {
  const knob = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const pointer = useRef<number | null>(null)

  const move = (e: ReactPointerEvent) => {
    const r = root.current!.getBoundingClientRect()
    let dx = e.clientX - (r.left + r.width / 2)
    let dy = e.clientY - (r.top + r.height / 2)
    const d = Math.hypot(dx, dy)
    if (d > STICK_MAX) {
      dx = (dx / d) * STICK_MAX
      dy = (dy / d) * STICK_MAX
    }
    knob.current!.style.transform = `translate(${dx}px, ${dy}px)`
    const m = Math.min(d, STICK_MAX) / STICK_MAX
    touch.moveX = dx / STICK_MAX
    touch.moveY = dy / STICK_MAX
    touch.run = m > RUN_AT && Math.abs(dx) > 8
    root.current!.classList.toggle('running', touch.run)
  }
  const end = (e: ReactPointerEvent) => {
    if (e.pointerId !== pointer.current) return
    pointer.current = null
    knob.current!.style.transform = ''
    touch.moveX = 0
    touch.moveY = 0
    touch.run = false
    root.current!.classList.remove('running')
  }

  return (
    <div
      ref={root}
      className="stick"
      data-testid="stick"
      onPointerDown={(e) => {
        pointer.current = e.pointerId
        e.currentTarget.setPointerCapture(e.pointerId)
        move(e)
      }}
      onPointerMove={(e) => e.pointerId === pointer.current && move(e)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="stick-run" />
      <span className="run-tag">Run</span>
      <div ref={knob} className="knob" />
    </div>
  )
}

function place(b: { right: number; bottom: number; size: number }) {
  return {
    width: b.size,
    height: b.size,
    right: `calc(max(env(safe-area-inset-right, 0px), 0px) + ${b.right - b.size / 2 + 20}px)`,
    bottom: `calc(max(env(safe-area-inset-bottom, 0px), 0px) + ${b.bottom - b.size / 2 + 16}px)`,
  }
}

export function TouchControls() {
  const h = useHud()
  const blinkRef = useRef<HTMLButtonElement>(null)
  const aiming = useRef<number | null>(null)

  const press = (el: HTMLElement) => el.classList.add('down')
  const release = (el: HTMLElement) => el.classList.remove('down')

  const aimMove = (e: ReactPointerEvent) => {
    if (e.pointerId !== aiming.current) return
    const b = blinkRef.current!.getBoundingClientRect()
    const over = Math.hypot(e.clientX - (b.left + b.width / 2), e.clientY - (b.top + b.height / 2)) < b.width / 2
    if (over) {
      touch.aim.cancel = true
      return
    }
    const g = gameRect()
    if (!g) return
    touch.aim.cancel = false
    touch.aim.hasPoint = true
    touch.aim.x = e.clientX - g.left
    touch.aim.y = e.clientY - g.top
  }
  const aimEnd = (e: ReactPointerEvent) => {
    if (e.pointerId !== aiming.current) return
    aiming.current = null
    release(e.currentTarget as HTMLElement)
    blinkRef.current!.classList.remove('aiming')
    touch.aim.active = false
    touch.blinkReleased = true
  }

  return (
    <div className="touch-layer" data-testid="touch-controls">
      <Stick />
      <button
        type="button"
        className="tb"
        aria-label="Jump"
        style={place(BUTTONS.jump)}
        onPointerDown={(e) => {
          press(e.currentTarget)
          touch.jumpPressed = true
          touch.jumpHeld = true
        }}
        onPointerUp={(e) => {
          release(e.currentTarget)
          touch.jumpHeld = false
        }}
        onPointerCancel={(e) => {
          release(e.currentTarget)
          touch.jumpHeld = false
        }}
      >
        <JumpIcon />
        <span className="tb-label">Jump</span>
      </button>
      <button
        type="button"
        className="tb"
        aria-label="Grab"
        aria-pressed={h.holding}
        style={place(BUTTONS.grab)}
        onPointerDown={(e) => {
          press(e.currentTarget)
          touch.grabPressed = true
        }}
        onPointerUp={(e) => release(e.currentTarget)}
        onPointerCancel={(e) => release(e.currentTarget)}
      >
        <GrabIcon />
        <span className="tb-label">Grab</span>
      </button>
      <button
        type="button"
        className="tb"
        aria-label="Sneak"
        aria-pressed={h.sneaking}
        style={place(BUTTONS.sneak)}
        onPointerDown={(e) => {
          press(e.currentTarget)
          touch.sneakPressed = true
        }}
        onPointerUp={(e) => release(e.currentTarget)}
        onPointerCancel={(e) => release(e.currentTarget)}
      >
        <SneakIcon />
        <span className="tb-label">Sneak</span>
      </button>
      <button
        ref={blinkRef}
        type="button"
        className={`tb blink${h.charges ? '' : ' empty'}${h.aiming ? ' aiming' : ''}`}
        aria-label="Blink"
        data-testid="blink"
        style={place(BUTTONS.blink)}
        onPointerDown={(e) => {
          if (!h.charges) return
          press(e.currentTarget)
          e.currentTarget.setPointerCapture(e.pointerId)
          aiming.current = e.pointerId
          touch.aim.active = true
          touch.aim.hasPoint = false
          touch.aim.cancel = true
        }}
        onPointerMove={aimMove}
        onPointerUp={aimEnd}
        onPointerCancel={aimEnd}
      >
        <span className="tb-pips">
          {Array.from({ length: h.maxCharges }, (_, i) => (
            <i key={i} className={i < h.charges ? 'on' : ''} />
          ))}
        </span>
        <BlinkIcon />
        <span className="tb-label">Blink</span>
      </button>
    </div>
  )
}
