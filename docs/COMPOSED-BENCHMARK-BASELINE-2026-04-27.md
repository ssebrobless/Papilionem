# Composed Benchmark Baseline 2026-04-27

## Purpose

This doc freezes the first official composed-scenario benchmark packet using the
new harness and records the current hotspot picture on branch `34d1c6d`.

Use this as the runtime reality reference until a newer composed baseline is
intentionally promoted.

## Packet Shape

```text
+---------------- Official Composed Baseline ----------------+
| branch        -> 34d1c6d                                  |
| reality lane  -> single-zone-122                          |
| stress lane   -> single-zone-200                          |
| block lane    -> block-carry-active                       |
| flower lane   -> flower-feed-storm                        |
| profile lane  -> single-zone-122                          |
+-----------------------------------------------------------+
```

## Artifact Paths

- `single-zone-122`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/single-zone-122-2026-04-27T02-34-38-157Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/single-zone-122-2026-04-27T02-34-38-157Z.raw.json)
- `single-zone-200`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/single-zone-200-2026-04-27T02-36-46-723Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/single-zone-200-2026-04-27T02-36-46-723Z.raw.json)
- `block-carry-active`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/block-carry-active-2026-04-27T02-42-51-641Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/block-carry-active-2026-04-27T02-42-51-641Z.raw.json)
- `flower-feed-storm`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/flower-feed-storm-2026-04-27T02-46-13-846Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/flower-feed-storm-2026-04-27T02-46-13-846Z.raw.json)
- `single-zone-122` profile lane
  - [profile digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/single-zone-122-2026-04-27T02-49-33-098Z.json)
  - [profile raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/single-zone-122-2026-04-27T02-49-33-098Z.raw.json)
  - [cpuprofile](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/single-zone-122-2026-04-27T02-49-33-098Z.cpuprofile)

## Baseline Summary

| Scenario | Actual composition | Avg update | Avg render | p50 frame | p95 frame | Wall / frame |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `single-zone-122` | 122 butterflies / 57 flowers / 108 blocks | `127.77ms` | `45.91ms` | `172.50ms` | `191.30ms` | `172.95ms` |
| `single-zone-200` | 200 butterflies / 69 flowers / 130 blocks | `578.11ms` | `65.51ms` | `561.10ms` | `988.30ms` | `559.38ms` |
| `block-carry-active` | 80 butterflies / 21 flowers / 199 blocks | `295.53ms` | `36.31ms` | `326.30ms` | `578.90ms` | `308.79ms` |
| `flower-feed-storm` | 80 butterflies / 129 flowers / 108 blocks | `129.82ms` | `84.94ms` | `209.40ms` | `231.60ms` | `200.12ms` |

## Immediate Read

```text
what the packet says
|- single-zone-122 is the realistic reality lane
|- single-zone-200 is the above-real-play single-zone cliff
|- block-carry-active is dominated by physics + butterfly update
`- flower-feed-storm is dominated by flowers-direct composite + butterfly update
```

## Named Contradiction

`single-zone-122` now runs far above its own scenario note:

- scenario note target: `83ms p50` / `63ms avg update`
- current non-profile run: `172.5ms p50` / `127.77ms avg update`

This is a real post-harness contradiction.
Do not treat the scenario note as still current truth until the regression is
explained or a newer validation note replaces it.

## Top Realistic Hotspots

### Hotspot 1: butterfly crowd / flower-targeting update path

Evidence from `single-zone-122`:

- `update.entity.butterflyUpdateMs` -> `88.13ms`
- profile lane -> `122.20ms` under sampling overhead
- top profile functions:
  - `countNearbyButterflies` in [gameCore.js](/C:/Users/fishe/Documents/projects/ephemera/core/gameCore.js)
  - `countButterfliesTargetingFlower` in [gameCore.js](/C:/Users/fishe/Documents/projects/ephemera/core/gameCore.js)
  - `chooseBestFlowerForButterfly` in [gameCore.js](/C:/Users/fishe/Documents/projects/ephemera/core/gameCore.js)
  - `getDecisionPolicyChoice` in [butterfly.js](/C:/Users/fishe/Documents/projects/ephemera/entities/butterfly.js)
  - `checkFlowerSeeking` in [butterfly.js](/C:/Users/fishe/Documents/projects/ephemera/entities/butterfly.js)

Interpretation:

- crowd checks, flower-target contention, and butterfly choice loops are now a
  first-order runtime cost in the realistic lane

### Hotspot 2: flowers-direct composite / butterfly-present render path

Evidence from `single-zone-122`:

- `render.compositeMs` -> `37.55ms`
- `render.composite.flowersDirectPresentMs` -> `31.91ms`
- `render.entityLayerMs` -> `8.26ms`
- `render.entityFamilyButterflyMs` -> `7.84ms`
- profile lane shows repeated `drawImage` hot samples during the same window

Interpretation:

- the realistic lane is paying heavily for flower direct-present work and the
  downstream butterfly present/composite path, not just for simulation

## Stress-Lane Reads

### `single-zone-200`

```text
dominant shape
|- butterflyUpdateMs -> 348.90
|- physicsMs         -> 164.91
|- compositeMs       -> 50.08
`- result            -> single-zone cliff is still severe
```

