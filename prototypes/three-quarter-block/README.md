# Three-Quarter Block

A walkable mock-up of Stylised Geometry in a **three-quarter (3/4) view**, made for Lyra on 2026-11-16 as a side exploration. It's **not part of the stealth game**. It uses the stealth game's thief, ported into the view, on a placeholder British city street.

- **The page:** `index.html` in this folder. It's one self-contained file with no build step and no libraries.
- **Published as an Artifact:** https://claude.ai/artifact/XKwakcWP1cZfYEavJNCbf4

This document explains exactly how it was made, so it can be rebuilt, extended or carried into a real game.

---

## Running it

Any of these works:
- **Open the file directly:** open `index.html` in a browser. It works from `file://`.
- **Through the game's dev server:** run `npm run dev` and go to `/prototypes/three-quarter-block/`. Vite serves it as a static page, and it's left out of the game's build.
- **As an Artifact:** publish the file. The Artifact host supplies its own doctype and reset, so the extra lines at the top of the file are harmless there.

The page loads two Google Fonts, Outfit and JetBrains Mono. Offline it falls back to system fonts, and the street itself doesn't use them apart from the shop signs.

**Controls:**
- **Keyboard:** WASD or the arrow keys to walk, Shift to run, Space to jump.
- **Touch or mouse:** drag anywhere on the street to walk. Drag to the edge of the stick to run, and use the Jump button.

**Switches under the street:**
- **Time:** Day, Dusk or Night.
- **See him behind things.**
- **Show footprints.**

---

## How it was made, step by step

1. **Started from the style guide's own note.** The guide's §11 ("Other genres and views") says that for top-down, characters stay *face-on to the camera as flat badges*, with a small ground-shadow ellipse to anchor them. In conversation we agreed that 3/4 suits that even better than straight top-down, because face-on characters are the 3/4 convention anyway. So the plan was:
   - characters drawn exactly as in side-on, standing up
   - the ground seen from above, slightly squashed
   - buildings as a top face plus a front face
2. **One HTML file, one canvas, plain 2D drawing.** No framework, no Phaser. Everything is drawn into a single `<canvas>` every frame.
3. **Ported the thief's drawing code.** `drawThief` was copied from `src/game/player/thiefArt.ts`, and a `dir` parameter was added for side, front or back (see "The thief in three directions").
4. **Generated the placeholder art as SVG in code.** Every building and prop is an SVG string built by a small function from the same units as the world. Each one is turned into an image through a `data:` URI and drawn onto the canvas with `drawImage`. Nothing is hand-drawn or loaded from a file.
5. **Added depth sorting, collision on footprints, the jump and the camera.**
6. **Added the extras for comparison:** dusk and night, the see-through silhouette, and the footprint view.
7. **Checked it once in a headless browser with Playwright:** a desktop screenshot, one after walking, one at night, and one at phone size (412 × 915). That found two problems, and both were fixed before publishing:
   - he started out overlapping the pillar box
   - the area behind the back alley showed as green grass

---

## Units and the projection

Everything is measured in **S**, as in the game. S is the thief's height unit, and here **S = 56 world pixels**.

| Constant | Value | Meaning |
|---|---|---|
| `S` | 56 | World pixels per S. |
| `FS` | 0.75 | How much the ground is squashed in depth. 1 would be flat-on 3/4 like classic Zelda; 0.75 makes circles on the ground into ellipses. |
| `WW`, `WD` | 32 S × 24 S | The size of the street on the ground. |
| `INK` | `#1d2230` | The outline colour for everything. |

There's one rule for turning the world into the screen:

```
screen x = ground x
screen y = ground y × FS − height
```

That's the whole projection, written in the code as `sy(gy, z)`. Height goes straight up the screen, unsquashed. Depth on the ground is squashed by `FS`. Nothing ever rotates.

---

## Building placeholder art from boxes

Almost everything is made of **boxes**. In 3/4 a box shows exactly two faces:
- **its top**, a rectangle `depth × FS` tall
- **its front**, a rectangle `height` tall

Because nothing turns, there are never any side faces to draw.

`box(zMax, x, w, g0, g1, z0, z1, top, front)` returns those two rectangles as SVG:
- **Image space:** it works inside an image whose top margin is `zMax`, the tallest thing in it.
- **Mapping:** a point at ground depth `g` (0 at the back of the footprint) and height `z` lands at image y `zMax + g × FS − z`.
- **Top face:** from `(g0, z1)` to `(g1, z1)`.
- **Front face:** from `(g1, z1)` down to `(g1, z0)`.

