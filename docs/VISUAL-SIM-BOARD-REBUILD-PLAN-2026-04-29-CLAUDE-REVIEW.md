# Visual Sim-Board Rebuild — Claude Review & Codex-Executable Plan

Date: 2026-04-29
Author: Claude Opus 4.7 (review of `docs/VISUAL-SIM-BOARD-REBUILD-PLAN-2026-04-29.md`)

## Purpose

This document is the revised review of the proposed direction change. It is
intended to be executed by Codex phase-by-phase, without further architectural
debate. It also lists which existing audits remain useful regression checks and
which lanes get replaced by new sim-board acceptance.

The original rebuild brief is preserved at:

- `docs/VISUAL-SIM-BOARD-REBUILD-PLAN-2026-04-29.md`

This review supersedes that brief only for *implementation order, file
ownership, math, and acceptance*. The original brief remains the source of
intent.

---

## Section 1 — Verdict On The Framing

```text
framing claim
└─ "world-presentation and spatial-surface rebuild, not full game rebuild"

verdict
└─ AGREE
```

The current build is not architecturally broken. The closure matrix, lifesim
expression audit, and goal-alignment review all show that the social,
life-sim, ML, autobattle, structure, and save systems are mechanically alive
and frozen-clean. The named contradiction is not in those systems. It is in
*the visible world surface and the unit/projection/render path that surrounds
them.* That is exactly the kind of seam the locked spatial unit contract
(`SPATIAL-UNIT-CONTRACT.md`, `s1`) was designed to allow re-opening for, and
the frozen child boards (`n0`-`n8`, social) are not affected by it.

A full rewrite would discard:

- the durable life-sim families (drives, emotions, memories, edges, routines,
  social ecology, distortion, derived cognition) confirmed live in
  `LIFESIM-EXPRESSION-AUDIT.md`
- the locked ML feature contract (14 groups, 98 flat, 124 vec, plus shared
  spatial hooks owned by `structureSystem`) confirmed in
  `ML-IMPLEMENTATION-CONTRACT.md` and `NEURAL-SOCIAL-SCORING-AUDIT.md`
- the green autobattle path and battle ownership boundaries
  (`SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md`)
- the genetic/stat formulas and readiness math (`GENETICS-STAT-CONTRACT.md`)
- save schema continuity at `schemaVersion = 4` and the long-running save
  proof streak

A full rewrite would *not* fix the named contradictions:

```text
named contradictions
├─ ornate map implies geometry the sim does not own
├─ wall/occlusion presentation hides spatial truth
├─ butterfly sprites render aliased / pixelated despite high-res sources
├─ overlap symptoms compete with art depth instead of math
├─ ability radii, signal radii, and battle projectiles are screen-pixel based
└─ doorway/corridor travel hides spatial truth instead of clarifying it
```

A surgical surface-and-projection rebuild fixes those contradictions and
preserves the cognition stack underneath. That is the path this plan takes.

---

## Section 2 — Highest-Priority Conclusions (Read These First)

### 2.1 Sprite fidelity is a demonstrable rendering bug, not a design choice

The "pixelated/distorted butterflies" critique has a specific code cause. The
high-res source is intact (1920×1080 wing composites, 1080×1080 body and
antenna confirmed in `assets/butterflies/`). But three lines collapse it to a
nearest-neighbour aliased path:

| Where | What | Effect |
|---|---|---|
| `core/renderManager.js:117` | `this.layers.entitiesBehind.noSmooth();` | persistent layer flag |
| `core/renderManager.js:118` | `this.layers.blocks.noSmooth();` | persistent layer flag |
| `core/renderManager.js:119` | `this.layers.entities.noSmooth();` | **butterfly draw layer is permanently no-smooth** |
| `core/renderManager.js:120` | `this.layers.particles.noSmooth();` | persistent layer flag |
| `core/spriteManager.js:541` | `surface.noSmooth(); ... drawingContext.imageSmoothingEnabled = false;` | every baked surface (body, antenna, wings, caterpillar) is built with smoothing off |
| `core/config.js:272` | `smoothedButterflySpriteMaxVisible: 4` | smoothing only enabled in extreme low-density |
| `entities/butterfly.js:3535-3578` | wraps `graphics.smooth()/noSmooth()` only when `shouldUseSmoothedButterflySprites()` is true | which is gated by ≤ 4 visible butterflies |

In the `2026-04-29T01-39-49` capture there were 12 butterflies, so smoothing
was off everywhere along the wing, body, and antenna draw path. The wing
piece is baked from a roughly 900×600 source-aligned surface down to ~`size *
SPRITE_SCALE / 1080 * wingScale * 1.45` pixels (with `size = 12` and visual
scale 1.6, that is *small*). At those reductions, `noSmooth` produces visible
crunch on what should be photographic-quality wings.

Independent corroboration in the capture:

```text
spriteCache: 0/0 | est 0.00MB | hits 0/0
spriteTop: none
```

The capture's sprite-cache telemetry never lights up. Either the bake path is
not executing, or the telemetry is reading the wrong source. Either way the
high-res wings are not landing on the canvas at fidelity.

**Conclusion:** sprite fidelity restoration is the cheapest and most visibly
high-value first action. It must precede every "is the new board prettier?"
judgement, otherwise the new board will be evaluated against a degraded
butterfly and the comparison will be unfair.

### 2.2 Block-as-canonical-unit already exists; the rebuild only needs to *honour* it

`structureSystem.getCanonicalBlockUnit(stackHeight)` (`systems/structureSystem.js:212-251`)
already exposes a complete block-derived unit derived from
`gameConfig.entities.block.renderWidth = 20`:

```text
canonical block unit (already live)
├─ width                = 20  (= 1 board unit)
├─ radius               ≈ 8.4
├─ spacing              ≈ 18.4
├─ visualLiftStep       ≈ 8     (1 stack step in screen pixels)
├─ columnRadius         ≈ 10
├─ openingDepth         ≈ 18.4
├─ adjacencyClearance   ≈ 14.7
└─ doorwayAvoidRadius   ≈ 44
```

Block uses `getCanonicalBlockUnit(stackIndex+1).visualLiftStep` already
(`entities/block.js:182`). The placement footprint registry
(`gameConfig.entities.spatialFootprints`) is already in board-unit-relative
form for butterflies, caterpillars, flowers, eggs, chrysali, and blocks.
The shared spatial hooks (`verticality`, `structureRole`, `pathState`,
`bodyFit`, `occupancyBand`) are already declared and consumed by ML.

**Conclusion:** the rebuild does not need to invent a new unit. It needs to
(a) make `1 block = 1 board unit = 1 3D world unit` the authoritative
mapping, (b) move ability/signal/battle radii from "raw pixels" to "board
units × ppu", (c) declare a single projection function, and (d) push the
legacy `gridManager.tileWidth=32 / tileHeight=16` iso into a debug-only
shape. The canonical block unit lock is the right anchor; the work is making
the rest of the codebase quote it.

### 2.3 The legacy 18×18 iso grid is the actual quiet drift, not the ornate background

`core/gridManager.js` (670 lines) still exposes `screenToIso/isoToScreen`,
and several runtime call sites still use it for movement-target scoring,
zIndex sorting, and placement scratch values. Examples:

- `entities/block.js:71` — `this.gridPos = gridManager.screenToIso(this.x, this.y);` runs every carry update
- `entities/block.js:95` — `updateZIndex` keys off that grid pos × 1000
- `core/isometricPhysics.js` — entire 262-line module is a thin alias over `gridManager.screenToIso/isoToScreen`

`SPATIAL-UNIT-CONTRACT.md` already says the iso grid must become "debug-only
after `s1`" but that closure has not been enforced. The new sim-board phase
is the right place to finish the job: move sort keys to a board-derived
formula, retire `isometricPhysics.js`, and restrict `gridManager` to
`isPointInPolygon`, `clampScreenPointToRoamArea`, and visualization helpers
only.

### 2.4 The "ornate map" is the right thing to retire, but it is NOT the bottleneck

The capture says `lagCategory: render-dominant` with `compositeMs 2.23ms` and
`composite.flowersDirectPresentMs 2.08ms`. That is a flower-direct-present /
composite cost, not a background-image cost. So the ornate background is
mostly a *legibility* problem (geometry implied that the sim doesn't own,
behind-wall presentation, wrong perspective for stacking) — not a runtime
problem. Removing it should *improve* legibility without freeing the
real frame-time. Phase 6 still benchmarks, but do not promise a perf win
from the background swap alone.

### 2.5 The view is already 4 logical zones collapsed onto 1 shared roam region

`zoneSystem.getZoneAtGrid` returns the focused zone whenever
`renderMode === 'section-scenes'` (`systems/zoneSystem.js:275-277`). The 4
zones (`ivy-cloister`, `sun-court`, `moss-hollow`, `pool-heart`) each have
their own `bounds` (8x8 grid units) and `screenRegion` (mapped from the
5504×3072 world image), but the actual focused-garden view shares one roam
polygon and one placement region. So edge-based zone travel does not need to
build a new spatial topology; it needs to:

- (a) project each zone's *own* bounds into board units `(uExtent, vExtent)`
- (b) declare per-edge `(direction, exitSegment, arrivalSegment)` against
  that per-zone projection
- (c) replace the 8 doorway corridor anchors (`path/lineup/cover/spawn/settle`
  in `gameConfig.world.doorways[*]`) with edge fly-out / fly-in segments
- (d) make `drawSpawnCover()` (`core/renderManager.js:2963`) a no-op in
  sim-board mode

