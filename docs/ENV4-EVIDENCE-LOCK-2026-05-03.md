# ENV4 Evidence Lock - Shade / Shelter Affordance

Date: 2026-05-03
Branch: `codex/milestone-freeze-playtest`
Commit target: pending at time of writing

## Scope

ENV4 gives blocks a functional environmental role: vertical stacks cast shade, and butterflies can perceive shade as a rest/shelter affordance.

Implemented rules:
- A block stack at height `>= 2` creates a derived shade column.
- Shade is derived from structure geometry and is not saved.
- Butterflies near a shade column receive:
  - `lifeSim.spatialAwareness.shadeCandidate`
  - `lifeSim.spatialAwareness.inShade`
  - `lifeSim.spatialAwareness.shadeStrength`
  - `lifeSim.spatialAwareness.shadeSourceBlockId`
- Shade can produce `objectAwareness.currentAffordance = "shelterUse"` when rest/exhaustion pressure is high.
- Shade increases shelter-seeking behavior bias.
- Preferred shade targets are open adjacent board cells, not the occupied block cell.

This phase did not change save schema, ML artifacts, cognition vocabulary, projection math, dialogue generation, or block placement rules.

## Ownership

```text
╔═══════════════════╦══════════════════════════════════════════════════╗
║ Owner             ║ Truth                                            ║
╠═══════════════════╬══════════════════════════════════════════════════╣
║ structureSystem   ║ shade columns, shade strength, open shade target ║
║ lifeSimSystem     ║ rest/shelter affordance derived from shade       ║
║ butterfly behavior║ movement bias using existing shelterSeeking      ║
║ saveSystem        ║ no durable shade fields                          ║
╚═══════════════════╩══════════════════════════════════════════════════╝
```

## Files

- `core/config.js`
  - Added `gameConfig.entities.block.shade`.
- `systems/structureSystem.js`
  - Added shade column derivation from stack geometry.
  - Added shade context into `getSpatialContextForEntity`.
  - Added open-cell preferred shade point selection.
- `systems/lifeSimSystem.js`
  - Added shade awareness fields to derived spatial awareness.
  - Allows shade to drive `shelterUse`.
  - Uses shade to bias shelter seeking, relief, rest, and exhaustion recovery.
- `scripts/run-environment-shade-shelter-audit.js`
  - New deterministic browser audit for the full block-stack -> shade -> life-sim affordance chain.

## Proofs

### New Shade / Shelter Audit

Command:

```text
node scripts/run-environment-shade-shelter-audit.js
```

Result: PASS

Report:

```text
qa_screenshots/environment_shade_shelter_audit/2026-05-03T21-13-31-023Z/report.json
```

Assertions:
- `stack-creates-shade-column`: pass
- `adjacent-butterfly-is-in-shade`: pass
- `distant-butterfly-is-not-in-shade`: pass
- `preferred-shade-point-is-open-cell`: pass
- `lifesim-records-shade-truth`: pass
- `shade-can-drive-shelter-affordance`: pass
- `shade-rest-bias-exceeds-open-control`: pass

### Regression Proofs

Command:

```text
node scripts/run-environment-occupancy-contract-audit.js
```

Result: PASS

Report:

```text
qa_screenshots/environment_occupancy_contract_audit/2026-05-03T21-13-48-145Z/report.json
```

Command:

```text
node scripts/run-environment-flower-spawn-rebalance-audit.js
```

Result: PASS

Report:

```text
qa_screenshots/environment_flower_spawn_rebalance_audit/2026-05-03T21-13-48-153Z/report.json
```

Command:

```text
node scripts/run-environment-pollen-propagation-audit.js
```

Result: PASS

Report:

```text
qa_screenshots/environment_pollen_propagation_audit/2026-05-03T21-13-48-158Z/report.json
```

Command:

```text
node scripts/run-runtime-self-audit.js
```

Result: PASS

Report:

```text
qa_screenshots/runtime_self_audit/report.json
```

Command:

```text
node scripts/run-g0h-scripted-playthrough.js
```

Result: PASS, 13/13 lanes

Report:

```text
qa_logs/g0h_scripted_playthrough/2026-05-03T21-14-17-976Z/report.json
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
qa_screenshots/r_block_cell_discipline_audit/2026-05-03T21-14-18-039Z/report.json
```

Command:

```text
node scripts/run-n8-social-save-continuity-audit.js
```

Result: PASS

Report:

```text
qa_screenshots/n8_social_save_continuity_audit/2026-05-03T21-21-40-451Z/report.json
```

Command:

```text
node scripts/run-h5-long-running-save-smoothness-audit.js
```

Result: PASS

Report:

```text
qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-03T21-21-40-441Z/report.json
```

Command:

```text
node scripts/run-long-soak-society-audit.js --fast --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison
```

Result: PASS-WITH-SOCIETY-WARNINGS

Report:

```text
qa_logs/long_soak_society/2026-05-03T21-21-40-476Z/report.json
```

Warnings:
- `bond-stability`: observed `0.401`, expected `<= 0.30`
- `bond-churn`: observed `2.25`, expected `0.25..2.0 transitions/min`

Passing signals:
- witnessed affection event subscription observed `10`
- hand-computed fixture bond churn passed
- mean distinct zones visited: `2.58`
- partner repetition: `0.34`
- conversation repetition: `0.010`

## Honest Read

ENV4 is a meaningful step toward a believable environment. Blocks now create a legible functional affordance: shade/rest. This makes building matter more than visual stacking and gives the life-sim a reason to evaluate structure placement.

This still is not literal sentience. It is a better world model for agents:

```text
block stack
   │
   ▼
derived shade column
   │
   ▼
spatial awareness
   │
   ▼
rest / shelter affordance
   │
   ▼
movement bias + future building incentive
```

Remaining gaps:
- Shade is not yet visually shown to the player.
- Shade does not yet directly influence autonomous building goals.
- Shade preference is trait-neutral except through existing rest/threat/exhaustion pathways.
- Long-soak social metrics still show relationship volatility warnings.

Recommended next phase:
- ENV5 building intent:
  - make butterflies prefer placing blocks near existing shade/shelter opportunities,
  - reward roof/overhead progress through routine/outcome memory,
  - keep Training Grounds free of ambient blocks,
  - add an audit proving butterflies build toward usable shade rather than random stacks.
