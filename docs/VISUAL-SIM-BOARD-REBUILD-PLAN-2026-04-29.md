# Visual Sim-Board Rebuild Plan

Date: 2026-04-29

## Purpose

This plan records a proposed direction change for Papilionem's visible world:
keep the live butterfly society systems, but replace the ornate painted
section-scene presentation with a clean, grid-backed sim board that is easier
to reason about, easier to test, and more honest about the game's spatial
rules.

The user observed during the latest manual capture that:

- the game appears to have reverted to the original complex map/background;
- the ornate background makes the current simulation harder to read;
- the previous "behind walls" / doorway presentation is no longer aligned with
  the desired direction;
- butterflies and other sprites, especially butterflies, appear pixelated or
  distorted rather than matching the high-resolution source art;
- blocks currently read better than the butterflies and should be treated as a
  useful visual/spatial reference;
- zone travel can be simpler and clearer if butterflies fly off-screen in the
  direction of the target zone, then enter the destination zone from the
  reciprocal edge.

This is not a request to discard the whole game. It is a request to rebuild the
world presentation and spatial surface so the existing sim has a clearer place
to live.

## Current Decision Shape

```text
╔══════════════════════════════════════════════════════════════════╗
║                    Proposed Direction Change                    ║
╠════════════════════════╦═════════════════════════════════════════╣
║ Keep                   ║ Replace / Rework                       ║
╠════════════════════════╬═════════════════════════════════════════╣
║ butterfly cognition    ║ ornate painted section backgrounds     ║
║ ML/static policy       ║ behind-wall / covered-path presentation║
║ social family names    ║ map-as-geometry assumptions            ║
║ save continuity        ║ ambiguous overlap caused by art depth  ║
║ block/support contract ║ pixelated butterfly rendering path     ║
║ zone identity/graph    ║ doorway corridor as default travel UI  ║
╚════════════════════════╩═════════════════════════════════════════╝

                           ▼

╔══════════════════════════════════════════════════════════════════╗
║                 New Default: Clean Sim Board                    ║
╠══════════════════════════════════════════════════════════════════╣
║ simple readable ground per zone                                 ║
║ canonical board units                                           ║
║ explicit x/y ground coordinates                                 ║
║ explicit support/stack height                                   ║
║ high-resolution sprite path                                     ║
║ edge-based zone travel                                          ║
║ math-first projection and render ordering                       ║
╚══════════════════════════════════════════════════════════════════╝
```

## Non-Negotiable Existing Contracts

These should be preserved unless Claude finds a specific contradiction and
recommends a named reopening:

- `docs/SPATIAL-UNIT-CONTRACT.md`
  - `1 block = 1 board unit = 1 support / stack unit`.
  - in the new 3D-backed board, this should be treated as `1 block = 1 3D
    world unit` unless Claude identifies a named contradiction.
  - Claude may recommend changing the rendered pixel size / visual scale of
    blocks if the projection math requires it, but logical block size should
    remain the canonical unit.
- `docs/CURRENT-SPATIAL-TRUTH.md`
  - live runtime is grounded pseudo-3D, not free volumetric flight.
  - render presentation reads spatial truth; it does not own it.
- `docs/ML-IMPLEMENTATION-CONTRACT.md`
  - first ML runtime is local/static policy-backed scoring.
  - ML scores choices and never owns durable state.
- `docs/SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md`
  - battle is currently single-player autobattle.
  - battle owns battle-local truth and commits results back to garden truth.
  - existing contract says the battle arena is top-down and must not inherit the
    angled garden plane unless a new contradiction is explicitly accepted.
- `docs/GENETICS-STAT-CONTRACT.md`
  - battle stats are derived from genetics/upbringing/current-state truth.
  - do not invent a parallel battle-only stat system for the 3D work.
- `docs/SOCIAL-FAMILY-LOCK.md`
  - do not rename or invent new drive, emotion, memory, or relationship
    families as part of this visual rebuild.
- save continuity is sacred.
  - long-running saves must migrate or adapt.
  - do not wipe saves to simplify the board rebuild.

## Why This Is A Valid Reopening

Earlier spatial phases were treated as frozen because the existing board,
doorway, footprint, placement, and interaction contracts were locked. The new
observation is a named contradiction against the presentation/world surface:

```text
old result
├─ mechanics can function on the ornate scene
├─ audits can pass on the ornate scene
└─ but the visible world no longer supports the desired sim-board direction

new contradiction
├─ background art implies geometry the sim does not own
├─ wall/occlusion presentation hides spatial truth instead of clarifying it
├─ butterfly sprites appear degraded against the current scene
├─ overlap symptoms are harder to diagnose because art depth competes with logic
└─ zone travel can be clearer as edge-based migration
```

This justifies reopening the visual/world-surface lane. It does not, by itself,
justify replacing the social sim, ML contract, save schema, or all physics.

## Related Active Plans And Reviews To Include

Claude should not review this rebuild in isolation. The current visual concern
intersects with existing success, emergence, life-sim, ML, and completion plans.

Claude should use these as context:

- `docs/GAME-SUCCESS-CRITERIA.md`
  - defines success as mechanical truth + visual legibility + behavioral
    impact + persistence + runtime safety.
  - defines the social target as believable butterfly society, not perfect
    human mimicry.
- `docs/GOAL-ALIGNMENT-REVIEW-PACKET.md`
  - says the game is no longer mainly blocked by core architecture failure, but
    still needs acceptance proof, social/dialect breadth, autonomous-behavior
    richness, and outside/full-stack closure.
- `docs/GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md`
  - gives the current g1..g8 goal-alignment ladder.
- `docs/CURRENT-STATE-GAP-ASSESSMENT.md`
  - records current gaps and should be checked for stale or newly reopened
    visual/spatial concerns.
- `docs/LIFESIM-EXPRESSION-AUDIT.md`
  - says the major life-sim families are live, stored, updated,
    behavior-driving, and at least partly surfaced.
- `docs/NEURAL-SOCIAL-SCORING-AUDIT.md`
  - says ML/neural scoring reads richer social truth but does not own durable
    emotions, memories, relationships, or society state.
- `docs/COGNITION-ML-CONTRACT.md` and `docs/ML-IMPLEMENTATION-CONTRACT.md`
  - lock the current model/scoring boundary and should be used to distinguish
    current static-policy AI from possible later richer model-backed AI.
- `docs/SOCIAL-FAMILY-LOCK.md`
  - locks the canonical social/emotion/relationship vocabulary.
- `docs/DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md`
  - locks dialogue residue, relationship impact, social repair, and memory
    boundaries.
- `docs/COMMUNICATION-LANGUAGE-CONTRACT.md`
  - locks communication ownership and language/signal boundaries.
- `docs/CLOSURE-AUDIT-MATRIX.md`
  - summarizes closure status and should be checked before reopening finished
    lanes.

## Current Evidence To Preserve

Latest manual capture folder:

```text
qa_logs/session_captures/2026-04-29T01-39-49-271Z-playtest-manual-capture-1777426640221
```

Observed summary from the capture:

- duration was about 2.5 minutes, not the full 20-minute target;
- no runtime errors were reported;
- runtime pressure reached `critical`;
- lag category was `render-dominant`;
- average render time was materially higher than average update time;
- the scene began in `focused-garden ivy-cloister`;
- the scene ended in `focused-garden sun-court`.

