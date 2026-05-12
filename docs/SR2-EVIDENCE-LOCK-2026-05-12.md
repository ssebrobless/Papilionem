# SR2 Evidence Lock - Self-Model

Date: 2026-05-12
Branch: `codex/fsp5-fsp8-believability-gates`
Scope: SR2 only. SR3+ not started.

## Result

SR2 is locked green.

`lifeSim.selfModel` is now present on butterflies and caterpillars, serialized
with save version 5, migrated additively from legacy v4 saves, updated after
SR1 workspace broadcasts, and hidden/no-op under
`gameConfig.cognition.selfModel.enabled = false`.

SR2 does not claim literal sentience, subjective feeling, consciousness, qualia,
or moral-patient status. It adds a functional self-model signal only.

## What Changed

New:
- `systems/selfModelSystem.js`: thin SR2 summary/helper system.
- `scripts/run-sr2-self-model-audit.js`: SR2 proof harness.
- `lifeSim.selfModel` durable field on butterflies and caterpillars.

Extended:
- `core/entity.js`: default selfModel profile.
- `systems/lifeSimSystem.js`: owns selfModel normalization and post-workspace
  update logic through `updateSelfModels`.
- `systems/saveSystem.js`: additive v4->v5 migration defaulting and restore
  normalization.
- `core/gameCore.js`: initializes/resets the helper and runs self-model update
  after workspace and before behavior.
- `ui/gameUI.js`: inspect "Self-Model" section for prediction, divergence,
  role guess, confidence, and perceived mood.
- `docs/SAVE-SCHEMA-REGISTRY.md`: schema lock updated to 5 with SR2 joint
  signoff/defaultIfMissing rules.

Unchanged invariants verified:
- Long-running saves are not wiped.
- Protected state groups are not overwritten as repair.
- Workspace remains observe-only; SR2 reads workspace broadcasts but does not
  mutate workspace queues.
- No network, LLM, external API, or new cognition vocabulary was introduced.
- Sun-court / Training Grounds spatial rule remains untouched.

## SR2 Audit Proofs

Report:
`qa_screenshots/sr2_self_model_audit/2026-05-12T20-33-08-090Z/report.json`

Result: `pass`, 19/19 assertions.

Covered:
- Presence + config.
- Field initialization on fresh reset and short warm.
- Save round-trip preserving selfModel byte shape.
- Synthetic legacy v4 migration to v5 with default selfModel on every entity.
- Mean divergence band after 5 minutes of sim time.
- Observe-only workspace snapshot equality.
- Toggle-off no-write behavior and inspect-row hiding.
- Zero page errors and console errors/warnings.

## Regression Net

| Command | Result | Report |
| --- | --- | --- |
| `node scripts/run-runtime-self-audit.js` | pass | `qa_screenshots/runtime_self_audit/report.json` |
| `node scripts/run-final-grand-plan-audit.js` | pass | `qa_screenshots/final_grand_plan_audit/2026-05-12T20-21-01-924Z/report.json` |
| `node scripts/run-r-block-cell-discipline-audit.js` | pass | `qa_screenshots/r_block_cell_discipline_audit/2026-05-12T20-22-58-718Z/report.json` |
| `node scripts/run-h5-long-running-save-smoothness-audit.js` | pass | `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-12T20-23-25-216Z/report.json` |
| `node scripts/run-g0h-scripted-playthrough.js` | pass, 13/13 lanes | `qa_logs/g0h_scripted_playthrough/2026-05-12T20-24-10-018Z/report.json` |
| `node scripts/run-n8-social-save-continuity-audit.js` | pass | `qa_screenshots/n8_social_save_continuity_audit/2026-05-12T20-23-25-207Z/report.json` |
| `node scripts/run-r-cognition-trigger-coverage-audit.js` | pass | `qa_logs/r_cognition_trigger_coverage/2026-05-12T20-23-25-214Z/report.json` |
| `node scripts/run-sr1-workspace-attention-audit.js` | pass, 18/18 | `qa_screenshots/sr1_workspace_attention_audit/2026-05-12T20-23-25-276Z/report.json` |
| `node scripts/run-sr2-self-model-audit.js` | pass, 19/19 | `qa_screenshots/sr2_self_model_audit/2026-05-12T20-33-08-090Z/report.json` |

## G0H Runtime Parity

| Metric | SR1 baseline expectation | SR2 rerun |
| --- | ---: | ---: |
| lanes | 13/13 | 13/13 |
| `pressureTier` | hot | hot |
| `runtimeIssueCount` | 96 | 96 |
| `errorRuntimeIssueCount` | 0 | 0 |
| `warningRuntimeIssueCount` | 96 | 96 |
| issue kind | cadence-budget-overrun | cadence-budget-overrun |

G0H report:
`qa_logs/g0h_scripted_playthrough/2026-05-12T20-24-10-018Z/report.json`

Capture summary:
`qa_logs/g0h_scripted_playthrough/2026-05-12T20-24-10-018Z/capture/summary.txt`

## Honest Findings

- The SR2 persistent field uses `predictedNextEmotion` as a string plus
  `predictedNextEmotionIntensity` for numeric confidence in the forecast. This
  follows the SR2 phase card's string requirement while keeping intensity
  available for divergence math.
- The block-cell regression initially failed because its synthetic occupancy
  lane used live flower spawning against random/capped garden state. The lane was
  tightened to clear the target zone and fall back to direct synthetic Flower
  creation for the controlled probes. The occupancy assertions were not lowered.
- SR2's divergence is intentionally modest, not a claim of introspective truth:
  it compares last tick's prediction to current dominant emotion and smooths the
  mismatch into a bounded signal.

## Rollback

Set:

```js
gameConfig.cognition.selfModel.enabled = false
```

Effects:
- No selfModel writes occur during the post-workspace updater.
- Inspect "Self-Model" section hides.
- Existing `lifeSim.selfModel` fields remain loadable/serializable as last-known
  durable state.

## What SR2 Does Not Do

- Does not implement metacognition over multiple strategies. That is SR3.
- Does not implement theory of mind. That is SR4.
- Does not alter behavior choices from selfModel yet.
- Does not add new drive, emotion, memory, motive, or social-edge vocabulary.
- Does not change ML artifacts or any external model policy.
- Does not claim literal consciousness or subjective feeling.

## Cross-References

- `docs/SR0-SENTIENCE-TARGET-DEFINITION-2026-05-12.md`
- `docs/SR-SAVE-SCHEMA-MIGRATION-2026-05-12.md`
- `docs/SR1-EVIDENCE-LOCK-2026-05-12.md`
- `docs/SAVE-SCHEMA-REGISTRY.md`
- `systems/lifeSimSystem.js`
- `systems/selfModelSystem.js`
- `scripts/run-sr2-self-model-audit.js`
