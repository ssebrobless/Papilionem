# Claude Review — G0 Visual / Spatial / AI Replan

Date: 2026-04-29
Author: Claude Opus 4.7 (deep review of `docs/CLAUDE-REVIEW-REQUEST-G0-VISUAL-SPATIAL-AI-2026-04-29.md`)
Scope: G0 hold; closes after a fresh human capture proves the listed symptoms gone.
Status: binding for implementation order, file ownership, math, and acceptance.

This document supersedes the H-* phase order in
`docs/G0-HOLD-TRIAGE-PLAN-2026-04-29.md` and the P-* order in
`docs/VISUAL-SIM-BOARD-REBUILD-PLAN-2026-04-29-CLAUDE-REVIEW.md` for the next
implementation slice. The earlier plans are not wrong; they are now upstream.
This is the round-2 plan that lands after their contracts are declared.

---

## Section 0 — Executive Verdict

```text
verdict
|- the spatial CONTRACTS are already declared and signed (boardPos, projection,
|  exits, schemaVersion 5, distanceBoard, ability radius units)
|- the RUNTIME is still riding both rails: legacy gridPos drives movement and
|  ambient travel, board-derived projection drives rendering
|- the green-rectangle, focus-hijack, top-bias, and jitter symptoms are all
|  downstream of that split, NOT of missing math
|- a full re-foundation would discard the contract work and not fix the lived
|  experience; a surgical truth-unification round will
|- AI/emergence cannot be judged honestly until the spatial truth is one rail
|  and conversation/feed reflects real events
`- the believable-society goal is reachable through coupling tightenings and
   world incentives; it does NOT require new drive/emotion/edge families or a
   richer ML runtime first
```

The previous CLAUDE review (P0–P8) lands the foundation. The current G0 hold
proves that landing the foundation is not the same as moving the runtime onto
it. The work below is the migration work the prior plan did not own.

---

## Section 1 — Findings, Ordered by Severity

### F1 (critical) — Ambient zone travel calls focusZone() and hijacks the camera

`core/gameCore.js:4364-4366`:

```js
zoneTravel.hasSwappedZone = true;
if (this.getFocusedZoneId() === previousZoneId) {
    this.focusZone(zoneTravel.targetZoneId);
}
```

Every ambient migrator that crosses the exit segment forces a `focusZone()` on
the player whenever the player happens to be on the source zone. The G0
capture recorded `83` `navigation/focus-zone` events in under 5 minutes. This
is the single largest comprehension-break in the build.

Fix shape: introduce a `zoneTravel.cameraFollow` flag (default `false` for
ambient/autonomous, `true` only for explicit player-initiated travel actions).
Replace the unconditional `focusZone(...)` call with a guarded one. No save
schema change.

### F2 (critical) — drawSimBoardGround draws a double fill plus a hard inner border

`core/renderManager.js:625-633`:

```js
layer.fill(...palette.canvas, 255);
layer.rect(0, 0, gameConfig.canvas.baseWidth, gameConfig.canvas.baseHeight);   // full canvas
layer.fill(...palette.ground, 255);
layer.rect(x, y, width, height, 3);                                            // inner rect
layer.noFill();
layer.stroke(...palette.border, 210);
layer.strokeWeight(2);
layer.rect(x, y, width, height, 3);                                            // hard border
```

The result reads exactly as the player reported: "green field plus
unexplained inner rectangle." The inner rectangle IS the playable envelope, but
the outer fill makes it look like a window onto another scene.

Fix shape: keep the canvas fill very subtle (a darker out-of-play tint or a
soft vignette toward the borders), draw the playable rect with a softer
border (single-line, 30–60 alpha, 1px) or no border at all, and rely on the
unit grid + zone tint to communicate the envelope.

### F3 (critical) — drawZoneWorldOverlay draws the legacy iso diamond in focused sim-board mode

`core/renderManager.js:3090-3151`. The early-return at line 3100 only catches
the `section-scenes` world; in `sim-board` world the function falls through to
draw all four zone polygons via `gridManager.isoToScreen(zone.bounds)`,
including labels at zone centers. This is the "highlighted map sits awkwardly
in the middle" complaint. It also creates the appearance of a second, smaller
play field on top of the real one.

Fix shape: in sim-board world, suppress polygon and label rendering unless
`viewMode === 'overview'`. Move the focused-zone label into the UI chrome (a
small chip at the top of the canvas) instead of drawing it on the playfield.

### F4 (critical) — Movement is split: legacy gridPos drives intent, boardPos is derived for render

`entities/butterfly.js:754, 769, 972, 1070-1071, 1145, 2109-2112, 2186-2207,
3089, 4334`. Wander/social/edge-travel target sampling assigns
`this.movement.target = this.gridPos`, then movement integrates against
gridPos, then render derives `boardPos` lazily from screen `x/y` via
`screenToBoard()`.

Effects observed:
- Top-bias: gridPos(y) for two sample butterflies is negative
  (`-8.65`, `-0.19`), meaning the movement target is "above" the iso origin
  even though the projected playfield ends at `y = 96`. Movement is integrated
  in iso coords, projection is rendered in board coords; the disagreement
  pushes butterflies upward.
- Jitter: arrival/contact resolution converts back to gridPos and reacquires.
- Edge travel: zone arrival anchors are stored as `{ x, y }` in screen space;
  board-cell consistency is approximate.

Fix shape: declare `boardPos` the canonical movement truth. Replace
`this.movement.target = this.gridPos` with `this.movement.target = this.boardPos`;
sample wander/social targets as `{ u, v }` inside the projected board envelope;
integrate movement in board units; project to screen via `boardToScreen()` for
rendering only. Preserve `gridPos` as a debug helper but remove every read of
it from movement intent.

### F5 (high) — Sprite cache reports 0/0 in capture; the high-fidelity path is not actually exercised

The G0 capture summary shows `spriteCache: 0/0` despite sprite-smoothing
already being wired (`core/renderManager.js:109, 118-121`). Either the bake
path is not running, the telemetry reads the wrong cache, or the layer-level
smoothing is being shadowed by per-frame `noSmooth()` calls along the wing
draw chain.

Fix shape: instrument the bake path with a one-line debug overlay
(`baked sprites: <hits>/<misses> | entries | surfaceMB`); confirm the wing
asset is the high-resolution source; if hits stay at zero, raise the wing bake
supersample by 1.5× to compensate even when smoothing is bypassed.

### F6 (high) — Block placement is screen-pixel-driven; no integer cell snap, no occupancy validation

`entities/block.js:101, 155`. `block.moveTo()` sets
`this.gridPos = gridManager.screenToIso(this.x, this.y)` and calls
`this.syncBoardPosFromScreen()`. There is no integer snap to `{u, v, h}`, no
duplicate-cell rejection, no support test in the placement pipeline.

The contract `1 block = 1 board unit = 1 support/stack unit` is honoured at
the rendering layer (`renderWidth = 20 = ppu`), but not at the placement
layer. Two blocks dropped at adjacent screen pixels can occupy the same logical
cell.

Fix shape: in `block.moveTo()`, after `screenToBoard()`, snap `boardPos.u` and
`boardPos.v` to integers (`Math.round`); reject placement when the cell is
occupied by another solid block in the same zone, when no support exists for
`h > 0`, or when `currentZoneId` is `sun-court` (Training Grounds). Recompute
screen `x/y` from the snapped `boardPos` so visible position matches logical
position.

### F7 (high) — Sim-board zone travel is opt-in (edgeMode), not the default rail

`core/gameCore.js:4435-4442`. The edge-based traveler runs only when
`zoneTravel.edgeMode` is true. Other paths (`approaching`, `lining-up`,
`exiting`, `departing`) still target legacy doorway anchors
(`departureApproachAnchor`, `departureLineupAnchor`,
`zoneTravel.sourceAnchor`). In sim-board world the legacy phases SHOULD never
run, but no global guard enforces that.

Fix shape: in sim-board world, every zone-travel intent must be created with
`edgeMode: true`. Add an assertion that legacy phases bail to edge mode if
they are reached. The legacy doorway anchor path remains live for
`section-scenes` world only.

### F8 (high) — drawSimBoardGroundGuides defaults off; normal play has no visible unit cue

`core/renderManager.js:610` (`shouldDrawSimBoardGroundGuides()`) and
runtime-geometry `guideDefault: false`. The audit confirms grid guides are
hidden in normal play, but the user's spatial direction is "normal play
should have a subtle visible unit grid or equivalent unit cue."

Fix shape: introduce two grid intensities. A subtle "ambient" grid (alpha 12,
every 4 units, drawn into the background layer once) is on by default. A
debug "diagnostic" grid (alpha 80, every 1 unit, with axis labels) remains
behind the existing toggle. The ambient grid quietly communicates one-unit
spacing without making the play look like a debugger.

### F9 (high) — Butterfly altitude is not legible; all sampled boardPos.h = 0

The audit confirms `boardPos.h = 0` for every sampled butterfly. The board
contract carries an `h` channel, but butterfly altitude is currently animated
through `y + shadowOffset` rather than driven from a `flightH` field. There
is no shadow-vs-sprite separation that communicates "this butterfly is
hovering above the ground."

Fix shape: add `butterfly.flightH` (transient visual altitude, units of
`hStep`). Render the shadow at `boardToScreen(u, v, 0)` and the sprite at
`boardToScreen(u, v, flightH)`. Durable occupancy stays at `h = 0` unless a
future flight-occupancy rule is opened. Add a per-butterfly altitude probe
(low / medium / high) over the same board cell to validate the visual.

### F10 (medium) — Flowers stack in old saves; new lifecycle (decay → pile → cleanup) not implemented

The G0 capture shows flower count rising 183 → 186 with visible stacking even
after the loaded-save cleanup pass. The "decay to dirt pile after 60s,
picked → reserve food ball" loop the user described is not yet implemented.

Fix shape: add `flower.spawnedAtFrame`, decay path, dirt-pile entity, picked
→ reserve-food-ball path, and cleanup affordance. Drive cleanup pressure
through existing `selfMaintenance` / `resourceControl` / `caregiving`. No new
drive families.

### F11 (medium) — Feed filter buttons (talk/action/learn) do not map to real event categories

The current feed pulls from `communicationSystem`, `gameUI`, and event-bus
history with category names that drift from the filter chips. Player-reported:
"feed/talking/action/learn filters do not behave correctly."

Fix shape: define a single category enum
(`talk | action | learn | warning | system`); have every emit path stamp a
canonical category at the source; rebuild the filter UI to map 1:1 to those
enums; demote contextless `warning` lines unless a real danger / threat /
social-warning signal is live.

### F12 (medium) — Talk does not show motive → target → response → consequence in the feed

The conversation infrastructure (motives, interpretation, dialogue residue,
edge deltas, reciprocity, repair) is live and frozen at `n8`. The visibility
gap is the FEED, not the systems. Conversation reads as one-line flavor text
because the loop is not surfaced as a thread.

Fix shape: feed groups same-pair lines into 2–4 line exchange threads with a
short post-fix that names the durable consequence (e.g.,
"trust +3, comfort +2"). Threads use existing dialogue-residue data; no new
durable state.

### F13 (medium) — Cooperation pressure is absent: world does not require/reward two butterflies working together

The locked drives are sufficient (`socialConnection`, `caregiving`,
`resourceControl`, `selfMaintenance`, `rest`, `exploration`,
`statusExpression`, `safetyAvoidance`), but no current world rule MAKES
butterflies need each other. Building works alone, sheltering is solo, no
scarcity event triggers sharing/warning.

Fix shape: a small set of incentive hooks — heavy-block (h ≥ 3) requires 2
carriers; shelter recovery rate scales with co-occupants; a periodic zone
scarcity pulse triggers warning/sharing signals; distress signals draw
nearby caregivers. All hook into existing systems; no new families.

### F14 (medium) — ML scoring is live, but no audit demonstrates ML-on visibly differs from ML-off

`NEURAL-SOCIAL-SCORING-AUDIT.md` proves the feature contract is wide and ML
scores richer social inputs. There is no end-to-end "ML-on vs ML-off in long
free play" comparison capture. Without that proof, the user's "ML may not be
doing enough visible behavior work" critique is unanswerable on either side.

Fix shape: add a deterministic 2-minute capture lane, run with
`mlInferenceSystem.preferModelBacked = true|false`, diff feed/movement/social
deltas. If the diff is small, ML cadence/feature wiring needs work; if large,
add trace capture to feed future training (R8.1 below).

### F15 (low) — Player/cursor-as-social-actor seam is not preserved in any reservation doc

The user's far-future goal — player gives a cursor name, butterflies know it,
chat threads attribute lines to that name — has no documented seam yet. If
spatial / dialogue / save migrations land without that seam in mind, future
work risks breaking it.

Fix shape: a one-page reservation doc declares the candidate fields
(`playerProfile.displayName`, `cursorEntityId`, `cursorBoardPos`,
`butterfly.relationshipsToPlayer`, `talkMode = "to_player"`). NOT implemented;
just declared so future migrations don't conflict.

### F16 (low) — runtime geometry shows placement region (108..396) extends below projected rect (96..342)

The placement region bottom (396) sits below the visible projected rect bottom
(342.4) by ~54 px. Butterflies legally placed near the bottom of the placement
region appear OUTSIDE the visible green field. Combined with F2, this
amplifies the "where can butterflies actually move?" confusion.

Fix shape: tighten the placement region to match the projected rect (±1 board
unit margin). Pure data fix, one zone-system function.

---

## Section 2 — Hard Constraints (Codex Must Respect)

```text
inviolable
|- long-running saves are sacred; no save wipe to hide symptoms
|- 1 block = 1 board unit = 1 support / stack unit
|- Training Grounds (sun-court) receives no ambient blocks
|- the four zones keep their assigned quadrants:
|  |- ivy-cloister  -> Open Land NW (top-left)
|  |- sun-court     -> Training Grounds (top-right)
|  |- moss-hollow   -> Open Land SW (bottom-left)
|  `- pool-heart    -> Open Land SE (bottom-right)
|- first ML runtime stays local/static policy scoring
|- ML may score choices but may not own durable feelings, memories, or bonds
|- life-sim/social systems own durable truth
|- no new drive/emotion/memory/social-edge vocabulary
|  unless a NAMED contract is explicitly reopened in this round
|- preserve identity, memory, lineage, relationship, and save continuity
|- success target: believable butterfly society, NOT indistinguishable humans
|- never claim literal consciousness or subjective feeling
|- battle stays top-down; the SINGLE-PLAYER-AUTOBATTLE-CONTRACT is not reopened
`- existing schemaVersion = 5 stays the canonical save shape; only additive
   migrations are allowed in this round
