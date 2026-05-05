# ENV36 Evidence Lock - m8 Lived-Value Audit Correction

Date: 2026-05-05

## Scope

ENV36 corrected the ML on/off value audit so its default policy artifact is resolved from the shipped runtime config instead of a stale hard-coded m4 path. This phase changes audit measurement only; it does not change game behavior, save schema, ML weights, spatial logic, or cognition vocabulary.

## Root Cause

After ENV35 promoted m8, `scripts/run-ml-on-off-capture-audit.js` still defaulted to:

`assets/ml/m4-garden-policy.json`

That meant the earlier `2/6` lived-value result was a real measurement, but it measured m4 unless `--policy` was manually supplied. The audit now parses `core/config.js` for `gameConfig.ml.policyArtifactPath` and falls back to m8 if the config path cannot be read.

## Files Changed

- `scripts/run-ml-on-off-capture-audit.js`

## Proofs

Syntax check:

`node --check scripts/run-ml-on-off-capture-audit.js`

- Result: pass

Corrected ML on/off value audit:

`qa_screenshots/ml_on_off_capture_audit/2026-05-05T06-29-42-805Z/report.json`

- Overall: `pass`
- Policy artifact path: `assets/ml/m8-garden-policy.json`
- ML-on model id: `m8-garden-policy-protected-slower`
- Value metrics meeting threshold: `4/6`

## Corrected Lived-Value Metrics

| Metric | Result |
| --- | --- |
| per-policy-disagreement-rate | Pass: `0.909 >= 0.1` |
| edge-delta-churn-per-minute | Pass: ML `7.8277` vs off `6.1499`, ratio `1.273 >= 1.15` |
| migration-target-shannon-entropy | Fail: ML `1.8522` vs off `1.9713`, ratio `0.940 < 1.1` |
| target-acquisition-latency | Pass: ML `27.75` vs off `77.25`, ratio `0.359 <= 1.2` |
| top-15-percent-top-edge-fraction | Fail: ML `0.2795 > 0.15` |
| near-target-jitter-ratio | Pass: ML `0` vs off `0.0015`, ratio `0 <= 0.9` |

## Honest Read

Correcting the audit materially changes the read on m8. The promoted model is not merely stronger in supervised artifact space; it also improves lived runtime value from the prior stale `2/6` read to `4/6` when the audit actually runs against the shipped m8 artifact.

The remaining ML value gaps are now focused and concrete:

1. Migration target entropy is too low. m8 appears to concentrate choices more than the heuristic fallback.
2. Top-edge occupancy is still too high. m8 reduces top-edge clustering slightly compared with fallback, but not enough to hit the acceptance bar.

Recommended next phase: add a focused value-gap diagnostic that breaks the two remaining failures down by entity, zone, target preference, and movement target source before changing behavior or retraining. That keeps the next intervention honest and avoids blindly tuning the model.

