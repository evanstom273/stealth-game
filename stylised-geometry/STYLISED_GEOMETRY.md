# Stylised Geometry

An art style for 2D games: **characters made from simple geometric shapes, given faces and floating hands, living in a dark world lit around them.** Bright, bold, readable, and buildable entirely from shapes in code, with no sprite sheets.

This folder is self-contained, so copy it into any project:

- `STYLISED_GEOMETRY.md`: this guide.
- `sheets/`: seven SVG reference sheets, one per topic. Open them in a browser. `make_sheets.py` regenerates them.

The style was developed in **simple-shooter** (a 2D side-on platformer shooter). It appears throughout as a worked example in boxes like this:

> **In simple-shooter:** the player is a 48 px white square with two oval eyes, a smile, floating circle hands and L-shaped boots.

Rules marked **(untested)** are proposals for genres or situations the style hasn't been used in yet. Everything else has been through at least one real game.

---

## Contents

1. [What it is](#1-what-it-is)
2. [Why it works](#2-why-it-works)
3. [Characters](#3-characters)
4. [Shape language](#4-shape-language)
5. [Colour](#5-colour)
6. [Light and darkness](#6-light-and-darkness)
7. [Motion and feel](#7-motion-and-feel)
8. [Readability](#8-readability)
9. [Environments](#9-environments)
10. [Interface](#10-interface)
11. [Other genres and views](#11-other-genres-and-views)
12. [Building it](#12-building-it)
13. [Designing new things](#13-designing-new-things)
14. [Worked example: simple-shooter](#14-worked-example-simple-shooter)

---

## 1. What it is

Three layers, each with its own rules:

| Layer | Rule |
|---|---|
| **Characters** | Strict geometry. Every character is a recognisable primitive (square, circle, triangle, polygon) or a few stacked together, with eyes, often a mouth, and floating hands and feet. Ink outline, flat fill. |
| **Environments** | Looser. Rooms and backdrops can be organic and atmospheric, and they stay darker and duller than the characters. |
| **Light** | The world sits in darkness; a soft pool of light follows the player. Characters and effects are never darkened. |

On top of those sits a **motion layer**: squash and stretch, dust, rings, bursts, hit-stop and tiny screen shake. The shapes are simple; how they move does the work.

---

## 2. Why it works

- **Readability first.** A shape you can name in a fraction of a second, against a dark background, beats detail. Silhouette says *what* it is; colour and glow say *what it's about to do*.
- **Shapes carry character.** Two eyes and a smile make a square a person. A browed single eye makes a pentagon a threat. You get personality without character art.
- **It's cheap to make and impossible to mismatch.** Everything is drawn from shapes in code or SVG, so a new character is a design problem, not an art-production one, and everything automatically sits in the same world.
- **Breaking it is powerful.** Because everything is neat, a wrong shape (eleven sides, too many eyes, a hole where a shape should be) is genuinely unsettling. The style comes with its own horror lever.
- **Darkness is atmosphere and mechanics at once.** It makes any room moody for free, focuses attention on the player, and gives you a resource to design with: light.

---

## 3. Characters

*Sheet: `sheets/01-anatomy.svg`, `sheets/03-faces.svg`*

### 3.1 Construction

Build every character in this order. Measurements are in **S**, the body's size (width of its bounding box).

| Step | What | Proportion |
|---|---|---|
| 1. Shape | A primitive you can name, or a few stacked | the hitbox |
| 2. Outline | Near-black ink, `#1a1a26` | ≈ 0.06 S on the body; 2–2.5 px on hands and details at S = 48 |
| 3. Eyes | Two dark ovals with a white highlight dot, or one big white eye with an iris | ovals ≈ 0.17 × 0.25 S, set ≈ 0.19 S either side of centre, slightly above it |
| 4. Mouth | Optional: a short arc | ≈ 0.3 S wide, just below centre |
| 5. Hands | Circles, the body's fill, outlined | radius ≈ 0.17 S, centred ≈ 0.75 S from the body's centre |
| 6. Feet | Dark blocks or L-shaped boots, partly behind the body | ≈ 0.4 S wide each, `#2a2a3a` |

> **In simple-shooter:** S = 48. Eyes 8 × 12 px at (±9, −6), highlights 1.5 px; smile radius 7; hands radius 8 at ±36 px; boots 20 × 16 drawn behind the body.

### 3.2 The rules

1. **Hitbox = the plain shape.** Faces, hands, feet and squash are drawing only. Never let a hand or a stretched frame change collision.
2. **Nothing is attached.** Hands and feet float near the body and move on their own: bob when idle, swing when running, reach when attacking, fly up when hurt or happy. The gap is part of the look.
3. **Flat fills.** At most a gentle top-to-bottom tint (white → `#d9dbe8`). No textures, no rendered shading, no gradients across characters.
4. **One outline weight family.** The same ink colour on everything, scaled to the thing's size.
5. **Not everything needs every part.** Enemies often have one eye and no mouth; small fliers get fins instead of hands; heavies get big square fists and block feet. Pick parts that say what the character *does*.

### 3.3 Faces

Eyes are what turn a shape into a character, and **where they look is information**.

- **Two eyes and a mouth:** friendly, expressive. Best for the player and allies.
  - **Moods:** idle, a grin (a filled half-circle), hurt (squeezed chevrons and a wobbly mouth), determined (brows down, flat mouth, eyes shifted the way it's moving), surprised, asleep.
- **One big eye:** creatures and enemies.
  - It **tracks** the player.
  - A **heavy brow** reads as aggression.
  - **Half-lidded** reads as idle.
  - **Wide with a coloured iris** reads as "awake, and it sees you".
- **Faces react to events, briefly.** A grin for half a second after a good hit, a wince when hurt. Hold moods for ~0.4–0.5 s, then return to idle.

> **In simple-shooter:** the player grins after a stomp or heal and winces when hit. The melee enemy's eye follows you; the tank's heavy brow sells its weight. In the horror world, a red iris opening means a boss has noticed you.

---

## 4. Shape language

*Sheet: `sheets/02-shapes.svg`*

### 4.1 What shapes suggest

A guide, not a law. Break it deliberately when you want a surprise.

| Shape | Suggests | Use for |
|---|---|---|
| Square | Steady, honest | The player; the reference everything is measured against. Keep squares rare elsewhere so the hero stays unique. |
| Circle | Quick, soft, bouncy | Hoppers, rollers. Eyes and hands are circles on everything. |
| Triangle | Sharp, fast, pointing | Fliers, shooters, darts, teeth, shards. |
| Pentagon and up (5–8 sides) | Heavy, solid | Tanks, brutes, armour. |
| Hexagon | Built, precise | Machines, cages, sci-fi. |
| Dodecagon and up | Old, ritual | Gates, halos, wheels, clocks. |
| An *almost* regular shape (11 sides, slightly asymmetric) | Wrong | Horror. See 4.3. |

**Side count can be a counter.** A boss that loses a layer and a side each time you hit it shows progress in its outline.

### 4.2 Compound shapes

Bigger characters, bosses above all, are **stacked and combined primitives**: triangles round a circle, polygons piled into a cairn, a ring with shapes turning inside it.

**The test: you can describe it in one sentence of shapes.** "A diamond of four triangles with an eye at the cross and a tail of bows." If you can't, it's become an illustration; simplify.

### 4.3 Wrong geometry (an optional tool)

Because the style is neat, breaking it unsettles. Use it for horror, corruption, the alien:

- **almost-shapes:** eleven sides where twelve are expected, near-circles, asymmetric polygons
- **too many eyes,** or eyes where there shouldn't be any
- **holes instead of shapes:** a silhouette filled with void and stars
- **shapes that don't behave:** a box that opens into teeth

Keep wrongness contained to the things that are meant to feel wrong. Never apply it to the player, and keep it out of a game's "safe" spaces.

---

## 5. Colour

*Sheet: `sheets/07-colour.svg`*

### 5.1 Colours have jobs

Give each job one colour family, and don't let anything else borrow it.

| Job | Colour | Notes |
|---|---|---|
| Hero | White `#f2f2f2` | The player's body. No enemy is white-bodied. |
| Power | Sky blue `#8fd3ff` (light `#cfeaff`) | The player's abilities: dash, cooldown bars, ready rings, arrival beam. |
| Damage | Red `#ff5a5a` | Getting hurt, health loss, hurt flashes. Keep enemies off pure red; make your "red" enemy orange-red or orange so damage still reads. |
| Reward | Gold `#ffcf4a` | Currency, pickups, buying. |
| Hot tell | Near-white `#fff0d8` | "About to attack" (see 8.1). |
| Ink | `#1a1a26` | Every outline. |

### 5.2 Characters carry the saturation

Rooms stay darker and duller than anything that moves. If a background colour is as bright as a character, the character stops reading.

### 5.3 Building a world palette

Build every world's palette from the same seven roles:

1. **Background:** very dark, low saturation.
2. **Surfaces:** a step lighter (what you stand on).
3. **Blocks / walls:** between the two.
4. **Lit edge:** a light tint, drawn as a thin 3 px line along the top of everything standable, so ledges read in the dark.
5. **Accent 1:** the world's signature colour.
6. **Accent 2:** its partner or opposite.
7. **Danger:** the world's own red or hot colour.

Then give characters colours outside the room's range but inside its mood.

> **In simple-shooter:** the gothic world uses
> - background `#140e24`
> - stone `#4a3e6a` and `#332a4c`
> - lit edge `#7a6ea0`
> - candle gold `#c8913a`
> - violet `#5b3a8a`
> - a red iris `#b3263a`, its "danger" colour
>
> The sheet shows three more world palettes filled out from early mockups.

---

## 6. Light and darkness

*Sheet: `sheets/05-light.svg`*

- **The world is dark; a soft pool of light follows the player.** A radial gradient over the room: clear for the inner ~20%, falling to about 90% black near the edge of the screen.
- **Size it from the screen, not the world.** Use a fraction of the screen diagonal divided by the camera zoom, so it looks the same at any zoom and screen shape.
- **Characters and effects are never darkened.** The darkness layer sits *above* the room and *below* everything that moves. Enemies stay fully visible even in the black; only the world falls away.
- **Ambient motes:** faint drifting specks placed *under* the darkness, so they only show near the light. They make the air feel full for almost nothing.
- **Local lights** (candles, lamps, glowing hazards) are **additive glows built from several faint layers**, never one bright disc.
- **Light can be a resource.** Shrink the pool, let enemies snuff lights, give light back as a reward. That's optional, but the style hands it to you for free.
- **Not every game needs to be dark.** A gentler game can lift the darkness (smaller edge darkness, a bigger clear radius) and keep everything else **(untested)**.

> **In simple-shooter:** radius 0.62 of the screen diagonal, clear 0.22, edge darkness 0.92; the darkness is at depth 4, between the room (0–3) and the effects and characters (5–11).

---

## 7. Motion and feel

*Sheet: `sheets/04-motion.svg`*

### 7.1 Squash and stretch

Every action changes the body's scale, keeping roughly the same area, then **springs back** (a damped spring, not a tween). These values work at 60 fps for a responsive platformer:

| Moment | Scale x × y |
|---|---|
| Jump take-off | 0.72 × 1.32 |
| Double jump | 0.8 × 1.22 |
| Landing | (1 + 0.4k) × (1 − 0.4k), k = impact strength 0–1 |
| Stomp / getting hurt | 1.35 × 0.7 |
| Hitting a wall mid-dash | 0.6 × 1.3 (side) or 1.4 × 0.65 (floor or ceiling) |
| Coming out of a dash | 1.25 × 0.8 along the direction of travel |
| Dropping through a platform | 1.15 × 0.85 |

Also: a slight lean when running, stretch with fall speed, and a streak with fading afterimages for a dash.

### 7.2 The effect vocabulary

Keep it small and reuse it everywhere:

- **Dust:** small pale squares (`#b4b4c6`) that drift and fade. For take-off, landing, skids and wall slides.
- **Ring:** an outline ellipse that grows and fades. For "something became ready", heals, double jumps and portals.
- **Burst:** small shapes flung outwards, in the colour of the event. For hits, deaths and impacts.
- **Flash:** a frame or two of white on a hit.

### 7.3 Impact

- **Hit-stop:** freeze the game for 0.05 s on a hit you land, 0.08 s on a hit you take.
- **Screen shake: tiny, and only on impacts.** Hard landings, dashing into walls, big slams. **Always off when the device asks for reduced motion.**
- **The world responds:** platforms dip a few pixels and brighten when landed on.

### 7.4 Camera

Smooth follow (frame-rate independent), a little look-ahead in the direction of movement, and a gentle zoom-out to keep the current target on screen.

### 7.5 Arrivals and exits

**Give the player an entrance that's theirs.** For example, a beam of light that drops, widens, and assembles them feet, then hands, then eyes, reversed on exit. Enemies should appear differently, so you always know what just arrived.

---

## 8. Readability

*Sheet: `sheets/06-readability.svg`*

### 8.1 Tells

Before anything attacks, it should be obvious. Use as many of these as the attack is dangerous:

- **Heat towards white.** The body shifts from its own colour towards near-white, with a growing additive glow. This is the style's universal "about to go". Give every enemy a `colour` and a `hotColour`.
- **A pose change:** crouch, pull back, fold, coil.
- **A rising sound.**
- **A marker** where it will land, or an **aim line** that tracks, then locks for a beat before it fires.

### 8.2 Vulnerability

**When something can be hurt, change its silhouette, not just its colour.** A kite folds tall and narrow with its eye wide open. A boss loses pieces. Something armoured opens up. Players read outlines faster than tints.

### 8.3 Damage shows on the body

Cracks, missing pieces, an eye opening. A health bar is the backup, not the main read.

### 8.4 Death

**Things break into pieces of their own shape:** arcs of a circle, little triangles, heavy pentagon chunks. It reads instantly, and it rewards you with the thing you broke.

### 8.5 Size

Danger is read from size first. Keep a ladder and stick to it:

| Size | What |
|---|---|
| Below 1× | Fragile, fast |
| About 1× | The player, standard enemies |
| 2× | Heavies |
| 4× and up | Bosses |

**Always draw new characters at true size next to the player.**

---

## 9. Environments

- **Looser than the characters.** Arches, timber, ice, roots, ruins: environments can be organic and atmospheric. Characters stay strict geometry and pop against them.
- **Darker and duller than anything that moves** (see 5.2).
- **A lit top edge** on everything you can stand on: a thin tinted line, so ledges read in the dark.
- **Hazards look like hazards.**
  - Spikes are triangles; saws are toothed circles.
  - Crumbling floors are a different material with cracks, and they shake before they go.
  - Wind is a faint tinted zone with streaks moving the way it blows.
- **Moving platforms take the room's material:** a gold chandelier in a cathedral, a stone counterweight in a tower.
- **Decoration can become mechanics.** Candles, eyes and lamps placed by hand are both mood and future gameplay. Place them deliberately.
- **Hand-built rooms show the style best.** Procedural layouts work, but composition (silhouettes against the light, a focal point) is where the look sings.

---

## 10. Interface

The interface follows the same ideas, quieter **(the HUD in simple-shooter; menus and other genres untested)**:

- **Dark translucent panels** (black at ~40–55% opacity, a faint white hairline border, rounded corners) over the game, never opaque slabs.
- **Bold numbers, small spaced-out labels.** Big black-weight numerals for the thing that matters (wave, score), tiny uppercase tracked labels above them.
- **Icons are shapes.**
  - Health as **pips** in stages.
  - Weapons as simple silhouettes with an ammo bar.
  - Destinations as coloured shapes: a triangle, a diamond, a hexagon, a circle.
- **The same colour jobs:** gold for currency, red for health loss, the power blue for ability readiness.
- **Banners pop and fade** with a little scale. They never sit on screen.
- **Small status bars live under the player in the world** (dash cooldown, reload), in the power colour or the weapon's colour, and hide when full.

---

## 11. Other genres and views

All **(untested)**: these are how the rules should carry, to be checked in a real game.

- **Top-down.** Keep characters drawn *face-on to the camera*, as flat badges, rather than seen from above. They stay readable and keep their faces. Use a small dark ellipse as a ground shadow to anchor them. Hands float either side; feet can be dropped or reduced to two small dark dots below. The pool of light becomes a circle around the player.
- **Isometric.** The same face-on characters. Shapes can gain a single darker "side" face for depth (one flat extra polygon), still with no shading.
- **Puzzle and board-like games.** Pieces are characters: give them eyes that react (look at the cursor, wince when they fail, grin when they match). The darkness can be lifted or used as a focus spotlight on the active area.
- **Menus and UI-heavy games.** The interface section applies; the player character can appear as a mascot reacting to choices.
- **Calmer games.** Lift the darkness, soften the shake, keep the faces and the springiness. The style doesn't have to be an action style; its core is shapes with feelings.

---

## 12. Building it

### 12.1 No sprites

Everything is drawn with an engine's shape primitives (rectangles, circles, polygons, graphics paths) or as SVG. That keeps the style consistent, every character tweakable in code, and changes to colour or proportion instant.

- **Phaser:** `add.rectangle`, `add.circle`, `add.polygon` and `add.graphics` (`fillPoints`, `strokePoints`, `fillEllipse`, arcs). Additive glows with `setBlendMode(ADD)`. A canvas texture for the darkness gradient, drawn once and scaled.
- **Godot:** `Polygon2D`, `Line2D` and `_draw()`; `CanvasModulate` plus `PointLight2D`, or a gradient texture on a CanvasLayer, for the darkness.
- **Plain canvas / SVG:** paths with `stroke-linejoin: round`; the darkness as a radial gradient overlay.

### 12.2 Separate the look from the body

Keep a plain physics shape for collision, and a separate view object that draws the body, face, hands and feet and applies squash. In simple-shooter that's `PlayerView`: the physics box is invisible; the view follows it.

### 12.3 Layer order

Back to front:

1. Background
2. Platforms and room
3. Top edges, cracks, decoration
4. Motes, wind streaks
5. **Darkness**
6. Afterimages
7. Shots, hazard glows, effects
8. Status bars
9. Characters
10. The player's hands, on top

### 12.4 Tokens to start a project with

```ts
export const INK = 0x1a1a26
export const HERO = 0xf2f2f2
export const POWER = 0x8fd3ff
export const DAMAGE = 0xff5a5a
export const REWARD = 0xffcf4a
export const DUST = 0xb4b4c6
export const FOOT = 0x2a2a3a
export const LIGHT = { radius: 0.62, clear: 0.22, edge: 0.92 } // fractions of the screen diagonal
export const SQUASH = { jump: [0.72, 1.32], airJump: [0.8, 1.22], stomp: [1.35, 0.7] }
export const HITSTOP = { dealt: 0.05, taken: 0.08 }
```

---

## 13. Designing new things

### 13.1 The process

1. **Decide what it does first.** Its role (fast, heavy, ranged, a support) chooses its shape.
2. **Draw four directions side by side.** Show each one:
   - in its key states: idle, telegraphing, vulnerable, broken
   - **at true size beside the player**
3. **Pick one, or combine.** Combinations are often the best answer: one option's body with another's eye.
4. **Write the pick down,** with the options passed over, so the decision isn't relitigated later.
5. **Build it from shapes,** with the palette's hex values, the ink outline and a plain hitbox.

### 13.2 Checklist

- [ ] Recognisable as a shape, in silhouette, at true size, in the dark?
- [ ] Has eyes, and the eyes do something?
- [ ] Ink outline, flat fills?
- [ ] Not in the hero's colours or damage red, unless that is the point?
- [ ] Its attack has a tell: heat, pose, sound, a marker?
- [ ] Its vulnerable state reads at a glance?
- [ ] It dies in pieces of its own shape?
- [ ] It fits its world's palette, and the room behind it stays darker and duller?
- [ ] You can describe it in one sentence of shapes?

---

## 14. Worked example: simple-shooter

A 2D side-on roguelite platformer shooter, and the game this style was made for. Its own art document, `ART_STYLE.md`, applies this guide in full. The highlights:

- **The player:** a 48 px white square, two oval eyes, a smile, floating circle hands, L-shaped boots.
  - Turns sky blue and streaks when it dashes.
  - Grins after stomps.
  - Beams in feet-first through a column of light.
- **The base enemies:**
  - an orange circle with one tracking eye, which hops and rolls
  - a green arrowhead with a browed eye, which aims and darts
  - a red pentagon twice the player's size, with big square fists, which slams

  Each heats towards white before attacking, and each shatters into its own shape.
- **A horror world built on wrong geometry:**
  - an eleven-sided hole in the world with stars inside and an eye
  - a box that opens into a jaw of triangle teeth
  - a gate of a dodecagon with counter-turning triangles
  - a swarm of tiny black triangles with single eyes
- **Bosses as compound shapes:**
  - a stained-glass face in a halo of twelve rays you break
  - a cairn of bone polygons, one side fewer per layer
  - a kite of four triangles that folds narrow when it perches
  - a serpent of night sky edged in stars, too big for the room
- **The darkness:** dark rooms, a pool of light around the player, candles as additive glows. In the horror world, light becomes something enemies take from you.
