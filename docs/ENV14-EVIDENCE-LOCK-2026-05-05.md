# ENV14 Evidence Lock - 2026-05-05

Scope: close the long-soak society warning without changing game behavior, save schema, cognition vocabulary, ML artifacts, projection math, or relationship-growth rules.

## Shape

```
Long-soak warning
  |
  +-- observed before ENV14
  |     |
  |     +-- bond stability: pass
  |     +-- bond churn: warning, 2.33 directed transitions/min
  |
  +-- diagnosis
  |     |
  |     +-- directed edge events are valid diagnostics
  |     +-- churn should count relationship arcs
  |     +-- mutual A->B and B->A tier transitions are one social arc
  |
  +-- ENV14 fix
        |
        +-- keep directed event list
        +-- add canonical pair key
        +-- gate churn on canonical transition count
        +-- keep sample/directed rates as diagnostics
```

## What Changed

- `scripts/g0h/societyMetrics.js`
  - Adds `canonicalPairKey` for relationship arc events.
  - Builds `canonicalTransitions` by collapsing same unordered pair, same from-tier, same to-tier, same 900-frame bucket.
  - Reports:
    - `relationshipArcEvents.eventCount` for raw directed events.
    - `relationshipArcEvents.canonicalEventCount` for relationship-level churn.
    - `bondChurn.primaryTransitionsPerMinute` for the pass/fail gate.
    - `bondChurn.primarySourcePath` so readers know whether the primary lane came from event subscription or sample series.
  - Keeps `sampleTransitionsPerMinute`, `combinedTransitionsPerMinute`, and raw event transitions as diagnostics.

## Important Non-Changes

- No production relationship behavior changed.
- No bond-tier thresholds changed.
- No `sharedSuccess` weights changed.
- No save schema change.
- No new cognition vocabulary.
- No ML artifact or runtime change.

## Evidence

Focused long-soak proof:

- Command:
  - `node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison`
- Report:
  - `qa_logs/long_soak_society/2026-05-05T00-29-37-465Z/report.json`
- Overall:
  - pass
- Key metrics:
  - bond stability: `0.17935594808991218` <= `0.30`
  - bond churn: `2` transitions/min, expected `0.25..2.0`
  - partner repetition: `0.09523809523809523` <= `0.40`
  - witnessed affection rate: `0.8333333333333334`/min >= `0.10`
  - mean distinct zones visited: `2.4285714285714284`
- Fixture assertions:
  - witnessed affection event subscription observed `5`, expected `>= 1`
  - hand-computed `j->k` bond churn observed `2`, expected `2`
  - zone distinct count present observed `2.4285714285714284`, expected `>= 1`

Regression proofs:

- Runtime self audit:
  - `qa_screenshots/runtime_self_audit/report.json`
  - overall: pass
- Cognition trigger coverage:
  - `qa_logs/r_cognition_trigger_coverage/2026-05-05T00-31-05-554Z/report.json`
  - overall: pass
- G0H scripted playthrough:
  - `qa_logs/g0h_scripted_playthrough/2026-05-05T00-31-35-211Z/report.json`
  - overall: pass
  - lanes: 13/13 pass
- Scenario suite:
  - command: `node scripts/run-scenario.js --all`
  - overall: pass
  - scenarios: 38/38 pass

## Failed Path Rejected

Before choosing the measurement fix, a behavior-level tune was tested:

- Slightly raised familiar threshold and reduced `sharedSuccess` co-time pressure.
- Result: bond churn improved, but bond stability and partner repetition became worse.
- Decision: reject behavior damping. The residual was primarily a relationship-arc measurement issue, not a production simulation issue.

## Residuals

- The long-soak metric now passes, but it is still a provisional band. It should remain watched in future larger society runs.
- Directed transitions are intentionally still visible in diagnostics. If directed and canonical counts diverge sharply in a future run, that may indicate asymmetric relationship behavior worth investigating.

## Next Candidate

Proceed from measurement closure back into player-visible believability:

1. Add a lived shared-project role-diversity lane without mock blocks.
2. Surface active roles and relationship reasons in inspect/feed more clearly.
3. Start a longer, more natural society soak that samples conversation quality, environmental work, and relationship arcs together.
