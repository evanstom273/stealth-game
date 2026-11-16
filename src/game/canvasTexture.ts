import * as Phaser from 'phaser'

/** A canvas texture drawn in CPU memory: cheap to upload every frame, and cheap to read back. */
export function cpuCanvasTexture(scene: Phaser.Scene, key: string, width: number, height: number): Phaser.Textures.CanvasTexture {
  if (scene.textures.exists(key)) scene.textures.remove(key)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d', { willReadFrequently: true })
  return scene.textures.addCanvas(key, canvas)!
}
