import { commands } from '../game/bridge.ts'
import { useHud } from './useHud.ts'
import { SneakIcon } from './icons.tsx'

/** The heads-up display: blink charges, the sneaking tag, pause, and the debug panel (guide §10). */
export function Hud() {
  const h = useHud()
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="ui-panel hud-tl flex flex-col gap-1.5 px-3 pt-2 pb-2.5" data-testid="charges">
        <span className="ui-label">Blink</span>
        <span className="flex gap-[7px]">
          {Array.from({ length: h.maxCharges }, (_, i) => (
            <i key={i} className={`pip${i < h.charges ? ' on' : ''}`} />
          ))}
        </span>
      </div>
      {h.sneaking && (
        <div className="ui-panel hud-tl-2 flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#e8e8f0] uppercase" data-testid="sneaking">
          <SneakIcon className="h-4 w-4" />
          Sneaking
        </div>
      )}
      <button
        type="button"
        aria-label={h.paused ? 'Resume' : 'Pause'}
        className="ui-panel hud-tr pointer-events-auto grid h-[42px] w-[42px] place-items-center rounded-full"
        onClick={() => commands.send(h.paused ? 'resume' : 'pause')}
      >
        <span className="flex gap-[5px]">
          <i className="block h-[14px] w-1 rounded-[1px] bg-[#e8e8f0]" />
          <i className="block h-[14px] w-1 rounded-[1px] bg-[#e8e8f0]" />
        </span>
      </button>
      {h.showDebug && h.debug && (
        <div className="ui-panel hud-tr-2 px-2.5 py-2 font-mono text-[11px] leading-[1.55] whitespace-pre text-[#cfd0dc]" data-testid="debug">
          {`light   `}<b className="font-medium text-[#8fd3ff]">{Math.round(h.debug.light * 100)}%</b>
          {`\nnoise   `}<b className="font-medium text-[#8fd3ff]">{h.debug.noise}</b>
          {`\ngrip    `}<b className="font-medium text-[#8fd3ff]">{Math.round(h.debug.grip * 100)}%</b>
          {`\ncharges `}<b className="font-medium text-[#8fd3ff]">{h.debug.charges}/{h.maxCharges}</b>
          {`\nstate   `}<b className="font-medium text-[#8fd3ff]">{h.debug.state}</b>
          {`\nspeed   `}<b className="font-medium text-[#8fd3ff]">{h.debug.speed.toFixed(1)} S/s</b>
          {`\nfps     `}<b className="font-medium text-[#8fd3ff]">{h.debug.fps}</b>
        </div>
      )}
    </div>
  )
}