### `block-carry-active`

```text
dominant shape
|- physicsMs         -> 201.32
|- butterflyUpdateMs -> 65.52
`- result            -> block-heavy worlds are physics-dominant first
```

### `flower-feed-storm`

```text
dominant shape
|- butterflyUpdateMs      -> 94.56
|- render.compositeMs     -> 77.36
|- flowersDirectPresentMs -> 72.36
`- result                 -> flower-heavy worlds are render-heavy and feed-loop-heavy together
```

## Current Interpretation

```text
runtime truth after the new harness
|- synthetic butterflies-N sweeps understate real-play cost
|- realistic single-zone composed lanes are now the primary truth
|- current tip is not runtime-healthy in the realistic lane
`- next runtime work should diagnose hotspot 1 first, then hotspot 2
```

## Retained Reality-Lane Recovery

```text
retained local recovery stack for `single-zone-122`
|- ButterflyStore proximityCount with active-butterfly filtering
|- frame-local flower-targeting snapshot reuse
|- frame-local live-sector snapshot reuse
|- frame-local progression-container guard
|- per-zone doorway-anchor cache
|- single-pass structure collision nearest-query
`- dense-scene direct-flower fallback recalibrated to `directPresentFlowerMaxVisible = 64`
```

### Latest retained artifacts

- [first retained beat](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/hotspot7_structure_query/single-zone-122-2026-04-27T04-17-29-446Z.json)
- [confirmation rerun](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/hotspot7_structure_query_rerun/single-zone-122-2026-04-27T04-19-20-903Z.json)

### Current reality-lane delta vs frozen baseline

| Lane | Avg update | Avg render | p50 frame | p95 frame | p99 frame | Wall / frame |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| frozen composed baseline | `127.77ms` | `45.91ms` | `172.50ms` | `191.30ms` | `209.30ms` | `172.95ms` |
| retained rerun | `52.18ms` | `43.53ms` | `94.90ms` | `106.10ms` | `113.00ms` | `95.56ms` |
| delta | `-59.2%` | `-5.2%` | `-45.0%` | `-44.5%` | `-46.0%` | `-44.7%` |

### Honest read after the retained slice

```text
what is now true
|- `single-zone-122` no longer has an update-budget contradiction
|  `- avg update is now below the scenario note's `63ms` reference
|- render average now beats the frozen composed baseline again
`- frame pacing is still not fully back to the scenario note
   `- retained rerun p50 `94.9ms` vs note `83ms`
```

The runtime story is materially healthier now, but the composed packet is not
fully closed yet:

- `single-zone-200` still needs a post-fix rerun
- `block-carry-active` still needs a post-fix rerun
- `flower-feed-storm` still needs a post-fix rerun
- `single-zone-122` still has a smaller remaining p50 gap relative to its own
  validation note

## Post-56c9a4f Refresh Packet

The branch now includes `56c9a4f`:

```text
new harness surfaces
|- per-stage `physics.*` breakdown fields
`- `scatterButterfliesAcrossZone` in `single-zone-122`
```

