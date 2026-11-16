import * as Phaser from 'phaser'
import { EmptyScene } from './scenes/EmptyScene.ts'

/** The reference sheets' background colour, for now. Each world gets its own palette (style guide §5.3). */
const BACKDROP = '#14141c'

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: BACKDROP,
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: '100%',
      height: '100%',
    },
    scene: [EmptyScene],
  })
}
