# ENV24 Evidence Lock - Pollen Cooperation Feed Surfacing

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`

## Purpose

ENV23 made pollen handoff become lived planting. ENV24 makes that loop player-visible in the activity feed with plain social/ecology language.

```
pollen handoff event -> Action feed: "Passed pollen to ..."
pollen planted event -> Action feed: "Planted pollen for a new flower."
pollen bloom event   -> Action feed: "A planted flower bloomed."
```

The goal is not to fake conversation. The goal is to make real environment actions readable so the player can notice cooperation instead of only seeing hidden state.

## Changes

- `core/gameCore.js`
  - Emits `pollen:bloomed` when a pending pollen planting successfully matures into a flower.

- `ui/gameUI.js`
  - Adds pollen handoff, planting, bloom, and expiry events to the significant activity feed event set.
  - Formats them as natural action-feed lines:
    - `Passed pollen to <recipient>.`
    - `Planted pollen for a new flower.`
    - `A planted flower bloomed.`
    - `Lost unused pollen.`

- `scripts/run-environment-pollen-propagation-audit.js`
  - Subscribes to `pollen:bloomed`.
  - Adds `feed-surfaces-pollen-cooperation-language`, proving the action feed contains handoff, planting, and bloom language after the lived handoff loop.

## Proof Summary

```
┌──────────────────────────────────────┬────────┬──────────────────────────────────────────────────────────────────────┐
│ Proof                                │ Result │ Report                                                               │
├──────────────────────────────────────┼────────┼──────────────────────────────────────────────────────────────────────┤
│ pollen propagation + feed language   │ pass   │ qa_screenshots/environment_pollen_propagation_audit/2026-05-05T03-56-37-575Z │
│ feed thread audit                    │ pass   │ qa_screenshots/r_feed_thread_audit/2026-05-05T03-56-51-140Z/report.json │
│ occupancy contract audit             │ pass   │ qa_screenshots/environment_occupancy_contract_audit/2026-05-05T03-56-51-149Z/report.json │
│ runtime self-audit                   │ pass   │ qa_screenshots/runtime_self_audit/report.json                         │
│ full scenario suite                  │ pass   │ 39/39 pass, first report qa_screenshots/scenario/seed-affection/2026-05-05T03-57-24-363Z/report.json │
└──────────────────────────────────────┴────────┴──────────────────────────────────────────────────────────────────────┘
```

## Honest Residual

This closes visibility for the pollen loop as action-feed language. It does not yet make butterflies verbally discuss pollination goals or choose pollen recipients based on explicit social suitability. The next useful step is to measure longer-run pollen economy behavior and decide whether recipient selection should consider relationship edges, current task pressure, and zone resource scarcity.

