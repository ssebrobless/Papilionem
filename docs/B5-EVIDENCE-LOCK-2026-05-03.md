# B5 Evidence Lock - Cleanup / Flower / Food-Reserve Ecology

Date: 2026-05-03

Phase source: `docs/CLAUDE-POST-AA8-NEXT-BELIEVABILITY-PLAN-2026-05-02.md`, Section 5, B5.

## Scope

```
╔═══════════════════════════════ B5 ═══════════════════════════════╗
║ Cleanup ecology pressure                                         ║
╠═══════════════════╦═══════════════════════════════════════════════╣
║ World objects     ║ Activity dirt keeps cleanup work alive        ║
║ Life sim          ║ Dirt piles become social/self-maintenance pull ║
║ Communication     ║ Caregiving butterflies can acknowledge cleanup║
║ Inspect UI        ║ Ecology line includes reserve food + dirt     ║
║ Fixtures/audits   ║ Deterministic cleanup-status loop added       ║
╚═══════════════════╩═══════════════════════════════════════════════╝
```

B5 did not change save schema, ML artifacts, spatial projection math, structure placement, or core cognition vocabulary.

## Implementation Notes

- `core/config.js`
  - Added `gameConfig.cognition.affordances.cleanupSocialModulation` default `true`.
  - Added cleanup social pressure tuning:
    - `cleanupSocialPriorityBase: 4`
    - `cleanupCaregivingDriveWeight: 0.16`
    - `cleanupStatusDriveWeight: 0.10`
    - `cleanupSelfMaintenanceBoost: 0.18`
    - `cleanupStatusDisplayBoost: 0.06`
  - Added bounded activity dirt production:
    - interval `2700` frames
    - per-zone cap `6`
    - total cap `24`
    - activity threshold `0.26`

- `systems/objectSystem.js`
  - Added cleanup activity dirt helpers and per-zone frame tracking.
  - `objectSystem.update()` can now create bounded `cleanup-activity-dirt` piles from organic zone activity.

- `systems/lifeSimSystem.js`
  - Dirt pile count now contributes to cleanup pressure, self-maintenance focus, and object-awareness summary.
  - Summary object payloads expose `cleanupPressure` and `dirtPileCount`.

- `systems/communicationSystem.js`
  - Added `cleanup_care` acknowledgement subtype when caregiving butterflies notice dirt pressure around socially needy partners.

- `ui/gameUI.js`
  - Inspect `Ecology + Space` section now includes reserve food / dirt / clean counts.
  - `ui/dom/inspectPanel.js` consumes this detail state, so no separate DOM renderer patch was needed.

- `scripts/scenario/runner.js`
  - Added scenario-only controls to keep deterministic fixtures isolated:
    - `world.enableCleanupActivityDirt`
    - `world.disableFlowerDecay`
  - Added `assert_object_count` action support.

- `scripts/scenario/scenarios/seed-cleanup-status-loop.json`
  - New deterministic cleanup-status loop fixture.

- Measurement isolation:
  - `scripts/g0h/playthroughDriver.js` temporarily disables activity dirt and ordinary flower decay during the isolated G0H flower-lifecycle proof. This does not change gameplay; it prevents the proof from mixing cleanup with unrelated replenishment.
  - `scripts/run-r-flower-lifecycle-audit.js` temporarily disables activity dirt during the seeded cleanup-floor measurement. Long-soak remains the production proof that activity dirt is live.

## Proofs

```
┌──────────────────────────────┬────────┬────────────────────────────────────────────────────────────┐
│ Proof                        │ Result │ Report                                                     │
├──────────────────────────────┼────────┼────────────────────────────────────────────────────────────┤
│ Flower lifecycle             │ PASS   │ qa_screenshots/r_flower_lifecycle_audit/2026-05-03T06-24-14-446Z/report.json │
│ Spatial cleanup              │ PASS   │ qa_screenshots/r_spatial_cleanup_audit/2026-05-03T06-26-49-710Z/report.json │
│ Long-soak society fixture    │ WARN   │ qa_logs/long_soak_society/2026-05-03T06-24-14-447Z/report.json │
│ G0H scripted playthrough     │ PASS   │ qa_logs/g0h_scripted_playthrough/2026-05-03T06-26-59-440Z/report.json │
│ Scenario suite               │ PASS   │ 38/38, latest reports under qa_screenshots/scenario/*/2026-05-03T06-34..06-40Z │
└──────────────────────────────┴────────┴────────────────────────────────────────────────────────────┘
```

Long-soak result is `pass-with-society-warnings`, which is expected for this phase because several society-quality metrics remain broader believability work. B5's cleanup-gradient gate passes in both ML and heuristic runs:

- ML-on cleanup windows: `0-300s delta +13`, `300-600s delta +1`, `nonPositiveFraction = 0`.
- Heuristic cleanup windows: `0-300s delta +13`, `300-600s delta +1`, `nonPositiveFraction = 0`.
- Fixture witnessed-affection event-subscription assertions passed.
- Fixture hand-computed bond churn assertions passed.
- Fixture mean distinct zones visited assertions passed.

## Residuals Outside B5

The latest long-soak still reports society warnings unrelated to cleanup pressure:

- ML-on partner repetition remains above the desired long-soak target in the latest run.
- ML-on bond stability was near the target and may vary run-to-run.
- Grief recovery remains a broader longitudinal society-expression issue when grief packets are present.

These should be handled in a later believability / social-diversity phase, not by reopening B5 cleanup ecology.

## Acceptance

B5 acceptance is met:

- Cleanup gradient `nonPositiveFraction < 0.50`: pass, observed `0`.
- Last two cleanup windows nonzero deltas: pass, `+13` and `+1`.
- Flower lifecycle audit: pass.
- Spatial cleanup audit: pass.
- G0H scripted playthrough: pass, 13/13 lanes.
- Scenario suite: pass, 38/38.
- Inspect ecology line is wired through `buildInspectDetailDomState()` and surfaced by the DOM inspect panel detail sections.

