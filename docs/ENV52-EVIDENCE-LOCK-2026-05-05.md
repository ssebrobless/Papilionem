# ENV52 Evidence Lock - Organic Ecology Opportunity Selection

Date: 2026-05-05

## Purpose

ENV51 proved reserve-food and shade/rest follow-through when those lanes are selected. The remaining weakness was organic selection: unforced soaks often produced generic rest/scout talk while reserve-food and shade/rest behavior stayed rare.

ENV52 changes the ecology communication selector from fixed lane order to scored opportunity selection.

```text
Every eligible butterfly
│
├─ detect local opportunities
│   ├─ pollen / planting
│   ├─ reserve food
│   ├─ shade / rest
│   └─ cleanup
│
├─ score by actual need
│   ├─ reserve: selfMaintenance / resourceControl / exhaustion
│   ├─ shade: rest / exhaustion / block availability
│   ├─ cleanup: caregiving / dirt pile pressure
│   └─ pollen: pollen charges / pending drop
│
└─ emit highest-scoring lane
    └─ urgent reserve/rest can interrupt migration noise
```

## Files Changed

- `core/config.js`
  - Adds `gameConfig.cognition.ecologyCommunication.opportunitySelection`.
- `systems/communicationSystem.js`
  - Replaces fixed pollen -> reserve -> shade -> cleanup order with scored opportunity selection.
  - Allows urgent reserve-food and shade-rest opportunities to survive migration/scout pressure when their score clears the configured urgency floor.
- `scripts/run-ecology-dialogue-causality-audit.js`
  - Adds `pollenFollowThroughEventCount` from `pollen:sprinkle` / `pollen:bloomed` event history so completed pollen work is not misreported as residual after pending state clears.

No save schema changes. No new cognition vocabulary. No ML artifact change.

## Evidence

### Forced Ecology Causality

Command:

```powershell
node scripts/run-ecology-dialogue-causality-audit.js
```

Report:

`qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T09-42-30-633Z/report.json`

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
  "ecologyDialogueRatio": 0.4433,
  "reserveDialogueCount": 17,
  "reserveFoodInteractionCount": 24,
  "shadeRestTargetingCount": 11
}
```

### Unforced Organic Soak

Command:

```powershell
node scripts/run-ecology-dialogue-causality-audit.js --unforced --frames 14400
```

Report:

`qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T09-43-03-723Z/report.json`

Result:

```json
{
  "overall": "pass",
  "mode": "unforced-soak",
  "unforcedSoakVerdict": "healthy",
  "followThroughVerdict": {
    "cleanup": "observed",
    "pollen": "observed",
    "reserveFood": "observed",
    "shadeRest": "observed"
  },
  "ecologyDialogueRatio": 0.4651,
  "cleanupDialogueCount": 5,
  "plantingDialogueCount": 5,
  "shelterDialogueCount": 29,
  "reserveDialogueCount": 7,
  "scoutDialogueCount": 26,
  "reserveFoodInteractionCount": 25,
  "shadeRestTargetingCount": 9
}
```

Interpretation:

This closes the ENV51 residual. In a short unforced soak, the butterflies now naturally select and act on all four ecology lanes: cleanup, pollen, reserve food, and shade/rest.

## Regression Proofs

- `node scripts/run-dialogue-readability-audit.js`
  - Pass: `qa_screenshots/dialogue_readability_audit/2026-05-05T09-44-07-262Z/report.json`
- `node scripts/run-r-feed-thread-audit.js`
  - Pass: `qa_screenshots/r_feed_thread_audit/2026-05-05T09-44-40-585Z/report.json`
- `node scripts/run-runtime-self-audit.js`
  - Pass: `qa_screenshots/runtime_self_audit/report.json`
- `node scripts/run-scenario.js --all`
  - Pass, 41/41: final report set ending with `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T09-51-08-968Z/report.json`
- `node scripts/run-g0h-scripted-playthrough.js`
  - Pass, 13/13: `qa_logs/g0h_scripted_playthrough/2026-05-05T09-51-13-410Z/report.json`

## Honest Current Read

The environmental layer is much closer to the target:

- Flowers can decay into cleanup work.
- Pollen can create planting work.
- Reserve food is now used and shared as a real object.
- Blocks now matter more because shade/rest targets can pull tired butterflies toward them.
- Dialogue is increasingly tied to concrete world state instead of abstract atmospheric phrases.

Remaining likely gaps:

1. Shade/rest is currently measured as target acquisition, not full sleep settlement under shade.
2. Reserve-food sharing records object use and small relief effects, but does not yet visibly deplete or partition the reserve object.
3. Longer soaks are needed to make sure ecology work does not dominate social language too heavily.
4. The player-facing UI should eventually expose why a butterfly chose a reserve/shade/cleanup action.

## Next Recommended Phase: ENV53

ENV53 should raise the proof from "targeting / object interaction" to "settled outcomes":

1. Add event/history measurement for shade-rest arrival and sleep transition near blocks.
2. Add reserve-food depletion or shared-use state so repeated sharing does not feel infinite.
3. Run a longer society soak and compare ecology/social/dialogue balance.
4. Keep all changes additive and transient unless a save field is clearly needed.

Do not change cognition vocabulary. Do not start ML work in ENV53; this is still about giving the agents a richer world to act inside.