That is a contained change. The zone graph (`adjacentZoneIds`,
`migrationAffinity`, ecology profiles, ecology states) does not need to
change.

### 2.6 Battle is already top-down — the rebuild does NOT reopen the battle plane

`renderManager.getGroundPlaneProfile` (`core/renderManager.js:432-447`)
returns `ellipseScaleY: 1, haloScaleY: 1, centerYOffset: 0` whenever
`viewState.battleActive` is true. So the angled garden ground plane never
leaks into battle. The
`SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md` "top-down arena, no garden-wall
fragments, no garden projection" rule is already enforced. The battle math
work is therefore *projectile and ability range conversion*, not a battle
plane redesign. **Do not reopen the top-down arena contract.**

### 2.7 ML/social emergence is bottlenecked by spatial visibility, not by missing systems

`LIFESIM-EXPRESSION-AUDIT.md` shows every social/emotional family is live.
`NEURAL-SOCIAL-SCORING-AUDIT.md` shows ML reads richer social context
without owning durable truth. The reasonable critique is that *behaviour
does not visibly read as emergent in long free play*. A correctly-projected
board with honest place identity, readable proximity, and a cleaner
overhead/shelter cue stack would let those existing systems *show more
work*. So the social-emergence depth phase comes after the sim-board
restoration, and it is mostly proof and minor coupling, not new families.

---

## Section 3 — Hard Constraints This Plan Honours

```text
preserved unchanged
├─ social family lock (n1)            : no new emotion/edge/motive families
├─ dialogue residue contract          : repair / forgiveness / reciprocity untouched
├─ communication contract             : English-first dialogue, name identity rules untouched
├─ genetics contract                  : trait/baseline/upbringing/current-state split untouched
├─ autobattle contract                : top-down arena, single-player first
├─ ML contract                        : ML scores only, durable state owned by life-sim
├─ save schema (v4)                   : durable continuity preserved through migration
├─ closure matrix                     : no frozen audit lane reopened without name
├─ canonical block unit (s1)          : 1 block = 1 board / support / 3D unit
└─ owner-per-truth invariant          : no system steals durable state from another

reopened with name
└─ visual / world-surface lane (s0/s1 visual surface only)
   └─ named contradictions: ornate-map geometry leak, behind-wall occlusion,
      sprite degradation, screen-pixel ability radii, screen-pixel battle
      motion, non-board-derived render order

deferred
├─ full Three.js renderer             : not justified yet
├─ free volumetric butterfly altitude : not justified yet
├─ player chat / cursor name identity : seam preserved, not implemented
└─ ML stage 5 (richer model-backed)   : trace capture only this round
```

---

## Section 4 — Math: Spatial Model

### 4.1 Logical Coordinate

Authoritative coordinate per entity:

```text
{ zoneId: string,
  u:      number,   // board cells along horizontal axis
  v:      number,   // board cells along depth axis
  h:      number }  // discrete stack/lift step, 0 = on ground
```

Derived (presentation-only):

```text
{ x: number, y: number, zIndex: number }
  = boardToScreen(u, v, h, zoneCamera)
```

The board unit `1` = the canonical block unit width = `gameConfig.entities.block.renderWidth = 20` *logical* pixels at the default camera. The
*rendered* block sprite size MAY change in Phase 4 if the projection requires
it (Section 4.6 below); the *logical* unit stays at 1 block.

### 4.2 Projection Choice — Recommendation

I evaluated three candidates against the existing code, the locked top-down
battle requirement, and the existing block art (front face + 7×4 depth offset
in `gameConfig.entities.block.depthX/depthY`).

| Mode | Sprite read | Stack read | Overlap diagnosis | Code cost | Compatibility |
|---|---|---|---|---|---|
| Pure top-down (orthographic) | Excellent | Poor (no depth cue) | Trivial (uvh = xyh) | Low | Conflicts with current block art's front-face look |
| Shallow oblique (recommended) | Very good | Good (clear h cue, reads block stack honestly) | Easy | Low — extension of current `groundPlane` profile | Matches current block art |
| Full isometric (legacy 18×18) | Good | Good | Hard (diamond rotation hides u/v) | High — requires re-skewing all sprite anchors | Conflicts with block art's straight front face |

**Recommendation: shallow oblique projection** (the existing `ellipseScaleY:
0.56` ground style, but explicitly defined as a projection function rather
than just a ground halo style).

Recommended formulas:

```text
constants per zone (declared once in zoneSystem):
  ppu      = pixels per board unit          // start at 20 (= block.renderWidth)
  groundT  = ground-tilt factor             // 0.56  (= existing ellipseScaleY)
  hStep    = pixels per discrete stack step // 8   (= getCanonicalBlockUnit().visualLiftStep)
  origin   = { x: zoneOriginScreenX,
               y: zoneOriginScreenY }       // top-left of zone's u=0,v=0 cell

boardToScreen(u, v, h, zone):
  x = origin.x + (u * ppu)
  y = origin.y + (v * ppu * groundT) - (h * hStep)
  zIndex = (v * 1000) + (u * 1) + (h * 0.5)   // sortable depth key

screenToBoard(x, y, zone, hHint = 0):
  u = (x - origin.x) / ppu
  v = (y - origin.y + (hHint * hStep)) / (ppu * groundT)
  // for pointer / debug, callers pass h=0 and clamp into board bounds
```

Notes:

- `groundT = 0.56` matches the current visible ground halo and preserves
  player muscle memory.
- The `(h * 0.5)` term in `zIndex` lets a butterfly at `h=2` draw above an
  adjacent block at `h=1` even when their `v` is identical (eliminates the
  `block.js:95` zIndex fight when butterfly carries are involved).
- `ppu` may be tuned per camera change later (Section 4.6) but defaults to
  `20` so existing block art draws unchanged.
- **Inverse `screenToBoard` is non-injective in `h`** (multiple `(u, v, h)`
  triples map to the same `(x, y)` because of the parallax). For pointer use
  (cursor, debug placement, click targets) we always assume `h = 0` and clamp
  into the zone bounds. For carried-block lift we use the carrier's known `h`.
  Document this rule in `SPATIAL-UNIT-CONTRACT.md` after Phase 4.

### 4.3 Render Ordering

Current ordering at `entities/block.js:95` is
`(gridY * 1000) + gridX - 220 + (stackIndex * 24)`, which keys off
`gridManager.screenToIso(this.x, this.y)` — a legacy iso conversion. Replace
with the sort key from §4.2 routed through a single helper in `renderManager`:

```text
renderManager.computeRenderSortKey(entity):
  let { u, v, h } = entity.boardPos || screenToBoard(entity.x, entity.y, entity.currentZoneId, entity.h || 0)
  let bias = entityTypeBias(entity.type)   // small offset, e.g. -0.1 for shadow, +0.05 for foreground accent
  return (v * 1000) + u + (h * 0.5) + bias
```

Where `entityTypeBias` keeps:

- shadow & ground halo  : `-0.30`
- ground footprint cues : `-0.10`
- block/flower/egg      : `+0.00`
- butterfly body        : `+0.05`  (slightly above same-cell ground objects)
- carried block         : `+0.10`  (above carrier)
- aerial particles      : `+0.20`

This eliminates the `gridY * 1000` legacy dependency. Keep the same monotonic
shape so existing layer batching does not regress.

### 4.4 Occupancy and Building (the most important section)

The existing structure system already has the right shape. The phase work is
*declaration discipline*, not new geometry.

Occupancy column rule (already live in `structureSystem.buildOccupancyColumns`):

```text
occupancy column
├─ id            : stack id
├─ position      : (u, v) in board units
├─ topH          : highest occupied h step
├─ radius        : column query radius (block.spacing * 0.5)
└─ supportChain  : ordered list of stacked block ids
```

Stack support test (already live in `getBlockSupportContext`):

```text
supportStable(block) =
  block.h == 0
  OR ( block.h <= maxStackHeight
       AND supportBlock exists in zone
       AND supportBlock.h == block.h - 1
       AND distance(block.uv, supportBlock.uv) <= columnAlignRadius )
```

Phase work:

- Replace `block.gridPos = gridManager.screenToIso(...)` with
  `block.boardPos = screenToBoard(block.x, block.y, block.currentZoneId)`.
- Replace `block.updateZIndex` with the §4.3 sort key.
- Replace `block.getVisualLift()` to read `h * hStep` directly instead of
  `stackIndex * visualLiftStep` (these are equal today but the former is the
  contract, the latter is the implementation detail).

Forbidden:

- inventing a *new* occupancy semantic (no new `bodyFit`/`pathState` values)
- changing `maxStackHeight` (`12`)
- changing `block.spatialFootprints` definitions
- letting carry/place/stack rules live anywhere except `structureSystem` +
  `physicsSystem`

Rendered block size question (the user explicitly asked):

- Logical block size stays at `1`. Always.
- Rendered block size **does NOT need to change** in Phase 4. The current
  `renderWidth = 20` already matches `ppu = 20`, so the block sprite already
  renders one board unit wide. Block depth (`depthX = 7, depthY = 4`) is the
  oblique cue and matches `groundT = 0.56` reasonably.
- If the user later wants larger blocks visually, raise `ppu` and `renderWidth`
  *together* with a single multiplier, and recompute `pixelsPerBlockUnit`
  and `hStep` from the same multiplier. Do not let them drift.

### 4.5 Entity Footprints

