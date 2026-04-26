# Papilionem Active Spatial Unification Board

## Purpose

This board captures the exact implementation order for fixing the deeper
spatial inconsistencies surfaced by recent playtesting:

```text
╔════════════════════════════ Spatial Problem Shape ═══════════════════════════╗
║ visible symptom            │ likely underlying seam                         ║
╠════════════════════════════╪═════════════════════════════════════════════════╣
║ portal zooming             │ doorway route is not driven by one shared board│
║ doorway/corridor mismatch  │ roam bounds, anchors, and cover path split     │
║ awkward block placement    │ block size is not locked to one spatial unit   │
║ incomplete 3D feel         │ footprints / occupancy / bounds are not unified║
║ lower-area underuse        │ legal movement space is narrower than intended ║
╚════════════════════════════╧═════════════════════════════════════════════════╝
```

This is not a free-flight volumetric 3D promotion plan.
It is a grounded pseudo-3D unification plan:

```text
target
├─ one board boundary owner
├─ one spatial unit contract
├─ one doorway/corridor truth
├─ one occupancy/footprint model
└─ one save-migration path when geometry changes
```

Use this with:

- [CURRENT-SPATIAL-TRUTH.md](./CURRENT-SPATIAL-TRUTH.md)
- [SPATIAL-UNIT-CONTRACT.md](./SPATIAL-UNIT-CONTRACT.md)
- [SPATIAL-BOUNDARY-EXPANSION-AUDIT.md](./SPATIAL-BOUNDARY-EXPANSION-AUDIT.md)
- [SPATIAL-UNIFICATION-ROADMAP.md](./SPATIAL-UNIFICATION-ROADMAP.md)
- [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md)
- [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md)
- [CROSS-TRACK-ARBITRATION.md](./CROSS-TRACK-ARBITRATION.md)

## Non-Negotiables

```text
always preserve
├─ no phase may remove a core simulation system to simplify spatial logic
├─ no phase may fake 3D with inconsistent per-entity shortcuts
├─ one block must become one canonical spatial unit for placement/support truth
├─ butterflies, flowers, eggs, cocoons, caterpillars, and blocks must read from the same board contract
├─ bounds expansion must be geometry-led, not a blind loosen-the-clamp tweak
├─ save migration must preserve long-running butterfly identity / relationships / lineage
└─ the live runtime remains grounded pseudo-3D, not volumetric sandbox 3D
```

## Current Diagnosis

```text
current stack
├─ s0 owner / seam ledger                    -> written in `CURRENT-SPATIAL-TRUTH.md`
├─ s1 spatial unit contract                  -> written in `SPATIAL-UNIT-CONTRACT.md`
├─ roam polygon / placement region           -> shared and expanded to the intended board shoulders
├─ doorway anchors / cover anchors           -> corridor-owned and board-aligned after `s3`
├─ 18x18 iso debug grid                      -> explicitly debug-only after `s1`
├─ block render size / stack spacing         -> contract-locked, but runtime heuristics still transitional
├─ occupancy bands                           -> semantic, not yet the sole physical contract
└─ zone travel route                         -> corridor-owned and distance-aware after `s3`
```

## Status Key

