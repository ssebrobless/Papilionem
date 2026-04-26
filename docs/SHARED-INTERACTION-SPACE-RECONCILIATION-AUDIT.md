# Shared Interaction-Space Reconciliation Audit

## Purpose

This is the stable closure note for `s6 shared interaction-space reconciliation`.

```text
before
expanded board + unit contract
  ├─ fixed the board, corridor, footprint, and block-support owners
  └─ still left a few flower / pollen / lifecycle / spawn paths on older padding rules

after
one widened interaction space
  ├─ butterfly spawn + wander sampling
  ├─ flower spawn + relocation + pollen planting
  ├─ block/flower conflict relocation
  ├─ caterpillar travel clamp + target filtering
  └─ egg / chrysalis occupancy riding the same flower-space contract
```

## What Landed

Primary runtime owners:
- `core/gameCore.js`
- `entities/caterpillar.js`

Concrete changes:

```text
interaction-space helpers
├─ declared butterfly interaction-space metrics from the shared footprint contract
├─ declared flower interaction-space metrics from flower + block-unit truth
└─ declared caterpillar interaction-space metrics for lifecycle travel

world owner
├─ moved butterfly spawn sampling onto the widened interaction-space contract
├─ moved butterfly wander sampling/jitter onto the same contract
├─ moved flower spawn / relocation / pollen planting onto the same contract
└─ moved flower-block conflict relocation defaults onto the same contract

lifecycle owner
├─ kept eggs / chrysalis attached to flower-owned occupancy truth
└─ moved caterpillar movement + target filtering onto the widened board contract
```

## Spatial Truth Closed In `s6`

```text
`s5` solved
└─ whether block placement/support still used scattered local size rules

`s6` solves
└─ whether flowers, pollen, larva travel, and butterfly roam/spawn still quietly assumed
   the older narrower board
```

The important closure is:

```text
same board
├─ butterflies sample from it
├─ flowers sample from it
├─ pollen planting clamps to it
├─ caterpillars move inside it
└─ egg / chrysalis flowers persist inside it
```

## Proof

Required `s6` proof lanes:
- `w3 flower ecology audit` -> `pass`
- `a2 carry/flower audit` -> `pass`
- `r1 movement stability audit` -> `pass`
- `r2 zone transition audit` -> `pass`
- `a4 spatial truth audit` -> `pass`

Artifacts:
- `qa_screenshots/w3_flower_ecology_audit/2026-04-22T20-10-54-479Z/report.json`
- `qa_screenshots/a2_carry_flower_audit/2026-04-22T20-10-54-476Z/report.json`
- `qa_screenshots/r1_movement_stability_audit/2026-04-22T20-10-54-483Z/report.json`
- `qa_screenshots/r2_zone_transition_audit/2026-04-22T20-10-54-482Z/report.json`
- `qa_screenshots/a4_spatial_truth_audit/2026-04-22T20-10-54-423Z/report.json`

## Honest Boundary

```text
closed now
└─ the widened board is no longer just a block/corridor truth; flowers and larval movement
   read it too

not closed yet
└─ lived-in save migration into the fully unified board/unit model
```

That remaining work is `s7`, not more `s6` tuning.

## Next Move

```text
next
└─ s7 save migration
   ├─ normalize old board-derived spatial state into the widened interaction space
   ├─ preserve long-running butterfly identity / memories / lineage
   └─ prove migrated lived-in saves stay stable after autosave
```