`gameConfig.entities.spatialFootprints` already declares per-family widths,
radii, clearances, and occupancy radii in *render-derived* terms
(`widthMode: 'size-scale'` for creatures, `widthMode: 'render-scale'` for
blocks). Phase 5 task:

- Add a `footprintInBoardUnits(entityType)` accessor on `structureSystem`
  that returns the already-existing values divided by `ppu`. No declaration
  changes required; just the accessor and one usage site (proximity queries
  in `lifeSimSystem`, `communicationSystem`, `behaviorSystem`).
- Forbid: modifying the existing footprint specs, adding new families.

### 4.6 Camera and Visible Block Sizing

The user asked whether the rendered block size should change. Honest answer:

```text
should rendered block size change in Phase 4?
└─ NO

why
├─ current renderWidth = 20 already matches the natural ppu pick of 20
├─ current depthX/depthY (7/4) already implies a groundT ≈ 0.57 (≈ 0.56 already
│  in groundPlane.ellipseScaleY)
├─ raising it would also raise butterfly visual scale, sprite cache memory,
│  and break the proportions players already accept
└─ "fix the sprite blur" buys readability much faster than "make blocks
   bigger"

when should it change?
├─ if a future camera change introduces zoom (Phase 7+ optional, NOT in scope)
├─ if a future overview-camera-aware lift step requires larger blocks for
│  small-zoom legibility
└─ in either case, change ppu, renderWidth, hStep, and visualLiftStep
   together via a single ratio; never independently
```

Recommendation: leave `renderWidth = 20` for the rebuild. Add a config note
that `ppu = renderWidth = renderHeight`. If the user later wants a "bigger"
look, that is a Phase 7+ camera change, not a Phase 4 block-size change.

### 4.7 Zone Geometry and Edge Travel

Per-zone declaration to add (in `zoneSystem`):

```text
zone (extension to existing zone shape, additive only):
├─ board:
│   ├─ widthUnits   : number    // u extent, e.g. 36
│   ├─ depthUnits   : number    // v extent, e.g. 22
│   ├─ origin       : { screenX, screenY }
│   ├─ ppu          : number    // 20 default
│   ├─ groundT      : number    // 0.56 default
│   └─ hStep        : number    // 8 default
└─ exits:
    ├─ id            : string  // "ivy-east"
    ├─ targetZoneId  : string  // "sun-court"
    ├─ direction     : "N" | "S" | "E" | "W" | "NE" | "NW" | "SE" | "SW"
    ├─ exitSegment   : { uStart, vStart, uEnd, vEnd }    // edge of source zone
    ├─ arrivalSegment: { uStart, vStart, uEnd, vEnd }    // reciprocal edge of target zone
    └─ flightVector  : { du, dv }                        // off-screen heading
```

Mapping work for the four current zones:

| Zone | Current grid bounds (config) | Recommended `widthUnits × depthUnits` (board) |
|---|---|---|
| `ivy-cloister`  | grid 0..8, 0..8   | 36 × 22 |
| `sun-court`     | grid 9..17, 0..8  | 36 × 22 |
| `moss-hollow`   | grid 0..8, 9..17  | 36 × 22 |
| `pool-heart`    | grid 9..17, 9..17 | 36 × 22 |

Recommended edge mapping (collapses the existing 8 corridor doorways into 8 zone-edge exits):

```text
ivy-cloister.exits = [
  { id: "ivy->sun",  targetZoneId: "sun-court",   direction: "E", exitSegment: u=widthUnits .. , arrivalSegment: u=0..      , flightVector: { du: +1, dv: 0 } },
  { id: "ivy->moss", targetZoneId: "moss-hollow", direction: "S", exitSegment: v=depthUnits .. , arrivalSegment: v=0..      , flightVector: { du: 0,  dv: +1 } }
]
sun-court.exits     = [ // mirror image of ivy
  { id: "sun->ivy",  targetZoneId: "ivy-cloister", direction: "W", ... },
  { id: "sun->pool", targetZoneId: "pool-heart",   direction: "S", ... }
]
moss-hollow.exits   = [
  { id: "moss->ivy",  direction: "N", ... },
  { id: "moss->pool", direction: "E", ... }
]
pool-heart.exits    = [
  { id: "pool->sun",  direction: "N", ... },
  { id: "pool->moss", direction: "W", ... }
]
```

This collapses the 8 doorway entries in `gameConfig.world.doorways` into 8
zone-edge exits. The doorway entries themselves stay in config for legacy
reference until Phase 7 retires them, but only the edge entries are read in
sim-board mode.

### 4.8 Edge-Based Zone Travel

Replace the corridor flow with a pure edge migration:

```text
zone travel (sim-board mode):
  1. butterfly chooses targetZoneId (existing migration logic, unchanged)
  2. lookup exit = zone.exits.find(e => e.targetZoneId === target)
  3. butterfly state = "departing"
       moveTowards(exitSegment.midpoint, exit.flightVector)
  4. when butterfly's screen position has crossed the zone edge by 1 board unit,
     butterfly state = "in-transit", visible = false
  5. focused zone = exit.targetZoneId (logical zone swap)
  6. butterfly's boardPos is set to a random point on exit.arrivalSegment
  7. butterfly state = "arriving"
       moveTowards(zoneInteriorTarget, opposite(flightVector))
  8. on arrival inside roam polygon, butterfly state = "normal"
```

Save-safe states (durable):

- `state = "departing" | "in-transit" | "arriving" | "normal"`
- `boardPos = { zoneId, u, v, h }`
- `migrationIntent = { targetZoneId, exitId } | null`

Save-safe transitions:

- a save mid-`in-transit` resumes at step 6 (re-snap to `arrivalSegment`).
- a save mid-`departing` resumes at step 3 (re-target the same exit).

Render rule:

- `visible = (state !== "in-transit")`
- afterimage trail extends to the screen edge during `departing` to make the
  exit feel like flight, not a teleport
- arrival fades in over `arrivalSettleFrames` (existing config: `42`)

`drawSpawnCover()` (`renderManager.js:2963`) becomes a no-op when
`world.renderMode === "sim-board"`. Keep the function callable for the
legacy renderer behind the feature flag (Section 8) until Phase 7 retires
it.

### 4.9 Sprite Fidelity Restoration

Three-line root cause from §2.1. The fix is small and contained:

```text
in core/renderManager.js (around line 117-120):
  // OLD: persistent noSmooth on entity layers
  this.layers.entities.noSmooth();
  this.layers.entitiesBehind.noSmooth();
  this.layers.blocks.noSmooth();
  // NEW: enable smoothing on creature layers; particles/blocks may stay no-smooth
  this.layers.entities.smooth();
  this.layers.entitiesBehind.smooth();
  this.layers.blocks.noSmooth();      // pixel-art block style intentional
  this.layers.particles.noSmooth();
  if (this.layers.entities.drawingContext) {
    this.layers.entities.drawingContext.imageSmoothingEnabled = true;
    this.layers.entities.drawingContext.imageSmoothingQuality = 'high';
  }
  if (this.layers.entitiesBehind.drawingContext) {
    this.layers.entitiesBehind.drawingContext.imageSmoothingEnabled = true;
    this.layers.entitiesBehind.drawingContext.imageSmoothingQuality = 'high';
  }

in core/spriteManager.js createBakedSurface(... { smooth = false }):
  // OLD: default smooth = false
  // NEW: default smooth = true for body/antenna/wings/caterpillar (creature family);
  //       block/cocoon/flower-head can choose explicitly when called
  // Force callers to opt out, not in.
  // (Alternative implementation: keep smooth false but bake at higher dimensionStep,
  //  so the baked surface itself is supersampled. This keeps pixel-perfect look on
  //  the small variants while preserving wing texture. The simpler fix is recommended
  //  first; only switch to supersampling if it visibly degrades perf.)

in entities/butterfly.js (around line 3535):
  // remove the gating on smoothedButterflySpriteMaxVisible for the entity-layer path.
  // The layer-level smoothing flag now handles it; per-frame smooth()/noSmooth() toggles
  // become unnecessary and were a perf risk.
```

Plus capture telemetry:

- the capture summary's `spriteCache: 0/0` indicates the cache telemetry is
  not surfacing real values during free play. Fix `getBakedSpriteCacheTelemetry`
  call site so the capture reflects whether the bake path is being used.
- Add a one-line debug overlay (debug-only) showing
  `"baked sprites: <hits>/<misses> | <familyCount> entries | <surfaceMB>"`.

Acceptance evidence:

- before/after wing close-up screenshots at sun-court, ivy-cloister, and
  during a hover/select state
- `spriteCache hits > 0` in a fresh capture summary

### 4.10 Garden Ability Radius Conversion

Current state (in `systems/specialEffects.js:204-260`,
`systems/teachingSystem.js:227`, `gameConfig.balance.social`):

| Symbol | Current value | Meaning today | Meaning after conversion |
|---|---|---|---|
| `getAbilityVisualDefaults('warmRally').abilityRadius` | `90` px | screen distance | `90 / 20 = 4.5` board units |
| `getAbilityVisualDefaults('shimmerVeil').abilityRadius` | `100` px | screen distance | `100 / 20 = 5` board units |
| `gameConfig.balance.social.teachingPulseRadius` | `76` px | screen distance | `76 / 20 = 3.8` board units |
| `gameConfig.balance.social.trustCascadeRadius` | `132` px | screen distance | `132 / 20 = 6.6` board units |
| `gameConfig.balance.training.stationRadius` | `42` px | screen distance | `42 / 20 = 2.1` board units |
| `gameConfig.balance.training.impactRadius` | `22` px | screen distance | `22 / 20 = 1.1` board units |

