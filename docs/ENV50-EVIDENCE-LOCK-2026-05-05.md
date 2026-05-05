# ENV50 Evidence Lock - Ecology Dialogue Follow-Through

Date: 2026-05-05

## Purpose

ENV49 proved that ecology-related dialogue can appear organically. ENV50 adds a stricter measurement layer: after butterflies talk about cleaning, planting, reserve food, or resting near shade, the audit now records whether the world state shows matching follow-through.

This phase does not change game behavior. It only corrects and extends `scripts/run-ecology-dialogue-causality-audit.js` so future phases cannot confuse "they said the right thing" with "they acted on the right thing."

## Measurement Shape

```text
Ecology dialogue lane
│
├─ cleanup speech ─────▶ dirt piles cleaned OR cleanup target acquired
├─ pollen/plant speech ─▶ pending pollen planting OR pollen carriers present
├─ reserve-food speech ─▶ reserve object touched after setup conversion
└─ shade/rest speech ───▶ tired butterfly settles near placed blocks
```

## Implementation Notes

- Tightened cleanup language detection so generic phrases like "stay clear of that side" no longer count as cleanup work.
- Added `followThrough` metrics to the ecology dialogue causality audit:
  - `initialSeedDirtPiles`
  - `remainingSeedDirtPiles`
  - `cleanedSeedDirtPiles`
  - `cleanupTargetingCount`
  - `pendingPollenPlantings`
  - `pollenCarriers`
  - `reserveFoodTouched`
  - `reserveFoodInteractionCount`
  - `reserveFoodBaselineInteractionCount`
  - `reserveFoodLastInteractionType`
  - `tiredNearBlocksCount`
- Added `followThroughVerdict` for cleanup, pollen, reserve food, and shade/rest.
- Corrected reserve-food baseline accounting. The fixture creates reserve food by converting a flower, which already increments the object's interaction count. ENV50 subtracts that setup interaction so only post-setup use counts as follow-through.

## Evidence

### Forced Fixture Sampling

Report:

`qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T08-52-05-286Z/report.json`

Result:

```json
{
  "overall": "pass",
  "mode": "fixture-forced-sampling",
  "followThroughVerdict": {
    "cleanup": "observed",
    "pollen": "observed",
    "reserveFood": "residual",
    "shadeRest": "residual"
  },
  "dialogueCount": 84,
  "ecologyDialogueCount": 34,
  "ecologyDialogueRatio": 0.4048,
  "cleanupDialogueCount": 10,
  "plantingDialogueCount": 13,
  "shelterDialogueCount": 6,
  "reserveDialogueCount": 11,
  "scoutDialogueCount": 3,
  "cleanedSeedDirtPiles": 4,
  "reserveFoodInteractionCount": 0,
  "tiredNearBlocksCount": 0
}
```

Interpretation:

The dialogue lanes are all reachable, including reserve-food and shade/rest language. However, the follow-through metrics show no post-setup reserve-food use and no tired butterflies settling near blocks. These are real residual behavior gaps.

### Unforced Organic Soak

Report:

`qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T08-49-37-245Z/report.json`

Command:

```powershell
node scripts/run-ecology-dialogue-causality-audit.js --unforced --frames 14400
```

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
  "dialogueCount": 76,
  "ecologyDialogueCount": 30,
  "ecologyDialogueRatio": 0.3947,
  "cleanupDialogueCount": 2,
  "plantingDialogueCount": 2,
  "shelterDialogueCount": 9,
  "reserveDialogueCount": 0,
  "scoutDialogueCount": 24,
  "cleanedSeedDirtPiles": 4,
  "cleanupTargetingCount": 3,
  "pendingPollenPlantings": 1,
  "pollenCarriers": 3,
  "reserveFoodInteractionCount": 0,
  "tiredNearBlocksCount": 0
}
```

Interpretation:

The unforced run is healthier than earlier social-language checks: ecology talk is a meaningful share of all dialogue, and cleanup/pollen follow-through appears without forced sampling. But reserve-food behavior and shade/rest behavior still do not follow through organically.

## Honest Current Read

ENV50 raises the bar from "butterflies can say ecology-aware things" to "butterflies can act on ecology-aware needs." The result is mixed in a useful way:

- Cleanup is now credible: dirt piles are removed and cleanup targeting appears.
- Pollen/planting is credible: pollen carriers and pending pollen plantings appear.
- Reserve-food language is wired, but reserve objects are not yet being used after setup.
- Shade/rest language is wired, but tired butterflies are not yet choosing or settling near block shade as an embodied rest strategy.

## Next Recommended Phase: ENV51

ENV51 should be a narrow behavior-follow-through phase:

1. Connect reserve-food planning to actual reserve-object targeting and use.
2. Connect shade/rest planning to actual movement toward nearby block shade and rest settling.
3. Keep communication wording stable unless behavior work exposes a wording contradiction.
4. Extend the ecology dialogue causality audit so forced mode treats reserve-food and shade/rest follow-through as blocking once those hooks land.
5. Keep unforced mode as measurement-first; it should report organic rates honestly instead of failing the whole run for rarity.

Suggested owned systems for ENV51 investigation:

- `systems/communicationSystem.js` for the existing ecology work signal reasons.
- `systems/objectSystem.js` for reserve-food carry/use truth.
- `systems/behaviorSystem.js` for action selection and movement target ownership.
- Rest/sleep ownership code, if shade-rest needs to feed a proper rest decision rather than direct movement mutation.

Do not introduce new cognition vocabulary for ENV51. The gap is action follow-through, not expression vocabulary.
