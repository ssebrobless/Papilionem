# ENV30 Evidence Lock - M8 Candidate Sweep

Date: 2026-05-05
Phase owner: Codex

## Purpose

ENV30 tested whether the pollen-expanded trace corpus can produce a promotable
candidate model through a small, bounded hyperparameter sweep.

This phase does not promote a model. It does not edit `assets/ml/*`.

## Files Changed

- `scripts/train-m7-garden-policy.js`
  - Refactored training into a reusable `trainCandidate()` function.
  - Exports training/evaluation helpers for local sweep tooling.
  - Preserves CLI behavior.

- `scripts/sweep-m8-garden-policy.js`
  - New sweep audit.
  - Builds the balanced trace corpus once.
  - Trains candidate artifacts outside `assets/ml/`.
  - Ranks candidates by promotion gate, full-corpus matches, and held-out
    regression count.
  - Reports `promote-after-formal-audit` only if a candidate clears the
    artifact gate.

## Sweep Command

```text
node scripts/sweep-m8-garden-policy.js --quick
```

Report:

```text
qa_screenshots/m8_policy_sweep/2026-05-05T05-30-05-059Z/report.json
```

## Corpus

The sweep built a fresh balanced corpus:

- Record count: 207
- Corrected record count: 95
- Corrected policy count: 207
- Scenario families:
  - autobattle
  - communication
  - ecology
  - garden
  - lived-loop
  - pollenCooperation
  - signalChoice
  - targetPreference
- Rebuild check: pass

## Candidates Tested

### env29-bounded-repeat

- Full-corpus matches: 774
- Held-out regression policy count: 2
- Artifact gate: fail
- Held-out failures:
  - targetPreference
  - autobattlePosture

### protected-slower

- Full-corpus matches: 778
- Held-out regression policy count: 2
- Artifact gate: fail
- Held-out failures:
  - targetPreference
  - autobattlePosture

Best candidate: `protected-slower`

Artifact:

```text
qa_screenshots/m8_policy_sweep/2026-05-05T05-30-05-059Z/candidates/protected-slower.json
```

Evaluation:

```text
qa_screenshots/m8_policy_sweep/2026-05-05T05-30-05-059Z/training-runs/protected-slower/m7-training-evaluation.json
```

Best candidate held-out means:

| Policy | Candidate | Heuristic | m4 | Gate |
| --- | ---: | ---: | ---: | --- |
| actionFamily | 0.714 | 0.594 | 0.521 | pass |
| targetPreference | 0.693 | 0.849 | 0.689 | fail vs heuristic |
| signalChoice | 0.879 | 0.802 | 0.668 | pass |
| riskPosture | 0.860 | 0.860 | 0.860 | pass |
| autobattlePosture | 0.746 | 0.873 | 0.595 | fail vs heuristic |

Recommendation from sweep:

```text
hold-default-and-investigate-label-balance
```

## Regression Proofs

| Command | Result | Report |
| --- | --- | --- |
| `node --check scripts/train-m7-garden-policy.js` | pass | n/a |
| `node --check scripts/sweep-m8-garden-policy.js` | pass | n/a |
| `node scripts/sweep-m8-garden-policy.js --quick` | pass, no promotion | `qa_screenshots/m8_policy_sweep/2026-05-05T05-30-05-059Z/report.json` |
| `node scripts/run-ml-pollen-trace-audit.js` | pass | `qa_screenshots/ml_pollen_trace_audit/2026-05-05T05-37-32-945Z/report.json` |
| `node scripts/run-runtime-self-audit.js` | pass | `qa_screenshots/runtime_self_audit/report.json` |
| `node scripts/run-scenario.js seed-pollen-cooperation-organic` | pass | `qa_screenshots/scenario/seed-pollen-cooperation-organic/2026-05-05T05-37-41-484Z/report.json` |

## Honest Verdict

Do not promote any candidate.

The sweep shows that the new corpus and trainer can produce candidates that
beat m4 and improve full-corpus totals, but they still do not generalize better
than the heuristic on the two remaining weak policy families:

- `targetPreference`
- `autobattlePosture`

This points away from "just train longer" and toward one of these causes:

1. Label conflict in scenarios that expect different target choices from similar
   feature states.
2. Corpus imbalance, especially for targetPreference and autobattlePosture.
3. Missing feature distinctions for battle posture and target selection.
4. Overbroad corrected labels applied to multi-entity scenarios.

## Recommended Next Step

ENV31 should diagnose label conflict and feature separability before any more
training attempts.

Suggested owner file:

- `scripts/analyze-ml-label-conflicts.js`

Suggested report:

- group records by policy family,
- group by scenario family and corrected label,
- compute nearest-neighbor feature conflicts for `targetPreference` and
  `autobattlePosture`,
- list records where the same or very similar feature signatures require
  incompatible labels,
- recommend whether the fix is more labels, better feature fields, or narrower
  scenario corrections.

No artifact promotion should happen until ENV31 explains why the candidates keep
losing to the heuristic on those families.
