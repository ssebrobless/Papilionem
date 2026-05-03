# B3 Evidence Lock - Relationship Arc Dynamics

Date: 2026-05-03

## Phase Goal

B3 makes relationship tiers move because of lived social pressure instead of
random churn. Existing social-edge tags now apply bounded event-weighted
pressure, and upward bond-tier transitions emit `relationshipArcEvent` as an
event-only cognition trigger. No new memory kind, no schema bump, and no ML or
save logic changes were made for this phase.

## Implementation Shape

```
Existing social event
  │
  ▼
edge.historyTags
  │
  ▼
lifeSimSystem.applyRelationshipArcTagWeights()
  │
  ├─ shared success  -> trust/comfort/attachment/co-time up
  ├─ conflict        -> trust/comfort/attachment down, resentment up
  ├─ long absence    -> comfort/attachment down
  ├─ witnessed affection -> small rivalry pressure
  └─ loyalty choice  -> trust/attachment/co-time up
  │
  ▼
deriveBondTier(edge)
  │
  ▼
relationshipArcEvent on upward tier transition
```

## Files Changed For B3

- `core/config.js`
  - Added `gameConfig.cognition.bondTier.arcEvents`.
  - Rollback flag: `gameConfig.cognition.bondTier.arcEvents.enabled = false`.
- `systems/lifeSimSystem.js`
  - Added arc tag weighting helpers.
  - `updateBondTiers()` now consumes relationship event tags before deriving the
    tier.
  - Upward tier transitions emit `relationshipArcEvent`.
  - Long-absence and loyalty production paths now mark edge tags for arc
    weighting.
- `scripts/g0h/societyMetrics.js`
  - Bond churn now reports sample-tier churn plus
    `relationshipArcEvent` subscription churn.
  - B3 interim churn band is `0.25..2.0 transitions/min`.
- `scripts/scenario/scenarios/seed-relationship-arc-rivalry-to-companion.json`
  - New deterministic fixture proving a low-trust relationship can recover to
    companion with an observable `relationshipArcEvent`.

## Capture Gate Before B3

- F1 session capture audit: PASS
  - `qa_screenshots/f1_session_capture_audit/2026-05-03T03-26-49-307Z/report.json`
- Fresh G0H scripted capture: PASS, 13/13
  - Output folder:
    `qa_logs/g0h_scripted_playthrough/2026-05-03T03-27-07-271Z`
  - Capture:
    `qa_logs/g0h_scripted_playthrough/2026-05-03T03-27-07-271Z/capture/capture.json`
  - Human review:
    `qa_logs/g0h_scripted_playthrough/2026-05-03T03-27-07-271Z/human-review.md`

## B3 Proofs

### Relationship Arc Fixture

Command:

```bash
node scripts/run-scenario.js seed-relationship-arc-rivalry-to-companion
```

Result: PASS

Report:

`qa_screenshots/scenario/seed-relationship-arc-rivalry-to-companion/2026-05-03T03-39-46-453Z/report.json`

Key acceptance:

- `briar_arc_reaches_companion`: PASS
- `briar_trust_recovers`: PASS
- `relationship_arc_event_fires`: PASS

### Long-Soak Society Fixture

Command:

```bash
node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json
```

Result: `pass-with-society-warnings`

Report:

`qa_logs/long_soak_society/2026-05-03T03-39-55-374Z/report.json`

Important numbers:

- ML-on bond churn: `0.5/min` PASS against B3 interim band `0.25..2.0/min`
- ML-on bond stability: `0.1227` PASS against `<= 0.30`
- ML-on witnessed-affection rate: `1.5/min` PASS
- Fixture hand-computed bond churn: PASS, expected `2`, observed `2`
- Residual warning: zone migration entropy remains low
  (`meanEntropy 0.1001`, `meanDistinctZonesVisited 1.2143`). This is the
  known B4 target, not a B3 failure.

### G0H Scripted Playthrough

Command:

```bash
node scripts/run-g0h-scripted-playthrough.js
```

Result: PASS, 13/13

Output folder:

`qa_logs/g0h_scripted_playthrough/2026-05-03T03-41-32-673Z`

### N8 Social Save Continuity

Command:

```bash
node scripts/run-n8-social-save-continuity-audit.js
```

Result: PASS

Audit id:

`2026-05-03T03-48-47-466Z`

### Full Scenario Suite

Command:

```bash
node scripts/run-scenario.js --all
```

Result: PASS, 36/36

New scenario included:

`seed-relationship-arc-rivalry-to-companion`

## Honest Residuals

- B4 remains necessary. Zone migration entropy is still low in the long-soak
  fixture, so butterflies still do not yet distribute through zones with enough
  need-driven variety.
- The new arc event is an observable transition signal, not a new durable
  memory family. Durable relationship truth remains in `lifeSim.socialEdges`.
- The B3 fixture uses a deterministic seeded help marker to make the arc
  pressure inspectable without directly setting the tier or edge strength.

## Recommended Next Phase

Proceed to B4: Zone migration pressure and entropy.

B4 should target the current long-soak warning by giving butterflies
board-driven reasons to move zones based on zone affordances and active needs,
while preserving the no-camera-hijack rule and keeping sun-court as Training
Grounds.
