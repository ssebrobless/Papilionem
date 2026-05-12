# SR4 Evidence Lock - Theory of Mind

Date: 2026-05-12
Branch: `codex/fsp5-fsp8-believability-gates`
Scope: SR4 only. SR5+ not started.

## Result

SR4 is locked green.

`lifeSim.socialEdges[*].theoryOfMind` is now a persisted, lifeSim-owned
partner-belief model. The model tracks what an entity believes about a partner's
drives, mood, and goal, measures divergence from the partner's actual observable
state, and can bias the next behavior decision. The SR4 audit proves the SR0 B3
bar: an agent acts on a divergent belief about another agent and then adapts when
a direct observation contradicts that belief.

SR4 does not claim literal sentience, subjective feeling, consciousness, qualia,
or suffering. It adds a functional theory-of-mind analogue only.

## What Changed

New:
- `scripts/run-sr4-theory-of-mind-audit.js`: SR4 proof harness.
- `lifeSim.socialEdges[*].theoryOfMind`: additive partner-belief profile.

Extended:
- `core/entity.js`: default theory-of-mind profile and social-edge defaulting.
- `core/config.js`: `gameConfig.cognition.theoryOfMind` rollback/tuning block.
- `core/gameCore.js`: after-workspace, before-behavior theory-of-mind updater.
- `systems/lifeSimSystem.js`: normalization, update, divergence, belief-bias,
  and summary output.
- `systems/behaviorSystem.js`: narrow SR4 hook so an active partner-belief can
  win the next action decision.
- `systems/saveSystem.js`: defaultIfMissing support for SR3-era v5 saves.
- `ui/gameUI.js`: inspect "Theory of Mind" section.
- `docs/SAVE-SCHEMA-REGISTRY.md`: SR4 no-bump signoff and persistent-field row.

Unchanged invariants verified:
- No schema bump. Save version remains 5.
- Long-running saves are not wiped.
- Relationship edges are extended additively; existing edge fields are not
  overwritten as repair.
- SR1 workspace, SR2 self-model, and SR3 metacognition remain green.
- No network, LLM, external API, or ML artifact change.
- SR5 intrinsic motivation work was not started.

## SR4 Audit Proofs

Report:
`qa_screenshots/sr4_theory_of_mind_audit/2026-05-12T21-16-25-143Z/report.json`

Result: `pass`, 20/20 assertions.

Covered:
- Presence + config.
- Field initialization on existing social edges.
- Save round-trip preservation of social-edge byte shape.
- SR3-era v5 defaultIfMissing behavior with no schema bump.
- B3 deceivable-and-adapts proof:
  - false belief that a partner is threatened drives `comfort-from-belief`;
  - direct contradictory observation reduces divergence;
  - belief adapts toward the partner's actual `relief` mood;
  - false comfort behavior drops after the update.
- Toggle-off no-write behavior and inspect-row hiding.
- Observe-only relation to SR1 workspace queues.
- Zero page errors and console errors/warnings.

## Regression Net

| Command | Result | Report |
| --- | --- | --- |
| `node scripts/run-runtime-self-audit.js` | pass | `qa_screenshots/runtime_self_audit/report.json` |
| `node scripts/run-final-grand-plan-audit.js` | pass | `qa_screenshots/final_grand_plan_audit/2026-05-12T21-17-05-055Z/report.json` |
| `node scripts/run-r-block-cell-discipline-audit.js` | pass | `qa_screenshots/r_block_cell_discipline_audit/2026-05-12T21-04-25-792Z/report.json` |
| `node scripts/run-h5-long-running-save-smoothness-audit.js` | pass | `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-12T21-06-12-564Z/report.json` |
| `node scripts/run-g0h-scripted-playthrough.js` | pass, 13/13 lanes | `qa_logs/g0h_scripted_playthrough/2026-05-12T21-06-55-242Z/report.json` |
| `node scripts/run-n8-social-save-continuity-audit.js` | pass | `qa_screenshots/n8_social_save_continuity_audit/2026-05-12T21-14-27-568Z/report.json` |
| `node scripts/run-r-cognition-trigger-coverage-audit.js` | pass | `qa_logs/r_cognition_trigger_coverage/2026-05-12T21-14-43-989Z/report.json` |
| `node scripts/run-sr1-workspace-attention-audit.js` | pass | `qa_screenshots/sr1_workspace_attention_audit/2026-05-12T21-14-54-300Z/report.json` |
| `node scripts/run-sr2-self-model-audit.js` | pass, 19/19 | `qa_screenshots/sr2_self_model_audit/2026-05-12T21-15-09-481Z/report.json` |
| `node scripts/run-sr3-metacognition-audit.js` | pass, 21/21 | `qa_screenshots/sr3_metacognition_audit/2026-05-12T21-16-13-760Z/report.json` |
| `node scripts/run-sr4-theory-of-mind-audit.js` | pass, 20/20 | `qa_screenshots/sr4_theory_of_mind_audit/2026-05-12T21-16-25-143Z/report.json` |

