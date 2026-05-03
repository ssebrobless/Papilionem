# B4 Evidence Lock - Zone Migration Pressure and Entropy

Date: 2026-05-03

## Phase Goal

B4 gives butterflies board-driven reasons to leave a zone when their active
needs do not match the current zone affordances. This phase does not change
projection math, save schema, ML artifacts, camera behavior, or zone identity.
Sun-court remains Training Grounds and is excluded as an ambient affordance
target.

## Implementation Shape

```
World state
  │
  ▼
zoneSystem.getZoneAffordanceVector(zoneId)
  │
  ├─ resource  = flowers + food richness + reserves - depletion - dirt
  ├─ social    = social density + social valence + zone social bias
  ├─ shelter   = blocks + shelter capacity + rest/vigilance bias
  ├─ exploration = exploration bias + migration pull + low crowding
  ├─ training  = training bias + training valence + training-zone identity
  └─ cleanup   = dirt density + caregiving bias
  │
  ▼
behaviorSystem.getAffordanceMigrationIntent(entity)
  │
  ├─ scans strong mapped drives
  ├─ compares current zone vs adjacent reachable zones
  ├─ ignores Training Grounds as ambient target
  └─ writes derived migration pull only
      ├─ lifeSim.derived.migration.travelTargetZoneId
      ├─ lifeSim.derived.migration.travelUrgency
      └─ lifeSim.migration.zoneAffinities[target]
  │
  ▼
existing gameCore zone-travel scoring and edge travel
```

## Files Changed For B4

- `core/config.js`
  - Added `gameConfig.zones.affordanceMigrationPressure`.
  - Tuned habitat migration decision cadence to 60 frames.
- `systems/zoneSystem.js`
  - Added read-only per-zone affordance vector and snapshot helpers.
- `systems/behaviorSystem.js`
  - Added affordance migration intent selection from existing drive values.
  - Writes only derived migration pull / affinity hints consumed by existing
    gameCore travel scoring.
- `scripts/scenario/runner.js`
  - Added `entity_zone_count` and `entity_not_zone_count` assertions.
  - Added scenario-only opt-in for affordance migration pressure, so unrelated
    cognition fixtures do not drift during deterministic proofs.
- `scripts/scenario/scenarios/seed-zone-pull-resource.json`
  - New deterministic fixture proving resource-pressure travel.

## Proofs

### B4 Resource Pull Fixture

Command:

```bash
node scripts/run-scenario.js seed-zone-pull-resource
```

Result: PASS

Report:

`qa_screenshots/scenario/seed-zone-pull-resource/2026-05-03T04-55-49-455Z/report.json`

Acceptance:

- At least 3 of the 5 seeded resource-stressed butterflies left
  `ivy-cloister` through the runtime zone-travel path.

### Zone Transition Audit

Command:

```bash
node scripts/run-r2-zone-transition-audit.js
```

Result: PASS

Audit id:

`2026-05-03T04-33-14-129Z`

### Block Cell Discipline

Command:

```bash
node scripts/run-r-block-cell-discipline-audit.js
```

Result: PASS

Audit id:

`2026-05-03T04-33-14-147Z`

Important detail:

- `trainingBlocks: []`
- `block-stack-roundtrip`: PASS

### Long-Soak Society Fixture

Command:

```bash
node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json
```

Result: `pass-with-society-warnings`

Report:

`qa_logs/long_soak_society/2026-05-03T04-39-08-559Z/report.json`

Important B4 numbers:

- ML-on zone entropy: `0.6631` PASS
- ML-on mean distinct zones visited: `2.3077` PASS
- Heuristic mean distinct zones visited: `2.0` PASS
- B3 bond churn remains within B3 interim ceiling: `2.0/min` PASS
- Bond stability: `0.2709` PASS

Residual warnings:

- Partner repetition: `0.4286`, expected `<= 0.40`.
- Cleanup gradient: `0.5`, expected `< 0.50`. This is the known B5 target.

The B4 target is closed, but partner repetition should be tracked in the next
believability planning pass because zone mixing can still create repeated
conversation pairs.

### G0H Scripted Playthrough

Command:

```bash
node scripts/run-g0h-scripted-playthrough.js
```

Result: PASS, 13/13

Output folder:

`qa_logs/g0h_scripted_playthrough/2026-05-03T04-41-40-074Z`

### Full Scenario Suite

Command:

```bash
node scripts/run-scenario.js --all
```

Result: PASS, 37/37

Report for new B4 scenario in suite:

`qa_screenshots/scenario/seed-zone-pull-resource/2026-05-03T05-00-42-105Z/report.json`

## Honest Residuals

- B5 remains necessary: cleanup/flower/food-reserve ecology still needs a
  stronger lived gradient.
- Partner repetition is slightly over target in the long-soak run. This is not
  a B4 blocker because the migration entropy target closed, but it should be
  rechecked after B5/B6 because richer ecological and expression contexts may
  reduce repeated pair selection naturally.
- Deterministic scenario fixtures now keep B4 migration disabled unless they
  explicitly opt in. This avoids movement contamination in narrow cognition
  tests while preserving B4 behavior in normal game runs, G0H, and long-soak.

## Recommended Next Phase

Proceed to B5: cleanup / flower / food-reserve ecology pressure.

B5 should address the remaining cleanup-gradient warning and continue watching
partner repetition as a possible interaction between migration and social
selection.
