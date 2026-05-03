# B0 Evidence Lock - 2026-05-03

Phase: B0 - Long-soak measurement honesty + society-soak fixture  
Binding plan: `docs/CLAUDE-POST-AA8-NEXT-BELIEVABILITY-PLAN-2026-05-02.md`

## Verdict

B0 is complete. The long-soak harness now distinguishes event-subscription truth from sample-snapshot diagnostics, and the deterministic society-soak fixture proves the new measurement path without touching gameplay systems.

No files under `systems/`, `core/config.js`, `ui/`, `assets/ml/`, or save logic were changed.

```text
+-------------------------------+-----------------------------+
| B0 Gate                       | Result                      |
+-------------------------------+-----------------------------+
| witnessed affection event path | PASS                        |
| seeded bond churn expectation | PASS                        |
| zone distinct-count reporting | PASS                        |
| G0H scripted playthrough      | PASS, 13/13                 |
| scenario suite                | PASS, 33/33                 |
| gameplay behavior changes     | NONE                        |
+-------------------------------+-----------------------------+
```

## Changed Files

- `scripts/g0h/societyMetrics.js`
- `scripts/run-long-soak-society-audit.js`
- `scripts/scenario/scenarios/seed-society-soak-organic.json`

## Measurement Changes

### Witnessed Affection

Old long-soak behavior:

- counted only witnessed-affection packets present in the final sampled packet snapshot,
- missed events when packets decayed before the final sample.

New long-soak behavior:

- subscribes to `cognition:triggered`,
- accumulates events for the full run,
- reports witnessed-affection rate from `event-subscription:cognition:triggered`,
- keeps the old latest-packet count as `sample-snapshot:latest-packets` diagnostic data.

### Bond Churn

Bond churn now walks each directed pair's chronological `bondTier` sample series and counts non-equal tier transitions while ignoring unobserved gaps.

The fixture hand-computed transition:

```text
j -> k starts acquaintance
120s: j -> k becomes familiar
240s: j -> k becomes companion

Expected seeded transitions for j -> k = 2
```

The full fixture run observed 2 seeded `j -> k` transitions exactly. It also observed additional organic tier transitions, which are preserved as real data instead of being hidden.

### Zone Migration Entropy

The zone metric now reports:

- existing mean Shannon entropy,
- `meanDistinctZonesVisited`,
- per-entity distinct-zone counts,
- source path `sample-series:entity.zoneId`.

## Proof Reports

### Fast Fixture

Command:

```bash
node scripts/run-long-soak-society-audit.js --fast --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison
```

Report:

`C:\Users\fishe\Documents\projects\ephemera\qa_logs\long_soak_society\2026-05-03T00-47-03-254Z\report.json`

Result:

- overall: `pass-with-society-warnings`
- fixture witnessed-affection event assertion: pass, observed 5
- fixture bond-churn assertion: pass, observed 2 for seeded `j -> k`
- fixture zone distinct-count assertion: pass, observed 1.25

### Full Fixture

Command:

```bash
node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json
```

Report:

`C:\Users\fishe\Documents\projects\ephemera\qa_logs\long_soak_society\2026-05-03T00-47-39-878Z\report.json`

Result:

- overall: `pass-with-society-warnings`
- ML-on witnessed-affection event assertion: pass, observed 9
- ML-on seeded bond-churn assertion: pass, observed 2 for seeded `j -> k`
- ML-on zone distinct-count assertion: pass, observed 1.2142857142857142
- heuristic witnessed-affection event assertion: pass, observed 7
- heuristic seeded bond-churn assertion: pass, observed 2 for seeded `j -> k`
- heuristic zone distinct-count assertion: pass, observed 1.2857142857142858

The society warnings are expected B1-B4 product signals, not B0 failures:

- partner repetition remains high,
- zone migration entropy remains low,
- bond stability remains above the later target.

### G0H

Command:

```bash
node scripts/run-g0h-scripted-playthrough.js
```

Report:

`C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-03T00-49-23-055Z\report.json`

Result:

- overall: `pass`
- lanes: 13/13
- residuals: none

### Scenario Suite

Command:

```bash
node scripts/run-scenario.js --all
```

Result:

- overall: `pass`
- scenario count: 33/33
- new scenario: `seed-society-soak-organic`
- new scenario report: `C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\scenario\seed-society-soak-organic\2026-05-03T00-59-38-436Z\report.json`

## Current Believability Read After B0

B0 did not change butterfly behavior. It made the long-soak measurement honest enough for B1-B5.

```text
+--------------------------+-----------------------------+
| Signal                   | Current Meaning             |
+--------------------------+-----------------------------+
| witnessed-affection rate | now measured from live      |
|                          | cognition events            |
| partner repetition       | still a real B1 problem     |
| zone entropy             | still a real B4 problem     |
| bond churn               | metric can now verify seeded|
|                          | pair transitions exactly    |
| cleanup gradient         | still a later ecology issue |
+--------------------------+-----------------------------+
```

## Next Phase

Proceed to B1 only after user review.

B1 should target social partner diversity and recency pressure. The B0 fixture is now available for B1 acceptance:

```bash
node scripts/run-long-soak-society-audit.js --fast --fixture scripts/scenario/scenarios/seed-society-soak-organic.json
node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json
```

