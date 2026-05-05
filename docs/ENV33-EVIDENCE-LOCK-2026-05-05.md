# ENV33 Evidence Lock - Autobattle Corpus Separability

Date: 2026-05-05
Phase owner: Codex

## Purpose

ENV32 fixed targetPreference label contamination. ENV33 addresses the remaining
autobattle diagnosis by separating two issues:

1. Some autobattle lived-loop scenarios were training both butterflies even when
   only one butterfly was the intended decision-maker.
2. The label-conflict analyzer was diluting battle-specific feature differences
   across the entire flat feature map, making clearly different battle contexts
   look falsely "near."

## Files Changed

- `scripts/build-c2-trace-corpus.js`
  - Curated battle snapshots now copy label-specific battle context onto the
    participant snapshot passed into `buildBattleCorpusRecord()`.
  - Lived-loop corpus setup supports `set_battle_context`.

- `scripts/scenario/scenarios/seed-autobattle-defend-injured-ally.json`
  - Adds explicit support battle context.
  - Narrows corpus `focusIds` to the intended actor.

- `scripts/scenario/scenarios/seed-autobattle-pursue-fleeing-rival.json`
  - Adds explicit focus-target battle context.
  - Narrows corpus `focusIds` to the intended actor.

- `scripts/scenario/scenarios/seed-autobattle-restore-bonded.json`
  - Adds explicit support battle context.
  - Narrows corpus `focusIds` to the intended actor.

- `scripts/analyze-ml-label-conflicts.js`
  - Uses policy-relevant feature subsets for distance calculations.
  - Autobattle distance now focuses on `autobattle.*`, battle aggression,
    caution, battle mode, and vulnerable target context.
  - Target distance now focuses on object/world/social/behavior/drive features
    relevant to target selection.

## Shape Of The Fix

```text
old autobattle analysis
  all flat features
  genetics + social + world + object + battle mixed together
  important battle deltas diluted
  false near-conflicts

new autobattle analysis
  battle-relevant feature subset
  support / target / retreat / threat context visible
  real conflicts only
```

## Proofs

| Command | Result | Report |
| --- | --- | --- |
| `node --check scripts/build-c2-trace-corpus.js` | pass | n/a |
| `node --check scripts/analyze-ml-label-conflicts.js` | pass | n/a |
| `node scripts/run-scenario.js seed-autobattle-defend-injured-ally` | pass | `qa_screenshots/scenario/seed-autobattle-defend-injured-ally/2026-05-05T05-56-03-686Z/report.json` |
| `node scripts/run-scenario.js seed-autobattle-pursue-fleeing-rival` | pass | `qa_screenshots/scenario/seed-autobattle-pursue-fleeing-rival/2026-05-05T05-56-03-480Z/report.json` |
| `node scripts/run-scenario.js seed-autobattle-restore-bonded` | pass | `qa_screenshots/scenario/seed-autobattle-restore-bonded/2026-05-05T05-56-03-722Z/report.json` |
| `node scripts/build-c2-trace-corpus.js --balance` | pass | `qa_screenshots/c2_trace_corpus/2026-05-05T05-56-08-212Z/corpus-manifest.json` |
| `node scripts/analyze-ml-label-conflicts.js --records qa_screenshots/c2_trace_corpus/2026-05-05T05-56-08-212Z/corpus-records.json --manifest qa_screenshots/c2_trace_corpus/2026-05-05T05-56-08-212Z/corpus-manifest.json` | pass | `qa_screenshots/ml_label_conflict_analysis/2026-05-05T05-59-13-588Z/report.json` |
| `node scripts/run-ml-phase-m7-audit.js` | pass | `qa_screenshots/ml_phase_m7_audit/2026-05-05T05-59-21-612Z/report.json` |
| `node scripts/run-runtime-self-audit.js` | pass | `qa_screenshots/runtime_self_audit/report.json` |

## Conflict Results

### targetPreference

- Record count: 53
- Near conflicts: 0
- Diagnosis: `healthy-enough`

### autobattlePosture

Before ENV33 with whole-feature distance:

- Record count: 51
- Near conflicts: 181
- Diagnosis: `feature-ambiguous-label-conflicts`

After ENV33 with policy-relevant distance:

- Record count: 51
- Label counts:
  - support: 11
  - engage: 10
  - focusWeakTarget: 10
  - stabilize: 10
  - retreat: 10
- Near conflicts: 0
- Diagnosis: `healthy-enough`

## Honest Verdict

ENV33 closes the measurement/fixture side of autobattle separability.

This does not prove a better model yet. It proves the corpus and conflict metric
are no longer obviously contradictory for targetPreference or autobattlePosture.
The next valid test is a fresh candidate sweep on the ENV32/ENV33 corpus.

## Recommended Next Step

ENV34 should rerun the bounded M8 candidate sweep.

Promotion remains gated:

- Do not edit `assets/ml/*` unless a candidate clears the gate.
- A candidate must clear held-out no-regression vs heuristic.
- A candidate must beat m4 on at least four policy families.
- A candidate must pass formal `run-ml-phase-m7-audit.js --policy <candidate>`.

If ENV34 still fails, the remaining issue is likely model capacity or scenario
coverage, not obvious corpus contradiction.