The conversion is intentionally conservative (`radius_pixels / ppu`) so
**gameplay reach does not change** at the default camera. Future camera zoom
won't break ability reach.

Per-ability spatial-distance recommendation:

```text
default for support / heal / aura abilities (Warm Welcome, teaching, sleep
comfort, trust cascade, sparkle trail, shimmer veil):
  cylindrical aura
    groundD = sqrt((u2 - u1)^2 + (v2 - v1)^2)
    heightD = abs(h2 - h1)
    affected = groundD <= radiusUnits
            AND heightD <= heightReachUnits   // default heightReach = 2 (one shelter level above ground)

default for projectile / strike abilities (Electric Violet speedzone, Nervous
Jewel cascade, Ancient Scholar lesson glyph):
  spherical (3D Euclidean)
    d = sqrt((du)^2 + (dv)^2 + ((dh) * heightWeight)^2)   // heightWeight = 0.6
    affected = d <= radiusUnits

default for golden crown / status:
  ground footprint (h ignored)
```

Required new contract surface (one accessor on `structureSystem` + one
helper on `communicationSystem`):

```js
// structureSystem
distanceBoard(entityA, entityB)
  -> { ground, vertical, euclidean, withinCylinder(radiusU, heightU) }

// communicationSystem
emitSignalAt(zoneId, sourceBoardPos, signalType, overrides)
  // recipient query uses distanceBoard, not Math.hypot on screen x/y
```

`specialEffects.drawAbilityRing` (`systems/specialEffects.js:593`) keeps its
visual radius in screen pixels but reads it as
`abilityRadiusUnits * ppu * groundT` so the projected ring matches gameplay
reach on the oblique board.

### 4.11 Battle Ability and Projectile Math

Battle stays top-down. Conversion goal is to make battle math board-derived
so a future battle camera change would not silently break range balance.

Current screen-pixel battle motion (`gameConfig.battle.motion`):

```text
attackAdvancePx       32   ->  attackAdvanceUnits       1.6
hitRecoilPx           16   ->  hitRecoilUnits           0.8
rallyAdvancePx        12   ->  rallyAdvanceUnits        0.6
rallyLiftPx            6   ->  rallyLiftUnits           0.3
guardBobPx             3   ->  guardBobUnits            0.15
retreatAdvancePx      34   ->  retreatAdvanceUnits      1.7
roamRadiusX           20   ->  roamRadiusXUnits         1.0
roamRadiusY           12   ->  roamRadiusYUnits         0.6
engagementDriftPx     14   ->  engagementDriftUnits     0.7
projectileDurationMs 460   ->  unchanged (time, not distance)
```

Add `gameConfig.battle.motion.unitsPerArenaCell` and convert all `*Px`
values via that ratio. At the default arena (5504×3072 mapped to canvas), 1
arena cell ≈ 20 px, so the conversion is again identity at default size.
Future arena resizes don't break recoil distance.

Recommended projectile path (unifies all current ability traces):

```text
for each registered projectile (see "drawBattleProjectiles" loop):
  P(t) = lerp(A, B, t)                              // ground component
       + arenaUp * (arcHeight * sin(pi * t))        // arc in projected vertical
  where:
    A, B are arena board positions of source & target participants
    arcHeight is ability-specific (default 0.4 board units; 0 for "veil"-style
              ground effects; up to 1.2 for cascade/lesson-glyph)
    arenaUp is the projected-up unit vector (in oblique projection, this is
            (0, -hStep) per board unit of h; in pure top-down arena, it is
            (0, -1) scaled by arc visual scale)
```

This one formula covers strike-bolt, support-pulse, warm-orb, lesson-glyph,
shimmer-orb, shimmer-veil, petal-burst, petal-ribbon, bloom-ring,
violet-surge, cascade-shard, cascade-wave, golden-star, golden-flare, and
golden-guard. The visual style stays ability-specific via the existing
`projectileStyle` field; only the path math is unified.

Hit volume (presentation only — battle outcome stays autobattle-timed):

```text
hit volume      = ability.hitVolumeShape ∈ { ground-circle, sphere, cylinder, cone }
hit footprint   = source.uvh -> target.uvh, intersected with ability radius
visible cue     = projected outline drawn at impact frame (already exists for several abilities)
```

Battle outcome resolution stays in `battleSystem` exactly as today. Render
math only owns the *visual* hit cue. **No durable HP/pressure mutation moves
out of `battleSystem`.**

### 4.12 Attack Startup / Travel / Impact / Recoil / Recovery

Express each phase as a fraction of a single ability action duration:

```text
ability action timeline (durationMs from gameConfig.battle.motion):
  startupT    = [0.00, 0.18]   // wind-up bob, no projectile yet
  travelT     = [0.18, 0.78]   // projectile in flight, P(t) above
  impactT     = [0.78, 0.86]   // hit cue + recoil starts
  recoilT     = [0.86, 1.00]   // target recoil + source recovery
```

Map current `attackDurationMs = 560`, `hitReactionDurationMs = 340`,
`rallyDurationMs = 520`, `releaseDurationMs = 980` into this normalized
timeline and use one driver in `renderManager.getBattleParticipantPose`. The
existing pose function already does most of this; the change is making the
intermediate t-fractions explicit and ability-table-driven so future
abilities don't need new bespoke code.

### 4.13 Save Migration

Save schema is at `v4` per the gap assessment. Add `v5`:

```text
v5 additions (additive only — old v4 saves still load):
- per entity (butterfly, block, flower, egg, chrysalis, caterpillar):
    boardPos: { zoneId, u, v, h }
- per zone (in zones.* serializeDurableState):
    boardConfig: { widthUnits, depthUnits, origin, ppu, groundT, hStep }
- per active migration:
    migrationIntent: { targetZoneId, exitId, state }

v4 -> v5 migration:
  for each entity with x/y but no boardPos:
      if entity.currentZoneId in zoneSystem:
          boardPos = screenToBoard(x, y, currentZoneId, hHint = stackIndex || 0)
      else:
          boardPos = null   // entity stays screen-only until zone re-enter

  for each entity with stackIndex > 0:
      h = stackIndex   // canonical block unit lock guarantees this

  for each migrating butterfly with old "covered-corridor" travel state:
      coerce to nearest exit:
          exit = nearestExitToScreenPosition(x, y)
          state = "in-transit"
          migrationIntent = { targetZoneId: exit.targetZoneId, exitId: exit.id, state: "in-transit" }
```

Migration safety rules:

- a v4 save *must* round-trip to v5 and back to a save file Codex can load
  again from the same code (re-export migration is one-way; the new save
  file can simply use v5 going forward).
- if any boardPos lands outside the zone's `widthUnits × depthUnits`, clamp
  to the nearest interior cell and log a `runtime-issue` of type
  `save-migration-clamp` with the entity id.
- if any block stack maps to an illegal support state, fall back to
  `placedAt(nearestValidSupportPoint)` and log
  `save-migration-stack-fallback`.
- biography, social edges, memories, dialogue residue, lineage, ML feature
  state, ML decision history — all preserved exactly. **No social truth is
  serialized differently.**

Save proof:

- a fresh long-running save round-trips through `v5` save -> reload -> save
  -> reload with no entity loss, no edge loss, no stack collapse, and no
  boardPos drift.
- the existing `v8a` runtime-only proof and `h5` long-running save audit
  must remain green after the schema bump.
- one new audit `run-s9-save-migration-v5-audit.js` verifies the v4 -> v5
  path on the lived-in save (Section 9).

### 4.14 Performance and Benchmark Impact

Expected from §4.1-4.13:

| Lane | Direction | Why |
|---|---|---|
| `single-zone-122` (reality) | unchanged or slight improvement | `drawSpawnCover` no-op in sim-board mode, `flowersDirectPresent` unchanged |
| `single-zone-200` (stress) | unchanged or slight improvement | composite/drawImage unchanged, render order key cheaper |
| `block-carry-active` | slight improvement | structure cache key no longer pulls `gridManager` legacy work for carry resolution |
| `flower-feed-storm` | unchanged | flower draw path unchanged |
| Entity smoothing | small render cost | `imageSmoothingEnabled = true` adds bilinear cost; expected `<1ms` on 12-200 visible butterflies |

The plan does NOT promise a perf win. Sprite smoothing alone may add ~0.3-0.8
ms of render time at 200 butterflies. Phase 6 must rerun the four composed
lanes and accept any regression up to `+1.5ms avg render` on
`single-zone-200` if `single-zone-122` and the targeted lanes hold flat.
Anything worse must trigger a hold.

The capture's `pressureTier: critical` with only 3.21ms update / 16.65ms
render is *render-dominant*. Most of that is composite (`compositeMs 2.23ms`)
and direct flower presentation (`flowersDirectPresentMs 2.08ms`), neither of
which this rebuild touches. So the main remaining runtime risk is the
smoothing flag on the entities layer. Mitigations:

- if smoothing is too expensive at 200 butterflies, supersample the baked
  wing surface by 1.5× and keep `noSmooth` (the supersample makes the
  downscale to render look much better even without bilinear filtering).
- promote `bakedCreatureSprites` cache hit rate to >90% so per-frame draw
  is a direct image() of pre-baked surface, not a re-bake.

---

## Section 5 — Cooperation, Conversation, Trace Capture, Future Player Identity

### 5.1 Cooperation Pressure (after spatial board is stable)

