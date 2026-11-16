import { useEffect, useRef } from 'react'
import { createGame } from './createGame.ts'

/** Holds the Phaser canvas. Phaser runs the game; React handles whatever sits around it. */
export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const game = createGame(container)
    return () => game.destroy(true)
  }, [])

  return <div ref={containerRef} className="h-full w-full" />
}
