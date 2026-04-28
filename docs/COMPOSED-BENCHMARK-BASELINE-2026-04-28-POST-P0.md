# Composed Benchmark Baseline 2026-04-28 Post-P0

## Purpose

This document records the first composed benchmark packet after P0 harness
stabilization:

```text
---------------- Post-P0 Harness Baseline ----------------+
| P0.a -> game-owned currentFrame                         |
| P0.b -> cadence reads migrated from p5 frameCount       |
| P0.c -> scatter / teleport / movement spatial refresh   |
| P0.d -> bench exits nonzero on page / console errors    |
| P0.e -> fresh composed packet on the fixed harness      |
+---------------------------------------------------------+
```

The older 2026-04-27 composed baseline remains the pre-fix reference. Do not
overwrite it or chase its exact numbers; the fixed harness now measures a more
honest simulation.

## Artifact Paths

- `single-zone-122`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_p0_composed_2026_04_28/single-zone-122-2026-04-28T20-55-36-117Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_p0_composed_2026_04_28/single-zone-122-2026-04-28T20-55-36-117Z.raw.json)
- `single-zone-200`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_p0_composed_2026_04_28/single-zone-200-2026-04-28T20-56-49-786Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_p0_composed_2026_04_28/single-zone-200-2026-04-28T20-56-49-786Z.raw.json)
- `block-carry-active`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_p0_composed_2026_04_28/block-carry-active-2026-04-28T20-58-42-932Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_p0_composed_2026_04_28/block-carry-active-2026-04-28T20-58-42-932Z.raw.json)
- `flower-feed-storm`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_p0_composed_2026_04_28/flower-feed-storm-2026-04-28T20-59-35-675Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_p0_composed_2026_04_28/flower-feed-storm-2026-04-28T20-59-35-675Z.raw.json)
- `single-zone-200` profile lane
  - [profile digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_p0_composed_2026_04_28/single-zone-200-2026-04-28T21-00-59-899Z.json)
  - [profile raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_p0_composed_2026_04_28/single-zone-200-2026-04-28T21-00-59-899Z.raw.json)
  - [cpuprofile](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_p0_composed_2026_04_28/single-zone-200-2026-04-28T21-00-59-899Z.cpuprofile)

## Error Gate

```text
bench.js policy
|- pageErrorCount   -> 0 for all primary lanes
|- consoleErrorCount -> 0 for all primary lanes
`- allowErrors      -> false for all primary lanes
```

The packet was captured under the P0.d fail-by-default policy. A digest with
page or console errors now exits nonzero unless `--allow-errors` is explicitly
passed.

## Primary Summary

| Scenario | Actual composition | Avg update | Avg render | p50 frame | p95 frame | p99 frame | Wall / frame |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `single-zone-122` | 122 butterflies / 84 flowers / 108 blocks | `39.67ms` | `53.10ms` | `88.90ms` | `108.00ms` | `125.20ms` | `91.28ms` |
| `single-zone-200` | 200 butterflies / 90 flowers / 130 blocks | `96.24ms` | `67.76ms` | `165.30ms` | `191.20ms` | `219.10ms` | `161.47ms` |
| `block-carry-active` | 80 butterflies / 43 flowers / 200 blocks | `36.94ms` | `34.71ms` | `67.60ms` | `86.80ms` | `105.40ms` | `69.98ms` |
| `flower-feed-storm` | 80 butterflies / 149 flowers / 108 blocks | `39.49ms` | `74.21ms` | `112.70ms` | `126.40ms` | `139.30ms` | `110.30ms` |

## Dominant Breakdown

| Scenario | Butterfly update | Physics | Life sim | Communication | Entity layer | Composite |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `single-zone-122` | `17.64ms` | `7.63ms` | `3.93ms` | `1.06ms` | `8.93ms` | `42.77ms` |
| `single-zone-200` | `42.59ms` | `17.20ms` | `12.48ms` | `8.55ms` | `23.77ms` | `41.76ms` |
| `block-carry-active` | `13.39ms` | `10.38ms` | `3.70ms` | `0.72ms` | `6.13ms` | `27.23ms` |
| `flower-feed-storm` | `24.28ms` | `4.62ms` | `3.10ms` | `0.81ms` | `5.91ms` | `66.98ms` |

## Current Read

```text
post-P0 runtime truth
|- harness is now clean enough to promote fresh baselines
|- single-zone-122 is usable but has less margin than the best retained local hold
|- block-carry-active remains repaired and is a watch lane
|- flower-feed-storm is render/composite-heavy again
`- single-zone-200 is the active stress blocker
   |- butterfly update is the largest update family
   |- render entity layer + composite remain large
   |- lifeSim / communication are visible at 200 density
   `- physics sync/contact is no longer opaque, but still material
```

## Profile Lane

The `single-zone-200 --profile` pass is not the primary timing baseline because
sampling overhead changes frame times. It is diagnosis evidence for the active
stress lane.

Profile timing summary:

| Metric | Value |
| --- | ---: |
| Avg update | `112.87ms` |
| Avg render | `70.94ms` |
| p50 frame | `175.20ms` |
| p95 frame | `206.90ms` |
| Wall / frame | `172.07ms` |

Top sampled self-time entries:

```text
single-zone-200 profile
|- drawImage                         -> dominant render cost
|- queryCollisionGeometry            -> residual structure query cost
|- cloneValue / cloneSleepValue      -> durable-state clone pressure
|- countWithin / proximityCount      -> dense butterfly proximity cost
|- decayConversationTexture          -> communication maintenance cost
|- trimCommunicationState            -> communication cleanup cost
`- buildCollisionQueryRuntimeCacheKey -> structure cache-key overhead
```

## Next Best Step

P0 is now functionally ready to close after this baseline is accepted.

The next implementation phase should be P1 named-contradiction triage, not a
new spatial/ML/life-sim refoundation. Start with the visible symptom that most
blocks acceptance, and reopen at most one frozen audit lane for that symptom.

Recommended queue:

```text
P1 triage queue
|- if player-visible overlap / mismatch is still observed
|  `- open one named contradiction against the relevant frozen spatial audit lane
|- if runtime is the blocker
|  `- use single-zone-200 as the active stress lane
|- if flower-heavy scenes feel bad
|  `- use flower-feed-storm as the watch lane
`- keep block-carry-active as a repaired guardrail
```
