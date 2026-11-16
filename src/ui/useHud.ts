import { useSyncExternalStore } from 'react'
import { hud, type HudState } from '../game/bridge.ts'

export function useHud(): HudState {
  return useSyncExternalStore(hud.subscribe, hud.get)
}

export { wantsTouchControls } from '../game/bridge.ts'
