# ENV63 Evidence Lock - Society Soak Stabilization and Fixture Honesty

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`
Commit: pending

## Goal

ENV62 proved organic ambient affection and compost-aware pollen dialogue, but the compost long-soak still carried two warnings:

- bond churn ran hot in ecology-heavy play,
- zone migration breadth varied because the ecology fixture was too narrow and could admit extra population changes during the proof.

ENV63 closes the stronger combined proof: one deterministic 12-butterfly fixture now exercises compost cleanup, compost-backed pollen regrowth, ambient witnessed affection, bond churn, and zone migration breadth together.

## Implementation Shape

```
fixture-owned butterflies
        |
        v
reset fixture social state
        |
        v
apply explicit fixture edges / objects / actions
        |
        v
lock fixture population during audit
        |
        v
measure:
  - witnessed affection from event subscription
  - bond churn from chronological bondTier samples
  - ecology pressure from ecology event subscription
```

## Files Changed

- `core/config.js`
  - Reduced `gameConfig.cognition.bondTier.arcEvents.sharedSuccess`.
  - Shared success still warms trust / comfort / attachment, but no longer grants enough synthetic co-time to promote many shallow acquaintances after one or two good moments.
- `scripts/g0h/societyMetrics.js`
  - Restored bond-churn primary measurement to the chronological per-pair `bondTier` sample series.
  - Relationship-arc events remain diagnostic, not the primary churn source.
- `scripts/run-long-soak-society-audit.js`
  - Fixture-owned butterflies now start with clean social edges, memories, and transient communication state unless the fixture opts out.
  - Fixtures can lock `maxButterflies`; the audit enforces the limit during the run so synthetic evidence is not polluted by births or default population drift.
- `scripts/scenario/runner.js`
  - Scenario fixtures now support the same fixture social reset and population lock metadata.
- `scripts/scenario/scenarios/seed-compost-pollen-regrowth-organic.json`
  - Expanded from a two-butterfly ecology probe into a 12-butterfly ecology+society fixture.
  - Includes compost cleanup, pollen planting, compost-boosted bloom, ambient witnessed affection, hand-computed bond churn, and multi-zone migration expectations.
- `scripts/scenario/scenarios/seed-society-soak-organic.json`
  - Added fixture population-lock metadata for deterministic scenario evidence.

## Proofs

### Combined Compost / Society Long Soak

Command:

```bash
node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-compost-pollen-regrowth-organic.json --minutes 6 --skip-ml-comparison
```

Result: pass.

Report:

`qa_logs/long_soak_society/2026-05-05T14-38-39-489Z/report.json`

Important evidence:

- witnessed-affection fixture assertion: pass, observed 6 events
- hand-computed bond churn for `juniper -> kite`: pass, observed 2
- bond stability: pass, 0.195
- bond churn: pass, 1.667/min
- witnessed-affection-rate: pass, 1/min
- ecology-loop-pressure: pass
- cleanup compost-created events: 22
- compost-boosted blooms: 2
- compost-aware pollen dialogue fraction: 1
- zone migration entropy: pass, mean entropy 0.658, mean distinct zones 2.333
- conversation repetition: pass, 0

### Scenario Coverage

Command:

```bash
node scripts/run-scenario.js --all
```

Result: pass, 43/43.

Final report:

`qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T14-38-30-117Z/report.json`

### G0H

Command:

```bash
node scripts/run-g0h-scripted-playthrough.js
```

Result: pass, 13/13.

Report:

`qa_logs/g0h_scripted_playthrough/2026-05-05T14-24-16-104Z/report.json`

### Runtime / Continuity / Spatial Regressions

```bash
node scripts/run-runtime-self-audit.js
```

Result: pass.

Report:

`qa_screenshots/runtime_self_audit/report.json`

```bash
node scripts/run-h5-long-running-save-smoothness-audit.js
```

Result: pass.

Report:

`qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-05T14-24-16-102Z/report.json`

```bash
node scripts/run-n8-social-save-continuity-audit.js
```

Result: pass.

Report:

`qa_screenshots/n8_social_save_continuity_audit/2026-05-05T14-31-33-427Z/report.json`

```bash
node scripts/run-r-block-cell-discipline-audit.js
```

Result: pass.

Report:

`qa_screenshots/r_block_cell_discipline_audit/2026-05-05T14-31-49-466Z/report.json`

```bash
node scripts/run-r-cognition-trigger-coverage-audit.js
```

Result: pass.

Report:

`qa_logs/r_cognition_trigger_coverage/2026-05-05T14-12-33-999Z/report.json`

## Honest Read

ENV63 improves the "believable society" side by slowing shallow relationship promotion. Cooperation still matters, witnessed affection still fires, and ecology work still creates social opportunities, but a single shared-success tag no longer makes too many acquaintances jump tiers.

This is not literal sentience. It is a tighter simulation loop: environmental work produces social signals, social signals produce durable memory, and relationship growth is paced enough to feel earned rather than automatic.

Remaining planning signals:

- the standalone `seed-society-soak-organic` long-soak seed can still show stretch-level zone migration variance; the combined ecology+society soak is the stronger green gate for this slice,
- fixture population isolation is now available, but regular human play should still be checked after more environment-object incentives land,
- ML remains supportive rather than decisive; this slice did not change ML artifacts or promotion status.

## Rollback

- Restore `gameConfig.cognition.bondTier.arcEvents.sharedSuccess` to `{ trust: 0.04, comfort: 0.04, attachment: 0.045, coTimeSeconds: 180 }` to revert the bond-growth dampener.
- Set fixture `world.resetFixtureSocialState = false` to preserve baseline social edges in a specific scenario or long-soak fixture.
- Remove `world.lockButterflyPopulation` / `world.maxButterflies` from a fixture to allow population growth during synthetic audits.