Asset inventory notes:

- large ornate backgrounds exist in `assets/`, including:
  - `assets/base-land-map.png`
  - `assets/world-section-open-base.png`
  - `assets/world-section-pool-base.png`
- high-resolution butterfly assets exist in `assets/butterflies/`, including:
  - `*-wing-full.png`
  - `male/*-wing-full-M.png`
  - `female/*-wing-full-F.png`
  - `papilionem-butterfly-body.png`
  - `papilionem-butterfly-antenna.png`

The sprite problem is therefore likely in loading, scaling, cache, smoothing,
pixel-density, or draw-size logic rather than simply missing source assets.

## Current State Versus Desired Direction

This section is intended to keep Claude oriented. The current game is not
empty or failed; many systems are live and audit-proved. The issue is that the
current player-visible experience is no longer pointing cleanly toward the
newer goal: a simple, readable 3D-backed world that supports believable
artificial life.

```text
╔══════════════════════════════════════════════════════════════════╗
║                 Current State → Desired Direction               ║
╠══════════════════════╦══════════════════════╦════════════════════╣
║ Surface              ║ Current State        ║ Desired Direction  ║
╠══════════════════════╬══════════════════════╬════════════════════╣
║ world presentation   ║ ornate old map       ║ clean sim-board    ║
║ spatial truth        ║ pseudo-3D patched    ║ block-unit 3D math ║
║ zone travel          ║ doorway/corridor     ║ edge flight travel ║
║ sprites              ║ butterfly degraded   ║ high-res faithful  ║
║ blocks               ║ comparatively good   ║ canonical unit     ║
║ building             ║ mechanically live    ║ socially useful    ║
║ abilities            ║ screen-radius based  ║ board/height-aware ║
║ battle attacks       ║ presentation traces  ║ 3D-backed math     ║
║ social behavior      ║ real but acceptance  ║ living society     ║
║ ML / AI              ║ static scoring live  ║ richer AI path     ║
║ player/cursor        ║ input/control layer  ║ future social actor║
╚══════════════════════╩══════════════════════╩════════════════════╝
```

### What Is Working Today

Claude should understand that these are not blank slates:

- the harness correctness work has been improved;
- composed benchmarks exist and should remain the runtime proof owner;
- spatial, building, movement, battle, social, communication, life-sim, ML, and
  save systems all have live implementations;
- blocks currently look better than the butterflies and are the best reference
  for the new unit scale;
- high-resolution butterfly source assets exist;
- single-player autobattle exists and commits results back to garden truth;
- the life-sim stack has drives, emotions, memories, relationships, routines,
  social ecology, genetics, upbringing, lifecycle, and derived cognition;
- ML/static policy scoring exists and reads social/battle features without
  owning durable state.

### What Is Not In The Desired Direction

The current build can pass many audits and still feel wrong for the new goal.
Claude should treat these as the key mismatches:

- the ornate background implies geometry the simulation does not fully own;
- behind-wall/doorway/corridor presentation is now more complicated than the
  desired clean zone-travel model;
- the old map makes depth/overlap symptoms harder to diagnose;
- butterfly sprites appear pixelated/distorted in the latest user capture;
- current spatial math still contains screen-space and render-size assumptions
  that need to become explicit board/3D unit math;
- ability radii, social proximity, battle projectiles, and effects are still
  heavily screen-distance oriented;
- building is mechanically correct, but not yet clearly a social/cooperative
  need;
- social/emotional systems exist, but ordinary free play may still feel more
  rule-like than genuinely emergent;
- ML is currently a local/static scoring layer, not yet the richer artificial
  intelligence direction the user ultimately wants;
- the player/cursor is not yet a named social actor in the society.

### From-Here-To-There Summary

Claude should frame the plan as a migration:

```text
do not rebuild everything
├─ preserve durable sim truth
├─ preserve save continuity
├─ preserve battle result ownership
├─ preserve social family vocabulary
└─ preserve ML owner boundary

do rebuild the world surface
├─ clean generated board
├─ block-as-one-unit scale
├─ board/height-aware abilities
├─ edge-based zone travel
├─ high-res sprites
├─ readable building and stacking
└─ battle attack/projectile math

do deepen believability after the board is stable
├─ cooperation pressure
├─ consequential conversation
├─ long free-play social proof
├─ trace capture for future ML
├─ ML-on vs ML-off comparisons
└─ future player/cursor social identity
```

### Current Acceptance Reality

Existing docs such as `CURRENT-STATE-GAP-ASSESSMENT.md` and
`GOAL-ALIGNMENT-REVIEW-PACKET.md` say many foundations are mechanically or
mostly aligned. Claude should not misread that as "the current experience is
already the intended future."

The newer user direction changes the acceptance bar:

```text
old closure pressure
└─ prove the existing ornate/pseudo-3D presentation is not broken

new closure pressure
└─ build a cleaner 3D-backed sim-board that makes artificial life easier to
   read, test, extend, and believe
```

Therefore, Claude should identify which old acceptance lanes remain useful as
regression checks and which should be replaced by new sim-board acceptance
lanes.

## Target World Model

The recommended first implementation is grid-backed 2.5D/pseudo-3D, not a full
free-flight volumetric engine.

```text
╔══════════════════════════════════════════════════════════════════╗
║                   Target Spatial Data Model                     ║
╠══════════════════════════════════════════════════════════════════╣
║ zoneId                                                          ║
║   ├─ board coordinate: u, v                                     ║
║   ├─ support height: h                                          ║
║   ├─ footprint: width/depth in board units                      ║
║   ├─ occupancy: cells/bands occupied                            ║
║   ├─ projection: board -> screen                                ║
║   └─ inverse projection: screen -> board for pointer/tools      ║
╚══════════════════════════════════════════════════════════════════╝
```

Recommended coordinate meanings:

- `u`: horizontal board axis.
- `v`: depth board axis.
- `h`: discrete support/stack height in canonical block units.
- `zoneId`: logical ecology zone and physical board surface owner.
- screen `x/y`: presentation only, derived from projection.

The exact projection math needs deeper review. The goal is not necessarily
literal Three.js. The goal is a mathematically coherent space where:

- blocks stack according to the locked support unit;
- butterflies, blocks, flowers, eggs, cocoons, and tools share one placement
  language;
- render order follows position and height, not background artwork;
- zone boundaries are declared in board coordinates;
- off-screen migration edges are derived from the zone graph;
- the player can understand where things are and why they overlap or do not.

## Required Math Review For Claude

Claude should go extremely in-depth on the math behind the new zone model.
Specifically, review and propose precise formulas or data contracts for:

### 0. Canonical Block Unit And Scale

The block is the measuring stick for the new environment.

```text
canonical scale
├─ 1 block footprint
├─ 1 board unit
├─ 1 3D world unit
├─ 1 support/stack step
└─ base reference for entity footprints, zones, ability radii, and placement
```

Claude should plan from this assumption:

```text
logicalBlockWidthUnits  = 1
logicalBlockDepthUnits  = 1
logicalBlockHeightUnits = 1
```

Claude may recommend changing the **rendered size** of blocks in the game if
the projection/camera/zone math needs a different visual scale. For example,
the current block art may need to draw larger, smaller, wider, taller, or with
different projected height to make stacking and overlap read correctly.

