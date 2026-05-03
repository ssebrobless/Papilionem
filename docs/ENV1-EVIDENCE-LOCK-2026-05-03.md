# ENV1 Evidence Lock - Shared Board-Cell Occupancy - 2026-05-03

Owner: Codex

Binding plan: `docs/ENVIRONMENTAL-AFFORDANCE-IMPLEMENTATION-PLAN-2026-05-03.md`

## Verdict

ENV1 is landed and proof-green.

The game now has one shared board-cell occupancy contract for ground objects
that should occupy one unit of the 3D board:

```text
board cell (zone,u,v,h)
        |
        +-- block
        +-- live flower
        +-- dirt pile
        +-- reserve food ball
        +-- pending pollen patch
```

Butterflies can still fly through occupied cells. The contract blocks
placement, spawning, and pollen reservations, not movement.

## Changed Files

- `systems/structureSystem.js`
- `core/gameCore.js`
- `scripts/run-environment-occupancy-contract-audit.js`
- `scripts/run-r-flower-lifecycle-audit.js`

Related B1 repair in the same working slice:

- `systems/communicationSystem.js`
  - Warning dialogue cooldown is now phrase/signal specific, so scarcity
    warnings do not suppress later distress warnings to the same partner.

## Implementation Summary

### Shared Occupancy API

`systems/structureSystem.js` now exposes:

- `normalizeObjectCell(zoneId, u, v, h = 0)`
- `buildObjectCellKey(zoneId, u, v, h = 0)`
- `getEntityObjectCell(entity, options)`
- `getPollenPlantingCell(planting, options)`
- `getBoardCellOccupants(zoneId, u, v, h, options)`
- `canOccupyBoardCell(request)`

`acceptCellPlacement()` still owns block support and stack rules, but now also
rejects ground blocks when a live flower, dirt pile, reserve food ball, or
pending pollen patch occupies the same ground cell.

### Flower And Pollen Integration

`core/gameCore.js` now checks `structureSystem.canOccupyBoardCell()` before
flower spawn and when choosing valid flower positions.

Pending pollen plantings now reserve a normalized board cell:

```text
pollenState / drop target
        -> queuePollenPlanting()
        -> board cell reservation
        -> bloom at the reserved cell
```

Duplicate pollen patch reservations on the same cell are rejected.

### Audit Hardening

`scripts/run-environment-occupancy-contract-audit.js` proves:

- blocks reject live-flower cells,
- blocks reject dirt-pile cells,
- blocks reject reserve-food cells,
- blocks reject pending-pollen-patch cells,
- duplicate pollen patches are rejected,
- flowers reject block cells,
- flowers reject dirt-pile cells.

`scripts/run-r-flower-lifecycle-audit.js` now seeds its lived cleanup piles into
open cells under the shared occupancy contract instead of assuming hardcoded
cells are always empty.

## Proofs

Syntax:

```bash
node --check systems/structureSystem.js
node --check core/gameCore.js
node --check scripts/run-environment-occupancy-contract-audit.js
node --check scripts/run-r-flower-lifecycle-audit.js
```

All passed.

Focused ENV1 audit:

```bash
node scripts/run-environment-occupancy-contract-audit.js
```

Result: pass

Report:

`C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\environment_occupancy_contract_audit\2026-05-03T18-49-15-224Z\report.json`

Block discipline:

```bash
node scripts/run-r-block-cell-discipline-audit.js
```

Result: pass

Report:

`C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\r_block_cell_discipline_audit\2026-05-03T18-49-15-209Z`

Flower lifecycle:

```bash
node scripts/run-r-flower-lifecycle-audit.js
```

Result: pass

Report:

`C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\r_flower_lifecycle_audit\2026-05-03T18-47-58-521Z\report.json`

G0H scripted playthrough:

```bash
node scripts/run-g0h-scripted-playthrough.js
```

Result: pass, 13/13

Report:

`C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-03T18-49-15-221Z\report.json`

Scenario suite:

```bash
node scripts/run-scenario.js --all
```

Result: pass, 38/38

Short society soak:

```bash
node scripts/run-long-soak-society-audit.js --fast --fixture scripts/scenario/scenarios/seed-society-soak-organic.json
```

Result: `pass-with-society-warnings`

Report:

`C:\Users\fishe\Documents\projects\ephemera\qa_logs\long_soak_society\2026-05-03T18-56-37-814Z\report.json`

Cooperation pressure:

```bash
node scripts/run-r-cooperation-pressure-audit.js
```

Result: pass

Report:

`C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\r_cooperation_pressure_audit\2026-05-03T18-56-37-810Z\report.json`

## Honest Residuals

The short society soak still reports society warnings:

- ML-on partner repetition: `0.5319` against the strict `<= 0.40` warning
  band.
- ML-on bond churn: `2.25/min` against the `0.25..2.0/min` band.

Those are not ENV1 failures. They show that the next environmental phases
should create richer resource and task pressure instead of only tuning partner
selection. ENV2/ENV3 are now the natural next steps:

```text
ENV2 flower spawn rebalance
  -> ENV3 pollen carrier state
  -> ENV4 pollen patch planting
```

## Constraints Held

- Save schema remains v5.
- No new cognition vocabulary.
- No ML artifact changes.
- No projection or spatial refoundation.
- Sun-court remains Training Grounds.
- The player's long-running save was not touched.
