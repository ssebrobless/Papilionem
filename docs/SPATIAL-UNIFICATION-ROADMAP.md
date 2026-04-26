# Spatial Unification Roadmap

## Intent

The current runtime is close enough to expose the right problems:

```text
we no longer have
└─ completely broken spatial ownership

we do still have
├─ mismatched board bounds
├─ mismatched doorway geometry
├─ mismatched block/unit semantics
└─ mismatched entity footprints
```

## Status Update

- `s7` is now closed through [SPATIAL-SAVE-MIGRATION-AUDIT.md](./SPATIAL-SAVE-MIGRATION-AUDIT.md).
- `s8` is now frozen live after the lived-in-save proof stack turned green.

This roadmap turns that into a concrete implementation sequence.

## Current Status

```text
spatial track
├─ s0 owner + seam audit     -> live
├─ s1 unit contract          -> live
├─ s2 board expansion        -> live
├─ s3 corridor alignment     -> live
├─ s4 footprint unification  -> live
├─ s5 placement/support      -> live
├─ s6 shared interaction     -> live
├─ s7 save migration         -> live
└─ s8                        -> live
```

## Current Seams

```text
╔════════════════════════════ Current Spatial Seams ═══════════════════════════╗
║ seam                                │ live evidence                          ║
╠═════════════════════════════════════╪═════════════════════════════════════════╣
║ board boundary owner                │ `PAPILIONEM_LAND_MAP.roamPolygon` +    ║
║                                     │ `PAPILIONEM_SECTION_PLACEMENT_REGION`  ║
║ doorway route geometry              │ `doorways.left/right.{path,cover,spawn}`║
║ movement / placement clamp owner    │ `gameCore.clampPlacementPointInZone()` ║
║ block render size                   │ `entities.block.renderWidth/height`    ║
║ iso/debug conversion size           │ `grid.cellSize`, debug tile math       ║
║ block support / stack semantics     │ `structureSystem` occupancy columns    ║
║ dynamic spatial diagnostics         │ `physicsSystem` occupancy/verticality  ║
║ zone travel behavior                │ `gameCore` staged travel phases        ║
╚═════════════════════════════════════╧═════════════════════════════════════════╝
```

### Current inconsistencies to resolve

```text
1. board shape
   roam polygon, placement region, and doorway mouths are related
   but not derived from one canonical board contract

2. unit shape
   block render size, stack spacing, and iso/debug grid are close
   but not explicitly locked to one "1 block = 1 unit" model

3. entity shape
   butterflies, flowers, eggs, cocoons, caterpillars, and blocks
   do not all advertise one shared footprint/clearance model

4. route shape
   portal travel is compensating around geometry mismatches
   instead of inheriting from a corridor topology
```

## Target Model

```text
╔════════════════════════════ Target Spatial Stack ════════════════════════════╗
║ board contract                     │ one garden board polygon + subregions   ║
║ unit contract                      │ one block = one canonical board unit    ║
║ footprint contract                 │ every entity type declares width/clear. ║
║ occupancy contract                 │ columns/bands/support derive from unit  ║
║ route contract                     │ doorway mouths + cover corridors on board║
║ save contract                      │ old saves normalize into new geometry   ║
╚════════════════════════════════════╧══════════════════════════════════════════╝
```

## Phase Details

### `s0 spatial truth audit + baseline`

Goal:
- inventory every live spatial owner
- record every current bound/unit mismatch
- define the exact before-state before geometry changes

Delivered:
- owner map for `bounds`, `units`, `footprints`, `occupancy`, `routes`
- seam ledger for every conflicting size/spacing assumption
- audit checklist for later proof scripts
- file-ownership conflicts resolved and tied back to [CROSS-TRACK-ARBITRATION.md](./CROSS-TRACK-ARBITRATION.md)

Closure:
- one written map of current spatial truth now exists in [CURRENT-SPATIAL-TRUTH.md](./CURRENT-SPATIAL-TRUTH.md)

### `s1 canonical spatial unit contract`

Goal:
- define the canonical board unit
- define canonical block dimensions in that unit
- define how iso/debug conversion maps onto it

Stable doc:
- [SPATIAL-UNIT-CONTRACT.md](./SPATIAL-UNIT-CONTRACT.md)

Locked rule:

```text
1 block
   = 1 board unit
   = 1 support / stack unit
   = base footprint reference for occupancy columns
```

After `s1`:
- the `18x18` iso grid is debug-only
- render width/height stay presentation-only
- later phases must retire render-size-derived spatial heuristics

### `s2 board boundary expansion contract`

Goal:
- expand movable area to intended wall-start borders
- intentionally include the lower play area where appropriate
- keep one shared board for movement + placement + ecology

