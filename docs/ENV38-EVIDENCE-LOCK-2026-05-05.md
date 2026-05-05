# ENV38 Evidence Lock - Deterministic ML Value Fixture

Date: 2026-05-05

## Scope

ENV38 added deterministic fixture support to the ML on/off value audit and introduced a top-edge/migration value fixture. This phase is measurement-only. It does not change gameplay behavior, model weights, save schema, spatial math, cognition vocabulary, or player saves.

## Files Changed

- `scripts/run-ml-on-off-capture-audit.js`
- `scripts/scenario/scenarios/seed-ml-value-top-edge-organic.json`

## What Changed

`scripts/run-ml-on-off-capture-audit.js` now accepts:

`--fixture <path>`

When provided, the audit applies the fixture in memory at the start of both the ML-on and ML-off run. It restores the captured storage snapshot afterward, so this does not mutate the player's real save.

The new fixture seeds:

- 12 butterflies
- 4 zones
- two moss-hollow top-edge starting positions
- mixed migration target pressures
- several social edges
- fixed seed `1707`

Fixture path:

`scripts/scenario/scenarios/seed-ml-value-top-edge-organic.json`

## Proofs

Syntax check:

`node --check scripts/run-ml-on-off-capture-audit.js`

- Result: pass

Fixture ML on/off audit:

`qa_screenshots/ml_on_off_capture_audit/2026-05-05T06-37-48-184Z/report.json`

- Overall: `pass`
- Fixture id: `seed-ml-value-top-edge-organic`
- ML-on model id: `m8-garden-policy-protected-slower`
- Browser clean: pass

Standalone fixture scenario:

`qa_screenshots/scenario/seed-ml-value-top-edge-organic/2026-05-05T06-38-57-732Z/report.json`

- Overall: `pass`
- Deterministic: `true`

Runtime self-audit:

`qa_screenshots/runtime_self_audit/report.json`

- Overall: `pass`

Full scenario suite:

`node scripts/run-scenario.js --all`

- Overall: `pass`
- Scenario count: `41`
- New fixture included and passing

## Fixture Value Metrics

| Metric | Result |
| --- | --- |
| per-policy-disagreement-rate | Pass: `0.888 >= 0.1` |
| edge-delta-churn-per-minute | Fail: ML `6.2762` vs off `5.7852`, ratio `1.085 < 1.15` |
| migration-target-shannon-entropy | Fail: ML `1.7582` vs off `1.6794`, ratio `1.047 < 1.1` |
| target-acquisition-latency | Fail: ML `954.38` vs off `30`, ratio `31.813 > 1.2` |
| top-15-percent-top-edge-fraction | Fail: ML `0.1536 > 0.15` |
| near-target-jitter-ratio | Fail: ML `0.0093` vs off `0`, ratio unavailable |

## Diagnostic Read

The deterministic fixture sharpened the remaining problem:

- m8 nearly clears the top-edge threshold on the fixture: `0.1536` against a `0.15` max.
- m8 is much better than fallback on top-edge in the fixture: fallback is `0.2347`.
- The dominant top-edge pressure is still moss-hollow:
  - ML on moss-hollow top fraction: `0.556`
  - ML off moss-hollow top fraction: `0.6509`
- Migration target source remains uniform:
  - ML on: `derived.travelTargetZoneId` for `5760/5760` samples
  - ML off: `derived.travelTargetZoneId` for `5760/5760` samples
- Target acquisition latency looks suspiciously unstable:
  - ML on average: `954.38`
  - ML off average: `30`
  - The worst ML-on slow acquirer had a single acquisition at `2940` frames, which suggests the metric may be overly sensitive to sparse acquisition samples.

## Honest Read

The fixture shows m8 is probably helping top-edge behavior, but not enough to pass the global threshold. It also shows target acquisition needs a better metric or a movement-target investigation before using it as a hard model-quality gate.

Recommended next phase:

1. Improve the target-acquisition metric so it reports sample sufficiency, timeout count, and "no acquisition before target changed" counts.
2. Add a deterministic assertion lane that separates "slow because model target is bad" from "slow because movement/pathing never reaches the target."
3. Only after that decide whether to tune migration derivation, movement target selection, or the model labels.

