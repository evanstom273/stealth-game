# stealth-game

A first-person stealth game in the Stylised Geometry art style, its characters standing in a 3D world as flat billboards. The design lives in [`STEALTH_GAME_DESIGN.md`](STEALTH_GAME_DESIGN.md); the art style in [`stylised-geometry/`](stylised-geometry/).

Right now it's one level, the Test Wing, with all the mechanics and three test guards to sneak past, fight and take down:
- **Moving:** walking, running, crouching to sneak, sliding, crawling, leaning and jumping.
- **Climbing:** walls and ceilings, and mantling onto ledges.
- **Blink:** from a top-down view with time slowed.

He's invulnerable for now. The earlier side-on build is still playable at `?view=side`.

## Playing

Click the view to look with the mouse (Esc lets go of it and pauses).

| | Keyboard and mouse | Gamepad | Touch |
|---|---|---|---|
| Look | Mouse (or the arrow keys) | Right stick | Drag on the right half |
| Move | W A S D | Left stick | Drag on the left half |
| Run (hold) | Shift | RT | Push the stick to its edge |
| Crouch to sneak (on and off) | C | B | Crouch |
| Slide | C while running | B while running | Crouch while running |
| Jump | Space | A | Jump |
| Grab and let go | E: a wall in front, a ceiling when looking up, a ledge to pull up onto | X | Grab |
| Climb | W / S up and down, A / D along, Space kicks off | Left stick | Stick |
| Lean | Hold Alt, then A or D | Hold LB, left stick | Lean buttons on the edges |
| Blink | Hold the right mouse button for the top-down view, aim with the mouse, let go | Hold LT, aim with the right stick, let go | Drag out from Blink, let go; back onto it to cancel |
| Attack | Left mouse button or F | Y | Attack |
| Dodge | Q | RB | Dodge |
| Pause | Esc | Start | Pause button |

At a takedown or finisher the guard is outlined in power blue with a badge over it. **Tap Attack to knock out, hold it to kill**. Takedowns work from behind, dropping from a ledge, wall or ceiling above, or after blinking at an unaware guard. In a straight fight, three quick attacks (jab, cross, shove) stagger a guard for a finisher. The bar under the aim dot is how lit you are, and your gloves fade with it.

The pause menu has restart, full screen and a debug panel (also on the backtick key).

**Testing switches**, added to the address:
- `?touch=1` or `?touch=0` forces the touch controls on or off.
- `?guards=0` gives an empty level.
- `?nolock=1` never captures the mouse.
- `?view=side` loads the side-on build.

## Running it

Needs Node 22 or later.

```sh
npm install
npm run dev        # dev server, running through the Cloudflare Workers runtime
npm run build      # typecheck, then production build into dist/
npm run preview    # serve the production build locally in the Workers runtime
```

## Checks

```sh
npm run typecheck
npm run lint       # oxlint
npm test           # Vitest unit tests for the game logic
npm run test:e2e   # Playwright: drives every move, first person and side-on, on desktop and Fold-sized screens
```

The first time you run the browser tests on a new machine, install their browser with `npx playwright install chromium`.

## Tuning

Every starting value (speeds, jump, grip, blink range and charges, light, guards, combat) is in [`src/fps/tuning.ts`](src/fps/tuning.ts) for first person, and [`src/game/tuning.ts`](src/game/tuning.ts) for the side-on build.

## Deploying

`npm run deploy` builds the game and deploys it to Cloudflare Workers with wrangler.
