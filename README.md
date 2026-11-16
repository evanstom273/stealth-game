# stealth-game

A side-on stealth game in the Stylised Geometry art style. The design lives in [`STEALTH_GAME_DESIGN.md`](STEALTH_GAME_DESIGN.md); the art style in [`stylised-geometry/`](stylised-geometry/).

Right now it's one test room with the full thief in it: walking, sneaking, running, jumping, sliding, free climbing and blinking. There are no guards yet.

## Playing

| | Keyboard and mouse | Gamepad | Touch |
|---|---|---|---|
| Move | A / D or arrows | Left stick | Stick |
| Climb up and down | W / S | Left stick | Stick |
| Run (hold) | Shift | RT | Push the stick to its edge |
| Sneak (on and off) | C | B | Sneak |
| Jump | Space | A | Jump |
| Slide | S while running | Down while running | Pull the stick down while running |
| Grab and let go | E | X | Grab |
| Blink | Hold the right mouse button to aim, let go | Hold LT, aim with the right stick, let go | Drag out from Blink, let go; slide back onto it to cancel |
| Pause | Esc | Start | Pause button |

The pause menu has restart, full screen, a debug panel (also on the backtick key) and noise rings. Add `?touch=1` or `?touch=0` to the address to force the touch controls on or off.

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
npm run test:e2e   # Playwright: drives every move on desktop and Fold-sized screens
```

The first time you run the browser tests on a new machine, install their browser with `npx playwright install chromium`.

## Tuning

Every starting value (speeds, jump, grip, blink range and charges, light) is in [`src/game/tuning.ts`](src/game/tuning.ts).

## Deploying

`npm run deploy` builds the game and deploys it to Cloudflare Workers with wrangler.