```text
live
|- phase landed and current docs/proof agree

active
|- current planning / implementation phase

queued
|- next in exact order

gated
`- cannot close honestly until prerequisite proof exists
```

## Phase Ladder

| Phase | Status | Goal | Primary owners | Honest gate |
| --- | --- | --- | --- | --- |
| `s0 spatial truth audit + baseline` | `live` | inventory every live owner of bounds, units, placement, occupancy, and route geometry before changing them, including file-ownership conflicts logged in `CROSS-TRACK-ARBITRATION.md` | `docs/CURRENT-SPATIAL-TRUTH.md`, `core/config.js`, `core/gameCore.js`, `systems/physicsSystem.js`, `systems/structureSystem.js`, `scripts/` | closed through the owner ledger, seam ledger, and later-audit checklist now written into `CURRENT-SPATIAL-TRUTH.md` |
| `s1 canonical spatial unit contract` | `live` | lock `1 block = 1 board unit = 1 support/stack unit`, define how screen/iso/occupancy units relate, and keep the `18x18` iso grid as debug-only after `s1` | `core/config.js`, `systems/structureSystem.js`, `systems/physicsSystem.js`, `docs/` | closed through `SPATIAL-UNIT-CONTRACT.md`; the unit contract is explicit and the `18x18` grid is no longer ambiguous |
| `s2 board boundary expansion contract` | `live` | expand the movable/placement board to the intended wall borders and lower play area without breaking clamps | `core/config.js`, `core/gameCore.js`, `gridManager`, `docs/` | closed through `SPATIAL-BOUNDARY-EXPANSION-AUDIT.md` plus the green `r1`, `r2`, and `a4` proof lanes on the widened board |
| `s3 doorway corridor alignment` | `live` | rebuild doorway mouths, cover corridors, and warp staging from the expanded board geometry | `core/config.js`, `core/gameCore.js`, `core/renderManager.js` | closed through `DOORWAY-CORRIDOR-ALIGNMENT-AUDIT.md`, with corridor-owned approach/lineup/cover/settle anchors and green `r2`, `a6`, `a4` proof lanes |
| `s4 entity footprint unification` | `live` | define canonical footprints/clearances for butterflies, flowers, blocks, eggs, cocoons, caterpillars | `systems/physicsSystem.js`, `systems/structureSystem.js`, `entities/`, `core/gameCore.js` | closed through `ENTITY-FOOTPRINT-UNIFICATION-AUDIT.md`; the family footprint registry now owns radii/clearance truth across structure, physics, and the remaining gameCore fallbacks |
| `s5 block placement + support unification` | `live` | make block scatter, placement, support, and stack logic honor the canonical unit grid | `systems/structureSystem.js`, `systems/physicsSystem.js`, `core/gameCore.js`, `entities/block.js` | closed through `BLOCK-PLACEMENT-SUPPORT-UNIFICATION-AUDIT.md`; openings, columns, scatter spacing, safe-drop fallback, and block lift now read from one declared block unit |
| `s6 shared interaction-space reconciliation` | `live` | align movement, placement, shelter, carry, flowers, eggs, cocoons, and chrysalis/larva interactions to the same board truth | `core/gameCore.js`, `systems/physicsSystem.js`, `systems/structureSystem.js`, `entities/`, `systems/sleepSystem.js` | closed through `SHARED-INTERACTION-SPACE-RECONCILIATION-AUDIT.md`; butterfly sampling, flower placement/relocation, pollen planting, and caterpillar travel now share the widened interaction-space contract |
| `s7 save migration (joint with runtime v7 / social n8, via SAVE-SCHEMA-REGISTRY)` | `live` | migrate old saves into the new board/unit model without wiping long-running social/lineage state | `systems/saveSystem.js`, `core/gameCore.js`, `systems/objectSystem.js`, `scripts/` | closed through `SPATIAL-SAVE-MIGRATION-AUDIT.md`; stale refresh revisions now rewrite into the widened-board contract without forcing a fresh world |
| `s8 audits + soak + proof freeze` | `live` | prove the new spatial contract under normal play, route transitions, structure building, and long-running saves | `scripts/`, `qa_screenshots/`, `docs/` | travel, placement, structure, and save lanes are green and the board freezes honestly on the lived-in save |

## Exact Order

```text
s0
 │
 ▼
s1
 │
 ▼
s2
 │
 ▼
s3
 │
 ▼
s4
 │
 ▼
s5
 │
 ▼
s6
 │
 ▼
s7
 │
 ▼
s8
```

## Why This Order

```text
do not do this
expand bounds first
  └─▶ then discover block/support units are inconsistent

do this instead
audit owners
  └─▶ lock unit contract
       └─▶ expand board
            └─▶ rebuild doorway routes
                 └─▶ unify blocks and footprints
```

## Current Focus

```text
current focus
└─ spatial board freeze
   ├─ current proof  -> `SPATIAL-SAVE-MIGRATION-AUDIT.md`
   ├─ board lock     -> lived-in saves now re-seat into the widened board without wiping sacred long-running state
   ├─ closure proof  -> `r2`, `b4`, `r7`, `a4`, and `h5` are green on the lived-in save
   ├─ runtime self   -> known non-spatial warn only; no longer a blocker for the spatial freeze
   └─ carry forward  -> hold geometry, units, occupancy, and corridor truth frozen unless a later migrated-save proof surfaces a real contradiction
```

## Relationship To Current Runtime Work

```text
visual-first runtime board
├─ owns smoothness / memory / UI / rendering optimization
└─ remains active

spatial unification board
├─ owns board geometry / units / occupancy / doorway truth
└─ is now in real implementation order, not review-only holding
```

This board exists so the spatial work can correct the underlying model once,
instead of continuing to absorb one-off route or placement patches forever.
