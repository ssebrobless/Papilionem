# ENV57 Evidence Lock - Cleanup Compost Planting Loop - 2026-05-05

## Shape

```text
╔══════════════════════╗    ╔══════════════════════╗    ╔══════════════════════╗
║ cleanup object       ║    ║ transient compost    ║    ║ pollen planting      ║
║ dirt / spent reserve ║───▶║ same board cell      ║───▶║ prefers compost cell ║
╚══════════════════════╝    ╚══════════════════════╝    ╚══════════════════════╝
          │                            │                            │
          ▼                            ▼                            ▼
 ecology:cleanup-object       ecology:cleanup-compost       pollen:sprinkle /
 -cleaned                     -created                      pollen:bloomed
                                                            compostBoosted=true
```

## What Changed

- Added transient `gameState.cleanupCompostPatches`.
- Cleaning a dirt pile or depleted reserve-food husk now leaves a short-lived compost patch on the cleaned board cell.
- Pollen drop planning now prefers live compost cells near the pollinated butterfly.
- Pollen planted on compost blooms faster by config multiplier and reports `compostBoosted: true` on sprinkle and bloom events.
- A consumed compost patch is removed when its boosted planting blooms.
- No save schema change. Compost patches are runtime-only and are cleared on reset.

## Files

- `core/config.js`
  - Adds compost controls under `gameConfig.entities.flower.pollenPropagation`.
- `core/gameCore.js`
  - Owns transient compost patch lifecycle, compost-aware pollen target planning, boosted bloom timing, and compost event evidence.
- `entities/flower.js`
  - Calls `gameCore.recordCleanupCompostPatch()` after successful cleanup.
- `scripts/run-ecology-dialogue-causality-audit.js`
  - Adds compost event accumulation, forced compost pollen probe, and boosted sprinkle/bloom checks.

## Proofs

| Proof | Result | Report |
| --- | --- | --- |
| Forced ecology dialogue causality | PASS | `qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T11-57-16-649Z/report.json` |
| Unforced ecology dialogue causality | PASS / healthy | `qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T11-59-29-588Z/report.json` |
| Flower lifecycle | PASS | `qa_screenshots/r_flower_lifecycle_audit/2026-05-05T11-57-57-076Z/report.json` |
| Block cell discipline | PASS | `qa_screenshots/r_block_cell_discipline_audit/2026-05-05T11-57-57-085Z/report.json` |
| Runtime self audit | PASS | `qa_screenshots/runtime_self_audit/report.json` |
| H5 long-running save smoothness | PASS | `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-05T11-59-29-593Z/report.json` |
| N8 social save continuity | PASS | `qa_screenshots/n8_social_save_continuity_audit/2026-05-05T11-59-29-587Z` |
| G0H scripted playthrough | PASS 13/13 | `qa_logs/g0h_scripted_playthrough/2026-05-05T12-00-15-206Z/report.json` |
| Scenario suite | PASS 41/41 | final scenario `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T12-07-14-560Z/report.json` |

## Key Evidence

- Forced ecology audit observed `cleanupCompostCreatedEventCount: 12`.
- Forced compost probe completed a pollen drop with `plannedOnAnyCompost: true`.
- Forced proof observed `compostBoostedSprinkleCount: 1` and `compostBoostedBloomCount: 1`.
- Unforced ecology soak remained healthy with cleanup, pollen, reserve-food, shade-rest, and scout dialogue lanes visible.
- Block occupancy still rejects flowers, dirt piles, reserve food, depleted reserve husks, and pollen patches; compost remains transient fertility metadata rather than a blocking object.

## Current Status

ENV57 closes the first real ecology loop:

```text
clean mess ──▶ improve ground ──▶ plant faster ──▶ restore flowers ──▶ create future food/tasks
```

This gives butterflies a functional reason to clean and plant instead of treating cleanup as a cosmetic chore. The next likely environment phase should make compost/pollen behavior more socially legible in live play: dialogue should sometimes reference recently cleaned fertile ground, and scenario coverage should prove that pollen carriers choose compost organically without a forced probe.
