# ENV5 Evidence Lock - Shade-Aware Building Intent

Date: 2026-05-04
Branch: `codex/milestone-freeze-playtest`

## Shape

```
╔═══════════════════════ ENV5: useful building intent ═══════════════════════╗
║ Butterfly state                                                            ║
║   rest + exhaustion + shelterSeeking + objectInterest                      ║
║        │                                                                   ║
║        ▼                                                                   ║
║ structureSystem.findPlacementTargetForBlock                                ║
║   scores valid placements only                                             ║
║   prefers stack completion when it creates shade                           ║
║        │                                                                   ║
║        ▼                                                                   ║
║ physicsSystem.applyResolvedBlockPlacement                                  ║
║   normal placement, normal cell discipline                                 ║
║        │                                                                   ║
║        ▼                                                                   ║
║ butterfly.placeCarriedBlock                                                ║
║   remembers shade-building outcome + emits building:shade-progress         ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## What Changed

- `core/config.js`
  - Added `gameConfig.entities.block.shade.buildingIntent`.
  - The config controls shade-aware block scoring, memory strength, and small relief/significance rewards for placements that create useful shade.

- `systems/structureSystem.js`
  - Added shade-building intent helpers.
  - `findPlacementTargetForBlock()` now scores valid stack targets using actor needs and shade value instead of only nearest distance.
  - The placement metadata now carries `shadeIntent`, `shadeIntentScore`, `shadeProgress`, and `createsShade`.
  - Fixed a production blocker where stacked placement on an existing support block was rejected by the opening-corridor guard. Opening avoidance still applies to non-stacked placements; vertical stacking is allowed when cell/support validation passes.

- `entities/butterfly.js`
  - Successful shade-building placements now become object memories with shade metadata.
  - Shade-creating placements give a small relief/significance lift.
  - A production `building:shade-progress` event is emitted when a placement advances shade/shelter utility.

- `scripts/run-environment-building-intent-audit.js`
  - New deterministic browser audit proving the production carry/place/memory/event path.

## Proofs

Hard gates passed:

- `node scripts/run-environment-building-intent-audit.js`
  - Report: `qa_screenshots/environment_building_intent_audit/2026-05-04T15-01-19-751Z/report.json`
  - Result: pass
  - Proved valid stack fixture, stack-completion preference, shade intent metadata, production placement, shade column creation, `building:shade-progress`, shade memory, and no sun-court blocks.

- `node scripts/run-environment-shade-shelter-audit.js`
  - Report: `qa_screenshots/environment_shade_shelter_audit/2026-05-04T15-01-19-776Z/report.json`
  - Result: pass

- `node scripts/run-environment-occupancy-contract-audit.js`
  - Report: `qa_screenshots/environment_occupancy_contract_audit/2026-05-04T15-01-19-784Z/report.json`
  - Result: pass

- `node scripts/run-r-block-cell-discipline-audit.js`
  - Report: `qa_screenshots/r_block_cell_discipline_audit/2026-05-04T15-01-19-789Z/report.json`
  - Result: pass

- `node scripts/run-runtime-self-audit.js`
  - Report: `qa_screenshots/runtime_self_audit/report.json`
  - Result: pass

- `node scripts/run-g0h-scripted-playthrough.js`
  - Report: `qa_logs/g0h_scripted_playthrough/2026-05-04T15-01-40-894Z/report.json`
  - Result: pass, 13/13 lanes

- `node scripts/run-h5-long-running-save-smoothness-audit.js`
  - Report: `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-04T15-01-40-872Z/report.json`
  - Result: pass

- `node scripts/run-n8-social-save-continuity-audit.js`
  - Report: `qa_screenshots/n8_social_save_continuity_audit/2026-05-04T15-01-40-882Z/report.json`
  - Result: pass

- `node scripts/run-r-cognition-trigger-coverage-audit.js`
  - Report: `qa_logs/r_cognition_trigger_coverage/2026-05-04T15-09-05-142Z/report.json`
  - Result: pass

- `node scripts/run-scenario.js --all`
  - Result: pass, 38/38 scenarios

Society soak remained honest but not fully closed:

- `node scripts/run-long-soak-society-audit.js --fast --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison`
  - Report: `qa_logs/long_soak_society/2026-05-04T15-09-05-160Z/report.json`
  - Result: `pass-with-society-warnings`
  - Passing signals: witnessed affection event subscription, fixture bond churn expectation, zone distinct count, bond stability, partner repetition, witnessed affection rate, cleanup gradient, zone migration entropy, conversation repetition.
  - Remaining warning: aggregate bond churn was high at `4.75` transitions/minute versus the provisional `0.25..2.0` band.

## Honest Read

ENV5 makes building more intentional: a tired/shelter-seeking butterfly can now choose a block placement because it creates shade, and the result is recorded as a lived object outcome. This is a meaningful improvement toward environmental agency.

This does not yet make a complete civilization loop. The next planning question is whether to deepen building into multi-step cooperation: shade goals, shared construction invitations, role split between carrier/placer/cleaner, and social credit for helping finish useful structures. Bond churn also remains the loudest society-soak warning.