Important distinction:

```text
logical block size  -> stable unit of world math
rendered block size -> adjustable presentation derived from projection
```

Claude should specify:

- pixels per block unit at the default camera;
- projected width/depth/height of one block;
- how block size changes with zoom or camera if camera changes are allowed;
- how butterfly body radius maps relative to one block;
- how flower, egg, cocoon, caterpillar, and ability radii map relative to one
  block;
- how many block units wide/deep each zone should be;
- whether any current block sprite should be rescaled or replaced by a generated
  block visual for the new board.

### 1. Board Coordinate System

- Whether to use orthographic board coordinates, isometric projection, or a
  simplified oblique projection.
- How to define board extents per zone in canonical units.
- How to map old saved screen positions into new board coordinates.
- How to clamp entities to legal zone bounds.
- How to keep pointer placement and debug overlays invertible.

### 2. Projection

Claude should specify exact candidate formulas for:

```text
boardToScreen(u, v, h, zoneCamera) -> { x, y }
screenToBoard(x, y, zoneCamera) -> { u, v }
```

The review should compare at least:

- top-down/orthographic board;
- shallow isometric board;
- oblique 2.5D board.

For each, evaluate:

- sprite readability;
- overlap clarity;
- block stacking clarity;
- computational cost;
- implementation risk in the existing p5/canvas code;
- compatibility with current block art;
- compatibility with future richer 3D presentation.

### 3. Render Ordering

Claude should propose a stable sort key such as:

```text
sortKey = zoneLayerBase
        + v * depthScale
        + u * tieBreakScale
        + h * heightScale
        + entityTypeBias
```

The exact formula should be reviewed. The key requirement is that butterflies,
blocks, flowers, and carried objects do not visually fight each other.

### 4. Occupancy And Building

Claude should specify the math and data shape for:

- block footprint occupancy;
- stack support tests;
- valid placement cells;
- overhang rules, if any;
- carrying anchors;
- butterfly body clearance;
- shelter/interior use if retained later;
- collision/avoidance volumes;
- how to prevent block overlap;
- how to make the visible block stack match the logical support stack.
- whether current block render dimensions should change to match the new
  projected unit scale.

This is the most important section. The new board must preserve and strengthen
building. It cannot make building worse.

### 5. Zone Geometry

Claude should propose a clean zone data model:

```text
zone
├─ id
├─ boardWidthUnits
├─ boardDepthUnits
├─ groundStyle
├─ exits
│  ├─ direction
│  ├─ targetZoneId
│  ├─ edgeSegment
│  └─ arrivalSegment
└─ spawnRegions
```

The user specifically wants migration to work by butterflies flying off-screen
in the intended direction. Claude should review how to derive this from the
existing zone graph and current direction concepts such as northwest,
southwest, southeast, and related open-land directions.

### 6. Entity Migration

Claude should define:

- departure vector;
- off-screen target;
- reciprocal arrival edge;
- staging duration;
- save-safe migration state;
- interruption rules;
- how to render migrating butterflies without doorway/corridor occlusion.

### 7. Sprite Fidelity

Claude should audit the likely causes of pixelated/distorted butterflies:

- wrong asset selected;
- source image downsampled too early;
- p5/canvas pixel density mismatch;
- `imageSmoothingEnabled` / `noSmooth` / `smooth` interactions;
- render cache resolution;
- draw dimensions not matching source aspect ratio;
- CSS canvas scaling;
- device-pixel-ratio cap;
- composite or sprite baking path.

Claude should recommend the exact proof needed to verify that high-resolution
butterfly assets render correctly in the new board.

## Proposed Implementation Phases

### Phase 0: Review, Decision, And Guardrails

Goal: confirm the direction before mutating runtime code.

Tasks:

- have Claude review this plan deeply;
- decide whether the new default should be `sim-board` or a default-off mode
  first;
- name the exact frozen audit lane being reopened;
- preserve current capture evidence;
- decide whether to update active boards now or after prototype proof.

Acceptance:

- reviewed plan exists;
- implementation order is agreed;
- no existing save/data contracts are casually invalidated.

### Phase 1: Butterfly Sprite Fidelity Restoration

Goal: restore high-resolution butterflies before judging any new map.

Tasks:

- trace butterfly asset loading and draw path;
- confirm whether `assets/butterflies/*-wing-full*.png` assets are used;
- check p5/canvas smoothing and pixel-density behavior;
- check cache/baking paths;
- fix aspect ratio and scaling if needed;
- create a before/after screenshot proof.

Acceptance:

- butterfly sprites visibly match high-resolution source intent;
- no major render regression;
- proof image/capture is saved.

### Phase 2: Default-Off Clean Board Prototype

Goal: create a simple sim-board mode without deleting the old scene.

Tasks:

- add a render mode flag, for example:
  - `legacy-scene`
  - `sim-board`
- render a clean single-color or lightly shaded green ground;
- draw optional grid/depth guides in debug mode only;
- place butterflies, blocks, and flowers through the new projection path;
- keep old backgrounds available until parity is proven.

Acceptance:

- user can toggle/test the clean board;
- blocks still look good;
- butterflies look sharper;
- no behind-wall/covered-path behavior is used in sim-board mode.

### Phase 3: New Zone Data Model And Edge Travel

Goal: replace doorway/corridor travel presentation with edge-based travel.

Tasks:

- define board extents for each zone;
- define exit edges and reciprocal arrival edges;
- map current adjacent zone ids to direction vectors;
- make butterflies fly off-screen toward the target zone;
- make butterflies enter the destination from the matching reciprocal edge;
- preserve migration state in a save-safe way.

Acceptance:

- zone migration is readable without walls;
- no butterfly snaps abruptly between old and new coordinates;
- existing zone ecology counts and ownership still work.

### Phase 4: Building And Occupancy Unification On The New Board

Goal: make building mathematically honest on the new board.

Tasks:

- express block placement in board units;
- express support/stack height as discrete `h`;
- unify render position with support position;
- ensure carried blocks use the same projection and support rules;
- verify stacked blocks do not visually/logically overlap incorrectly;
- preserve current block strengths because blocks already read well.

Acceptance:

- block placement feels clearer than the old scene;
- logical support matches visible stack;
- carry/place/build proofs pass on the new board.

### Phase 5: Entity Footprints And Interaction Surfaces

Goal: move all relevant entities onto the same spatial language.

Tasks:

- declare board footprints for butterflies, blocks, flowers, eggs, cocoons,
  caterpillars, and player tools;
- ensure proximity queries use current board/screen truth safely;
- maintain one owner per durable state;
- update debug overlays to show board coordinates and occupancy.

Acceptance:

- no entity family has hidden placement math;
- overlap/clearance symptoms are diagnosable through debug overlay;
- old render-size heuristics are reduced or explicitly transitional.

### Phase 6: Acceptance Harness And Bench Refresh

Goal: prove the new board with captures and benchmarks.

Tasks:

- capture side-by-side legacy vs sim-board visual proofs;
- rerun composed benchmark on the fixed harness;
- add a sim-board scenario to benchmark if appropriate;
- verify sprite fidelity, block placement, zone travel, and long-running save
  migration.

Acceptance:

- benchmark baseline is not compared against broken-harness numbers;
- new board does not hide page/console errors;
- visual proof supports user approval.

