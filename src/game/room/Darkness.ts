import * as Phaser from 'phaser'
import type { Vec } from '../logic/geometry.ts'
import { LIGHT } from '../tuning.ts'
import { cpuCanvasTexture } from '../canvasTexture.ts'
import { DEPTH } from './RoomView.ts'

const SIZE = 320

/**
 * The darkness over the room: near-black, with the lamps' pools and his vision pool cut out of it.
 * It sits above the room and below everything that moves (guide §6). Drawn on a small canvas
 * stretched over the camera's view; the gradients are soft, so the low resolution doesn't show.
 */
export class Darkness {
  private tex: Phaser.Textures.CanvasTexture
  private image: Phaser.GameObjects.Image

  constructor(scene: Phaser.Scene) {
    this.tex = cpuCanvasTexture(scene, 'darkness', SIZE, SIZE)
    this.image = scene.add.image(0, 0, 'darkness').setOrigin(0, 0).setDepth(DEPTH.darkness)
  }

  update(view: Phaser.Geom.Rectangle, lamps: readonly Vec[], pool: Vec) {
    const ctx = this.tex.context
    const sx = SIZE / view.width
    const sy = SIZE / view.height
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, SIZE, SIZE)
    ctx.fillStyle = `rgba(3,3,6,${LIGHT.darkness})`
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.globalCompositeOperation = 'destination-out'
    // Work in world units mapped onto the canvas, so the pools stay round however the view is shaped.
    ctx.setTransform(sx, 0, 0, sy, -view.x * sx, -view.y * sy)
    const cut = (p: Vec, radius: number, clear: number, strength: number) => {
      if (p.x + radius < view.x || p.x - radius > view.right || p.y + radius < view.y || p.y - radius > view.bottom) return
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius)
      g.addColorStop(0, `rgba(0,0,0,${strength})`)
      g.addColorStop(clear, `rgba(0,0,0,${strength})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
    for (const l of lamps) cut(l, LIGHT.lampRadius, LIGHT.lampClear, 1)
    cut(pool, LIGHT.poolRadius, 0.2, LIGHT.poolStrength)
    this.tex.refresh()
    this.image.setPosition(view.x, view.y)
    this.image.setDisplaySize(view.width, view.height)
  }
}
