# ENV41 Evidence Lock - Migration Route Top-Edge Trace

Date: 2026-05-05

## Scope

ENV41 added non-behavioral route diagnostics to the ML on/off value audit. This phase traces migration and edge-travel geometry only. It does not change game behavior, model weights, save schema, spatial math, cognition vocabulary, UI, or player saves.

## Files Changed

- `scripts/run-ml-on-off-capture-audit.js`

## What Changed

The value audit now records `routeDiagnostics` for each observed source-zone to target-zone pair:

- route key
- source zone
- target zone
- sample count
- route availability
- exit id
- direction
- arrival edge board position
- arrival target board position
- target depth
- whether the route arrival target is inside the top 15% band

This identifies whether top-edge occupancy is caused by route geometry versus post-arrival movement.

## Proofs

Syntax check:

`node --check scripts/run-ml-on-off-capture-audit.js`

- Result: pass

Fixture route trace:

`qa_screenshots/ml_on_off_capture_audit/2026-05-05T06-55-42-098Z/report.json`

- Overall: `pass`
- Fixture: `seed-ml-value-top-edge-organic`
- Repeat count: `2`
- Browser clean: pass

## Route Findings

The trace found two route pairs whose arrival target is inside the top 15% band:

| Route | Direction | Arrival target board pos | Zone depth | Top band threshold |
| --- | --- | --- | ---: | ---: |
| `ivy-cloister->moss-hollow` | `S` | `{ u: 18, v: 3.2, h: 0 }` | 36 | `v < 5.4` |
| `sun-court->pool-heart` | `S` | `{ u: 18, v: 3.2, h: 0 }` | 36 | `v < 5.4` |

Those route pairs were heavily sampled:

| Iteration | Scenario | Route | Samples |
| ---: | --- | --- | ---: |
| 1 | ML on | `ivy-cloister->moss-hollow` | 1167 |
| 1 | ML off | `ivy-cloister->moss-hollow` | 1060 |
| 2 | ML on | `ivy-cloister->moss-hollow` | 1032 |
| 2 | ML off | `ivy-cloister->moss-hollow` | 797 |
| 1 | ML on | `sun-court->pool-heart` | 463 |
| 1 | ML off | `sun-court->pool-heart` | 458 |
| 2 | ML on | `sun-court->pool-heart` | 706 |
| 2 | ML off | `sun-court->pool-heart` | 641 |

The same runs showed high top-edge occupancy in the destination zones:

| Iteration | Scenario | Zone | Top-edge fraction |
| ---: | --- | --- | ---: |
| 1 | ML on | moss-hollow | 0.5283 |
| 1 | ML off | moss-hollow | 0.5818 |
| 2 | ML on | moss-hollow | 0.6548 |
| 2 | ML off | moss-hollow | 0.4311 |
| 1 | ML on | pool-heart | 0.1020 |
| 1 | ML off | pool-heart | 0.1217 |
| 2 | ML on | pool-heart | 0.1297 |
| 2 | ML off | pool-heart | 0.2788 |

## Root Cause

The root cause is in `core/gameCore.js` `buildSimBoardZoneTravelRoute()`.

The route computes:

`arrivalInteriorBoard = offsetBoardPoint(arrivalMidpoint, reciprocalVector, -3.2)`

For north/top arrivals into a 36-depth board, that places the target at `v: 3.2`, which is still inside the top 15% band (`v < 5.4`). The route is doing what it was told to do; the interior offset is too shallow for the current value/readability target.

## Honest Read

This is not primarily an ML failure. m8 may choose route targets differently, but the route math itself can place arriving butterflies in a penalized edge band. Fixing the route's interior settle distance should happen before retraining or retuning model labels.

Recommended next phase:

1. Move sim-board arrival interior targets deeper into the destination board.
2. Keep this limited to zone-travel route settle points.
3. Preserve edge-based travel visuals and save schema.
4. Rerun the repeated fixture value audit and zone transition audit.

