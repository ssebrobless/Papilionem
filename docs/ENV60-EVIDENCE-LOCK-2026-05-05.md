# ENV60 Evidence Lock - Compost-Aware Pollen Dialogue - 2026-05-05

## Shape

```text
╔══════════════════════╗    ╔══════════════════════╗    ╔══════════════════════╗
║ compost patch        ║    ║ pollen work selector ║    ║ dialogue evidence   ║
║ live in zone         ║───▶║ sees current state   ║───▶║ tag: compost        ║
╚══════════════════════╝    ╚══════════════════════╝    ╚══════════════════════╝
```

## What Changed

- `systems/communicationSystem.js`
  - Compost-aware pollen signals now include the `compost` intent tag.
  - Compost-aware phrase options are selected when live compost exists in the source zone.

- `scripts/scenario/runner.js`
  - Adds `run_ecology_work_communication`, which invokes the real ecology work selector rather than hand-authoring dialogue.
  - The hook reads `gameCore.getGameState()` at call time so transient compost patches created during scenario actions are visible.
  - `assert_dialogue_intent` now reports recent dialogue details when it fails.

- `scripts/scenario/scenarios/seed-compost-pollen-dialogue-organic.json`
  - New deterministic proof that:
    - cleanup creates compost,
    - pollen is available while compost exists,
    - the real ecology selector emits a dialogue,
    - the dialogue carries the `compost` intent tag.

## Proofs

| Proof | Result | Report |
| --- | --- | --- |
| Compost pollen dialogue scenario | PASS deterministic | `qa_screenshots/scenario/seed-compost-pollen-dialogue-organic/2026-05-05T12-43-51-439Z/report.json` |
| Full scenario suite | PASS 43/43 | final scenario `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T12-50-46-060Z/report.json` |
| Forced ecology dialogue causality | PASS | `qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T12-44-04-840Z/report.json` |
| Unforced ecology dialogue causality | PASS / healthy | `qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T12-44-04-855Z/report.json` |
| G0H scripted playthrough | PASS 13/13 | `qa_logs/g0h_scripted_playthrough/2026-05-05T12-50-52-384Z/report.json` |

## Key Evidence

- Forced ecology audit now shows compost in the dialogue lane:
  - sample phrase: `The composted spot will take the pollen well. Come help me place it.`
  - `intentTagCounts.compost: 2`
  - `compostBoostedSprinkleCount: 3`
  - `compostBoostedBloomCount: 3`
- The new deterministic scenario proves the real ecology selector can emit compost-tagged pollen dialogue.

## Current Status

ENV60 closes the specific ENV59 gap where compost blooms existed but compost-aware dialogue did not surface in measurement. We now have:

```text
cleanup compost state
        │
        ▼
pollen targeting boost
        │
        ▼
boosted bloom proof
        │
        ▼
compost-aware spoken intent
```

Remaining open question: long unforced society soaks may still show low compost-aware dialogue fraction if butterflies rarely hold pollen while compost is live. That is an ecology-pressure tuning question, not a missing communication capability.