This means the older `single-zone-122` packet and the refreshed one are not
strict apples-to-apples. The refreshed packet is the new local truth because it
uses a more realistic butterfly spread.

### Refresh artifact paths

- `single-zone-122`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet/single-zone-122-2026-04-27T04-55-01-833Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet/single-zone-122-2026-04-27T04-55-01-833Z.raw.json)
- `single-zone-122` profile
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet_profile/single-zone-122-2026-04-27T05-02-30-729Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet_profile/single-zone-122-2026-04-27T05-02-30-729Z.raw.json)
  - [cpuprofile](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet_profile/single-zone-122-2026-04-27T05-02-30-729Z.cpuprofile)
- `single-zone-200`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet/single-zone-200-2026-04-27T04-55-01-835Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet/single-zone-200-2026-04-27T04-55-01-835Z.raw.json)
- `block-carry-active`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet/block-carry-active-2026-04-27T04-55-01-764Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet/block-carry-active-2026-04-27T04-55-01-764Z.raw.json)
  - [profile digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_block_profile/block-carry-active-2026-04-27T05-04-57-634Z.json)
  - [cpuprofile](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_block_profile/block-carry-active-2026-04-27T05-04-57-634Z.cpuprofile)
- `flower-feed-storm`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet/flower-feed-storm-2026-04-27T04-55-01-904Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet/flower-feed-storm-2026-04-27T04-55-01-904Z.raw.json)
- post-structure-query cut follow-ups
  - [single-zone-122](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone122_after_blockcarry_cut/single-zone-122-2026-04-27T07-18-15-770Z.json)
  - [single-zone-200](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone200_after_blockcarry_cut/single-zone-200-2026-04-27T07-16-17-882Z.json)
  - [block-carry-active first win](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/blockcarry_clonecut/block-carry-active-2026-04-27T07-13-58-565Z.json)
  - [block-carry-active confirmation](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/blockcarry_clonecut_rerun/block-carry-active-2026-04-27T07-15-27-660Z.json)
- dense-flower direct-present gate follow-ups
  - [flower-feed-storm first win](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/flower_direct_dense_gate/flower-feed-storm-2026-04-27T07-30-43-324Z.json)
  - [flower-feed-storm confirmation](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/flower_direct_dense_gate_rerun/flower-feed-storm-2026-04-27T07-34-45-605Z.json)
  - [single-zone-200 confirmation](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone200_flower_direct_dense_gate_rerun/single-zone-200-2026-04-27T07-35-51-111Z.json)
  - [single-zone-122 hold check](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone122_flower_direct_dense_gate/single-zone-122-2026-04-27T07-33-27-275Z.json)
- communication-maintenance + decision-trace cache follow-ups
  - [single-zone-200 first pass](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone200_comm_trace_cache/single-zone-200-2026-04-27T11-54-31-782Z.json)
  - [single-zone-200 confirmation](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone200_comm_trace_cache_rerun/single-zone-200-2026-04-27T11-56-59-365Z.json)
  - [single-zone-122 confirmation](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone122_comm_trace_cache/single-zone-122-2026-04-27T11-55-48-494Z.json)
  - [single-zone-200 profile](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone200_comm_trace_cache_profile/single-zone-200-2026-04-27T12-01-31-516Z.cpuprofile)
  - social guardrails:
    - [r6 communication audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r6_communication_audit/2026-04-27T11-59-52-972Z/report.json)
    - [f5/f6 social depth audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/f5_f6_social_depth_audit/2026-04-27T12-00-54-754Z/report.json)

### Refresh summary

| Scenario | Avg update | Avg render | p50 frame | p95 frame | Wall / frame | Dominant read |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `single-zone-122` | `52.43ms` | `50.20ms` | `102.80ms` | `113.70ms` | `103.62ms` | realistic lane held after scatter; butterfly update + composite still dominate |
| `single-zone-200` | `253.63ms` | `57.90ms` | `310.20ms` | `370.40ms` | `274.21ms` | density cliff still severe; physics sync + butterfly update dominate |
| `block-carry-active` | `378.65ms` | `26.11ms` | `468.10ms` | `1930.10ms` | `657.08ms` | active blocker; huge tails from butterfly update + structure-heavy physics |
| `flower-feed-storm` | `45.68ms` | `73.37ms` | `117.50ms` | `129.00ms` | `115.98ms` | improved vs frozen baseline but still render-heavy |