### Phase 7: Promote Or Retire

Goal: decide whether the clean board becomes the default.

Tasks:

- if successful, promote `sim-board` to default;
- keep legacy scene behind a temporary flag if useful;
- retire or archive large ornate backgrounds only after save/capture parity;
- update active plan registry and relevant visual/spatial boards.

Acceptance:

- default experience matches the intended new sim direction;
- old backgrounds no longer block progress;
- active docs accurately describe the runtime.

## Risks

- A full rewrite would risk losing the working social/cognition systems.
- A purely visual skin would not fix overlap or building truth.
- A full volumetric engine may be slower and more complex than needed.
- If sprite fidelity is not fixed first, the new board may be judged unfairly.
- If save migration is postponed too long, old and new coordinate systems may
  drift.
- If projection math is vague, overlap bugs will return under a new name.

## Additional Gameplay Considerations For Claude

Claude should review not only whether the new board is mathematically clean,
but whether it preserves how the current game actually plays.

### Current Gameplay Shape To Preserve

```text
╔══════════════════════════════════════════════════════════════════╗
║                    Current Play Surfaces                        ║
╠══════════════════════╦═══════════════════════════════════════════╣
║ butterflies          ║ roam, feed, socialize, migrate, build     ║
║ player               ║ observes, places/spawns/carries/debugs    ║
║ blocks               ║ carried, stacked, placed, support homes   ║
║ flowers/resources    ║ attract, feed, shape movement pressure    ║
║ zones                ║ ecology ownership + travel identity       ║
║ save/load            ║ long-running continuity                   ║
║ debug/harness        ║ acceptance, benchmark, visual proof       ║
╚══════════════════════╩═══════════════════════════════════════════╝
```

The board rebuild must preserve these loops:

- butterflies visibly choose places, not random screen pixels;
- social proximity remains meaningful after coordinate migration;
- home zones, preferred zones, scout targets, and migration pressure still
  produce readable movement;
- building remains a core player-visible behavior;
- carried blocks stay visually attached to the carrying butterfly;
- flowers/resources remain spatially useful;
- player tools still map pointer position to legal world position;
- debug overlays remain truthful enough to diagnose behavior;
- long-running saves continue rather than restarting the society.

### Life-Sim Semantics At Risk During A 3D-Backed Change

The new spatial model must not quietly erase place-based meaning. Claude should
review how the following durable or derived meanings survive the migration:

- current zone identity;
- home zone and home-zone strength;
- zone affinities and visit counts;
- zone dwell time;
- social memory tied to places or neighbors;
- routine destinations;
- feeding/resource memory;
- danger/safety memory;
- shelter/home/building use;
- rest/sleep location if applicable;
- pair and group proximity;
- crowding, avoidance, comfort, and rivalry pressure.

Important rule:

```text
spatial migration may change coordinates
but it must not reset biography
```

### Fully 3D-Backed System Questions

If Claude recommends moving beyond pseudo-3D into a stronger 3D-backed model,
it should answer these before implementation:

1. What is the authoritative coordinate?
   - `{ zoneId, u, v, h }`
   - `{ zoneId, x, y, z }`
   - or another shape?
2. Is height continuous, discrete, or hybrid?
3. Do butterflies have true altitude, or only visual lift/height context?
4. Can butterflies fly over blocks, or are blocks ground-plane obstacles?
5. Does one block remain exactly one logical 3D world unit in width, depth, and
   stack height?
6. Should the visible block sprite size change to better communicate that unit?
7. Are flowers/resources flat on the ground, raised, or footprint-only?
8. Does building require full 3D occupancy, or only stack columns?
9. How does pathfinding work around stacked objects?
10. How are collisions resolved when one entity is above another?
11. How does the player select a board cell or height with a 2D pointer?
12. How does the save schema distinguish old screen positions from new board
    positions?

Claude should be explicit if the answer is "do not implement full volumetric
3D yet." That is a valid recommendation if the math and gameplay do not need
it.

### Camera And Presentation Questions

The new board should not accidentally make the game harder to read. Claude
should evaluate:

- fixed camera vs adjustable camera;
- top-down vs shallow isometric vs oblique projection;
- whether sprites should remain 2D billboards;
- whether blocks should stay as 2D sprites, become projected tiles, or become
  simple generated 3D-looking pieces;
- whether shadows should communicate height;
- whether grid lines should be debug-only or subtly visible;
- whether zones should have different ground colors/textures or share one
  neutral ground;
- whether high-resolution butterfly sprites need different scale at different
  zoom levels;
- whether UI/click targets remain ergonomic.

### Pathfinding, Steering, And Proximity

Claude should review how the new space affects:

- random roaming target selection;
- migration target selection;
- butterfly-to-butterfly proximity;
- butterfly-to-flower/resource proximity;
- collision/separation;
- crowding and density;
- placement validation;
- block pickup/drop;
- debug scatter/spawn tools;
- benchmark harness scenarios.

The previous harness findings showed that stale position/grid state can make a
benchmark lie. The new board should make position invalidation and spatial
queries harder to misuse, not easier.

### Save Migration Requirements

Claude should propose a save-safe migration path:

```text
legacy save
├─ screen x/y
├─ currentZoneId
├─ gridPos / movement target
├─ carried/placed block state
└─ social/life-sim continuity

        ▼

new save
├─ zoneId
├─ board u/v/h
├─ projection-derived screen x/y
├─ migrated movement target
├─ migrated block/support state
└─ unchanged biography/social truth
```

The migration must define:

- fallback if a legacy point maps outside the new zone;
- fallback if a block stack maps to an illegal support state;
- whether old `gridPos` is discarded, translated, or debug-retained;
- how to preserve current movement intent;
- how to avoid teleporting butterflies into a visually confusing cluster.

### Performance And Benchmark Requirements

The clean board should reduce render confusion and ideally reduce render cost.
Claude should consider:

- replacing large background images with generated ground;
- avoiding expensive full-scene composites;
- sprite cache resolution and invalidation;
- high-DPI canvas scaling;
- draw-call count;
- spatial-query cost;
- benchmark comparability after the harness fixes;
- memory impact of keeping legacy and sim-board modes side by side.

## Battle And Projectile 3D Considerations For Claude

The visual rebuild should not only cover the garden. Battle will likely need the
same spatial math, especially if attacks, projectiles, ability traces, and
battle movement run through a 3D-backed arena.

Important current repo finding:

```text
live battle text/code found
├─ single-player autobattle contract
├─ top-down arena contract
├─ battle arena rect/slot geometry
├─ butterfly participant assignment slots
├─ ability-specific projectile styles
├─ visible action / reaction / projectile effects
└─ result commit back into garden truth

not found in current text/code search
└─ a separate attack-math contract beyond current autobattle/projectile code
```

If detailed attack/projectile notes exist outside the searched repo documents,
Claude should ask for them or identify where they live before finalizing battle
3D math. If they are not landed yet, Claude should derive the first math review
from the current autobattle, ability, projectile, and presentation contracts.

### Current Battle Shape To Preserve

From `docs/SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md`:

- battle launches from the top-right battle mode;
- battle is single-player autobattle first;
- the system builds teams from eligible living butterflies;
- the fight visibly resolves in the arena;
- stats, health, damage, abilities, movement, projectiles, and emitted effects
  should be readable;
