# ENV61 Evidence Lock - Compost Pollen Dialogue Surfaces Through Planning

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`
Commit: pending

## Goal

Close the remaining ENV59/ENV60 measurement gap where the ecology loop could create compost, use pollen, and bloom faster from compost, but the 6-minute long soak still measured `compostAwarePollenDialogueFraction: 0`.

The target behavior is not a scripted feed line. A butterfly that chooses a compost patch as its pollen planting target should use the existing ecology communication selector to ask a nearby partner for help, producing task dialogue with the `compost` intent tag.

## Implementation Shape

```
cleanup dirt/reserve husk
        |
        v
transient cleanupCompostPatch
        |
        v
planPollenDropTarget()
        |
        +-- chooses compost cell because compostPreferenceBonus applies
        |
        v
announceCompostPollenPlan()
        |
        v
communicationSystem.updateEcologyWorkCommunication({
  force: true,
  maxSignals: 1,
  sourceId: planter
})
        |
        v
normal ecology dialogue emission
```

## Files Changed

- `core/config.js`
  - Added `gameConfig.entities.flower.pollenPropagation.compostPlanningSignalEnabled`, default `true`.
- `core/gameCore.js`
  - `planPollenDropTarget()` now calls `announceCompostPollenPlan()` after selecting a compost-backed pollen target.
  - Added `announceCompostPollenPlan()` to route compost pollen announcements through the existing communication system rather than hand-writing dialogue.
- `systems/communicationSystem.js`
  - Added optional `sourceId` / `source_id` filtering to `updateEcologyWorkCommunication()` so one real source can announce a task while partner selection still considers all local butterflies.
- `scripts/scenario/scenarios/seed-compost-pollen-dialogue-organic.json`
  - Replaced the direct `run_ecology_work_communication` proof action with `plan_pollen_drop`, so the scenario proves that real pollen planning triggers the compost-aware dialogue.

## Proofs

### Targeted Scenario

Command:

```bash
node scripts/run-scenario.js seed-compost-pollen-dialogue-organic
```

Result: pass, deterministic.

Report:

`qa_screenshots/scenario/seed-compost-pollen-dialogue-organic/2026-05-05T13-04-48-409Z/report.json`

Important evidence:

- `compost-plan-emits-real-ecology-dialogue`: pass
- target `compostPatchId`: `compost:moss-hollow:10:12:0`
- `compost-pollen-dialogue-surfaced`: pass
- phrase sample: `The composted spot will take the pollen well. Come help me place it.`
- intent tags include `pollen`, `planting`, and `compost`

### Long-Soak Society Audit

Command:

```bash
node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-compost-pollen-regrowth-organic.json --minutes 6 --skip-ml-comparison
```

Result: `pass-with-society-warnings`.

Report:

`qa_logs/long_soak_society/2026-05-05T13-05-01-746Z/report.json`

Important evidence:

- `ecology-loop-pressure`: pass
- `cleanupCompostCreatedEventCount`: 20
- `compostBoostedBloomCount`: 1
- `compostAwarePollenDialogueFraction`: 1

Remaining warnings are existing long-soak society stretch metrics:

- `witnessed-affection-rate`: 0 in this fixture run
- `zone-migration-entropy`: mean entropy 0.246, mean distinct zones 1.5

These warnings are not regressions from ENV61 and should be handled in later society-expression / migration-diversity planning.

### Ecology Dialogue Causality Audit

Forced fixture:

```bash
node scripts/run-ecology-dialogue-causality-audit.js
```

Result: pass.

Report:

`qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T13-06-17-925Z/report.json`

Key values:

- dialogue count: 114
- ecology dialogue count: 49
- ecology dialogue ratio: 0.4298
- `intentTagCounts.compost`: 2
- follow-through observed: cleanup, pollen, reserve food, shade rest
- compost boost observed: sprinkle 1, bloom 1

Unforced soak:

```bash
node scripts/run-ecology-dialogue-causality-audit.js --unforced
```

Result: pass, `unforcedSoakVerdict: healthy`.

Report:

`qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T13-06-17-927Z/report.json`

### Regression Proofs

```bash
node scripts/run-runtime-self-audit.js
```

Result: pass.

Report:

`qa_screenshots/runtime_self_audit/report.json`

```bash
node scripts/run-scenario.js --all
```

Result: pass, 43/43.

Final scenario report:

`qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T13-14-08-062Z/report.json`

```bash
node scripts/run-g0h-scripted-playthrough.js
```

Result: pass, 13/13.

Report:

`qa_logs/g0h_scripted_playthrough/2026-05-05T13-07-01-766Z/report.json`

```bash
node scripts/run-h5-long-running-save-smoothness-audit.js
```

Result: pass.

Report:

`qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-05T13-14-23-053Z/report.json`

```bash
node scripts/run-n8-social-save-continuity-audit.js
```

Result: pass.

Report:

`qa_screenshots/n8_social_save_continuity_audit/2026-05-05T13-14-23-086Z/report.json`

```bash
node scripts/run-r-block-cell-discipline-audit.js
```

Result: pass.

Report:

`qa_screenshots/r_block_cell_discipline_audit/2026-05-05T13-14-23-086Z/report.json`

## Honest Read

ENV61 closes the compost-aware pollen dialogue gap for the regrowth loop. The ecology loop now has a visible chain:

1. cleanup creates compost,
2. pollen planning prefers compost,
3. the planter asks for help using real ecology dialogue,
4. compost-boosted pollen bloom occurs,
5. long-soak metrics see that chain instead of relying on a scripted phrase.

This is a meaningful step toward believable society because the butterflies now talk about the environmental work they are actually doing. It is still not literal consciousness or sentience. The remaining gap is breadth and richness: more environmental pressures should create varied reasons to cooperate, and the long-soak society metrics still need stronger organic migration diversity and affection-rate evidence.

## Rollback

Set `gameConfig.entities.flower.pollenPropagation.compostPlanningSignalEnabled = false` to disable the new planning-triggered compost dialogue while leaving compost planting and bloom acceleration intact.
