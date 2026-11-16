import { useEffect, useRef } from 'react'
import type * as Phaser from 'phaser'
import { createGame } from './createGame.ts'

const dprNow = () => Math.min(2, window.devicePixelRatio || 1)

/** Holds the Phaser canvas and keeps it matched to the screen. Phaser runs the game; React draws what sits over it. */
export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let dpr = dprNow()
    const rect = container.getBoundingClientRect()
    const game: Phaser.Game = createGame(container, Math.max(1, rect.width), Math.max(1, rect.height), dpr)

    const resize = () => {
      const r = container.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) return
      dpr = dprNow()
      game.registry.set('dpr', dpr)
      game.scale.setZoom(1 / dpr)
      game.scale.resize(Math.round(r.width * dpr), Math.round(r.height * dpr))
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    return () => {
      observer.disconnect()
      game.destroy(true)
    }
  }, [])

  return <div ref={containerRef} data-game-root className="absolute inset-0 overflow-hidden" />
}
