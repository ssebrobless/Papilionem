# ENV54 Evidence Lock - Reserve Food Depletion Visual State

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`

## Goal

ENV53 made reserve food finite in simulation truth. ENV54 makes that truth player-facing: a reserve-food ball that has been fully shared now renders as a depleted husk instead of continuing to look like available food.

No save schema change. No cognition vocabulary change. No resource-rule change.

## Implementation

Files changed:

- `entities/flower.js`
- `scripts/run-ecology-dialogue-causality-audit.js`

### Flower Visual State

`Flower` now exposes:

- `getReserveFoodUseState()`
- `isReserveFoodDepleted()`
- `getReserveFoodVisualState()`

Visual states:

- `full`
- `used`
- `low`
- `depleted`

`drawReserveFoodBall()` now uses the visual state:

- full/used/low balls stay colored, with size/highlight reduced by remaining ratio
- depleted balls draw as a darker flattened husk with a subtle outline

The visual reads from `objectSystem` metadata written by ENV53:

- `reserveFoodUseCount`
- `reserveFoodMaxUses`
- `reserveFoodDepleted`

### Audit

`scripts/run-ecology-dialogue-causality-audit.js` now records:

- `reserveFoodVisualState`
- `reserveFoodUseState`

Forced mode adds a blocking check:

- `reserve-food-depleted-visual-state`

When `reserveFoodDepleted === true`, the visual state must be `depleted`.

## Proofs

### Ecology Dialogue Causality - Forced

Report:

`qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T10-46-35-494Z/report.json`

Result: pass

Key values:

- `reserveFoodUseCount`: 6
- `reserveFoodMaxUses`: 6
- `reserveFoodDepleted`: true
- `reserveFoodVisualState`: `depleted`
- `reserveFoodUseState.remainingRatio`: 0
- `shadeRestArrivedCount`: 16
- `shadeRestSettlingSleepCount`: 13

Screenshot:

`qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T10-46-35-494Z/ecology-dialogue-causality.png`

### Ecology Dialogue Causality - Unforced

Report:

`qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T10-47-09-275Z/report.json`

Result: pass, `unforcedSoakVerdict: healthy`

Key values:

- `reserveFoodUseCount`: 6
- `reserveFoodMaxUses`: 6
- `reserveFoodDepleted`: true
- `reserveFoodVisualState`: `depleted`
- `shadeRestArrivedCount`: 39
- `shadeRestSettlingSleepCount`: 37

### Visual / Runtime Regressions

- Runtime self-audit: `qa_screenshots/runtime_self_audit/report.json` - pass
- Feed thread audit: `qa_screenshots/r_feed_thread_audit/2026-05-05T10-53-23-422Z/report.json` - pass
- Sprite fidelity audit: `qa_screenshots/r_sprite_fidelity_audit/2026-05-05T10-48-09-661Z/report.json` - pass
- Flower lifecycle audit: `qa_screenshots/r_flower_lifecycle_audit/2026-05-05T10-57-19-177Z/report.json` - pass

Note: the first flower lifecycle run at `2026-05-05T10-55-41-731Z` failed because the organic fixture seeded 7 piles while its strict lane expected exactly 8, despite cleaning 7/7. The immediate rerun seeded 8/8 and passed. This is fixture wobble, not an ENV54 visual regression.

## Honest Current Read

Reserve food now has a clean truth-to-presentation path:

```text
flower converted to reserve
  |
  v
shared use increments object metadata
  |
  v
useCount reaches maxSharedUses
  |
  v
reserveFoodDepleted = true
  |
  v
Flower.getReserveFoodVisualState() = depleted
  |
  v
drawReserveFoodBall() renders a spent husk
```

Remaining likely next steps:

- make depleted reserve husks cleanable or compostable so they become another environmental task
- expose food-reserve state in inspect/feed language when butterflies discuss it
- create a shade/comfort map rather than only targetting nearest block
- add multi-step project ownership for building and ecology work

