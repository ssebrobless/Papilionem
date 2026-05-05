# ENV29 Evidence Lock - Candidate ML Retrain With Pollen Corpus

Date: 2026-05-05
Phase owner: Codex

## Purpose

ENV29 tested whether the ENV27/ENV28 pollen-expanded trace corpus is enough to
produce a stronger candidate garden policy. The candidate was intentionally
written outside `assets/ml/` so the default shipped model was not changed.

## Files Changed

- `scripts/train-m7-garden-policy.js`
  - Adds `--output-artifact` so candidate artifacts can be written outside
    `assets/ml/`.
  - Adds `--model-version`.
  - Adds bounded training knobs:
    - `--epochs`
    - `--protected-epochs`
    - `--lambda`
    - `--learning-rate`
    - `--protected-lambda`
    - `--protected-learning-rate`

No model artifact in `assets/ml/` was changed.

## Training Attempts

### Attempt 1 - full default epoch budget

Command:

```text
node scripts/train-m7-garden-policy.js --output-artifact qa_screenshots/m8_candidate_policy/m8-garden-policy-candidate.json --model-version m8-garden-policy-candidate-env29
```

Result: timed out after 15 minutes.

Finding: corpus generation completed, but ridge training did not finish within
the command budget. This justified adding explicit candidate-training epoch
controls instead of pretending the default budget is always practical for
iteration.

### Attempt 2 - bounded candidate run

Command:

```text
node scripts/train-m7-garden-policy.js --output-artifact qa_screenshots/m8_candidate_policy/m8-garden-policy-candidate.json --model-version m8-garden-policy-candidate-env29 --epochs 120 --protected-epochs 180
```

Result: `candidate-artifact-hold`.

Output artifact:

```text
qa_screenshots/m8_candidate_policy/m8-garden-policy-candidate.json
```

Evaluation:

```text
qa_screenshots/m7_policy_training/2026-05-05T05-14-34-353Z/m7-training-evaluation.json
```

## Candidate Result

Full training corpus summary:

- Record count: 207
- Evaluated policy decisions: 955
- Candidate matches: 818
- Heuristic matches: 760
- m4 matches: 641

The candidate is better than m4 and better than heuristic on the full training
corpus total, but it fails the held-out promotion gate.

Held-out per-policy means:

| Policy | Candidate | Heuristic | m4 | Gate |
| --- | ---: | ---: | ---: | --- |
| actionFamily | 0.745 | 0.594 | 0.521 | pass |
| targetPreference | 0.771 | 0.828 | 0.636 | fail vs heuristic |
| signalChoice | 0.912 | 0.859 | 0.730 | pass |
| riskPosture | 0.860 | 0.860 | 0.808 | pass |
| autobattlePosture | 0.829 | 0.873 | 0.610 | fail vs heuristic |

Promotion gate:

- corpusRecordCountAtLeastSixty: pass
- correctedRecordCountAtLeastTwelve: pass
- beatsM4PolicyCountHeldOut: 5/5
- noM4RegressionWorseThanFivePercent: pass
- autobattlePostureAtLeastPointSeven: pass
- noHeuristicRegressionHeldOut: fail
- protectedPolicyNoHeuristicRegressionHeldOut: fail
- artifactGatePass: false

## Formal Audit

Command:

```text
node scripts/run-ml-phase-m7-audit.js --policy qa_screenshots/m8_candidate_policy/m8-garden-policy-candidate.json
```

Result: `warn`, not pass.

Report:

```text
qa_screenshots/ml_phase_m7_audit/2026-05-05T05-18-36-920Z/report.json
```

Formal full-corpus evaluation in that audit:

- Candidate matches: 764
- Heuristic matches: 760
- Corrected improvements: 76
- Signal choice still trails heuristic: 147 vs 159
- Autobattle posture still trails heuristic: 166 vs 181
- Held-out gate fails for targetPreference and autobattlePosture.

## Regression Proofs

| Command | Result | Report |
| --- | --- | --- |
| `node --check scripts/train-m7-garden-policy.js` | pass | n/a |
| `node scripts/run-ml-pollen-trace-audit.js` | pass | `qa_screenshots/ml_pollen_trace_audit/2026-05-05T05-21-24-822Z/report.json` |
| `node scripts/run-runtime-self-audit.js` | pass | `qa_screenshots/runtime_self_audit/report.json` |
| `node scripts/run-scenario.js seed-pollen-cooperation-organic` | pass | `qa_screenshots/scenario/seed-pollen-cooperation-organic/2026-05-05T05-21-32-552Z/report.json` |

## Honest Verdict

Do not promote the candidate.

The expanded corpus and bounded trainer are moving in the right direction:

- Candidate beats m4 on all five policy families in held-out means.
- Candidate beats the heuristic on full-corpus total.
- Pollen/environmental object work is now represented.

But it is not yet good enough for the "real AI" goal because the candidate still
loses to the existing heuristic in two important generalization areas:

- `targetPreference`: where to direct attention or effort.
- `autobattlePosture`: battle decision posture.

That means the model is not yet a reliable improvement over hand-authored logic.

## Recommended Next Step

ENV30 should improve training quality rather than ship a new model.

Recommended direction:

1. Add a compact hyperparameter sweep script that tries a small matrix of epoch
   counts, protected-policy weights, and lambda values without rewriting
   `assets/ml/`.
2. Report per-policy held-out results for every candidate.
3. Select a candidate only if it clears:
   - no held-out regression vs heuristic in all five policy families,
   - beats m4 on at least four policy families,
   - does not fall below the current m7 default on protected policies,
   - formal `run-ml-phase-m7-audit.js --policy <candidate>` returns pass.

Do not increase corpus volume blindly until the sweep shows whether the current
failure is due to hyperparameters, corpus balance, or label conflict.
