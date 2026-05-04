# ENV9 Evidence Lock - Project Memory And Visible Social Payoff - 2026-05-04

Author: Codex
Branch: `codex/milestone-freeze-playtest`
Phase: ENV9, Project memory and visible social payoff

## 1. Shape Of The Change

```text
╔════════════════════════════════════════════════════════════════════╗
║ ENV9: completed shared projects now matter socially              ║
╠══════════════════════╦═════════════════════════════════════════════╣
║ objectSystem         ║ Completes runtime project truth            ║
║ lifeSimSystem        ║ Records memory + relationship payoff       ║
║ gameUI               ║ Renders a feed line for project completion ║
║ saveSystem           ║ No schema change; v5 remains canonical     ║
╚══════════════════════╩═════════════════════════════════════════════╝

shadeShelter project completed
  ├── lifeSimSystem records object-family memories
  ├── lifeSimSystem applies small existing-edge boosts
  ├── objectSystem emits environment:project-completed
  ├── gameUI shows "Finished a shared shade shelter"
  └── project records remain runtime-only
```

## 2. Goal

ENV8 created a shared runtime project record for shade-shelter building. ENV9 makes completed shared work matter to the butterflies and to the player:

- each real contributor remembers the completed shared project
- contributor relationships receive a small, existing-family social payoff
- the activity feed can surface the completed shared shelter as a visible event

This phase does not add new drive, emotion, memory-family, or social-edge vocabulary. It uses the existing object memory family and existing social edge families.

## 3. Files Changed

- `core/config.js`
  - Added `gameConfig.entities.block.shade.sharedProjects.socialPayoff`.
  - Payoff is intentionally gentle after society-soak tuning:
    - trust +0.008
    - comfort +0.010
    - admiration +0.006
    - attachment +0.003
    - followThrough +0.020
    - mutualAttention +0.025
    - warmth +0.020

- `systems/lifeSimSystem.js`
  - Added `recordSharedProjectCompletion(project, gameState)`.
  - Records object-family memories tagged:
    - `shared-project-completion`
    - `shade-building-cooperation`
    - `shelter-use`
  - Applies existing relationship edge deltas between real contributors.
  - Emits `environment:project-social-payoff`.

- `systems/objectSystem.js`
  - Calls `lifeSimSystem.recordSharedProjectCompletion` when a `shadeShelter` project completes.
  - Includes `memoryCount` and `edgeUpdateCount` in `environment:project-completed`.

- `ui/gameUI.js`
  - Adds `environment:project-completed` to significant feed events.
  - Formats completed shade shelters as a human-readable action feed line.
  - Allows contributor ids to match inspect-filtered feed entries.

- `scripts/run-environment-shared-projects-audit.js`
  - Extended ENV8 audit to assert ENV9 behavior:
    - contributor object memories
    - social edge payoff
    - feed line formatting

## 4. Tuning Note

The first ENV9 implementation used a history tag named `shared-project-cooperation` and stronger direct edge deltas. The society soak reported `pass-with-society-warnings` because bond churn rose above the provisional band.

Fix:

```text
cause:
  "shared-project-cooperation" contained "cooperation"
    └── relationship arc weighting treated it as another shared-success event
        on top of the existing shade-building-cooperation tag

repair:
  use "shared-project-completion" for the new tag
  lower direct payoff deltas
  keep object memories and feed legibility intact
```

After the tuning, the focused ENV9 audit still passed and the long-soak society audit returned to full pass.

## 5. Proofs Run

### Focused ENV9 Proof

- `node scripts/run-environment-shared-projects-audit.js`
  - Overall: pass
  - Final report: `qa_screenshots/environment_shared_projects_audit/2026-05-04T20-14-46-917Z/report.json`
  - Assertions:
    - requester has shade-building target
    - shared project created from request
    - requester contributes project-request
    - helper invited but not counted as progress yet
    - helper accepts shared project help
    - helper placement completes shade project
    - project records two real contributors
    - project-completed event names both butterflies
    - completion records object memories
    - completion strengthens social edges
    - completion has feed line
    - projects remain runtime-only

