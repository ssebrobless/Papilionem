# Block Placement + Support Unification Audit

## Purpose

This is the stable closure note for `s5 block placement + support unification`.

```text
before
block support / openings / scatter / fallback placement
  ├─ used the same broad footprint family
  └─ still kept a few local "close enough" block-size heuristics

after
one canonical block unit
  ├─ opening width + opening-role threshold
  ├─ occupancy-column radius
  ├─ scatter spacing + doorway avoidance
  ├─ connected-placement offsets
  ├─ ground safe-drop radii
  └─ visual stack lift
```

## What Landed

Primary runtime owners:
- `systems/structureSystem.js`
- `core/gameCore.js`
- `entities/block.js`

Concrete changes:

```text
structure owner
├─ declared `getCanonicalBlockUnit()`
├─ moved opening / inset / entry / column math onto that unit
├─ moved support alignment + adjacency clearance onto that unit
└─ moved safe-drop search radii onto that unit

world owner
├─ moved ambient block scatter padding / doorway avoidance onto that unit
├─ moved connected-placement offsets onto that unit
├─ moved ground fallback distances onto that unit
└─ moved block-nudge distances onto that unit

entity owner
└─ moved block visual lift onto the canonical unit step
```

## Spatial Truth Closed In `s5`

```text
`s4` solved
└─ which family footprint each entity uses

`s5` solves
└─ whether block geometry still quietly falls back to approximate render-size math
```

The important closure is:

```text
1 block
├─ still = 1 board unit
├─ still = 1 support / stack unit
└─ now also = the unit used by
   ├─ openings
   ├─ support columns
   ├─ scatter spacing
   ├─ safe-drop fallback
   └─ stack lift
```

## Proof

Required `s5` proof lanes:
- `m5 structure audit` -> `pass`
- `b4 carry/stack physics audit` -> `pass`
- `r7 block visual audit` -> `pass`
- `r2 zone transition audit` -> `pass`

Context / spillover checks:
- `r1 movement stability audit` -> `pass`
- `a4 spatial truth audit` -> `pass`

Artifacts:
- `qa_screenshots/m5_structure_audit/2026-04-22T19-55-17-590Z/report.json`
- `qa_screenshots/b4_carry_stack_physics_audit/2026-04-22T19-55-17-601Z/report.json`
- `qa_screenshots/r7_block_visual_audit/2026-04-22T19-55-17-604Z/report.json`
- `qa_screenshots/r2_zone_transition_audit/2026-04-22T19-55-17-616Z/report.json`
- `qa_screenshots/r1_movement_stability_audit/2026-04-22T19-55-56-729Z/report.json`
- `qa_screenshots/a4_spatial_truth_audit/2026-04-22T19-55-56-756Z/report.json`

## Honest Boundary

```text
closed now
└─ blocks no longer measure support/opening/placement from scattered local size rules

not closed yet
└─ every non-block entity interaction on the expanded board
```

That remaining work is `s6`, not more `s5` tuning.

## Next Move

```text
next
└─ s6 shared interaction-space reconciliation
   ├─ flowers / eggs / cocoons / caterpillars
   ├─ shelter interactions on the widened board
   └─ cross-entity assumptions that still predate the unified board
```
