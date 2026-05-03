# B1 Evidence Lock - Social Partner Diversity and Recency Pressure - 2026-05-03

Phase source: `docs/CLAUDE-POST-AA8-NEXT-BELIEVABILITY-PLAN-2026-05-02.md`, section 5, B1.

## Verdict

B1 is landed and proof-green.

The visible B1 symptom was same-partner dialogue looping. The long-soak fixture previously reported partner repetition near 0.90. After B1, the full fixture run reports:

```
dialogue signal
    │
    ├── warning_signal ───────────────▶ unchanged target path
    │
    └── social / care / teaching etc.
          │
          ▼
      candidate pool
          │
          ├── recency pressure, 180s window + 180s decay
          ├── need-typed bias: loneliness / comfort / curiosity / status / repair
          └── bonded grief/loneliness check-in exemption
          │
          ▼
      diversified target or suppressed repeated fully-recent social signal
```

Full fixture results:

- ML-on partner repetition: `0.4000` (target `<= 0.40`)
- Heuristic partner repetition: `0.3204` (target `<= 0.60` per B1 handoff, and below the stricter `<= 0.40` long-soak warning band)
- Conversation repetition: `0`
- Witnessed-affection event subscription still fires: ML-on `6`, heuristic `9`
- G0H remains `13/13`
- Scenario suite is now `34/34`, with `seed-partner-diversity-organic` added

## Implementation Summary

Primary B1 changes:

- `core/config.js`
  - Added `gameConfig.communication.partnerSelection` with rollback flag `recencyPressure`.
  - Default recency window: `180s`, decay: `180s`.
  - Added need-typed scoring weights for loneliness, comfort, curiosity, status expression, and shame repair.

- `systems/communicationSystem.js`
  - Added runtime-only `partnerSelectionHistory`.
  - Added partner candidate scoring and reranking for targeted social signals.
  - Added suppression for fully recent repeated social signals when no better target is available.
  - Preserved safety semantics by excluding `warning_signal` from target reranking.
  - Preserved bonded check-ins when recent grief / loneliness is active.
  - Added response throttling so auto replies do not immediately re-form the same tight pair loop.

- `scripts/scenario/scenarios/seed-partner-diversity-organic.json`
  - New deterministic B1 fixture.
  - With recency pressure enabled: asserts at least 5 distinct source-target pairs in 90s.
  - With recency pressure disabled: asserts at most 2 distinct source-target pairs.

Support changes required by proofs:

- `scripts/scenario/runner.js`
  - Added scenario actions for toggling partner recency pressure, clearing dialogue history, and asserting dialogue pair diversity.

- `ui/gameUI.js`
  - Added `socialLens` to DOM inspect detail state so DOM inspect and canvas inspect expose the same social-lens information.

- `scripts/run-n7-social-surfacing-audit.js`
  - Added a fallback to inspect DOM state when the canvas `lastInspectPresentation` snapshot is not populated in the headless audit path.

- `entities/butterfly.js`
  - Fixed stale board-position fallback for social follow-through target anchoring when a partner's stored board position projects far away from its rendered ground point.

- `scripts/run-n5-dialogue-behavior-follow-through-audit.js`
  - Updated target-distance measurement to use `renderManager.boardToScreen` for board-space movement targets instead of interpreting them as legacy iso grid coordinates.

These support changes were not part of the narrow B1 owned-file list, but they were necessary because the required B1 regression audits exposed real parity / spatial-measurement contradictions. No save schema, ML artifact, cognition vocabulary, or projection contract changed.

## Proofs

Syntax checks:

- `node --check core/config.js`
- `node --check systems/communicationSystem.js`
- `node --check entities/butterfly.js`
- `node --check scripts/scenario/runner.js`
- `node --check scripts/run-n5-dialogue-behavior-follow-through-audit.js`
- `node --check scripts/run-n7-social-surfacing-audit.js`

All passed.

Focused B1 scenario:

- Command: `node scripts/run-scenario.js seed-partner-diversity-organic`
- Result: pass, `4/4` assertions
- Report: `qa_screenshots/scenario/seed-partner-diversity-organic/2026-05-03T02-28-03-798Z/report.json`

Long-soak society fixture, fast:

- Command: `node scripts/run-long-soak-society-audit.js --fast --fixture scripts/scenario/scenarios/seed-society-soak-organic.json`
- Result: `pass-with-society-warnings`
- Report: `qa_logs/long_soak_society/2026-05-03T02-28-09-203Z/report.json`
- ML-on partner repetition: `0.3056`

Long-soak society fixture, full:

- Command: `node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json`
- Result: `pass-with-society-warnings`
- Report: `qa_logs/long_soak_society/2026-05-03T02-29-17-745Z/report.json`
- ML-on partner repetition: `0.4000`
- Heuristic partner repetition: `0.3204`
- Fixture witnessed-affection events: ML-on `6`, heuristic `9`
- Fixture bond-churn hand-computed lane: observed `2`, expected `2`
- Mean distinct zones visited: ML-on `1.2857`, heuristic `1.6429`

G0H scripted playthrough:

- Command: `node scripts/run-g0h-scripted-playthrough.js`
- Result: pass, `13/13` lanes
- Report: `qa_logs/g0h_scripted_playthrough/2026-05-03T02-31-01-170Z/report.json`
- Output folder: `qa_logs/g0h_scripted_playthrough/2026-05-03T02-31-01-170Z`

Cooperation pressure:

- Command: `node scripts/run-r-cooperation-pressure-audit.js`
- Result: pass
- Report: `qa_screenshots/r_cooperation_pressure_audit/2026-05-03T02-38-19-047Z/report.json`

Dialogue behavior follow-through:

- Command: `node scripts/run-n5-dialogue-behavior-follow-through-audit.js`
- Result: pass
- Report: `qa_screenshots/n5_dialogue_behavior_follow_through_audit/2026-05-03T02-40-16-984Z/report.json`

Social surfacing:

- Command: `node scripts/run-n7-social-surfacing-audit.js`
- Result: pass
- Report: `qa_screenshots/n7_social_surfacing_audit/2026-05-03T02-40-43-741Z/report.json`

Expression naturalness:

- Command: `node scripts/run-r-expression-naturalness-audit.js`
- Result: pass
- Report: `qa_screenshots/r_expression_naturalness_audit/2026-05-03T02-40-57-325Z/report.json`
- Dialogue repetition rate: `0`

Scenario suite:

- Command: `node scripts/run-scenario.js --all`
- Result: pass, `34/34`
- Suite report paths are under `qa_screenshots/scenario/*/2026-05-03T02-41-*` through `2026-05-03T02-44-*`.

## Residuals

B1 does not close the full society target by itself.

- The long-soak report still ends as `pass-with-society-warnings` because zone migration entropy is still a stretch failure:
  - ML-on mean entropy: `0.1281`
  - ML-on mean distinct zones visited: `1.2857`
  - Expected stretch target: entropy `>= 0.50`, mean distinct zones `>= 2`
- This is the planned B4 concern, not a B1 dialogue-loop failure.

## Rollback

Set:

```js
gameConfig.communication.partnerSelection.recencyPressure = false;
```

This disables the B1 partner-recency reranking and suppression path while leaving the scenario harness and UI/audit parity fixes in place.

## Next Phase

Proceed to B2: Organic witnessed-affection exposure.

B2 should keep B1 enabled and focus on increasing organic opportunities for witnessed affection without direct life-sim helper calls, new cognition vocabulary, save schema changes, or spatial refoundation.