### Adjacent Environment Proofs

- `node scripts/run-environment-building-cooperation-audit.js`
  - Overall: pass
  - Report: `qa_screenshots/environment_building_cooperation_audit/2026-05-04T20-02-38-595Z/report.json`

- `node scripts/run-environment-building-intent-audit.js`
  - Overall: pass
  - Report: `qa_screenshots/environment_building_intent_audit/2026-05-04T20-02-38-608Z/report.json`

- `node scripts/run-environment-shade-shelter-audit.js`
  - Overall: pass
  - Output: `qa_screenshots/environment_shade_shelter_audit/2026-05-04T20-02-38-604Z`

- `node scripts/run-environment-occupancy-contract-audit.js`
  - Overall: pass
  - Report: `qa_screenshots/environment_occupancy_contract_audit/2026-05-04T20-02-38-642Z/report.json`

### Broad Regression Proofs

- `node scripts/run-runtime-self-audit.js`
  - Overall: pass
  - Report: `qa_screenshots/runtime_self_audit/report.json`

- `node scripts/run-r-block-cell-discipline-audit.js`
  - Overall: pass
  - Output: `qa_screenshots/r_block_cell_discipline_audit/2026-05-04T20-03-00-105Z`

- `node scripts/run-r-cognition-trigger-coverage-audit.js`
  - Overall: pass
  - Report: `qa_logs/r_cognition_trigger_coverage/2026-05-04T20-03-00-106Z/report.json`

- `node scripts/run-n8-social-save-continuity-audit.js`
  - Overall: pass
  - Output: `qa_screenshots/n8_social_save_continuity_audit/2026-05-04T20-03-00-105Z`

- `node scripts/run-r2-zone-transition-audit.js`
  - Overall: pass
  - Output: `qa_screenshots/r2_zone_transition_audit/2026-05-04T20-03-00-105Z`

- `node scripts/run-h5-long-running-save-smoothness-audit.js`
  - Overall: pass
  - Report: `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-04T20-03-33-693Z/report.json`

- `node scripts/run-g0h-scripted-playthrough.js`
  - Overall: pass
  - Lanes: 13/13
  - Report: `qa_logs/g0h_scripted_playthrough/2026-05-04T20-16-19-707Z/report.json`
  - Capture: `qa_logs/g0h_scripted_playthrough/2026-05-04T20-16-19-707Z/capture/capture.json`
  - Summary: `qa_logs/g0h_scripted_playthrough/2026-05-04T20-16-19-707Z/capture/summary.txt`

- `node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison`
  - Overall: pass
  - Final report: `qa_logs/long_soak_society/2026-05-04T20-15-00-172Z/report.json`
  - Bond churn: 1.83 transitions/min, expected 0.25..2.0
  - Witnessed-affection event subscription: 6, expected >= 1
  - Mean distinct zones visited: 2.5

- `node scripts/run-scenario.js --all`
  - Overall: pass
  - Scenario count: 38/38

## 6. Honest Current State After ENV9

What is now true:

- Shared shade-shelter completion produces durable object memories for the actual contributors.
- The social payoff uses existing edge families rather than new vocabulary.
- The player feed can show a readable shared-work event.
- Project records remain runtime-only, avoiding premature save-schema expansion.
- The society soak accepts the payoff without destabilizing bond churn.

What remains limited:

- Project memory does not yet drive future project preference directly.
- There is no durable project-history archive yet.
- Butterflies still do not negotiate complex roles like "you gather, I build, they clean."
- The feed line is a factual completion entry, not a rich dialogue about the shared accomplishment.

## 7. Recommended Next Phase

```text
ENV10: project preference and role selection
  ├── use shared-project memories as behavior scoring input
  ├── prefer known reliable helpers for future building requests
  ├── let high-followThrough butterflies volunteer more often
  ├── keep role choice in behavior/communication scoring
  ├── do not add new social-edge vocabulary
  └── add an audit proving repeated partners emerge from prior success
```

This is the next clean step toward believable society: ENV8 created shared project truth, ENV9 made it memorable and visible, and ENV10 should let those memories influence who asks whom for future work.
