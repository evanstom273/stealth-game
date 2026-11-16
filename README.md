# stealth-game

A stealth game in the Stylised Geometry art style. The design lives in [`STEALTH_GAME_DESIGN.md`](STEALTH_GAME_DESIGN.md); the art style in [`stylised-geometry/`](stylised-geometry/).

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
npm test           # Vitest unit tests
npm run test:e2e   # Playwright: boots the game in Chromium, fails on any error
```

The first time you run the browser test on a new machine, install its browser with `npx playwright install chromium`.

## Deploying

`npm run deploy` builds the game and deploys it to Cloudflare Workers with wrangler. It hasn't been deployed yet.