The current locked drives in `LIFESIM-EXPRESSION-AUDIT.md` (selfMaintenance,
safetyAvoidance, resourceControl, socialConnection, caregiving, exploration,
statusExpression, rest) are sufficient for cooperation. The gap is *world
incentive*, not new families.

Recommended cooperation hooks (Phase 7+, all use existing systems):

```text
cooperation hook                          existing system to extend
─────────────────────────────────────────  ──────────────────────────────────
"heavy block" (h>=3) needs 2 carriers     entities/block.js (carry capacity flag)
                                          systems/structureSystem.js (lift cooperation rule)
shelter benefit scales with co-occupants  systems/lifeSimSystem.js (rest comfort modifier)
                                          systems/sleepSystem.js (recovery rate bonus)
zone scarcity events drive sharing/warning systems/zoneSystem.js (resource pulse)
                                          systems/communicationSystem.js (warning/share signals)
care for distressed butterflies            systems/lifeSimSystem.js (distress signal)
                                          systems/communicationSystem.js (rally->care)
teach->learn improves listener routine     systems/teachingSystem.js (already live)
                                          systems/lifeSimSystem.js (routine reinforcement)
scout discovers better resource zone       systems/lifeSimSystem.js (memory + migration affinity)
                                          systems/communicationSystem.js (broadcast)
status/reputation gates social access      systems/lifeSimSystem.js (already live in society summaries)
                                          systems/communicationSystem.js (recipient filter)
```

These are *coupling tightenings*, not new families. None of them violate the
social family lock. They produce cooperation pressure because the new sim
board makes proximity, place identity, and stack-shelter readable enough to
matter.

### 5.2 Conversation as Action

`DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md` is already strict about this
(rememberability bands, edge deltas, repair, forgiveness, anchoring). The
new sim board change is one targeted hook:

```text
new conversation-spatial coupling (Phase 7+)
├─ conversation target selection prefers same-zone, low-board-distance pairs
├─ open_talk recipient set uses distanceBoard, not screen-radius hypot
├─ multi_target speaker requires at least one recipient inside ground-cylinder
│  of "speaking radius" (~6 board units default)
└─ teaching residue is stored with the (zoneId, u, v) of the lesson, so later
   replay of similar terrain reinforces it
```

These are tiny patches. Most of the dialogue work (anchoring, repair,
forgiveness) is already done.

### 5.3 Machine-Learning Path Toward Real AI

`ML-IMPLEMENTATION-CONTRACT.md` already locks the staged ladder
(Stage 1: deterministic sim truth; Stage 2: trace capture; ... Stage 5:
richer model-assisted expression). The current shipped runtime is at
Stage 2-3. The rebuild should extend trace capture so a later real-ML pass
has training data, without changing the runtime ML cost.

Trace fields to capture *now* (additive in `mlInferenceSystem`'s decision log;
durable persistence is opt-in and stays under the existing
`decisionHistoryLimit = 6` cap so we do not bloat saves):

```text
per decision (additive — no existing fields removed):
├─ zoneId, boardPos { u, v, h }
├─ social context     : ml feature bundle row id
├─ chosen action      : action family + target
├─ alternatives       : top-2 alternative scores
├─ outcome window     : { satisfied, regret, surprise, social-residue-delta }
│   captured 60 frames after the action commits
└─ trainable-corpus tag : Boolean, default false (turn on per scenario)
```

Persistence rule: trace fields are a *runtime-class* field on the decision
log, not durable save state. Optional offline export to
`qa_logs/ml_corpus/` via a script (`scripts/export-c2-trace-corpus.js`
already exists per the ML contract). The rebuild adds one entry per decision
to that exporter; no schema change to the durable save.

This gets us trainable data **without** changing how ML behaves at runtime.
That preserves the current ML budget (`mlScoringIntervalFrames = 48`,
`mlScoringBudgetMs = 3.5`) and the cost-vs-value question stays for `g6`.

### 5.4 Future Cursor / Player-As-Speaker Seam

The user explicitly asked NOT to make this a first task. Honoured. But the
spatial rebuild should leave seams that do not require a rewrite to add
later. Recommended seam reservations (no implementation, just contract):

```text
reserved durable fields (not added to v5; declared as v6+ candidate):
├─ playerProfile.displayName   : string (default null)
├─ playerProfile.cursorEntityId: string (default "cursor")
├─ playerProfile.cursorBoardPos: { zoneId, u, v, h } (already derivable from cursor x/y)
└─ butterfly.relationshipsToPlayer:
     { trust, fear, attachment, lastSpeechReceivedAt, knownByPlayerName }

reserved communicationSystem extensions (declared as v6+ candidate):
├─ talkMode = "to_player"      : single-target, listenerId = playerProfile.cursorEntityId
├─ heard interpretation supports a non-butterfly speakerId
└─ player-attributable feed line uses playerProfile.displayName when set
```

Document these in a new `docs/PLAYER-CURSOR-SOCIAL-SEAM.md` after Phase 4
closes. Do not implement in this rebuild.

---

## Section 6 — Phase Order (Codex-Executable)

This phase order is what Codex should execute. Each phase has goal, owned
files, forbidden files, contracts, migration, feature flags, proofs,
acceptance, rollback, risks, and the first concrete task.

```text
phase order (revised)
├─ P0 : Sprite Fidelity Restoration                     [must precede everything]
├─ P1 : Spatial Math Foundation                          [add boardPos contract, no behavior change]
├─ P2 : Default-Off Sim-Board Render Mode                [feature-flagged, side-by-side with legacy]
├─ P3 : Edge-Based Zone Travel                           [behind sim-board flag]
├─ P4 : Building / Occupancy Unification On Board        [behind sim-board flag]
├─ P5 : Garden + Battle Ability Radius Conversion        [board-unit aware, gameplay-identity preserved]
├─ P6 : Save Migration v4 -> v5                          [additive, behind feature flag for read-only verification first]
├─ P7 : Acceptance Harness + Bench Refresh + Promotion   [flip default to sim-board if all green]
└─ P8 : Trace-Capture Hooks (Future-AI Preparation)      [optional, low-risk, after promotion]
```

P0 lands first and standalone because it can be evaluated against the
existing world, and because it eliminates the unfair-comparison problem when
P2 ships.

P5, P6, P8 are independent of each other and can be parallelized once P1-P4
land.

### 6.1 Phase P0 — Sprite Fidelity Restoration

Goal: butterfly wings, body, antennae render at fidelity matching the
high-resolution sources, without rebalancing visual scale.

Owned files:

- `core/renderManager.js` (lines 117-120 layer flags; no other changes)
- `core/spriteManager.js` (`createBakedSurface` smoothing default; baked
  surface dimension step on wing pieces; telemetry surfacing)
- `entities/butterfly.js` (lines 3535-3578 smoothing toggle removed since
  layer-level handles it; no draw geometry change)

Forbidden files:

- `entities/block.js`, `entities/flower.js`, `entities/caterpillar.js`,
  `entities/flowerVarieties.js` (block stays pixel-art crisp; flower already
  has its own smoothing path)
- everything in `systems/`
- `core/gameCore.js`, `core/config.js`

Data contracts: none changed. Save schema unchanged.

Migration: none.

Feature flag: `gameConfig.performance.flags.smoothCreatureSprites` (default
`true`; permits emergency rollback by setting to `false`).

Proofs:

- `node scripts/run-v3-sprite-parity-audit.js` (existing; must pass)
- `node scripts/run-runtime-self-audit.js` (existing; must pass)
- one fresh manual capture (recorder UI) — confirm
  `spriteCache: <hits>/<misses>` shows non-zero hits in the summary
- side-by-side wing close-up screenshots: before / after at sun-court,
  ivy-cloister, and during Inspect

Acceptance:

- visible wing texture matches source intent on 12+ butterflies
- `spriteCache hits > 0` in the next manual capture
- no perf regression > +0.6ms avg render at 200 butterflies on
  `single-zone-200`
- no console errors, no page errors, no new warnings

Rollback: set `smoothCreatureSprites: false`; layers revert to `noSmooth()`.

Risks:

- baked surface memory grows if smoothing forces new bake step; mitigate
  with `wingDimensionStep` quantization (already in spriteManager)
- text/UI is rendered on `layers.ui` (which is smooth by default per
  `renderManager.js:123`), so no UI text regression expected

First Codex task: change the four layer-init lines and the
`createBakedSurface` default; rerun `run-v3-sprite-parity-audit.js` and
record the proof.

### 6.2 Phase P1 — Spatial Math Foundation

Goal: declare `boardPos = { zoneId, u, v, h }` as a derived helper, declare
`boardToScreen / screenToBoard` as the canonical projection, route the
render sort key through a single helper. **No runtime behavior change.**

Owned files:

- `core/renderManager.js` (`getProjectionForZone(zoneId)` factory; new
  `boardToScreen / screenToBoard` helpers; new `computeRenderSortKey(entity)`
  that *defaults* to the legacy formula for entities without `boardPos`)
- `systems/zoneSystem.js` (per-zone `board` declaration with
  `widthUnits / depthUnits / origin / ppu / groundT / hStep`; default values
  match Section 4.7)
- `systems/structureSystem.js` (one new accessor `distanceBoard(a, b)`,
  one `getProjectionPpu()`)
- `core/config.js` (one new section `spatial.projection` with default
  `{ ppu: 20, groundT: 0.56, hStep: 8 }`)

Forbidden files:

- everything in `entities/`
- `systems/saveSystem.js`
- everything else in `systems/`
- `core/gameCore.js`

Data contracts:

