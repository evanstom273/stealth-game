import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { touch } from '../../game/bridge.ts'
import { AttackIcon, BlinkIcon, DodgeIcon, GrabIcon, JumpIcon, SneakIcon } from '../../ui/icons.tsx'
import { useHud } from '../../ui/useHud.ts'

/**
 * Touch controls for first person (Claude's first take; the layout is still open): the left half of
 * the screen walks with a floating stick (push to its edge to run), the right half drags to look,
 * and buttons sit bottom right. Drag out from Blink to aim in the top-down view; let go to blink,
 * or come back onto the button to cancel. Lean buttons sit on either edge.
 */

const STICK_MAX = 46

const BUTTONS = {
  attack: { right: 66, bottom: 66, size: 78 },
  jump: { right: 162, bottom: 46, size: 60 },
  crouch: { right: 238, bottom: 40, size: 52 },
  grab: { right: 58, bottom: 168, size: 58 },
  blink: { right: 140, bottom: 140, size: 64 },
  dodge: { right: 52, bottom: 248, size: 50 },
} as const

function place(b: { right: number; bottom: number; size: number }) {
  return {
    width: b.size,
    height: b.size,
    right: `calc(env(safe-area-inset-right, 0px) + ${b.right - b.size / 2}px)`,
    bottom: `calc(env(safe-area-inset-bottom, 0px) + ${b.bottom - b.size / 2}px)`,
  }
}

function Btn(props: { label: string; style: React.CSSProperties; className?: string; pressed?: boolean; testId?: string; children: ReactNode; down: (e: ReactPointerEvent<HTMLButtonElement>) => void; up?: (e: ReactPointerEvent<HTMLButtonElement>) => void; move?: (e: ReactPointerEvent<HTMLButtonElement>) => void }) {
  return (
    <button
      type="button"
      className={`tb ${props.className ?? ''}`}
      aria-label={props.label}
      aria-pressed={props.pressed}
      data-testid={props.testId}
      style={props.style}
      onPointerDown={(e) => {
        e.stopPropagation()
        e.currentTarget.classList.add('down')
        e.currentTarget.setPointerCapture(e.pointerId)
        props.down(e)
      }}
      onPointerMove={props.move}
      onPointerUp={(e) => { e.currentTarget.classList.remove('down'); props.up?.(e) }}
      onPointerCancel={(e) => { e.currentTarget.classList.remove('down'); props.up?.(e) }}
    >
      {props.children}
      <span className="tb-label">{props.label}</span>
    </button>
  )
}

