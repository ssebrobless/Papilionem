# ENV32 Evidence Lock - Corpus Training-Policy Ownership

Date: 2026-05-05
Phase owner: Codex

## Purpose

ENV31 showed that `targetPreference` candidates were losing because the corpus
contained contaminated labels: non-target scenarios were still contributing
heuristic target labels. ENV32 narrows corpus training labels so scenarios only
train the policy families they own.

Diagnostics remain broad. Training labels become narrow.

## Files Changed

- `systems/mlInferenceSystem.js`
  - `buildReviewedLabels()` now accepts an optional `trainingPolicies` allow-list.
  - `buildCorpusRecord()` and `buildBattleCorpusRecord()` pass through
    `trainingPolicies`.
  - Corpus records now persist `review.trainingPolicies` for audit clarity.

- `scripts/build-c2-trace-corpus.js`
  - Adds training-policy inference for lived-loop scenario corpus configs.
  - Curated garden object focus trains `actionFamily` + `targetPreference`.
  - Curated communication teaching trains `actionFamily` + `signalChoice`.
  - Curated autobattle records train `autobattlePosture`.
  - Ecology return-home record is diagnostic-only for now.
  - Lived-loop scenarios infer `trainingPolicies` from corrected labels unless
    explicitly configured.

## Before / After Shape

```text
Before ENV32
  every garden corpus record
    -> trainingLabels for all heuristic policy families
    -> targetPreference polluted by signal/social/ecology records

After ENV32
  every corpus record
    -> keeps activeTrace + heuristicTrace diagnostics
    -> emits trainingLabels only for owned policies
```

## Proofs

| Command | Result | Report |
| --- | --- | --- |
| `node --check systems/mlInferenceSystem.js` | pass | n/a |
| `node --check scripts/build-c2-trace-corpus.js` | pass | n/a |
| `node --check scripts/analyze-ml-label-conflicts.js` | pass | n/a |
| `node scripts/build-c2-trace-corpus.js --balance` | pass | `qa_screenshots/c2_trace_corpus/2026-05-05T05-42-23-079Z/corpus-manifest.json` |
| `node scripts/analyze-ml-label-conflicts.js --records qa_screenshots/c2_trace_corpus/2026-05-05T05-42-23-079Z/corpus-records.json --manifest qa_screenshots/c2_trace_corpus/2026-05-05T05-42-23-079Z/corpus-manifest.json` | pass | `qa_screenshots/ml_label_conflict_analysis/2026-05-05T05-44-38-788Z/report.json` |
| `node scripts/run-ml-phase-m7-audit.js` | pass | `qa_screenshots/ml_phase_m7_audit/2026-05-05T05-44-47-996Z/report.json` |
| `node scripts/run-ml-pollen-trace-audit.js` | pass | `qa_screenshots/ml_pollen_trace_audit/2026-05-05T05-44-48-000Z/report.json` |
| `node scripts/run-runtime-self-audit.js` | pass | `qa_screenshots/runtime_self_audit/report.json` |
| `node scripts/run-scenario.js --all` | pass, 40/40 | first report: `qa_screenshots/scenario/seed-affection/2026-05-05T05-47-42-791Z/report.json` |

## Corpus Result

Balanced corpus after ENV32:

- Record count: 237
- Corrected record count: 125
- Corrected policy count: 252
- Rebuild check: pass

The record count increased because the balancer now sees fewer accidental labels
and fills policy/label gaps more intentionally.

## Conflict Analysis Result

### targetPreference

Before ENV32:

- Record count: 187
- Near conflicts: 32
- Diagnosis: `feature-ambiguous-label-conflicts`

After ENV32:

- Record count: 53
- Label counts:
  - block: 1
  - emptySpace: 16
  - butterfly: 28
  - shelter: 8
- Near conflicts: 0
- Diagnosis: `healthy-enough`

Verdict: targetPreference contamination is closed.

### autobattlePosture

After ENV32:

- Record count: 59
- Label counts:
  - support: 19
  - engage: 10
  - focusWeakTarget: 10
  - stabilize: 10
  - retreat: 10
- Near conflicts: 162
- Diagnosis: `feature-ambiguous-label-conflicts`

Verdict: autobattle remains a feature-separability problem.

## M7 Diagnostic Audit

`run-ml-phase-m7-audit.js` remains overall pass because its promotion decision
uses the artifact's locked held-out gate, which still passes.

The diagnostic full-corpus evaluation now shows:

- targetPreference: m7 41/53 vs heuristic 17/53
- signalChoice: m7 36/60 vs heuristic 24/60
- autobattlePosture: m7 16/59 vs heuristic 25/59

This is the expected result: targetPreference is now much cleaner, while battle
posture still needs better distinguishing context before retraining.

## Honest Verdict

ENV32 fixed the corpus-label ownership problem for targetPreference.

Do not promote a new candidate yet. The next blocker is not target labels; it is
autobattle feature ambiguity.

## Recommended Next Step

ENV33 should improve autobattle feature separability.

Recommended focus:

- Inspect `buildBattleParticipantFeatureBundle()`.
- Add or expose battle-specific flat features that distinguish:
  - bonded ally needing support,
  - fleeing/weak rival focus opportunity,
  - self danger / retreat pressure,
  - stabilize posture under mixed pressure,
  - plain engage.
- Add an audit lane that reruns `analyze-ml-label-conflicts.js` and requires
  autobattle near-conflicts to drop meaningfully before another candidate sweep.

Do not promote a model in ENV33. Feature clarity comes first.