```

---

## Section 3 — Visual / Spatial / 3D Math Section

### 3.1 Authoritative coordinate per entity

`boardPos = { zoneId: string, u: number, v: number, h: number }` becomes the
canonical positional truth for butterflies, blocks, flowers, eggs, chrysali,
caterpillars, and reserve-food balls. Screen `x/y` is derived. Legacy
`gridPos` stays computed but is debug-only.

### 3.2 Projection (already declared, do not change)

```text
per zone:
  ppu     = 20      (pixels per board unit)
  groundT = 0.56    (ground-tilt factor)
  hStep   = 8       (pixels per discrete h step)
  origin  = { screenX: 40, screenY: 96 }   (top-left of u=0, v=0)
  widthUnits = 36
  depthUnits = 22

boardToScreen({zoneId, u, v, h}):
  return {
    x: origin.x + u * ppu,
    y: origin.y + v * ppu * groundT - h * hStep
  }

screenToBoard(x, y, zoneId, hHint = 0):
  return {
    zoneId,
    u: (x - origin.x) / ppu,
    v: (y - origin.y + hHint * hStep) / (ppu * groundT),
    h: hHint
  }
```

Inverse projection is non-injective in `h`; for pointer / debug / placement,
callers always pass `hHint = 0` (or the carrier's known `h` for carried
blocks). This is already implemented; the fix is making EVERY consumer route
through it.

### 3.3 Render sort key (already declared)

```text
computeRenderSortKey(entity):
  uvh = entity.boardPos
  bias = entityTypeBias(entity.type)
  return (uvh.v * 1000) + uvh.u + (uvh.h * 0.5) + bias
```

`entityTypeBias`:
- shadow / ground halo: −0.30
- ground footprint cues: −0.10
- block / flower / egg: 0.00
- butterfly body: +0.05
- carried block: +0.10
- aerial particles: +0.20

### 3.4 Top UI-safe boundary

```text
uiSafeTopY    = origin.y                         // currently 96 logical px
playfieldTopV = 0
playfieldBotV = depthUnits                       // currently 22

playfieldTopScreenY = boardToScreen(_, 0, 0).y   = 96
playfieldBotScreenY = boardToScreen(_, 22, 0).y  = 96 + 22*20*0.56 = 342.4

placement region clamps: minY = playfieldTopScreenY + 0.5*hStep
                         maxY = playfieldBotScreenY - 0.5*hStep
```

Migrators / wanderers may not select a target with
`v < 0.5` or `v > depthUnits - 0.5`; targets in the top 15% of `v` are flagged
in the movement audit. This eliminates the soft top-edge bias even before
F4 lands.

### 3.5 Visible unit grid (ambient default-on)

Add a once-per-zone-bake background layer (already exists) with the
following rule:

```text
ambient grid:
  every 4 board units: alpha 12 stroke, 1px, color = palette.guide
  every 1 board unit:  not drawn at ambient intensity
  envelope border:     alpha 60, 1px, single thin line
  drawn ONCE into the bg layer at zone bake; no per-frame cost

diagnostic grid (existing toggle):
  every 1 board unit: alpha 80, 1px
  axis labels at corners
```

The ambient grid replaces the current double-fill + hard-border treatment.
Players see units without seeing a debug tool.

### 3.6 Edge-based zone travel (already in data, finish runtime)

`zone.exits[*]` contracts already declare `exitSegment`,
`arrivalSegment`, and `flightVector`. Required runtime guarantees:

```text
sim-board world:
  ALWAYS create zoneTravel with edgeMode: true
  exit point = clamp to exitSegment, choose midpoint or jitter ±20% of segment
  arrival point = uniform sample on arrivalSegment
  invisibility window = 2 frames (already implemented)
  cameraFollow = false unless explicit player intent
