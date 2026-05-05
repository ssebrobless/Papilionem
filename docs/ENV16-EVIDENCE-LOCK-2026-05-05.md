# ENV16 Evidence Lock - Cleanup Arrival Margin

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`

## Scope

ENV16 responds to an honest residual from ENV15: one full G0H run cleaned only 4 dirt piles when the flower-lifecycle lane required at least 5. The rerun passed, so this was not an ENV15 regression, but it showed cleanup was operating too close to the acceptance boundary.

This phase does not change save schema, ML artifacts, spatial projection, flower ownership, cognition vocabulary, or dirt-pile cleanup effects.

```text
Cleanup truth
  ├─ flower owns "can this pile be cleaned?"
  │    └─ existing board cleanup radius: 1.25 units
  ├─ butterfly owns "have I arrived at my cleanup target?"
  │    └─ old arrival threshold: 0.65 units
  └─ ENV16 aligns navigation arrival with cleanup affordance
       └─ new configurable arrival radius: 1.05 units
```

## Code Changes

### `core/config.js`

- Added `gameConfig.cognition.affordances.cleanupArrivalBoardRadius = 1.05`.

### `entities/butterfly.js`

- Added `getCleanupArrivalBoardRadius()`.
- Replaced the hardcoded cleanup arrival gate `0.65` with the configured radius.
- Replaced the hardcoded dirt-pile-at-target tolerance `0.75` with the same configured radius.

This keeps `Flower.tryCleanupDirtPile()` as the final owner of whether a pile is cleaned. The butterfly now attempts cleanup once it is inside a reasonable board-space arrival band, instead of requiring a tighter movement threshold than the flower itself uses.

## Evidence

Syntax:

- `node --check entities/butterfly.js`: pass
- `node --check core/config.js`: pass

Flower lifecycle audit:

- Command: `node scripts/run-r-flower-lifecycle-audit.js`
- Result: `pass`
- Report: `qa_screenshots/r_flower_lifecycle_audit/2026-05-05T01-45-39-032Z/report.json`
- Key cleanup results:
  - cleanup floor: `8/8` cleaned
  - organic cleanup: `8/8` cleaned
  - lived organic cleanup: `8/12` cleaned, `4` remaining, no injected cleanup

Spatial cleanup audit:

- Command: `node scripts/run-r-spatial-cleanup-audit.js`
- Result: `pass`
- Report: `qa_screenshots/r_spatial_cleanup_audit/2026-05-05T01-47-07-239Z/report.json`

Cleanup scenarios:

- `node scripts/run-scenario.js seed-cleanup-floor-organic`: pass
  - Report: `qa_screenshots/scenario/seed-cleanup-floor-organic/2026-05-05T01-47-23-324Z/report.json`
- `node scripts/run-scenario.js seed-cleanup-status-loop`: pass
  - Report: `qa_screenshots/scenario/seed-cleanup-status-loop/2026-05-05T01-48-14-063Z/report.json`

Runtime and society:

- `node scripts/run-runtime-self-audit.js`: pass
  - Report: `qa_screenshots/runtime_self_audit/report.json`
- `node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison`: pass
  - Report: `qa_logs/long_soak_society/2026-05-05T01-48-22-709Z/report.json`
  - bond stability: `0.2736904775963476` (`<= 0.30`)
  - cleanup gradient: `0`
  - witnessed-affection rate: `1/min`
  - mean zone entropy: `0.7412254922960884`

G0H scripted playthrough:

- Command: `node scripts/run-g0h-scripted-playthrough.js`
- Result: `pass`, `13/13`
- Report: `qa_logs/g0h_scripted_playthrough/2026-05-05T01-49-45-718Z/report.json`
- Output folder: `qa_logs/g0h_scripted_playthrough/2026-05-05T01-49-45-718Z`
- Flower-lifecycle lane:
  - piles before: `12`
  - piles after: `3`
  - cleaned net: `9`
  - required minimum: `5`

Full scenario suite:

- Command: `node scripts/run-scenario.js --all`
- Result: `pass`, `38/38`
- Final reports under `qa_screenshots/scenario/*/2026-05-05T01-57..02-03Z`
- `seed-zone-pull-resource`: pass
  - Report: `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T02-03-38-112Z/report.json`

Continuity:

- `node scripts/run-h5-long-running-save-smoothness-audit.js`: pass
  - Report: `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-05T02-03-46-630Z/report.json`
- `node scripts/run-n8-social-save-continuity-audit.js`: pass
  - Audit id: `2026-05-05T02-03-46-622Z`

## Honest Read

ENV16 closes the immediate cleanup-margin concern. The main G0H flower lane moved from a prior failed `4` cleaned piles to `9` cleaned piles in the verified run, without driver cleanup injection and without changing flower cleanup ownership.

Remaining ecology work is higher-level product feel, not this mechanical arrival issue:

- whether cleanup looks intentional enough to a player in a live capture
- whether butterflies communicate about cleaning in natural language often enough
- whether dirt production and flower decay create satisfying long-run work rhythms rather than occasional audit-only pressure

