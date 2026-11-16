import { useEffect, useRef } from 'react'
import { FpsGame } from './game/FpsGame.ts'

/** Holds the first-person game: Three.js runs it; React draws what sits over it. */
export function FpsView() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const game = new FpsGame(el)
    return () => game.destroy()
  }, [])
  return <div ref={ref} data-game-root className="absolute inset-0 overflow-hidden" />
}
