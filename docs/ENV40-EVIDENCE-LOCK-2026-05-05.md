# ENV40 Evidence Lock - Repeated ML Value Aggregation

Date: 2026-05-05

## Scope

ENV40 added repeated-run aggregation to the ML on/off value audit. This phase is measurement-only. It does not change game behavior, model weights, save schema, spatial math, cognition vocabulary, UI, or player saves.

## Files Changed

- `scripts/run-ml-on-off-capture-audit.js`

## What Changed

`scripts/run-ml-on-off-capture-audit.js` now accepts:

`--repeat <n>`

When repeat is greater than 1, the report includes:

- `valueMetricRuns`: per-run value metrics and fixture summaries
- aggregate metric means
- standard deviations
- pass counts
- pass rates
- per-run metric values

This lets the audit judge value direction across repeated organic runs instead of treating one volatile run as final truth.

## Proofs

Syntax check:

`node --check scripts/run-ml-on-off-capture-audit.js`

- Result: pass

Repeated fixture value audit:

`qa_screenshots/ml_on_off_capture_audit/2026-05-05T06-51-04-404Z/report.json`

- Overall: `pass`
- Repeat count: `3`
- Fixture: `seed-ml-value-top-edge-organic`
- Browser clean: pass
- ML-on model id: `m8-garden-policy-protected-slower`

## Aggregate Metrics

| Metric | Pass rate | ML-on mean | ML-off mean | Ratio mean | Read |
| --- | ---: | ---: | ---: | ---: | --- |
| per-policy-disagreement-rate | 3/3 | 0.8779 | n/a | n/a | Strong source distinction |
| edge-delta-churn-per-minute | 2/3 | 6.3287 | 4.9196 | 1.2999 | Usually improves social movement |
| migration-target-shannon-entropy | 0/3 | 1.7717 | 1.7886 | 0.9923 | Does not improve zone diversity |
| target-acquisition-latency | 1/3 | 380.4167 | 353.41 | 12.7543 | Too volatile and not reliable |
| top-15-percent-top-edge-fraction | 0/3 | 0.1971 | 0.1682 | n/a | Still fails top-edge gate |
| near-target-jitter-ratio | 2/3 | 0.0006 | 0.0044 | 0.3276 | Usually improves stability near target |

## Honest Read

m8 is a real ML improvement over m4 in supervised artifact space and it does create meaningful source distinction in lived play. It also often improves social edge churn and near-target jitter.

It is not yet a full lived-society win. The repeated fixture shows three remaining issues:

1. Migration target diversity is not improved by m8.
2. Top-edge occupancy still fails the acceptance bar.
3. Target acquisition remains too volatile to use as a simple average-latency gate.

This means the next product-facing improvement should not be another blind model promotion. The next phase should trace why `derived.travelTargetZoneId` concentrates entities into those zones/edges and decide whether the fix belongs in migration derivation, movement target placement, or training labels.

## Recommended Next Phase

ENV41 should be a code-level migration/top-edge root-cause audit:

1. Inspect the systems that write `lifeSim.derived.migration.travelTargetZoneId`.
2. Add a diagnostic trace for the chosen zone, reason, and target board coordinate.
3. Identify whether top-edge clustering is caused by zone choice, edge-travel arrival placement, target generation, or movement not leaving an edge band after arrival.
4. Do not change behavior until the writer and coordinate source are identified.

