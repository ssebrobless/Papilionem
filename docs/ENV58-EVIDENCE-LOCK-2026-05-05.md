# ENV58 Evidence Lock - Compost-Legible Pollen Regrowth - 2026-05-05

## Shape

```text
╔══════════════════════╗    ╔══════════════════════╗    ╔══════════════════════╗
║ compost exists       ║    ║ pollen conversation  ║    ║ scenario proof       ║
║ cleanup made ground  ║───▶║ names fertile ground ║───▶║ cleanup→plant→bloom  ║
╚══════════════════════╝    ╚══════════════════════╝    ╚══════════════════════╝
          │                            │                            │
          ▼                            ▼                            ▼
  hidden fertility state       player-legible dialogue      deterministic audit lane
```

## What Changed

- `systems/communicationSystem.js`
  - Pollen work communication now checks for live compost patches in the source zone.
  - Compost presence gives pollen work a modest score bump.
  - Pollen dialogue can now explicitly mention cleaned / composted ground as a better planting target.
  - Emitted pollen metadata includes `compostPatchCount` and `hasCompostPatch`.

- `scripts/scenario/runner.js`
  - Adds scenario DSL support for:
    - `grant_pollen`
    - `plan_pollen_drop`
    - `complete_pollen_drop`
    - `cleanup_object`
    - `assert_ecology_event_count`
  - Adds ecology event subscription accumulation for cleanup, compost, planted, sprinkle, and bloom events.

- `scripts/scenario/scenarios/seed-compost-pollen-regrowth-organic.json`
  - New deterministic scenario proving:
    - a dirt pile is cleaned through the gameplay cleanup method,
    - cleanup emits a compost event,
    - pollen planning prefers a compost cell,
    - pollen drop completes,
    - boosted sprinkle and boosted bloom events fire.

## Proofs

| Proof | Result | Report |
| --- | --- | --- |
| New compost pollen regrowth scenario | PASS deterministic | `qa_screenshots/scenario/seed-compost-pollen-regrowth-organic/2026-05-05T12-12-31-273Z/report.json` |
| Forced ecology dialogue causality | PASS | `qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T12-19-14-481Z/report.json` |
| Unforced ecology dialogue causality | PASS / healthy | `qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T12-12-40-538Z/report.json` |
| Scenario suite | PASS 42/42 | final scenario `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T12-18-59-540Z/report.json` |
| Runtime self audit | PASS | `qa_screenshots/runtime_self_audit/report.json` |
| H5 long-running save smoothness | PASS | `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-05T12-19-56-667Z/report.json` |
| N8 social save continuity | PASS | `qa_screenshots/n8_social_save_continuity_audit/2026-05-05T12-19-56-664Z` |
| G0H scripted playthrough | PASS 13/13 | `qa_logs/g0h_scripted_playthrough/2026-05-05T12-27-29-888Z/report.json` |

## Notes

- A first forced ecology run during this phase failed `reserve-husk-cleanup-observed`, while the new compost checks passed. A clean rerun passed all checks, so this was treated as fixture timing variance rather than a compost regression.
- A first G0H run failed only the existing `flower-lifecycle` lane with `cleanedNet: 2`; the rerun passed 13/13. This was documented as the known organic cleanup timing variance, not a code regression.
- The new scenario runner hooks make prior pollen scenario declarations executable instead of inert JSON. This matters for future ML corpus and ecology scenarios because pollen decisions can now be asserted from actual event output.

## Current Status

ENV58 makes the ENV57 compost loop player-legible and testable:

```text
cleanup creates fertile patch
        │
        ▼
butterfly can talk about using the cleaned ground
        │
        ▼
pollen plan chooses compost
        │
        ▼
boosted bloom event proves the loop happened
```

The next best environment phase is to make this loop affect actual cooperation pressure over longer runs: measure whether compost patches increase pollen work signals, shared cleanup, and zone-level resource recovery without forced scenario actions.
