import { useSyncExternalStore } from 'react'
import { hud, type HudState } from '../game/bridge.ts'

export function useHud(): HudState {
  return useSyncExternalStore(hud.subscribe, hud.get)
}

const coarse = () => typeof window !== 'undefined' && window.matchMedia('(any-pointer: coarse)').matches

/** Touch controls show on touch screens. `?touch=1` or `?touch=0` in the address forces them on or off. */
export function wantsTouchControls(): boolean {
  const force = new URLSearchParams(window.location.search).get('touch')
  if (force === '1') return true
  if (force === '0') return false
  return coarse()
}
