# ENV10 Evidence Lock - Project Preference And Role Selection - 2026-05-04

Author: Codex
Branch: `codex/milestone-freeze-playtest`
Phase: ENV10, Project preference and role selection

## 1. Shape Of The Change

```text
╔════════════════════════════════════════════════════════════════════╗
║ ENV10: prior shared work now biases future helper choice          ║
╠══════════════════════╦═════════════════════════════════════════════╣
║ lifeSim memory       ║ Stores shared-project-completion memories  ║
║ communicationSystem  ║ Scores helper candidates from memory+edge  ║
║ objectSystem         ║ Still owns runtime project truth           ║
║ saveSystem           ║ No schema change                           ║
╚══════════════════════╩═════════════════════════════════════════════╝

completed shared project
  └── object memory names prior co-contributors
        └── later shade-building request
              ├── candidate relationship fit
              ├── requester memory of prior work
              ├── candidate memory of prior work
              ├── follow-through / object interest
              └── selected helper list
```

## 2. Goal

ENV8 gave shade-building a shared runtime project truth. ENV9 made completed shared work memorable and visible. ENV10 lets those memories influence future project helper choice, so butterflies can begin forming reliable work partnerships without adding new social-edge vocabulary or durable project-history schema.

## 3. Files Changed

- `core/config.js`
  - Added `gameConfig.entities.block.shade.buildingCooperation.projectPreference`.
  - Tuned to be a gentle nudge:
    - candidate edge weight: 0.50
    - requester edge weight: 0.18
    - requester memory weight: 0.12
    - candidate memory weight: 0.04
    - follow-through weight: 0.08
    - object-interest weight: 0.06
    - distance penalty weight: 0.10
    - memory gate boost: 0.04

- `systems/communicationSystem.js`
  - Added `getSharedProjectPartnerMemoryScore`.
  - Added `scoreBuildingHelperCandidate`.
  - Updated `getBuildingHelperCandidates` to score helper candidates from:
    - candidate edge toward requester
    - requester edge toward candidate
    - requester memory of prior shared projects
    - candidate memory of prior shared projects
    - follow-through
    - object interest
    - distance
  - Emits `helperPreference` scoring details in shade-building metadata and `building:cooperation-requested`.

- `scripts/run-environment-shared-projects-audit.js`
  - Extended the deterministic audit to create a three-butterfly choice:
    - requester
    - prior successful helper
    - viable alternative helper
  - Seeds a prior shared-project object memory and asserts the known helper is selected.

## 4. Tuning Note

The first ENV10 weight set made prior project memory too strong. The focused audit passed, but the society soak reported `pass-with-society-warnings` because bond stability drifted outside the accepted band.

Repair:

```text
before:
  requesterMemoryWeight 0.24
  candidateMemoryWeight 0.08
  followThroughWeight   0.12

after:
  requesterMemoryWeight 0.12
  candidateMemoryWeight 0.04
  followThroughWeight   0.08
```

The tuned version still passes the explicit memory-preference audit, while long-soak society returns to full pass.

## 5. Proofs Run

### Focused ENV10 Proof

- `node scripts/run-environment-shared-projects-audit.js`
  - Overall: pass
  - Final report: `qa_screenshots/environment_shared_projects_audit/2026-05-04T21-05-03-350Z/report.json`
  - New ENV10 assertion:
    - `prior-project-memory-selects-preferred-helper`: pass
  - Existing ENV8/ENV9 assertions still pass:
    - project created
    - requester contributes
    - helper invited, accepts, places block
    - project completes
    - object memories recorded
    - social edges strengthened
    - feed line present
    - runtime-only boundary preserved

### Adjacent Environment Proofs

- `node scripts/run-environment-building-cooperation-audit.js`
  - Overall: pass
  - Report: `qa_screenshots/environment_building_cooperation_audit/2026-05-04T21-01-55-647Z/report.json`

- `node scripts/run-environment-building-intent-audit.js`
  - Overall: pass
  - Report: `qa_screenshots/environment_building_intent_audit/2026-05-04T21-01-55-631Z/report.json`

