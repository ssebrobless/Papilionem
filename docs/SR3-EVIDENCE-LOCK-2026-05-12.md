# SR3 Evidence Lock - Metacognition

Date: 2026-05-12
Branch: `codex/fsp5-fsp8-believability-gates`
Scope: SR3 only. SR4+ not started.

## Result

SR3 is locked green.

`lifeSim.metacognition` is now a persisted, lifeSim-owned ring buffer of
second-order emotion tags. Tags are produced when SR2 self-model predictions
diverge from the next first-order emotion, and the newest active tag can bias
the next behavior decision within the SR0 B2 window.

SR3 does not claim literal sentience, subjective feeling, consciousness, qualia,
or suffering. It adds a functional metacognition analogue only.

## What Changed

New:
- `scripts/run-sr3-metacognition-audit.js`: SR3 proof harness.
- `lifeSim.metacognition`: additive ring buffer, cap 32.

Extended:
- `core/entity.js`: default metacognition store.
- `core/config.js`: `gameConfig.cognition.metacognition` rollback/tuning block.
- `systems/lifeSimSystem.js`: metacognition normalization, tag creation,
  active decision-bias application, and summary output.
- `systems/behaviorSystem.js`: narrow SR3 hook so active metacognitive bias can
  win the next action decision.
- `systems/saveSystem.js`: defaultIfMissing support for SR2-era v5 saves.
- `ui/gameUI.js`: inspect "Metacognition" section.
- `docs/SAVE-SCHEMA-REGISTRY.md`: SR3 no-bump signoff and persistent-field row.

Unchanged invariants verified:
- No schema bump. Save version remains 5.
- Long-running saves are not wiped.
- Protected state groups are not overwritten as repair.
- SR1 workspace and SR2 self-model remain green.
- No network, LLM, external API, or ML artifact change.
- SR4 theory-of-mind work was not started.

## SR3 Audit Proofs

Report:
`qa_screenshots/sr3_metacognition_audit/2026-05-12T20-44-17-657Z/report.json`

Result: `pass`, 21/21 assertions.

Covered:
- Presence + config.
- Field initialization on fresh entities.
- Second-order tag creation from selfModel divergence.
- Required tag shape: `feelingId`, `firstOrderEmotion`, `metaEmotion`,
  `metaIntensity`, `tick`.
- Next behavior decision change within 30 simulated seconds.
- Save round-trip preservation.
- SR2-era v5 defaultIfMissing behavior with no schema bump.
- Ring buffer cap and oldest-entry eviction.
- Toggle-off no-write behavior and inspect-row hiding.
- Zero page errors and console errors/warnings.

## Regression Net

| Command | Result | Report |
| --- | --- | --- |
| `node scripts/run-runtime-self-audit.js` | pass | `qa_screenshots/runtime_self_audit/report.json` |
| `node scripts/run-final-grand-plan-audit.js` | pass | `qa_screenshots/final_grand_plan_audit/2026-05-12T20-45-54-254Z/report.json` |
| `node scripts/run-r-block-cell-discipline-audit.js` | pass | `qa_screenshots/r_block_cell_discipline_audit/2026-05-12T20-43-40-383Z/report.json` |
| `node scripts/run-h5-long-running-save-smoothness-audit.js` | pass | `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-12T20-44-17-593Z/report.json` |
| `node scripts/run-g0h-scripted-playthrough.js` | pass, 13/13 lanes | `qa_logs/g0h_scripted_playthrough/2026-05-12T20-45-54-269Z/report.json` |
| `node scripts/run-n8-social-save-continuity-audit.js` | pass | `qa_screenshots/n8_social_save_continuity_audit/2026-05-12T20-44-17-680Z/report.json` |
| `node scripts/run-r-cognition-trigger-coverage-audit.js` | pass | `qa_logs/r_cognition_trigger_coverage/2026-05-12T20-44-17-658Z/report.json` |
| `node scripts/run-sr1-workspace-attention-audit.js` | pass, 18/18 | `qa_screenshots/sr1_workspace_attention_audit/2026-05-12T20-45-54-253Z/report.json` |
| `node scripts/run-sr2-self-model-audit.js` | pass, 19/19 | `qa_screenshots/sr2_self_model_audit/2026-05-12T20-44-17-629Z/report.json` |
| `node scripts/run-sr3-metacognition-audit.js` | pass, 21/21 | `qa_screenshots/sr3_metacognition_audit/2026-05-12T20-44-17-657Z/report.json` |

## G0H Runtime Parity

| Metric | SR2 rerun | SR3 rerun |
| --- | ---: | ---: |
| lanes | 13/13 | 13/13 |
| `pressureTier` | hot | warm |
| `runtimeIssueCount` | 96 | 61 |
| `errorRuntimeIssueCount` | 0 | 0 |
| `warningRuntimeIssueCount` | 96 | 61 |
| issue kind | cadence-budget-overrun | cadence-budget-overrun |

G0H report:
`qa_logs/g0h_scripted_playthrough/2026-05-12T20-45-54-269Z/report.json`

Capture summary:
`qa_logs/g0h_scripted_playthrough/2026-05-12T20-45-54-269Z/capture/summary.txt`

## Honest Findings

- SR3 adds a narrow behavior hook for active metacognitive bias. This is
  intentional: without a consumer, B2 would create tags but not prove a changed
  next decision.
- `lifeSim.ensureLifeSimState` now defensively restores a missing
  `socialEdges` object. Runtime self-audit exposed this gap through synthetic
  teaching fixtures; the fix preserves existing edges and only defaults when the
  container is absent.
- The block-cell audit fixture now marks synthetic depleted reserve husks through
  a direct depleted use-state override, avoiding random/live object-system state
  while keeping the same occupancy assertion.
- G0H pressure/runtime issues improved in this run (`hot/96` to `warm/61`), but
  this is recorded as an observed proof result, not a performance claim for all
  future runs.

## Rollback

Set:

```js
gameConfig.cognition.metacognition.enabled = false
```

Effects:
- `lifeSim.metacognition` persists and round-trips.
- No new metacognition tags are written.
- Inspect "Metacognition" section hides.
- Behavior no longer receives SR3 metacognition decision bias.

## What SR3 Does Not Do

- Does not implement theory of mind. That is SR4.
- Does not create autobiographical narrative text. That is SR7.
- Does not train ML or change policy artifacts. That is SR6.
- Does not claim literal consciousness or subjective feeling.

## Cross-References

- `docs/SR0-SENTIENCE-TARGET-DEFINITION-2026-05-12.md`
- `docs/SR-SAVE-SCHEMA-MIGRATION-2026-05-12.md`
- `docs/SR2-EVIDENCE-LOCK-2026-05-12.md`
- `docs/SAVE-SCHEMA-REGISTRY.md`
- `systems/lifeSimSystem.js`
- `systems/behaviorSystem.js`
- `scripts/run-sr3-metacognition-audit.js`