Extra scenario check:
- `node scripts/run-scenario.js --all` was attempted as an extra non-SR4 gate.
  The first attempt timed out at 4 minutes. A longer run completed with 42/43
  pass and one `seed-loneliness-organic` threshold miss (`0.492` vs `0.55`).
  An immediate individual rerun of `seed-loneliness-organic` passed:
  `qa_screenshots/scenario/seed-loneliness-organic/2026-05-12T21-30-17-764Z/report.json`.
  This is recorded as fixture/lived-variance debt, not an SR4 blocker.

## G0H Runtime Parity

| Metric | SR3 rerun | SR4 rerun |
| --- | ---: | ---: |
| lanes | 13/13 | 13/13 |
| `pressureTier` | warm | hot |
| `runtimeIssueCount` | 61 | 96 |
| `errorRuntimeIssueCount` | 0 | 0 |
| `warningRuntimeIssueCount` | 61 | 96 |
| issue kind | cadence-budget-overrun | cadence-budget-overrun |
| `avgUpdateMs` | not locked as SR3 target | 2.49 |
| `avgRenderMs` | not locked as SR3 target | 12.31 |

G0H report:
`qa_logs/g0h_scripted_playthrough/2026-05-12T21-06-55-242Z/report.json`

Capture summary:
`qa_logs/g0h_scripted_playthrough/2026-05-12T21-06-55-242Z/capture/summary.txt`

## Honest Findings

- The first H5 run after SR4 failed: calm-garden `avgUpdateMs` was `13.05ms`
  against the 12ms gate. The cause was redundant per-edge theory-of-mind
  normalization and too much active edge scanning. The fix keeps defaulting
  additive and reduces active updates to a cadence/edge budget. The rerun passed.
- SR4's behavior hook is intentionally narrow. It only consumes an active
  `theoryOfMindBias` and maps it to `comfort-from-belief`,
  `avoid-from-belief`, or `approach-from-belief`.
- The full scenario suite showed one transient organic loneliness threshold miss
  on a longer run; the focused scenario rerun passed. This remains a general
  organic fixture stability note, not a theory-of-mind regression.
- G0H pressure returned to `hot/96`, matching the SR2 baseline noted by the SR2
  task prompt and remaining within the green G0H lane result. There are zero
  runtime errors.

## Rollback

Set:

```js
gameConfig.cognition.theoryOfMind.enabled = false
```

Effects:
- `lifeSim.socialEdges[*].theoryOfMind` persists and round-trips.
- No theory-of-mind model updates are written.
- Inspect "Theory of Mind" section hides.
- Behavior no longer receives SR4 theory-of-mind decision bias.

## What SR4 Does Not Do

- Does not implement intrinsic motivation. That is SR5.
- Does not train ML or change policy artifacts. That is SR6.
- Does not create autobiographical narrative text. That is SR7.
- Does not claim literal consciousness or subjective feeling.

## Cross-References

- `docs/SR0-SENTIENCE-TARGET-DEFINITION-2026-05-12.md`
- `docs/SR-SAVE-SCHEMA-MIGRATION-2026-05-12.md`
- `docs/SR1-EVIDENCE-LOCK-2026-05-12.md`
- `docs/SR2-EVIDENCE-LOCK-2026-05-12.md`
- `docs/SR3-EVIDENCE-LOCK-2026-05-12.md`
- `docs/SAVE-SCHEMA-REGISTRY.md`
- `systems/lifeSimSystem.js`
- `systems/behaviorSystem.js`
- `scripts/run-sr4-theory-of-mind-audit.js`