- `node scripts/run-environment-shade-shelter-audit.js`
  - Overall: pass
  - Output: `qa_screenshots/environment_shade_shelter_audit/2026-05-04T21-01-55-660Z`

- `node scripts/run-environment-occupancy-contract-audit.js`
  - Overall: pass
  - Report: `qa_screenshots/environment_occupancy_contract_audit/2026-05-04T21-01-55-645Z/report.json`

### Broad Regression Proofs

- `node scripts/run-runtime-self-audit.js`
  - Overall: pass
  - Report: `qa_screenshots/runtime_self_audit/report.json`

- `node scripts/run-r-block-cell-discipline-audit.js`
  - Overall: pass
  - Output: `qa_screenshots/r_block_cell_discipline_audit/2026-05-04T21-02-18-115Z`

- `node scripts/run-r-cognition-trigger-coverage-audit.js`
  - Overall: pass
  - Report: `qa_logs/r_cognition_trigger_coverage/2026-05-04T21-02-18-115Z/report.json`

- `node scripts/run-n8-social-save-continuity-audit.js`
  - Overall: pass
  - Output: `qa_screenshots/n8_social_save_continuity_audit/2026-05-04T21-02-18-115Z`

- `node scripts/run-r2-zone-transition-audit.js`
  - Overall: pass
  - Output: `qa_screenshots/r2_zone_transition_audit/2026-05-04T21-02-18-115Z`

- `node scripts/run-h5-long-running-save-smoothness-audit.js`
  - Overall: pass
  - Report: `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-04T21-02-52-518Z/report.json`

- `node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison`
  - Overall: pass
  - Final report: `qa_logs/long_soak_society/2026-05-04T21-05-14-504Z/report.json`
  - Bond stability: 0.258, expected <= 0.30
  - Bond churn: 1.83 transitions/min, expected 0.25..2.0
  - Partner repetition: 0.206, expected <= 0.40
  - Witnessed-affection event subscription: 4, expected >= 1
  - Mean distinct zones visited: 2.57

- `node scripts/run-g0h-scripted-playthrough.js`
  - First run after tuning: failed `runtime-errors` due performance-only stutter tier, no page/console/runtime errors.
  - Rerun: pass, 13/13 lanes.
  - Passing report: `qa_logs/g0h_scripted_playthrough/2026-05-04T21-14-04-317Z/report.json`
  - Capture: `qa_logs/g0h_scripted_playthrough/2026-05-04T21-14-04-317Z/capture/capture.json`
  - Summary: `qa_logs/g0h_scripted_playthrough/2026-05-04T21-14-04-317Z/capture/summary.txt`

- `node scripts/run-scenario.js --all`
  - Overall: pass
  - Scenario count: 38/38

## 6. Honest Current State After ENV10

What is now true:

- A butterfly can prefer a prior reliable project partner for a new shade-building request.
- The preference uses existing object memories and relationship edges.
- The selected helper metadata exposes the scoring reason for audits.
- The preference is tuned as a nudge, not a hard lock-in.
- Save schema and cognition vocabulary remain unchanged.

What remains limited:

- The system does not yet assign complementary roles like gatherer, builder, cleaner, or lookout.
- The helper preference currently affects shade-building requests only.
- Butterflies do not yet talk about the prior success when asking for help.
- The system does not yet remember failed or abandoned projects as negative project preference.

## 7. Recommended Next Phase

```text
ENV11: role diversity and failed-project feedback
  ├── allow helper choice to prefer different roles by context
  │     e.g. reliable builder, nearby block carrier, frequent cleaner
  ├── record failed/ignored project attempts as light negative evidence
  ├── make help requests reference prior success in natural language
  ├── prove that helpers diversify instead of always picking one partner
  └── keep vocabulary and save schema stable
```

ENV10 creates the first loop where successful cooperation changes future cooperation. ENV11 should broaden that from "same helper again" into recognizable social roles.
