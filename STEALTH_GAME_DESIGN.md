# GAME_DESIGN.md

Authoritative, living record of the game's design. Timestamps are Europe/London, ISO 8601 with UTC offset, recorded at the time the decision was confirmed in conversation unless marked otherwise.

---

## A. Project Overview

A **stealth game** (History #1), drawn in the **Stylised Geometry** art style (History #2). Working title: none yet; the repository is `stealth-game`.

**Where the project stands (as of 2026-11-16T05:36:10+00:00):**
- Living design document created (History #4).
- Art style reference added to the repository as `stylised-geometry/` (History #2).
- Nothing built yet.

**Stack:** React, Vite, TypeScript, Tailwind CSS, Phaser, IndexedDB via Dexie.js and Cloudflare Workers: Lyra's normal stack (History #3). What each part handles is not decided yet.

**Art style:** Stylised Geometry, kept in `stylised-geometry/`: the guide (`STYLISED_GEOMETRY.md`) and seven SVG reference sheets. In short: characters built from simple geometric shapes, with faces and floating hands, in a dark world lit around them, all drawn from shapes in code or SVG rather than sprites. The guide is the reference for how things look; this document records the game's own design.

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

### Technical architecture / platform
- **Stack: React, Vite, TypeScript, Tailwind CSS, Phaser, IndexedDB via Dexie.js, Cloudflare Workers.** *(2026-11-16T05:36:10+00:00 — History #3)*

### Documentation
- **Living `GAME_DESIGN.md`**, using the format of Lyra's previous project's design document, filled in with everything decided and done as the project goes. *(2026-11-16T05:36:10+00:00 — History #4)*

---

## C. Current Development Scope

Nothing in development yet. The repository holds this document, the README and the `stylised-geometry/` art style reference.

---

## D. Future Possibilities

*Proposals only — not confirmed features.*

- None yet.

---

## E. Open Questions

1. **Title.**
2. **Everything about the game itself.**
3. **What each part of the stack handles**, physics and deployment included.

---

## F. Implementation Status

*Updated 2026-11-16T05:36:10+00:00.*

| Feature | Status | Notes |
|---|---|---|
| Design doc | Done | `GAME_DESIGN.md`. *(2026-11-16T05:36:10+00:00)* |
| Art style reference | Added | `stylised-geometry/`, unpacked from `stylised-geometry.zip` as supplied. *(2026-11-16T05:36:10+00:00)* |

### Known issues and limitations
- The style guide says `make_sheets.py` regenerates the reference sheets, but that script wasn't in the zip, so the sheets can't be regenerated from this repository.

### Implementation interpretations (technical, not design decisions — flag if wrong)
- The guiding principles in §A and the "explain before adding" and merge-to-`main` standing orders in §H were carried over from Lyra's previous design document rather than restated for this project.
- The art style zip was committed unpacked, as the `stylised-geometry/` folder, rather than as the `.zip` file itself, since the guide is written to be copied into a project as a folder.

---

## G. Decision History

*Append-only. Changed decisions are recorded as new entries; earlier entries are preserved.*

| # | Timestamp (Europe/London) | Category | Decision |
|---|---|---|---|
| 1 | 2026-11-16T05:36:10+00:00 | Concept | A stealth game. |
| 2 | 2026-11-16T05:36:10+00:00 | Art | Art style: Stylised Geometry (`stylised-geometry/`). |
| 3 | 2026-11-16T05:36:10+00:00 | Technical | Stack: React, Vite, TypeScript, Tailwind CSS, Phaser, IndexedDB via Dexie.js, Cloudflare Workers (Lyra's normal stack). |
| 4 | 2026-11-16T05:36:10+00:00 | Documentation | Living `GAME_DESIGN.md`, using the format of Lyra's previous project's design document. |

---

## H. Technical Notes

- **Repository:** `evanstom273/stealth-game`. Working branch `ccr-cbb584dc-kvemny`.
- **Art style reference:** `stylised-geometry/STYLISED_GEOMETRY.md` and `stylised-geometry/sheets/01-anatomy.svg` to `07-colour.svg`. The guide was developed in a side-on platformer; rules it marks **(untested)** haven't been through a real game yet.
- **Explain before adding** *(carried over from Lyra's previous design document)*: before building anything, Claude says what it's about to add and how, then waits for the go-ahead.
- **Workflow** *(Lyra's standing order across all her projects)*: after committing to the working branch, always merge straight to `main` as well; no need to ask each time.
