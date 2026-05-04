# ENV8 Evidence Lock - Shared Environmental Projects - 2026-05-04

Author: Codex
Branch: `codex/milestone-freeze-playtest`
Phase: ENV8, Shared Environmental Projects

## 1. Shape Of The Change

```text
╔════════════════════════════════════════════════════════════════════╗
║ ENV8: shared shade-shelter project truth                         ║
╠══════════════════════╦═════════════════════════════════════════════╣
║ objectSystem         ║ Owns runtime environmental project truth   ║
║ communicationSystem  ║ Opens shade-building help signals          ║
║ Butterfly            ║ Carries / places blocks / follows through  ║
║ structureSystem      ║ Still owns block cells, shade, occupancy   ║
║ saveSystem           ║ No new durable schema or migration         ║
╚══════════════════════╩═════════════════════════════════════════════╝

requester wants shade
  └── communicationSystem emits building request
        └── objectSystem opens shadeShelter project
              ├── requester contributes project-request
              ├── helper is invited, but not counted as progress yet
              └── helper accepts + places block
                    ├── structureSystem creates shade column
                    ├── objectSystem records block-placement
                    ├── objectSystem records helper-followthrough
                    └── objectSystem completes project
```

## 2. Goal

The goal of this phase was to move one step closer to functional cooperative society by giving environmental building work a shared runtime truth. Before ENV8, shade-building cooperation could look social through signals, placement, and relationship updates, but there was no explicit shared project record connecting:

- who requested help
- who was invited
- who actually contributed
- whether a shade-producing block placement completed the shared work

ENV8 adds that connection without adding save schema, cognition vocabulary, or a second owner for block/shade truth.

## 3. Files Changed

- `core/config.js`
  - Added `gameConfig.entities.block.shade.sharedProjects`.
  - Defaults: enabled, 2 real contributors required, 1 block placement required, max 6 active projects per zone.

- `systems/objectSystem.js`
  - Added runtime-only `environmentProjects` and `projectKeyIndex` maps.
  - Added shade-shelter project helpers:
    - `ensureShadeShelterProject`
    - `recordShadeProjectRequest`
    - `recordShadeProjectPlacement`
    - `recordShadeProjectFollowthrough`
    - `getEnvironmentProject`
    - `getEnvironmentProjects`
  - Emits:
    - `environment:project-created`
    - `environment:project-contribution`
    - `environment:project-completed`
  - Completion now counts only contributors with real contribution entries, so an invited helper does not complete a project by merely being named.

- `systems/communicationSystem.js`
  - Shade-building cooperation now creates or joins a `shadeShelter` project.
  - `building:cooperation-requested` includes `projectId`.

- `entities/butterfly.js`
  - Accepted building help carries `projectId`.
  - Shade-progress and follow-through paths report placement/follow-through to `objectSystem`.

- `scripts/run-environment-shared-projects-audit.js`
  - New deterministic browser audit for the shared-project loop.

## 4. Persistence Boundary

Shared projects are intentionally runtime-only in ENV8.

```text
Durable:
  butterfly identity, memories, relationship edges, blocks, board cells,
  object carry state, shade/block truth

Runtime-only:
  active shadeShelter project records, contribution logs, project events
```

The new audit verifies that the project id is not serialized through the `foundations.objects` durable payload. This keeps save schema v5 unchanged and avoids making early project coordination a permanent world-history system before the design is mature.

## 5. Proofs Run

### New ENV8 Proof

- `node scripts/run-environment-shared-projects-audit.js`
  - Overall: pass
  - Report: `qa_screenshots/environment_shared_projects_audit/2026-05-04T19-11-56-924Z/report.json`
  - Assertions:
    - requester has shade-building target
    - shared project is created from building request
    - requester contributes project-request
    - helper is invited but not yet counted as progress
    - helper accepts shared project help
    - helper placement completes shade project
    - project records two real contributors
    - completion event names both butterflies
    - project remains runtime-only relative to object durable state

### Adjacent Environment Proofs

- `node scripts/run-environment-building-cooperation-audit.js`
  - Overall: pass
  - Report: `qa_screenshots/environment_building_cooperation_audit/2026-05-04T19-12-11-817Z/report.json`

- `node scripts/run-environment-building-intent-audit.js`
  - Overall: pass
  - Report: `qa_screenshots/environment_building_intent_audit/2026-05-04T19-12-11-824Z/report.json`

- `node scripts/run-environment-shade-shelter-audit.js`
  - Overall: pass
  - Output: `qa_screenshots/environment_shade_shelter_audit/2026-05-04T19-12-11-881Z`

- `node scripts/run-environment-occupancy-contract-audit.js`
  - Overall: pass
  - Report: `qa_screenshots/environment_occupancy_contract_audit/2026-05-04T19-12-11-836Z/report.json`

