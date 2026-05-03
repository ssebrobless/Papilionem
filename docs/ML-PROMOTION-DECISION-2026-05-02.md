# ML Promotion Decision - 2026-05-02

Decision: **hold m6 as a candidate; do not promote to default**.

Default remains `m4-garden-policy-v1`.

## Evidence Paths

- Corpus build: `qa_screenshots/c2_trace_corpus/2026-05-02T22-05-08-057Z/corpus-manifest.json`
- m6 training evaluation: `qa_screenshots/m6_policy_training/2026-05-02T22-09-27-675Z/m6-training-evaluation.json`
- m6 phase audit: `qa_screenshots/ml_phase_m6_audit/2026-05-02T22-19-10-098Z/report.json`
- m4 value audit: `qa_screenshots/ml_on_off_capture_audit/2026-05-02T22-21-41-183Z/report.json`
- m6 value audit: `qa_screenshots/ml_on_off_capture_audit/2026-05-02T22-22-27-665Z/report.json`

## Corpus

- Records: 191
- Scenario ids: 191
- Reviewed records: 90
- Corrected records: 79
- Corrected policy labels: 183
- Target preference records: 36
- Autobattle records: 36
- Signal choice records: 16

This clears the AA4 corpus-size and corrected-record gates.

## Held-Out Artifact Gate

Five scenario-id 80/20 split runs were evaluated.

| Policy | m6 held-out | heuristic | m4 | Gate |
| --- | ---: | ---: | ---: | --- |
| actionFamily | 0.799 | 0.648 | 0.626 | pass |
| targetPreference | 0.810 | 0.788 | 0.593 | pass |
| signalChoice | 0.660 | 0.849 | 0.637 | fail vs heuristic |
| riskPosture | 0.916 | 0.916 | 0.938 | pass vs heuristic, not m4 |
| autobattlePosture | 0.779 | 0.911 | 0.711 | fail vs heuristic |

m6 beats m4 on 4 of 5 policy families and clears the autobattle >= 0.7 target, but fails the no-regression-vs-heuristic gate for `signalChoice` and `autobattlePosture`.

## Value Gate

AA5 replaced the informationless motive chi-square metric with per-policy disagreement rate. Chi-square remains in metric details as a diagnostic.

### m4 Value Baseline

- 3/6 metrics pass.
- Per-policy disagreement rate: 0.5746.
- Target acquisition latency ratio: 0.4708.

### m6 Candidate

- 4/6 metrics pass.
- Per-policy disagreement rate: 0.5634.
- Edge churn ratio: 1.5063.
- Target acquisition latency ratio: 0.8773.
- Jitter ratio: 0.1242.
- Failing value lanes: migration entropy and top-edge fraction.

m6 clears the value gate, including target acquisition <= 1.20, but value success is not enough to override the held-out artifact regression.

## Next ML Work

- Add more corrected `signalChoice` records where warning, comfort, invitation, teaching, and quiet are all represented.
- Add more corrected `autobattlePosture` records that preserve heuristic-good cases, not only support/focus overrides.
- Re-train m7 with balanced corrected examples and the same held-out gate.
- Keep `systems/mlInferenceSystem.js` unchanged; the runtime contract remains valid.
