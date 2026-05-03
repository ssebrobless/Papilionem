# ENV2 Evidence Lock - Flower Spawn Rebalance

Date: 2026-05-03
Branch: `codex/milestone-freeze-playtest`
Commit target: pending at time of writing

## Scope

ENV2 limits ambient flower abundance so the garden has real scarcity pressure instead of constantly refilling into clutter.

Implemented rules:
- `sun-court` / Training Grounds has natural flower cap `0`.
- Open lands have natural normal-flower cap `5`.
- Existing dirt-pile suppression now operates under the cap instead of allowing demand to refill toward the old 7-9 flower range.
- Explicit test/debug fixture placement can still bypass the cap with `ignoreZoneFlowerCap`; player/lived natural spawning cannot.
- No save schema, cognition vocabulary, projection math, block logic, or ML artifacts changed.

## Files

- `core/config.js`
  - Added `gameConfig.entities.flower.naturalSpawn`.
- `core/gameCore.js`
  - Added `getZoneFlowerSpawnPolicy(zoneId)`.
  - Updated `getReadableFlowerCapForZone()` to allow a true zero cap.
  - Updated `getZoneFlowerSpawnTargets()` to clamp floor/min/max targets to the zone policy and return policy details in diagnostics.
- `scripts/run-environment-flower-spawn-rebalance-audit.js`
  - New deterministic browser audit for open-land cap, Training Grounds zero-cap, dirt suppression, and no training ambient residue.

## Proofs

### New Flower Rebalance Audit

Command:

```text
node scripts/run-environment-flower-spawn-rebalance-audit.js
```

Result: PASS

Report:

```text
qa_screenshots/environment_flower_spawn_rebalance_audit/2026-05-03T19-53-21-245Z/report.json
```

Assertions:
- `open-land-policy-caps-at-five`: pass
- `training-policy-caps-at-zero`: pass
- `open-land-targets-never-exceed-cap`: pass
- `training-targets-disable-natural-spawns`: pass
- `open-land-natural-spawns-stop-at-cap`: pass
- `training-ephemeral-spawns-blocked-by-cap`: pass
- `dirt-piles-reduce-natural-spawn-pressure`: pass
- `training-zone-has-no-ambient-flower-residue`: pass

### Regression Proofs

Command:

```text
node scripts/run-environment-occupancy-contract-audit.js
```

Result: PASS

Report:

```text
qa_screenshots/environment_occupancy_contract_audit/2026-05-03T19-53-37-673Z/report.json
```

Command:

```text
node scripts/run-r-flower-lifecycle-audit.js
```

Result: PASS

Report:

```text
qa_screenshots/r_flower_lifecycle_audit/2026-05-03T19-53-37-684Z/report.json
```

Important lived-cleanup signal:
- `cleanupOrganicFloorLived.seeded`: 12
- `cleanupOrganicFloorLived.cleaned`: 6
- `cleanupOrganicFloorLived.remaining`: 6
- `cleanupOrganicFloorLived.newPilesSpawned`: 2
- `cleanupOrganicFloorLived.pass`: true

Command:

```text
node scripts/run-r-block-cell-discipline-audit.js
```

Result: PASS

Report:

```text
qa_screenshots/r_block_cell_discipline_audit/2026-05-03T19-53-37-688Z/report.json
```

Command:

```text
node scripts/run-g0h-scripted-playthrough.js
```

Result: PASS, 13/13 lanes

Report:

```text
qa_logs/g0h_scripted_playthrough/2026-05-03T19-54-56-402Z/report.json
```

Command:

```text
node scripts/run-scenario.js --all
```

Result: PASS, 38/38 scenarios

Command:

```text
node scripts/run-runtime-self-audit.js
```

Result: PASS

Report:

```text
qa_screenshots/runtime_self_audit/report.json
```

Command:

```text
node scripts/run-long-soak-society-audit.js --fast --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison
```

Result: PASS

Report:

```text
qa_logs/long_soak_society/2026-05-03T20-02-17-898Z/report.json
```

Key society metrics:
- Witnessed affection event subscription observed 12 events.
- Hand-computed bond churn fixture passed.
- Mean distinct zones visited: 2.67.
- Partner repetition: 0.162.
- Conversation repetition: 0.

## Honest Read

This phase does not make the butterflies "real AI" by itself. It changes the environment so the current cognition and cooperation systems have more meaningful pressure to respond to:

- flowers are less infinite,
- Training Grounds no longer fills with ambient food clutter,
- dirt piles matter more because they occupy cells and reduce spawn pressure,
- the existing cleanup and social systems still pass under reduced abundance.

The next best phase is ENV3 / pollen propagation:

1. Eating or condensing a flower grants pollen charges.
2. Pollen charges expire after a fixed duration.
3. Butterflies can plant pollen into an open board cell.
4. A pending pollen patch blooms after 20 seconds.
5. Pollen can be handed off socially.

That is the point where scarcity becomes a cooperative loop instead of only a cap.
