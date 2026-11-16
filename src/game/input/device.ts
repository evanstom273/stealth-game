/**
 * Which controls he's using, so prompts can show the right button (History #86). Keyboard and
 * mouse count as one set of controls; within it, the Attack glyph follows whichever of F or the
 * left mouse button was last used to attack.
 */

export type InputFamily = 'kbm' | 'pad' | 'touch'
export type AttackGlyph = 'key' | 'mouse' | 'pad' | 'touch'

export interface DeviceState {
  family: InputFamily
  kbAttack: 'key' | 'mouse'
}

/** What each kind of control did this frame. */
export interface DeviceSignals {
  /** Any key went down. */
  key: boolean
  /** F went down. */
  keyAttack: boolean
  /** A mouse button went down. */
  mouse: boolean
  /** The left mouse button went down. */
  mouseAttack: boolean
  /** A gamepad button is held or a stick is pushed. */
  pad: boolean
  /** Any on-screen control is in use. */
  touch: boolean
}

export function startDevice(touchFirst: boolean): DeviceState {
  return { family: touchFirst ? 'touch' : 'kbm', kbAttack: 'key' }
}

export function trackDevice(s: DeviceState, sig: DeviceSignals): DeviceState {
  let { family, kbAttack } = s
  if (sig.keyAttack) kbAttack = 'key'
  if (sig.mouseAttack) kbAttack = 'mouse'
  if (sig.key || sig.mouse) family = 'kbm'
  if (sig.pad) family = 'pad'
  if (sig.touch) family = 'touch'
  return family === s.family && kbAttack === s.kbAttack ? s : { family, kbAttack }
}

export function attackGlyph(s: DeviceState): AttackGlyph {
  return s.family === 'kbm' ? s.kbAttack : s.family
}