```

Legacy doorway approach phases (`approaching`, `lining-up`, `exiting`) MUST
NOT execute in sim-board world.

### 3.7 Block placement (integer cell, no half-cell, no duplicate, no Training-Grounds, no unsupported stack)

```text
acceptCellPlacement(zoneId, u, v, h):
  if zoneId == "sun-court":          return reject("training-no-blocks")
  uInt = Math.round(u)
  vInt = Math.round(v)
  if cellOccupiedBySolid(zoneId, uInt, vInt, h): return reject("duplicate-cell")
  if h > 0:
    supportH = h - 1
    if not cellOccupiedBySolid(zoneId, uInt, vInt, supportH): return reject("unsupported")
  if h > maxStackHeight (= 12): return reject("over-stack")
  uOutOfRange = uInt < 0 or uInt >= widthUnits
  vOutOfRange = vInt < 0 or vInt >= depthUnits
  if uOutOfRange or vOutOfRange: return reject("out-of-zone")
  return accept({ u: uInt, v: vInt, h })
```

After accept, recompute `block.x, block.y` from
`boardToScreen(uInt, vInt, h)`. Visible position now matches logical
position.

### 3.8 Flower / object placement

Flowers, eggs, cocoons, caterpillars, dirt piles, and reserve-food balls
follow the same rule with relaxed integer constraint: positions snap to
`{ u: Math.round(u * 2) / 2, v: Math.round(v * 2) / 2 }` (half-cell granularity)
and respect a per-zone minimum spacing of `flowerMinSpacingUnits = 0.9`.

### 3.9 Battle / ability radius (already declared, validate after F4)

Radii in `*Units`; visual rings projected as `radiusUnits * ppu * groundT`
(ground-circle) or `radiusUnits * ppu` (top-down arena). Already-locked
distance helpers:

```text
distanceBoard(a, b):                        // ground 2D
  du = a.u - b.u
  dv = a.v - b.v
  ground = sqrt(du*du + dv*dv)
  vertical = abs(a.h - b.h)
  euclidean = sqrt(du*du + dv*dv + (a.h - b.h)*(a.h - b.h))
  withinCylinder(rU, hU): ground <= rU and vertical <= hU
```

Default ability shapes:
- support / heal / aura (warmRally, teaching, sleep, trust, sparkle, shimmer):
  cylindrical with `heightReach = 2` h-steps
- projectile / strike (cascade, lesson-glyph, speedzone):
  spherical (Euclidean), `heightWeight = 0.6`
- golden crown / status: ground-only, `h` ignored

### 3.10 Battle attack timeline (already locked)

```text
ability action timeline (durationMs):
  startup    [0.00, 0.18]   wind-up bob; no projectile yet
  travel     [0.18, 0.78]   projectile in flight, P(t) below
  impact     [0.78, 0.86]   hit cue + recoil starts
  recoil     [0.86, 1.00]   target recoil + source recovery

P(t) (board-space):
  u(t) = lerp(A.u, B.u, t)
  v(t) = lerp(A.v, B.v, t)
  h(t) = lerp(A.h, B.h, t) + arcHeight * sin(pi * t)
  screen(t) = boardToScreen(u(t), v(t), h(t))

arcHeight defaults:
  veil / aura     0.0
  bolt / pulse    0.4
  cascade / glyph 1.2
```

Battle remains top-down. Battle outcome resolution stays in `battleSystem`;
render math owns visual cue only.

---

## Section 4 — Block / Flower / Object Lifecycle Section

### 4.1 Block lifecycle

```text
block:
  spawn      -> ambient/debug; rejects in sun-court
  pickupBy   -> carriedById set; pose anchored to carrier
  carry      -> boardPos derived per frame from carrier anchor
  placement  -> moveTo() snaps to integer cell via acceptCellPlacement()
  stack      -> h > 0 requires support test
  destroy    -> existing path; emits object:destroyed
  save       -> v5 boardPos serialized; supportBlockId already saved
```

Migration on load: any v5 block whose stored `boardPos` does not pass
`acceptCellPlacement()` is logged with `runtime-issue type=block-cell-coerce`,
then snapped to nearest legal cell. Existing audit pass-rates must hold or the
phase rolls back.

### 4.2 Flower lifecycle

```text
flower:
  spawn        -> respects per-zone cap (already live)
                  enforce flowerMinSpacingUnits >= 0.9 BEFORE placement
                  spawnedAtFrame = currentFrame  (NEW field)
  picked       -> remove flower; create reserveFoodBall { color = flower.color,
                  zoneId, u, v, carrierId? }
                  reserveFoodBall does NOT decay
  eaten        -> nutrition + satisfaction signal (existing)
  unpicked-aged-> when currentFrame - spawnedAtFrame >= decayFrames (= 60s * fps),
                  remove flower; create dirtPile { zoneId, u, v }
  decay step   -> cleanly emits object:decayed; no save schema field churn
                  beyond spawnedAtFrame and the new pile entity
```

`dirtPile` is a new object subtype, NOT a new drive family. Cleanup uses
existing affordance hooks:

```text
dirtPile object affordance (life-sim hook):
  signal: "soiled-place" (already exists in object profile vocabulary)
  drives that respond:
    selfMaintenance (cleanliness pressure)
    resourceControl (territory upkeep)
    caregiving      (group hygiene)
  cleanup action:
    butterfly approaches dirtPile within distanceBoard.ground <= 1.5
    on contact: pile destroyed
    optional: emits a small +reputation residue against the cleaning butterfly
```

### 4.3 Reserve food ball

```text
reserveFoodBall:
  visual: small same-color dot, slightly raised (h_visual = 0.25)
  not affected by decay timer
  pickup-by: any butterfly that currently has feedUrgency >= threshold
  consume: removes the ball, applies nutrition signal stronger than fresh
           flower pulse, optional + comfort residue if shared
```

### 4.4 Object placement contract (one accessor)

A single `objectPlacementSystem.placeAtBoardCell(type, zoneId, u, v, h, opts)`
becomes the only legal way to land an object on the board. It performs:

1. zone validity check
2. type-specific snap (integer for block, half-cell for flower)
3. occupancy validation
4. screen-coord recomputation
5. side-effects (reserve-food creation, dirt-pile decay, etc.)
6. event emission

Forbidden after this round: any direct
`object.x = ...; object.y = ...; object.gridPos = screenToIso(...)` pattern in
new code paths.

---

## Section 5 — Battle / Attack / Ability Radius Section

### 5.1 Garden ability radii

Already declared in `*Units` (see Section 3.9 and prior CLAUDE-REVIEW Section
4.10). Required validation lane: a fresh "ability-radius-conversion-audit"
re-run on the lived-in save to confirm recipient sets match the
section-scenes baseline within ±1 recipient on each of 8 randomized seedings.
No design change.

### 5.2 Garden ability shapes by family

```text
warmRally / Warm Welcome (healing/panic):
  cylindrical, radiusUnits = 4.5, heightReach = 2
  visible ring: ellipse on ground, projected at radiusUnits * ppu wide

shimmerVeil / Twilight Dancer (sleep comfort):
  cylindrical, radiusUnits = 5.0, heightReach = 3 (reaches up to shelters)

teachingPulse / Ancient Scholar:
  cylindrical, radiusUnits = 3.8, heightReach = 2

trustCascade / Nervous Jewel:
  spherical, radiusUnits = 6.6, heightWeight = 0.6

stationRadius (training):
  cylindrical, radiusUnits = 2.1, heightReach = 1

impactRadius (training strike):
  spherical, radiusUnits = 1.1, heightWeight = 1.0

speedzone / Electric Violet:
  cylindrical, radiusUnits = 4.0, heightReach = 2

sparkleTrail / Delicate Pink:
  trail (not radius); see section 5.3

goldenCrown:
  ground-only, radiusUnits = 5.0, h ignored
