# Spatial Boundary Expansion Audit

## Purpose

This is the stable `s2` closure note for the spatial-unification track.

It records the first true board-geometry expansion after the `s1` unit lock:

```text
old board
├─ shared polygon
└─ shared placement region
   └─ too narrow near the wall starts

new board
├─ wider back-wall shoulders
├─ same shared polygon owner
├─ same derived placement-region owner
└─ less inset lower / border use
```

## Runtime Closure

```text
s2 landed shape
├─ the focused-garden roam polygon now reaches farther toward the wall starts
├─ the derived placement region is less inset
├─ UI reserve no longer depends on a brittle polygon index
└─ movement / placement clamps still route through the same shared geometry owners
```

## Proof Snapshot

Primary artifacts:

- `qa_screenshots/r1_movement_stability_audit/2026-04-22T08-43-07-312Z/report.json`
- `qa_screenshots/r2_zone_transition_audit/2026-04-22T08-43-07-354Z/report.json`
- `qa_screenshots/a4_spatial_truth_audit/2026-04-22T08-43-07-302Z/report.json`

```text
s2 proof
├─ r1 movement stability        -> pass
├─ r2 zone transition           -> pass
├─ a4 shared spatial truth      -> pass
└─ shared focused-garden region -> 28/108/772/396
```

The shared section placement region now resolves to:

```text
placement region
├─ minX -> 28
├─ minY -> 108
├─ maxX -> 772
└─ maxY -> 396
```

## Honest Boundary

```text
s2 closes
├─ board boundary expansion
└─ board-owner consistency

s2 does not close
└─ doorway corridor alignment
   └─ that is still `s3`
```

So the board is larger and more internally consistent now, but the exact
doorway/corridor path shape is still the next active spatial phase.
