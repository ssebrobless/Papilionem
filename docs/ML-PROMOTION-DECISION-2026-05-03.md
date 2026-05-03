# ML Promotion Decision - m7 - 2026-05-03

Decision: **HOLD. Do not promote m7 to default. Keep m4 default.**

Phase source: `docs/CLAUDE-POST-AA8-NEXT-BELIEVABILITY-PLAN-2026-05-02.md`, B6.

## Shape

```
╔══════════════════════ m7 gate ══════════════════════╗
║ Corpus balance      PASS                            ║
║ Held-out artifact   PASS                            ║
║ Runtime contract    PASS                            ║
║ Lived value lanes   FAIL / HOLD                     ║
║ Long-soak society   WARN, not promotion-clean       ║
╚══════════════════════════════════════════════════════╝
                         │
                         ▼
            m7 remains opt-in research artifact
            m4 remains shipped default
```

## Artifact / Corpus Results

Balanced corpus build:

- Command: `node scripts/build-c2-trace-corpus.js --balance`
- Report: `qa_screenshots/c2_trace_corpus/2026-05-03T06-43-08-521Z/corpus-manifest.json`
- Result: pass
- Record count: `199`
- Corrected record count: `87`
- Balance addenda: `8` B6-tagged `autobattlePosture:retreat` records.
- Final target cells:
  - `signalChoice`: warning `20`, calming `28`, invitation `8`, teaching `22`, quiet `101`
  - `autobattlePosture`: engage `67`, support `80`, focusWeakTarget `10`, stabilize `32`, retreat `10`

Training:

- Command: `node scripts/train-m7-garden-policy.js`
- Report: `qa_screenshots/m7_policy_training/2026-05-03T07-27-43-679Z/m7-training-evaluation.json`
- Artifact: `assets/ml/m7-garden-policy.json`
- Artifact gate: pass

Held-out means:

| Family | m7 | heuristic | m4 | gate |
| --- | ---: | ---: | ---: | --- |
| actionFamily | 0.823 | 0.615 | 0.583 | pass |
| targetPreference | 0.818 | 0.818 | 0.626 | pass |
| signalChoice | 0.958 | 0.786 | 0.584 | pass |
| riskPosture | 0.937 | 0.937 | 0.942 | neutral vs heuristic; below m4 |
| autobattlePosture | 0.902 | 0.849 | 0.639 | pass |

m7 beats m4 on 4/5 policy families and clears the two protected B6 families (`signalChoice`, `autobattlePosture`) against heuristic.

Dedicated m7 audit:

- Command: `node scripts/run-ml-phase-m7-audit.js`
- Report: `qa_screenshots/ml_phase_m7_audit/2026-05-03T07-47-17-694Z/report.json`
- Result: pass

Note: full-corpus evaluation remains diagnostic in the m7 audit. The B6 promotion gate is based on held-out protected-family performance plus m4 comparison, as specified by the B6 plan.

## Lived Value Results

ML on/off value audit:

- Command: `node scripts/run-ml-on-off-capture-audit.js --policy assets/ml/m7-garden-policy.json`
- Report: `qa_screenshots/ml_on_off_capture_audit/2026-05-03T07-49-55-637Z/report.json`
- Script result: pass for measurement presence / browser health.
- Promotion value result: **fail**, only `2/6` value metrics meet threshold.

Important values:

- Migration-target Shannon entropy ratio: `1.046`, below required `>= 1.1`.
- Top-edge fraction: `0.3276`, above required `<= 0.15`.
- Near-target jitter ratio: failed because ML-on produced jitter where ML-off produced none.

Long-soak society under m7:

- Command: `node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --policy m7`
- Report: `qa_logs/long_soak_society/2026-05-03T07-51-02-976Z/report.json`
- Result: `pass-with-society-warnings`

Notable long-soak values:

- Witnessed-affection event subscription: pass.
- Cleanup-gradient: pass.
- Zone-migration entropy: pass.
- Bond churn: fail, observed `2.6667` transitions/min vs expected `0.25..2.0`.
- Partner repetition: fail, observed `0.4891` vs expected `<= 0.40`.

## Decision

m7 is a real improvement as an artifact, especially for the two weak policy families B6 targeted. It is **not** a shippable default because lived value gates do not clear:

- value lanes are `2/6`, below required `>=4/6`;
- top-edge behavior is still visibly too high;
- long-soak social behavior regresses partner repetition and bond churn.

Keep:

- `gameConfig.ml.policyArtifactPath` default on m4.
- `assets/ml/m7-garden-policy.json` as an opt-in research artifact.

Next ML work should target lived value behavior, not another artifact-only accuracy pass:

- add top-edge / migration-position outcome features to the corpus;
- add value-aware training penalties for top-edge attraction and jitter;
- add long-soak social diversity gates directly into training evaluation;
- only retry promotion when value lanes reach at least `4/6`.

