# ML Value Decision - 2026-05-01

## Decision

Keep the shipped runtime on `m4-garden-policy-v1`.

`m5-garden-policy-v1` was trained and can load in the local static policy runtime, but it is not promoted because the independent artifact audit regressed several policy families on a fresh corpus rebuild.

## Candidate Artifact

- Trainer: `scripts/train-m5-garden-policy.js`
- Candidate artifact: `assets/ml/m5-garden-policy.json`
- Training evaluation: `qa_screenshots/m5_policy_training/2026-05-01T21-56-55-805Z/m5-training-evaluation.json`
- Runtime/artifact audit: `qa_screenshots/ml_phase_m4_audit/2026-05-01T21-58-16-455Z/report.json`
- Value-band audit: `qa_screenshots/ml_on_off_capture_audit/2026-05-01T22-00-02-140Z/report.json`

## Evidence

```text
training-corpus artifact match
m4: 42 / 56
m5: 55 / 56
gate: candidate-artifact-pass on the training corpus

fresh-corpus artifact audit
m5: 47 / 56
heuristic: 55 / 56
gate: hold

value-band audit with m5
metrics present: 6 / 6
metrics meeting threshold: 3 / 6
passes:
- edge-delta churn ratio: 1.91
- migration-target entropy ratio: 1.42
- target-acquisition latency ratio: 0.68
fails:
- motive chi-square: 0
- top-edge fraction: 0.1535, threshold <= 0.15
- jitter ratio: 1.10
```

## Interpretation

The trainer is real and useful, but the corpus is still too small and unstable for promotion. The model can overfit the training corpus, then lose on a newly rebuilt corpus. That is exactly why the gate exists.

Next ML work should grow the reviewed corpus and add held-out evaluation before trying to make `m5` the default.
