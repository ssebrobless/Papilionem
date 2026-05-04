# ENV13 Evidence Lock - 2026-05-04

Scope: stabilize shared-project role coverage and flaky audit fixtures without changing save schema, cognition vocabulary, ML artifacts, render/projection math, or production zone-travel semantics.

## Shape

```
ENV13
  |
  +-- shared project role coverage
  |     |
  |     +-- builder chooses construction-side block
  |     +-- carrier chooses a different helper-side block
  |     +-- coordinator still has an actionable target
  |
  +-- H5 travel retest stabilization
  |     |
  |     +-- old audit picked first different zone
  |     +-- sim-board only supports edge routes
  |     +-- new audit picks a route with edgeMode
  |
  +-- R2 doorway fixture stabilization
        |
        +-- old audit aimed directly at shelter center
        +-- center can be close to newer shade/stack geometry
        +-- new audit checks the actual opening transition target
```

## Changes

- `entities/butterfly.js`
  - Made role weighting in `findBuildingHelpBlockTarget` distinct enough to be provable:
    - builder strongly prefers the construction point
    - carrier strongly prefers helper-proximate movable blocks
    - coordinator remains balanced
  - Switched helper distance scoring from board-unit distance to pixel distance using `communicationSystem.radiusUnitsToPixels` when available, matching the construction target score's screen-space comparison.

- `scripts/run-environment-shared-projects-audit.js`
  - Added a focused mock-block role probe.
  - Asserts builder and carrier do not collapse to the same target.
  - Asserts coordinator has an actionable target.

- `scripts/run-h5-long-running-save-smoothness-audit.js`
  - Stabilized `04-zone-travel-retest` by selecting a target zone only when `gameCore.buildZoneTravelRoute(sourceZoneId, zoneId)?.edgeMode` exists.
  - Root cause: the previous audit could select a non-adjacent zone; the game correctly rejected it with `sim-board-zone-travel-edge-missing`.

- `scripts/run-r2-zone-transition-audit.js`
  - Stabilized the local shelter traversal fixture by checking a passable target from `openingProfile.innerPoint`, `entryPoint`, then `interiorPoint`.
  - Root cause: newer shade/stack geometry can make the shelter center close enough to a stack to be a blocked point even while the opening itself remains valid.

## Evidence

Focused and adjacent audits:

- Shared project role coverage:
  - `qa_screenshots/environment_shared_projects_audit/2026-05-04T23-26-56-227Z/report.json`
  - overall: pass
  - new assertions:
    - `role-coverage-builder-and-carrier-target-different-blocks`
    - `role-coverage-coordinator-has-actionable-target`
- H5 smoothness and travel retest:
  - `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-04T23-26-56-198Z/report.json`
  - overall: pass
- R2 zone transition audit:
  - `qa_screenshots/r2_zone_transition_audit/2026-05-04T23-31-42-854Z/report.json`
  - overall: pass
- Building cooperation:
  - `qa_screenshots/environment_building_cooperation_audit/2026-05-04T23-29-28-329Z/report.json`
  - overall: pass
- Building intent:
  - `qa_screenshots/environment_building_intent_audit/2026-05-04T23-29-28-330Z/report.json`
  - overall: pass
- Shade shelter:
  - `qa_screenshots/environment_shade_shelter_audit/2026-05-04T23-29-28-330Z/report.json`
  - overall: pass
- Occupancy contract:
  - `qa_screenshots/environment_occupancy_contract_audit/2026-05-04T23-29-28-329Z/report.json`
  - overall: pass

Core regression belt:

- Runtime self audit:
  - `qa_screenshots/runtime_self_audit/report.json`
  - overall: pass
- Block cell discipline:
  - `qa_screenshots/r_block_cell_discipline_audit/2026-05-04T23-29-49-346Z/report.json`
  - overall: pass
- Cognition trigger coverage:
  - `qa_logs/r_cognition_trigger_coverage/2026-05-04T23-29-49-350Z/report.json`
  - overall: pass
- N8 social save continuity:
  - `qa_screenshots/n8_social_save_continuity_audit/2026-05-04T23-29-49-346Z/report.json`
  - overall: pass

Long gates:

- Long-soak society audit:
  - `qa_logs/long_soak_society/2026-05-04T23-32-00-156Z/report.json`
  - overall: `pass-with-society-warnings`
  - fixture assertions passed:
    - witnessed-affection event subscription observed 9
    - hand-computed bond churn fixture observed 2, expected 2
    - mean distinct zones visited present at 2.57
  - remaining warning: provisional bond-churn band observed 2.33 transitions/min, above expected 0.25..2.0.
- G0H scripted playthrough:
  - `qa_logs/g0h_scripted_playthrough/2026-05-04T23-38-28-200Z/report.json`
  - overall: pass
  - lanes: 13/13 pass
- Scenario suite:
  - command: `node scripts/run-scenario.js --all`
  - overall: pass
  - scenarios: 38/38 pass

## Residuals

- The long-soak society audit still reports `pass-with-society-warnings` because bond churn remains slightly above the provisional target band. This is not introduced by ENV13, but it is still a useful next believability tuning signal.
- Role coverage is now deterministic in the focused audit. A future improvement would be a longer lived-play lane showing all three roles surfacing organically in the feed/inspect UI during a multi-project run.

## Next Candidate

The next best work is no longer audit stabilization; it is player-legible lived behavior:

1. Add a longer shared-project society lane that proves role diversity over time without mock blocks.
2. Surface the active helper role more clearly in inspect/feed so the player can see why a butterfly is carrying, building, or coordinating.
3. Continue the long-soak believability tuning around bond churn so relationships evolve without feeling noisy.
