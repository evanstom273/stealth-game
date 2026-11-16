# STEALTH_GAME_DESIGN.md

Authoritative, living record of the game's design. Timestamps are Europe/London, ISO 8601 with UTC offset, recorded at the time the decision was confirmed in conversation unless marked otherwise.

---

## A. Project Overview

A **side-on stealth game** (History #1, #15), drawn in the **Stylised Geometry** art style (History #2). The player is **a thief who's small and out of place** (History #16), **breaking out of a facility**: a clinical test facility, our own take on that kind of place (History #77, #78). Working title: none yet; the repository is `stealth-game`.

**Where the project stands (as of 2026-11-16T15:15:52+00:00):**
- Living design document created (History #4), since renamed `STEALTH_GAME_DESIGN.md` (History #5).
- Art style reference added to the repository as `stylised-geometry/` (History #2), including `make_sheets.py`.
- Project scaffold built and tested (History #7–#10): an empty Phaser scene inside React, served through Cloudflare Workers. Nothing game-related yet.
- How we work is set out below: Depth Before Breadth, Artifacts as a visual workshop, and structured rounds of design questions (History #11–#13).
- Lyra is deploying the scaffold to Cloudflare Workers (History #14).
- Designing the player: look settled (History #15–#25); climbing and ground movement settled (History #26, #28–#31); blink's rules and look settled (History #27, #32–#36).
- Combat designed in three rounds (History #50–#61); details still open (§E).
- **Combat is built for testing** (History #85): three test guards (staff watchmen) in the test room, sneak takedowns from behind, the ceiling, a wall and a blink, the jab-cross-shove combo with a finisher, the dodge, and knockout-or-kill. He's invulnerable for now. Merged to `main`. Lyra's first playtest: takedowns didn't read well enough, so she picked fixes from the Takedown Studies (History #86–#89), which are **now built and merged**: the guard outlined with your Attack button and "tap · hold", Zs on knockouts, kills that shatter, and the pounce from ceilings and walls (History #90).
- Designing the guards: archetypes, senses, suspicion, searching, hiding spots, each archetype's behaviour and their size settled (History #63–#80); staff watchman and blind guard, robot torch-bearer on a wheel that can't do stairs, and their look approved (History #81–#84).
- **The full player is built** (History #37, #45, #46) in a test room, playable with keyboard and mouse, gamepad and touch, and merged to `main`. Lyra's first playtest: good overall; grip raised and blink loosened as a result (History #47, #48).

**Stack:** React, Vite, TypeScript, Tailwind CSS, Phaser, IndexedDB via Dexie.js and Cloudflare Workers: Lyra's normal stack (History #3).
- **React** is the outer shell; **Phaser** (v4) runs the game inside a single React component (History #7, #9).
- **Tailwind** styles anything React draws.
- **Dexie** comes in when there's first something to save (History #8).
- **Cloudflare Workers** serves the built game, with no server code yet, and it's where the game is deployed (History #14).

**The style guide is a reference, not gospel** (Lyra, 2026-11-16T13:31:53+00:00 — History #62). It informs how things look; it doesn't decide anything. Where this game wants something different, the game wins, and Claude shouldn't present the guide's rules as reasons on their own.

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
- **He's breaking out of a facility, not into somewhere.** A clinical test facility: chambers, testing, being watched, in the spirit of the game Portal's setting but our own take, not its look. Lyra is still working out the story. *(2026-11-16T13:37:20+00:00 — History #77)*
- **He's still a thief**, just breaking out rather than in. *(2026-11-16T13:37:20+00:00 — History #78)*

### The player
- **A thief who's small and out of place.** Lyra chose both "a thief" (~~breaking in to take something~~ breaking out of a facility, #77, #78) and "small and out of place" (sneaking past things far bigger than it; stealth as vulnerability). *(2026-11-16T05:57:44+00:00 — History #16)*
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
- **Knockout or kill: tap or hold.** Tap Attack to knock a guard out, hold it to kill, at finishers and sneak attacks alike. One button, the same on touch, gamepad and keyboard. Claude's recommendation, approved. *(2026-11-16T13:27:43+00:00 — History #58)*
- **Sneak attacks: a marker, then Attack.** When he's in position on an unaware guard (behind, above, on a wall, or aiming a blink at them), a marker shows over the guard, and Attack does the takedown instead of an ordinary blow. Claude's recommendation, approved. *(2026-11-16T13:27:43+00:00 — History #59)*
- **Health is shown as pips** in the HUD, coming back one at a time while he's hidden (#57). How many isn't decided. Chosen over showing damage on his body (Claude's recommendation, from the guide's §8.3). *(2026-11-16T13:27:43+00:00 — History #60)*
- **Rewards for staying unseen:** an **end-of-level rating** (seen or not, knockouts, kills, time), and **guards stay relaxed** while he's unseen: once they've seen him, they're on edge for the rest of the level. *(2026-11-16T13:27:43+00:00 — History #61)*
- **Combat is built before the guards' full stealth behaviour**, so Lyra can get a feel for it: a simple test enemy (the approved staff watchman) that stands at a post turning left and right, comes over and attacks when it sees him, and can be taken down; he's invulnerable for now. Claude's plan approved with its defaults, including first takes to tune in play: a jab, cross and shove combo whose third hit staggers; a dash dodge (backstep with no direction held); blink takedowns by aiming at a guard, which stuns it on arrival; a power-blue takedown marker whose ring fills while Attack is held; knockouts slumping and kills draining to grey; Attack on left mouse or F, Y, or a touch button left of the diamond, and Dodge on Q, RB, or a smaller touch button above it; sight cones shown while testing (switchable); downed guards returning after about 8 seconds as a testing convenience. *(2026-11-16T13:52:05+00:00 — History #85)*
- **Takedowns made readable**, picked from the Takedown Studies after Lyra's first combat playtest:
  - **The prompt: option D.** When a takedown or finisher is on, the guard is outlined in power blue, turning red-orange once a hold tips into a kill; above it, the badge with the Attack button for your controls and "tap · hold" underneath, as drawn in the study. *(2026-11-16T14:31:28+00:00 — History #86)*
  - **Knockout: option B.** The guard lies on its back with its eyes shut and little Zs drift up while it's out. *(2026-11-16T14:31:28+00:00 — History #87)*
  - **Kill: option C.** The guard shatters into the shapes it's made of (chunks of body, arcs of head, cap, hands), which scatter and fade, leaving nothing lying there. *(2026-11-16T14:31:28+00:00 — History #88)*
  - **Ceiling and wall takedowns: option B, the pounce.** A quarter-second wind-up on the surface, a leap with afterimages, a hit-stop and ring on impact, and a moment pinning the guard before he steps off. No takedown cam. *(2026-11-16T14:31:28+00:00 — History #89)*


### Guards
- **Three archetypes: a watchman, a ~~lantern-bearer~~ torch-bearer (#80), and a blind guard.** The watchman is the everyday guard (patrols, average sight and hearing) and the baseline. The ~~lantern-bearer~~ torch-bearer carries a light, so the darkness that hides him moves with them. The blind guard can't see at all: only silence works on them. Lyra chose a blind archetype and three in all; the watchman (Claude's recommendation) and lantern-bearer were picked from options. *(2026-11-16T13:31:53+00:00 — History #63)*
- **Senses first: sight and hearing, with proper searching.** *(2026-11-16T13:31:53+00:00 — History #64)*
- **Sight is a cone, and light matters.** Guards see in a cone ahead of them; in light they spot him from far off, in the dark only up close. Claude's recommendation, approved. *(2026-11-16T13:31:53+00:00 — History #65)*
- **Suspicion shows as a marker overhead** (a filling "?" that turns to "!"), not through the guard's eye. *(2026-11-16T13:31:53+00:00 — History #66)*
- **A proper search:** guards go to where he was last seen or heard, check hiding spots nearby, bring other guards in to spread out, and give up after a while, going back to their routes on edge (#61). *(2026-11-16T13:31:53+00:00 — History #67)*
- **Hiding spots in the environment,** such as lockers. *(2026-11-16T13:31:53+00:00 — History #68)*
- **Sound carries through walls, muffled:** quieter through walls, and thin walls let more through than thick ones. Claude's recommendation, approved. *(2026-11-16T13:32:49+00:00 — History #69)*
- **On a noise, it depends how loud:** a quiet noise makes a guard stop and turn to look; a loud one sends it to investigate where it came from. Claude's recommendation, approved. *(2026-11-16T13:32:49+00:00 — History #70)*
- **Hiding spots:** lockers and cupboards (step in, peek through the slats), under furniture (desks, beds, tables), behind cover (curtains, crates, coat racks: hidden from one side), and vents and ducts (crawlspaces only he fits through, hiding and a hidden route at once). *(2026-11-16T13:32:49+00:00 — History #71)*
- **Found in a hiding spot: it depends what they know.** If a guard saw him go in, he's caught and has to fight or flee. If a guard is just checking, he can take them out from inside as they open it. Claude's recommendation, approved. *(2026-11-16T13:32:49+00:00 — History #72)*
- **Watchmen: a mix of patrols and posts.** Some walk set routes, pausing to look around; some stand at posts. Levels decide which. Claude's recommendation, approved. *(2026-11-16T13:34:06+00:00 — History #73)*
- **~~Lantern-bearers~~ Torch-bearers (#80):** the ~~lantern~~ torch is a moving lamp, so getting close lights him up; they search with it, swinging it into dark corners and up at ceilings; and the lantern can be put out (knocked from their hand or snuffed), leaving them as blind in the dark as anyone, but alerted. Relighting lamps was not chosen. *(2026-11-16T13:34:06+00:00 — History #74)*
- **The blind guard finds him by** much sharper hearing (further, and through walls more easily); hearing even sneaking within a short range; touch (bumping into each other means it knows exactly where he is); and remembering where sounds came from, going back to them to build a picture of where he's been. *(2026-11-16T13:34:06+00:00 — History #75)*
- **Guards are about 1.25 times his size.** Barely bigger than him. *(2026-11-16T13:34:06+00:00 — History #76)*
- **Guards are both security staff and machines.** Which archetypes are which: see #81. *(2026-11-16T13:37:20+00:00 — History #79)*
- **The lantern becomes a torch:** a beam rather than a glow, so the torch-bearer lights whatever they point it at. Same mechanics as #74. *(2026-11-16T13:37:20+00:00 — History #80)*
- **Which are staff and which are machines:** the **watchman** and the **blind guard** are security staff; the **torch-bearer** is a robot, **on a single wheel instead of legs**. Picked from the Guard Line-up. *(2026-11-16T13:43:07+00:00 — History #81)*
- **The blind guard's eyes are shut while it's calm, and open milky when it responds** (suspicious or alerted): pale, with no pupils. Chosen over a blindfold and over black eyes. *(2026-11-16T13:45:32+00:00 — History #82)*
- **The torch-bearer's wheel can't do stairs; that's its weakness.** *(2026-11-16T13:47:00+00:00 — History #83)*
- **The rest of the guards' look is approved as drawn in the Guard Line-up:** the watchman a tall rectangle in a steel-teal jacket with a circle head under a flat cap; the torch-bearer a wide gunmetal chassis with a screen face on one wheel, the torch in a metal hand; the blind guard a rounded plum capsule; faces changing with state (calm flat and bored, suspicious with a raised brow, alerted wide-eyed and open-mouthed; the robot's screen changing colour and shape the same way); the marker as an amber "?" badge filling, then an orange "!" badge; and the torch's look. *(2026-11-16T13:47:00+00:00 — History #84)*

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

**Combat test build** (History #85), built and merged. **Lyra's first combat playtest** (2026-11-16T14:30:22+00:00): respawning test guards are fine for now, but three things don't read: **how to do a takedown** (the marker doesn't say what to press, or that tap and hold differ); **whether you knocked a guard out or killed it**; and **takedowns from a ceiling or wall**, which are over too fast to see. Options for all three are in the Takedown Studies; Lyra picked 1D, 2B for knockouts, 2C for kills and 3B (History #86–#89). **Built and merged to `main`** (History #90, see §F). Next: Lyra plays it again.

**Takedown Studies** (Artifact, 2026-11-16T14:30:22+00:00): https://claude.ai/artifact/9PjeTfLjLqrT8VYuQR2jFT. Looping scenes, option A in each row being what's in the game now. **1. The prompt:** A badge only; B badge plus the Attack button for your controls (keyboard, gamepad or touch) and "tap · hold"; C a two-stage badge saying "Knock out", then turning red-orange and saying "Kill" as the hold tips over; D the guard outlined in power blue, turning red-orange for a kill (combines with B or C). **2. Outcomes:** knockout A slump with eyes shut, B with Zs drifting up, C seeing stars then eyes shut; kill A drain to grey, B grey with crossed eyes, C shatter into its own shapes, D collapse into a dark silhouette that sinks away. **3. Ceiling and wall takedowns:** A quick, B a pounce (wind-up, afterimages, hit-stop and ring, a moment pinning the guard), C the pounce with a takedown cam (slow-motion and a slight zoom at impact). Claude's choices, up for change: red-orange for the kill stage, a cross as the kill icon, the shatter's pieces, and all timings.

Shortlisted for visual comparison (options, not decisions):
- **Bodies:** square, rounded square, circle and triangle (all four picked), plus stacked and polygon builds following Lyra's note (#19).
- **Faces:** thief's mask, two eyes and a mouth, two eyes and no mouth; these can combine.

**Thief Line-up** (Artifact, round 2 visual options): https://claude.ai/artifact/JJtcAFFG3k7kV3fym82UXV. It shows eight bodies (Nos. 1–4: square, rounded square, circle, triangle; Nos. 5–8: hooded, teardrop, stacked, leaning), four faces (mask, mask + mouth, eyes + mouth, eyes only), a light slider, each body at game size, and a walk through a lamp's light. Things Claude drew that weren't asked for, all up for rejection: Nos. 5–8, a smirk on the faces with a mouth, mask + mouth as a combined face, the look of the lit eyes, how far the player fades (to about 12% brightness), and the guide's default hands and feet.

**Thief Mask Fitting** (Artifact, round 3): https://claude.ai/artifact/3qpxJDtQ17eQkx3taQwPiN. No. 7 with the smirk and dark gloves in three masks: A, plain band; B, band with ties (knotted at the back, two notched tails that trail when moving and drop at rest); C, domino (dips between the eyes, outer corners flick up just past the head). Each in light and full shadow, at S = 48, 64 and 80 px, and walking under a lamp. Claude's choices, up for change: the tie and domino details, and gloves matching the mask's dark.

**Thief Blink Studies** (Artifact, blink looks): https://claude.ai/artifact/G34hV17S54p8gSnqsmDbZU. Four looping test rooms, one per look: A, pop and ring; B, shatter and reassemble (pieces of his own shapes); C, shadow streak; D, turning to dust (Lyra's option, drawn as crumbling into the guide's dust squares from the head down and gathering back at the far end). In each he aims through a thin wall, blinks to the far floor, back, then up to the ceiling, landing gripping. Claude's choices, up for change: power blue for the aim line, landing marker and rings; a first take on the hanging pose; lit eye streaks in the shadow streak; the reading of "turning to dust"; all timings.

**Thief Control Layout** (Artifact, UI mock-up, 2026-11-16T06:46:01+00:00): https://claude.ai/artifact/SZvQfYxAyDTpgY8jjx86hn. Requested by Lyra before the full player is built. An interactive mock-up of the HUD and controls on the Fold's outer screen (portrait and landscape, about 412 × 915), its inner screen (about 790 × 820) and desktop (1280 × 720): fixed thumbstick, Jump, Grab, Sneak and Blink buttons, drag-from-Blink aiming with a range ring and landing ghost, blink charges as pips, a Sneaking tag, a grip bar, an optional debug panel, and the keyboard and gamepad map. Variants to compare: buttons in an arc or a diamond; portrait controls over the game or in a band below it. Claude's choices, up for change: run on touch by pushing the stick to its edge; charges as dust squares; the icons; the Sneaking tag; the key and button bindings; S = 56 px on phones and 64 px on desktop.

**Guard Line-up** (Artifact, guard visual options, 2026-11-16T13:40:32+00:00): https://claude.ai/artifact/7DDTGbZg24gdVua4B34PRS. The three archetypes (watchman, torch-bearer, blind guard), each as security staff and as a machine, at 1.25 times his size facing him in a dark facility corridor, switchable between calm, suspicious and alerted, with sight cones, the blind guard's hearing rings and the torch beam lighting him; plus a size check of all six beside him. Shortlisted to draw: faces with two eyes and a mouth varying by archetype; the blind guard blindfolded or with eyes shut; the torch in a floating hand. Claude's choices, up for change: body shapes (watchman a tall rectangle with a cap, torch-bearer broad-shouldered with a helmet, blind guard a rounded capsule; machines a panelled chassis with a screen face), colours (steel-teal, ochre, plum; gunmetal machines), faces per state, the marker's amber "?" and orange "!" badges, two-tone sight cones (dark range and light range), the hearing rings, and the torch's look.

---

## D. Future Possibilities

*Proposals only — not confirmed features.*

- None yet.

---

## E. Open Questions

1. **Title.**
2. **The story**, including what the facility is and why he's in it (#77).
3. **How a clinical facility fits stealth that runs on darkness** (bright, clean test spaces against the dark): left open on purpose.
4. **Blink details** (#27, #32–#36, #48): whether 5 charges and a 6 S range hold up in proper levels; what counts as a thin wall; exactly what guards notice and from how far.
5. **Combat details still open** (#50–#61): how many health pips; what attacks, combos, dodges and finishers look like (~~takedowns and their marker~~, #86–#89); Attack and Dodge on the touch layout (the diamond has four buttons); how the gloves read as weapons when they vanish in the dark. Combat also needs guards to exist before it can be built or tested.
6. **Guard details still open** (#63–#84): ~~the blind guard's face~~ (#82); ~~stairs for the wheel~~ (can't, #83), though ladders and drops aren't decided; ~~their look~~ (#84). Still to come: patrol routes and posts in real levels, and the numbers (how far they see and hear, how fast suspicion builds, how long they search), which are tuning.
7. **The player's size on screen.** ~~Next to the guards~~ (about 1.25×, #76). Keeping the head small (#22) means the face needs the player to be big enough on screen to read.
8. **What each part of the stack handles.** ~~React~~ (#7); ~~Dexie~~ (#8); ~~deployment~~ (Cloudflare Workers, #14). ~~physics~~ (Phaser Arcade, #40). Still open: anything server-side.

---

## F. Implementation Status

*Updated 2026-11-16T15:15:52+00:00.*

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
| Tests (player build) | Passing | 24 unit tests on the game logic (light, grip, noise, climbing, blink targeting); 10 Playwright tests driving every move with the keyboard, mouse and touch on desktop and Fold-sized screens. *(2026-11-16T07:24:16+00:00)* |
| Test guards | Built (for combat testing) | Three staff watchmen as approved (#81, #84) at 1.25 times his size, at x = 8, 12.4 and 22 S: one in the open, one under the first ledge, one past the thin wall under the second ledge. Each stands at its post turning every 2.4 s, sees him with a 25° cone reaching 7 S in light and 1.6 S in the dark (#65) and through nothing solid, fills its "?" (faster the closer he is) and turns it to "!" (#66), then comes over at 2.4 S/s and punches with a 0.45 s wind-up. Gives up after 3.5 s without seeing him and walks back. Flinches when hit, staggers for 1.6 s when shoved, is dazed for 1.2 s by a blink, and comes back 8 s after a knockout or kill (testing only). Knocked out, it lies on its back with its eyes shut and pale-blue Zs drifting up (#87); killed, it shatters into its own shapes, which tumble to the floor and fade over about 2 s (#88). Once a takedown on it has started, it's held still: it can't turn, see him or punch (#90). No hearing yet. *(2026-11-16T14:20:55+00:00)* |
| Combat | Built (first takes) | Jab, cross, shove: presses during a blow queue up; the shove staggers. Finishers on a staggered or dazed guard within 2.1 S. Sneak attacks on unaware guards: from behind (within 1.3 S), dropping from a ceiling (within 0.9 S to the side, up to 4 S below), leaping off a wall (up to 4 S out, on the open side) and blinking onto them (aim at the guard; he lands behind it and dazes it). Tap Attack to knock out, hold 0.35 s to kill. **The prompt (#86):** the guard is outlined in power blue while a takedown or finisher is on, turning red-orange once a hold commits to a kill and staying that way until it lands; over it, the marker (its ring filling as you hold), the Attack button for the controls you last used (an F key, a mouse with its left button lit, a gamepad Y, or the touch Attack button) and "tap · hold". **Ceiling and wall takedowns are a pounce (#89):** a 0.25 s wind-up coiled against the surface, a 0.42 s leap leaving three afterimages, a 0.1 s hit-stop with a ring spreading along the floor, 0.45 s pinning the guard, then a 0.25 s step off to the side he came from. Dodge: a 0.22 s dash (backstep with no direction), attacks miss while it lasts. Guards' punches knock him back with a white flash; he can't be hurt (#85). Hit-stop on blows, sparks, a tiny shake on takedowns (off when the device asks for reduced motion), loud noise for blows. *(2026-11-16T14:20:55+00:00)* |
| Combat controls | Built | Attack: left mouse button or F; Y on a gamepad; a touch button at the diamond's lower left. Dodge: Q; RB; a smaller touch button at its upper left. The pause menu gains a Sight cones switch (on by default while testing). *(2026-11-16T14:20:55+00:00)* |
| Tests | Passing | 41 unit tests (now including which Attack button the prompt shows, and the shatter's pieces landing on the floor and fading) and 18 Playwright tests (now including the outline for a knockout and a kill, the shatter, the mouse and touch buttons in the prompt, and the wall pounce going through every phase), passing three runs in a row, and the combat tests four times over. *(2026-11-16T15:15:52+00:00)* |
| Deployment | In progress (Lyra) | Lyra deploying the scaffold to Cloudflare Workers. Not yet confirmed live. *(2026-11-16T05:51:48+00:00)* |

### Known issues and limitations
- **Not yet played on the Fold.** Everything was tested in a headless browser, which renders on the CPU at about 20 fps, so real frame rate and feel on the phone are unknown. He and the darkness are redrawn on small canvases every frame; that's the first place to look if it stutters.
- **Gamepad support is untested** with a real pad; the headless browser has none.
- **The gloves barely show against the dark**, as seen in the Thief Mask Fitting. Nothing has been decided about it, and it matters more now they're his weapons (#55): his punches are hard to see.
- **Combat is against one kind of test guard only.** It's the watchman's look with simple behaviour (#85); no hearing, no searching, no torch-bearer or blind guard yet.
- **He's invulnerable** (#85): there's no health and no losing a fight yet.
- ~~**Takedowns don't read well yet**~~ (Lyra's combat playtest). Fixes picked (#86–#89) and built (#90); waiting on Lyra's next playtest.
- **No guards yet**, so "guards look up" (#28) and "guards can notice a blink" (#34) have nothing to act on. Noise is measured and can be shown as rings, but nothing hears it.
- ~~**A full-height wall takes longer to climb than his grip lasts.**~~ Fixed by the grip increase (#47): a full-height test wall now uses about half the meter. The rest ledge stays in the test room for trying the under-ledge climb.

### Implementation interpretations (technical, not design decisions — flag if wrong)
- **Combat details beyond the approved first takes (#85):** presses during a blow queue (so mashing never loses blows); a blow connects on the first frame past its contact point (so a slow frame can't skip it); finisher reach is a generous 2.1 S because the shove knocks guards back; wall leaps reach 4 S; takedowns from behind or blinks end with him behind the guard, finishers on his own side of it; sneak takedowns make only a soft noise, open blows a loud one; after a guard's punch he can't attack for a quarter of a second; a guard that's punched while unaware becomes alerted.
- **Takedown readability details beyond the picks (#86–#90):** the outline goes round the whole guard (body, head, cap, hands and feet); the shatter includes the feet, which the study left out, so nothing vanishes; pieces come to rest on the floor rather than freezing mid-air; Zs are drawn bigger and bolder than in the study, which looked thin at game size; the afterimages are stronger than the study's (0.45 opacity for the nearest, then fainter), which barely showed in the dark; on a kill, the pounce lands on the floor among the pieces, since there's no guard left to pin; when he's hanging from a ceiling right over the guard, the marker moves beside the guard so he doesn't cover it; aiming a blink at a guard shows the outline and marker but not the Attack button, since letting go of Blink is what does it; the button shown follows the last controls used, with keyboard and mouse counting as one, the mouse shown only after a click attack; and once committed, every takedown (not only the pounce) holds the guard still.
- **Two input bugs found while testing, fixed** *({T})*: a key tapped down and up within a single frame was lost, because Phaser forgets a press when the key comes back up (presses and releases are now counted from the key and mouse events, so none go missing, however short or slow the frame); and presses made during a hit-stop were thrown away, so a fast combo could lose blows (they now carry into the first frame after it). Both made the combo test flaky in the slow headless browser, and both could eat presses on a slow phone.
- **Testing switches added:** Sight cones (pause menu, on by default while testing), and `?guards=0` in the address for an empty room. In development the page also exposes `window.__guards()`, `window.__combat()` and `window.__test` (move him, hold a guard still) for the browser tests.
- **Two bugs found while testing, fixed:** in development, React's double-mount left Phaser measuring the canvas in the wrong place, so mouse aiming was off until the window was resized (production wasn't affected); and the camera used to glide in from the corner on load, which moved aimed points, so it now starts on him.
- **The guards' sight cones and hearing rings** in the Guard Line-up were drawn to explain the senses; whether players see them in the game hasn't been decided.
- **Guard size, 1.25×,** is read as overall scale: roughly a quarter taller (and wider) than him. Flag if Lyra meant height only.
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
| 58 | 2026-11-16T13:27:43+00:00 | Combat | Knockout or kill: tap Attack to knock out, hold to kill (Claude's recommendation, approved). |
| 59 | 2026-11-16T13:27:43+00:00 | Combat | Sneak attacks: a marker shows over an unaware guard when he's in position; Attack does the takedown (Claude's recommendation, approved). |
| 60 | 2026-11-16T13:27:43+00:00 | Combat | Health as pips in the HUD, refilling one at a time while hidden; number undecided. |
| 61 | 2026-11-16T13:27:43+00:00 | Combat | Rewards for staying unseen: an end-of-level rating, and guards stay relaxed until they've seen him (then on edge for the rest of the level). |
| 62 | 2026-11-16T13:31:53+00:00 | Workflow | The style guide is a reference, not gospel: the game's own choices win. |
| 63 | 2026-11-16T13:31:53+00:00 | Guards | Three archetypes: watchman (baseline), lantern-bearer (carries a light), and a blind guard. |
| 64 | 2026-11-16T13:31:53+00:00 | Guards | Senses first: sight and hearing, with proper searching. |
| 65 | 2026-11-16T13:31:53+00:00 | Guards | Sight is a cone; in light they spot him from far off, in the dark only up close (Claude's recommendation, approved). |
| 66 | 2026-11-16T13:31:53+00:00 | Guards | Suspicion shows as a marker overhead ("?" filling to "!"). |
| 67 | 2026-11-16T13:31:53+00:00 | Guards | Searching: go to the last known spot, check hiding spots, bring others in, give up after a while (then on edge). |
| 68 | 2026-11-16T13:31:53+00:00 | Environment | Hiding spots in the environment, such as lockers. |
| 69 | 2026-11-16T13:32:49+00:00 | Guards | Sound carries through walls, muffled (more through thin walls) (Claude's recommendation, approved). |
| 70 | 2026-11-16T13:32:49+00:00 | Guards | Quiet noise: turn and look; loud noise: go and investigate (Claude's recommendation, approved). |
| 71 | 2026-11-16T13:32:49+00:00 | Environment | Hiding spots: lockers and cupboards, under furniture, behind cover, vents and ducts. |
| 72 | 2026-11-16T13:32:49+00:00 | Guards | Found hiding: caught if they saw him go in; if they're just checking, he can take them out from inside (Claude's recommendation, approved). |
| 73 | 2026-11-16T13:34:06+00:00 | Guards | Watchmen: a mix of patrol routes (with pauses) and posts (Claude's recommendation, approved). |
| 74 | 2026-11-16T13:34:06+00:00 | Guards | Lantern-bearers: the lantern lights him when close, they search with it, and it can be put out. |
| 75 | 2026-11-16T13:34:06+00:00 | Guards | Blind guard: much sharper hearing, hears sneaking up close, touch, remembers where sounds came from. |
| 76 | 2026-11-16T13:34:06+00:00 | Guards | Guards are about 1.25 times his size. |
| 77 | 2026-11-16T13:37:20+00:00 | Concept | He's breaking out of a facility, not in: a clinical test facility, our own take (not Portal's look). Story still open. Supersedes "breaking in" in #16. |
| 78 | 2026-11-16T13:37:20+00:00 | Player | He's still a thief, breaking out rather than in. |
| 79 | 2026-11-16T13:37:20+00:00 | Guards | Guards are both security staff and machines (which archetype is which undecided). |
| 80 | 2026-11-16T13:37:20+00:00 | Guards | The lantern-bearer's lantern becomes a torch: a beam, not a glow. |
| 81 | 2026-11-16T13:43:07+00:00 | Guards | Watchman and blind guard are security staff; the torch-bearer is a robot on a single wheel instead of legs. |
| 82 | 2026-11-16T13:45:32+00:00 | Guards | Blind guard: eyes shut while calm, opening milky (no pupils) when it responds. |
| 83 | 2026-11-16T13:47:00+00:00 | Guards | The torch-bearer's wheel can't do stairs: its weakness. |
| 84 | 2026-11-16T13:47:00+00:00 | Guards | The rest of the guards' look approved as drawn in the Guard Line-up (shapes, colours, faces by state, marker, torch). |
| 85 | 2026-11-16T13:52:05+00:00 | Workflow | Combat first, against a simple test enemy (post, turning, sees, attacks), with him invulnerable; Claude's combat plan and its first-take defaults approved. |
| 86 | 2026-11-16T14:31:28+00:00 | Combat | Takedown prompt: the guard outlined in power blue (red-orange as a hold tips into a kill), with the badge, your Attack button and "tap · hold" (Takedown Studies 1D, as drawn). |
| 87 | 2026-11-16T14:31:28+00:00 | Combat | Knockout: lying with eyes shut, Zs drifting up (2B). |
| 88 | 2026-11-16T14:31:28+00:00 | Combat | Kill: the guard shatters into its own shapes, which scatter and fade (2C). |
| 89 | 2026-11-16T14:31:28+00:00 | Combat | Ceiling and wall takedowns: the pounce, with wind-up, afterimages, hit-stop, ring and a moment pinning the guard; no takedown cam (3B). |
| 90 | 2026-11-16T15:15:52+00:00 | Workflow | Claude's plan for building the takedown picks approved, including its default that a guard can't turn round once a takedown on it is committed. |

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
  - `src/game/input/Controls.ts`: keyboard, mouse, gamepad and touch merged into one set of inputs; `device.ts` keeps track of which the player last used, for the Attack button in prompts.
  - `src/game/enemy/`: the test guard: `guardArt.ts` (drawing, including the takedown outline), `Guard.ts` (behaviour, the knockout Zs) and `shatter.ts` (the kill's pieces and how they fall).
  - `src/game/combat/Combat.ts`: blows, the dodge, takedowns (including the pounce), finishers, and the takedown prompt. Its rules (sight, takedown positions, tap or hold) are in `src/game/logic/combat.ts`.
  - `src/game/scenes/TestRoomScene.ts`: puts it all together, plus the aim line, sight cones, rings and grip bar.
  - `src/game/bridge.ts`: what the game tells the React interface, and the touch input going back.
  - `src/ui/`: the HUD, touch controls and pause menu.
  - `tests/e2e/`: Playwright. In development the page exposes `window.__thief()` for the tests; it's left out of production builds.
  - Commands are in the README.
- **Explain before adding** *(carried over from Lyra's previous design document)*: before building anything, Claude says what it's about to add and how, then waits for the go-ahead.
- **Workflow** *(Lyra's standing order across all her projects)*: after committing to the working branch, always merge straight to `main` as well; no need to ask each time.
