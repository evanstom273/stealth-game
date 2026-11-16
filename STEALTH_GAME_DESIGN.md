# STEALTH_GAME_DESIGN.md

Authoritative, living record of the game's design. Timestamps are Europe/London, ISO 8601 with UTC offset, recorded at the time the decision was confirmed in conversation unless marked otherwise.

---

## A. Project Overview

A **side-on stealth game** (History #1, #15), drawn in the **Stylised Geometry** art style (History #2). The player is **a thief who's small and out of place** (History #16). Working title: none yet; the repository is `stealth-game`.

**Where the project stands (as of 2026-11-16T06:28:40+00:00):**
- Living design document created (History #4), since renamed `STEALTH_GAME_DESIGN.md` (History #5).
- Art style reference added to the repository as `stylised-geometry/` (History #2), including `make_sheets.py`.
- Project scaffold built and tested (History #7–#10): an empty Phaser scene inside React, served through Cloudflare Workers. Nothing game-related yet.
- How we work is set out below: Depth Before Breadth, Artifacts as a visual workshop, and structured rounds of design questions (History #11–#13).
- Lyra is deploying the scaffold to Cloudflare Workers (History #14).
- Designing the player: look settled (History #15–#25); climbing and ground movement settled (History #26, #28–#31); blink's rules and look settled (History #27, #32–#36).

**Stack:** React, Vite, TypeScript, Tailwind CSS, Phaser, IndexedDB via Dexie.js and Cloudflare Workers: Lyra's normal stack (History #3).
- **React** is the outer shell; **Phaser** (v4) runs the game inside a single React component (History #7, #9).
- **Tailwind** styles anything React draws.
- **Dexie** comes in when there's first something to save (History #8).
- **Cloudflare Workers** serves the built game, with no server code yet, and it's where the game is deployed (History #14).

**Art style:** Stylised Geometry, kept in `stylised-geometry/`: the guide (`STYLISED_GEOMETRY.md`), seven SVG reference sheets and `make_sheets.py`, which regenerates them. In short: characters built from simple geometric shapes, with faces and floating hands, in a dark world lit around them, all drawn from shapes in code or SVG rather than sprites. The guide is the reference for how things look; this document records the game's own design.

**Guiding principles** *(carried over from Lyra's previous project's design document; flag if any don't apply here)*:
- ~~Discuss → Decide → Document → Implement → Test → Expand.~~ Superseded by the workflow in Depth Before Breadth, below (History #11).
- Small, polished and functional beats large and placeholder-filled.
- The creative director (Lyra) makes design decisions; recommendations are not decisions until approved.

### Development Philosophy: Depth Before Breadth

*Lyra's own words. (2026-11-16T05:51:48+00:00 — History #11)*

I want us to prioritise making existing mechanics genuinely polished, satisfying and fully functional before introducing new ones.

This doesn't mean limiting the game's ambition or avoiding complex systems. It means building that complexity gradually, on strong foundations.

Our workflow should be:

**Design → Implement → Test → Refine → Test Again → Refine Further → Move On.**

- **Depth before breadth:** Make each mechanic feel excellent before expanding the game with additional mechanics, enemies, levels or systems.
- **Iterative development:** Nothing should be considered finished simply because it works technically. It needs to feel good in actual gameplay.
- **Playtesting drives decisions:** If something feels awkward, frustrating, too easy or too difficult, we adjust it. We should be willing to substantially change or remove mechanics.
- **No one-shotting:** Don't attempt to build entire interconnected systems in one enormous implementation. Break development into manageable, independently testable stages.
- **Polish before expansion:** Animations, responsiveness, feedback, AI behaviour and interactions deserve attention before we move on.
- **Document everything:** Record decisions, refinements and reversals in `STEALTH_GAME_DESIGN.md`, including why changes were made.
- **Creative control:** Suggest improvements and possibilities, but don't treat recommendations as approved decisions.

Our previous simple-shooter project demonstrated why this works. Through repeated testing, we fundamentally improved movement, enemy behaviour, health, combat balance and weapons. Those refinements gave the game its identity.

The goal isn't to make a small game. It's to build an ambitious game one exceptionally well-developed system at a time.

I'd rather have one brilliant, polished stealth encounter than ten levels of shallow, unfinished mechanics.

### Development Workflow: Use Claude Artifacts for Visual Design and Prototyping

*Lyra's own words. (2026-11-16T05:51:48+00:00 — History #12)*

I want us to make extensive use of Claude's Artifacts throughout development, particularly for smaller, self-contained design tasks.

Rather than immediately implementing every idea into the game, we should use Artifacts as a visual workshop where we can experiment, review, refine and approve designs before committing them to the codebase.

Examples include:

- **Character designs:** Draw characters, guards, enemies and NPCs in our established Stylised Geometry art style. Show different appearances, expressions, poses and animations.
- **Animation previews:** Demonstrate movement, idle animations, patrol behaviour, detection reactions and other visual effects.
- **Environment concepts:** Mock up individual rooms, obstacles, hiding places, platforms and environmental features.
- **Gameplay mechanics:** Create small interactive prototypes to demonstrate ideas before implementing them in the actual game.
- **UI and HUD:** Design and preview menus, detection indicators, health displays, interaction prompts and other interface elements.
- **Side-by-side comparisons:** Present multiple visual options so I can compare them, choose elements I like and request changes.

The important principles:

1. **Show, don't just describe.** Whenever a design decision would benefit from seeing something, offer to create an Artifact rather than relying entirely on written descriptions.
2. **Iterate visually.** We should be able to experiment with different designs and refine them repeatedly before approval.
3. **Keep Artifacts focused.** They're for individual designs, small prototypes and experiments, not for building the entire game separately.
4. **Respect the art style.** Character and environment concepts should follow our Stylised Geometry reference unless we're deliberately exploring alternatives.
5. **Don't implement prematurely.** An Artifact is an opportunity to explore an idea, not automatic permission to add it to the game.
6. **Transfer approved designs into the game.** Once we're happy with something, use the approved design as the reference for implementation.
7. **Document decisions.** Record approved designs and relevant decisions in `STEALTH_GAME_DESIGN.md`.

This worked particularly well in our previous simple-shooter project, where visual concepts and mockups helped us develop characters, enemies, environments and bosses.

The philosophy is simple: **design it, see it, refine it, approve it, then build it.**

Use Artifacts proactively whenever they would make a design discussion more productive, but always leave the final creative decisions to me.

### Design Workflow: Structured Questions and Collaborative Decision-Making

*Lyra's own words. (2026-11-16T05:51:48+00:00 — History #13)*

I want you to actively guide me through designing the game's mechanics, characters, enemies, environments and systems using structured rounds of questions, just as we've done successfully in my previous projects.

How this should work:

1. **Ask focused questions.** When we're designing something, break it down into its individual components rather than asking one enormous, open-ended question.
2. **Provide multiple-choice options.** For each question, offer several distinct, well-considered possibilities, with brief explanations where useful. Always include the freedom for me to suggest something different or combine options.
3. **Group related questions.** Ask several questions together when they concern the same aspect of a feature. For example, when designing a guard, we might first decide its appearance and movement, then its detection behaviour, then its reactions and animations.
4. **Work through multiple rounds.** Don't try to settle every detail in one batch. Use my answers to inform the next set of questions, progressively developing the design.
5. **Make recommendations without making decisions.** You're welcome to explain which options you think would work best and why, but the final creative decisions belong to me.
6. **Consider the details.** Don't stop at the headline mechanic. Explore how something feels, behaves, looks, sounds, interacts with other systems and communicates information to the player.
7. **Record approved decisions.** Update `STEALTH_GAME_DESIGN.md` with what we've agreed, including important reasoning and subsequent changes.
8. **Implement only when the design is sufficiently settled.** Once we've agreed on the relevant details, explain the proposed implementation and wait for my approval before building.

**Example:** When designing a guard, don't simply ask whether it should patrol. Explore how it patrols, what it can see, what it can hear, how it communicates suspicion, how it investigates disturbances, what happens when it detects the player, and how it eventually returns to normal behaviour.

We don't necessarily need to decide all of these immediately. The point is to explore each feature properly, in manageable rounds.

Combine this with our other principles:

- Depth before breadth.
- Build, test and refine repeatedly.
- Use Claude Artifacts for visual concepts and small prototypes.
- Document decisions and reversals.
- Never mistake a suggestion for an approved design.

I want the process to feel like a genuine collaborative game design session, with you presenting thoughtful possibilities and me directing the creative vision.

Don't rush through the questions simply to get to implementation. The design process is part of what I enjoy.

---

## B. Confirmed Design Decisions

### Concept
- **A stealth game.** *(2026-11-16T05:36:10+00:00 — History #1)*
- **Side-on view**, like a platformer. The Stylised Geometry guide was built and proven side-on; its top-down and isometric rules are untested. Claude's recommendation, approved. *(2026-11-16T05:57:44+00:00 — History #15)*

### The player
- **A thief who's small and out of place.** Lyra chose both "a thief" (breaking in to take something) and "small and out of place" (sneaking past things far bigger than it; stealth as vulnerability). *(2026-11-16T05:57:44+00:00 — History #16)*
- **Fades in shadow; the eyes stay lit.** The player's body dims when hidden while the eyes stay bright, so how visible the player is reads straight off the player. This deliberately breaks the style's rule that characters are never darkened, for the player only. Claude's recommendation, approved. *(2026-11-16T05:57:44+00:00 — History #17)*
- **An expert thief.** Small but brilliant at this: confident, a bit smug, and its size is an advantage it knows how to use. *(2026-11-16T06:00:59+00:00 — History #18)*
- **Body: No. 7, "Stacked"** from the Thief Line-up: a small circle head on a rounded trapezoid body. Lyra's pick; proportions still to be refined. *(2026-11-16T06:09:50+00:00 — History #20)*
- **Face: mask + mouth.** A dark mask band across the eyes (white eyes with pupils inside it) and a mouth below; the line-up drew the mouth as a smirk. Lyra's pick. *(2026-11-16T06:09:50+00:00 — History #21)*
- **Head kept as drawn.** The small head stays; the face's readability at game size will be handled another way, such as the player's size in the game. *(2026-11-16T06:13:40+00:00 — History #22)*
- **Resting mouth: the smirk.** Lopsided, turned up on the side it's facing: smug, in control, enjoying it. Claude's recommendation, approved. *(2026-11-16T06:13:40+00:00 — History #23)*
- **Dark gloves.** The floating hands are the same dark as the mask rather than the body's white, so mask and gloves read as one thief's kit. A deliberate break from the guide's "hands in the body's fill". *(2026-11-16T06:13:40+00:00 — History #24)*
- **Mask: B, band with ties.** The dark band knotted at the back of the head, with two notched tails of slightly different lengths that hang down-back at rest and trail behind when it moves, so speed and direction read off the mask. Chosen from the Thief Mask Fitting; Claude's favourite too. *(2026-11-16T06:14:56+00:00 — History #25)*

### Player movement
*Lyra calls the thief "he". Free climbing and blink are Lyra's examples of how she wants him to move; the rest is refined from them.*
- **Free climbing.** He can climb anywhere: across walls, across ceilings, everything. *(2026-11-16T06:16:30+00:00 — History #26)*
  - **Limits** (so it can't get him past everything): **grip** (he can only hold on so long, especially upside down on ceilings, and recovers on floors and ledges); **slow and noisy** (climbing is slower than running, and some surfaces make noise guards can hear); **guards look up** (suspicious guards check ceilings and high walls, so up isn't automatically safe). Unclimbable surfaces, Claude's recommendation, were not chosen. *(2026-11-16T06:19:39+00:00 — History #28)*
  - **Hangs by his hands.** Upright on walls with the gloves gripping; hangs from ceilings by his hands with his body dangling. The gloves are his climbing tool. Claude's recommendation, approved. *(2026-11-16T06:19:39+00:00 — History #29)*
  - **Controls: press to grab, press to let go.** A toggle rather than holding a button. *(2026-11-16T06:19:39+00:00 — History #30)*
- **Blink.** He has a blink ability. *(2026-11-16T06:16:30+00:00 — History #27)*
  - **Aimed, and it can go through thin walls**, doors and floors. Chosen over line-of-sight only (Claude's recommendation) and a fixed short hop. *(2026-11-16T06:27:40+00:00 — History #32)*
  - **Charges that work like spells in Dark Souls:** a set number of blinks that only reset at checkpoints, not over time. *(2026-11-16T06:27:40+00:00 — History #33)*
  - **Guards can notice it:** a blink makes a flash or sound, so blinking near guards is a risk. *(2026-11-16T06:27:40+00:00 — History #34)*
  - **Lands gripping:** blink onto a wall or ceiling and he arrives already holding on, so blink and climbing work as one move set. Claude's recommendation, approved. *(2026-11-16T06:27:40+00:00 — History #35)*
  - **Look: turning to dust.** He crumbles into dust from the head down (the guide's small dust squares, in his own colours), and the dust gathers back into him at the far end. Lyra's own option, chosen from the Thief Blink Studies over pop and ring (Claude's pick), shatter and reassemble, and shadow streak. To watch in playtesting: the study takes about a second to re-form him, which may feel slow in play; and crumbling may read like a death once he can die. *(2026-11-16T06:28:40+00:00 — History #36)*
- **On the ground:** walk, plus **sneak** (slow, near-silent), **run** (fast but noisy), **jump**, and **slide or roll** (under low gaps and closing doors). *(2026-11-16T06:19:39+00:00 — History #31)*

### Art and presentation
- **Art style: Stylised Geometry**, as set out in `stylised-geometry/STYLISED_GEOMETRY.md` and its reference sheets. *(2026-11-16T05:36:10+00:00 — History #2)*
- **Bodies aren't limited to one primitive.** A character can be a polygon, or several shapes stacked or combined, for more varied body types than a single square or circle. Lyra's note; the guide agrees (§3.1 step 1, §4.2). *(2026-11-16T06:00:59+00:00 — History #19)*

### Development approach
- **Not one-shotting the game.** It's built a piece at a time, the way Lyra built a previous project: each piece is made, tested, refined, tested and refined further before moving on to the next. *(2026-11-16T05:43:12+00:00 — History #6)*
- **Depth before breadth.** Each mechanic is made polished, satisfying and fully functional before new ones are added. Workflow: Design → Implement → Test → Refine → Test Again → Refine Further → Move On. In full in §A. *(2026-11-16T05:51:48+00:00 — History #11)*
- **Claude Artifacts as a visual workshop.** Characters, animations, environments, small mechanic prototypes and UI are designed, compared and refined in Artifacts, approved by Lyra, then used as the reference for implementation. In full in §A. *(2026-11-16T05:51:48+00:00 — History #12)*
- **Structured rounds of design questions.** Claude guides design through grouped, focused multiple-choice questions over several rounds, with recommendations but no decisions; implementation only once the design is settled and the plan approved. In full in §A. *(2026-11-16T05:51:48+00:00 — History #13)*

### Technical architecture / platform
- **Stack: React, Vite, TypeScript, Tailwind CSS, Phaser, IndexedDB via Dexie.js, Cloudflare Workers.** *(2026-11-16T05:36:10+00:00 — History #3)*
- **React is the outer shell; Phaser runs inside one React component.** Phaser runs the game; React handles whatever sits around it later, such as menus or overlays. Claude's recommendation, approved. *(2026-11-16T05:49:12+00:00, documentation time — History #7)*
- **Dexie is added when there's first something to save**, not as an empty database in the scaffold. Claude's recommendation, approved. *(2026-11-16T05:49:12+00:00, documentation time — History #8)*
- **Phaser 4** (4.2.1 at scaffold time, the current stable release). *(2026-11-16T05:49:12+00:00, documentation time — History #9)*
- **Deployed on Cloudflare Workers.** *(2026-11-16T05:51:48+00:00 — History #14)*

### Testing
- **Vitest for logic, plus a Playwright smoke test** that boots the game in a real browser and fails if the canvas doesn't appear or anything errors. Claude's recommendation, approved. *(2026-11-16T05:49:12+00:00, documentation time — History #10)*

### Documentation
- **Living `STEALTH_GAME_DESIGN.md`**, using the format of Lyra's previous project's design document, filled in with everything decided and done as the project goes. Originally `GAME_DESIGN.md`; renamed by Lyra. *(2026-11-16T05:36:10+00:00 — History #4; renamed 2026-11-16T05:38:21+00:00 — History #5)*

---

## C. Current Development Scope

The scaffold is built and tested (see §F). **In design: the player.** Two rounds of questions are done (view, who the player is, how they look when hidden; skill, and which shapes and faces to draw). Body and face picked from the Thief Line-up (#20, #21); round 3 settled the head, mouth and hands (#22–#24); the band with ties chosen as the mask (#25). The player's look is settled apart from how the gloves read in light. Movement: free climbing and ground movement settled (#26, #28–#31); blink's rules and look settled (#27, #32–#36); next, the first playable piece of the game.

Shortlisted for visual comparison (options, not decisions):
- **Bodies:** square, rounded square, circle and triangle (all four picked), plus stacked and polygon builds following Lyra's note (#19).
- **Faces:** thief's mask, two eyes and a mouth, two eyes and no mouth; these can combine.

**Thief Line-up** (Artifact, round 2 visual options): https://claude.ai/artifact/JJtcAFFG3k7kV3fym82UXV. It shows eight bodies (Nos. 1–4: square, rounded square, circle, triangle; Nos. 5–8: hooded, teardrop, stacked, leaning), four faces (mask, mask + mouth, eyes + mouth, eyes only), a light slider, each body at game size, and a walk through a lamp's light. Things Claude drew that weren't asked for, all up for rejection: Nos. 5–8, a smirk on the faces with a mouth, mask + mouth as a combined face, the look of the lit eyes, how far the player fades (to about 12% brightness), and the guide's default hands and feet.

**Thief Mask Fitting** (Artifact, round 3): https://claude.ai/artifact/3qpxJDtQ17eQkx3taQwPiN. No. 7 with the smirk and dark gloves in three masks: A, plain band; B, band with ties (knotted at the back, two notched tails that trail when moving and drop at rest); C, domino (dips between the eyes, outer corners flick up just past the head). Each in light and full shadow, at S = 48, 64 and 80 px, and walking under a lamp. Claude's choices, up for change: the tie and domino details, and gloves matching the mask's dark.

**Thief Blink Studies** (Artifact, blink looks): https://claude.ai/artifact/G34hV17S54p8gSnqsmDbZU. Four looping test rooms, one per look: A, pop and ring; B, shatter and reassemble (pieces of his own shapes); C, shadow streak; D, turning to dust (Lyra's option, drawn as crumbling into the guide's dust squares from the head down and gathering back at the far end). In each he aims through a thin wall, blinks to the far floor, back, then up to the ceiling, landing gripping. Claude's choices, up for change: power blue for the aim line, landing marker and rings; a first take on the hanging pose; lit eye streaks in the shadow streak; the reading of "turning to dust"; all timings.

---

## D. Future Possibilities

*Proposals only — not confirmed features.*

- None yet.

---

## E. Open Questions

1. **Title.**
2. **Everything about the game itself.**
3. **Blink details** (#27, #32–#36): how many charges; its range; what counts as a thin wall; exactly what guards notice and from how far.
4. **The player's size, in the game and next to the guards.** Decided when the guards are designed. Keeping the head small (#22) means the face needs the player to be big enough on screen to read.
5. **What each part of the stack handles.** ~~React~~ (#7); ~~Dexie~~ (#8); ~~deployment~~ (Cloudflare Workers, #14). Still open: physics, and anything server-side.

---

## F. Implementation Status

*Updated 2026-11-16T05:51:48+00:00.*

| Feature | Status | Notes |
|---|---|---|
| Design doc | Done | `STEALTH_GAME_DESIGN.md` (originally `GAME_DESIGN.md`). *(2026-11-16T05:36:10+00:00; renamed 2026-11-16T05:38:21+00:00)* |
| Art style reference | Added | `stylised-geometry/`, unpacked from `stylised-geometry.zip` as supplied; `sheets/make_sheets.py` added by Lyra. *(2026-11-16T05:36:10+00:00; script 2026-11-16T05:37:53+00:00)* |
| Project scaffold | Done | Vite, React, TypeScript (strict), Tailwind v4, Phaser 4.2.1, and the Cloudflare Vite plugin with `wrangler`. One empty scene; the style guide's colour tokens in `src/game/style/tokens.ts`. Typecheck, lint and build pass; the Playwright smoke test passes in development and was checked to fail when the scene throws; the production build runs in the Workers runtime with one canvas and no console errors. *(2026-11-16T05:49:12+00:00)* |
| Deployment | In progress (Lyra) | Lyra deploying the scaffold to Cloudflare Workers. Not yet confirmed live. *(2026-11-16T05:51:48+00:00)* |

### Known issues and limitations
- None yet.

### Implementation interpretations (technical, not design decisions — flag if wrong)
- The first guiding principles in §A and the "explain before adding" and merge-to-`main` standing orders in §H were carried over from Lyra's previous design document rather than restated for this project. The three principle sections after them in §A are Lyra's, written for this project (#11–#13).
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
| 11 | 2026-11-16T05:51:48+00:00 | Workflow | Development Philosophy: Depth Before Breadth (in full in §A). Supersedes the carried-over "Discuss → Decide → Document → Implement → Test → Expand" loop with "Design → Implement → Test → Refine → Test Again → Refine Further → Move On". |
| 12 | 2026-11-16T05:51:48+00:00 | Workflow | Development Workflow: Claude Artifacts for visual design and prototyping (in full in §A). |
| 13 | 2026-11-16T05:51:48+00:00 | Workflow | Design Workflow: structured rounds of questions and collaborative decision-making (in full in §A). |
| 14 | 2026-11-16T05:51:48+00:00 | Deployment | Deployed on Cloudflare Workers (Lyra deploying the scaffold). |
| 15 | 2026-11-16T05:57:44+00:00 | Concept | Side-on view (Claude's recommendation, approved). |
| 16 | 2026-11-16T05:57:44+00:00 | Player | The player is a thief who's small and out of place (both options chosen; the question was single-select by mistake, corrected in conversation). |
| 17 | 2026-11-16T05:57:44+00:00 | Player | The player fades in shadow while the eyes stay lit, deliberately breaking the style's "characters are never darkened" rule for the player only (Claude's recommendation, approved). |
| 18 | 2026-11-16T06:00:59+00:00 | Player | An expert thief: small but brilliant, confident, a bit smug. The player's size next to the guards is left until the guards are designed. |
| 19 | 2026-11-16T06:00:59+00:00 | Art | Bodies aren't limited to one primitive: polygons and stacked or combined shapes are fair game (Lyra's note). |
| 20 | 2026-11-16T06:09:50+00:00 | Player | Body: No. 7 "Stacked" from the Thief Line-up, a small circle head on a rounded trapezoid body. |
| 21 | 2026-11-16T06:09:50+00:00 | Player | Face: mask + mouth. |
| 22 | 2026-11-16T06:13:40+00:00 | Player | Head kept as drawn; face readability at game size to be handled another way (e.g. the player's in-game size). |
| 23 | 2026-11-16T06:13:40+00:00 | Player | Resting mouth: the smirk (Claude's recommendation, approved). |
| 24 | 2026-11-16T06:13:40+00:00 | Player | Dark gloves, matching the mask, instead of hands in the body's white. |
| 25 | 2026-11-16T06:14:56+00:00 | Player | Mask: B, band with ties (from the Thief Mask Fitting). |
| 26 | 2026-11-16T06:16:30+00:00 | Player | Free climbing: he can climb across walls, ceilings, everything, with some limit (not yet decided) so it can't get him past everything. |
| 27 | 2026-11-16T06:16:30+00:00 | Player | Blink ability; details not yet decided. |
| 28 | 2026-11-16T06:19:39+00:00 | Player | Climbing limits: grip, slow and noisy, guards look up (unclimbable surfaces not chosen). |
| 29 | 2026-11-16T06:19:39+00:00 | Player | Climbing pose: hangs by his hands (Claude's recommendation, approved). |
| 30 | 2026-11-16T06:19:39+00:00 | Player | Climbing controls: press to grab, press to let go. |
| 31 | 2026-11-16T06:19:39+00:00 | Player | Ground movement: walk, sneak, run, jump, slide or roll. |
| 32 | 2026-11-16T06:27:40+00:00 | Player | Blink is aimed and can go through thin walls. |
| 33 | 2026-11-16T06:27:40+00:00 | Player | Blink charges work like Dark Souls spells: a set number, reset only at checkpoints. |
| 34 | 2026-11-16T06:27:40+00:00 | Player | Guards can notice a blink. |
| 35 | 2026-11-16T06:27:40+00:00 | Player | Blink can land on walls and ceilings, arriving gripping (Claude's recommendation, approved). |
| 36 | 2026-11-16T06:28:40+00:00 | Player | Blink look: turning to dust (Lyra's option). Watch in playtesting: re-form time, and whether it reads like a death. |

---

## H. Technical Notes

- **Repository:** `evanstom273/stealth-game`. Working branch `ccr-cbb584dc-kvemny`.
- **Art style reference:** `stylised-geometry/STYLISED_GEOMETRY.md` and `stylised-geometry/sheets/01-anatomy.svg` to `07-colour.svg`, regenerated by `stylised-geometry/sheets/make_sheets.py` (Python standard library only; takes the output folder as its one argument). The guide was developed in a side-on platformer; rules it marks **(untested)** haven't been through a real game yet.
- **Project layout:** `src/main.tsx` and `src/App.tsx` (React shell); `src/game/PhaserGame.tsx` (the React component holding the canvas); `src/game/createGame.ts` (Phaser config); `src/game/scenes/` (scenes); `src/game/style/tokens.ts` (the art style's colour tokens); `tests/e2e/` (Playwright); `wrangler.jsonc` (Cloudflare). Commands are in the README.
- **Explain before adding** *(carried over from Lyra's previous design document)*: before building anything, Claude says what it's about to add and how, then waits for the go-ahead.
- **Workflow** *(Lyra's standing order across all her projects)*: after committing to the working branch, always merge straight to `main` as well; no need to ask each time.
