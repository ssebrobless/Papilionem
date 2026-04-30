# P3 Sim-Board Edge Travel Concern Log - 2026-04-29

## Concern 1 - Save/Restore Compatibility For Mid-Transit Edge Travel

- Phase: P3 Edge-Based Zone Travel
- Concern category: additive persistence compatibility
- Why it mattered: P3 acceptance requires a save made while a butterfly is invisible/in transit to reload without teleporting, losing the entity, or falling back into the legacy doorway phase model. The existing save restore path only understood the legacy zoneTravel phase vocabulary.
- Chosen safe path: extend `zoneTravel` capture/restore additively for `edgeMode`, `exitId`, `migrationIntent`, and the `in-transit` phase. No save schema version was changed and no durable world fields were introduced outside the existing `butterfly.zoneTravel` object.
- Alternatives not chosen: skip the save proof for P3; clear in-transit travel during load; introduce a v5 save migration early.
- Files touched:
  - `systems/saveSystem.js`
- Functions and state keys involved:
  - `SaveSystem.captureZoneTravelState`
  - `SaveSystem.restoreButterflyZoneTravel`
  - `butterfly.zoneTravel.edgeMode`
  - `butterfly.zoneTravel.exitId`
  - `butterfly.zoneTravel.phase === "in-transit"`
  - `butterfly.zoneTravel.migrationIntent`
- Reversal steps:
  1. Remove the added edge fields from `captureZoneTravelState`.
  2. Remove `in-transit` from the allowed restore phases.
  3. Remove the `normalized.edgeMode` restore branch.
  4. Rerun `node scripts/run-sim-board-edge-travel-audit.js`; expect the mid-transit save/restore phase to fail until another restore strategy is supplied.
- Downstream systems to re-check:
  - save/load round trips
  - migration acceptance audits
  - future v4 -> v5 save migration plan
  - sim-board edge travel audit
- Status: acceptable long-term if `zoneTravel` remains the durable owner for active travel. Revisit during P6 save migration to decide whether edge-travel fields need explicit schema documentation.

## Concern 2 - R2 Audit Assumed Section-Scene Active Backgrounds

- Phase: P3 Edge-Based Zone Travel
- Concern category: audit compatibility
- Why it mattered: `run-r2-zone-transition-audit.js` treated `renderManager.activeWorldSectionId === focusedZoneId` as mandatory truth. In sim-board mode there is intentionally no section-scene background, so `activeWorldSectionId` can be null while focused-zone truth remains correct.
- Chosen safe path: make the audit mode-aware. Section-scenes still require `activeWorldSectionId === zoneId`; sim-board accepts focused-zone truth without an active section scene.
- Alternatives not chosen: set a fake `activeWorldSectionId` in sim-board; weaken the assertion for all render modes; skip R2 under sim-board.
- Files touched:
  - `scripts/run-r2-zone-transition-audit.js`
- Functions and state keys involved:
  - `getWorldRenderModeOverride`
  - `applyRuntimeOverrides`
  - `resetBaseline`
  - `gameConfig.world.renderMode`
  - `renderManager.activeWorldSectionId`
- Reversal steps:
  1. Remove the `PAPILIONEM_WORLD_RENDER_MODE` override plumbing.
  2. Restore the strict `activeWorldSectionId === zoneId` assertions.
  3. Run `node scripts/run-r2-zone-transition-audit.js` in section-scenes mode to confirm legacy coverage remains.
- Downstream systems to re-check:
  - R2 zone-transition audit
  - sim-board baseline audit
  - render mode persistence
- Status: acceptable long-term. The assertion now matches the two render contracts instead of one legacy contract.