- `node scripts/run-environment-flower-spawn-rebalance-audit.js`
  - Overall: pass
  - Output: `qa_screenshots/environment_flower_spawn_rebalance_audit/2026-05-04T19-14-29-495Z`

- `node scripts/run-environment-flower-to-block-audit.js`
  - Overall: pass
  - Output: `qa_screenshots/environment_flower_to_block_audit/2026-05-04T19-14-29-485Z`

- `node scripts/run-environment-pollen-propagation-audit.js`
  - Overall: pass
  - Output: `qa_screenshots/environment_pollen_propagation_audit/2026-05-04T19-14-29-485Z`

### Broad Regression Proofs

- `node scripts/run-runtime-self-audit.js`
  - Overall: pass
  - Report: `qa_screenshots/runtime_self_audit/report.json`

- `node scripts/run-r-block-cell-discipline-audit.js`
  - Overall: pass
  - Output: `qa_screenshots/r_block_cell_discipline_audit/2026-05-04T19-12-35-402Z`

- `node scripts/run-r-cognition-trigger-coverage-audit.js`
  - Overall: pass
  - Report: `qa_logs/r_cognition_trigger_coverage/2026-05-04T19-12-35-402Z/report.json`

- `node scripts/run-n8-social-save-continuity-audit.js`
  - Overall: pass
  - Output: `qa_screenshots/n8_social_save_continuity_audit/2026-05-04T19-13-05-886Z`

- `node scripts/run-r2-zone-transition-audit.js`
  - Overall: pass
  - Output: `qa_screenshots/r2_zone_transition_audit/2026-05-04T19-13-05-913Z`

- `node scripts/run-h5-long-running-save-smoothness-audit.js`
  - First parallel run failed under concurrent audit load on zone travel / capture runtime issue.
  - Solo rerun passed.
  - Passing report: `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-04T19-13-46-885Z/report.json`

- `node scripts/run-g0h-scripted-playthrough.js`
  - Overall: pass
  - Lanes: 13/13
  - Report: `qa_logs/g0h_scripted_playthrough/2026-05-04T19-14-44-956Z/report.json`
  - Capture: `qa_logs/g0h_scripted_playthrough/2026-05-04T19-14-44-956Z/capture/capture.json`
  - Summary: `qa_logs/g0h_scripted_playthrough/2026-05-04T19-14-44-956Z/capture/summary.txt`

- `node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison`
  - Overall: pass
  - Report: `qa_logs/long_soak_society/2026-05-04T19-22-01-708Z/report.json`
  - Witnessed-affection event subscription: 6 events, expected >= 1
  - Hand-computed bond churn: observed 2, expected 2
  - Mean distinct zones visited: 2.23, expected >= 1

- `node scripts/run-scenario.js --all`
  - Overall: pass
  - Scenarios: 38/38

## 6. Honest State After ENV8

ENV8 is a real improvement, but it is not yet full civilization-scale planning.

What is now true:

- A shade-building request can create a shared environmental project.
- The requester and helper are both attached to the same project id.
- The helper's accepted help and physical block placement complete the project.
- Completion requires actual contribution entries, not just invitation.
- The completed project emits evidence that can be audited.
- The project does not alter save schema or duplicate structure/shade truth.

What is still not true:

- Butterflies do not yet maintain long-lived plans across sessions.
- They do not negotiate multi-step building roles beyond the current shade help loop.
- They do not reserve future project sites as durable intentions.
- Project completion is not yet surfaced clearly to the player as a social achievement.
- ML does not yet own or learn the project strategy; the life-sim/environment layers create the opportunity, and behavior scoring decides whether they use it.

## 7. Real-AI Relevance

This phase matters because believable intelligence needs an environment where social behavior has work to do.

```text
Before ENV8:
  "I asked for help" + "someone placed a block"
    └── social-looking, but no shared project truth

After ENV8:
  "We are building this shade shelter"
    ├── requester
    ├── invited helper
    ├── contribution log
    ├── completion condition
    └── auditable project event
```

That moves the game toward emergent cooperation because future systems can now reason about unfinished work, successful collaboration, abandoned requests, repeated partners, and project outcomes without inventing a parallel building system.

## 8. Recommended Next Phase

The next best phase should make project work more player-legible and more socially consequential.

Recommended next slice:

```text
ENV9: project memory + visible social payoff
  ├── record a lightweight memory when a shared project completes
  ├── let completion strengthen relevant relationship edges
  ├── surface one human-readable feed line for completed shared work
  ├── add audit proving memory + edge + feed evidence
  └── keep project records runtime-only until a durable project-history design is needed
```

This is the clean next step because ENV8 creates project truth, but the butterflies do not yet remember the completed shared work as a meaningful social moment in a player-visible way.