```

### 5.3 Sparkle trail (Delicate Pink) as a spatial surface

Existing trail is decoration. Promote it to a spatial surface by recording
trail emit points as `{ zoneId, u, v, emittedAtFrame }` and giving
butterflies that pass over a recent trail point a small `comfort` /
`curiosity` signal. No new family; the trail just becomes a one-line
read-target for `lifeSimSystem.applyAmbientSignal()`.

### 5.4 Battle attacks (no plane reopening)

`SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md` says battle is top-down. Do NOT
reopen. The conversion of `*Px` → `*Units` is already locked in
`gameConfig.battle.motion.unitsPerArenaCell` and held green by
`run-r5-battle-presentation-audit.js`. The R-* phases below do not touch
battle math. They only run the regression audit at the gate.

### 5.5 Projectile path

One unified path math (already locked):

```text
P(t) = lerp(A_screen, B_screen, t) + arenaUp * (arcHeight * sin(pi * t))
```

Hit volume = ability-defined (`ground-circle | sphere | cylinder | cone`).
Visual style stays ability-specific via `projectileStyle`. Battle outcome
remains autobattle-timed inside `battleSystem`.

---

## Section 6 — AI / Emergence Section

### 6.1 Honest assessment of current butterflies

Reading the LIFESIM-EXPRESSION-AUDIT, NEURAL-SOCIAL-SCORING-AUDIT,
DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT, and ACTIVE-SOCIAL-COGNITION-BOARD
(closed live through `n8`), the cognition stack is real:

```text
real durable truth (live)
|- 8 drive channels      (selfMaintenance .. rest)
|- 9 emotion channels    (threat .. exhaustion)
|- 8 memory families     (place .. care)
|- 8 social-edge channels(trust .. protectiveness)
|- routines              (movement, social, care, resource, rest, vigilance, teaching)
|- distortion biases     (trauma, anxiety, withdrawal, fixation, insomnia, oversleep, warpedTeaching)
|- genetics + upbringing
|- lifecycle truth
|- pair chemistry        (ease, playfulness, tenderness, fascination, irritation, longing, rivalryHeat, repairOpenness)
|- society summaries     (reputation, belonging, cliqueComfort, cliqueTension, witnessedWarmth, witnessedEmbarrassment, protectivenessField, teachingPrestige)
|- 12 conversation motives
|- dialogue residue + repair + forgiveness + rememberability bands
|- ML scoring of action / target / signal / risk / battle posture
`- save continuity through schemaVersion 5
```

The user's "real artificial intelligence" goal is closer than they think.
What is missing is NOT new families. It is:

```text
the believability gap
|- visible coupling: state changes happen but the player does not see them
|- world incentives: nothing in the world FORCES cooperation, sharing, or care
|- conversation surfacing: motive->target->response->consequence is not
|  rendered as a thread; one feed line per event flattens it
|- trace evidence: ML decisions are scored, but no one has compared
|  ML-on vs ML-off in a side-by-side capture, so the user cannot tell what
|  ML is buying
`- consequence visibility: relationship deltas, memory packets, and routine
   reinforcement happen, but the player has to read Inspect to know
```

### 6.2 Behavior taxonomy: which behaviors are rule-gated, which are feedback loops

Honest taxonomy as of the current build:

```text
direct rule branches (mostly)
|- cursor-flee distance check
|- nearest-flower-of-acceptable-color targeting
|- "be careful at edge" warning emission threshold
|- panic state entry from sudden cursor proximity
|- battle launch from top-right shrine
`- spawn cooldowns / rate limits

genuine feedback loops (through 2+ owners)
|- drive accumulation -> behavior bias -> action choice -> outcome -> emotion -> drive update
|- conversation motive selection -> interpretation -> dialogue residue -> edge delta -> later target preference
|- crowding/novelty -> derived bias -> wander/social/rest split
|- teaching pulse received -> upbringing.lessons -> later interpretation clarity
|- pair chemistry delta -> follow-through mode -> proximity pressure -> edge reinforcement
|- ML feature bundle -> scored preference -> action -> downstream feature change -> next score
|- distortion bias -> warped interpretation -> different dialogue residue -> different edge delta
|- social ecology summary (cliqueComfort, protectivenessField) -> behavior bias -> visible movement
`- sleep/oversleep distortion -> rest pressure -> rest target -> location memory -> later place preference
```

The feedback loops are real but mostly invisible. The fix is exposure +
incentive, not depth.

### 6.3 Cooperation pressure design (uses existing families only)

Five surgical hooks, each one wires through 2–3 existing systems, none
introduces new vocabulary:

```text
H1. heavy block (h_target >= 3 OR weightProfile = 'heavy')
    requires 2 adjacent carriers within distanceBoard.ground <= 1.5
    owner: structureSystem.canCarryBlock + entities/block.js carrier check
    consequence: failed solo attempt emits "calling for help" signal
                 (existing motive: 'maintenance' or 'companionship')
    reward path: caregiving drive satisfaction for the second carrier

H2. shelter recovery rate scales with co-occupant trust
    owner: lifeSimSystem.computeRestRecovery + structureSystem.shelterContext
    rule: rate *= 1 + 0.15 * sum(trust-edge) over co-occupants, capped at 1.6x
    consequence: visible bias for trusted pairs to roost together
                 surfaces in society summaries (cliqueComfort)

H3. periodic zone scarcity pulse
    owner: zoneSystem.tickEcology
    rule: every ~6 minutes, one zone enters 'scarcity' state
          flowers in that zone decay 1.4x faster, no new flowers spawn for ~30s
    consequence: butterflies must scout a different zone or share food
                 reserveFoodBall sharing becomes a real action
                 warning/sharing signals fire from the scarce zone

H4. distress cascade
    owner: communicationSystem.distressSignal (already exists)
    rule: when a butterfly's emotion.threat or .exhaustion crosses a band,
          it emits a low-radius distress signal (radiusUnits = 5)
          nearby caregivers (high caregiving drive) score "approach + comfort"
    consequence: visible help-when-needed; bond memory packet on receipt

H5. scout-discovery
    owner: lifeSimSystem.deriveMigrationAffinity + communicationSystem.openTalk
    rule: when a butterfly enters a zone whose flowers/shelter are noticeably
          better than its memory of that zone, it emits an "invitation" signal
          on return to its home zone; nearby butterflies score migration
          affinity bump for the named zone
    consequence: visible "follow the scout" formation; group migration is
                 information-driven, not random
