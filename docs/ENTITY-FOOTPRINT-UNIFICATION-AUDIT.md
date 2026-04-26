# Entity Footprint Unification Audit

## Purpose

This is the stable `s4` closure note for the spatial-unification track.

It closes the footprint seam left open after the shared board and corridor
geometry were already live:

```text
old footprint truth
├─ structure queries used some derived metrics
├─ physics used some derived metrics
├─ gameCore fallbacks still used local size/render heuristics
└─ flower/block conflict rules could disagree with placement spacing

new footprint truth
├─ one declared family registry in `core/config.js`
├─ structure owns entity metrics from that registry
├─ physics consumes those metrics directly
├─ gameCore fallbacks defer to the same metrics
└─ flower/block relocation and placement spacing now honor the same radius truth
```

## Runtime Closure

```text
s4 landed shape
├─ butterflies, flowers, eggs, chrysalis, caterpillars, and blocks now advertise one family footprint
├─ carry anchors no longer derive side/trail spacing from sprite dimensions
├─ block placement spacing now uses declared block width instead of raw render width
├─ butterfly separation fallback now uses declared separation distance
├─ block-obstacle fallbacks now use declared block radius / butterfly clearance
└─ flower relocation now respects the same block-placement avoid radius as the placement check
```

The live family contract now resolves through:

```text
owner split
├─ `core/config.js`
│  └─ declares `entities.spatialFootprints`
├─ `systems/structureSystem.js`
│  └─ resolves family -> width / radius / clearance / occupancy metrics
├─ `systems/physicsSystem.js`
│  └─ consumes those metrics for motion/support/contact truth
└─ `core/gameCore.js`
   └─ uses the same metrics in the remaining placement / fallback paths
```

## Proof Snapshot

Primary artifacts:

- `qa_screenshots/m5_structure_audit/2026-04-22T19-27-00-755Z/report.json`
- `qa_screenshots/b4_carry_stack_physics_audit/2026-04-22T19-34-13-184Z/report.json`
- `qa_screenshots/r1_movement_stability_audit/2026-04-22T19-27-00-760Z/report.json`
- `qa_screenshots/r2_zone_transition_audit/2026-04-22T19-27-00-743Z/report.json`
- `qa_screenshots/r7_block_visual_audit/2026-04-22T19-34-12-911Z/report.json`

```text
s4 proof
├─ m5 structure owner / geometry      -> pass
├─ b4 carry / stack physics           -> pass
├─ r1 movement stability              -> pass
├─ r2 zone transition                 -> pass
├─ r7 block visual / spatial shell    -> pass
└─ page / console errors              -> none
```

One honest note:

```text
a4 spatial truth
└─ still carries the known runtime-budget seam from the runtime track
   so it was not used as the closure gate for s4
```

## Honest Boundary

```text
s4 closes
├─ declared entity footprint families
├─ shared clearance / radius ownership
├─ carry-anchor footprint alignment
└─ flower/block conflict alignment

s4 does not close
├─ block scatter / support-column unit cleanup
├─ opening/body-fit spacing cleanup beyond the footprint contract
└─ wider interaction-space reconciliation across all entity families
```

So the next active spatial pressure is `s5`: block placement, support columns,
openings, and support spacing still need to honor the same board unit all the
way through instead of only sharing the footprint contract.
