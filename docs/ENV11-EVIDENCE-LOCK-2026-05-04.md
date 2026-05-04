# ENV11 Evidence Lock - Shared Project Roles and Failure Feedback

Date: 2026-05-04
Branch: `codex/milestone-freeze-playtest`

## Scope

ENV11 extends the environment cooperation loop without changing save schema, cognition vocabulary, projection math, ML artifacts, or durable project persistence.

```
shade intent
    |
    v
helper scoring metadata
    |-- builder: prior shared-project memory + follow-through
    |-- carrier: object interest + nearby loose block
    `-- coordinator: edge fit + recent warmth
    |
    v
runtime project
    |-- completed  -> object memories + gentle social payoff
    `-- abandoned  -> object memories + gentle follow-through/friction feedback
```

## Files Changed

- `core/config.js`
  - Added `buildingCooperation.roleSelection`.
  - Added `sharedProjects.failureFeedback`.
- `systems/communicationSystem.js`
  - Added role profile scoring for shared shade-building helpers.
  - Added role diversity tie-break for multi-helper selection.
  - Emits `roleLabel` and `roleScores` in `helperPreference` metadata.
- `systems/objectSystem.js`
  - Adds project abandonment timeout for active shared projects with no placement.
  - Emits `environment:project-abandoned`.
  - Keeps abandoned projects runtime-only and allows retry at the same project key.
- `systems/lifeSimSystem.js`
  - Adds `recordSharedProjectAbandonment()`.
  - Records object memories tagged `shared-project-abandoned`.
  - Applies small existing-edge feedback: trust/comfort/followThrough down, recentFriction up.
  - Emits `environment:project-failure-feedback`.
- `scripts/run-environment-shared-projects-audit.js`
  - Proves helper role metadata.
  - Proves abandoned project timeout, failure memories, edge feedback, and runtime-only project state.

## Evidence

Focused ENV11 audit:

- `qa_screenshots/environment_shared_projects_audit/2026-05-04T21-47-44-073Z/report.json`
- Result: pass
- New assertions:
  - `helper-preference-exposes-role-profile`
  - `abandoned-project-times-out-with-failure-feedback`
  - `abandoned-project-softens-follow-through-without-new-schema`

Adjacent environment audits:

- `qa_screenshots/environment_building_cooperation_audit/2026-05-04T21-36-41-270Z/report.json` - pass
- `qa_screenshots/environment_building_intent_audit/2026-05-04T21-36-41-023Z/report.json` - pass
- `qa_screenshots/environment_shade_shelter_audit/2026-05-04T21-36-41-177Z` - pass
- `qa_screenshots/environment_occupancy_contract_audit/2026-05-04T21-36-41-150Z/report.json` - pass

Broad regression proofs:

- `qa_screenshots/runtime_self_audit/report.json` - pass after final objectSystem retry-key fix
- `qa_screenshots/r_block_cell_discipline_audit/2026-05-04T21-48-00-482Z` - pass after final objectSystem retry-key fix
- `qa_logs/r_cognition_trigger_coverage/2026-05-04T21-37-05-988Z/report.json` - pass
- `qa_screenshots/n8_social_save_continuity_audit/2026-05-04T21-37-05-988Z` - pass
- `qa_screenshots/r2_zone_transition_audit/2026-05-04T21-37-05-987Z` - pass
- `qa_logs/long_soak_society/2026-05-04T21-37-44-771Z/report.json` - pass
- `qa_logs/g0h_scripted_playthrough/2026-05-04T21-40-00-953Z/report.json` - pass, 13/13 lanes
- `node scripts/run-scenario.js --all` - pass, 38/38 scenarios

H5 long-running save note:

- First run failed on `04-zone-travel-retest` with one `sim-board-zone-travel-edge-missing` runtime issue:
  - `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-04T21-37-44-767Z/report.json`
- Immediate rerun passed:
  - `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-04T21-39-21-962Z/report.json`
- Because `run-r2-zone-transition-audit.js` passed before this and H5 passed on rerun, this is recorded as a transient audit probe miss, not an ENV11 regression.

## Acceptance Read

ENV11 is locked as successful:

- Shared-project helper choice now exposes role intent in auditable metadata.
- Failed/abandoned shared projects now leave believable social memory and slight relationship feedback.
- Runtime projects remain runtime-only; save schema stays v5.
- Existing environmental, spatial, social continuity, G0H, and scenario gates remain green.

## Next Candidate Phase

The next best phase is to make project roles visibly actionable rather than only scored metadata:

- Let selected role influence follow-through behavior in small ways.
- Add player/audit legibility for who is acting as builder, carrier, or coordinator.
- Keep effects gentle and prove society metrics do not over-concentrate bonds or partners.