export function FpsTouchControls() {
  const h = useHud()
  const stickEl = useRef<HTMLDivElement>(null)
  const knob = useRef<HTMLDivElement>(null)
  const stick = useRef<{ id: number; x: number; y: number } | null>(null)
  const look = useRef<{ id: number; x: number; y: number } | null>(null)
  const blinkEl = useRef<HTMLButtonElement>(null)

  const padDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - r.left, y = e.clientY - r.top
    e.currentTarget.setPointerCapture(e.pointerId)
    if (x < r.width / 2 && !stick.current) {
      stick.current = { id: e.pointerId, x, y }
      const s = stickEl.current!
      s.style.left = `${x}px`; s.style.top = `${y}px`; s.hidden = false
      knob.current!.style.transform = ''
    } else if (!look.current) look.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
  }
  const padMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = stick.current
    if (s && e.pointerId === s.id) {
      const r = e.currentTarget.getBoundingClientRect()
      let dx = e.clientX - r.left - s.x, dy = e.clientY - r.top - s.y
      const d = Math.hypot(dx, dy)
      if (d > STICK_MAX) { dx *= STICK_MAX / d; dy *= STICK_MAX / d }
      knob.current!.style.transform = `translate(${dx}px, ${dy}px)`
      touch.moveX = dx / STICK_MAX
      touch.moveY = dy / STICK_MAX
      stickEl.current!.classList.toggle('running', Math.hypot(dx, dy) / STICK_MAX > 0.92)
      return
    }
    const l = look.current
    if (l && e.pointerId === l.id) {
      touch.lookDX += e.clientX - l.x
      touch.lookDY += e.clientY - l.y
      l.x = e.clientX; l.y = e.clientY
    }
  }
  const padUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (stick.current?.id === e.pointerId) {
      stick.current = null
      stickEl.current!.hidden = true
      touch.moveX = touch.moveY = 0
    }
    if (look.current?.id === e.pointerId) look.current = null
  }

  const blinkCentre = () => {
    const b = blinkEl.current!.getBoundingClientRect()
    return { x: b.left + b.width / 2, y: b.top + b.height / 2, r: b.width / 2 }
  }

  return (
    <div className="touch-layer" data-testid="touch-controls">
      <div className="fps-pad" onPointerDown={padDown} onPointerMove={padMove} onPointerUp={padUp} onPointerCancel={padUp} />
      <div ref={stickEl} className="stick fps-stick" hidden>
        <div className="stick-run" />
        <span className="run-tag">Run</span>
        <div ref={knob} className="knob" />
      </div>
      <Btn label="Attack" className="attack" testId="attack" style={place(BUTTONS.attack)} down={() => { touch.attackPressed = true; touch.attackHeld = true }} up={() => { touch.attackHeld = false; touch.attackReleased = true }}>
        <AttackIcon />
      </Btn>
      <Btn label="Jump" style={place(BUTTONS.jump)} down={() => { touch.jumpPressed = true; touch.jumpHeld = true }} up={() => { touch.jumpHeld = false }}>
        <JumpIcon />
      </Btn>
      <Btn label="Crouch" pressed={h.sneaking} style={place(BUTTONS.crouch)} down={() => { touch.sneakPressed = true }}>
        <SneakIcon />
      </Btn>
      <Btn label="Grab" pressed={h.holding} style={place(BUTTONS.grab)} down={() => { touch.grabPressed = true }}>
        <GrabIcon />
      </Btn>
      <Btn label="Dodge" style={place(BUTTONS.dodge)} down={() => { touch.dodgePressed = true }}>
        <DodgeIcon />
      </Btn>
      <button
        ref={blinkEl}
        type="button"
        className={`tb blink${h.charges === 0 ? ' empty' : ''}`}
        aria-label="Blink"
        style={place(BUTTONS.blink)}
        onPointerDown={(e) => {
          e.stopPropagation()
          e.currentTarget.setPointerCapture(e.pointerId)
          e.currentTarget.classList.add('aiming')
          touch.aim.active = true
          touch.aim.x = 0; touch.aim.y = 0; touch.aim.cancel = false
        }}
        onPointerMove={(e) => {
          if (!touch.aim.active) return
          const c = blinkCentre()
          touch.aim.x = e.clientX - c.x; touch.aim.y = e.clientY - c.y
          touch.aim.cancel = Math.hypot(touch.aim.x, touch.aim.y) < c.r
        }}
        onPointerUp={(e) => {
          e.currentTarget.classList.remove('aiming')
          touch.aim.active = false
          touch.blinkReleased = true
        }}
        onPointerCancel={(e) => {
          e.currentTarget.classList.remove('aiming')
          touch.aim.active = false
          touch.aim.cancel = true
          touch.blinkReleased = true
        }}
      >
        <span className="tb-pips">{Array.from({ length: h.maxCharges }, (_, i) => <i key={i} className={i < h.charges ? 'on' : ''} />)}</span>
        <BlinkIcon />
        <span className="tb-label">Blink</span>
      </button>
      <Btn label="Lean left" className="lean lean-l" style={{ width: 46, height: 46 }} down={() => { touch.lean = -1 }} up={() => { touch.lean = 0 }}>
        <span aria-hidden="true" className="lean-arrow">‹</span>
      </Btn>
      <Btn label="Lean right" className="lean lean-r" style={{ width: 46, height: 46 }} down={() => { touch.lean = 1 }} up={() => { touch.lean = 0 }}>
        <span aria-hidden="true" className="lean-arrow">›</span>
      </Btn>
    </div>
  )
}