### Post-structure-query follow-up summary

| Scenario | Avg update | Avg render | p50 frame | p95 frame | Wall / frame | Honest read |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `single-zone-122` | `43.77ms` | `44.98ms` | `89.40ms` | `97.80ms` | `89.42ms` | reality lane is now close to the `83ms` note and materially healthier |
| `single-zone-200` | `103.62ms` | `55.69ms` | `154.70ms` | `185.90ms` | `152.26ms` | stress lane improved sharply but is still above-real-play heavy |
| `block-carry-active` | `32.59ms` | `26.57ms` | `58.00ms` | `76.40ms` | `60.83ms` | former blocker is now materially repaired |

### Dense-flower direct-present gate follow-up summary

| Scenario | Avg update | Avg render | p50 frame | p95 frame | Wall / frame | Honest read |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `flower-feed-storm` | `32.54ms` | `63.95ms` | `98.20ms` | `108.50ms` | `96.91ms` | former flower-heavy blocker is materially repaired; flowers now bypass the entity layer cleanly in dense low-butterfly scenes |
| `single-zone-200` | `96.94ms` | `56.00ms` | `153.10ms` | `169.30ms` | `149.87ms` | stress lane improves overall and stays the remaining above-real-play density blocker |
| `single-zone-122` | `40.84ms` | `42.69ms` | `88.40ms` | `100.10ms` | `88.64ms` | reality lane still holds with better averages and a small p95 wobble |

### Communication-maintenance + decision-trace cache follow-up summary

| Scenario | Avg update | Avg render | p50 frame | p95 frame | Wall / frame | Honest read |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `single-zone-200` | `86.37ms` | `55.22ms` | `141.50ms` | `158.10ms` | `138.09ms` | retained stress-lane improvement; update cost drops materially while render holds |
| `single-zone-122` | `36.62ms` | `43.15ms` | `81.10ms` | `90.10ms` | `81.22ms` | reality lane now beats the old `83ms p50` note locally |
| `flower-feed-storm` | `33.31ms` | `63.55ms` | `98.90ms` | `108.40ms` | `97.94ms` | repaired flower-heavy lane stays green after the communication/runtime cuts |

The first `single-zone-200` pass was even stronger at `68.16ms` avg update /
`110.6ms` p50, but the confirmation rerun above is the retained honest value.

### What the new breakdown changed

```text
single-zone-122 physics read
|- physicsMs                -> 13.64
|- syncTrackedEntitiesMs    -> 9.03
|- syncButterfliesMs        -> 8.84
|- resolveContactsMs        -> 2.06
`- resolveStructureCollisionMs -> 2.22
```

The realistic lane no longer points first at an opaque "physics" block. It
points at butterfly sync work inside physics plus the still-hot butterfly
decision/update path.

### Active blocker after the refresh

The first refresh packet said `block-carry-active` was the dominant blocker.
That was correct then, but the follow-up no-clone internal structure-query cut
changed the picture substantially.

```text
block-carry-active now
|- avgUpdateMs -> 32.59
|- p95FrameMs  -> 76.40
|- physicsMs   -> 10.69
|  |- syncTrackedEntitiesMs              -> 6.26
|  |- syncButterfliesMs                  -> 4.60
|  `- resolveButterflyStructureCollisionsMs -> 1.30
`- butterflyUpdateMs -> 14.28
```

The follow-up dense-flower direct-present gate changed the picture again:

```text
flower-feed-storm now
|- avgUpdateMs -> 32.54
|- avgRenderMs -> 63.95
|- p50FrameMs  -> 98.20
|- entityLayerMs          -> 5.55
|- entitiesCompositeMs    -> 3.40
`- flowersDirectPresentMs -> 54.30
```

So the blocker moved again:

