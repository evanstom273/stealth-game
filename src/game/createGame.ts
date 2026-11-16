import * as Phaser from 'phaser'
import { TestRoomScene } from './scenes/TestRoomScene.ts'
import { MOVE } from './tuning.ts'

/**
 * The canvas is drawn at the screen's real pixel density (capped at 2) and shown at its CSS size,
 * so shapes stay crisp on the Fold. `cssWidth` and `cssHeight` are the parent's size in CSS pixels.
 */
export function createGame(parent: HTMLElement, cssWidth: number, cssHeight: number, dpr: number): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#0b0b10',
    scale: {
      mode: Phaser.Scale.NONE,
      width: Math.round(cssWidth * dpr),
      height: Math.round(cssHeight * dpr),
      zoom: 1 / dpr,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: MOVE.gravity }, debug: false },
    },
    input: { gamepad: true },
    // No warm-up clamp on the frame time, so he moves at the right speed from the first frame on slow devices.
    fps: { panicMax: 0 },
    scene: [TestRoomScene],
  })
  game.registry.set('dpr', dpr)
  return game
}