Concrete work:
- redraw the canonical board polygon
- derive placement region from it instead of hand-tuning separately
- derive doorway/corridor subregions from the same geometry
- review zone-sector layouts that currently assume the smaller board
- run a mandatory entity-footprint sweep so no entity family silently assumes the old boundary

Risk:
- blind bounds expansion will amplify awkward block/flower placement if done before `s1`

Stable doc:
- [SPATIAL-BOUNDARY-EXPANSION-AUDIT.md](./SPATIAL-BOUNDARY-EXPANSION-AUDIT.md)

### `s3 doorway corridor alignment`

Goal:
- make doorways start where the wall openings visually start
- make cover paths disappear fully behind scenery
- make route staging follow corridor topology instead of compensating heuristics

Concrete work:
- rebuild `path`, `cover`, and `spawn` anchors from the new board
- define explicit corridor lanes
- keep regular speed until corridor commitment
- verify cover depth hides the body correctly

Stable doc:
- [DOORWAY-CORRIDOR-ALIGNMENT-AUDIT.md](./DOORWAY-CORRIDOR-ALIGNMENT-AUDIT.md)

### `s4 entity footprint unification`

Goal:
- give every entity family one declared footprint
- stop using scattered ad hoc radii

Stable doc:
- [ENTITY-FOOTPRINT-UNIFICATION-AUDIT.md](./ENTITY-FOOTPRINT-UNIFICATION-AUDIT.md)

Entity families:
- butterflies
- flowers
- blocks
- eggs
- cocoons / chrysalis
- caterpillars

### `s5 block placement + support unification`

Goal:
- make block scatter honor the board unit
- make stack/support use the same unit
- make openings/flowers/block adjacency behave predictably

Concrete work:
- replace remaining placement heuristics that assume approximate block size
- align occupancy-column spacing to the canonical unit
- ensure opening width and body fit are measured in the same unit
- keep flower relocation logic consistent with the same occupancy truth

Stable doc:
- [BLOCK-PLACEMENT-SUPPORT-UNIFICATION-AUDIT.md](./BLOCK-PLACEMENT-SUPPORT-UNIFICATION-AUDIT.md)

### `s6 shared interaction-space reconciliation`

Goal:
- make all entity families live on the same board assumptions
- remove "this object still thinks the old board exists" bugs

Examples:
- cocoon/egg placement relative to structures
- flower spawn distribution in expanded lower area
- butterfly shelter interactions
- carried-block anchors versus support columns

Stable doc:
- [SHARED-INTERACTION-SPACE-RECONCILIATION-AUDIT.md](./SHARED-INTERACTION-SPACE-RECONCILIATION-AUDIT.md)

### `s7 save migration (joint with runtime v7 / social n8, via SAVE-SCHEMA-REGISTRY)`

Goal:
- preserve long-running social/genetic state
- normalize old geometry/unit data into the new board

May rebuild:
- ambient block scatter
- cached placement columns
- derived route anchors
- other cheap geometry-derived data

Stable doc:
- [SPATIAL-SAVE-MIGRATION-AUDIT.md](./SPATIAL-SAVE-MIGRATION-AUDIT.md)

### `s8 audits + soak + proof freeze`

Goal:
- prove travel reads correctly
- prove block placement/support reads correctly
- prove expanded board remains stable
- freeze docs once the new contract is honest

Proof lanes to require:
- zone transition / dispersal
- spatial truth
- carry / stack / block visual
- runtime self audit
- long-running save reload
- extended live play on the real save

Closure read:
- `r2`, `b4`, `r7`, `a4`, and `h5` are green on the lived-in save
- the remaining `runtime self` warning is non-spatial and does not contradict the frozen board/unit contract
- spatial truth is now frozen unless a later migrated-save proof surfaces a real contradiction

## Exact Order

```text
s0 audit current owners and mismatches
▼
s1 lock one-unit contract
▼
s2 expand board bounds from that contract
▼
s3 rebuild doorway/corridor geometry
▼
s4 unify entity footprints
▼
s5 unify block placement/support
▼
s6 reconcile all entity interactions to the new board
▼
s7 migrate existing saves into the new geometry
▼
s8 audit, soak, freeze
```

## Current Next Move

```text
next
└─ spatial track is now frozen live through `s8`
   ├─ because lived-in saves now reload into the widened-board contract without a fresh-world wipe
   ├─ and the latest lived-in rerun turned `a4` plus `h5` green instead of surfacing a new spatial contradiction
   └─ carry forward only if a later migrated-save proof surfaces a real board/unit/occupancy inconsistency
```
