# ENV6 Evidence Lock - Cooperative Shade Construction

Date: 2026-05-04
Branch: `codex/milestone-freeze-playtest`

## Shape

```
╔════════════════════ ENV6: cooperative construction ════════════════════╗
║ 1. Source butterfly carries a block with shade-building intent          ║
║        │                                                                ║
║        ▼                                                                ║
║ 2. communicationSystem asks nearby trusted helpers                      ║
║        │  "Can you bring a block here? This shade will help us rest."   ║
║        ▼                                                                ║
║ 3. Helper reads the received signal and targets a loose block           ║
║        │                                                                ║
║        ▼                                                                ║
║ 4. Normal block pickup / placement path creates shade                   ║
║        │                                                                ║
║        ▼                                                                ║
║ 5. Existing social edges get cooperation follow-through evidence        ║
╚═════════════════════════════════════════════════════════════════════════╝
```

## Ownership

- `structureSystem` still owns placement validity and shade truth.
- `communicationSystem` owns the social request signal and helper selection.
- `Butterfly` owns its immediate block-carrying behavior and records the follow-through after normal placement succeeds.
- `lifeSim.socialEdges` remain the durable relationship truth. ENV6 uses existing fields: `trust`, `comfort`, `admiration`, `followThroughScore`, `recentMutualAttention`, `recentWarmth`, and `historyTags`.
- No save schema change. No new drive, emotion, memory family, or social-edge vocabulary.

## What Changed

- `core/config.js`
  - Added `gameConfig.entities.block.shade.buildingCooperation`.
  - Controls helper distance, request cooldown, response window, relationship deltas, and follow-through boosts.

- `systems/communicationSystem.js`
  - Added a runtime `buildingAidRecords` cooldown map.
  - Added `updateShadeBuildingCooperation()`.
  - Butterflies carrying a block toward a shade-creating placement can emit a targeted cooperation request to nearby trusted helpers who have reachable loose blocks.
  - Emits `building:cooperation-requested`.

- `entities/butterfly.js`
  - Added `blockInteraction.buildingAssist`.
  - Helpers can respond to recent `shade-building-help` signals by targeting a suitable loose block.
  - Emits `building:helper-accepted`.
  - On successful placement, records assisted shade-building metadata and emits `building:cooperation-followthrough`.
  - Updates both helper/requester social edges with existing relationship fields and `shade-building-cooperation` history tags.

- `scripts/run-environment-building-cooperation-audit.js`
  - New deterministic browser audit proving the end-to-end production path.

## Proofs

Hard gates passed:

- `node scripts/run-environment-building-cooperation-audit.js`
  - Report: `qa_screenshots/environment_building_cooperation_audit/2026-05-04T16-52-06-333Z/report.json`
  - Result: pass
  - Proved: requester shade-building target, cooperation request, human-readable building phrase, helper acceptance, production shade placement, social edge follow-through, and helper memory.

- `node scripts/run-environment-building-intent-audit.js`
  - Report: `qa_screenshots/environment_building_intent_audit/2026-05-04T16-52-23-643Z/report.json`
  - Result: pass

- `node scripts/run-environment-shade-shelter-audit.js`
  - Report: `qa_screenshots/environment_shade_shelter_audit/2026-05-04T16-52-23-694Z/report.json`
  - Result: pass

- `node scripts/run-r-block-cell-discipline-audit.js`
  - Report: `qa_screenshots/r_block_cell_discipline_audit/2026-05-04T16-52-23-692Z/report.json`
  - Result: pass

- `node scripts/run-r-cognition-trigger-coverage-audit.js`
  - Report: `qa_logs/r_cognition_trigger_coverage/2026-05-04T16-52-23-678Z/report.json`
  - Result: pass

- `node scripts/run-runtime-self-audit.js`
  - Report: `qa_screenshots/runtime_self_audit/report.json`
  - Result: pass

- `node scripts/run-g0h-scripted-playthrough.js`
  - Report: `qa_logs/g0h_scripted_playthrough/2026-05-04T16-52-45-283Z/report.json`
  - Result: pass, 13/13 lanes

- `node scripts/run-scenario.js --all`
  - Result: pass, 38/38 scenarios

- `node scripts/run-h5-long-running-save-smoothness-audit.js`
  - Report: `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-04T17-00-10-646Z/report.json`
  - Result: pass

- `node scripts/run-n8-social-save-continuity-audit.js`
  - Report: `qa_screenshots/n8_social_save_continuity_audit/2026-05-04T17-00-10-640Z/report.json`
  - Result: pass

Society soak remained honest but still not fully closed:

- `node scripts/run-long-soak-society-audit.js --fast --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison`
  - Report: `qa_logs/long_soak_society/2026-05-04T16-52-45-268Z/report.json`
  - Result: `pass-with-society-warnings`
  - Passing signals: witnessed affection event subscription, fixture hand-computed bond churn, mean distinct zones, bond stability, partner repetition, witnessed affection rate, cleanup gradient, zone migration entropy, conversation repetition.
  - Remaining warning: aggregate bond churn is `2.5` transitions/minute against the provisional `0.25..2.0` band.

## Honest Read

ENV6 adds the first explicit cooperative construction loop: butterflies can ask one another to help build shade, respond by carrying blocks, and convert the completed action into durable relationship evidence. This is closer to believable society because the environment now gives them a functional reason to coordinate.

This is still not a full society/civilization layer. The next best target is bond stability: social relationships still churn slightly above the provisional long-soak band. A good next phase would separate "healthy new cooperation links" from "noisy tier oscillation" and add a deterministic proof that bond tiers do not bounce around when the same pair repeatedly cooperates.
