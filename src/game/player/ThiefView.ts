import * as Phaser from 'phaser'
import { cpuCanvasTexture } from '../canvasTexture.ts'
import { DEPTH } from '../room/RoomView.ts'
import { S } from '../tuning.ts'
import { drawThief, type ThiefLook } from './thiefArt.ts'

const SIZE = 3 * S
const OX = 1.5 * S
const OY = 1.6 * S

export interface Pixel {
  x: number
  y: number
  color: number
  /** 0 at the top of him to 1 at the bottom. */
  h: number
}

/**
 * Draws the thief from shapes onto a small canvas each frame and shows it as an image (guide §12.1:
 * no sprites). The canvas is drawn at the camera's zoom so he stays crisp on high-density screens.
 */
export class ThiefView {
  private res = 0
  private tex!: Phaser.Textures.CanvasTexture
  readonly image: Phaser.GameObjects.Image
  private key: string
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.key = 'thief'
    this.image = scene.add.image(0, 0, '__DEFAULT').setDepth(DEPTH.thief)
  }

  setZoom(zoom: number) {
    const res = Math.max(1, Math.min(3, Math.ceil(zoom)))
    if (res === this.res) return
    this.res = res
    this.tex = cpuCanvasTexture(this.scene, this.key, Math.ceil(SIZE * res), Math.ceil(SIZE * res))
    this.image.setTexture(this.key)
    this.image.setOrigin(OX / SIZE, OY / SIZE)
  }

  draw(look: ThiefLook) {
    const ctx = this.tex.context
    const r = this.res
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.tex.width, this.tex.height)
    ctx.setTransform(S * r, 0, 0, S * r, OX * r, OY * r)
    drawThief(ctx, look)
    this.tex.refresh()
  }

  /** Places him with his drawing origin (the body's centre) at x, y. */
  place(x: number, y: number, facing: number, sx: number, sy: number, visible: boolean) {
    this.image.setPosition(x, y)
    this.image.setScale(sx / this.res, sy / this.res)
    this.image.setFlipX(facing < 0)
    this.image.setVisible(visible)
  }

  /** His current drawing as world-space pixels, for the dust blink. */
  pixels(originX: number, originY: number, facing: number): Pixel[] {
    const r = this.res
    const w = this.tex.width
    const h = this.tex.height
    const data = this.tex.context.getImageData(0, 0, w, h).data
    const out: Pixel[] = []
    const step = Math.max(1, Math.round(2 * r))
    let minY = Infinity
    let maxY = -Infinity
    for (let py = 0; py < h; py += step) {
      for (let px = 0; px < w; px += step) {
        const i = (py * w + px) * 4
        if (data[i + 3] < 110) continue
        out.push({
          x: originX + (facing * (px - OX * r)) / r,
          y: originY + (py - OY * r) / r,
          color: (data[i] << 16) | (data[i + 1] << 8) | data[i + 2],
          h: py,
        })
        minY = Math.min(minY, py)
        maxY = Math.max(maxY, py)
      }
    }
    for (const p of out) p.h = (p.h - minY) / Math.max(1, maxY - minY)
    return out
  }
}
