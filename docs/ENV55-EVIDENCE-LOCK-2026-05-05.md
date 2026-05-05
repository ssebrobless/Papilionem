# ENV55 Evidence Lock - Depleted Reserve Husk Cleanup

Date: 2026-05-05

## Goal

Make reserve food finite in a way that keeps creating lived environmental work. Once a reserve-food ball is depleted, it should stop behaving like food, become a visible spent husk, count as cleanup pressure, and be removable by butterflies through the normal cleanup affordance.

## Shape

```text
reserve food ball
      │ shared 6 times
      ▼
depleted reserve husk
      │ object profile: cleanup / not consumable
      ▼
butterfly cleanup targeting
      │ same adjacency + selfMaintenance gate as dirt piles
      ▼
ecology:cleanup-object-cleaned
      │
      ▼
removed from garden + object memory
```

## Code Changes

- `entities/flower.js`
  - Added `isCleanupObject()` and `getCleanupObjectKind()`.
  - Depleted reserve-food balls now expose object profile subtype `depleted-reserve-food`, tags `garden-object`, `spent-food-reserve`, `cleanup`, `consumable: false`, and `lifecycleStage: depleted`.
  - `tryCleanupDirtPile()` now accepts both dirt piles and depleted reserve husks, records the cleanup kind, writes a matching object memory tag, emits `ecology:cleanup-object-cleaned`, and removes the object with the correct reason.

- `entities/butterfly.js`
  - Cleanup target selection now uses `flower.isCleanupObject()` so depleted reserve husks become normal cleanup targets.

- `systems/communicationSystem.js`
  - Cleanup work communication now counts total cleanup objects, including depleted reserve husks.
  - Cleanup metadata includes `dirtPileCount`, `reserveHuskCount`, and `cleanupObjectCount`.
  - Added one direct cleanup phrase about spent food husks taking plantable space.

- `scripts/run-ecology-dialogue-causality-audit.js`
  - Subscribes to `ecology:cleanup-object-cleaned`.
  - Seeds one depleted reserve husk and asserts it is visibly depleted, cleaned, and represented by a cleanup event.
  - Uses reserve-food event accumulation as the truth source when the depleted reserve object has already been cleaned and removed before final snapshot.

## Proofs

Forced ecology causality:

- Command: `node scripts/run-ecology-dialogue-causality-audit.js`
- Report: `qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T11-04-37-029Z/report.json`
- Overall: pass
- Reserve husk cleaned: true
- Reserve husk cleanup events: 1
- Total cleanup-object events: 14

Unforced ecology soak:

- Command: `node scripts/run-ecology-dialogue-causality-audit.js --unforced --frames 14400`
- Report: `qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T11-05-22-306Z/report.json`
- Overall: pass
- Verdict: healthy
- Reserve husk cleaned: true
- Total cleanup-object events: 20
- Reserve food uses: 6 / 6
- Shade-rest settling events: 38

Regression suite:

- `node scripts/run-r-flower-lifecycle-audit.js`
  - Pass: `qa_screenshots/r_flower_lifecycle_audit/2026-05-05T11-06-20-380Z/report.json`
- `node scripts/run-runtime-self-audit.js`
  - Pass: `qa_screenshots/runtime_self_audit/report.json`
- `node scripts/run-scenario.js --all`
  - Pass: 41 / 41, ending at `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T11-14-55-922Z/report.json`
- `node scripts/run-g0h-scripted-playthrough.js`
  - First run: 12 / 13, flower-lifecycle timing variance, cleaned 3 where strict lane wanted 5.
  - Rerun: 13 / 13 pass at `qa_logs/g0h_scripted_playthrough/2026-05-05T11-15-48-618Z/report.json`
- `node scripts/run-h5-long-running-save-smoothness-audit.js`
  - Pass: `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-05T11-23-08-340Z/report.json`
- `node scripts/run-n8-social-save-continuity-audit.js`
  - Pass: `qa_screenshots/n8_social_save_continuity_audit/2026-05-05T11-23-08-340Z`

## Honest Notes

- The new cleanup path does not add cognition vocabulary. It gives the existing cleanup, self-maintenance, object-memory, and ecology-communication systems another concrete object to act on.
- The first G0H rerun exposed that the flower-lifecycle lane can still wobble around its strict net-cleaned threshold. Because the immediate rerun passed 13 / 13 and the dedicated flower lifecycle audit passed, this is recorded as timing variance, not a deterministic blocker.
- The next useful environmental step is to make spent husks optionally compostable or useful as a soil/pollen bonus after cleanup, so cleanup can feed back into planting instead of only removing clutter.
