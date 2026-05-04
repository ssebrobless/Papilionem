# ENV7 Evidence Lock - Flower To Block Conversion

Date: 2026-05-04
Branch: `codex/milestone-freeze-playtest`

## Shape

```text
+------------------------ ENV7: material tradeoff ------------------------+
| live flower                                                             |
|   |                                                                     |
|   v                                                                     |
| butterfly chooses "make building material" when shelter/object pressure |
| beats feeding pressure                                                  |
|   |                                                                     |
|   v                                                                     |
| gameCore.convertFlowerToBlockMaterial                                   |
|   - structureSystem validates a legal block cell                        |
|   - flower is removed                                                   |
|   - one block is created                                                |
|   - one pollen charge is granted                                        |
|   - no food/happiness gain is granted                                   |
|   - exhaustion rises                                                    |
|   |                                                                     |
|   v                                                                     |
| existing block carry/place loop                                         |
+-------------------------------------------------------------------------+
```

## Ownership

- `gameCore` owns the atomic conversion from flower entity to block entity.
- `structureSystem` still owns valid cell placement and prevents object overlap.
- `Butterfly` owns the decision to attempt conversion and whether to carry the resulting block.
- `objectSystem` continues to record object interactions.
- `lifeSim` receives existing object memories and emotion changes only; no new drive, emotion, memory family, motive, or social-edge vocabulary was added.
- Save schema remains v5.

## What Changed

- `core/config.js`
  - Added `gameConfig.entities.flower.flowerToBlock`.
  - Config controls conversion score threshold, interaction radius, cooldown, max legal-cell search radius, pollen reward, exhaustion cost, and auto-carry.

- `core/gameCore.js`
  - Added `convertFlowerToBlockMaterial(flower, butterfly, options)`.
  - The function rejects training-zone conversion, validates a legal block cell while ignoring the source flower, removes the flower, creates/registers a block, grants one pollen charge, applies energy cost, records object memory, and emits `building:flower-converted-to-block`.

- `entities/butterfly.js`
  - Added autonomous `checkFlowerToBlockConversion()`.
  - Butterflies convert flowers when shelter/object/rest/exhaustion/material pressure beats feeding pressure.
  - The resulting block enters the existing carry/place path and can inherit `converted-flower` / `building-cost` memory metadata when placed.

- `scripts/run-environment-flower-to-block-audit.js`
  - New deterministic browser audit for the conversion tradeoff and carry/place handoff.

## Proofs

Hard gates passed:

- `node scripts/run-environment-flower-to-block-audit.js`
  - Report: `qa_screenshots/environment_flower_to_block_audit/2026-05-04T18-48-16-771Z/report.json`
  - Result: pass
  - Proved: live flower fixture, conversion action, flower removal, block creation, legal source cell, one pollen charge, no food/happiness gain, exhaustion cost, object memory, conversion event, block carry/place handoff, and sun-court rejection.

- `node scripts/run-environment-building-cooperation-audit.js`
  - Report: `qa_screenshots/environment_building_cooperation_audit/2026-05-04T18-48-32-630Z/report.json`
  - Result: pass

- `node scripts/run-environment-building-intent-audit.js`
  - Report: `qa_screenshots/environment_building_intent_audit/2026-05-04T18-48-32-628Z/report.json`
  - Result: pass

- `node scripts/run-environment-shade-shelter-audit.js`
  - Report: `qa_screenshots/environment_shade_shelter_audit/2026-05-04T18-48-32-642Z/report.json`
  - Result: pass

- `node scripts/run-environment-occupancy-contract-audit.js`
  - Report: `qa_screenshots/environment_occupancy_contract_audit/2026-05-04T18-48-32-649Z/report.json`
  - Result: pass

- `node scripts/run-environment-pollen-propagation-audit.js`
  - Report: `qa_screenshots/environment_pollen_propagation_audit/2026-05-04T18-48-55-016Z/report.json`
  - Result: pass

- `node scripts/run-r-flower-lifecycle-audit.js`
  - Report: `qa_screenshots/r_flower_lifecycle_audit/2026-05-04T18-48-55-015Z/report.json`
  - Result: pass

- `node scripts/run-r-block-cell-discipline-audit.js`
  - Report: `qa_screenshots/r_block_cell_discipline_audit/2026-05-04T18-48-55-015Z/report.json`
  - Result: pass

- `node scripts/run-r-cognition-trigger-coverage-audit.js`
  - Report: `qa_logs/r_cognition_trigger_coverage/2026-05-04T18-48-55-016Z/report.json`
  - Result: pass

- `node scripts/run-runtime-self-audit.js`
  - Report: `qa_screenshots/runtime_self_audit/report.json`
  - Result: pass

- `node scripts/run-g0h-scripted-playthrough.js`
  - Report: `qa_logs/g0h_scripted_playthrough/2026-05-04T18-50-26-064Z/report.json`
  - Result: pass, 13/13 lanes

- `node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison`
  - Report: `qa_logs/long_soak_society/2026-05-04T18-50-26-052Z/report.json`
  - Result: pass
  - Bond churn passed at `1.8333` transitions/minute against the provisional `0.25..2.0` band.

- `node scripts/run-h5-long-running-save-smoothness-audit.js`
  - Report: `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-04T18-57-53-146Z/report.json`
  - Result: pass

- `node scripts/run-n8-social-save-continuity-audit.js`
  - Report: `qa_screenshots/n8_social_save_continuity_audit/2026-05-04T18-57-53-145Z/report.json`
  - Result: pass

- `node scripts/run-scenario.js --all`
  - Result: pass, 38/38 scenarios

## Honest Read

ENV7 gives butterflies a stronger tool economy. A flower is no longer only food, reserve food, or pollen source; it can become building material at a cost. That gives the shade-building loop a renewable material source and creates a real choice: eat now, save food, plant later, or spend energy to build.

The full-length society soak passed. The earlier fast-window bond-churn warning should be treated as a short-window diagnostic, not as a production relationship bug. The next best product phase is shared environmental projects: multiple butterflies contributing to a shelter, garden, cleanup area, or food reserve goal with visible progress and durable outcome memory.
