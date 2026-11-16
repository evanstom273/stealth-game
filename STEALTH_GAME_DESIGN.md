# STEALTH_GAME_DESIGN.md

Authoritative, living record of the game's design. Timestamps are Europe/London, ISO 8601 with UTC offset, recorded at the time the decision was confirmed in conversation unless marked otherwise.

---

## A. Project Overview

A **stealth game** (History #1), drawn in the **Stylised Geometry** art style (History #2). Working title: none yet; the repository is `stealth-game`.

**Where the project stands (as of 2026-11-16T05:49:12+00:00):**
- Living design document created (History #4), since renamed `STEALTH_GAME_DESIGN.md` (History #5).
- Art style reference added to the repository as `stylised-geometry/` (History #2), including `make_sheets.py`.
- Project scaffold built and tested (History #7–#10): an empty Phaser scene inside React, served through Cloudflare Workers. Nothing game-related yet.

**Stack:** React, Vite, TypeScript, Tailwind CSS, Phaser, IndexedDB via Dexie.js and Cloudflare Workers: Lyra's normal stack (History #3).
- **React** is the outer shell; **Phaser** (v4) runs the game inside a single React component (History #7, #9).
- **Tailwind** styles anything React draws.
- **Dexie** comes in when there's first something to save (History #8).
- **Cloudflare Workers** serves the built game, with no server code yet. Whether that's where the game is deployed is still open.

**Art style:** Stylised Geometry, kept in `stylised-geometry/`: the guide (`STYLISED_GEOMETRY.md`), seven SVG reference sheets and `make_sheets.py`, which regenerates them. In short: characters built from simple geometric shapes, with faces and floating hands, in a dark world lit around them, all drawn from shapes in code or SVG rather than sprites. The guide is the reference for how things look; this document records the game's own design.

**Guiding principles** *(carried over from Lyra's previous project's design document; flag if any don't apply here)*:
- Discuss → Decide → Document → Implement → Test → Expand.
- Small, polished and functional beats large and placeholder-filled.
- The creative director (Lyra) makes design decisions; recommendations are not decisions until approved.

---

## B. Confirmed Design Decisions

### Concept
- **A stealth game.** *(2026-11-16T05:36:10+00:00 — History #1)*

### Art and presentation
- **Art style: Stylised Geometry**, as set out in `stylised-geometry/STYLISED_GEOMETRY.md` and its reference sheets. *(2026-11-16T05:36:10+00:00 — History #2)*

### Development approach
- **Not one-shotting the game.** It's built a piece at a time, the way Lyra built a previous project: each piece is made, tested, refined, tested and refined further before moving on to the next. *(2026-11-16T05:43:12+00:00 — History #6)*

### Technical architecture / platform
- **Stack: React, Vite, TypeScript, Tailwind CSS, Phaser, IndexedDB via Dexie.js, Cloudflare Workers.** *(2026-11-16T05:36:10+00:00 — History #3)*
- **React is the outer shell; Phaser runs inside one React component.** Phaser runs the game; React handles whatever sits around it later, such as menus or overlays. Claude's recommendation, approved. *(2026-11-16T05:49:12+00:00, documentation time — History #7)*
- **Dexie is added when there's first something to save**, not as an empty database in the scaffold. Claude's recommendation, approved. *(2026-11-16T05:49:12+00:00, documentation time — History #8)*
- **Phaser 4** (4.2.1 at scaffold time, the current stable release). *(2026-11-16T05:49:12+00:00, documentation time — History #9)*

### Testing
- **Vitest for logic, plus a Playwright smoke test** that boots the game in a real browser and fails if the canvas doesn't appear or anything errors. Claude's recommendation, approved. *(2026-11-16T05:49:12+00:00, documentation time — History #10)*

### Documentation
- **Living `STEALTH_GAME_DESIGN.md`**, using the format of Lyra's previous project's design document, filled in with everything decided and done as the project goes. Originally `GAME_DESIGN.md`; renamed by Lyra. *(2026-11-16T05:36:10+00:00 — History #4; renamed 2026-11-16T05:38:21+00:00 — History #5)*

---

## C. Current Development Scope

The scaffold is built and tested (see §F). Nothing else is in development; the next piece hasn't been chosen.

---

## D. Future Possibilities

*Proposals only — not confirmed features.*

- None yet.

---

## E. Open Questions

1. **Title.**
2. **Everything about the game itself.**
3. **What each part of the stack handles.** ~~React~~ (#7); ~~Dexie~~ (#8). Still open: physics, whether the game is deployed on Cloudflare Workers, and anything server-side.

---

## F. Implementation Status

*Updated 2026-11-16T05:49:12+00:00.*

| Feature | Status | Notes |
|---|---|---|
| Design doc | Done | `STEALTH_GAME_DESIGN.md` (originally `GAME_DESIGN.md`). *(2026-11-16T05:36:10+00:00; renamed 2026-11-16T05:38:21+00:00)* |
| Art style reference | Added | `stylised-geometry/`, unpacked from `stylised-geometry.zip` as supplied; `sheets/make_sheets.py` added by Lyra. *(2026-11-16T05:36:10+00:00; script 2026-11-16T05:37:53+00:00)* |
| Project scaffold | Done | Vite, React, TypeScript (strict), Tailwind v4, Phaser 4.2.1, and the Cloudflare Vite plugin with `wrangler`. One empty scene; the style guide's colour tokens in `src/game/style/tokens.ts`. Typecheck, lint and build pass; the Playwright smoke test passes in development and was checked to fail when the scene throws; the production build runs in the Workers runtime with one canvas and no console errors. *(2026-11-16T05:49:12+00:00)* |

### Known issues and limitations
- None yet.

### Implementation interpretations (technical, not design decisions — flag if wrong)
- The guiding principles in §A and the "explain before adding" and merge-to-`main` standing orders in §H were carried over from Lyra's previous design document rather than restated for this project.
- The art style zip was committed unpacked, as the `stylised-geometry/` folder, rather than as the `.zip` file itself, since the guide is written to be copied into a project as a folder.
- **Linter: oxlint, not ESLint.** The scaffold plan said ESLint from Vite's template, but the template now ships oxlint, so that's what's used.
- **Colour tokens** cover the whole colour-jobs table in the guide's §5.1, so they include power-light (`#cfeaff`) and hot tell (`#fff0d8`) as well as the seven in §12.4. The guide's squash, light-radius and hit-stop numbers are left out until something moves, because they were tuned for a platformer.
- **The scene's background is `#14141c`**, the reference sheets' backdrop, until worlds get their own palettes (guide §5.3).
- **The canvas resizes to fill the window** (Phaser's `RESIZE` scale mode). No fixed resolution or aspect ratio has been decided.
- **Vite's 500 kB chunk-size warning is raised to 2 MB**, because Phaser alone is about 1.5 MB minified (about 425 kB gzipped) and would trip it on every build.
- **`@playwright/test` is pinned to 1.63.0**, to match the browser installed in Claude's cloud environment. On a new machine, `npx playwright install chromium` fetches the matching browser.
- **Vitest passes with no tests** for now, as there's no game logic to test yet.

---

## G. Decision History

*Append-only. Changed decisions are recorded as new entries; earlier entries are preserved.*

| # | Timestamp (Europe/London) | Category | Decision |
|---|---|---|---|
| 1 | 2026-11-16T05:36:10+00:00 | Concept | A stealth game. |
| 2 | 2026-11-16T05:36:10+00:00 | Art | Art style: Stylised Geometry (`stylised-geometry/`). |
| 3 | 2026-11-16T05:36:10+00:00 | Technical | Stack: React, Vite, TypeScript, Tailwind CSS, Phaser, IndexedDB via Dexie.js, Cloudflare Workers (Lyra's normal stack). |
| 4 | 2026-11-16T05:36:10+00:00 | Documentation | Living `GAME_DESIGN.md`, using the format of Lyra's previous project's design document. |
| 5 | 2026-11-16T05:38:21+00:00 *(commit time)* | Documentation | Design doc renamed from `GAME_DESIGN.md` to `STEALTH_GAME_DESIGN.md` (Lyra). |
| 6 | 2026-11-16T05:43:12+00:00 | Workflow | Not one-shotting the game: each piece is made, tested, refined, tested and refined further before moving on (as in Lyra's previous project). |
| 7 | 2026-11-16T05:49:12+00:00 *(documentation time)* | Technical | React is the outer shell; Phaser runs the game inside one React component (Claude's recommendation, approved). |
| 8 | 2026-11-16T05:49:12+00:00 *(documentation time)* | Technical | Dexie is added when there's first something to save, not in the scaffold (Claude's recommendation, approved). |
| 9 | 2026-11-16T05:49:12+00:00 *(documentation time)* | Technical | Phaser 4 (4.2.1 at scaffold time). |
| 10 | 2026-11-16T05:49:12+00:00 *(documentation time)* | Testing | Vitest for logic, plus a Playwright smoke test that boots the game in a real browser (Claude's recommendation, approved). |

---

## H. Technical Notes

- **Repository:** `evanstom273/stealth-game`. Working branch `ccr-cbb584dc-kvemny`.
- **Art style reference:** `stylised-geometry/STYLISED_GEOMETRY.md` and `stylised-geometry/sheets/01-anatomy.svg` to `07-colour.svg`, regenerated by `stylised-geometry/sheets/make_sheets.py` (Python standard library only; takes the output folder as its one argument). The guide was developed in a side-on platformer; rules it marks **(untested)** haven't been through a real game yet.
- **Project layout:** `src/main.tsx` and `src/App.tsx` (React shell); `src/game/PhaserGame.tsx` (the React component holding the canvas); `src/game/createGame.ts` (Phaser config); `src/game/scenes/` (scenes); `src/game/style/tokens.ts` (the art style's colour tokens); `tests/e2e/` (Playwright); `wrangler.jsonc` (Cloudflare). Commands are in the README.
- **Explain before adding** *(carried over from Lyra's previous design document)*: before building anything, Claude says what it's about to add and how, then waits for the go-ahead.
- **Workflow** *(Lyra's standing order across all her projects)*: after committing to the working branch, always merge straight to `main` as well; no need to ask each time.
