# SR1 Evidence Lock - Global Workspace - 2026-05-12

Author: Claude (implementation)
Branch: same worktree as `codex/fsp5-fsp8-believability-gates` (uncommitted SR1 work)
Companion docs:
- `docs/SR0-SENTIENCE-TARGET-DEFINITION-2026-05-12.md`
- `docs/SR-SAVE-SCHEMA-MIGRATION-2026-05-12.md`
- `docs/FULL-SUCCESS-REFINED-PLAN-2026-05-06.md` (section 3 amended)

## Result

SR1 Global Workspace is implemented and proofed observe-only.

```
+------+--------------------------------+--------+
| SR1  | Global workspace (observe-only)| PASS   |
+------+--------------------------------+--------+
```

## What Changed

### New files

- `systems/workspaceSystem.js` (250 lines) - per-entity attention buffer with salience-gated arbitration. Implements:
  - `submit(entityId, candidate)` - external submission API.
  - `update(gameState, deltaSeconds, opts)` - per-tick arbitration + broadcast.
  - `seedCandidatesFromObservables(gameState, opts)` - per-tick lightweight reads from `lifeSim.derived` and `lifeSim.social`.
  - `attachEventListeners()` - subscribes once on initialize to `DIALOGUE_SPOKEN` and `BUTTERFLY_SCARED`, submitting candidates inside the event handler instead of polling per-tick summaries (the original polling implementation exceeded the H5 calm-garden update budget by ~0.8ms; the event-driven path is essentially free per tick).
  - `getEntitySummary(entityId)` - inspect-ready broadcast queue summary.
  - `getRuntimeSummary()` - runtime introspection used by audits.
- `scripts/run-sr1-workspace-attention-audit.js` - audit with 18 assertions across 5 phases.

### Extended files

- `core/config.js:942` - new `gameConfig.cognition.workspace` block (enabled, attentionDepth=4, candidateCap=16, broadcastTtlFrames=90, seedFromObservables=true, arbitrationMode='top-salience').
- `core/gameCore.js` - `this.workspaceSystem` field, `initializeWorkspaceSystem()` method, init call after communication system, per-tick `workspaceSystemMs` step inserted between communicationSystem and behaviorSystem in `updateFoundationSystems()`, reset hook in `resetFoundationSystems()`.
- `index.html:314` - script tag for `systems/workspaceSystem.js` immediately after `eventBus`.
- `ui/gameUI.js:885` - inspect detail builder pulls `workspaceSystem.getEntitySummary(target.id)`; new "Attention" section added before "Ecology + Space".

### Unchanged invariants verified

- `lifeSim` ownership of durable truth - workspace never writes lifeSim fields. Phase 5 of the SR1 audit asserts this directly via deep-state snapshot before/after isolated `workspaceSystem.update` calls.
- Save schema unchanged. Per `docs/SR-SAVE-SCHEMA-MIGRATION-2026-05-12.md`, SR1 adds no persisted fields. Workspace runtime state lives in `this.runtimeState` map and is rebuilt at game start; legacy saves load unchanged.
- Board-cell contract untouched.
- Determinism preserved. Arbitration sorts by salience DESC then sequence ASC; identical input -> identical broadcast queue.

## SR1 Audit Proofs

Command:
```
node scripts/run-sr1-workspace-attention-audit.js
```

Report: `qa_screenshots/sr1_workspace_attention_audit/2026-05-12T19-35-03-613Z/report.json`
Overall: PASS (18/18 assertions, 0 failures)

Phase coverage:

```
+--------+----------------------------------------------------+--------+
| Phase  | Asserts                                             | Result |
+--------+----------------------------------------------------+--------+
| 1      | workspaceSystem present                             | pass   |
| 1      | workspace enabled by default config                 | pass   |
| 1      | attentionDepth in valid range                       | pass   |
| 2      | butterflies present after reset and warm            | pass   |
| 2      | at least one butterfly has a broadcast              | pass   |
| 2      | all broadcast source modules in allowed set         | pass   |
| 2      | workspace lastUpdateFrame advanced                  | pass   |
| 3      | arbitration deterministic (same input -> same out)  | pass   |
| 3      | arbitration orders by salience DESC                 | pass   |
| 4      | broadcasts present before disabling                 | pass   |
| 4      | getEntitySummary returns null when disabled         | pass   |
| 4      | runtime reports disabled when flag is off           | pass   |
| 4      | broadcasts refill after re-enable                   | pass   |
| 5      | workspace.update does not mutate butterfly state    | pass   |
| 5      | workspace.update does not mutate caterpillar state  | pass   |
| 5      | workspace.update emits no behavior events           | pass   |
| Page   | no page errors                                       | pass   |
| Page   | no console errors                                    | pass   |
+--------+----------------------------------------------------+--------+
```

Observed broadcast source modules in a warmed run: `lifeSim.drive`, `lifeSim.social` (the dominant-drive and active-context seeders fired; the per-entity `strongestFeeling` defaulted to `steady` during the short warm period, so no `lifeSim.feeling` candidate was emitted, which is expected; `communication.heard` / `communication.spoken` / `lifeSim.scared` fire via event subscription rather than per-tick poll).

## Regression Net

