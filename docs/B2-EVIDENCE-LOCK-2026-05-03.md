# B2 Evidence Lock - Organic Witnessed-Affection Exposure - 2026-05-03

Phase source: `docs/CLAUDE-POST-AA8-NEXT-BELIEVABILITY-PLAN-2026-05-02.md`, section 5, B2.

## Verdict

B2 is landed and proof-green.

The goal was to make witnessed affection emerge through production dialogue paths, without direct life-sim helper calls or new cognition vocabulary.

```
positive dialogue candidate
    │
    ├── not recent partner ──▶ small opportunity bias if:
    │                           bonded source-target pair
    │                           companion+ witness nearby
    │                           same zone, board distance <= 8
    │
    └── dialogue spoken ─────▶ lifeSimSystem.recordWitnessedAffection
                                │
                                ├── companion+ witness gate preserved
                                ├── distance widened 6 -> 8 board units
                                ├── packet decay 1800 -> 5400 frames
                                └── cognition:triggered event emitted
```

Measured full long-soak fixture:

- ML-on witnessed-affection event rate: `1.3333/min` (`8` events / 6 min)
- Heuristic witnessed-affection event rate: `1.6667/min` (`10` events / 6 min)
- ML-on partner repetition stayed green: `0.3433`
- Heuristic partner repetition stayed green: `0.3011`
- G0H stayed `13/13`
- Scenario suite is now `35/35`, with `seed-witness-affection-organic` added

## Implementation Summary

Primary B2 changes:

- `core/config.js`
  - Expanded `gameConfig.cognition.jealousy` to include `witnessedAffection` config:
    - `exposureBias: true`
    - `distanceUnits: 8`
    - `decayFrames: 5400`
    - `opportunityBoost: 0.08`

- `systems/lifeSimSystem.js`
  - `recordWitnessedAffection` now reads distance and decay from config.
  - Witness board-distance gate is `8` by default, while preserving the companion+ bond gate.
  - Witnessed-affection packets now survive for `5400` frames by default.
  - Adjacent packet pruning now uses the same configured decay window instead of the old 60-second hardcode.

- `systems/communicationSystem.js`
  - Added a small witnessed-affection opportunity bias in partner candidate scoring.
  - Bias applies only for positive-intent signals and bonded source-target candidates with a companion+ witness nearby.
  - Bias does **not** apply if the target is currently under B1 recency pressure, preventing a regression to tight pair loops.

- `scripts/scenario/scenarios/seed-witness-affection-organic.json`
  - New deterministic organic fixture.
  - Queues a production `emit_signal` path from a bonded pair while a companion+ witness is nearby.
  - Asserts:
    - production `witnessedAffection` cognition event fires,
    - packet survives after the fixture advances cognition,
    - jealousy derived feeling is present,
    - no direct life-sim helper call is used.

Support change:

- `scripts/scenario/runner.js`
  - Added a persistent scenario-local `cognition:triggered` subscriber.
  - Added `cognition_event_count` assertion.
  - This mirrors the G0H/B0 evidence fix: scenario assertions no longer depend on the global 250-entry event history ring.

## Proofs

Syntax checks:

- `node --check core/config.js`
- `node --check systems/lifeSimSystem.js`
- `node --check systems/communicationSystem.js`
- `node --check scripts/scenario/runner.js`

All passed.

Focused B2 scenario:

- Command: `node scripts/run-scenario.js seed-witness-affection-organic`
- Result: pass, `7/7` assertions
- Report: `qa_screenshots/scenario/seed-witness-affection-organic/2026-05-03T03-02-41-299Z/report.json`
- Run report: `qa_screenshots/scenario/seed-witness-affection-organic/2026-05-03T03-02-36-048Z/run-1/report.json`
- Production event: `witnessedAffection`, trigger `dialogueWitnessed`, intensity `0.752`
- Surviving packet: `>= 1` after cognition advance
- Derived jealousy: `0.752`

Long-soak society fixture, fast:

- Command: `node scripts/run-long-soak-society-audit.js --fast --fixture scripts/scenario/scenarios/seed-society-soak-organic.json`
- Result: `pass-with-society-warnings`
- Report: `qa_logs/long_soak_society/2026-05-03T03-02-45-781Z/report.json`
- ML-on witnessed-affection rate: `1.25/min`
- ML-on partner repetition: `0.3158`

Long-soak society fixture, full:

- Command: `node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json`
- Result: `pass-with-society-warnings`
- Report: `qa_logs/long_soak_society/2026-05-03T03-03-50-056Z/report.json`
- ML-on witnessed-affection rate: `1.3333/min`
- Heuristic witnessed-affection rate: `1.6667/min`
- ML-on partner repetition: `0.3433`
- Heuristic partner repetition: `0.3011`
- ML-on bond stability: `0.1728`

G0H scripted playthrough:

- Command: `node scripts/run-g0h-scripted-playthrough.js`
- Result: pass, `13/13`
- Report: `qa_logs/g0h_scripted_playthrough/2026-05-03T03-05-27-574Z/report.json`
- Output folder: `qa_logs/g0h_scripted_playthrough/2026-05-03T03-05-27-574Z`

Cognition trigger coverage:

- Command: `node scripts/run-r-cognition-trigger-coverage-audit.js`
- Result: pass
- Report: `qa_logs/r_cognition_trigger_coverage/2026-05-03T03-12-43-902Z/report.json`
- Trigger counts include `witnessedAffection:dialogueWitnessed: 1`

Expression naturalness:

- Command: `node scripts/run-r-expression-naturalness-audit.js`
- Result: pass
- Report: `qa_screenshots/r_expression_naturalness_audit/2026-05-03T03-12-43-902Z/report.json`
- Distinct templates: `9`
- Named memory dialogue count: `10`
- Dialogue repetition: `0`
- Report includes `phraseTemplateId: memory:social:witnessedAffection`

Scenario suite:

- Command: `node scripts/run-scenario.js --all`
- Result: pass, `35/35`
- The B2 fixture appears at:
  - `qa_screenshots/scenario/seed-witness-affection-organic/2026-05-03T03-16-45-039Z/report.json`

## Residuals

B2 does not close the full long-soak warning set.

- Cleanup gradient is still weak in the full fixture:
  - ML-on `nonPositiveFraction: 0.5`
  - Target is `< 0.50`
  - This is the planned B5 ecology-pressure concern.
- Zone migration entropy is still low:
  - ML-on mean entropy: `0.0838`
  - Mean distinct zones visited: `1.2143`
  - This is the planned B4 migration-pressure concern.

These are not B2 witnessed-affection failures.

## Rollback

Set:

```js
gameConfig.cognition.jealousy.witnessedAffection.exposureBias = false;
```

This disables only the communication-system opportunity bias. Distance and decay remain configurable at:

```js
gameConfig.cognition.jealousy.witnessedAffection.distanceUnits
gameConfig.cognition.jealousy.witnessedAffection.decayFrames
```

## Next Phase

The plan says a human capture becomes meaningfully useful after B0+B1+B2 because measurement honesty, partner variety, and witnessed affection are now visible. If continuing implementation before capture, the next planned phase is B3: relationship arc dynamics, focused on bond-tier change over lived events without adding new memory vocabulary.
