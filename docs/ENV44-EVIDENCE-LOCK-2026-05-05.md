# ENV44 Evidence Lock - Bounded Migration Diversity Nudge

Date: 2026-05-05

## Scope

ENV44 added a small life-sim-owned diversity nudge to migration scoring. This is a behavior change, but it is bounded and additive. It does not change save schema, ML weights, cognition vocabulary, spatial projection, UI, or player saves.

## Files Changed

- `core/config.js`
- `systems/lifeSimSystem.js`

## What Changed

New config:

- `gameConfig.entities.migration.diversityNudgeWeight = 0.08`
- `gameConfig.entities.migration.recentZoneDiversityPenalty = 0.04`

`lifeSimSystem.syncMigrationState()` now adds a small candidate-zone nudge based on:

- lower visit ratio / higher novelty
- penalty for very recent zones
- only for candidate zones outside the current zone

The nudge is recorded in derived migration state:

`lifeSim.derived.migration.diversityNudgeByZone`

This keeps ownership in the life-sim layer. ML still only scores choices; it does not own durable migration truth.

## Proofs

Syntax checks:

`node --check systems/lifeSimSystem.js`

`node --check core/config.js`

- Result: pass

Repeated fixture value audit:

`qa_screenshots/ml_on_off_capture_audit/2026-05-05T07-22-03-906Z/report.json`

- Overall: `pass`
- Repeat count: `3`
- Fixture: `seed-ml-value-top-edge-organic`
- Browser clean: pass

Runtime self-audit:

`qa_screenshots/runtime_self_audit/report.json`

- Overall: `pass`

Social save continuity:

`qa_screenshots/n8_social_save_continuity_audit/2026-05-05T07-24-56-388Z`

- Overall: `pass`

Cognition trigger coverage:

`qa_logs/r_cognition_trigger_coverage/2026-05-05T07-24-56-384Z/report.json`

- Overall: `pass`

Full scenario suite:

`node scripts/run-scenario.js --all`

- Overall: `pass`
- Scenario count: `41`
- Report series begins at:
  `qa_screenshots/scenario/seed-affection/2026-05-05T07-25-03-709Z/report.json`

## Value Read

Repeated fixture aggregate:

| Metric | Pass rate | ML-on mean | ML-off mean | Ratio mean |
| --- | ---: | ---: | ---: | ---: |
| per-policy-disagreement-rate | 3/3 | 0.8639 | n/a | n/a |
| edge-delta-churn-per-minute | 0/3 | 6.0226 | 6.3845 | 0.9427 |
| migration-target-shannon-entropy | 0/3 | 1.8525 | 1.8330 | 1.0109 |
| target-acquisition-latency | 2/3 | 93.8433 | 117.3233 | 1.0428 |
| top-15-percent-top-edge-fraction | 1/3 | 0.1443 | 0.1559 | n/a |
| near-target-jitter-ratio | 2/3 | 0.0009 | 0.0038 | 0.1327 |

## Honest Read

The diversity nudge improved absolute migration entropy and kept the top-edge mean below the threshold in this fixture. It did not make ML clearly beat fallback on migration entropy, and it softened edge churn in this run.

That means the change is worth keeping as a bounded life-sim improvement, but it is not enough to claim the migration/ML system is complete. The next improvement should target social edge churn and communication quality, not keep forcing migration entropy alone.

Recommended next phase:

Run a fresh whole-game "real AI" audit focused on lived communication:

- dialogue human-readability
- partner diversity
- repetition
- whether feed lines are still abstract "air shifted" style
- whether social events correspond to visible relationships and environmental tasks

