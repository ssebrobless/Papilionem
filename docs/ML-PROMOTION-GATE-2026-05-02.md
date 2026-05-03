# ML Promotion Gate - 2026-05-02

AA4/AA5 promotion is intentionally two-step:

1. Build `assets/ml/m6-garden-policy.json` as a candidate only.
2. Promote it to the default runtime only if the held-out artifact gate and value-band gate both pass.

## Candidate Artifact Gate

- Corpus record count >= 60.
- Corrected record count >= 12.
- Held-out split is scenario-id based, 80/20, repeated over five seeds.
- m6 held-out rate must be >= heuristic rate on every policy.
- m6 must beat m4 on at least three of five policy families.
- No m6 policy may regress more than 5 percentage points against m4.
- `autobattlePosture` held-out rate must be >= 0.7.

## Value Gate

- `run-ml-on-off-capture-audit.js` must produce informative value metrics.
- Target-acquisition latency is a hard gate: ML-on / ML-off <= 1.20.
- At least 4 of 6 value metrics must pass for m6.
- If the motive chi-square metric is informationless, per-policy disagreement rate is the replacement signal.

## Default Runtime

`m4-garden-policy-v1` remains the default until AA5 writes an explicit promotion decision and updates `core/config.js`.
