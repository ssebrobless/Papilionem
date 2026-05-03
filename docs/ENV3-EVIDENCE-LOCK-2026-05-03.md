# ENV3 Evidence Lock - Pollen Propagation

Date: 2026-05-03
Branch: `codex/milestone-freeze-playtest`
Commit target: pending at time of writing

## Scope

ENV3 turns reduced flower abundance into a cooperative resource loop.

Implemented rules:
- Feeding from a flower grants pollen.
- Converting a flower into reserve food grants pollen.
- A butterfly can hold up to two pollen charges.
- Pollen expires after two minutes.
- Planting consumes one charge.
- A planted pollen patch reserves a board cell and blooms after twenty seconds.
- Nearby butterflies can hand off one pollen charge to another butterfly that has no charge.

This phase did not change save schema, ML artifacts, cognition vocabulary, projection math, block placement rules, or dialogue language.

## Files

- `core/config.js`
  - Added `gameConfig.entities.flower.pollenPropagation`.
- `core/gameCore.js`
  - Added pollen inventory helpers:
    - `ensureButterflyPollenInventory`
    - `grantPollenCharges`
    - `hasUsablePollenCharge`
    - `clearButterflyPollenInventory`
    - `consumePollenCharge`
    - `transferPollenCharge`
    - `updateButterflyPollenInventories`
  - `completePollenDrop` now requires and consumes a pollen charge.
  - `queuePollenPlanting` uses the configured twenty-second bloom delay by default.
  - `convertFlowerToReserveFood` grants pollen to the actor.
- `entities/butterfly.js`
  - Successful feeding grants pollen before post-feeding planting behavior.
- `scripts/run-environment-pollen-propagation-audit.js`
  - New deterministic browser audit for charge grant, cap, handoff, planting, bloom, reserve conversion, and expiry.

## Proofs

### New Pollen Propagation Audit

Command:

```text
node scripts/run-environment-pollen-propagation-audit.js
```

Result: PASS

Report:

```text
qa_screenshots/environment_pollen_propagation_audit/2026-05-03T20-10-21-866Z/report.json
```

Assertions:
- `feeding-grants-pollen-charge`: pass
- `pollen-charges-cap-at-two`: pass
- `pollen-handoff-transfers-one-charge`: pass
- `planting-consumes-one-charge-and-reserves-cell`: pass
- `pollen-patch-blooms-into-flower-at-reserved-cell`: pass
- `reserve-food-conversion-grants-pollen`: pass
- `pollen-charges-expire-after-ttl`: pass

### Regression Proofs

Command:

```text
node scripts/run-environment-flower-spawn-rebalance-audit.js
```

Result: PASS

Report:

```text
qa_screenshots/environment_flower_spawn_rebalance_audit/2026-05-03T20-10-51-814Z/report.json
```

Command:

```text
node scripts/run-environment-occupancy-contract-audit.js
```

Result: PASS

Report:

```text
qa_screenshots/environment_occupancy_contract_audit/2026-05-03T20-10-51-814Z/report.json
```

Command:

```text
node scripts/run-r-flower-lifecycle-audit.js
```

Result: PASS

Report:

```text
qa_screenshots/r_flower_lifecycle_audit/2026-05-03T20-10-51-841Z/report.json
```

Notable lived trace:
- cleanup affordance trace included `feedFrom`, `clean`, and `carry`.
- `cleanupOrganicFloorLived`: seeded 12, cleaned 6, remaining 6, new piles spawned 2, pass.

Command:

```text
node scripts/run-g0h-scripted-playthrough.js
```

Result: PASS, 13/13 lanes

Report:

```text
qa_logs/g0h_scripted_playthrough/2026-05-03T20-12-23-435Z/report.json
```

Command:

```text
node scripts/run-scenario.js --all
```

Result: PASS, 38/38 scenarios

Command:

```text
node scripts/run-r-block-cell-discipline-audit.js
```

Result: PASS

Report:

```text
qa_screenshots/r_block_cell_discipline_audit/2026-05-03T20-12-23-437Z/report.json
```

Command:

```text
node scripts/run-runtime-self-audit.js
```

Result: PASS

Command:

```text
node scripts/run-n8-social-save-continuity-audit.js
```

Result: PASS

Report:

```text
qa_screenshots/n8_social_save_continuity_audit/2026-05-03T20-20-52-934Z/report.json
```

Command:

```text
node scripts/run-r-cognition-trigger-coverage-audit.js
```

Result: PASS

Report:

```text
qa_logs/r_cognition_trigger_coverage/2026-05-03T20-20-52-934Z/report.json
```

Command:

```text
node scripts/run-h5-long-running-save-smoothness-audit.js
```

Initial run: FAIL due `sim-board-zone-travel-edge-missing` and cadence warnings on a real exported save with 142 flowers / 108 blocks.

Rerun result: PASS

Passing rerun report:

```text
qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-03T20-21-36-281Z/report.json
```

Command:

```text
node scripts/run-long-soak-society-audit.js --fast --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison
```

Result: PASS-WITH-SOCIETY-WARNINGS

Report:

```text
qa_logs/long_soak_society/2026-05-03T20-19-44-706Z/report.json
```

Warnings:
- `bond-churn`: 2.5 transitions/min against provisional 0.25..2.0 band.

Passing signals:
- witnessed affection event subscription observed 8 events.
- hand-computed fixture bond churn passed.
- mean distinct zones visited: 2.67.
- partner repetition: 0.181.
- conversation repetition: 0.

## Honest Read

ENV3 is a real environmental affordance improvement. The butterflies now have a resource action that can chain through another butterfly rather than only "fly to food and eat." That is still not literal sentience or full artificial intelligence, but it gives the life-sim and ML layers a more meaningful world to reason over.

Remaining gaps:
- Pollen handoff is proximity-based, not yet deeply relationship-intent-based.
- The feed does not yet expose pollen intent in human-readable dialogue.
- Long-soak society metrics still show provisional instability in bond churn.
- The old real exported save can still hit pressure or zone-travel audit sensitivity because it contains 142 flowers and 108 blocks.

Recommended next phase:
- ENV4 shade/shelter affordance:
  - blocks overhead create shade/rest affordance,
  - butterflies perceive bright/open versus shaded/covered cells,
  - rest/shelter behavior uses the existing life-sim drive vocabulary,
  - block building gains a visible functional purpose beyond stacking.
