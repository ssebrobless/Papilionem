# ENV31 Evidence Lock - ML Label Conflict Diagnosis

Date: 2026-05-05
Phase owner: Codex

## Purpose

ENV30 showed that bounded M8 candidates still lose to the heuristic on
`targetPreference` and `autobattlePosture`. ENV31 diagnoses why before any more
training attempts.

## Files Changed

- `scripts/analyze-ml-label-conflicts.js`
  - New diagnostic script.
  - Loads an existing corpus or builds a fresh one.
  - Analyzes `targetPreference` and `autobattlePosture`.
  - Groups label counts by policy and scenario family.
  - Finds nearest-neighbor conflicts where very similar flat-feature vectors
    require incompatible training labels.

## Command

```text
node scripts/analyze-ml-label-conflicts.js --records qa_screenshots/m8_policy_sweep/2026-05-05T05-30-05-059Z/c2_trace_corpus/2026-05-05T05-30-05-072Z/corpus-records.json --manifest qa_screenshots/m8_policy_sweep/2026-05-05T05-30-05-059Z/c2_trace_corpus/2026-05-05T05-30-05-072Z/corpus-manifest.json
```

Report:

```text
qa_screenshots/ml_label_conflict_analysis/2026-05-05T05-39-43-990Z/report.json
```

## Result

Overall: pass.

Corpus:

- Source: provided ENV30 sweep records
- Record count: 207
- Manifest record count: 207

## Target Preference Diagnosis

Record count: 187

Label counts:

| Label | Count |
| --- | ---: |
| emptySpace | 126 |
| butterfly | 36 |
| block | 17 |
| shelter | 8 |

Near-conflict count: 32

Diagnosis:

```text
feature-ambiguous-label-conflicts
```

Representative closest conflict:

```text
seed-target-distress-vs-flower-a-f20-r14-1
  label: butterfly
  corrected: true
  heuristic: emptySpace

seed-signal-warn-incoming-harm-b-f20-r21-2
  label: emptySpace
  corrected: false
  heuristic: emptySpace

distance: 0.06375
```

Interpretation:

The targetPreference training set is polluted by records from scenarios whose
primary purpose is not target selection. Those records keep heuristic-derived
labels such as `emptySpace`, and they sit close to corrected targetPreference
examples that intentionally expect `butterfly`.

## Autobattle Posture Diagnosis

Record count: 207

Label counts:

| Label | Count |
| --- | ---: |
| support | 83 |
| engage | 63 |
| stabilize | 41 |
| focusWeakTarget | 10 |
| retreat | 10 |

Near-conflict count: 170

Diagnosis:

```text
feature-ambiguous-label-conflicts
```

Representative closest conflict:

```text
seed-autobattle-pursue-fleeing-rival-b-f20-r19-2
  label: focusWeakTarget
  corrected: true
  heuristic: engage

seed-autobattle-restore-bonded-b-f20-r20-2
  label: support
  corrected: true
  heuristic: engage

distance: 0.00908
```

Interpretation:

The battle feature vectors are too similar for different corrected battle labels.
The trainer cannot reliably distinguish `focusWeakTarget` from `support` when the
captured features barely differ. This is a feature-separability problem, not just
an epoch-count problem.

## Honest Verdict

Do not train again yet.

The evidence points to two separate issues:

1. `targetPreference`: corpus-label contamination. Non-target scenarios are
   contributing targetPreference labels that should probably be diagnostic, not
   training labels.
2. `autobattlePosture`: feature ambiguity. Corrected battle scenarios need
   stronger battle-context features or narrower fixture setup before training can
   separate support/focus/engage correctly.

## Recommended Next Step

ENV32 should narrow training-label ownership.

Recommended direction:

- Add a corpus-level `trainingPolicies` allow-list.
- In scenario JSON, allow:
  - `"trainingPolicies": ["targetPreference", "actionFamily"]`
  - or infer from `correctedLabels` when not provided.
- In `mlInferenceSystem.buildCorpusRecord`, keep predictions and diagnostics for
  all policies, but only emit `trainingLabels` for policies owned by the scenario.
- Rebuild the corpus and rerun ENV31.

This should reduce targetPreference label contamination before another candidate
sweep.

ENV33 can then address autobattle feature separability if the battle conflict
remains after label ownership is fixed.