- `zone.board` shape declared (additive)
- `boardPos` shape declared (not yet stored on entities)

Migration: none yet.

Feature flag: none. The new helpers exist but are not consumed by any draw
path yet.

Proofs:

- one new unit test `scripts/run-spatial-projection-unit-tests.js` that
  asserts `boardToScreen(screenToBoard(x, y, zone, 0), 0).{x,y}` matches
  the input within `0.5px` for 1000 sample points across all four zones
- existing `run-a4-spatial-truth-audit.js` must still pass
- existing `run-r2-zone-transition-audit.js` must still pass

Acceptance:

- new helpers exist, are pure, are tested
- no runtime behavior change visible in any existing audit

Rollback: revert the patch. No save side-effects.

Risks:

- helpers diverge from the actual draw path → mitigation: Phase P2
  immediately switches the new sim-board renderer to use them, so any drift
  surfaces fast

First Codex task: write the projection helpers and the unit test. No other
file touched.

### 6.3 Phase P2 — Default-Off Sim-Board Render Mode

Goal: a clean generated ground per zone, board-derived placement, behind a
flag. Old ornate scene preserved as default until Phase 7.

Owned files:

- `core/renderManager.js` (`drawBackground()` branches on
  `world.renderMode`: when `"sim-board"`, draws a flat zone-tinted ground
  using `zone.renderProfile.overlayTint` instead of `backgroundImage`; calls
  `drawSpawnCover()` only when not sim-board; new
  `drawSimBoardGroundGuides()` debug-only)
- `core/config.js` (`world.renderMode` accepts `"sim-board"`; the four zones'
  `renderProfile.overlayTint` already exist and become the new ground colors)

Forbidden files:

- everything in `entities/` except the entity draw path may *opt in* to
  reading `entity.boardPos` if present, falling back to `x/y` if not
- everything in `systems/` except `zoneSystem` may expose
  `getBoardConfigForZone(zoneId)`
- save layer

Data contracts: `world.renderMode = "sim-board" | "section-scenes"` is now
two-valued. Default stays `"section-scenes"`.

Migration: none — feature flag.

Feature flag: `gameConfig.world.renderMode = "sim-board" | "section-scenes"`
(persistent in localStorage as `papilionem-world-rendermode`; default stays
`"section-scenes"` until Phase 7).

Proofs:

- screenshot capture of all four zones in sim-board mode, with butterflies
  and blocks
- screenshot capture of the same four zones in legacy mode for comparison
- `single-zone-122` benchmark in sim-board mode must hold within +/-1.5ms
  of the post-P0 baseline
- existing `run-a4-spatial-truth-audit.js` must still pass in *both* modes
- new `run-sim-board-baseline-audit.js` (writes pass/fail report)

Acceptance:

- player can toggle the mode (devtools or a debug shell command)
- block placement, carry, stack still pass on the new board
- no spawn-cover overlay drawn in sim-board mode
- butterfly behavior unchanged

Rollback: set `world.renderMode = "section-scenes"`.

Risks:

- drawSpawnCover gates behave incorrectly because they read from a stale
  `viewState.battleActive` flag — mitigation: the gate also checks
  `world.renderMode !== "sim-board"`, AND tests cover both modes
- block z-index sort fights butterflies → mitigation: P1's
  `computeRenderSortKey` is now consumed by the entities draw layer

First Codex task: add the renderMode branch, write the
`drawSimBoardGroundGuides`, capture sun-court before/after.

### 6.4 Phase P3 — Edge-Based Zone Travel

Goal: butterflies fly off the zone edge and arrive on the reciprocal edge
of the destination zone. Save-safe.

Owned files:

- `systems/zoneSystem.js` (`buildZoneExits()` from `adjacentZoneIds` +
  flight directions; per-zone `getExits()` accessor)
- `core/gameCore.js` (zone travel state machine: replace doorway-corridor
  flow with departing -> in-transit -> arriving; preserve all existing
  save-safe state names where possible)
- `entities/butterfly.js` (zoneTravel state shape: add
  `migrationIntent: { targetZoneId, exitId, state }`; existing
  `zoneTravel` becomes the durable record)
- `core/renderManager.js` (`drawSpawnCover` no-op in sim-board mode; cover
  layer not built; afterimage trail extended during `departing`)

Forbidden files:

- save schema (Phase P6 owns)
- structure system, life sim, ML, communication, battle

Data contracts:

- `butterfly.zoneTravel` shape additively gains `exitId`
- `zone.exits` declared (already in P1)

Migration: none yet (legacy doorway corridors still produced for
section-scenes mode; only sim-board mode reads exits).

Feature flag: gated by `world.renderMode === "sim-board"`.

Proofs:

- new `scripts/run-sim-board-edge-travel-audit.js`:
  - 4 butterflies, one per zone, each migrates to a specific neighbour
  - assert each crosses the exit segment, becomes invisible, swaps logical
    zone, appears on the reciprocal edge, settles
  - assert no `drawSpawnCover` call during sim-board frames (instrument as
    `run-r5-battle-presentation-audit.js` already does for the wrap)
- existing `run-r2-zone-transition-audit.js` must still pass in sim-board
  mode (may need an alternative pass criterion that does not require
  doorway corridor presentation)
- save mid-transit -> reload -> verify no teleport

Acceptance:

- zone travel reads as flight, not as walk-through-doorway
- ecology counts and zone ownership remain correct
- save round-trip during transit produces no entity loss

Rollback: section-scenes mode still works exactly as today; flip
`world.renderMode`.

Risks:

- offscreen butterflies still tick: mitigate by leaving update logic
  unchanged (only render visibility changes)
- existing migration logic ties to doorway anchors: mitigate by treating
  the new exit segment midpoint as the doorway anchor for the migration
  decision module's input

First Codex task: build `zone.exits` from `adjacentZoneIds` per Section 4.7;
write the new audit; do not change the legacy path yet.

### 6.5 Phase P4 — Building / Occupancy Unification

Goal: blocks placed on the new board read as honest stacks; carry / place /
stack proofs pass; legacy `gridManager.screenToIso` is no longer the
zIndex authority.

Owned files:

- `entities/block.js` (replace `gridPos = gridManager.screenToIso(x, y)`
  with `boardPos = renderManager.screenToBoard(x, y, currentZoneId, h)`;
  replace `updateZIndex` with `renderManager.computeRenderSortKey(this)`;
  `getVisualLift` reads `h * hStep`)
- `entities/butterfly.js` (`boardPos` derived from `x, y, currentZoneId`;
  carry pose preserved; rendering unchanged)
- `core/butterflyStore.js` (storage of `boardPos` if present)
- `systems/structureSystem.js` (occupancy column position now optionally in
  `(u, v)`; *all existing screen-px values stay valid* via
  `screenToBoard`/`boardToScreen` round-trip; structure rebuild signature
  unchanged)

Forbidden files:

- `core/gridManager.js` is restricted in this phase — it remains as-is, but
  no NEW call site is allowed to use `screenToIso/isoToScreen`. Existing
  call sites stay until Phase P7 retires them.
- `core/isometricPhysics.js` is left in place but marked `@deprecated`; no
  new call sites
- save schema (Phase P6 owns)

Data contracts:

- `boardPos: { zoneId, u, v, h }` becomes the canonical positional truth
  for entities in sim-board mode. Screen `x, y` becomes derived.

Migration: none yet (Phase P6 covers durable migration; in-memory entities
just compute boardPos lazily).

Feature flag: gated by `world.renderMode === "sim-board"`.

Proofs:

- existing `run-b4-carry-stack-physics-audit.js` must still pass in
  sim-board mode
- existing `run-r7-block-visual-audit.js` must still pass in sim-board mode
- new `scripts/run-sim-board-occupancy-audit.js`:
  - 12 blocks placed on ground in a known pattern; assert
    `block.boardPos.{u,v,h}` matches expected within `0.05` board units
  - 4 stacked towers (h=3 each); assert support state stable; assert no
    floating block; assert visual lift = `h * hStep`
  - 1 carried block; assert carry anchor matches `getCarryAnchorForEntity`

Acceptance:

- block placement feels at least as clear as today; subjective improvement
  acceptable
- logical support matches visible stack
- no regression in existing block audits
- no regression in `block-carry-active` benchmark lane

Rollback: section-scenes mode preserves legacy behavior; flip
`world.renderMode`.

Risks:

- `gridPos`-keyed sort regressions on overlap; mitigate by keeping
  `block.gridPos` populated (cheap) and computing `boardPos` alongside

First Codex task: add `boardPos` derivation in `block.update`; route
`updateZIndex` through `computeRenderSortKey`; rerun b4 + r7 audits.

### 6.6 Phase P5 — Garden + Battle Ability Radius Conversion

Goal: every ability radius and signal radius is expressed in board units
internally; gameplay reach unchanged at the default camera.

Owned files:

- `systems/specialEffects.js` (`getAbilityVisualDefaults` returns
  `abilityRadiusUnits` alongside `abilityRadius`; ring draw projects
  `radiusUnits * ppu` at draw time)
- `systems/communicationSystem.js` (`getSignalConfig` returns
  `radiusUnits`; recipient query uses `distanceBoard`; persistent
  `signal.radius` stays compatible by deriving from `radiusUnits * ppu`)
- `systems/teachingSystem.js` (impact + station radius read board-unit
  config)
- `systems/lifeSimSystem.js` (proximity queries route through
  `distanceBoard`; same numeric reach at default ppu)
