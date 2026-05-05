# ENV53 Evidence Lock - Settled Ecology Outcomes

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`

## Goal

Close the next ecology-believability gap after ENV52: make ecology dialogue produce settled, inspectable outcomes rather than only good-sounding requests.

ENV53 specifically proves:

- reserve food is a finite shared resource, not an infinite prop
- shade-rest requests lead to actual block-target arrival
- shade-rest arrival can hand off to `sleepSystem` for settling sleep
- ecology evidence is accumulated by event subscription rather than relying on final event history

## Implementation

Files changed:

- `core/config.js`
- `systems/communicationSystem.js`
- `entities/butterfly.js`
- `scripts/run-ecology-dialogue-causality-audit.js`
- `systems/saveSystem.js`

### Reserve Food

`gameConfig.cognition.ecologyCommunication.reserveFood.maxSharedUses` is set to `6`.

`communicationSystem.applyReserveFoodFollowThrough()` now:

- refuses depleted reserve-food balls
- increments `reserveFoodUseCount`
- stores `reserveFoodMaxUses`
- marks `reserveFoodDepleted` at the cap
- emits `ecology:reserve-food-used`

The ecology selector ignores depleted reserve food when choosing future reserve-food opportunities.

### Shade Rest

`communicationSystem.applyShadeRestFollowThrough()` now records `restNeedAtRequest` on the transient `ecologyRestTarget`.

`Butterfly.checkEcologyRestArrival()` now:

- runs during both legacy and board movement
- detects arrival at the shade target
- emits `ecology:shade-rest-arrived`
- uses `sleepSystem.canEntitySleep()` and `sleepSystem.setSleepSubtype()` to settle tired butterflies into `settling_sleep`
- includes diagnostic fields in the event payload: `sleepPressure`, `canSleep`, `exhaustion`, `restDrive`, `restNeedAtRequest`, and `sleepSubtypeBefore`

`sleepSystem` remains the owner of sleep state. The ecology layer only carries the causal reason and target.

### Audit Honesty

`scripts/run-ecology-dialogue-causality-audit.js` now subscribes to:

- `pollen:sprinkle`
- `pollen:bloomed`
- `ecology:reserve-food-used`
- `ecology:shade-rest-arrived`

This avoids false negatives from the global event-history ring buffer. Forced mode now blocks on:

- `reserve-food-finite-use-state`
- `shade-rest-arrival-observed`
- `shade-rest-settling-observed`

### Save-System Blocker Repair

The full G0H rerun exposed one existing blocker: a carried/raised block could serialize with `boardPos.h` higher than `stackIndex`, then reload as a `block-stack-height-divergence` runtime error.

`saveSystem.serializeBlock()` now:

- serializes carried blocks with stack height `0`
- serializes non-carried blocks with `stackIndex` synchronized to rounded board height when board truth is present
- writes `boardPos.h` to the same height as serialized `stackIndex`

`recordBlockStackHeightDivergence()` and restore normalization now treat carried blocks as non-stack occupants, avoiding a false stack-divergence report for carry-height.

No schema bump. Save schema remains v5.

## Proofs

### Ecology Dialogue Causality - Forced

Report:

`qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T10-09-24-881Z/report.json`

Result: pass

Key values:

- `reserveFoodUseCount`: 6
- `reserveFoodMaxUses`: 6
- `reserveFoodDepleted`: true
- `shadeRestTargetingCount`: 12
- `shadeRestArrivedCount`: 24
- `shadeRestSettlingSleepCount`: 24
- `pollenFollowThroughEventCount`: 24
- `cleanedSeedDirtPiles`: 4

### Ecology Dialogue Causality - Unforced

Report:

`qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T10-10-00-923Z/report.json`

Result: pass, `unforcedSoakVerdict: healthy`

Key values:

- `ecologyDialogueRatio`: 0.4953
- `reserveFoodUseCount`: 6
- `reserveFoodMaxUses`: 6
- `reserveFoodDepleted`: true
- `shadeRestTargetingCount`: 9
- `shadeRestArrivedCount`: 37
- `shadeRestSettlingSleepCount`: 35
- `pollenFollowThroughEventCount`: 20
- `cleanedSeedDirtPiles`: 4

### Dialogue / Feed / Runtime

- Dialogue readability: `qa_screenshots/dialogue_readability_audit/2026-05-05T10-11-01-780Z/report.json` - pass
- Feed thread audit: `qa_screenshots/r_feed_thread_audit/2026-05-05T10-11-01-802Z/report.json` - pass
- Runtime self-audit: `qa_screenshots/runtime_self_audit/report.json` - pass

### Block / Save / G0H

- Block cell discipline: `qa_screenshots/r_block_cell_discipline_audit/2026-05-05T10-29-49-736Z/report.json` - pass
- H5 long-running save smoothness: `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-05T10-37-25-557Z/report.json` - pass
- N8 social save continuity: `qa_screenshots/n8_social_save_continuity_audit/2026-05-05T10-37-25-577Z/report.json` - pass
- G0H scripted playthrough: `qa_logs/g0h_scripted_playthrough/2026-05-05T10-30-04-579Z/report.json` - pass, 13/13 lanes

### Scenario Suite

Final full run:

`qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T10-44-10-770Z/report.json`

Result: `node scripts/run-scenario.js --all` passed 41/41.

Note: an earlier full sweep and one isolated rerun failed `seed-zone-pull-resource` at 2/3 moved butterflies. A later isolated rerun passed, and the final full rerun passed 41/41. This remains a timing-sensitive scenario worth watching, but it is not failing after the ENV53 and save fixes.

## Honest Current Read

ENV53 makes the ecology layer feel more like a functional world:

- stored food has scarcity and depletion
- shade requests can produce actual rest behavior
- butterflies talk about ecology tasks and then materially act on them
- event evidence is less vulnerable to ring-buffer loss

Remaining believability gaps still worth planning:

- reserve food is consumed through interaction metadata, but there is not yet a player-facing depletion visual/state
- shade/rest uses block proximity and sleep subtype, but there is not yet a richer shade-volume or comfort map
- ecology tasks are now functional, but society-scale planning is still shallow: no multi-step project ownership, role specialization, or shared construction plans yet
- `seed-zone-pull-resource` is green but timing-sensitive