A car, for example, is a wide box for the body plus a narrower box on top for the cabin, with the wheels drawn first so the body overlaps them.

Each placeholder function returns `{ img, w, d, zMax }`, where `w` and `d` are its footprint on the ground. `place(def, gx, gy)` puts it in the street:
- **Position:** the image is drawn at `(gx, sy(gy) − zMax)`, so its footprint's back-left corner sits at ground point `(gx, gy)`.
- **Sort key:** `gy + d`, its front edge on the ground (see "Depth sorting").
- **Bounds:** its screen rectangle, used for the see-through check.

| Placeholder | Function | Footprint (S) | Height (S) | Notes |
|---|---|---|---|---|
| Building | `buildingSvg(o)` | `w` × 4.3 | 3.6 to 8.5 | Roof with a parapet line and a vent box. Floors every 1.35 S with windows 0.5 × 0.72 S. Ground floor is either a door with windows, or a shop: sign board, wide window, dark door and an 8-stripe awning. Optional brick courses. |
| Car | `carSvg(colour, light)` | 3.2 × 1.45 | 1.0 | Body box 0.14–0.62 S off the ground, cabin box 0.62–1.0 S, wheels, head and tail lights. |
| Tree | `treeSvg(tones)` | 2.4 × 0.4 (trunk at centre) | 3.0 | Trunk, a 0.95 S canopy circle at 2 S up, two lighter circles for highlights. |
| Lamp post | `lampSvg()` | 0.8 × 0.3 | 2.9 | Pole, base and lantern. The lantern's height (2.7 S) is reused for its glow at night. |
| Belisha beacon | `beaconSvg()` | 0.6 × 0.2 | 2.2 | Pole in black and white bands, orange globe. |
| Pillar box | `pillarBoxSvg()` | 0.8 × 0.55 | 1.45 | Domed red box with a slot and a plate. |
| Bench | `benchSvg()` | 1.7 × 0.6 | 0.95 | Backrest box behind a seat box, two legs. |
| Bin | `binSvg()` | 0.62 × 0.5 | 0.95 | Rounded body with an elliptical lid. |
| Bus shelter | `shelterSvg()` | 2.8 × 1.0 | 2.35 | Glass back panel, posts, roof box with "BUS STOP", a seat. |
| Fountain | `fountainSvg()` | 3.0 × 3.0 | 1.4 | Round basin: rim ellipse, front band, water, a jet. |
| Planter | `planterSvg()` | 1.2 × 0.5 | 0.85 | Box with five flowers. |
| Kiosk | `kioskSvg()` | 2.2 × 1.6 | 2.3 | Box with a serving window and an "ICES" sign. |

**Turning SVG into images.** `svg(w, h, body)` wraps the shapes in an `<svg>` element and sets it as an `Image`'s `src`:

```
'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText)
```

Drawing waits until the image has loaded (`complete && naturalWidth`). The browser rasterises SVG images at the size they're drawn, so they stay crisp at any zoom.

---

## The street

The ground is drawn procedurally every frame by `drawGround`, back to front:
1. Paving slabs over everything, as a 1 S grid.
2. Darker tarmac for the back alley behind the buildings.
3. The two roads.
4. A kerb face where the north pavement meets the road below it: a 0.12 S strip. It's the only kerb whose face points towards the camera.
5. Double yellow lines along both kerbs, broken at the crossing.
6. A dashed centre line on each road.
7. The zebra stripes.
8. The park: grass with tufts, gravel paths, a low edge.
9. Three drains.

| Area | Where (S) |
|---|---|
| Back alley | y 0 to 6.5, behind the buildings, reached through the two gaps between them |
| North row of buildings | Footprints from y 2.2 to 6.5: terrace (x 0.4), corner shop (5.8), office (11.6), café (17.3) |
| North pavement | y 6.5 to 9.1 |
| Road | y 9.1 to 13.5, with the zebra at x 13.2 to 15.6 |
| South pavement | y 13.5 to 15.5 |
| Park | x 0.6 to 22.4, y 15.9 to 23.5 |
| Side road | x 23 to 27.4, the full depth |
| East buildings | x 27.6: a tall block (y 1 to 7) and a launderette (y 13.2 to 18.2) |

The gaps between the shop and the office (0.8 S) and between the office and the café (0.9 S) are wide enough for his 0.56 S footprint. That's how you get into the back alley and behind the buildings.

---

## Depth sorting

Everything that stands up, the buildings, props, trees and the thief, goes into one list, sorted every frame by **where it touches the ground**. Whatever is further back on the ground is drawn first:
- **Props:** the key is the front edge of the footprint, `gy + d`.
- **The thief:** the key is his ground y, wherever his feet are, even mid-jump.