```text
remaining local runtime order
|- single-zone-200    -> above-real-play density cliff, still led by butterfly update + composite pressure
|- single-zone-122    -> repaired locally; only reopen if we want margin beyond the old note
`- flower-feed-storm  -> repaired watch lane; keep it green during later stress-lane work
```

The communication-maintenance + decision-trace cache follow-up moved the stress
lane again:

```text
single-zone-200 now
|- avgUpdateMs -> 86.37
|- avgRenderMs -> 55.22
|- p50FrameMs  -> 141.50
|- butterflyUpdateMs     -> 40.97
|- communicationSystemMs -> 6.86
|- lifeSimSystemMs       -> 9.69
`- compositeMs           -> 34.26
```

And the new profile says the remaining stress-lane shape is:

```text
single-zone-200 retained profile
|- render
|  |- drawImage
|  `- near-full-width entity composite present
|- update
|  |- queryCollisionGeometry / isPointBlockedForEntity
|  |- proximityCount / chooseBestFlowerForButterfly
|  `- residual communication + life-sim maintenance
`- social guardrails
   |- r6  -> pass
   `- f5/f6 -> pass
```

The carry/structure profile still mattered because it proved the cause of the
old cliff:

```text
what the carry fix removed
|- structureSystem.cloneValue churn
|- repeated queryCollisionGeometry clone pressure
`- excessive passable-sample / blocked-point structure query overhead
```

### Structure-system frame-local runtime cache follow-up summary

- retained artifacts:
  - [single-zone-200 first pass](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone200_structure_runtime_cache/single-zone-200-2026-04-27T16-07-48-113Z.json)
  - [single-zone-200 confirmation](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone200_structure_runtime_cache_rerun/single-zone-200-2026-04-27T16-10-00-910Z.json)
  - [single-zone-122 first pass](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone122_structure_runtime_cache/single-zone-122-2026-04-27T16-07-48-080Z.json)
  - [single-zone-122 confirmation](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone122_structure_runtime_cache_rerun/single-zone-122-2026-04-27T16-11-30-540Z.json)
  - [block-carry-active hold](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/blockcarry_structure_runtime_cache/block-carry-active-2026-04-27T16-07-47-583Z.json)
  - spatial/build guardrails:
    - [a4 spatial truth](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/a4_spatial_truth_audit/2026-04-27T16-12-44-383Z/report.json)
    - [b4 carry-stack physics](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/b4_carry_stack_physics_audit/2026-04-27T16-13-00-309Z/report.json)

| Scenario | Avg update | Avg render | p50 frame | p95 frame | Wall / frame | Honest read |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `single-zone-200` | `81.39ms` | `55.82ms` | `135.30ms` | `150.60ms` | `133.53ms` | retained stress-lane improvement; repeated same-frame structure queries are materially cheaper, but this is still the remaining density cliff |
| `single-zone-122` | `39.27ms` | `43.54ms` | `81.30ms` | `90.40ms` | `81.81ms` | reality lane stays below the old `83ms p50` note while holding render close to the earlier retained slice |
| `block-carry-active` | `30.77ms` | `26.98ms` | `56.20ms` | `74.30ms` | `59.96ms` | repaired carry lane holds after the structure-cache cut |

What changed in the code path:

```text
structure query reuse
|- frame-local queryCollisionGeometry cache
|- frame-local getSpatialContextForEntity cache
|- clone-on-demand on public returns only
`- reset / rebuild now clear runtime caches explicitly
```

What this means now:

```text
latest local runtime order
|- single-zone-200    -> active blocker
|  |- butterfly update remains the largest update family
|  |- composite / drawImage tail still matters
|  `- residual structure-query pressure is smaller, not gone
|- single-zone-122    -> local hold below the old `83ms p50` note
|- flower-feed-storm  -> repaired watch lane
`- block-carry-active -> repaired watch lane
```

### Pressure-gated crowd/cursor checks + critical communication cadence summary

