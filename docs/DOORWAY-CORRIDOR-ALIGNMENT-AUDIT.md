# Doorway Corridor Alignment Audit

## Purpose

This is the stable `s3` closure note for the spatial-unification track.

It closes the route-shape seam left open by the wider `s2` board:

```text
old route
├─ generic approach offset
├─ generic lineup offset
├─ shallow cover tuck
└─ generic inward arrival drift

new route
├─ corridor-owned back-wall lane
├─ corridor-owned lineup anchor
├─ doorway mouth aligned to the rebuilt board
├─ deeper behind-cover tuck
└─ corridor-owned local settle anchor
```

## Runtime Closure

```text
s3 landed shape
├─ each doorway side now owns an explicit corridor profile
├─ approach movement rides a back-wall lane before doorway commitment
├─ lineup uses corridor geometry instead of a generic horizontal offset
├─ cover anchors sit farther behind scenery before warp
├─ arrival settle comes from a corridor-owned local recovery point
└─ lineup / doorway timeouts are now distance-aware instead of fixed
```

The live corridor profiles now read:

```text
left corridor
├─ lane y      -> 112
├─ lineup      -> 312,112
├─ doorway     -> 268,132
├─ cover tuck  -> 230,104
├─ warp anchor -> 194,100
└─ settle      -> 282,154

right corridor
├─ lane y      -> 110
├─ lineup      -> 498,110
├─ doorway     -> 546,124
├─ cover tuck  -> 585,102
├─ warp anchor -> 622,98
└─ settle      -> 532,150
```

## Proof Snapshot

Primary artifacts:

- `qa_screenshots/r2_zone_transition_audit/2026-04-22T10-16-10-981Z/report.json`
- `qa_screenshots/a6_live_dispersal_audit/2026-04-22T10-16-11-002Z/report.json`
- `qa_screenshots/a4_spatial_truth_audit/2026-04-22T10-16-10-981Z/report.json`

```text
s3 proof
├─ r2 zone transition       -> pass
├─ a6 live dispersal        -> pass
├─ a4 shared spatial truth  -> pass
└─ page / console errors    -> none
```

The important behavior change is:

```text
route cadence
├─ regular-speed approach along the lane
├─ regular-speed lineup into corridor commitment
├─ doorway-align step only once committed
└─ behind-cover tuck before warp
```

## Honest Boundary

```text
s3 closes
├─ doorway corridor alignment
├─ cover-depth alignment
└─ route-shape inheritance from board geometry

s3 does not close
├─ entity footprint unification
├─ block/support spacing unification
└─ shared interaction-space reconciliation
```

So the route now inherits explicit corridor geometry, but the next active
spatial pressure is still `s4`: every entity family needs to advertise the
same footprint/clearance truth instead of continuing to rely on mixed radii.