That one rule gets all the overlaps right:
- In front of the shop, he's drawn after it.
- In the back alley, the building is drawn after him and hides him.
- Walking past a tree, he goes in front of or behind the trunk and canopy depending on which side of the trunk he's on.

Shadows go in with the ground, before anything that stands up, so whatever stands in front covers them.

---

## Collision on footprints

Collision happens only on the ground, never against the drawings:
- **The thief:** a circle of radius **0.28 S** at his feet.
- **Solid things:** either a rectangle (buildings, cars, benches, the kiosk, the shelter's back panel) or a circle (lamp posts, beacons, bins, the pillar box, tree trunks, the fountain).

`collide(nx, ny)` takes where he wants to be and pushes him out of anything solid:
1. **Clamp:** keep the point inside the street.
2. **Rectangles:** find the closest point on the rectangle. If that's nearer than 0.28 S, push him out along that direction. If his centre is inside the rectangle, push him out the shortest way along an axis.
3. **Circles:** if the centres are closer than the two radii added together, push him out along the line between them.
4. **Repeat:** run the whole thing twice, so a push out of one thing into another gets fixed.

Moving diagonally into a wall slides him along it, because only the part of the movement going into the wall is undone.

**Show footprints** draws every solid in translucent red and his footprint in power blue, squashed by `FS` like everything on the ground.

---

## The thief in three directions

The drawing is `drawThief(ctx, o)`, ported from the game's `thiefArt.ts`, in units of S with the body centre at the origin. The game's constants carry over unchanged:
- the face scale `K = 0.68`
- the trapezoid body
- the head, radius 0.27
- the mask band 0.3 K deep at eye height y = −0.43
- notched strips for the ties
- the gloves, radius 0.17

The new parameter is **`dir`**:

**Side:** exactly the game's side view.
- The head is at x = 0.03, and the knot is on the back edge of the head.
- The ties rest at 118° and 140°, swinging out to 172° and 191° at a run.
- Pupils look ahead.
- Facing left mirrors the drawing (`scale(-1, 1)`), as in the game.

**Front (facing the camera):**
- The head moves to x = 0.
- The eyes sit symmetrically at ±0.19 K.
- The smirk is centred (shifted by −0.01).
- The ties come from behind the centre of the head, at 148° and 32°, 0.42 long, so only their ends peek out either side. They spread to 162° and 18° with speed.
- Pupils follow his sideways movement (`lookX × 0.03 K`) and sit slightly low.

**Back (facing away):**
- No face.
- The band goes all the way round, with the knot in the middle of the back of the head (radius 0.06).
- The ties hang down his back at 102° and 80°, 0.32 and 0.26 long, swaying at 60% of the side view's sway.
- The gloves are drawn *before* the body, so they sit behind him.

**In every direction:**
- In the front and back views, the gloves swing up and down (±0.06 with the walk) rather than forwards and back.
- The feet take turns lifting by up to 0.07.
- In the air, the gloves rise by 0.14.
- He fades with the light and his eyes glow in the dark, as in the game. Light is 1 in daytime.

**Which way he faces** comes from the direction he's moving:
- If the sideways part is at least 0.75 of the up-and-down part, he faces sideways. So the side view wins on diagonals.
- Otherwise he faces the camera when moving down the screen, or away when moving up it.
- He keeps the last direction when he stops.
- `lookX` eases towards his sideways input at 8 per second while he moves, and back to centre at 4 per second when he stops.

**Placing him:** he's drawn at `(x, sy(y) − z)`, scaled by his squash and stretch around his feet, then moved up 0.62 S, because the game's drawing has its origin at the body's centre and his feet at 0.62.

---

## Movement and feel

| What | Value |
|---|---|
| Walk / run | 2.6 S/s and 4.7 S/s, the same as the game |
| Walk cycle | The phase advances at 9 per second walking, 13 running. The glove swing eases towards `sin(phase)` at 12 per second. |
| Tie trail | Eases towards 0.45 walking, 1 running and 0 still, at 5 per second |
| Bob | `|sin(phase)| × 0.03 S` while walking on the ground |
| Jump | Take-off at 5.2 S/s, gravity 17 S/s², so the peak is about 0.8 S |
| Squash and stretch | 0.86 × 1.16 on take-off and 1.2 × 0.82 on landing, sprung back (stiffness 300, damping 20, step capped at 1/30 s). Off when the device asks for reduced motion. |
| Ground shadow | An ellipse with a 0.48 S radius, `× FS × 0.6` as deep, at 0.28 opacity. It shrinks to 55% as he rises, over 2.2 S of height, and stays on the ground. |
| Tree shadows | Ellipses with a 1.0 S radius at 0.16 opacity, nudged 0.25 S right and 0.1 S down from the trunk |

---

## The camera

- **Target:** a point 0.8 S above his feet, approached at 6 per second.
- **Limits:** kept inside the street, from 8.5 S above the ground's back edge (so the tallest building's roof shows) to the front edge.
- **Size on screen:** the zoom keeps S at **52 to 64 CSS pixels**, the shorter side of the view divided by 7.35. That's the same as the game, so he looks the same size.
- **Sharpness:** the canvas is drawn at the screen's pixel density, capped at 2.

