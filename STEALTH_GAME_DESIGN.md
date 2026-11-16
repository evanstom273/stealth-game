# STEALTH_GAME_DESIGN.md

Authoritative, living record of the game's design. Timestamps are Europe/London, ISO 8601 with UTC offset, recorded at the time the decision was confirmed in conversation unless marked otherwise.

---

## A. Project Overview

A **side-on stealth game** (History #1, #15), drawn in the **Stylised Geometry** art style (History #2). The player is **a thief who's small and out of place** (History #16). Working title: none yet; the repository is `stealth-game`.

**Where the project stands (as of 2026-11-16T13:25:51+00:00):**
- Living design document created (History #4), since renamed `STEALTH_GAME_DESIGN.md` (History #5).
- Art style reference added to the repository as `stylised-geometry/` (History #2), including `make_sheets.py`.
- Project scaffold built and tested (History #7–#10): an empty Phaser scene inside React, served through Cloudflare Workers. Nothing game-related yet.
- How we work is set out below: Depth Before Breadth, Artifacts as a visual workshop, and structured rounds of design questions (History #11–#13).
- Lyra is deploying the scaffold to Cloudflare Workers (History #14).
- Designing the player: look settled (History #15–#25); climbing and ground movement settled (History #26, #28–#31); blink's rules and look settled (History #27, #32–#36).
- **The full player is built** (History #37, #45, #46) in a test room, playable with keyboard and mouse, gamepad and touch, and merged to `main`. Lyra's first playtest: good overall; grip raised and blink loosened as a result (History #47, #48).

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
- **A vision pool, not a light.** A faint pool around him lets the player see the room in the dark, but it's his eyes adjusting, not a light: it doesn't stop him fading and guards can't see it. Lamps are what light him. Claude's recommendation, approved. *(2026-11-16T06:35:14+00:00 — History #41)*
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
  - **Limits** (so it can't get him past everything): **grip** (he can only hold on so long, ~~especially upside down on ceilings,~~ and recovers on floors and ledges; walls and ceilings drain at the same rate since #49); **slow and noisy** (climbing is slower than running, and some surfaces make noise guards can hear); **guards look up** (suspicious guards check ceilings and high walls, so up isn't automatically safe). Unclimbable surfaces, Claude's recommendation, were not chosen. *(2026-11-16T06:19:39+00:00 — History #28)*
  - **Hangs by his hands.** Upright on walls with the gloves gripping; hangs from ceilings by his hands with his body dangling. The gloves are his climbing tool. Claude's recommendation, approved. *(2026-11-16T06:19:39+00:00 — History #29)*
  - **Controls: press to grab, press to let go.** A toggle rather than holding a button. *(2026-11-16T06:19:39+00:00 — History #30)*
  - **Much more grip.** After Lyra's first playtest the meter was far too small: she could barely climb one test wall, which would make climbing in real levels hard. Raised from 6 s on walls and 3 s on ceilings to 15 s and ~~7.5 s~~ (Claude's pick of how much; ceilings were kept at half the wall time until #49 made them equal). A full-height test wall now uses about half the meter. *(2026-11-16T13:14:39+00:00 — History #47)*
  - **Ceilings drain grip at the same rate as walls**: 15 s either way. The faster drain upside down came from the wording Claude wrote for the grip option ("especially upside down on ceilings"), not from a choice Lyra made, so it's gone. *(2026-11-16T13:15:23+00:00 — History #49)*
- **Blink.** He has a blink ability. *(2026-11-16T06:16:30+00:00 — History #27)*
  - **Aimed, and it can go through thin walls**, doors and floors. Chosen over line-of-sight only (Claude's recommendation) and a fixed short hop. *(2026-11-16T06:27:40+00:00 — History #32)*
  - **Charges that work like spells in Dark Souls:** a set number of blinks that only reset at checkpoints, not over time. *(2026-11-16T06:27:40+00:00 — History #33)*
  - **Guards can notice it:** a blink makes a flash or sound, so blinking near guards is a risk. *(2026-11-16T06:27:40+00:00 — History #34)*
  - **Lands gripping:** blink onto a wall or ceiling and he arrives already holding on, so blink and climbing work as one move set. Claude's recommendation, approved. *(2026-11-16T06:27:40+00:00 — History #35)*
  - **Look: turning to dust.** He crumbles into dust from the head down (the guide's small dust squares, in his own colours), and the dust gathers back into him at the far end. Lyra's own option, chosen from the Thief Blink Studies over pop and ring (Claude's pick), shatter and reassemble, and shadow streak. To watch in playtesting: the study takes about a second to re-form him, which may feel slow in play; and crumbling may read like a death once he can die. *(2026-11-16T06:28:40+00:00 — History #36)*
  - **5 charges and a longer range, for now.** After Lyra's first playtest, 3 charges felt too restrictive and the range could be a little longer: charges 3 → 5, range 5 S → 6 S. To be tested again in proper levels. *(2026-11-16T13:14:39+00:00 — History #48)*
- **On the ground:** walk, plus **sneak** (slow, near-silent), **run** (fast but noisy), **jump**, and **slide or roll** (under low gaps and closing doors). *(2026-11-16T06:19:39+00:00 — History #31)*
- **Slide from a run.** While running, press down to drop into a low slide that carries his speed under gaps and closing doors. Claude's recommendation, approved. *(2026-11-16T06:35:14+00:00 — History #42)*
- **Sneak is a toggle; run is held.** Press once to sneak until pressed again; hold to run. *(2026-11-16T06:31:36+00:00 — History #38)*

### Combat and getting spotted
- **Being spotted isn't a fail state.** No restarting the level on detection. He gets out of it by **hiding again** (breaking line of sight, getting into the dark; guards search, then give up), **getting out of reach** (climbing or blinking where guards can't follow), **fighting his way out**, or **distracting them** (which needs tools or gadgets, still to be designed). *(2026-11-16T13:24:13+00:00 — History #50)*
- **Open combat: he holds his own.** A proper fighting system (dodges, combos, finishers), so fighting is a real alternative to sneaking. Chosen over "scrappy, not a fighter" (Claude's recommendation), no open combat, and counters only. Details still to be designed. *(2026-11-16T13:24:13+00:00 — History #51)*
- **Knockout or kill is the player's choice.** Both are available, perhaps with different costs or consequences. *(2026-11-16T13:24:13+00:00 — History #52)*
- **Sneak attacks from every way he moves:** from behind on the ground, dropping from the ceiling, launching off a wall, and blinking onto a guard. Lyra's idea, confirmed. *(2026-11-16T13:24:13+00:00 — History #53)*
- **What keeps sneaking worth it:** fights are loud (blows make noise and draw more guards); sneak attacks are instant while open fights take time, and time is when others arrive; and there are rewards for staying unseen (what form not yet decided). His being fragile was not chosen. *(2026-11-16T13:25:51+00:00 — History #54)*
- **He fights with his gloved hands:** fists, kicks and grabs with the floating gloves, and no visible weapon. Kills come only from finishers. *(2026-11-16T13:25:51+00:00 — History #55)*
- **Open-combat moves: attack combos, dodge and finishers.** Parry and counter were not chosen. *(2026-11-16T13:25:51+00:00 — History #56)*
- **Health recovers in hiding:** it comes back slowly once he's out of sight, so retreating and hiding is how he heals. How much he can take isn't decided. *(2026-11-16T13:25:51+00:00 — History #57)*

### Platforms and input
- **Keyboard, gamepad and touch, all from the start.** Lyra plays on a Pixel 10 Pro Fold, so the game has to work in portrait, in landscape and on the inner folding screen, as well as on desktop. *(2026-11-16T06:31:36+00:00 — History #39)*
- **Touch: a fixed thumbstick** in the same corner for moving and climbing. *(2026-11-16T06:35:14+00:00 — History #43)*
- **Touch: drag from the blink button to aim.** The landing marker follows the finger; let go to blink, slide back onto the button to cancel. Claude's recommendation, approved. *(2026-11-16T06:35:14+00:00 — History #44)*
- **Touch layout approved from the Thief Control Layout mock-up:** buttons in a **diamond** (Jump bottom, Grab right, Sneak left, Blink top, charges as pips above Blink), and the controls **over the game** in portrait (no separate band). Run on touch is pushing the stick to its edge. Lyra approved the mock-up's other choices with it: blink charges as dust-square pips top left, a "Sneaking" tag while sneak is on, the grip bar under him, the icons, and the keyboard and gamepad map. *(2026-11-16T06:52:36+00:00 — History #45)*

### Art and presentation
- **Art style: Stylised Geometry**, as set out in `stylised-geometry/STYLISED_GEOMETRY.md` and its reference sheets. *(2026-11-16T05:36:10+00:00 — History #2)*
- **Bodies aren't limited to one primitive.** A character can be a polygon, or several shapes stacked or combined, for more varied body types than a single square or circle. Lyra's note; the guide agrees (§3.1 step 1, §4.2). *(2026-11-16T06:00:59+00:00 — History #19)*

### Development approach
- **First playable piece: the full player.** Lyra wants to test all of the player's mechanics together (look, light, ground movement, climbing, blink) rather than one at a time. Claude builds it in stages internally, testing each before the next, so it's still not one-shotted. *(2026-11-16T06:31:36+00:00 — History #37)*
- **The full-player build plan is approved** (Lyra: "Do it"), including Claude's proposed starting values to tune in play: S = 64 world px, drawn at about 56 CSS px on phones and 64 on desktop; sneak about 40% of walking speed and run about 1.8×; grip about 6 s on walls and 3 s upside down; 3 blink charges; blink range about 5 S; walls thinner than half his width count as thin. Also a stand-in checkpoint marker, a debug panel, and noise rings in place of guards for testing. *(2026-11-16T06:52:36+00:00 — History #46)*
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
- **Physics: Phaser Arcade.** Phaser's built-in box physics; the player's hitbox stays the plain shape, as the style guide asks, and climbing and blink are written on top. Claude's recommendation, approved. *(2026-11-16T06:31:36+00:00 — History #40)*

### Testing
- **Vitest for logic, plus a Playwright smoke test** that boots the game in a real browser and fails if the canvas doesn't appear or anything errors. Claude's recommendation, approved. *(2026-11-16T05:49:12+00:00, documentation time — History #10)*

### Documentation
- **Living `STEALTH_GAME_DESIGN.md`**, using the format of Lyra's previous project's design document, filled in with everything decided and done as the project goes. Originally `GAME_DESIGN.md`; renamed by Lyra. *(2026-11-16T05:36:10+00:00 — History #4; renamed 2026-11-16T05:38:21+00:00 — History #5)*

---

## C. Current Development Scope

The scaffold is built and tested (see §F). **In design: the player.** Two rounds of questions are done (view, who the player is, how they look when hidden; skill, and which shapes and faces to draw). Body and face picked from the Thief Line-up (#20, #21); round 3 settled the head, mouth and hands (#22–#24); the band with ties chosen as the mask (#25). The player's look is settled apart from how the gloves read in light. Movement: free climbing and ground movement settled (#26, #28–#31); blink's rules and look settled (#27, #32–#36). First playable piece: the full player (#37); plan and UI approved (#45, #46). **Built and merged to `main`** (see §F): Lyra's first playtest on the Fold went well; grip was far too short and blink a little tight, now raised (#47, #48). Next: test again, keep refining (Depth Before Breadth).

Shortlisted for visual comparison (options, not decisions):
- **Bodies:** square, rounded square, circle and triangle (all four picked), plus stacked and polygon builds following Lyra's note (#19).
- **Faces:** thief's mask, two eyes and a mouth, two eyes and no mouth; these can combine.

**Thief Line-up** (Artifact, round 2 visual options): https://claude.ai/artifact/JJtcAFFG3k7kV3fym82UXV. It shows eight bodies (Nos. 1–4: square, rounded square, circle, triangle; Nos. 5–8: hooded, teardrop, stacked, leaning), four faces (mask, mask + mouth, eyes + mouth, eyes only), a light slider, each body at game size, and a walk through a lamp's light. Things Claude drew that weren't asked for, all up for rejection: Nos. 5–8, a smirk on the faces with a mouth, mask + mouth as a combined face, the look of the lit eyes, how far the player fades (to about 12% brightness), and the guide's default hands and feet.

**Thief Mask Fitting** (Artifact, round 3): https://claude.ai/artifact/3qpxJDtQ17eQkx3taQwPiN. No. 7 with the smirk and dark gloves in three masks: A, plain band; B, band with ties (knotted at the back, two notched tails that trail when moving and drop at rest); C, domino (dips between the eyes, outer corners flick up just past the head). Each in light and full shadow, at S = 48, 64 and 80 px, and walking under a lamp. Claude's choices, up for change: the tie and domino details, and gloves matching the mask's dark.

**Thief Blink Studies** (Artifact, blink looks): https://claude.ai/artifact/G34hV17S54p8gSnqsmDbZU. Four looping test rooms, one per look: A, pop and ring; B, shatter and reassemble (pieces of his own shapes); C, shadow streak; D, turning to dust (Lyra's option, drawn as crumbling into the guide's dust squares from the head down and gathering back at the far end). In each he aims through a thin wall, blinks to the far floor, back, then up to the ceiling, landing gripping. Claude's choices, up for change: power blue for the aim line, landing marker and rings; a first take on the hanging pose; lit eye streaks in the shadow streak; the reading of "turning to dust"; all timings.

**Thief Control Layout** (Artifact, UI mock-up, 2026-11-16T06:46:01+00:00): https://claude.ai/artifact/SZvQfYxAyDTpgY8jjx86hn. Requested by Lyra before the full player is built. An interactive mock-up of the HUD and controls on the Fold's outer screen (portrait and landscape, about 412 × 915), its inner screen (about 790 × 820) and desktop (1280 × 720): fixed thumbstick, Jump, Grab, Sneak and Blink buttons, drag-from-Blink aiming with a range ring and landing ghost, blink charges as pips, a Sneaking tag, a grip bar, an optional debug panel, and the keyboard and gamepad map. Variants to compare: buttons in an arc or a diamond; portrait controls over the game or in a band below it. Claude's choices, up for change: run on touch by pushing the stick to its edge; charges as dust squares; the icons; the Sneaking tag; the key and button bindings; S = 56 px on phones and 64 px on desktop.

---

## D. Future Possibilities

*Proposals only — not confirmed features.*

- None yet.

---

## E. Open Questions

1. **Title.**
2. **Everything about the game itself.**
3. **Blink details** (#27, #32–#36, #48): whether 5 charges and a 6 S range hold up in proper levels; what counts as a thin wall; exactly what guards notice and from how far.
4. **How combat works** (#50–#57): how the knockout-or-kill choice is made; how sneak attacks are triggered; how much health he has and how it's shown; what the reward for staying unseen is; Attack and Dodge on the touch layout; how the gloves read as weapons when they vanish in the dark.
5. **The player's size, in the game and next to the guards.** Decided when the guards are designed. Keeping the head small (#22) means the face needs the player to be big enough on screen to read.
6. **What each part of the stack handles.** ~~React~~ (#7); ~~Dexie~~ (#8); ~~deployment~~ (Cloudflare Workers, #14). ~~physics~~ (Phaser Arcade, #40). Still open: anything server-side.

---

## F. Implementation Status

*Updated 2026-11-16T13:15:23+00:00.*

| Feature | Status | Notes |
|---|---|---|
| Design doc | Done | `STEALTH_GAME_DESIGN.md` (originally `GAME_DESIGN.md`). *(2026-11-16T05:36:10+00:00; renamed 2026-11-16T05:38:21+00:00)* |
| Art style reference | Added | `stylised-geometry/`, unpacked from `stylised-geometry.zip` as supplied; `sheets/make_sheets.py` added by Lyra. *(2026-11-16T05:36:10+00:00; script 2026-11-16T05:37:53+00:00)* |
| Project scaffold | Done | Vite, React, TypeScript (strict), Tailwind v4, Phaser 4.2.1, and the Cloudflare Vite plugin with `wrangler`. One empty scene; the style guide's colour tokens in `src/game/style/tokens.ts`. Typecheck, lint and build pass; the Playwright smoke test passes in development and was checked to fail when the scene throws; the production build runs in the Workers runtime with one canvas and no console errors. *(2026-11-16T05:49:12+00:00)* |
| Test room | Built | One room with everything to try: a lit start with a stand-in checkpoint and a rest ledge halfway up the wall, ledges, a thin wall to blink through or climb over, a thick hanging block with a 0.9 S gap only a slide fits under, a metal wall and metal ledge (loud to climb), a second checkpoint, and three lamps with dark stretches between them. `src/game/room/testRoom.ts`. *(2026-11-16T07:24:16+00:00)* |
| The thief, in the game | Built | Drawn from shapes every frame at the screen's density, exactly as approved (No. 7 body, mask with ties, smirk, dark gloves). Fades with lamp light while his eyes stay lit; ties hang at rest, trail with speed and hang down while he climbs; squash and stretch on jumps and landings; dust puffs. Poses: standing, in the air, sliding, on a wall, hanging from a ceiling. *(2026-11-16T07:24:16+00:00)* |
| Ground movement | Built | Walk, sneak (toggle), run (held), jump (hold for higher, with a little forgiveness either side of leaving the ground), slide from a run. Under something low the slide becomes a crawl until there's room to stand. *(2026-11-16T07:24:16+00:00)* |
| Climbing | Built | Press to grab, press to let go. Walls and ceilings, round corners, along undersides and up onto ledges. Grip drains (15 s on walls and ceilings alike, #47, #49) and recovers on the ground; at zero he drops. Jump kicks off a wall. Slower than running; noisy on metal. *(2026-11-16T07:24:16+00:00)* |
| Blink | Built | Aimed with a power-blue line, range ring and landing ghost. Goes through thin walls and floors, stops short of thick ones. Lands standing, gripping a wall or ceiling, or in the air. 5 charges (#48), refilled only at the stand-in checkpoints. Range 6 S. The dust effect, and a loud noise at both ends. *(2026-11-16T07:24:16+00:00)* |
| Light and darkness | Built | Darkness over the room with the lamps' pools cut out of it, his vision pool (lets you see, never lights him), lit edges on everything standable, layered lamp glows. *(2026-11-16T07:24:16+00:00)* |
| Noise | Built, nothing listens yet | Silent sneaking and standing, soft walking, loud running, landings by how hard he hits, loud on metal while climbing, loud blinks. No guards yet, so it shows only as rings when switched on in the pause menu. *(2026-11-16T07:24:16+00:00)* |
| Controls | Built | Keyboard and mouse, gamepad, and touch as approved (fixed stick with run at its edge, diamond of buttons, drag from Blink to aim). *(2026-11-16T07:24:16+00:00)* |
| HUD and menus | Built | Blink charges top left, the Sneaking tag, the pause button and menu (resume, restart room, debug panel, noise rings, full screen), the grip bar under him, and the debug panel. *(2026-11-16T07:24:16+00:00)* |
| Tests | Passing | 24 unit tests on the game logic (light, grip, noise, climbing, blink targeting); 10 Playwright tests driving every move with the keyboard, mouse and touch on desktop and Fold-sized screens. *(2026-11-16T07:24:16+00:00)* |
| Deployment | In progress (Lyra) | Lyra deploying the scaffold to Cloudflare Workers. Not yet confirmed live. *(2026-11-16T05:51:48+00:00)* |

### Known issues and limitations
- **Not yet played on the Fold.** Everything was tested in a headless browser, which renders on the CPU at about 20 fps, so real frame rate and feel on the phone are unknown. He and the darkness are redrawn on small canvases every frame; that's the first place to look if it stutters.
- **Gamepad support is untested** with a real pad; the headless browser has none.
- **The gloves barely show against the dark**, as seen in the Thief Mask Fitting. Nothing has been decided about it.
- **No guards yet**, so "guards look up" (#28) and "guards can notice a blink" (#34) have nothing to act on. Noise is measured and can be shown as rings, but nothing hears it.
- ~~**A full-height wall takes longer to climb than his grip lasts.**~~ Fixed by the grip increase (#47): a full-height test wall now uses about half the meter. The rest ledge stays in the test room for trying the under-ledge climb.

### Implementation interpretations (technical, not design decisions — flag if wrong)
- The first guiding principles in §A and the "explain before adding" and merge-to-`main` standing orders in §H were carried over from Lyra's previous design document rather than restated for this project. The three principle sections after them in §A are Lyra's, written for this project (#11–#13).
- The art style zip was committed unpacked, as the `stylised-geometry/` folder, rather than as the `.zip` file itself, since the guide is written to be copied into a project as a folder.
- **Linter: oxlint, not ESLint.** The scaffold plan said ESLint from Vite's template, but the template now ships oxlint, so that's what's used.
- **Colour tokens** cover the whole colour-jobs table in the guide's §5.1, so they include power-light (`#cfeaff`) and hot tell (`#fff0d8`) as well as the seven in §12.4. The guide's squash, light-radius and hit-stop numbers are left out until something moves, because they were tuned for a platformer.
- **The room's colours are placeholders from the reference sheets** (`#14141c` wall and so on) until worlds get their own palettes (guide §5.3).
- **The canvas fills the window at the screen's pixel density** (capped at 2×), sized by hand rather than Phaser's `RESIZE` mode so it stays crisp on the Fold. The camera zoom is set from the screen's shorter side, so he's about 56 CSS px on the phone and 64 on desktop. No fixed resolution or aspect ratio has been decided.
- **Phaser's start-up time-step clamp is off** (`fps.panicMax: 0`), so he moves at the right speed from the first frame on slower devices.
- **Vite's 500 kB chunk-size warning is raised to 2 MB**, because Phaser alone is about 1.5 MB minified (about 425 kB gzipped) and would trip it on every build.
- **`@playwright/test` is pinned to 1.63.0**, to match the browser installed in Claude's cloud environment. On a new machine, `npx playwright install chromium` fetches the matching browser.
- **Climbing details:** jump while holding a wall kicks off away from it; jump while hanging from a ceiling drops him; grab while holding on lets go. Grip drains whenever he's holding on, moving or not, and recovers only standing on a floor or ledge. Faces shorter than 0.6 S, like a ledge's edge, can't be held as walls; he climbs up onto them instead. He goes round corners on his own: up a wall into a ceiling, along a ceiling into a wall, off the end of a ceiling onto its outside face, and over the top of a wall or ledge onto it.
- **Grabbing is forgiving:** a grab pressed up to a quarter of a second early still catches a surface that comes into reach, and his hands reach over a ledge's end that's just above him, so jump-then-grab at a ledge pulls him up onto it.
- **Running overrides sneaking while it's held**; sneak stays toggled on underneath. A slide needs at least 80% of run speed.
- **Blink landing order:** standing if there's floor within 0.35 S below, otherwise holding a wall in reach, otherwise hanging from a ceiling in reach, otherwise in the air (he falls). Blink works while climbing. A thick wall cuts it short, marked by a tick on the aim line. With no aim point (a gamepad stick at rest), it aims ahead of him.
- **Noise levels:** sneaking and standing are silent, walking soft, sliding noticeable, running and blinking loud; landings scale with impact; climbing is soft, or loud on metal.
- **Lamp light:** full within 1.5 S of a lamp, fading to nothing at 6 S. Two of the three lamps hang lower than first sketched so the floor beneath them is properly lit.
- **The camera** looks 0.8 S ahead of the way he faces and keeps a little more room above him than below.
- **Testing switches** (not design): the debug panel (backtick key or the pause menu), noise rings (pause menu), and `?touch=1` or `?touch=0` in the address to force touch controls on or off. The stand-in checkpoints refill charges and do nothing else.

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
| 37 | 2026-11-16T06:31:36+00:00 | Workflow | First playable piece: the full player, so Lyra can test all his mechanics together (built in internally tested stages). |
| 38 | 2026-11-16T06:31:36+00:00 | Player | Sneak is a toggle; run is held. |
| 39 | 2026-11-16T06:31:36+00:00 | Platform | Keyboard, gamepad and touch from the start; must work on a Pixel 10 Pro Fold in portrait, landscape and on the inner screen, and on desktop. |
| 40 | 2026-11-16T06:31:36+00:00 | Technical | Physics: Phaser Arcade (Claude's recommendation, approved). |
| 41 | 2026-11-16T06:35:14+00:00 | Player | A vision pool lets the player see in the dark without lighting him; lamps are what light him (Claude's recommendation, approved). |
| 42 | 2026-11-16T06:35:14+00:00 | Player | Slide from a run: press down while running (Claude's recommendation, approved). |
| 43 | 2026-11-16T06:35:14+00:00 | Platform | Touch: a fixed thumbstick for moving and climbing. |
| 44 | 2026-11-16T06:35:14+00:00 | Platform | Touch: drag from the blink button to aim; release to blink, back onto the button to cancel (Claude's recommendation, approved). |
| 45 | 2026-11-16T06:52:36+00:00 | Platform | Touch layout: diamond buttons, controls over the game in portrait; the rest of the UI mock-up approved as drawn. |
| 46 | 2026-11-16T06:52:36+00:00 | Workflow | Full-player build plan approved, with Claude's starting values to tune in play. |
| 47 | 2026-11-16T13:14:39+00:00 | Player | Grip raised after Lyra's first playtest: 15 s on walls, 7.5 s on ceilings (was 6 s and 3 s; amount picked by Claude). |
| 48 | 2026-11-16T13:14:39+00:00 | Player | Blink, for now: 5 charges (was 3), range 6 S (was 5 S), after Lyra's first playtest. Revisit in proper levels. |
| 49 | 2026-11-16T13:15:23+00:00 | Player | Ceilings drain grip at the same rate as walls (15 s). Supersedes the "especially upside down" part of #28 and the half-rate ceilings in #47. |
| 50 | 2026-11-16T13:24:13+00:00 | Combat | Being spotted isn't a fail state: he can hide again, get out of reach, fight his way out, or distract guards (tools to be designed). |
| 51 | 2026-11-16T13:24:13+00:00 | Combat | Open combat: he holds his own, with a proper fighting system (dodges, combos, finishers). |
| 52 | 2026-11-16T13:24:13+00:00 | Combat | Knockout or kill is the player's choice. |
| 53 | 2026-11-16T13:24:13+00:00 | Combat | Sneak attacks from behind, from the ceiling, from a wall, and by blinking onto a guard. |
| 54 | 2026-11-16T13:25:51+00:00 | Combat | Sneaking stays worth it because fights are loud, sneak attacks are instant, and staying unseen is rewarded (form undecided). |
| 55 | 2026-11-16T13:25:51+00:00 | Combat | He fights with his gloved hands (fists, kicks, grabs); kills only from finishers. |
| 56 | 2026-11-16T13:25:51+00:00 | Combat | Open-combat moves: attack combos, dodge, finishers (no parry or counter). |
| 57 | 2026-11-16T13:25:51+00:00 | Combat | Health recovers slowly once he's out of sight. |

---

## H. Technical Notes

- **Repository:** `evanstom273/stealth-game`. Working branch `ccr-cbb584dc-kvemny`.
- **Art style reference:** `stylised-geometry/STYLISED_GEOMETRY.md` and `stylised-geometry/sheets/01-anatomy.svg` to `07-colour.svg`, regenerated by `stylised-geometry/sheets/make_sheets.py` (Python standard library only; takes the output folder as its one argument). The guide was developed in a side-on platformer; rules it marks **(untested)** haven't been through a real game yet.
- **Project layout:**
  - `src/App.tsx`: the React shell. `src/game/PhaserGame.tsx` holds the canvas; `src/game/createGame.ts` configures Phaser.
  - `src/game/tuning.ts`: every starting value (speeds, grip, blink, light) in one place, for tuning.
  - `src/game/logic/`: plain, unit-tested game logic: geometry, light, grip, noise, climbing, blink targeting.
  - `src/game/player/`: the thief: `thiefArt.ts` (drawing), `ThiefView.ts` (canvas and image), `Thief.ts` (movement, climbing, blink).
  - `src/game/room/`: the test room's layout, its drawing, and the darkness.
  - `src/game/input/Controls.ts`: keyboard, mouse, gamepad and touch merged into one set of inputs.
  - `src/game/scenes/TestRoomScene.ts`: puts it all together, plus the aim line, rings and grip bar.
  - `src/game/bridge.ts`: what the game tells the React interface, and the touch input going back.
  - `src/ui/`: the HUD, touch controls and pause menu.
  - `tests/e2e/`: Playwright. In development the page exposes `window.__thief()` for the tests; it's left out of production builds.
  - Commands are in the README.
- **Explain before adding** *(carried over from Lyra's previous design document)*: before building anything, Claude says what it's about to add and how, then waits for the go-ahead.
- **Workflow** *(Lyra's standing order across all her projects)*: after committing to the working branch, always merge straight to `main` as well; no need to ask each time.