- battle results commit back into garden truth;
- online/multiplayer battle remains deferred.

Current battle presentation is intentionally minimal and field-first:

- no large side roster slabs covering the field;
- compact status rail preferred;
- small in-field HP bars carry live readability;
- battle log supports the field, but is not the main proof of combat.

### Current Battle Geometry And Motion Surfaces

Current code surfaces Claude should inspect:

- `core/config.js`
  - `PAPILIONEM_BATTLE_ARENA`
  - `gameConfig.battle.arena`
  - `gameConfig.battle.motion`
- `systems/battleSystem.js`
  - `createArenaAssignments`
  - `createSlotGrid`
  - `registerBattleVisualAction`
  - `getBattleActionPresentation`
  - `chooseAutoAction`
- `core/renderManager.js`
  - `getBattleParticipantPose`
  - `drawBattleProjectiles`
  - `drawBattleAbilityActivation`
  - `drawBattleReactionEffect`
  - `drawBattleEntities`
- `scripts/run-r5-battle-presentation-audit.js`
- `scripts/run-single-player-autobattle-audit.js`

Current battle motion parameters include:

```text
attackAdvancePx
attackDurationMs
hitRecoilPx
hitReactionDurationMs
rallyAdvancePx
rallyDurationMs
rallyLiftPx
guardBobPx
guardDurationMs
retreatAdvancePx
retreatDurationMs
projectileDurationMs
idleBobPx
releaseDurationMs
roamRadiusX
roamRadiusY
engagementDriftPx
```

These are screen/presentation-space values today. Claude should decide how they
translate into board/arena units if battle becomes 3D-backed.

### Current Projectile Styles

Current ability projectile/effect styles include:

```text
default strike        -> strike-bolt
rally                 -> support-pulse
welcome rally         -> warm-orb
teacher rally/strike  -> lesson-glyph
shimmer rally/strike  -> shimmer-orb / shimmer-veil
sparkle attack/rally  -> petal-burst / petal-ribbon / bloom-ring
speedzone attack      -> violet-surge
cascade attack        -> cascade-shard / cascade-wave
golden attack/guard   -> golden-star / golden-flare / golden-guard
```

Claude should decide whether these are:

- visual-only effects following interpolated source/target positions;
- physical projectiles with hit volumes;
- hybrid traces that are visually ballistic but logically resolved by
  autobattle action timing.

### Battle 3D Math Questions

Claude should go deeply into battle-space math and answer:

1. Should battle use the same `{ zoneId, u, v, h }` board model as the garden,
   or a separate `{ arenaId, lane, row, col, h }` model?
2. If battle remains top-down, what does "3D-backed" mean for it?
3. If battle becomes oblique/isometric, does that violate the existing
   top-down arena contract, and is that contradiction worth reopening?
4. How should participant slots map to board/arena coordinates?
5. Should projectile paths be straight lines, arcs, splines, or ballistic
   curves?
6. What formula maps projectile progress `t in [0,1]` to position?
7. Should projectile height be:
   - constant;
   - parabolic;
   - ability-specific;
   - target-height-aware?
8. How should hit detection work if projectile visuals are 3D but battle
   outcomes are autobattle-timed?
9. Should rally/healing projectiles use different curves than attack
   projectiles?
10. How should attack startup, travel, impact, recoil, and recovery be
    represented spatially?
11. How should projectiles interact with stacked blocks or obstacles if battle
    ever uses environmental cover?
12. How should render ordering handle participants, shadows, projectiles,
    particles, HP bars, and focus markers?
13. How should accessibility `battleMotionSimplify` affect 3D paths?
14. How should the battle audit detect broken projectile math?

Candidate projectile formulas Claude should evaluate:

```text
linear trace
P(t) = lerp(A, B, t)

parabolic visual arc
P(t) = lerp(A, B, t) + up * arcHeight * sin(pi * t)

cubic Bezier
P(t) = (1-t)^3 A
     + 3(1-t)^2 t C1
     + 3(1-t)t^2 C2
     + t^3 B

board-space ballistic-ish trace
u(t) = lerp(A.u, B.u, t)
v(t) = lerp(A.v, B.v, t)
h(t) = lerp(A.h, B.h, t) + arcHeight * sin(pi * t)
screen(t) = boardToScreen(u(t), v(t), h(t))
```

Claude should recommend one first implementation path and explain why.

### Battle Ownership Boundaries

The battle rebuild must preserve:

```text
battleSystem
├─ owns battle snapshot truth
├─ owns participants, HP, pressure, action events
├─ owns result resolution and commit
└─ may own battle-local arena coordinates

renderManager
├─ consumes battle presentation data
├─ draws arena, participants, projectiles, effects, HP bars
└─ must not mutate durable battle truth

physicsSystem
├─ may provide reusable collision/projectile helpers
└─ must not own battle outcome truth unless explicitly delegated

statProfileSystem / genetics
└─ derive battle stats; do not become projectile/position owners

ML
└─ may score battle posture/choice; never owns projectile truth or HP truth
```

### Battle Acceptance Tests Claude Should Add

Claude should include tests/proofs for:

- current single-player autobattle still launches;
- battle arena remains visually clean;
- participants spawn/release/roam/read correctly;
- projectiles follow mathematically valid paths;
- projectile styles remain ability-specific;
- attack/rally/guard/retreat remain readable;
- HP bars remain attached to the correct participant;
- result commit still updates garden truth;
- battle audits fail on missing projectile styles or broken projectile paths;
- accessibility motion simplification still works;
- battle render/update budgets remain within acceptable bounds.

## Garden And Battle Ability 3D Considerations For Claude

The new spatial model must preserve butterfly abilities in both garden and
battle. Many current abilities and signals rely on screen-space radius checks,
ground-plane rings, aura ranges, projectile/effect radii, or nearby-entity
queries. Those cannot be left as vague pixel distances if the world becomes
board/height-backed.

Current ability mapping from `docs/PAPILIONEM-GUIDEBOOK.md`:

```text
friendly   -> Warm Welcome    -> healing + panic support
cautious   -> Delicate Pink   -> sparkle trail
energetic  -> Electric Violet -> speed zone / state boost
skittish   -> Nervous Jewel   -> trust cascade
wise       -> Ancient Scholar -> teaching aura
mystic     -> Twilight Dancer -> sleep comfort aura
golden     -> legendary       -> special crown state
hybrid     -> inherited       -> one chosen parent ability
```

Current guidance already says radius-based support abilities should render as
colored rings sized to their actual gameplay radius. Claude should preserve
that truth, but translate it into the new board/3D model.

### Current Ability Surfaces To Inspect

Claude should inspect at least:

- `docs/PAPILIONEM-GUIDEBOOK.md`
  - archetype and ability mapping.
- `docs/GENETICS-STAT-CONTRACT.md`
  - inherited ability origin rules.
- `docs/SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md`
  - battle ability presentation rules.
- `systems/specialEffects.js`
  - `getAbilityVisualDefaults`, `addAbilityVisualEffect`, `drawAbilityRing`,
    `drawGroundPlaneEllipse`.
- `systems/communicationSystem.js`
  - `getSignalConfig` and signal radius recipient selection.
- `systems/statusSystem.js`
  - aura/status reconciliation and durable status bundles.