- retained artifacts:
  - [single-zone-200 first pass](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone200_comm8_cursor_gate/single-zone-200-2026-04-28T16-20-40-492Z.json)
  - [single-zone-200 confirmation](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone200_comm8_cursor_gate_rerun/single-zone-200-2026-04-28T16-22-13-826Z.json)
  - [single-zone-122 hold](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone122_comm8_cursor_gate_hold/single-zone-122-2026-04-28T16-34-14-926Z.json)
  - [flower-feed-storm hold](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/flower_feed_comm8_cursor_gate_hold/flower-feed-storm-2026-04-28T16-39-59-002Z.json)
  - [block-carry-active hold](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/blockcarry_comm8_cursor_gate_hold/block-carry-active-2026-04-28T16-41-35-396Z.json)
  - guardrails:
    - [r6 communication](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r6_communication_audit/2026-04-28T16-45-05-824Z/report.json)
    - [f5/f6 social depth](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/f5_f6_social_depth_audit/2026-04-28T16-49-27-227Z/report.json)
    - [r1 movement stability](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r1_movement_stability_audit/2026-04-28T16-51-08-906Z/report.json)

| Scenario | Avg update | Avg render | p50 frame | p95 frame | Wall / frame | Honest read |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `single-zone-200` | `80.87ms` | `54.92ms` | `134.00ms` | `149.20ms` | `131.66ms` | retained stress-lane improvement; smaller than the structure-cache gain, but confirmed across update, render, p50, p95, and wall time |
| `single-zone-122` | `34.71ms` | `41.86ms` | `74.70ms` | `85.40ms` | `75.68ms` | reality lane improves again and keeps wide margin under the old `83ms p50` note |
| `flower-feed-storm` | `29.66ms` | `61.31ms` | `88.70ms` | `97.80ms` | `87.69ms` | repaired flower-heavy lane improves and stays green |
| `block-carry-active` | `30.47ms` | `25.78ms` | `55.10ms` | `73.10ms` | `57.28ms` | repaired carry lane improves and stays green |

What changed in the code path:

```text
retained pressure gates
|- normal crowd-retarget proximity checks now run only on the existing retarget interval
|- cursor risk profile lookup is lazy when the cursor is outside scare/trust reach
|- critical communication maintenance interval is 8 frames
`- communication maintenance phase is cached per entity / interval
```

What this means now:

```text
latest local runtime order
|- single-zone-200   -> still active, but narrower
|  |- butterflyUpdateMs -> 37.18 in the retained confirmation
|  |- compositeMs       -> 34.22 in the retained confirmation
|  `- next target       -> render/composite tail before more social cadence work
|- single-zone-122   -> repaired local hold at `74.7ms p50`
|- flower-feed-storm -> repaired local hold at `88.7ms p50`
`- block-carry-active -> repaired local hold at `55.1ms p50`
```

### Telemetry Accounting Correction

Two benchmark-accounting issues were found during the `single-zone-200`
composite-tail inspection and are now corrected in code:

```text
telemetry truth correction
|- `render.composite.totalCompositeMs` now includes `flowersDirectPresentMs`
|- attribution top-contributor lists now rank timing fields only
|  `- non-duration counters / widths / ratios no longer appear as "ms" costs
`- benchmark performance baselines above remain the retained local truth
   `- post-correction sanity timings were noisy locally and are not promoted
```

Sanity artifact:

- [flower-feed accounting sanity](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/flower_feed_composite_accounting_sanity/flower-feed-storm-2026-04-28T18-02-05-444Z.json)

The sanity capture proves the accounting shape: `render.composite.totalCompositeMs`
is `69.22ms`, `render.composite.flowersDirectPresentMs` is `64.88ms`, and
the raw attribution top render contributors are timing keys rather than
composite widths. Its absolute frame timings should not replace the retained
watch-lane numbers above.

## Next Diagnosis Order

1. `single-zone-200` composite / drawImage tail
2. `single-zone-200` residual butterfly-update cost only where the next profile still shows repeatable pressure
3. `single-zone-200` residual blocked-point / structure-query pressure only where the frame-local caches still miss
4. `flower-feed-storm` and `block-carry-active` only as repaired watch lanes while later stress-lane work lands
5. `single-zone-122` only if we want additional margin beyond the old `83ms p50` note