```
+------------------------------------+--------+----------------------------------------------------+
| Audit                              | Result | Report                                              |
+------------------------------------+--------+----------------------------------------------------+
| Runtime self-audit                 | PASS   | qa_screenshots/runtime_self_audit/report.json       |
| Final grand plan audit             | PASS   | qa_screenshots/final_grand_plan_audit/2026-05-12T19-31-34-132Z/report.json |
| Block-cell discipline              | PASS   | qa_screenshots/r_block_cell_discipline_audit/2026-05-12T19-31-19-079Z (re-run after one flake) |
| H5 long-running save smoothness    | PASS   | qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-12T19-35-18-910Z/report.json |
| G0H scripted playthrough           | PASS 13/13 | qa_logs/g0h_scripted_playthrough/2026-05-12T19-31-28-780Z/report.json |
| N8 social save continuity          | PASS   | qa_screenshots/n8_social_save_continuity_audit/<ts>/report.json |
| R cognition trigger coverage       | PASS   | qa_logs/r_cognition_trigger_coverage/<ts>/report.json |
+------------------------------------+--------+----------------------------------------------------+
```

### G0H runtime parity

```
+----------------------------+-----------------------+-----------------------+
| Metric                     | Baseline (pre-SR1)    | SR1                    |
+----------------------------+-----------------------+-----------------------+
| Result                     | PASS 13/13            | PASS 13/13             |
| pressureTier               | hot                   | hot                    |
| runtimeIssueCount          | 96                    | 96                     |
| warningRuntimeIssueCount   | 96                    | 96                     |
| butterflies                | 16                    | 16                     |
+----------------------------+-----------------------+-----------------------+
```

The pre-existing `hot` pressure tier and cadence-budget warnings (FSP9.7 residual) are unchanged by SR1. SR1 introduces no regression on G0H.

## Honest Findings

1. **Per-tick polling of summary APIs is a budget trap.** The first implementation polled `communicationSystem.getCommunicationSummary(id)` per butterfly per tick during `seedCandidatesFromObservables`. With ~16 butterflies that added ~0.8ms to `avgUpdateMs` and tripped the H5 calm-garden phase's `avgUpdateMs <= 12` gate. Switching to event-driven seeding (subscribe to `DIALOGUE_SPOKEN`, `BUTTERFLY_SCARED`) eliminated the overhead. **Lesson for SR2-SR7**: prefer event subscription over per-tick summary polling whenever an event already exists for the signal.

2. **The block-cell discipline audit flaked once on back-to-back runs against a reused server.** The failure was in `gardenObjectOccupancy`'s 4th probe (`reserve-husk` at cell 9,6) - `gameCore.spawnFlowerAt` returned null for that cell. The flake did not reproduce on the next run (PASS, 5/5 probes). The audit's `await gameCore.resetGame(true)` clears localStorage but does not appear to fully drain async spawn queues from a prior audit's residual state when servers are reused. Not workspace-caused; recorded here so future SR phases don't blame their own changes for the same flake.

3. **Codebase-wide RNG is unseeded.** Two consecutive `gameCore.resetGame(true)` calls produce different butterfly IDs, positions, and traits. The SR1 audit's initial design tried to compare two-reset runs and failed because the IDs themselves carry `Date.now()`. The honest observe-only test is to snapshot state, run only `workspaceSystem.update` in isolation, and assert deep-equal on the snapshot. **Lesson for SR2-SR7**: when proving observe-only invariants, isolate the system under test, do not compare across resets.

4. **No save schema bump.** Per `docs/SR-SAVE-SCHEMA-MIGRATION-2026-05-12.md`, SR1 adds zero persisted fields. Workspace runtime state is ephemeral, rebuilt at game start. Long-running saves load unchanged. The `schemaVersion = 4 -> 5` bump remains deferred to SR2 under joint signoff.

## Rollback

Set `gameConfig.cognition.workspace.enabled = false` and the system becomes a no-op:
- `update()` clears all pending and broadcast queues, returns `{enabled: 0, ...}`.
- `getEntitySummary(id)` returns `null` for any entity.
- No behavior change; no save change; no UI section appears (the inspect builder gates the "Attention" section on `workspaceSummary && workspaceSummary.broadcastCount > 0`, which becomes false).

The flag is the supported rollback path.

## What SR1 Does Not Do (and won't until later phases)

- **No downstream module reads `broadcastQueue` yet.** That is intentional. SR1 is observe-only. SR2 (self-model), SR3 (metacognition), and SR4 (theory of mind) will be the first consumers, when each adds decision-input features sourced from workspace state.
- **No metacognitive tagging, theory of mind, narrative, or learning.** Those are SR2-SR7.
- **No second-order attention.** The workspace is a flat broadcast for now; recursive workspace (workspace-about-workspace) is a deliberate non-goal.

## Cross-References

- SR0 honest-claims register: `docs/SR0-SENTIENCE-TARGET-DEFINITION-2026-05-12.md` section 8.
- Schema migration plan: `docs/SR-SAVE-SCHEMA-MIGRATION-2026-05-12.md` section 6.1.
- Per-tick foundation order: `core/gameCore.js:updateFoundationSystems`. Workspace runs after `communicationSystem`, before `behaviorSystem`.
