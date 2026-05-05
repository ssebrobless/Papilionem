# ENV51 Evidence Lock - Reserve Food and Shade/Rest Follow-Through

Date: 2026-05-05

## Purpose

ENV50 showed that ecology-aware dialogue could mention reserve food and shade/rest but did not cause matching world behavior. ENV51 wires those two dialogue lanes into production follow-through.

```text
Ecology communication
│
├─ reserve-food-planning ─▶ reserve food object interaction
│                           ├─ objectSystem records "shared reserve food"
│                           └─ recipient gets small maintenance / relief effect
│
└─ shade-rest-help ───────▶ shade-rest movement target
                            ├─ source and partner receive transient ecologyRestTarget
                            ├─ butterfly movement keeps honoring target until expiry
                            └─ sleepSystem receives shade-rest assist
```

## Files Changed

- `core/config.js`
  - Adds rollback/tuning fields under `gameConfig.cognition.ecologyCommunication.reserveFood` and `shadeRest`.
- `systems/communicationSystem.js`
  - Adds `applyReserveFoodFollowThrough`.
  - Adds `applyShadeRestFollowThrough`.
  - Calls those helpers immediately after their matching ecology work signal is emitted.
- `entities/butterfly.js`
  - Honors transient `ecologyRestTarget` while choosing wander targets.
- `scripts/run-ecology-dialogue-causality-audit.js`
  - Adds `shadeRestTargetingCount`.
  - Makes reserve-food and shade-rest follow-through blocking in forced mode.

No save schema changes. No new cognition vocabulary. No ML artifact change.

## Evidence

### Forced Ecology Causality

Command:

```powershell
node scripts/run-ecology-dialogue-causality-audit.js
```

Report:

`qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T09-06-52-350Z/report.json`

Result:

```json
{
  "overall": "pass",
  "mode": "fixture-forced-sampling",
  "followThroughVerdict": {
    "cleanup": "observed",
    "pollen": "observed",
    "reserveFood": "observed",
    "shadeRest": "observed"
  },
  "reserveFoodInteractionCount": 11,
  "reserveFoodLastInteractionType": "shared reserve food",
  "shadeRestTargetingCount": 2,
  "checks": {
    "reserve-food-follow-through-observed": true,
    "shade-rest-follow-through-observed": true
  }
}
```

### Unforced Ecology Soak

Command:

```powershell
node scripts/run-ecology-dialogue-causality-audit.js --unforced --frames 14400
```

Report:

`qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T09-07-26-195Z/report.json`

Result:

```json
{
  "overall": "pass",
  "mode": "unforced-soak",
  "unforcedSoakVerdict": "healthy",
  "followThroughVerdict": {
    "cleanup": "observed",
    "pollen": "observed",
    "reserveFood": "residual",
    "shadeRest": "residual"
  },
  "ecologyDialogueRatio": 0.2632,
  "cleanupDialogueCount": 1,
  "plantingDialogueCount": 1,
  "shelterDialogueCount": 4,
  "reserveDialogueCount": 0,
  "reserveFoodInteractionCount": 0,
  "shadeRestTargetingCount": 0
}
```

Interpretation:

The production follow-through hooks work when the ecology lane is selected. The remaining organic weakness is selection frequency: in this unforced soak, reserve-food planning did not get selected and shade-rest-help did not trigger even though generic rest distress did.

## Regression Proofs

- `node scripts/run-dialogue-readability-audit.js`
  - Pass: `qa_screenshots/dialogue_readability_audit/2026-05-05T09-08-30-099Z/report.json`
- `node scripts/run-r-feed-thread-audit.js`
  - Pass: `qa_screenshots/r_feed_thread_audit/2026-05-05T09-09-02-797Z/report.json`
- `node scripts/run-runtime-self-audit.js`
  - Pass: `qa_screenshots/runtime_self_audit/report.json`
- `node scripts/run-g0h-scripted-playthrough.js`
  - Pass, 13/13 lanes: `qa_logs/g0h_scripted_playthrough/2026-05-05T09-16-24-057Z/report.json`
- `node scripts/run-scenario.js --all`
  - Pass, 41/41: final report set ending with `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T09-37-07-079Z/report.json`

Two earlier full-suite attempts exposed narrow nondeterministic failures that passed on isolated rerun:

- `seed-relationship-arc-rivalry-to-companion`: near distance 2.25 vs max 2; isolated rerun passed.
- `seed-zone-pull-resource`: 2/3 migrated in that suite pass; isolated rerun passed.

The final full-suite rerun passed 41/41, so no regression remains open from ENV51.

## Honest Current Read

ENV51 improves the world-object loop: reserve food and shade/rest are no longer just things butterflies can talk about. They can now be turned into actual object and movement/rest behavior.

The next measured gap is not the hook itself, but organic opportunity selection:

- reserve-food objects exist, but unforced selection rarely chooses reserve-food planning;
- tired butterflies emit generic distress more often than the specific shade-rest ecology lane;
- scout/migration language still dominates some unforced soaks.

## Next Recommended Phase: ENV52

ENV52 should tune natural ecology opportunity selection without changing vocabulary:

1. Raise priority for reserve-food planning when reserve food exists and at least one nearby butterfly has high selfMaintenance, resourceControl, or exhaustion.
2. Raise priority for shade-rest-help when blocks are nearby and rest/exhaustion is high, especially when the butterfly is already producing generic tiredness distress.
3. Add unforced follow-through floors over a longer deterministic soak, while keeping short unforced runs diagnostic rather than brittle.
4. Keep forced mode blocking all four ecology follow-through lanes.

Do not add new dialogue text first. The phrase layer is already adequate for this slice; the gap is that natural selection is not reliably choosing the reserve/shade lanes.