- `systems/battleSystem.js`
  - battle ability mapping, projectile style, `abilityRadius`.
- `core/renderManager.js`
  - battle ability activation, reaction, and projectile rendering.
- `systems/lifeSimSystem.js`
  - nearby entity counts and special-ability social effects.
- `systems/mlInferenceSystem.js`
  - special ability features used for scoring.
- `systems/saveSystem.js`
  - persisted `specialAbility` and post-load aura reconciliation.

### Ability Radius Conversion Questions

Claude should explicitly define how each radius-like concept converts from
screen pixels to board/3D space:

```text
old
├─ source x/y
├─ pixel radius
├─ 2D distance check
└─ ground-plane ellipse visual

new
├─ source board coordinate: u/v/h
├─ effect radius in board units
├─ optional height reach / vertical tolerance
├─ board-space or 3D distance check
├─ projected ground footprint visual
└─ projected height/volume cue if needed
```

Claude should answer:

1. Are aura radii measured in board units, screen pixels, or world meters?
2. Is distance calculated as 2D ground distance, 3D Euclidean distance, or a
   hybrid such as ground distance plus height tolerance?
3. How do elevated butterflies interact with ground auras?
4. Can a stack, shelter, wall, or height band block an aura?
5. Should support/healing/teaching auras reach through vertical height?
6. Should attack/projectile hit volumes be spheres, cylinders, cones, capsules,
   or ground-footprint circles?
7. How are ability visuals projected so the ring still matches gameplay range?
8. How do ability radii scale under zoom or camera changes?
9. How are ability radii serialized or migrated from old saves?
10. How do debug overlays prove the exact gameplay radius?

Candidate distance formulas Claude should evaluate:

```text
ground radius
d = sqrt((u2 - u1)^2 + (v2 - v1)^2)
affected = d <= radiusUnits

3D radius
d = sqrt((u2 - u1)^2 + (v2 - v1)^2 + ((h2 - h1) * heightWeight)^2)
affected = d <= radiusUnits

cylindrical aura
groundD = sqrt((u2 - u1)^2 + (v2 - v1)^2)
heightD = abs(h2 - h1)
affected = groundD <= radiusUnits && heightD <= heightReachUnits

cone / directional attack
dir = normalize(target - source)
toCandidate = candidate - source
affected = length(toCandidate) <= range
        && dot(normalize(toCandidate), dir) >= cos(halfAngle)
```

Claude should recommend defaults by ability family.

### Garden Ability Families To Preserve

Claude should plan conversion for:

- Warm Welcome:
  - healing/panic support aura.
  - likely radius/nearby recipient logic.
- Delicate Pink:
  - sparkle trail.
  - trail as a spatial surface, not just decoration.
- Electric Violet:
  - speed zone / state boost.
  - radius and duration must match board-space movement.
- Nervous Jewel:
  - trust cascade.
  - should affect nearby listeners through correct spatial query.
- Ancient Scholar:
  - teaching aura.
  - current social/teaching radius must remain truthful.
- Twilight Dancer:
  - sleep comfort/calm aura.
  - must interact correctly with rest/sleep locations and height.
- Golden:
  - crown/special state.
  - should keep special visibility without inventing new hidden mechanics.
- Hybrid:
  - inherited ability.
  - ability behavior follows inherited ability; origin remains inspectable.

Claude should not invent new ability names or rewrite ability identity unless it
finds a named contradiction.

### Garden Ability Ownership

Claude should preserve one owner per truth:

```text
statProfileSystem / genetics
└─ ability identity and inherited origin

communicationSystem
└─ signal emission, recipient selection, dialogue residue

statusSystem
└─ durable statuses, auras, cooldowns, charges, immunities

specialEffects
└─ visuals only, except for reading owner-provided radius metadata

lifeSimSystem
└─ durable life/social/emotion/memory consequences

mlInferenceSystem
└─ may use special ability as a feature; does not own ability truth

renderManager
└─ projects ability visuals; does not decide who is affected
```

### Battle Ability Conversion

Battle abilities currently use visible effects and projectile styles. Claude
should define how battle ability radius/range works in a 3D-backed arena:

- strike/projectile range;
- rally/support range;
- guard/veil radius;
- area-of-effect impact radius;
- healing/support impact radius;
- projectile visual radius vs hit volume;
- participant body radius;
- height of projectile origin and impact;
- whether attacks can pass over/around obstacles if battle later adds cover.

Claude should connect ability visuals to battle logic:

```text
ability action
├─ battleSystem chooses action and target
├─ battleSystem records action/projectile metadata
├─ math layer resolves path/range/hit-volume presentation
├─ renderManager draws projected effect
└─ battleSystem remains owner of HP/pressure/result truth
```

### Ability Acceptance Tests Claude Should Add

Claude should add tests/proofs for:

- ability identity and inherited origin survive save/load;
- garden radius effects use board-space distance, not stale screen pixels;
- debug overlay can show the gameplay radius and projected visual radius;
- Warm Welcome support reaches intended nearby targets;
- Electric Violet speed zone affects movement in the new board scale;
- Nervous Jewel trust cascade reaches the correct nearby butterflies;
- Ancient Scholar teaching aura reaches the correct listeners;
- Twilight Dancer sleep comfort aura respects rest/sleep spatial truth;
- Delicate Pink trail remains visually and mechanically meaningful;
- battle ability projectiles keep ability-specific visual styles;
- battle ability radius/range/hit volume matches the displayed effect;
- accessibility/reduced-motion mode still preserves ability readability.

## Emergent Behavior And Neural/Life-Sim Review For Claude

The user has raised a separate but related concern:

```text
current concern
├─ butterflies may feel like a complex set of if/then rules
├─ feelings/relationships may not yet read as emergent enough
├─ neural network / ML may not be doing enough visible behavior work
└─ the new 3D world should support, not flatten, social emergence
```

## AI Ambition And Honest Boundary

The user's intended direction is stronger than "cute simulated butterflies."
The goal is to build butterfly agents that function as real artificial
intelligence inside the game world:

```text
target AI agent
├─ persistent identity
├─ durable memory
├─ emotion/feeling-like internal state
├─ relationships and social preferences
├─ signal interpretation
├─ adaptation from past outcomes
├─ action choice from competing motives
├─ learned routines and place preferences
├─ personality/history-shaped reactions
├─ socially meaningful communication
└─ future behavior changed by past experience
```

Important honesty boundary:

```text
we can build functional artificial emotions and social cognition
we cannot prove literal subjective experience or consciousness
```

So the implementation target should be:

```text
real AI for a game simulation
├─ autonomous agents
├─ persistent affective state
├─ memory-shaped behavior
├─ relationship-shaped decisions
├─ social interpretation
├─ model/scoring-assisted action choice
├─ transparent owner boundaries
└─ falsifiable behavioral proof

not enough
├─ decorative emotion labels
├─ one-off if/then reactions
├─ random dialogue variety with no consequence
├─ ML that only changes debug labels
└─ feelings that never alter later behavior
```

Claude should review whether the current architecture is sufficient for that
goal and what staged path would make it more real. It should respect the locked
first ML runtime, but it may recommend a later AI evolution path after the new
3D board is stable, such as:

- richer feature builders;
- temporal memory windows;
- learned action-value or preference models;
- stronger policy comparison against heuristic fallback;
- agent-level personality embeddings if justified;
- scenario-based evaluation for social continuity;
- long-horizon trace review for repeated relationships;
- model-assisted dialogue selection that reads durable state without owning it.

Claude should not claim the butterflies "feel" in the literal conscious sense.
It should define what emotional intelligence means operationally in this game:

```text
emotion is real in-game when it is:
├─ stored or derived by the correct owner
├─ updated by events
├─ visible enough to inspect or infer
├─ remembered or decayed over time
├─ able to influence future choices
├─ able to affect relationships/routines
└─ preserved through save/load when durable
```

## Cooperation, Bonding, And Non-Scripted Social AI

The user wants the butterflies to feel like living creatures with feelings,
thoughts, personalities, and social capabilities. The environment should create
real reasons for butterflies to communicate, bond, help, avoid, repair, teach,
and coordinate. Conversation should not be only decorative feed text.

Core design principle:

```text
social behavior becomes real when the world creates interdependence
```

The new 3D-backed board should support social AI by making place, proximity,
resources, building, safety, rest, teaching, and conflict matter.

### Cooperation Pressure Model

Claude should plan ways to make cooperation emerge from existing locked
families instead of adding unrelated new drives:

```text
locked drives/families to use
├─ selfMaintenance
├─ safetyAvoidance
├─ resourceControl
├─ socialConnection
├─ caregiving
├─ exploration
├─ statusExpression
└─ rest
```

Possible cooperation pressures:

- building structures that are easier, faster, safer, or only possible when
  multiple butterflies contribute;
- carrying or placing heavier/higher objects requiring assistance or teaching;
- shelter/rest benefits that improve when trusted butterflies share or maintain
  a space;
- resource scarcity or uneven resource distribution that encourages sharing,
  warning, guiding, rivalry, or negotiation;
- danger/pressure events where warnings and trust affect who responds;
- caregiving events where injured, exhausted, young, or distressed butterflies
  need support;
- teaching events where skilled/wise butterflies improve another butterfly's
  future interpretation, routines, or behavior;
- exploration/scouting where one butterfly discovers a better zone/resource and
  communicates it to others;
- status/reputation effects where helping, abandoning, teaching, warning,
  hoarding, or repairing changes future social access.

Claude should review which of these are already supported by current systems
and which require new implementation.

### Conversation As Action, Not Flavor

Claude should plan for conversations/signals to become consequential actions:

```text
conversation loop
├─ speaker has motive
├─ speaker chooses target(s)
├─ message/signal is emitted
├─ recipients interpret through relationship + emotion + memory
├─ durable residue may be created
├─ relationships/emotions/routines may update
├─ future action scores change
└─ player can later observe changed behavior
```

This means Claude should evaluate:

- whether current dialogue motive families are broad enough;
- whether talk changes later behavior strongly enough;
- whether repeated pair conversations create distinct relationship texture;
- whether group conversations can shift social ecology;
- whether warnings, teaching, repair, courtship, complaint, praise, play, and
  companionship all have visible downstream effects;
- whether conversation target selection is too rule-like;
- whether conversation should become more spatially grounded on the new board.

### Machine Learning Path Toward Less Scripted Behavior

The current locked first ML runtime is local/static policy scoring. Claude
should respect that, but it should also propose a staged path toward more real
machine-learning-driven behavior.

Recommended staged framing:

```text
stage 1: deterministic sim truth
├─ durable emotions
├─ memories
├─ relationships
├─ routines
└─ social/ecology state

stage 2: trace capture
├─ record situations
├─ record chosen actions
├─ record alternatives
├─ record outcome quality
└─ record later social consequences

stage 3: supervised / preference model
├─ train from good/bad traces
├─ score actions, targets, signals, risk, repair, help, avoid
└─ keep heuristic fallback

stage 4: long-horizon evaluation
├─ compare ML-on vs ML-off
├─ measure relationship continuity
├─ measure repeated pair behavior
├─ measure cooperation outcomes
└─ measure player-visible believability

stage 5: richer model-assisted expression
├─ better dialogue selection/generation
├─ memory-aware phrasing
├─ cursor/player-as-speaker interpretation
└─ still no ML ownership of durable truth
```

Claude should identify what trace fields would be needed now so future ML is
trainable instead of improvised later.

### Future Cursor / Player Conversation Idea

Far-future goal:

```text
player/cursor as social actor
├─ the moving cursor is recognized as an entity in the world
├─ the player may assign a personal display name
├─ butterflies know that the cursor/player's name is that chosen name
├─ player text can be interpreted as a signal from that entity
├─ butterflies respond based on relationship, memory, emotion, and context
├─ their replies appear in feed/chat
├─ their future behavior can change because of the exchange
└─ the system remembers that the cursor/player said it
```

Claude should treat this as future-facing, not a first implementation task.
However, the new architecture should avoid blocking it. The current rebuild
should preserve or create seams for:

- player/cursor identity;
- player-chosen display name;
- chat/feed attribution using that player name;
- trusted/dangerous cursor memory;
- player-originated signal records;
- targetable dialogue recipients;
- interpretation quality;
- durable conversation residue;
- LLM/model-assisted phrasing later;
- strict separation between generated text and durable truth ownership.

Future player-name rule:

```text
player profile
├─ displayName
├─ cursorEntityId
├─ relationship edges from butterflies to player/cursor
├─ remembered player-originated signals
└─ chat/feed speaker label uses displayName
```

The name should be durable and inspectable later, but this must remain deferred
until the core 3D board, ability radii, cooperation loops, and social proof are
stable.

### Cooperation And AI Acceptance Proofs

Claude should add acceptance tests/proofs for:

- two or more butterflies coordinating around a shared build task;
- one butterfly teaching another and that lesson affecting later behavior;
- a warning causing a trusted recipient to react differently than a rival;
- a repair conversation changing later avoidance/approach behavior;
- a caregiving/help event changing relationship and reputation;
- repeated pair interactions becoming distinguishable from first meetings;
- a group rhythm forming around a place/resource/shelter on the new board;
- ML-on vs ML-off showing better target choice or social follow-through;
- feed/chat lines mapping to durable state changes, not template-only output.

Claude should review this honestly. The goal is not to claim the current system
is either fake or perfect. The current documentation says:

```text
live today
├─ drives, emotions, memories, social edges, routines, communication,
│  social ecology, genetics, upbringing, lifecycle, and derived cognition exist
├─ ML/neural scoring reads social truth and scores choices
├─ ML does not own durable feelings or memories
└─ social believability is still not fully acceptance-closed
```

The key question for Claude:

```text
does the current system create enough durable, observable, behavior-changing
feedback loops to feel like an emergent butterfly society once the spatial
surface is fixed?
```

Claude should evaluate whether the critique is valid in these narrower forms:

- behavior may still be too visibly rule-gated even if the state model is real;
- social/emotional truth may exist internally but not surface clearly enough;
- relationships may change labels without enough later behavior consequence;
- ML/scoring may improve action selection but not yet feel neural to the
  player;
- proximity and place memory may be weakened by the current spatial confusion;
- the new 3D board may unlock more believable routines if place, height,
  shelter, crowding, and path choice become clearer.

Claude should not use this as permission to invent new drive/emotion/memory
families. It should use the locked families and ask whether their **coupling,
visibility, persistence, and downstream behavioral impact** are strong enough.

