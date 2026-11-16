import { describe, expect, it } from 'vitest'
import { pieceOutline, SHATTER, shatterAlpha, shatterPieces, stepPiece } from '../enemy/shatter.ts'
import { attackGlyph, startDevice, trackDevice, type DeviceSignals } from '../input/device.ts'

const none: DeviceSignals = { key: false, keyAttack: false, mouse: false, mouseAttack: false, pad: false, touch: false }

describe('the Attack button shown in prompts', () => {
  it('starts on F, or on the touch button on touch screens', () => {
    expect(attackGlyph(startDevice(false))).toBe('key')
    expect(attackGlyph(startDevice(true))).toBe('touch')
  })
  it('follows whichever controls were used last', () => {
    let s = startDevice(false)
    s = trackDevice(s, { ...none, pad: true })
    expect(attackGlyph(s)).toBe('pad')
    s = trackDevice(s, { ...none, touch: true })
    expect(attackGlyph(s)).toBe('touch')
    s = trackDevice(s, { ...none, key: true })
    expect(attackGlyph(s)).toBe('key')
  })
  it('on keyboard and mouse, shows the mouse once he attacks with it, and F again once he presses F', () => {
    let s = startDevice(false)
    s = trackDevice(s, { ...none, mouse: true, mouseAttack: true })
    expect(attackGlyph(s)).toBe('mouse')
    // Moving with the keyboard doesn't change which attack button is shown.
    s = trackDevice(s, { ...none, key: true })
    expect(attackGlyph(s)).toBe('mouse')
    s = trackDevice(s, { ...none, key: true, keyAttack: true })
    expect(attackGlyph(s)).toBe('key')
  })
  it('keeps the same state object when nothing changes', () => {
    const s = startDevice(false)
    expect(trackDevice(s, none)).toBe(s)
    expect(trackDevice(s, { ...none, key: true })).toBe(s)
  })
})

describe('the shatter', () => {
  let seed = 1
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }

  it('breaks the guard into its body, head, cap, hands and feet', () => {
    const ps = shatterPieces(rand)
    const count = (c: string, k: string) => ps.filter((p) => p.color === c && p.shape.kind === k).length
    expect(count('body', 'rect')).toBe(4)
    expect(count('skin', 'wedge')).toBe(4)
    expect(count('dark', 'cap')).toBe(1)
    expect(count('skin', 'circle')).toBe(2)
    expect(count('feet', 'rect')).toBe(2)
  })

  it('starts where the guard was, flying upwards', () => {
    for (const p of shatterPieces(rand)) {
      expect(Math.abs(p.x)).toBeLessThan(0.9)
      expect(p.y).toBeGreaterThan(-0.9)
      expect(p.y).toBeLessThan(SHATTER.floor)
      expect(p.vy).toBeLessThan(0)
    }
  })

  it('the head wedges fit together into the head before they fly apart', () => {
    const wedges = shatterPieces(rand).filter((p) => p.shape.kind === 'wedge')
    for (const w of wedges) {
      const apex = pieceOutline(w)[0]
      expect(w.x + apex.x).toBeCloseTo(0, 6)
      expect(w.y + apex.y).toBeCloseTo(-0.43, 6)
    }
  })

  it('every piece comes to rest on the floor, not through it, and fades out', () => {
    const ps = shatterPieces(rand)
    let maxBelow = -Infinity
    for (let t = 0; t < 3; t += 1 / 60) {
      for (const p of ps) {
        stepPiece(p, 1 / 60)
        maxBelow = Math.max(maxBelow, p.y + p.low)
      }
    }
    expect(maxBelow).toBeLessThanOrEqual(SHATTER.floor + 1e-9)
    for (const p of ps) expect(p.resting).toBe(true)
    expect(shatterAlpha(0.5)).toBe(1)
    expect(shatterAlpha(1.5)).toBeCloseTo(0.5)
    expect(shatterAlpha(2.01)).toBe(0)
  })
})