---

## Seeing him behind things

When "See him behind things" is on, the page first finds the drawables that come after him in the sort and whose screen rectangles overlap his. If there are any:
1. **Draw him** into a small off-screen canvas, `sil`, sized to his rectangle. Then fill it with power blue `#8fd3ff` using `source-in`, which leaves a flat blue silhouette.
2. **Draw the things in front of him** into a second off-screen canvas, `mask`, with the same framing.
3. **Cut the silhouette to the overlap** by drawing `mask` onto `sil` with `destination-in`. Only the part of him that's actually covered remains.
4. **Draw `sil`** onto the street at 0.62 opacity.

The parts of him that aren't covered stay exactly as drawn, and only the hidden parts show blue.

---

## Dusk and night

Day draws nothing extra. For dusk and night:
1. **The tint layer:** a half-resolution off-screen canvas, `dark`, is filled with the tint:
   - **Dusk:** `rgba(70, 40, 90, 0.38)`
   - **Night:** `rgba(8, 12, 30, 0.80)`
2. **Cutting out the light**, with `destination-out`:
   - **Lamps:** a pool of radius 3.6 S at each lamp's base, squashed by `FS` so it's an ellipse on the ground. It's a radial gradient: 0.95 at the centre, 0.66 at 55%, 0 at the edge.
   - **Shopfronts:** a glow from each lit window, fading down across the pavement.
   - **Him:** a faint pool of 1.8 S around him at 0.35.
3. **Layering:** the layer is stretched over the whole view, then the glows go on top with `lighter`:
   - **Lamp heads:** 0.9 S across, with a slight flicker of ±8%, which is off for reduced motion.
   - **Beacon globes:** they blink on and off about every 1.3 s.
4. **His light:**
   - **Night and dusk minimums:** 0.12 at night and 0.72 at dusk.
   - **Lamps:** full within 1.2 S of a lamp, fading to nothing by 4 S.
   - **Shopfronts:** 0.75 in front of a lit window.

---

## Input

**Keyboard:**
- Keys are tracked as a set of what's held.
- Space queues a jump.
- Arrow keys and Space don't scroll the page.

**Touch and mouse:**
- A press anywhere on the street starts a **floating stick** where you pressed. It's 96 px across, and the knob travels up to 40 px.
- The stick's direction is the movement, and past 92% of its travel he runs.
- The Jump button sits bottom right, clear of the phone's safe area.

---

## Extending it

- **Add a building:** add an entry to the `B` array:
  - its position and size: `x`, `w`, `h`
  - its colours: `roof`, `wall`, `glass`, `trim`
  - window columns: `cols`
  - either `door` (which column) and `doorCol`, or `shop` (the sign text) with `sign` and `awning` colours

  The loop builds the image, places it at the row's y and adds its footprint as a solid.
- **Add a prop:** write a function that returns `{ img, w, d, zMax }` using `box()` and SVG shapes, `place()` it, then push a footprint into `solids`.
- **Add a character:** give the drawing a `dir`, side, front or back, and draw it standing up with its origin at the body's centre. Then add a drawable with its feet's ground y as the key and a footprint circle for collision.
- **Change the camera tilt:** change `FS`. Everything on the ground follows it. Heights don't.

---

## What it doesn't do (it's a mock-up)

- **Nobody else is in the street:** no other characters and no traffic. The cars are parked.
- **Height doesn't collide:** he can't stand on top of anything, and a jump doesn't clear anything, because collision is only on the ground.
- **No combat or interaction poses:** only walking and jumping have front and back versions.
- **The ground is redrawn from scratch every frame.** That's fine at this size. A real game would cache it in chunks.
- **Covering objects are drawn twice** while he's hidden, once for the street and once for the mask. That's cheap here, but worth knowing.