### Emergence Review Questions

Claude should answer:

1. Which current behaviors are mostly direct rules?
2. Which current behaviors are genuine feedback loops across state, memory,
   relationships, routines, and environment?
3. Which loops would become stronger or weaker in a 3D-backed board?
4. Which behavior surfaces need spatial context to feel believable?
5. Does the current ML/static policy materially improve behavior compared with
   heuristic fallback?
6. Are there acceptance tests that compare ML-on vs ML-off behavior in long
   free play?
7. Are social edges and memories sufficiently durable after save/load?
8. Are group rhythms, roosting, warning, teaching, courtship, avoidance,
   rivalry, repair, caregiving, and rest visibly affecting later choices?
9. Which player-visible proofs would convince us that the butterflies are not
   just replaying template branches?
10. What should be implemented first after the 3D board so social emergence
    becomes more visible?

### Emergence Acceptance Tests Claude Should Consider

Claude should add or revise tests/proofs for:

- long free-play society capture on the clean board;
- repeated encounter where the same pair changes behavior after memory/residue;
- group crowding/comfort behavior under different zone layouts;
- teaching aura causing later routine or interpretation changes;
- trust cascade creating durable social/memory consequences;
- courtship territory or pair preference surviving travel and save/load;
- ML-on vs ML-off comparison for target choice, signal choice, risk posture,
  and battle posture;
- debug panel proof that visible behavior maps to life-sim truth, not UI labels;
- player-facing proof that relationship/emotion changes alter later movement,
  conversation, rest, care, avoidance, or building.

Important target:

```text
believable butterfly society
├─ human-legible emotions
├─ memory and relationship consequence
├─ distinct personalities
├─ place-shaped routines
├─ social ecology and group rhythm
└─ readable behavior changes over time

not required
└─ indistinguishable human simulation
```

### Acceptance Tests Claude Should Consider

At minimum, the implementation plan should include proofs for:

- high-resolution butterfly sprite fidelity;
- one zone with clean board rendering;
- all four zones with declared board extents;
- off-screen migration and reciprocal arrival;
- block carry/place/stack on the new board;
- garden ability radius conversion;
- battle ability/projectile radius conversion;
- long-running save migration;
- social proximity still causing believable interactions;
- benchmark run with no page/console errors;
- screenshot/capture proof at normal and dense populations.

## Recommended Next Action

Give this document to Claude for review before implementation. Ask Claude to:

1. validate or revise the phase order;
2. go deeply into the math of the new board/projection/occupancy model;
3. identify specific existing files likely to be touched;
4. call out any conflicts with the frozen contracts;
5. return a revised implementation plan and a single copy-paste prompt for
   Codex to begin the first implementation phase.

Claude's revised plan must be directly executable by Codex. It should not stop
at architecture critique.

Required implementation-planning detail:

```text
Codex execution plan
├─ exact phase order
├─ goal of each phase
├─ files/modules owned by each phase
├─ files/modules that must not be touched in each phase
├─ data contracts to add or change
├─ migration rules
├─ feature flags / fallback modes
├─ proof scripts or manual captures to run
├─ acceptance criteria
├─ rollback / hold conditions
├─ likely risks
└─ first concrete implementation task
```

Claude should break the work into small, bisectable steps. Each step should be
small enough that Codex can implement it, run proof, report results, and then
continue.

Claude should explicitly answer:

- What should Codex do first?
- What should Codex avoid doing first?
- Which changes must land before the old backgrounds can be retired?
- Which changes should be default-off until proven?
- Which tests/probes/captures prove each phase?
- Which older audits remain useful regression checks?
- Which old audits should be replaced by new sim-board acceptance checks?
- What exact prompt should the user paste back into Codex when Claude is done?

## Suggested Files For Claude To Review

Claude should read this document first, then at minimum:

- `docs/CURRENT-SPATIAL-TRUTH.md`
- `docs/SPATIAL-UNIT-CONTRACT.md`
- `docs/LATER-3D-PHYSICS-IMPLEMENTATION-PLAN.md`
- `docs/GAME-SUCCESS-CRITERIA.md`
- `docs/GOAL-ALIGNMENT-REVIEW-PACKET.md`
- `docs/GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md`
- `docs/CURRENT-STATE-GAP-ASSESSMENT.md`
- `docs/CLOSURE-AUDIT-MATRIX.md`
- `docs/LIFESIM-EXPRESSION-AUDIT.md`
- `docs/NEURAL-SOCIAL-SCORING-AUDIT.md`
- `docs/SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md`
- `docs/GENETICS-STAT-CONTRACT.md`
- `docs/DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md`
- `docs/COMMUNICATION-LANGUAGE-CONTRACT.md`
- `docs/ML-IMPLEMENTATION-CONTRACT.md`
- `docs/SOCIAL-FAMILY-LOCK.md`
- `docs/COMPOSED-BENCHMARK-HARNESS-WORKFLOW.md`
- `docs/COMPOSED-BENCHMARK-BASELINE-2026-04-28-POST-P0.md`
- `core/config.js`
- `core/gameCore.js`
- `core/renderManager.js`
- `core/gridManager.js`
- `core/butterflyStore.js`
- `entities/butterfly.js`
- `entities/block.js`
- `systems/structureSystem.js`
- `systems/physicsSystem.js`
- `systems/zoneSystem.js`
- `systems/battleSystem.js`
- `systems/specialEffects.js`
- `systems/communicationSystem.js`
- `systems/statusSystem.js`
- `systems/lifeSimSystem.js`
- `systems/mlInferenceSystem.js`
- `systems/saveSystem.js`
- `sketch.js`
- `scripts/run-r5-battle-presentation-audit.js`
- `scripts/run-single-player-autobattle-audit.js`
- `assets/butterflies/`
- `qa_logs/session_captures/2026-04-29T01-39-49-271Z-playtest-manual-capture-1777426640221/`

## Claude Review Request

Claude should treat this as a plan review, not an implementation request. The
main deliverable should be a revised plan with math, file-level guidance, and
an exact step-by-step Codex implementation plan.

Claude should be especially strict about:

- projection formulas;
- inverse projection feasibility;
- board unit definitions;
- canonical block-as-one-3D-unit scale;
- whether rendered block sizing should change under the new projection;
- stack/support math;
- battle arena coordinate math;
- projectile path math;
- attack/projectile battle extension points;
- garden and battle ability radius conversion;
- aura/status/signal spatial ownership;
- emergent behavior vs direct rule-gating;
- ML-on vs ML-off social/battle behavior proof;
- life-sim coupling, visibility, persistence, and downstream consequence;
- staged path from current static-policy AI toward richer functional AI;
- operational definition of artificial feelings/emotions in-game;
- cooperation pressure and bonding incentives;
- conversation as a consequential action rather than flavor text;
- trace-capture path toward future learned social behavior;
- future cursor/player-as-social-actor chat seam;
- render ordering;
- save migration;
- sprite fidelity proof;
- whether p5/canvas is sufficient or whether a later Three.js renderer should
  be considered;
- avoiding unnecessary replacement of working life-sim/ML systems.

Claude must finish with:

```text
1. path to Claude's revised review/implementation document
2. highest-priority conclusions
3. exact phase order
4. first Codex implementation task
5. one singular copy-paste prompt for the user to give Codex
```
