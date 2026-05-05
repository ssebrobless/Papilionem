# ENV28 Evidence Lock - Pollen Trace Corpus Scenario

Date: 2026-05-05
Phase owner: Codex

## Purpose

ENV27 proved the ML trace path can perceive active pollen carrying and pending
pollen planting. ENV28 adds that situation to the lived-loop trace corpus so
future trainers can learn from it.

This phase does not promote a model. It does not edit `assets/ml/*`.

## Shape Of The Change

```text
seed-pollen-cooperation-organic.json
  3 butterflies
  companion bond between donor and recipient
  low-trust nearby alternative
  source flower + future bloom space
  donor receives pollen and a pending planting target
  donor emits an invitation signal to recipient
        |
        v
build-c2-trace-corpus.js lived-loop capture
  seeds scenario objects
  grants pollen inventory
  assigns pending pollen drop
  preserves object-awareness context
        |
        v
c2 trace corpus
  pollenCooperation family
  reviewed labels:
    actionFamily      = buildOrUseObject
    targetPreference  = emptySpace
    signalChoice      = invitation
    riskPosture       = approach
```

## Files Changed

- `scripts/scenario/scenarios/seed-pollen-cooperation-organic.json`
  - New deterministic scenario that represents pollen stewardship and trusted
    partner cooperation.

- `scripts/build-c2-trace-corpus.js`
  - Adds `seed-pollen-cooperation-organic` to `LIVED_LOOP_SCENARIO_NAMES`.
  - Adds lived-loop setup support for scenario flowers and dirt piles.
  - Adds scenario actions for `grant_pollen`, `set_pending_pollen_drop`, and
    `set_object_awareness`.

## Proofs

All commands were run from `C:\Users\fishe\Documents\projects\ephemera`.

| Command | Result | Report |
| --- | --- | --- |
| `node --check scripts/build-c2-trace-corpus.js` | pass | n/a |
| `node scripts/run-scenario.js seed-pollen-cooperation-organic` | pass | `qa_screenshots/scenario/seed-pollen-cooperation-organic/2026-05-05T04-45-26-296Z/report.json` |
| `node scripts/build-c2-trace-corpus.js --balance` | pass | `qa_screenshots/c2_trace_corpus/2026-05-05T04-45-29-444Z/corpus-manifest.json` |
| `node scripts/run-ml-pollen-trace-audit.js` | pass | `qa_screenshots/ml_pollen_trace_audit/2026-05-05T04-47-50-406Z/report.json` |
| `node scripts/run-ml-phase-m7-audit.js` | pass | `qa_screenshots/ml_phase_m7_audit/2026-05-05T04-47-50-411Z/report.json` |
| `node scripts/run-scenario.js --all` | pass, 40/40 | first report: `qa_screenshots/scenario/seed-affection/2026-05-05T04-50-49-486Z/report.json` |

## Corpus Result

Balanced corpus build:

- Output dir: `qa_screenshots/c2_trace_corpus/2026-05-05T04-45-29-444Z`
- Record count: 207
- Corrected record count: 95
- Rebuild check: pass

Pollen corpus coverage:

- 8 `pollenCooperation` records were emitted.
- Each pollen record is reviewed/corrected.
- Pollen records include outcome windows.
- Donor records expose:
  - `objectAwareness.focusType = pollen`
  - `objectAwareness.currentAffordance = plant`
  - `objectAwareness.carryingType = pollen`
  - `flatFeatures["object.focusIsPollen"] = 1`
  - `flatFeatures["object.affordanceIsPlant"] = 1`

Representative labels on the first pollen record:

```json
{
  "actionFamily": "buildOrUseObject",
  "targetPreference": "emptySpace",
  "signalChoice": "invitation",
  "riskPosture": "approach",
  "autobattlePosture": "stabilize"
}
```

## What This Means For "Real AI"

This is a training-data readiness improvement, not a direct believability jump.

The game now has a closed chain:

```text
lived pollen behavior
  -> ML feature visibility
  -> outcome-window visibility
  -> reviewed trace-corpus records
  -> future trainable signal
```

That chain is important because environmental intelligence cannot improve through
machine learning unless the model can see the environmental task and the corpus
contains examples of the desired choice.

## Constraints Honored

- No save schema changes.
- No model artifact promotion.
- No new policy labels.
- No new cognition vocabulary.
- No changes to shipped gameplay behavior.
- The player's real save was not touched.

## Recommended Next Step

The next useful phase is to run a fresh ML training/evaluation slice using the
expanded corpus, but keep promotion gated. The specific question should be:

Can a new candidate model improve pollen/environmental object decisions without
regressing the existing weak policy families?

Suggested next phase name: ENV29 - Candidate ML Retrain With Pollen Corpus.

Recommended guardrails:

- Do not replace the default model unless the candidate beats m7 on artifact
  match and does not regress the existing per-policy acceptance gates.
- Preserve the current corpus output as evidence.
- Include a per-family comparison table for actionFamily, targetPreference,
  signalChoice, riskPosture, and autobattlePosture.
