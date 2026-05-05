# ENV62 Evidence Lock - Ambient Social Affection and Dialogue Soak Honesty

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`
Commit: pending

## Goal

After ENV61, the ecology loop could talk about compost-backed pollen work. The next honesty gap was social: witnessed-affection coverage in long soaks was still easiest to prove with a fixture action that directly emitted a warm dialogue.

ENV62 makes that more organic:

- bonded / high-comfort butterflies can occasionally emit ambient warm social dialogue,
- witnessed-affection packets are still created only by the existing `lifeSimSystem.recordWitnessedAffection()` production path,
- long-soak audits now accumulate dialogue events over the full run instead of reading only the bounded final dialogue history.

## Implementation Shape

```
close bonded pair + companion witness
        |
        v
communicationSystem.updateAmbientSocialCommunication()
        |
        v
emitCooperationSignal(... comfort + companionship + warmth ...)
        |
        v
DIALOGUE_SPOKEN event
        |
        +--> lifeSimSystem.recordWitnessedAffection()
        |
        +--> long-soak dialogue subscriber
```

## Files Changed

- `core/config.js`
  - Added `gameConfig.communication.ambientSocial`.
  - Cadence is intentionally conservative: `intervalFrames: 1200`, `cooldownFrames: 5400`.
  - Added `initialQuietFrames: 900` so save/load and reset audit windows do not mutate protected social truth immediately.
- `systems/communicationSystem.js`
  - Added `updateAmbientSocialCommunication()`.
  - Added pair scoring for close bonded social pairs with optional companion-level witness opportunity.
  - Added warm, direct social phrases such as "I am glad you are here with me."
  - Added reset/deserialize quiet window handling.
- `scripts/scenario/scenarios/seed-society-soak-organic.json`
  - Replaced the direct `witness_affection` fixture action with simulation stepping.
  - Added assertions for a production `witnessedAffection` cognition event and memory packet.
- `scripts/run-long-soak-society-audit.js`
  - Added persistent `DIALOGUE_SPOKEN` subscription accumulation.
  - Metrics now receive full-run dialogue events; the final bounded dialogue history is retained as `dialogueHistorySnapshot`.
  - Run summaries include `dialogueSubscriber`.
- `scripts/g0h/societyMetrics.js`
  - Ecology-loop pressure now marks "compost exists but no pollen opportunity occurred" as residual instead of a failure.
  - True compost-pollen opportunities still require compost-created plus compost-boosted bloom.

## Proofs

### Organic Society Scenario

Command:

```bash
node scripts/run-scenario.js seed-society-soak-organic
```

Result: pass, deterministic.

Report:

`qa_screenshots/scenario/seed-society-soak-organic/2026-05-05T13-35-56-923Z/report.json`

Important evidence:

- no direct `witness_affection` action remains in the fixture,
- `ambient-social-witnessed-affection-event`: pass,
- `memory_packet` for `witnessedAffection` on the companion witness: pass.

### Society Long Soak

Command:

```bash
node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --minutes 6 --skip-ml-comparison
```

Result: pass.

Report:

`qa_logs/long_soak_society/2026-05-05T13-44-15-143Z/report.json`

Important evidence:

- fixture witnessed-affection subscription: pass, observed 12 events
- hand-computed bond churn for `j -> k`: pass, observed 2
- witnessed-affection-rate: pass, 2/min
- zone-migration-entropy: pass, mean entropy 0.681, mean distinct zones 2.154
- ecology-loop-pressure: residual, because this society fixture had compost cleanup but no pollen opportunity

### Compost Pollen Long Soak

Command:

```bash
node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-compost-pollen-regrowth-organic.json --minutes 6 --skip-ml-comparison
```

Result: pass-with-society-warnings.

Report:

`qa_logs/long_soak_society/2026-05-05T13-45-46-027Z/report.json`

Important evidence:

- ecology-loop-pressure: pass
- `cleanupCompostCreatedEventCount`: 20
- `compostBoostedBloomCount`: 1
- `compostAwarePollenDialogueFraction`: 1
- witnessed-affection-rate: pass, 0.333/min

Remaining warnings:

- `bond-churn`: 2.5/min, above the provisional 2.0/min band
- `zone-migration-entropy`: mean entropy 0.443, mean distinct zones 1.917

These are honest next-planning signals for society stability and migration breadth, not ENV62 regressions.

## Regression Proofs

```bash
node scripts/run-scenario.js --all
```

Result: pass, 43/43.

Final scenario report:

`qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T13-54-29-150Z/report.json`

```bash
node scripts/run-g0h-scripted-playthrough.js
```

Result: pass, 13/13.

Report:

`qa_logs/g0h_scripted_playthrough/2026-05-05T13-47-08-447Z/report.json`

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

`qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-05T13-54-39-481Z/report.json`

```bash
node scripts/run-n8-social-save-continuity-audit.js
```

Result: pass.

Report:

`qa_screenshots/n8_social_save_continuity_audit/2026-05-05T13-54-39-481Z/report.json`

```bash
node scripts/run-r-block-cell-discipline-audit.js
```

Result: pass.

Report:

`qa_screenshots/r_block_cell_discipline_audit/2026-05-05T13-54-39-489Z/report.json`

## Honest Read

ENV62 is a meaningful believability step: butterflies now have a low-frequency way to say simple, human-legible affectionate things to close partners without a direct test-only action. Witnessed affection remains durable only because the life-sim watches production dialogue and creates memory packets when another bonded/companion butterfly sees it.

This is still not literal sentience. It is better simulated social causality: relationship state creates speech, speech creates witnessed social memory, and that memory can bias later behavior.

The next best improvement is not more vocabulary. The evidence points to two system-level issues:

1. Bond churn can run hot in ecology-heavy long soaks.
2. Zone migration breadth still varies by fixture and sometimes falls below the stretch band.

Those should become the next concrete planning slice.

## Rollback

Set `gameConfig.communication.ambientSocial.enabled = false` to disable ambient affection without removing distress, scout, ecology, or direct production dialogue.
