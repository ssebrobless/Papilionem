# ENV25 Evidence Lock - Organic Pollen Economy Audit

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`

## Purpose

ENV23 proved one handoff-to-planting loop. ENV24 made that loop readable in the activity feed. ENV25 adds a longer organic audit to test whether a small group can produce repeated pollen handoffs, plantings, blooms, and readable feed evidence through normal update ticks.

```
seed pollen carriers
      |
      v
normal update loop
      |
      +--> social handoff events
      +--> lived planting events
      +--> bloom events
      +--> sampled feed rows at handoff / planting / bloom moments
```

## What The Audit Found

The first ENV25 run found a real production edge:

- multiple handoffs passed,
- multiple lived plantings passed,
- blooms failed in the 60-second economy window,
- some mature pollen patches could be removed after a failed bloom attempt.

Root cause: `updatePollenPlantings()` tried to mature a reserved pollen patch using normal flower spawn constraints, then removed the pending planting even if `spawnFlowerAt()` returned `null`.

## Changes

- `core/config.js`
  - Added `entities.flower.pollenPropagation.bloomRetryFrames = 30`.

- `core/gameCore.js`
  - Reserved pollen blooms now pass `ignoreZoneFlowerCap: true`.
  - If a bloom attempt fails, the pending pollen planting is retained and retried after `bloomRetryFrames`.
  - Successful blooms still remove the pending planting and emit `pollen:bloomed`.

- `scripts/run-environment-pollen-economy-audit.js`
  - New audit.
  - Seeds a small synthetic group in `moss-hollow`, gives two butterflies pollen charges as a precondition, then lets normal `gameCore.update()` ticks handle handoff, movement, planting, and bloom.
  - Samples feed rows at the handoff, planting, and bloom moments so event-ring rotation does not hide rows that were visible live.

## Proof Summary

```
┌─────────────────────────────────────┬────────┬──────────────────────────────────────────────────────────────────────┐
│ Proof                               │ Result │ Report                                                               │
├─────────────────────────────────────┼────────┼──────────────────────────────────────────────────────────────────────┤
│ organic pollen economy audit        │ pass   │ qa_screenshots/environment_pollen_economy_audit/2026-05-05T04-09-18-790Z/report.json │
│ pollen propagation audit            │ pass   │ qa_screenshots/environment_pollen_propagation_audit/2026-05-05T04-09-42-222Z │
│ feed thread audit                   │ pass   │ qa_screenshots/r_feed_thread_audit/2026-05-05T04-09-42-221Z/report.json │
│ flower lifecycle audit              │ pass   │ qa_screenshots/r_flower_lifecycle_audit/2026-05-05T04-09-42-231Z/report.json │
│ runtime self-audit                  │ pass   │ qa_screenshots/runtime_self_audit/report.json                         │
│ occupancy contract audit            │ pass   │ qa_screenshots/environment_occupancy_contract_audit/2026-05-05T04-11-07-681Z/report.json │
│ flower spawn rebalance audit        │ pass   │ qa_screenshots/environment_flower_spawn_rebalance_audit/2026-05-05T04-11-07-692Z │
│ full scenario suite                 │ pass   │ 39/39 pass, first report qa_screenshots/scenario/seed-affection/2026-05-05T04-11-41-119Z/report.json │
└─────────────────────────────────────┴────────┴──────────────────────────────────────────────────────────────────────┘
```

The passing organic pollen economy run produced:

- `pollen:handoff`: 2
- `pollen:planted`: 4
- `pollen:bloomed`: 7
- page errors: 0
- console errors: 0

## Honest Residual

This proves the economy can repeat over a short synthetic run. It still does not prove selective intelligence in pollen recipient choice. The next stronger believability phase should make handoff choice consider:

- partner relationship quality,
- nearby task pressure,
- zone flower scarcity,
- whether the recipient is already carrying pollen or pursuing a higher-priority task.

