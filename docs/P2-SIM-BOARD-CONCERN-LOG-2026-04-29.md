# P2 Sim-Board Concern Log

Date: 2026-04-29

## Concern: Sim-board mode initially reused old per-image placement regions

- Phase: P2 Default-Off Sim-Board Render Mode
- Category: visual surface / placement compatibility
- Why it mattered: `run-a4-spatial-truth-audit.js` failed under `PAPILIONEM_WORLD_RENDER_MODE=sim-board` because `gridManager.getZonePlacementRegion()` fell back to each ornate-map `screenRegion`. That reintroduced the old background geometry this phase is meant to retire.
- Chosen path: treat `sim-board` as a focused-zone scene for placement, entity filtering, and focused-scene counts, while keeping `renderManager.isSectionSceneWorld()` strict so the old section-scene image asset path does not run in sim-board mode.
- Alternatives not chosen: weakening the A4 audit for sim-board, or drawing all-zone entities in sim-board mode and accepting the extra render cost.
- Files touched:
  - `core/gridManager.js`: `isUsingSharedSectionPlacementRegion()`
  - `core/gameCore.js`: `isSectionSceneWorld()`
  - `core/renderManager.js`: `usesFocusedZoneScene()` and focused-zone render filtering
- Reversal steps: set `gridManager.isUsingSharedSectionPlacementRegion()` and `gameCore.isSectionSceneWorld()` back to `"section-scenes"` only, remove `renderManager.usesFocusedZoneScene()`, and replace its call sites with `isSectionSceneWorld()`.
- Downstream systems to re-check if reversed: A4 spatial truth, sim-board baseline audit, composed bench `single-zone-122`, zone travel P3.
- Status: acceptable long-term unless Phase P7 renames the helper from `isSectionSceneWorld()` to a clearer focused-world predicate.
