import { commands, hud } from '../game/bridge.ts'
import { useHud } from './useHud.ts'

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" className="menu-btn flex items-center justify-between gap-6" aria-pressed={on} onClick={onClick}>
      <span>{label}</span>
      <span className="font-mono text-[11px] tracking-[0.14em] text-[#9a9ab0] uppercase">{on ? 'On' : 'Off'}</span>
    </button>
  )
}

const canFullscreen = () => typeof document !== 'undefined' && !!document.documentElement.requestFullscreen

/** Pause: resume, restart the room, and the testing switches (debug panel, noise rings). */
export function PauseMenu() {
  const h = useHud()
  if (!h.paused) return null
  return (
    <div className="absolute inset-0 grid place-items-center bg-black/55 p-4" data-testid="pause-menu">
      <div className="ui-panel grid w-full max-w-[320px] gap-2 rounded-2xl p-4">
        <p className="ui-label px-1 pb-1">Paused</p>
        <button type="button" className="menu-btn primary" onClick={() => commands.send('resume')}>
          Resume
        </button>
        <button type="button" className="menu-btn" onClick={() => commands.send('restart')}>
          Restart room
        </button>
        <Toggle label="Debug panel" on={h.showDebug} onClick={() => hud.set({ showDebug: !h.showDebug })} />
        <Toggle label="Noise rings" on={h.showNoise} onClick={() => hud.set({ showNoise: !h.showNoise })} />
        <Toggle label="Sight cones" on={h.showCones} onClick={() => hud.set({ showCones: !h.showCones })} />
        {canFullscreen() && (
          <button
            type="button"
            className="menu-btn"
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
              else document.documentElement.requestFullscreen().catch(() => {})
            }}
          >
            Full screen
          </button>
        )}
        <p className="px-1 pt-2 text-[12px] leading-snug text-[#9a9ab0]">
          Keyboard: A/D move, W/S climb, Shift run, C sneak, Space jump, E grab, S while running to slide, hold the right mouse button to aim a blink. Attack: left mouse or F (tap to knock out, hold to kill at a takedown). Dodge: Q. Esc to pause, ` for the debug panel.
        </p>
      </div>
    </div>
  )
}
