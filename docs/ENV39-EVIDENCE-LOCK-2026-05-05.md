# ENV39 Evidence Lock - Target Acquisition Diagnostics

Date: 2026-05-05

## Scope

ENV39 improved the ML on/off value audit's target-acquisition measurement. This phase is measurement-only. It does not change game behavior, model weights, save schema, spatial math, cognition vocabulary, or player saves.

## Files Changed

- `scripts/run-ml-on-off-capture-audit.js`

## What Changed

The target-acquisition metric now reports more than successful-acquisition averages:

- `acquiredTargetCount`
- `abandonedTargetCount`
- `averageAbandonedFrames`
- `maxAbandonedFrames`
- `openTargetCount`
- `averageOpenTargetFrames`
- `maxOpenTargetFrames`

Each entity diagnostic also reports:

- `abandonedTargetCount`
- `averageAbandonedFrames`
- `openTargetDurationFrames`

This makes it possible to distinguish:

1. The model selecting poor targets.
2. Movement/pathing failing to reach otherwise reasonable targets.
3. The metric being dominated by sparse successful acquisitions.

## Proofs

Syntax check:

`node --check scripts/run-ml-on-off-capture-audit.js`

- Result: pass

Fixture run A:

`qa_screenshots/ml_on_off_capture_audit/2026-05-05T06-46-35-145Z/report.json`

- Overall: `pass`
- Browser clean: pass

Fixture run B:

`qa_screenshots/ml_on_off_capture_audit/2026-05-05T06-47-40-897Z/report.json`

- Overall: `pass`
- Browser clean: pass

## Acquisition Diagnostics

Run A:

| Scenario | Acquired | Abandoned | Avg abandoned | Open | Avg open | Max open |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ML on | 6 | 86 | 374.65 | 10 | 3729 | 7020 |
| ML off | 11 | 152 | 262.99 | 11 | 2968.64 | 7020 |

Run B:

| Scenario | Acquired | Abandoned | Avg abandoned | Open | Avg open | Max open |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ML on | 8 | 123 | 252.93 | 11 | 3578.18 | 7020 |
| ML off | 6 | 111 | 306.76 | 11 | 3844.09 | 7020 |

## Repeatability Finding

The fixture is deterministic at the scenario assertion level, but the organic value run is not stable enough to treat single-run value metrics as hard pass/fail gates.

Examples:

| Metric | Run A | Run B |
| --- | ---: | ---: |
| ML-on top-edge fraction | 0.2556 | 0.1479 |
| ML-off top-edge fraction | 0.1495 | 0.1481 |
| ML-on target latency | 507.5 | 0 |
| ML-off target latency | 639.55 | 605 |
| ML-on edge churn ratio vs off | 1.044 | 0.922 |

The useful stable signal is not a single run's pass/fail status. The useful signal is the shape:

- There are many abandoned targets in both modes.
- Most entities still have an open target at the end of the run.
- Some targets remain open for almost the whole 7200-frame window.
- Target-acquisition latency by itself is too sparse and volatile to be a hard quality gate.

## Honest Read

m8 is still valuable and still runs cleanly, but the lived-value audit needs multi-run aggregation before it can fairly guide model or behavior changes. The next phase should run the deterministic fixture multiple times and report means, standard deviation, and confidence bands for the remaining value metrics.

Recommended next phase:

1. Add `--repeat <n>` support to `scripts/run-ml-on-off-capture-audit.js`.
2. Aggregate value metrics over repeated fixture runs.
3. Gate only on aggregate direction and stable confidence, not a single volatile run.

