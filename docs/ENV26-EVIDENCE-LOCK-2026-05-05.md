# ENV26 Evidence Lock - Socially Aware Pollen Handoff Selection

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`

## Purpose

ENV25 proved the pollen economy can repeat. ENV26 changes recipient choice from "nearest empty carrier" toward a simple situated decision:

```
eligible recipient
      |
      +-- must be normal, not traveling, not already carrying pollen,
      |   not already committed to a pollen drop
      |
      +-- score =
            distance fit
          + relationship trust / comfort / admiration
          + object-task readiness
          + local flower scarcity
```

This is still deterministic game AI, not consciousness. The improvement is that pollen handoff now has a legible social/task preference instead of pure proximity.

## Changes

- `core/config.js`
  - Added pollen handoff scoring weights:
    - `handoffDistanceWeight`
    - `handoffRelationshipWeight`
    - `handoffTaskReadinessWeight`
    - `handoffScarcityWeight`

- `core/gameCore.js`
  - Added `scorePollenHandoffRecipient()`.
  - `updateButterflyPollenInventories()` now selects the highest-scoring eligible recipient.
  - Recipients are skipped when they are not normal, traveling, already carrying pollen, or already assigned to a pollen drop.

- `scripts/run-environment-pollen-economy-audit.js`
  - Added `handoff-prefers-socially-suited-recipient`.
  - The targeted lane places a donor near a low-trust close recipient and a slightly farther high-trust/high-task-readiness recipient. The production handoff path must choose the socially suited recipient.
  - The longer economy lane still proves multiple organic handoffs, plantings, blooms, and readable feed rows.

## Proof Summary

```
┌─────────────────────────────────────┬────────┬──────────────────────────────────────────────────────────────────────┐
│ Proof                               │ Result │ Report                                                               │
├─────────────────────────────────────┼────────┼──────────────────────────────────────────────────────────────────────┤
│ pollen economy + selection audit    │ pass   │ qa_screenshots/environment_pollen_economy_audit/2026-05-05T04-20-51-956Z/report.json │
│ pollen propagation audit            │ pass   │ qa_screenshots/environment_pollen_propagation_audit/2026-05-05T04-21-17-292Z │
│ flower lifecycle audit              │ pass   │ qa_screenshots/r_flower_lifecycle_audit/2026-05-05T04-21-17-301Z/report.json │
│ runtime self-audit                  │ pass   │ qa_screenshots/runtime_self_audit/report.json                         │
│ feed thread audit                   │ pass   │ qa_screenshots/r_feed_thread_audit/2026-05-05T04-22-39-156Z/report.json │
│ occupancy contract audit            │ pass   │ qa_screenshots/environment_occupancy_contract_audit/2026-05-05T04-22-39-171Z/report.json │
│ full scenario suite                 │ pass   │ 39/39 pass, first report qa_screenshots/scenario/seed-affection/2026-05-05T04-23-01-772Z/report.json │
└─────────────────────────────────────┴────────┴──────────────────────────────────────────────────────────────────────┘
```

The selected pollen economy run produced:

- targeted social recipient selection: pass
- `pollen:handoff`: 2
- `pollen:planted`: 3
- `pollen:bloomed`: 7
- page errors: 0
- console errors: 0

## Honest Residual

This is a scoring improvement, not a learned strategy. It makes one environmental task more socially legible, but it does not yet teach the ML policy to value pollination or cooperation. A future ML/corpus phase should capture pollen handoff decisions as supervised examples once the environment loop is stable enough.

