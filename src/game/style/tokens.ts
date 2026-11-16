// Colour tokens from the Stylised Geometry guide (stylised-geometry/STYLISED_GEOMETRY.md, §5.1 and §12.4).
// Each colour has one job; nothing else borrows it.

/** Every outline. */
export const INK = 0x1a1a26
/** The player's body. No enemy is white-bodied. */
export const HERO = 0xf2f2f2
/** The player's abilities: cooldown bars, ready rings and the like. */
export const POWER = 0x8fd3ff
export const POWER_LIGHT = 0xcfeaff
/** A takedown that will kill: the guard's outline once a hold tips over (History #86). */
export const KILL = 0xff7a3d
/** Getting hurt, health loss, hurt flashes. Enemies stay off pure red so this still reads. */
export const DAMAGE = 0xff5a5a
/** Currency, pickups, buying. */
export const REWARD = 0xffcf4a
/** "About to attack": the colour things heat towards before they act. */
export const HOT_TELL = 0xfff0d8
/** Dust: take-off, landing, skids. */
export const DUST = 0xb4b4c6
/** Feet and boots. */
export const FOOT = 0x2a2a3a