- `systems/battleSystem.js` (battle motion uses `*Units` fields;
  projectile dispatch carries `arcHeightUnits`; HP/result resolution
  unchanged)
- `core/renderManager.js` (`drawBattleProjectiles`,
  `drawBattleAbilityActivation`, `drawBattleReactionEffect` consume the
  unified P(t) formula)
- `core/config.js` (`balance.social.*RadiusUnits`,
  `balance.training.*RadiusUnits`, `battle.motion.*Units` added; legacy
  `*Px` / `*Radius` derived from them)

Forbidden files:

- `entities/butterfly.js` draw path
- structure system, save layer, ML, autobattle outcome math

Data contracts:

- ability/signal/battle motion now have `*Units` companions; legacy `*Px` /
  `*Radius` are derived (additive only)

Migration: none for save data. Numeric equivalence preserved.

Feature flag: none — boards-unit is always live (the legacy values are
derived from it). Old saves continue to work.

Proofs:

- existing `run-r5-battle-presentation-audit.js` must still pass
- existing `run-single-player-autobattle-audit.js` must still pass
- existing `run-r6-communication-audit.js` must still pass
- existing `run-n6-neural-social-scoring-audit.js` must still pass
- new `scripts/run-ability-radius-conversion-audit.js`:
  - assert `getAbilityVisualDefaults('warmRally').abilityRadiusUnits == 4.5`
  - assert recipients of `emitSignalAt(zone, src, "teach")` match the
    cohort that the legacy screen-radius code would have selected (within
    `±1` recipient on each of 8 randomized seedings)

Acceptance:

- no behavior change visible to player
- no audit regression
- one new debug overlay shows `radius (units): N.N | (px): MM` for the
  selected ability ring

Rollback: revert the `*Units` -> `*Px` derivation table; legacy `*Px`
values stay valid as before.

Risks:

- floating-point drift in recipient sets; mitigate with `ε = 0.5 * radius`
  buffer in the recipient query (matches existing buffer)

First Codex task: write the conversion table; ship the new audit; rerun r5
+ r6 + n6.

### 6.7 Phase P6 — Save Migration v4 -> v5

Goal: durable continuity preserved through schema bump.

Owned files:

- `systems/saveSystem.js` (`SAVE_SCHEMA_VERSION = 5`; `migrateV4ToV5`;
  serialize `boardPos` per entity; serialize `boardConfig` per zone)
- `systems/zoneSystem.js` (`serializeDurableState` includes `boardConfig`;
  `deserializeDurableState` accepts both v4 and v5 zone shapes)
- `entities/butterfly.js` and `entities/block.js`
  (`serializeDurableState` includes `boardPos`)
- `core/butterflyStore.js` (load path tolerates both shapes)

Forbidden files:

- everything in `systems/` except listed
- ML, life sim, communication, battle (their internal serializers do not
  change)

Data contracts:

- `SAVE_SCHEMA_VERSION = 5`
- additive: no v4 field is removed; v5 fields are optional with sensible
  defaults

Migration:

- on load, if `version < 5`: compute `boardPos` from
  `screenToBoard(x, y, currentZoneId, stackIndex || 0)` per entity
- on save, always write v5 format

Feature flag: `gameConfig.save.preferV5OnRead` default `true`. Setting to
`false` lets the migration write v5 but read prefers v4 fields when
present (used during validation).

Proofs:

- new `scripts/run-s9-save-migration-v5-audit.js`:
  - load a known v4 lived-in save; assert all entities have valid `boardPos`;
    assert no entity is outside its zone bounds
  - re-save; load again as v5; assert numerical equivalence on every
    durable family (drives, emotions, edges, memories, lineage, dialogue
    residue, ML decision history)
- existing `run-h5-long-running-save-smoothness-audit.js` must still pass
- existing `run-runtime-self-audit.js` must still pass

Acceptance:

- v4 save loads cleanly as v5
- v5 save round-trips losslessly
- no entity loss, no edge loss, no drift in social/biological state
- no `runtime-issue` of type `save-migration-clamp` or
  `save-migration-stack-fallback` exceeding 1% of entities

Rollback: revert save schema bump; v5 saves can be down-converted by
ignoring the `boardPos` field (it is recomputable on load).

Risks:

- a subtle ML decision-history serialization change forces a re-bake of the
  policy artifact — mitigate by leaving ML serializer untouched and adding
  a regression test for `mlInferenceSystem.getRuntimeSummary()` before
  and after migration

First Codex task: write `migrateV4ToV5`; ship the s9 audit; verify with the
lived-in save.

### 6.8 Phase P7 — Acceptance Harness, Bench Refresh, Promotion

Goal: prove the new board with composed benchmarks and captures, then flip
default to sim-board if all green.

Owned files:

- composed benchmark harness scenarios (add `single-zone-122-sim-board`
  and `single-zone-200-sim-board` lanes)
- `core/config.js` (default `world.renderMode = "sim-board"`)
- `docs/ACTIVE-COMPLETION-BOARD.md` (record promotion; add new acceptance
  lanes; mark old `r2-doorway-presentation-audit` as legacy regression)

Forbidden files:

- entity / system / save layer (no behavior change)

Data contracts: none.

Migration: none.

Feature flag: legacy mode stays available via
`world.renderMode = "section-scenes"` for one full release cycle.

Proofs:

- composed benchmarks rerun in both modes; sim-board lanes hold within
  +/-1.5ms of the post-P0 baseline
- new manual capture in sim-board mode at 12 / 50 / 100 / 200 butterflies
- existing `g0-bar` 20-minute lived-in acceptance pass on sim-board mode
- existing battle, ability, dialogue, social, sleep audits all pass in
  sim-board mode

Acceptance:

- sim-board mode is at least as readable as section-scenes mode
- no perf regression > +1.5ms on `single-zone-122`
- no regression in any frozen audit lane
- one human signoff against `g0-bar` rubric

Rollback: flip default back to `section-scenes`. The old code path stays
live for at least one release cycle.

Risks:

- subjective player preference: mitigate with player-toggleable
  `world.renderMode` for at least one cycle

First Codex task: add the two new bench lanes; rerun all four composed
lanes in both modes; produce a side-by-side report.

### 6.9 Phase P8 — Trace Capture (Optional, Low-Risk, Future-AI Prep)

Goal: enrich `mlInferenceSystem` decision log so future ML can train from
real free play; no runtime cost increase.

Owned files:

- `systems/mlInferenceSystem.js` (one new field per decision:
  `outcomeWindow`; populated lazily 60 frames after the decision)
- `scripts/export-c2-trace-corpus.js` (existing per ML contract; extend to
  include `outcomeWindow`)

Forbidden files: everything else.

Data contracts:

- decision-log row shape adds `outcomeWindow` (runtime-class field; not
  durable beyond `decisionHistoryLimit = 6`)

Migration: none.

Feature flag: `gameConfig.ml.traceCapture.outcomeWindow` default `true`.

Proofs:

- new `scripts/run-ml-trace-capture-audit.js`:
  - run focused-garden for 1200 frames; assert ≥ 80% of decisions
    eventually populate `outcomeWindow`
  - assert ML cadence cost (`mlScoringIntervalFrames` × `mlScoringBudgetMs`)
    does not increase

Acceptance:

- trace corpus export contains outcome-window rows
- no perf regression in any composed lane
- ML behavior unchanged

Rollback: flip flag off.

Risks:

- outcome-window calculation pulls life-sim state at +60 frames: cache and
  defer; do not block the main update loop

First Codex task: implement `outcomeWindow` lazily; ship the audit; export
a sample corpus.

---

## Section 7 — Old Audit Lanes Versus New Sim-Board Acceptance

```text
keep as regression checks (still useful, NOT replaced)
├─ run-a4-spatial-truth-audit.js              : board-unit contract regression
├─ run-r2-zone-transition-audit.js            : zone identity / count regression
├─ run-b4-carry-stack-physics-audit.js        : block carry/stack regression
├─ run-r7-block-visual-audit.js               : block visual integrity
├─ run-r1-movement-stability-audit.js         : movement bounds regression
├─ run-r6-communication-audit.js              : signal/dialogue regression
├─ run-f5-f6-social-depth-audit.js            : social pair texture regression
├─ run-e4-social-ecology-audit.js             : social ecology regression
├─ run-n6-neural-social-scoring-audit.js      : ML feature contract regression
├─ run-h5-long-running-save-smoothness-audit.js : save continuity regression
├─ run-r5-battle-presentation-audit.js        : battle visual + projectile regression
├─ run-single-player-autobattle-audit.js      : battle outcome commit regression
├─ run-runtime-self-audit.js                  : warning/error budget regression
├─ run-lifesim-expression-audit.js            : life-sim family regression
├─ run-v3-sprite-parity-audit.js              : sprite asset parity regression
└─ composed bench (single-zone-122/200, block-carry-active, flower-feed-storm)

replaced by new sim-board acceptance (legacy lane retired or downgraded to
optional regression after Phase P7)
├─ doorway corridor presentation (was implicit in r2)
│  └─ replaced by run-sim-board-edge-travel-audit.js
├─ behind-wall spawn-cover overlay (was implicit in g1)
│  └─ replaced by drawSpawnCover no-op assertion in
│     run-sim-board-baseline-audit.js
├─ ornate-background visual reference (was implicit in g1)
│  └─ replaced by sim-board ground tint in run-sim-board-baseline-audit.js

new lanes added by this rebuild
├─ run-spatial-projection-unit-tests.js       : pure math sanity (P1)
├─ run-sim-board-baseline-audit.js            : sim-board mode renders without errors (P2)
├─ run-sim-board-edge-travel-audit.js         : edge-based zone travel (P3)
├─ run-sim-board-occupancy-audit.js           : block placement on board (P4)
├─ run-ability-radius-conversion-audit.js     : board-unit ability reach (P5)
├─ run-s9-save-migration-v5-audit.js          : v4 -> v5 lived-in save (P6)
└─ run-ml-trace-capture-audit.js              : trace capture for future ML (P8)

g-ladder reuse (no replacement)
├─ g1 spatial acceptance sweep                : reused for sim-board acceptance pass
├─ g2 live building behavior proof            : reused for sim-board build acceptance
├─ g3 movement naturalness acceptance         : reused for sim-board movement acceptance
├─ g4 ambient social breadth                  : unchanged (Stage B)
├─ g5 dialogue naturalness                    : unchanged (Stage B)
├─ g6 ML value proof                          : unchanged (Stage B), with trace data from P8
├─ g7 v8b full-stack migrated-save proof      : unchanged (Stage C), now covers v4 -> v5
└─ g8 outside-session closure                 : unchanged (Stage C)
```

