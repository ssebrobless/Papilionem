# ENV12 Evidence Lock - Shared Project Roles Become Actionable

Date: 2026-05-04
Branch: `codex/milestone-freeze-playtest`

## Scope

ENV12 turns ENV11 helper role metadata into small runtime behavior differences and player/audit-visible evidence. It does not change save schema, cognition vocabulary, projection math, ML artifacts, or durable project storage.

```
building request
    |
    v
helperPreference role
    |-- builder      -> weights block choice toward construction point
    |-- carrier      -> weights block choice toward nearest movable block
    `-- coordinator  -> balanced construction/helper weighting
    |
    v
accepted assist
    |
    v
placement + follow-through
    |
    v
completed project event + feed grounding
```

## Files Changed

- `entities/butterfly.js`
  - Reads the helper's role from the received building request metadata.
  - Stores `roleLabel` and `roleScores` on `blockInteraction.buildingAssist`.
  - Uses role-specific weights when choosing which loose block to bring.
  - Emits role metadata on `building:helper-accepted` and `building:cooperation-followthrough`.
  - Passes role metadata into project placement/follow-through recording.
- `systems/objectSystem.js`
  - Stores role metadata on placement/follow-through contribution records.
  - Emits `contributorRoles` in `environment:project-completed`.
- `ui/gameUI.js`
  - Adds role grounding to the shared project completion feed line.
- `scripts/run-environment-shared-projects-audit.js`
  - Proves role propagation through accepted assist, follow-through, completion event, and feed grounding.

## Evidence

Focused ENV12 audit:

- `qa_screenshots/environment_shared_projects_audit/2026-05-04T22-12-10-866Z/report.json`
- Result: pass
- New/extended assertions:
  - `helper-accepts-shared-project-help` now checks accepted role metadata.
  - `helper-role-follows-into-project-events`
  - `shared-project-completion-has-feed-line` now checks role grounding.

Adjacent environment audits:

- `qa_screenshots/environment_building_cooperation_audit/2026-05-04T22-12-27-416Z/report.json` - pass
- `qa_screenshots/environment_building_intent_audit/2026-05-04T22-12-27-470Z/report.json` - pass
- `qa_screenshots/environment_shade_shelter_audit/2026-05-04T22-12-27-518Z` - pass
- `qa_screenshots/environment_occupancy_contract_audit/2026-05-04T22-12-27-458Z/report.json` - pass

Broad regression proofs:

- `qa_screenshots/runtime_self_audit/report.json` - pass
- `qa_screenshots/r_block_cell_discipline_audit/2026-05-04T22-12-51-043Z` - pass
- `qa_logs/r_cognition_trigger_coverage/2026-05-04T22-12-51-043Z/report.json` - pass
- `qa_screenshots/n8_social_save_continuity_audit/2026-05-04T22-12-51-043Z` - pass
- `qa_screenshots/r2_zone_transition_audit/2026-05-04T22-12-51-043Z` - pass
- `qa_logs/long_soak_society/2026-05-04T22-13-27-106Z/report.json` - pass
- `qa_logs/g0h_scripted_playthrough/2026-05-04T22-15-34-099Z/report.json` - pass, 13/13 lanes
- `node scripts/run-scenario.js --all` - pass, 38/38 scenarios

H5 long-running save note:

- First run again failed the known `04-zone-travel-retest` probe with one `sim-board-zone-travel-edge-missing` runtime issue:
  - `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-04T22-13-27-103Z/report.json`
- Immediate rerun passed:
  - `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-04T22-14-55-598Z/report.json`
- This repeated flake remains worth fixing in a separate harness/stability phase, but it did not correlate with ENV12 role behavior and `run-r2-zone-transition-audit.js` stayed green.

## Acceptance Read

ENV12 is locked as successful:

- Role choice now affects block target selection.
- The selected role survives acceptance, placement, follow-through, completion, and feed formatting.
- Environmental, social, spatial, G0H, and scenario gates remain green.

## Next Candidate Phase

The next best phase is an environment-role legibility and resilience slice:

- Add a focused audit for all three roles, not only the preferred helper role in the current shared-project lane.
- Add a tiny UI/inspect hint for active building-assist role while a helper is carrying a block.
- Investigate and stabilize the repeated H5 `sim-board-zone-travel-edge-missing` probe separately from environment behavior.
