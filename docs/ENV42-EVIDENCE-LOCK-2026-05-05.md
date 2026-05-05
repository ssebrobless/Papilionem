# ENV42 Evidence Lock - Sim-Board Arrival Edge Relief

Date: 2026-05-05

## Scope

ENV42 fixed the route-geometry root cause found in ENV41. This phase changes sim-board zone-travel arrival settle points only. It does not change save schema, ML weights, cognition vocabulary, projection math, UI, or player saves.

## Files Changed

- `core/config.js`
- `core/gameCore.js`

## What Changed

`gameConfig.entities.migration.simBoardArrivalInteriorUnits` was added with default:

`6.8`

`core/gameCore.js` `buildSimBoardZoneTravelRoute()` now uses that value instead of the previous hard-coded `3.2` board-unit interior offset.

Before:

`arrivalInteriorBoard = offsetBoardPoint(arrivalMidpoint, reciprocalVector, -3.2)`

After:

`arrivalInteriorBoard = offsetBoardPoint(arrivalMidpoint, reciprocalVector, -simBoardArrivalInteriorUnits)`

Why `6.8`:

- The affected boards have depth `36`.
- The top-edge value threshold is the top `15%`.
- `36 * 0.15 = 5.4`.
- The previous `v: 3.2` arrival target was inside the penalized band.
- `6.8` moves arrivals beyond the top-edge band while keeping them visibly near the entry edge.

## Proofs

Syntax checks:

`node --check core/gameCore.js`

`node --check core/config.js`

- Result: pass

Zone transition audit:

`qa_screenshots/r2_zone_transition_audit/2026-05-05T06-58-53-727Z`

- Overall: `pass`

Runtime self-audit:

`qa_screenshots/runtime_self_audit/report.json`

- Overall: `pass`

Long-running save smoothness audit:

`qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-05T07-02-08-852Z/report.json`

- Overall: `pass`

Repeated fixture value audit after the fix:

`qa_screenshots/ml_on_off_capture_audit/2026-05-05T06-59-22-569Z/report.json`

- Overall: `pass`
- Repeat count: `3`
- Route diagnostics: zero top-band arrival routes in all three repeats
- Top-edge metric: ML-on passed `3/3`
- ML-on top-edge mean: `0.1435`
- ML-off top-edge mean: `0.1562`

Full scenario suite:

`node scripts/run-scenario.js --all`

- Final rerun overall: `pass`
- Scenario count: `41`
- Report series begins at:
  `qa_screenshots/scenario/seed-affection/2026-05-05T07-11-07-154Z/report.json`

## Regression Note

The first full scenario run after the route change failed `seed-zone-pull-resource` once:

`qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T07-08-03-137Z/report.json`

The scenario then passed `3/3` in isolation:

`qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T07-10-55-366Z/report.json`

The full suite then passed on rerun. This is recorded as a transient full-suite failure, not an accepted regression.

## Honest Read

This phase closes the specific route-geometry contradiction: edge travel no longer intentionally places butterflies inside the top-edge value band.

It does not solve the entire ML/value problem. After the fix:

- Top-edge is materially improved and passes in the repeated fixture.
- Migration entropy still does not meet the value threshold.
- Target acquisition remains noisy and needs deeper movement/target-owner analysis.
- Edge churn and jitter vary across organic repeats.

Recommended next phase:

Trace the writers of `lifeSim.derived.migration.travelTargetZoneId` and add reason-level diagnostics so migration entropy can be improved without guessing.

