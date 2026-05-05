# ENV35 Evidence Lock - Promote m8 Garden Policy

Date: 2026-05-05

## Scope

ENV35 promoted the ENV34 `protected-slower` candidate as the default local/static ML artifact. This keeps the existing ML contract intact: ML scores choices, but durable emotions, memories, relationships, and social truth remain owned by the life-sim and social systems.

## Files Changed

- `assets/ml/m8-garden-policy.json`
- `core/config.js`
- `scripts/run-ml-phase-m7-audit.js`
- `scripts/run-runtime-self-audit.js`

## Promotion

Source artifact:

`qa_screenshots/m8_policy_sweep/2026-05-05T06-02-50-087Z/candidates/protected-slower.json`

Promoted artifact:

`assets/ml/m8-garden-policy.json`

Runtime config now points at:

- `modelVersionId: 'm8-garden-policy-protected-slower'`
- `policyArtifactPath: 'assets/ml/m8-garden-policy.json'`

Artifact sanity:

- Model id: `m8-garden-policy-protected-slower`
- Policies: `actionFamily`, `targetPreference`, `signalChoice`, `riskPosture`, `autobattlePosture`
- Trained from: `b6-balanced-c2-trace-corpus-heldout-ridge-linear-v1`

## Proofs

Default formal ML audit:

`qa_screenshots/ml_phase_m7_audit/2026-05-05T06-14-27-732Z/report.json`

- Overall: `pass`

Runtime self-audit:

`qa_screenshots/runtime_self_audit/report.json`

- Overall: `pass`

Pollen trace audit:

`qa_screenshots/ml_pollen_trace_audit/2026-05-05T06-18-04-149Z/report.json`

- Overall: `pass`

Scenario suite:

`qa_screenshots/scenario/seed-affection/2026-05-05T06-18-42-954Z/report.json`

- Overall: `pass`
- Scenario count: `40`

ML on/off value audit:

`qa_screenshots/ml_on_off_capture_audit/2026-05-05T06-25-24-140Z/report.json`

- Overall: `pass` because all required value metrics were present and honestly tagged.
- Value metrics meeting threshold: `2/6`

## Lived Value Metrics

| Metric | Result |
| --- | --- |
| per-policy-disagreement-rate | Pass: 0.5476 >= 0.1 |
| edge-delta-churn-per-minute | Fail: ML 5.4872 vs off 6.0024, ratio 0.914 < 1.15 |
| migration-target-shannon-entropy | Fail: ML 1.8981 vs off 1.9371, ratio 0.980 < 1.1 |
| target-acquisition-latency | Fail: ML 130.5 vs off 96.14, ratio 1.357 > 1.2 |
| top-15-percent-top-edge-fraction | Fail: ML 0.2736 > 0.15 |
| near-target-jitter-ratio | Pass: ML 0.0016 vs off 0.0025, ratio 0.640 <= 0.9 |

## Honest Read

m8 is promoted because it passes the repaired supervised artifact gate, the formal runtime audit, runtime self-audit, pollen trace audit, and the full scenario suite. This is real progress toward a functioning ML-supported society.

It is not yet proof that ML makes lived play feel more alive. The on/off audit still shows only `2/6` lived value metrics meeting threshold. The most important remaining lived-value weaknesses are target acquisition latency and top-edge clustering. The next phase should diagnose and improve those runtime value failures without changing the save schema or claiming literal consciousness.

