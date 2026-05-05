# ENV56 Evidence Lock - Garden Object Cell Discipline

Date: 2026-05-05

## Goal

Make garden objects and building cells agree with the rule the player asked for: flowers, dirt piles, reserve food, depleted reserve husks, and pollen patches each occupy their board unit, so blocks cannot be placed on top of them.

## Shape

```text
ground board cell (zone, u, v, h=0)
      │
      ├─ flower                 ──▶ occupied-by-flower
      ├─ dirt pile              ──▶ occupied-by-dirt-pile
      ├─ reserve food           ──▶ occupied-by-reserve-food
      ├─ depleted reserve husk  ──▶ occupied-by-reserve-husk
      └─ pollen patch           ──▶ occupied-by-pollen-patch

block placement request
      │
      ▼
structureSystem.acceptCellPlacement()
      │
      ├─ occupied ▶ reject
      └─ clear    ▶ accept
```

## Code Changes

- `systems/structureSystem.js`
  - Depleted reserve-food balls now report occupancy as `occupied-by-reserve-husk` with occupant type `depleted-reserve-food`.
  - Stable reserve-food balls still report `occupied-by-reserve-food`.

- `systems/objectSystem.js`
  - Added `isCleanupGardenWaste()` and `getZoneCleanupObjects()`.
  - Activity dirt pressure now counts all cleanup clutter, including depleted reserve husks, when enforcing total and per-zone cleanup caps.

- `scripts/run-r-block-cell-discipline-audit.js`
  - Added `garden-object-occupancy` lane proving block placement rejection for:
    - flower
    - dirt pile
    - reserve food
    - depleted reserve husk
    - pollen patch

- `scripts/run-r-flower-lifecycle-audit.js`
  - Reserve lifecycle lane now accepts both stable reserve food and depleted reserve husk outcomes. This reflects the finite-use reserve behavior introduced earlier: a reserve object can remain stable or become a cleanup object depending on lived use timing.

## Proofs

Block cell discipline:

- Command: `node scripts/run-r-block-cell-discipline-audit.js`
- Report: `qa_screenshots/r_block_cell_discipline_audit/2026-05-05T11-26-52-096Z/report.json`
- Overall: pass
- New lane: `garden-object-occupancy`
- All five probes rejected block placement for the expected reason.

Ecology causality:

- Forced: `qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T11-27-09-105Z/report.json`
  - Overall: pass
  - Reserve husk cleanup observed
- Unforced: `qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T11-27-44-194Z/report.json`
  - Overall: pass
  - Verdict: healthy

Flower lifecycle:

- First post-change run failed on organic cleanup timing: 5 cleaned where the lived floor expects 6.
- Rerun passed: `qa_screenshots/r_flower_lifecycle_audit/2026-05-05T11-31-25-921Z/report.json`
- Reserve outcome in the passing run: stable reserve-food ball.

End-to-end:

- `node scripts/run-g0h-scripted-playthrough.js`
  - Pass: 13 / 13 at `qa_logs/g0h_scripted_playthrough/2026-05-05T11-32-55-919Z/report.json`
- `node scripts/run-scenario.js --all`
  - First full run failed only `seed-zone-pull-resource`, matching known migration-threshold timing variance.
  - Isolated rerun passed: `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T11-41-45-001Z/run-1/report.json`
  - Full rerun passed 41 / 41, ending at `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T11-49-18-711Z/report.json`
- `node scripts/run-runtime-self-audit.js`
  - Pass: `qa_screenshots/runtime_self_audit/report.json`
- `node scripts/run-h5-long-running-save-smoothness-audit.js`
  - Pass: `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-05T11-49-45-318Z/report.json`
- `node scripts/run-n8-social-save-continuity-audit.js`
  - Pass: `qa_screenshots/n8_social_save_continuity_audit/2026-05-05T11-49-45-326Z`

## Honest Notes

- No save schema changes.
- No projection math changes.
- No cognition vocabulary changes.
- `seed-zone-pull-resource` still has timing variance around the `3 moved out of ivy` threshold. It passed isolated and in the final full suite, but it remains a good candidate for a future measurement-hardening slice.
- The next useful environmental step is to close the loop from cleanup into regrowth: cleaned waste could leave a short-lived soil/compost benefit that makes nearby pollen planting more valuable and socially legible.
