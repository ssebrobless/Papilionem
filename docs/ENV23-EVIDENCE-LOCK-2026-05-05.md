# ENV23 Evidence Lock - Pollen Handoff Into Lived Planting

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`

## Purpose

ENV23 closes the first cooperative pollination loop:

```
flower use -> pollen charge -> social handoff -> recipient chooses nearby cell
          -> recipient travels -> pollen patch reserves grid unit -> bloom
```

The important distinction is that the recipient now performs the planting through lived movement. The audit no longer proves pollen propagation by directly calling the planting helper after transfer.

## Changes

- `core/config.js`
  - Added `entities.flower.pollenPropagation.plantSearchRadiusUnits = 2`.
  - Added `entities.flower.pollenPropagation.bloomMinDistance = 0` so a reserved pollen patch can mature in its exact occupied board cell.

- `core/gameCore.js`
  - `transferPollenCharge()` now plans a recipient drop target after handoff and assigns an immediate movement target when the recipient is available.
  - `pollen:handoff` events now include `recipientDropTarget` diagnostics.
  - `planPollenDropTarget()` now first searches nearby legal board cells around the carrier before falling back to broad flower placement.
  - `spawnFlowerAt()` now honors `minDistance: 0`; this matters for reserved-cell blooms.
  - `updatePollenPlantings()` uses the pollen bloom spacing config instead of wild-spawn spacing.

- `entities/butterfly.js`
  - Pending pollen drops hold the butterfly's behavior focus until planting completes.
  - Pending pollen drop movement gets a small movement floor so it is not starved by normal meander tuning.
  - Board-target arrival completes the pollen drop before clearing the target.

- `scripts/run-environment-pollen-propagation-audit.js`
  - The handoff lane now isolates donor and recipient, transfers pollen, then waits for the recipient to travel and create the pending planting through normal update ticks.
  - Bloom proof now checks the actual reserved planting cell instead of a hard-coded cell.

## Proof Summary

```
┌─────────────────────────────────────────────┬────────┬────────────────────────────────────────────────────────────────────────────┐
│ Proof                                       │ Result │ Report                                                                     │
├─────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────────────────────┤
│ environment pollen propagation audit        │ pass   │ qa_screenshots/environment_pollen_propagation_audit/2026-05-05T03-46-34-652Z │
│ environment occupancy contract audit        │ pass   │ qa_screenshots/environment_occupancy_contract_audit/2026-05-05T03-46-48-063Z/report.json │
│ flower lifecycle audit                      │ pass   │ qa_screenshots/r_flower_lifecycle_audit/2026-05-05T03-46-48-064Z/report.json │
│ flower spawn rebalance audit                │ pass   │ qa_screenshots/environment_flower_spawn_rebalance_audit/2026-05-05T03-48-09-327Z │
│ runtime self-audit                          │ pass   │ qa_screenshots/runtime_self_audit/report.json                              │
│ seed-society-soak-organic                   │ pass   │ qa_screenshots/scenario/seed-society-soak-organic/2026-05-05T03-48-17-101Z/report.json │
│ seed-cleanup-floor-organic                  │ pass   │ qa_screenshots/scenario/seed-cleanup-floor-organic/2026-05-05T03-48-24-898Z/report.json │
│ full scenario suite                         │ pass   │ 39/39 pass, first report qa_screenshots/scenario/seed-affection/2026-05-05T03-48-37-535Z/report.json │
└─────────────────────────────────────────────┴────────┴────────────────────────────────────────────────────────────────────────────┘
```

## Key Audit Assertions

`run-environment-pollen-propagation-audit.js` now passes all lanes:

- `feeding-grants-pollen-charge`
- `pollen-charges-cap-at-two`
- `pollen-handoff-transfers-one-charge`
- `handoff-recipient-travels-and-plants-pollen`
- `pollen-patch-blooms-into-flower-at-reserved-cell`
- `reserve-food-conversion-grants-pollen`
- `pollen-charges-expire-after-ttl`

The occupancy audit confirms flowers, dirt piles, reserve food, pollen patches, and blocks keep their one-cell discipline.

## Honest Limitations

ENV23 proves the smallest cooperative pollination loop. It does not yet prove:

- long-run pollination economy balance,
- whether butterflies preferentially hand pollen to better-suited partners,
- whether pollen planting creates visible social planning in normal play,
- whether communication feed lines explain the handoff and planting in human-readable language.

Those remain good candidates for the next environment-believability phase.