---

## Section 8 — Feature Flags Summary

```text
sim-board mode flag
├─ key   : gameConfig.world.renderMode
├─ values: "section-scenes" | "sim-board"
├─ default before P7 : "section-scenes"
├─ default after  P7 : "sim-board"
└─ persistent localStorage key: papilionem-world-rendermode

sprite smoothing flag (P0)
├─ key   : gameConfig.performance.flags.smoothCreatureSprites
├─ default: true
└─ rollback: false restores noSmooth on creature layers

board-unit ability radii (P5)
├─ key   : gameConfig.balance.<family>.<name>RadiusUnits
└─ legacy *Px / *Radius derived from *Units * ppu — no separate flag

save schema (P6)
├─ key   : gameConfig.save.preferV5OnRead
├─ default: true
└─ false makes the loader prefer v4 fields when both present (validation aid)

ML trace capture (P8)
├─ key   : gameConfig.ml.traceCapture.outcomeWindow
├─ default: true
└─ off disables outcomeWindow population only; rest of ML untouched
```

---

## Section 9 — Risks (One-Page Summary)

```text
high-risk
├─ subjective preference for the ornate scene
│   mitigate: keep section-scenes for one cycle; player toggle persists
├─ smoothing flag adds render cost on dense scenes
│   mitigate: supersample baked wing surface; cap visible smoothed butterflies
└─ save migration silently clamps positions in degenerate v4 saves
    mitigate: log every clamp; fail audit if > 1% of entities clamped

medium-risk
├─ board-unit ability radii change reach by floating-point drift
│   mitigate: ε = 0.5 * radius buffer in recipient queries (matches existing)
├─ render-order key change reveals previously-hidden overlap bugs
│   mitigate: sim-board flag isolates change; legacy mode unaffected
└─ edge travel state machine deadlocks on partial save
    mitigate: deserialize defaults state to "normal" if exitId unknown

low-risk
├─ debug overlays read screen-px ability radius incorrectly
│   mitigate: P5 ships overlay update alongside conversion
├─ trace capture exporter produces large corpus files
│   mitigate: per-decision row is tiny; cap rows per export
└─ block art looks slightly different on sim-board ground tint
    mitigate: tints are already declared in zone renderProfile.overlayTint
```

---

## Section 10 — First Concrete Codex Task

```text
P0.first-task
├─ goal     : enable creature-layer smoothing; default-smooth bake; remove per-frame toggle in butterfly draw
├─ files    : core/renderManager.js, core/spriteManager.js, entities/butterfly.js
├─ flag     : gameConfig.performance.flags.smoothCreatureSprites = true (new)
├─ proof    : node scripts/run-v3-sprite-parity-audit.js
              + one fresh manual capture; record spriteCache hits >0
├─ accept   : visible wing texture matches source intent on 12+ butterflies
└─ rollback : flag = false reverts to noSmooth behavior
```

---

## Section 11 — Final Codex Copy-Paste Prompt

The following is the singular block to paste back into Codex. It points at
this revised document as the binding plan and starts with P0.

```text
Codex, please implement Phase P0 (Sprite Fidelity Restoration) of the
revised Papilionem visual sim-board rebuild plan.

Binding plan:
  C:\Users\fishe\Documents\projects\ephemera\docs\VISUAL-SIM-BOARD-REBUILD-PLAN-2026-04-29-CLAUDE-REVIEW.md

Highest-priority conclusions to honour during P0:
  1. The "pixelated butterfly" critique has a concrete code cause:
     - core/renderManager.js lines 117-120 set persistent noSmooth() on the
       entitiesBehind, blocks, and entities layers.
     - core/spriteManager.js createBakedSurface defaults to noSmooth().
     - entities/butterfly.js gates smoothing only when ≤ 4 butterflies are visible.
     With 12+ butterflies on screen the wing draw path is permanently
     nearest-neighbour. Source assets (1920x1080 wings, 1080x1080 body and
     antenna) are intact in assets/butterflies/.
  2. block stays pixel-art crisp: keep this.layers.blocks.noSmooth() and
     keep particles noSmooth(). Only entities and entitiesBehind become
     smooth.
  3. Phase P0 must NOT change any spatial math, save schema, or projection;
     no work outside the three files listed below.

Phase order (do NOT skip ahead):
  P0  Sprite Fidelity Restoration
  P1  Spatial Math Foundation                (boardPos + projection helpers)
  P2  Default-Off Sim-Board Render Mode      (feature-flagged)
  P3  Edge-Based Zone Travel
  P4  Building / Occupancy Unification
  P5  Garden + Battle Ability Radius Conversion
  P6  Save Migration v4 -> v5
  P7  Acceptance Harness + Bench Refresh + Promotion
  P8  Trace Capture (Future-AI Prep, optional)

P0 implementation task:
  files (only these):
    core/renderManager.js
    core/spriteManager.js
    entities/butterfly.js
  changes:
    1. core/renderManager.js (around lines 117-120 in the layer init):
       - Replace this.layers.entities.noSmooth() with .smooth().
       - Replace this.layers.entitiesBehind.noSmooth() with .smooth().
       - Keep this.layers.blocks.noSmooth() (pixel-art block intentional).
       - Keep this.layers.particles.noSmooth().
       - For the now-smoothed layers, also set
         drawingContext.imageSmoothingEnabled = true and
         drawingContext.imageSmoothingQuality = 'high'.
       - Gate the change behind
         gameConfig.performance.flags.smoothCreatureSprites (default true)
         so it can be rolled back without code.
    2. core/spriteManager.js (in createBakedSurface):
       - Flip the smooth default for body, antenna, wing, caterpillar bake
         calls. Easiest implementation: change the createBakedSurface
         signature so callers must opt OUT of smoothing. Update internal
         callers (getBakedBodySprite, getBakedBodySpriteData,
         getBakedAntennaSprite, getBakedAntennaSpriteData, getBakedWingPiece,
         getBakedWingPieceData, getBakedWingPoseData,
         getBakedCaterpillarFrame, getBakedCaterpillarFrameData,
         getBakedCocoonSprite) to use { smooth: true }. Leave
         getBakedFlowerHeadData unchanged (already smooth: true).
       - Confirm getBakedSpriteCacheTelemetry() returns non-zero when sprite
         draw path runs.
    3. entities/butterfly.js (around lines 3535-3578 and 3457-3475):
       - Remove the per-frame graphics.smooth()/noSmooth() toggle now that
         the entities layer holds the smoothing flag persistently. Keep the
         shouldUseSmoothedButterflySprites check as a no-op safety until
         P7, but stop calling it to flip layer state.
  proofs to run:
    node scripts/run-v3-sprite-parity-audit.js
    node scripts/run-runtime-self-audit.js
    one fresh manual capture (start the game, record ~60 seconds across
      two zones, save the capture under qa_logs/session_captures/)
  acceptance:
    - both audits pass
    - the new manual capture's summary.txt shows
      "spriteCache: <hits>/<misses>" with hits > 0
    - side-by-side wing close-up before/after screenshots show visible
      texture detail on butterflies in sun-court and ivy-cloister
    - no console errors, no page errors, no new warnings
    - composed benchmark single-zone-200 holds within +0.6ms of the
      post-P0 baseline on avg render
  rollback:
    set gameConfig.performance.flags.smoothCreatureSprites = false; layers
    revert to noSmooth() exactly as before.
  forbidden during P0:
    - editing any file outside the three listed above
    - changing any save schema field
    - changing any projection/spatial math
    - changing block, flower, caterpillar, or cocoon visual style
    - changing the butterflyVisualScale config value

When P0 is green and you have the proofs, post the audit reports and the
before/after wing screenshots, and stop. Wait for explicit go-ahead before
starting P1.

If any audit fails, do NOT push past it. Read the failure, name the
contradiction, fix the root cause, and rerun. Do not lower the audit
acceptance bar.

Plan reference paths used by later phases:
  Section 4.1-4.6  : projection math
  Section 4.7-4.8  : zone geometry & edge travel
  Section 4.9      : sprite fidelity (P0)
  Section 4.10-4.11: ability + battle radius conversion (P5)
  Section 4.12     : attack/projectile timeline (P5)
  Section 4.13     : save migration v4->v5 (P6)
  Section 6        : full Codex-executable phase ladder
  Section 7        : audit lanes (regression vs replaced)

End of P0 task. Stop after P0 closes.
```