```

None of these introduce a new drive, emotion, memory family, social edge, or
motive. Each hook reuses the locked vocabulary.

### 6.4 Conversation as action

Five small surfaces:

```text
S1. feed thread aggregator
    same-pair lines within window (= 3s) collapse into a single 2-4 line
    thread row with optional consequence tail
    consequence tail format:
      "trust +3, comfort +2"  (only if a durable edge moved)
      "lesson taken"          (only if Learn outcome fired)
      "warning ignored"       (if recipient's response was avoidance)

S2. spatial recipient gating
    open_talk recipient set uses distanceBoard.withinCylinder(speakRadiusU, 3)
    speakRadiusU defaults: 6 (whisper) | 10 (open talk) | 14 (teaching pulse)
    no recipient -> talk is ambient (no thread row)
    one+ recipient -> thread row created

S3. consequence posting
    after a dialogue exchange, if any social edge delta exceeded the 'trace'
    band, post a one-line consequence summary to the same thread
    (uses the existing dialogue residue band; no new field)

S4. interpretation visibility
    when a recipient's interpretation.misunderstood = true, the feed shows
    the heard meaning in italics under the spoken line
    "What a lovely day"  ->  italic "(heard: are you avoiding me?)"

S5. memory packet anchor
    when an anchoring memory is created, the feed adds a small icon to
    the thread; a sidebar memory log accumulates anchors
    no UI tells the player "x became attached"; it shows the source thread
```

### 6.5 ML-on vs ML-off evaluation (so we know what ML is buying)

Add a deterministic capture lane:

```text
ML-evaluation capture:
  fixed seed, fixed save file
  duration: 120 seconds
  population: 12 butterflies, 1 zone start (ivy-cloister)
  variant A: gameConfig.ml.preferModelBacked = true   (current default)
  variant B: gameConfig.ml.preferModelBacked = false  (heuristic-only)

metrics to diff:
  |- conversation pair distinctness (chi-square over motive distribution per pair)
  |- relationship edge churn (sum of |edgeDelta| per minute)
  |- migration target diversity (entropy of chosen target zones)
  |- target-acquisition speed (time from intent to move)
  |- top-15% top-edge time fraction
  |- jitter ratio (frame-to-frame direction reversals)
  `- visible behavior unique-events count

threshold for "ML is doing real work":
  any 2 of (conversation distinctness +20%, edge-churn +15%,
            migration entropy +10%) on variant A vs B
```

If the threshold is met, ML proves its keep; trace capture (R8.1) follows.
If it is missed, this is information: the cadence/feature/scoring wiring
needs work BEFORE more emergence pressure is added.

### 6.6 Trace capture for future learned behavior

Additive only; no save-schema change.

```text
per ML decision (in mlInferenceSystem decision log):
  zoneId
  boardPos {u, v, h}
  social-context feature-bundle row id
  chosen action family + target id
  alternatives top-2 with scores
  outcomeWindow (lazy, +60 frames):
    satisfied:        delta(currentDrive_feed/safety/social) signed
    regret:           did the entity revisit the alt within 5s?
    surprise:         was the actual outcome > 1 standard deviation off score?
    social-residue:   delta(active dialogue residue strength)
  trainable-corpus tag: bool, default false; flipped on by scenario script
```

Persistence: runtime-class, capped at `decisionHistoryLimit = 6` (already
locked). Optional offline export to `qa_logs/ml_corpus/` via existing
`scripts/build-c2-trace-corpus.js`. No durable save change.

This gives a future-trainer real action / outcome / context tuples WITHOUT
changing how ML behaves at runtime now.

### 6.7 Player / cursor-as-social-actor seam (declared, NOT implemented)

A reservation document `docs/PLAYER-CURSOR-SOCIAL-SEAM.md` declares:

```text
playerProfile:
  displayName        : string  (default null)
  cursorEntityId     : string  (default "cursor")
  cursorBoardPos     : { zoneId, u, v, h }   (already derivable)

butterfly.relationshipsToPlayer (per-butterfly, additive):
  trust              : 0..100
  fear               : 0..100
  attachment         : 0..100
  lastSpeechReceived : { atFrame, lineId, motive }
  knownByPlayerName  : bool

communicationSystem extension (declared, NOT implemented):
  talkMode = "to_player"
    listenerId = playerProfile.cursorEntityId
    interpretation supports a non-butterfly speakerId
    feed line uses playerProfile.displayName when set

NOT implemented in this round; the doc only reserves the names so:
  |- save migrations don't accidentally trample these fields later
  |- communication layer will not need a rename when the player gets a name
  |- ML feature builder leaves a row for cursorTrust/cursorFear/petHistory
  |  (already declared, just verify they survive any feature rebake)
```

### 6.8 Operational definition of in-game emotion

We do not claim consciousness. We claim functional artificial emotion when a
channel is:

```text
real in-game when ALL of these hold:
|- stored or derived by the correct owner (lifeSimSystem)
|- updated by events (drives, signals, dialogue, environment)
|- visible enough to be inspected or inferred (Inspect, debug, feed thread tail)
|- remembered or decayed over time
|- able to influence future choices (action / target / signal / risk score)
|- able to affect relationships and routines
`- preserved through save/load when durable
```

By that bar, the current build's emotion system passes. The believability
gap is in surfacing, not authenticity.

---

## Section 7 — Corrected Phase Order (Codex-Executable)

The H-* / P-* numbering of prior plans is replaced by this R-* (round-2)
order. Each phase has goal, owned files, forbidden files, contracts, math,
proofs, acceptance, and rollback.

```text
phase order (corrected)
|- R0  comprehension repair          (1-day surgical fixes, 3 small patches)
|- R1  spatial readability           (full-field play envelope, ambient grid, label chip)
|- R2  movement truth unification    (boardPos = movement truth; gridPos = debug only)
|- R3  block cell discipline         (integer cell snap, occupancy validation)
|- R4  height legibility             (flightH, shadow split, altitude probe)
|- R5  sprite fidelity audit         (cache telemetry repair, baked-path proof)
|- R6  flower lifecycle              (de-overlap, decay -> pile, reserve food)
|- R7  feed/talk reality             (filter map, motive thread, consequence tail)
|- R8  cooperation + emergence       (5 incentive hooks, ML-on/off capture, trace capture)
|- R9  player/cursor seam reservation(docs only, not implemented)
`- G0  rerun human capture; close G0 only if all proofs hold
```

R0 is the first concrete Codex task. R1–R3 unblock the "the game does not
read like a place" complaint. R4–R7 close subjective polish. R8 addresses
the AI ambition. R9 protects the future-player work.

---

### R0 — Comprehension Repair (FIRST CODEX TASK)

Goal: make the game stop fighting the player. Three surgical fixes, one PR.

Owned files:
- `core/gameCore.js` (one ambient-travel guard)
- `core/renderManager.js` (drawSimBoardGround flatten + drawZoneWorldOverlay focused-mode suppression)

Forbidden files:
- everything in `entities/`
- everything in `systems/` except `zoneSystem.js` IF needed for the focused-zone label chip; prefer not touching it
- save layer
- ML layer
- gridManager.js

Contracts touched: none. No save schema change. No data-shape change.

Math / coordinates:
- preserve the existing projection (`ppu = 20`, `groundT = 0.56`, `hStep = 8`,
  `widthUnits = 36`, `depthUnits = 22`, `origin = (40, 96)`)
- the playable rect stays at screen `x: 40..760`, `y: 96..342.4`
- the placement region is NOT changed in R0; that is R1's task

Implementation notes:

R0.1 — Stop ambient camera hijack. In
`core/gameCore.js` around line 4364 replace:

```js
zoneTravel.hasSwappedZone = true;
if (this.getFocusedZoneId() === previousZoneId) {
    this.focusZone(zoneTravel.targetZoneId);
}
```

with:

```js
zoneTravel.hasSwappedZone = true;
if (zoneTravel.cameraFollow === true
    && this.getFocusedZoneId() === previousZoneId) {
    this.focusZone(zoneTravel.targetZoneId);
}
```

`zoneTravel.cameraFollow` is set ONLY when the player explicitly chooses a
zone via UI; ambient/autonomous travel never sets it. Default is implicit
falsy.

R0.2 — Flatten drawSimBoardGround. In `core/renderManager.js` around line
617, replace the double-fill body with a single play-field fill plus a
soft envelope edge:

```js
drawSimBoardGround(layer, zone = null) {
    const projection = this.getProjectionForZone(zone?.id || this.viewState.focusedZoneId);
    const palette = this.getSimBoardZonePalette(zone);
    const width = projection.widthUnits * projection.ppu;
    const height = projection.depthUnits * projection.ppu * projection.groundT;
    const x = projection.origin.x;
    const y = projection.origin.y;

    // Out-of-play tint: subtle, darker, no hard edge. Communicates the canvas
    // exists but is not the playfield.
    layer.noStroke();
    layer.fill(palette.canvas[0] * 0.85, palette.canvas[1] * 0.85, palette.canvas[2] * 0.85, 255);
    layer.rect(0, 0, gameConfig.canvas.baseWidth, gameConfig.canvas.baseHeight);

    // Playfield: full ground tint, rounded corners, no hard border.
    layer.fill(...palette.ground, 255);
    layer.rect(x, y, width, height, 6);

    // Soft envelope edge: 1px, low alpha, hints at boundary without framing.
    layer.noFill();
    layer.stroke(...palette.border, 60);
    layer.strokeWeight(1);
    layer.rect(x + 0.5, y + 0.5, width - 1, height - 1, 6);

    // Ambient unit grid is drawn here in R1; for R0 keep current behaviour
    // (off by default).
    if (this.shouldDrawSimBoardGroundGuides()) {
        this.drawSimBoardGroundGuides(layer, projection, palette);
    }
}
```

R0.3 — Suppress drawZoneWorldOverlay in sim-board focused mode. In
`core/renderManager.js` around line 3090, add a guard at the top of
`drawZoneWorldOverlay()`:

```js
drawZoneWorldOverlay(layer) {
    if (typeof zoneSystem === 'undefined' || typeof gameCore === 'undefined' || !gameCore.isInitialized?.()) return;

    const zones = zoneSystem.getZones?.() || [];
    if (zones.length <= 1) return;

    const state = gameCore.getGameState?.() || {};
    const isOverview = state.viewMode === 'overview';
    const focusedZoneId = state.focusedZoneId || zoneSystem.focusedZoneId;

    // NEW: in sim-board world, only draw zone overlays when the player is
    // explicitly viewing the overview map. Focused play is presented as one
    // intentional field; the zone label belongs in UI chrome, not on the field.
    if (this.isSimBoardWorld() && !isOverview) {
        return;
    }

    if (this.isSectionSceneWorld()) {
        if (isOverview) {
            this.drawSectionSceneOverview(layer, zones, focusedZoneId);
        }
        return;
    }

    // ... rest unchanged
}
```

The focused-zone label is already rendered in the existing UI chrome
(top-of-canvas chip). Inspect manually to confirm; if not, add a single
`drawFocusedZoneChip(layer)` call in `drawUILayer()` that reads the focused
zone label and draws a 14px text into the existing top reserve band.

Acceptance tests:

```text
R0.acceptance:
|- A 5-minute fresh capture shows ZERO unprompted 'navigation/focus-zone'
|  events. Ambient migrators may travel; the camera stays put.
|- Focused-mode screenshots in all four zones show NO centered diamond
|  polygon and NO inner-rectangle hard border. The visible field reads as
|  one playfield over a softer canvas tint.
|- The focused zone label is visible somewhere (top chip or otherwise);
|  it is not drawn on top of the playfield.
|- run-runtime-self-audit.js stays green.
|- run-r2-zone-transition-audit.js stays green.
|- composed bench single-zone-122 holds within +/-1.0ms of post-P7 baseline.
```

Probes / proofs to run:

```text
node scripts/run-runtime-self-audit.js
node scripts/run-r2-zone-transition-audit.js
record one fresh manual capture of >= 5 minutes
  - visit each of the four zones at least once via the player UI buttons
  - allow ambient migrators to cross zones
  - confirm capture summary 'navigation/focus-zone' counter shows ZERO
    unprompted events between explicit player actions
take 4 focused-mode screenshots (one per zone)
take 1 overview screenshot (still shows zone polygons + labels in overview)
```

Rollback / feature flag:
- `gameConfig.world.cameraFollowDefault = false` (already implicit; the
  flag is the new `zoneTravel.cameraFollow` field; setting it back to true
  for ambient travel restores the prior behaviour)
- `gameConfig.world.simBoardSuppressOverlay = true` (default true). Setting
  to false reverts R0.3.
- R0.2 is a render-only change; reverting the diff is safe.

Forbidden during R0:
- editing any save schema
- editing any spatial math / projection
- editing entities or systems beyond the listed files
- changing the focused-zone selection UX

Risks:
- the focused-zone label chip needs to remain visible after R0.3; if it was
  previously only carried by the in-field overlay, add the chip in
  drawUILayer() as part of R0.3
- some debug paths read `viewMode === 'focused-garden'` and assume the
  overlay still draws; verify run-r4-ui-readability-audit.js stays green

---

### R1 — Spatial Readability (visible envelope, ambient grid, label chip)

Goal: in normal play, the canvas communicates one play field, a one-block
unit cue, the four edges, and the top UI-safe band. No green-rectangle
ambiguity.

Owned files:
- `core/renderManager.js` (drawSimBoardGround ambient grid bake;
  drawFocusedZoneChip; tighten guideDefault behaviour)
- `core/config.js` (palette guide alpha; ambient grid step constants)
- `systems/zoneSystem.js` (placement-region tightening; see F16)

Forbidden files:
- `entities/`, save layer, ML layer, gridManager.js

Contracts: additive config keys
`spatial.ambientGrid = { stepUnits: 4, alpha: 12, every1Alpha: 0 }`. No
schema bump.

Math / coordinates:
- ambient grid is drawn into the background layer ONCE per zone-bake
- step every 4 board units, alpha 12, color = palette.guide
- envelope edge is 1px alpha 60 single line (already in R0)
- placement region (zoneSystem.getZonePlacementRegion):
  minY = origin.y + 0.5 * hStep
  maxY = origin.y + (depthUnits - 0.5) * ppu * groundT
  minX = origin.x + 0.5 * ppu
  maxX = origin.x + (widthUnits - 0.5) * ppu

Implementation notes:
- background layer baking already exists; add the grid draw to the bake step
- focused-zone chip: `drawFocusedZoneChip(layer)` draws into the UI layer at
  `(origin.x, origin.y - 14)` with text size 12, the zone label, and a
  small color swatch from `palette.border`
- the existing `shouldDrawSimBoardGroundGuides()` toggle remains for the
  diagnostic grid (alpha 80, every 1 unit)

Acceptance tests:
- visible play field reads as one envelope; player can see one-unit spacing
  without it dominating the art
- focused-zone chip is visible above the field, not on top of it
- placement region tightening shows zero butterflies outside the projected
  rect after 60s of normal play (before R1 they could appear at y up to
  396 even though projected rect ends at 342.4)

Probes:
```text
record one capture; assert all sampled butterflies have screen y within
  [origin.y, origin.y + projectedHeight + 4]
take 4 focused screenshots; assert no butterfly visible BELOW the projected
  rect bottom edge
```

Rollback: ambient grid is a one-line bake call; remove it.

Risks: the ambient grid may visually conflict with shadows. Mitigation:
draw shadows on a layer above the grid bake.

---

### R2 — Movement Truth Unification

Goal: `boardPos` is the canonical movement truth. Wander, social, and edge
travel all sample targets in board units. Movement integrates against
boardPos. Render projects via `boardToScreen()`. `gridPos` becomes a debug
helper, never a movement source.

Owned files:
- `entities/butterfly.js` (movement target, smoothFollowTarget, integrator,
  arrival check, picking wander/social targets)
- `core/gameCore.js` (sim-board zone travel ALWAYS edgeMode in sim-board
  world; legacy doorway anchor phases gated to section-scenes only)
- `core/butterflyStore.js` (afterPositionMutation tolerates board-space
  primary truth)

Forbidden files:
- save layer (no schema change; the v5 boardPos field already exists)
- structureSystem (carry anchors stay screen-space-derived for now)
- ML layer
- gridManager.js (still loaded; just not consulted for movement intent)

Contracts:
- `butterfly.movement.target = { u, v }` (board-unit target). Existing
  `smoothFollowTarget` becomes board-unit. Existing screen `x/y` is derived
  per-frame from `boardToScreen(boardPos)` after integration.
- `gridPos` is computed once per frame for debug only:
  `gridPos = gridManager.screenToIso(x, y + shadowOffset)`

Math / coordinates:
```text
target sampling (wander):
  base = current boardPos
  jitter = (cos(rand)*r, sin(rand)*r) where r in [2, 4] * wanderScale
  candidate = base + jitter
  clamp to [0.5, widthUnits - 0.5] x [0.5, depthUnits - 0.5]
  reject if candidate within 1.0 of any solid block in this zone
  target = candidate

target sampling (social):
  if socialAnchor.partner exists and partner.boardPos in same zone:
    target = partner.boardPos + small offset (0.5..1.0 board units)
  else fall back to wander

integration:
  delta = target - boardPos
  step = clamp(delta * speed, 0, maxStep)
  boardPos.u += step.u
  boardPos.v += step.v
  if distance < 0.3 board unit: arrived; pick new target
  arrival deadzone = 0.5 board unit (no reacquire reversals inside this)

projection (per-frame):
  screen = boardToScreen(boardPos)
  butterfly.x = screen.x
  butterfly.y = screen.y
```

Implementation notes:
- preserve existing wanderScale, social anchor logic, target source choice;
  only the SPACE in which targets are expressed changes
- arrival deadzone fixes the jitter symptom: once within 0.5 unit of target,
  the integrator does not flip direction on noise
- in sim-board zone travel, the departure target is a sample on
  `exit.exitSegment` and the arrival target is a sample on
  `exit.arrivalSegment` (both already exist in zone data)

Acceptance tests:
- movement audit shows top-15% target bias <= 18% (was higher; the bias
  collapses once integration uses the projected envelope rather than iso
  coords)
- jitter audit: zero butterflies show > 3 direction reversals within
  0.5 board units of a settled target over 10s
- run-r2-zone-transition-audit.js stays green
- run-b4-carry-stack-physics-audit.js stays green
- composed bench single-zone-200 stays within +1.5ms of post-R0 baseline

Probes:
```text
new audit: scripts/run-r-movement-board-truth-audit.js
  spawn 20 butterflies in ivy-cloister
  run 600 frames
  log per-frame { boardPos, target, screen y position }
  assert: no boardPos.v < 0.4 or > depthUnits - 0.4
  assert: top-15% time-fraction <= 0.18
  assert: no butterfly logs > 3 small direction reversals within 0.5 unit
          of a settled target

existing regressions:
  node scripts/run-r2-zone-transition-audit.js
  node scripts/run-r1-movement-stability-audit.js
  node scripts/run-b4-carry-stack-physics-audit.js
```

Rollback: revert R2; the prior gridPos-keyed movement is preserved through
the diff.

Risks:
- structureSystem proximity queries may still expect screen-space; keep the
  derivation `screen = boardToScreen(boardPos)` per-frame so callers see
  consistent values
- carrier anchor for blocks reads carrier x/y; that still works because
  x/y is still computed every frame, just from boardPos

---

### R3 — Block Cell Discipline

Goal: every block placement lands on an integer `{ u, v, h }` cell, no
duplicates, no half-cell, no unsupported, no Training-Grounds blocks.

Owned files:
- `entities/block.js` (`moveTo()`, `pickupBy()`, `dropBy()`, placement)
- `systems/structureSystem.js` (`acceptCellPlacement()` accessor;
  `cellOccupiedBySolid()` query)

Forbidden files:
- save layer beyond an additive migration step that snaps existing blocks
  to nearest legal cell on load (still v5; no schema bump)
- gridManager.js (debug only)

Math / coordinates: see Section 3.7.

Implementation notes:
- in `block.moveTo(x, y)`, after computing
  `boardPos = screenToBoard(x, y, currentZoneId, h)`, run
  `acceptCellPlacement` and snap to `{ u, v, h }`. Then recompute
  `screen = boardToScreen({u, v, h})` and assign `block.x, block.y` from
  it.
- support test: `cellOccupiedBySolid(zoneId, u, v, h-1)` must be true for
  `h > 0`.
- on load, walk every block; if its stored `boardPos` is not integer-snapped
  or fails support, snap to nearest legal cell and emit a one-time
  `runtime-issue type=block-cell-coerce` log.

Acceptance:
- block occupancy audit (NEW): zero duplicate cells, zero half-cell
  positions, zero unsupported stacks, zero Training-Grounds blocks
- run-b4-carry-stack-physics-audit.js stays green
- run-r7-block-visual-audit.js stays green

Probes:
```text
new audit: scripts/run-r-block-cell-discipline-audit.js
  for each zone:
    for each block in zone:
      assert block.boardPos.u and .v are integers
      assert block.boardPos.h in [0, maxStackHeight]
      if h > 0: assert cellOccupiedBySolid(zoneId, u, v, h-1)
      assert (zone.id !== 'sun-court') or block.removedDueToTraining

  load lived-in save:
    count blocks coerced; expected <= 1% of total blocks
    assert no entity loss
```

Rollback: feature flag
`gameConfig.entities.block.snapToCellInt = true` default true; setting to
false restores legacy placement.

Risks:
- legacy ambient placements may produce many coerced blocks on first load.
  Mitigation: cap coerce rate at 1% per audit; if exceeded, hold and inspect.

---

### R4 — Height Legibility

Goal: butterflies in flight read as "above ground" via a sprite-shadow
split. Block stacks visibly occupy integer h levels (already do via
visualLiftStep, just verify).

Owned files:
- `entities/butterfly.js` (`flightH` field; render shadow at h=0, sprite
  at flightH)
- `core/renderManager.js` (altitude probe for debug)

Forbidden files:
- save layer (flightH is transient, not durable)
- ML layer

Contracts: `butterfly.flightH` is a transient visual altitude in
`hStep` units; stored in butterfly state but not in save serialization.

Math: `boardToScreen(u, v, 0)` for shadow; `boardToScreen(u, v, flightH)`
for sprite. flightH oscillates by `idleBobUnits` in idle, settles to 0 on
arrival, can lift to 1.5–3 during flight to a distant target.

Implementation notes:
- existing shadowOffset becomes the shadow's screen-space lift; flightH
  drives the SPRITE lift independently
- a debug probe places three butterflies at the same `(u, v)` with
  flightH = 0, 1.5, 3 to verify visual ordering and shadow stability

Acceptance:
- altitude probe screenshot shows three distinct butterfly altitudes with
  shadows on the same ground spot
- run-r1-movement-stability-audit.js stays green
- composed bench unchanged within +0.4ms

Probes:
```text
new audit: scripts/run-r-altitude-probe.js
  spawn 3 butterflies at same boardPos { u: 18, v: 11, h: 0 }
  set flightH to [0, 1.5, 3] respectively
  capture screenshot at fixed frame 120
  assert: visible y deltas roughly equal hStep * flightH
  assert: shadow x is identical for all 3
```

Rollback: feature flag
`gameConfig.entities.butterfly.flightH.enabled = true`.

Risks: minor; flightH is purely visual.

---

### R5 — Sprite Fidelity Audit

Goal: prove the high-fidelity baked-creature path is exercised at runtime.
If telemetry stays at `0/0`, fix the wiring or supersample the bake.

Owned files:
- `core/spriteManager.js` (telemetry surfacing; bake supersample if needed)
- `core/renderManager.js` (debug overlay one-line cache report)

Forbidden files:
- entities, systems beyond spriteManager, save layer

Implementation notes:
- add a debug overlay
  `baked sprites: <hits>/<misses> | <familyCount> entries | <surfaceMB>`
- record a fresh capture; if `hits == 0`, the bake path is bypassed
- if bypassed, route butterfly draw through
  `getBakedWingPiece -> drawImage(bakedSurface, ...)` instead of any
  per-frame `drawWingShape` math
- if bake path runs but visible wings still pixelate, raise the wing bake
  supersample by 1.5x (`wingDimensionStep` in bake config)

Acceptance:
- new capture summary shows `spriteCache: <hits>/<misses>` with hits > 0
- side-by-side wing close-up screenshots (sun-court, ivy-cloister, Inspect)
  show distinct texture detail on butterflies
- composed bench stays within +0.6ms

Probes:
```text
node scripts/run-v3-sprite-parity-audit.js
record manual capture; confirm summary.txt shows hits > 0
take 4 wing close-ups (2 per zone)
```

Rollback: existing sprite smoothing flag covers it.

Risks: bake path may be cached in memory but not invalidated on butterfly
spawn. Mitigation: invalidate bake when butterfly count changes by > 4.

---

### R6 — Flower Lifecycle (de-overlap, decay → pile, reserve food)

Goal: flowers are a real life-sim object, not visual clutter.

Owned files:
- `entities/flower.js` (spawnedAtFrame, decay path, reserve-food creation)
- `entities/dirtPile.js` (NEW) or `entities/flowerLifecycle.js` (NEW
  consolidated subtype)
- `entities/reserveFood.js` (NEW)
- `systems/objectSystem.js` (object subtypes registration)
- `systems/lifeSimSystem.js` (object affordance read for soiled-place)

Forbidden files:
- save layer beyond an additive `flower.spawnedAtFrame: number` field
  (still v5; sub-additive)
- ML layer durable state; ML may read affordance via existing object
  awareness features

Contracts:
- new object subtype `dirt-pile` (visual: dark mound, h_visual = 0.15)
- new object subtype `reserve-food-ball` (visual: small bright dot,
  color matches source flower)
- `flower.spawnedAtFrame` additive field (default 0)
- decay window: `gameConfig.entities.flower.decayFrames = 60 * fps`

Math: see Section 4.2 / 4.3.

Implementation notes:
- on flower spawn, set `spawnedAtFrame`; if loaded from old save without
  the field, default to 0 (will decay quickly on first tick — acceptable;
  loaded-save cleanup already prunes piles)
- decay tick runs in `entities/flower.update()`; if
  `currentFrame - spawnedAtFrame >= decayFrames` and no carrier and no
  recent eat event, transform to dirt-pile entity
- pickup-by-butterfly creates reserve-food; flower disappears
- cleanup affordance: object profile signal `soiled-place` already exists
  in vocabulary; `lifeSimSystem.applyAmbientSignal()` reads it and biases
  approach for high-`selfMaintenance` butterflies

Acceptance:
- a fresh flower decays after ~60s
- a picked flower becomes a stable reserve-food ball that does not decay
- at least one butterfly cleans a pile within 60s of spawn (R8 cooperation
  may be needed; for R6 the affordance must exist, the action is gated on
  drive thresholds)
- old saves load without flower-count explosion
- run-runtime-self-audit.js stays green
- new audit: scripts/run-r-flower-lifecycle-audit.js

Probes:
```text
new audit script:
  spawn 4 flowers, freeze population
  step 60s game time
  assert: 4 dirt-piles exist, 0 fresh flowers in that batch
  spawn 1 fresh flower; force a high-feedUrgency butterfly to pick it
  assert: 1 reserve-food-ball, 0 flowers in that batch
  step 90s
  assert: reserve-food-ball still exists (no decay)

regression:
  node scripts/run-runtime-self-audit.js
```

Rollback:
- `gameConfig.entities.flower.decayEnabled = true` (default true)
- `gameConfig.entities.flower.reserveFoodEnabled = true`

Risks:
- old saves that already have the post-R6.5 (prior plan) cleanup pass may
  show many piles immediately on load. Mitigation: in load migration, set
  `spawnedAtFrame = currentFrame - decayFrames * 0.7` for legacy flowers
  so they decay over the next 18s rather than instantly

---

### R7 — Feed / Talk Reality

Goal: feed filters work; warning lines have visible cause; talk surfaces
motive → target → response → consequence as a thread.

Owned files:
- `systems/communicationSystem.js` (canonical category enum; thread
  aggregation lookup)
- `ui/gameUI.js` (filter binding; thread row rendering; consequence tail
  rendering)
- `ui/dom/feedPanel.js` if separate (presentation-only)

Forbidden files:
- save layer
- ML layer durable state
- core spatial / movement files

Contracts:
- canonical category enum
  `'talk' | 'action' | 'learn' | 'warning' | 'system'` stamped at
  emission point
- thread aggregation key: `{ pairKey, motiveFamily, withinMs: 3000 }`
- consequence tail: a one-line summary appended to the thread when any
  durable edge moved by >= `trace` band

Math: none beyond timestamp arithmetic.

Implementation notes:
- audit the existing categorization paths in `communicationSystem`,
  `gameUI`, and event-bus history; collapse drifting names
  ('teach' / 'teaching' / 'lesson' / 'tutoring') into the enum
- demote `warning`-flavored lines that fire from environmental hints
  without an underlying threat / safetyAvoidance / danger memory event
- thread aggregator reads existing dialogue residue + edge delta; UI is
  presentation only

Acceptance:
- each filter chip shows only events from its enum
- warning chip only shows events with a non-null
  `threatSignalId | dangerMemoryId | safetyAvoidanceTrigger`
- a thread renders for every same-pair exchange within 3s
- consequence tail renders when any edge moved by >= trace band
- run-r6-communication-audit.js stays green
- run-f5-f6-social-depth-audit.js stays green

Probes:
```text
new audit: scripts/run-r-feed-thread-audit.js
  trigger 8 same-pair conversations of varying motives
  assert: threads render with motive label + 2-4 lines
  assert: when edge moves >= trace, tail prints (e.g. "trust +3, comfort +2")
  assert: warning chip count == count of events with threat/danger trigger
```

Rollback:
- `gameConfig.ui.feedThreads.enabled = true` (default true)
- legacy single-line feed remains behind the flag

Risks:
- thread aggregation may merge unrelated lines; mitigation: cap merge at
  `motiveFamily` AND `withinMs <= 3000` AND same pair

---

### R8 — Cooperation + Emergence (5 hooks; ML-on/off capture; trace capture)

Goal: world creates real reasons for butterflies to need each other; ML
gets evaluated honestly; trace data starts accumulating for future
training.

Owned files:
- `entities/block.js` (heavy-block carry-2 rule)
- `systems/structureSystem.js` (heavy-block detection; shelter recovery
  scaling)
- `systems/zoneSystem.js` (scarcity pulse)
- `systems/communicationSystem.js` (distress + scout-discovery emit)
- `systems/lifeSimSystem.js` (recovery rate; affordance reads)
- `systems/mlInferenceSystem.js` (outcomeWindow lazy population)
- `scripts/run-ml-on-off-capture-audit.js` (NEW evaluation lane)
- `scripts/build-c2-trace-corpus.js` (extend with outcomeWindow rows)

Forbidden files:
- save layer beyond additive non-durable trace fields
- new drive / emotion / memory family creation

Contracts: see Section 6.3 H1–H5 and 6.5–6.6.

Implementation notes:
- each hook is independent; ship and validate one at a time
- ML-on/off capture is deterministic: fixed seed, fixed save, two runs
- trace `outcomeWindow` is computed lazily 60 frames after a decision; cap
  history at 6 entries per butterfly per ML domain
- export to `qa_logs/ml_corpus/` is offline only; no save bloat

Acceptance:
- heavy block: 2 butterflies cooperatively lift / move; 1 alone fails and
  emits maintenance signal
- shelter co-occupant trust scaling: visible trusted-pair roost preference
  in feed thread aggregation
- scarcity pulse: a zone enters scarcity; visible warning + sharing
  signals; reserveFoodBall sharing happens at least once in 5 minutes
- distress cascade: at least one help-on-distress event per 5 minutes
- scout-discovery: at least one informed-migration cluster per 5 minutes
- ML-on/off audit: produces a side-by-side report with the metrics in 6.5
- trace corpus export: contains outcome-window rows for >= 80% of decisions
  in the audit window

Probes:
```text
node scripts/run-ml-on-off-capture-audit.js
node scripts/build-c2-trace-corpus.js  (extend)
new audit: scripts/run-r-cooperation-pressure-audit.js
  validate each H1..H5 hook fires under a triggering scenario
```

Rollback per-hook flag:
- `gameConfig.world.heavyBlockCooperation`
- `gameConfig.world.shelterTrustScaling`
- `gameConfig.world.zoneScarcityPulse`
- `gameConfig.world.distressCascade`
- `gameConfig.world.scoutDiscovery`
- `gameConfig.ml.traceCapture.outcomeWindow`

Risks:
- cooperation hooks may pile onto an already-busy frame budget; gate behind
  cadence (`tickEcology` runs at 30s intervals, not per frame)
- ML-on/off capture must use exactly the same seed / save; if seed drifts,
  the comparison is meaningless

---

### R9 — Player / Cursor Seam Reservation (DOCS ONLY)

Goal: protect future player-name / cursor-as-social-actor work without
implementing it now.

Owned files:
- `docs/PLAYER-CURSOR-SOCIAL-SEAM.md` (NEW, ~1 page)

Forbidden files: every implementation file. R9 is purely a contract
reservation.

Contents: see Section 6.7.

Acceptance:
- doc exists, named as above
- ACTIVE-PLAN-REGISTRY.md links to it
- no runtime behavior change

---

### G0 close

Rerun a 5-minute human capture. Close G0 only when:

```text
g0 close conditions
|- focus stability             -> 0 unprompted focus-zone events
|- field readability           -> no inner rectangle, no focused-mode polygon overlay
|- movement envelope           -> background matches where butterflies can move
|- ambient grid                -> visible at one-unit spacing without dominating
|- height readability          -> butterfly altitude/ground relation legible
|- top edge                    -> no top-15% target bias above 18%
|- jitter                      -> no repeated direction reversals near settled targets
|- sprites                     -> spriteCache hits > 0; close-ups show source detail
|- flowers                     -> no stacked clusters; decay -> pile -> cleanup loop visible
|- blocks                      -> integer-cell occupancy; no duplicates; no Training-Grounds blocks
|- feed                        -> filter chips map 1:1 to enum; warnings have cause
|- threads                     -> motive -> target -> response -> consequence visible in feed
|- cooperation                 -> at least one cross-butterfly cooperation event per 5 min
|- ML evaluation               -> ML-on/off capture diff is interpretable
|- trace capture               -> ml_corpus export contains outcomeWindow rows
`- player seam                 -> reservation doc exists
```

---

## Section 8 — Files / Owners Summary

```text
spatial truth:    boardPos = { zoneId, u, v, h }; lives on entity, derived
                  for screen each frame
projection:       core/renderManager.boardToScreen / screenToBoard;
                  zone.board declares ppu/groundT/hStep/origin
movement intent:  butterfly.movement.target in board units
debug iso:        gridManager (read-only after R2)
zone exits:       zone.exits[*]; sim-board world ALWAYS edgeMode
block placement:  entities/block + structureSystem.acceptCellPlacement
flowers:          entities/flower + entities/dirtPile + entities/reserveFood
feed categories:  communicationSystem stamps 'talk|action|learn|warning|system'
threads:          ui/gameUI presents from communicationSystem aggregator
cooperation:      structureSystem.heavyBlockCarry, lifeSimSystem.shelterRecovery,
                  zoneSystem.scarcityPulse, communicationSystem.distress &
                  scoutDiscovery
ML scoring:       systems/mlInferenceSystem (read-only feature consumption;
                  no durable mutation)
trace capture:    mlInferenceSystem.decisionLog.outcomeWindow (runtime-class)
save schema:      v5; only additive flower.spawnedAtFrame in this round
```

Hard rule: `gridManager` may not be a movement-truth source after R2
closes. Any new call site that uses `screenToIso` for movement intent is a
regression.

---

## Section 9 — Audit Lane Map (regression vs new)

```text
regression (must stay green through R0..R8)
|- run-runtime-self-audit.js
|- run-r1-movement-stability-audit.js
|- run-r2-zone-transition-audit.js
|- run-r4-ui-readability-audit.js
|- run-r5-battle-presentation-audit.js
|- run-r6-communication-audit.js
|- run-r7-block-visual-audit.js
|- run-b4-carry-stack-physics-audit.js
|- run-f5-f6-social-depth-audit.js
|- run-e4-social-ecology-audit.js
|- run-h5-long-running-save-smoothness-audit.js
|- run-lifesim-expression-audit.js
|- run-v3-sprite-parity-audit.js
|- run-n6-neural-social-scoring-audit.js
|- run-single-player-autobattle-audit.js
`- run-ability-radius-conversion-audit.js

new (this round)
|- run-r-movement-board-truth-audit.js   (R2)
|- run-r-block-cell-discipline-audit.js  (R3)
|- run-r-altitude-probe.js               (R4)
|- run-r-flower-lifecycle-audit.js       (R6)
|- run-r-feed-thread-audit.js            (R7)
|- run-r-cooperation-pressure-audit.js   (R8)
|- run-ml-on-off-capture-audit.js        (R8)
`- (continued use of build-c2-trace-corpus.js with extension) (R8)
```

---

## Section 10 — Risk Summary

```text
high
|- R0.3 inadvertently hides the focused-zone label entirely
|  mitigate: drawFocusedZoneChip in drawUILayer is part of R0.3 if absent
|- R2 movement integration produces a different distribution than legacy
|  iso path; existing audits may interpret 'top-15%' differently
|  mitigate: explicit movement audit and a tighter target-clamp rule
|- R3 block cell coercion on lived-in saves may exceed 1% threshold
|  mitigate: cap and hold; investigate before promoting

medium
|- R4 flightH adds visual lift that fights existing shadowOffset
|  mitigate: render shadow into entitiesBehind layer, sprite into entities;
|            shadowOffset becomes shadow-only
|- R5 supersampling the wing bake increases memory budget
|  mitigate: cap supersample at 1.5x; invalidate aggressively on count change
|- R6 dirtPile + reserveFood add new object subtypes; ML feature builder
|  may need a row for each
|  mitigate: object affordance is generic; existing 'soiled-place' affordance
|            covers piles, no ML feature change needed for reserveFood

low
|- R7 thread aggregation merges unrelated lines under high traffic
|  mitigate: cap window at 3s + same motive family + same pair
|- R8 cooperation hooks add tick cost
|  mitigate: ecology pulse and scout-discovery run at 30s cadence
|- R9 doc-only; no runtime risk
```

---

## Section 11 — First Codex Implementation Task (R0 only)

```text
R0.first-task
|- goal     : remove ambient camera hijack + flatten sim-board ground +
|             suppress legacy zone overlay in focused mode
|- files    : core/gameCore.js, core/renderManager.js
|- changes  : R0.1 (one guarded if), R0.2 (drawSimBoardGround flatten),
|             R0.3 (drawZoneWorldOverlay sim-board guard) + chip if needed
|- proofs   : 5-minute capture with zero unprompted focus-zone events
|             4 focused-mode screenshots (one per zone)
|             1 overview screenshot
|             run-runtime-self-audit.js + run-r2-zone-transition-audit.js
`- accept   : all proofs pass; no new console / page errors; composed bench
              single-zone-122 within +/-1.0ms of post-P7 baseline
```

---

## Section 12 — End-of-Document

```text
honest framing
|- the prior plan landed contract; it did not move runtime onto contract
|- the believability gap is surfacing + incentives, not new families
|- ML cannot be judged honestly until R8 produces a side-by-side capture
|- battle is not reopened; the autobattle contract holds
|- saves are sacred through every phase
|- target is believable butterfly society; we do not claim consciousness
`- the corrected R0..R9 order is small enough to land week-by-week and
   bisectable enough that any failure pinpoints itself
```
