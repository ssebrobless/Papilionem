# ENV27 Evidence Lock - ML Pollen Trace Observability

Date: 2026-05-05
Phase owner: Codex

## Purpose

ENV23-ENV26 made pollen into a lived environmental cooperation loop: butterflies can
carry pollen, hand it to socially suitable partners, plant it into legal board cells,
and surface the work in the activity feed. ENV27 closes the measurement gap between
that lived loop and the ML trace layer.

This phase does not train or promote a model. It makes active pollen carrying and
pending pollen planting visible to feature extraction, outcome-window capture, and
corpus-record construction.

## Shape Of The Change

```text
butterfly state
  pollenInventory.charges > 0
  pendingPollenDropTarget present
        |
        v
ML feature groups
  objectAwareness.focusType        = pollen
  objectAwareness.currentAffordance = plant
  objectAwareness.carryingType     = pollen
  objectAwareness.pollenFamiliarity raised to at least 0.72
        |
        v
flat features
  object.focusIsPollen       = 1
  object.affordanceIsPlant   = 1
        |
        v
outcome window + corpus record
  object.focusType       = pollen
  object.affordance      = plant
  object.carryingType    = pollen
  object.pollenCharges   = current charges
  object.pendingPollenDrop = true/false
```

## Files Changed

- `systems/mlInferenceSystem.js`
  - Derives pollen object-awareness directly from `entity.pollenInventory`
    and `entity.pendingPollenDropTarget`.
  - Keeps the existing feature schema categories; no new labels or model
    vocabulary were introduced.
  - Adds pollen state to the P8 outcome-window object payload.

- `scripts/run-ml-pollen-trace-audit.js`
  - New deterministic audit that creates a synthetic pollinated butterfly,
    assigns a pending planting target, refreshes the ML trace, populates an
    outcome window, and builds a corpus record.
  - Asserts feature groups, flat features, outcome window, and corpus record
    all preserve the pollen/plant/carrying context.

## Proofs

All commands were run from `C:\Users\fishe\Documents\projects\ephemera`.

| Command | Result | Report |
| --- | --- | --- |
| `node --check systems/mlInferenceSystem.js` | pass | n/a |
| `node --check scripts/run-ml-pollen-trace-audit.js` | pass | n/a |
| `node scripts/run-ml-pollen-trace-audit.js` | pass | `qa_screenshots/ml_pollen_trace_audit/2026-05-05T04-35-22-863Z/report.json` |
| `node scripts/run-ml-trace-capture-audit.js` | pass | `qa_screenshots/ml_trace_capture_audit/2026-05-05T04-35-35-311Z/report.json` |
| `node scripts/run-environment-pollen-economy-audit.js` | pass | `qa_screenshots/environment_pollen_economy_audit/2026-05-05T04-35-35-328Z/report.json` |
| `node scripts/run-runtime-self-audit.js` | pass | `qa_screenshots/runtime_self_audit/report.json` |
| `node scripts/run-ml-phase-m7-audit.js` | pass | `qa_screenshots/ml_phase_m7_audit/2026-05-05T04-36-08-599Z/report.json` |
| `node scripts/run-scenario.js --all` | pass, 39/39 | first report: `qa_screenshots/scenario/seed-affection/2026-05-05T04-36-15-720Z/report.json` |

## Key Audit Findings

`run-ml-pollen-trace-audit.js` passed all of the following checks:

- `feature-focus-is-pollen`
- `feature-affordance-is-plant`
- `feature-carrying-type-is-pollen`
- `flat-pollen-indicators-present`
- `outcome-window-captures-pollen-state`
- `corpus-record-carries-pollen-context`
- `browser-clean`

The broader pollen economy audit also stayed green:

- `handoff-prefers-socially-suited-recipient`
- `economy-produces-multiple-handoffs`
- `economy-produces-multiple-lived-plantings`
- `economy-produces-multiple-blooms`
- `economy-feed-remains-human-readable`

Event counts in that rerun:

- `pollen:charged`: 3
- `pollen:handoff`: 2
- `pollen:planted`: 3
- `pollen:bloomed`: 7
- `pollen:expired`: 0

## What This Means For "Real AI"

This phase does not make the butterflies more intelligent by itself. It removes a
blind spot that would have blocked future learning.

Before ENV27, the lived pollen loop could happen in the game while the ML feature
record still saw only generic or stale object-awareness. After ENV27, the model
input and training records can distinguish a butterfly that is actively carrying
pollen and trying to plant from one that is merely observing or wandering near
objects.

That matters because future policies can now learn whether pollen planting,
pollen handoff, and resource stewardship should compete with feeding, socializing,
resting, or building.

## Constraints Honored

- No save schema changes.
- No model artifact changes.
- No new policy labels.
- No new cognition vocabulary.
- No gameplay behavior changes outside ML observability.
- The player's real save was not touched.

## Recommended Next Step

The next safe phase is to add a lived-loop pollen scenario into the trace-corpus
builder, then capture multiple reviewed records for pollen economy decisions.
That should happen before any new model promotion attempt, because m7 cannot learn
new pollen stewardship behavior from a corpus that barely represents it.

Suggested next phase name: ENV28 - Pollen Trace Corpus Scenario.

Recommended owner files:

- `scripts/scenario/scenarios/seed-pollen-cooperation-organic.json`
- `scripts/build-c2-trace-corpus.js`
- optionally a small extension to the corpus scenario setup path so scenario
  objects and seeded pollen inventory are represented without bypassing lived
  production update loops.

Do not change `assets/ml/*` in ENV28. The goal is corpus coverage, not model
promotion.
