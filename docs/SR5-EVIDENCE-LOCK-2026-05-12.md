# SR5 Evidence Lock - Intrinsic Motivation

Date: 2026-05-12  
Branch: `codex/fsp5-fsp8-believability-gates`  
Phase: SR5 - Intrinsic Motivation  
Result: **locked green**

## Result

SR5 adds lifeSim-owned intrinsic motivation state for butterflies and
caterpillars without bumping the save schema. The stored field is additive:

```text
lifeSim.intrinsicDrives
|- curiosity
|- competence
|- boredom
`- lastUpdatedTick
```

The audit proves all entities receive typed defaults, the field survives
save/load, missing SR5 fields default safely in v5 saves, rollback disables
updates and inspect display, and intrinsic motivation can bias the next behavior
decision without rewriting protected `lifeSim.drives`.

## What Changed

- Added `createIntrinsicDriveProfile()` and default `lifeSim.intrinsicDrives`
  construction.
- Added `gameConfig.cognition.intrinsicDrives` rollback and tuning block.
- Added SR5 intrinsic update logic in `lifeSimSystem`, driven by existing
  novelty, object-interest, training, lesson, and familiarity signals.
- Added behavior intents:
  - curiosity -> `curious-exploration`
  - competence -> `practice-from-competence`
  - boredom -> `novelty-seeking`
- Added DOM and canvas inspect rows for `Intrinsic Motivation`.
- Added v5 no-bump schema registry entry and defaultIfMissing rules.
- Added `scripts/run-sr5-intrinsic-motivation-audit.js`.

## SR5 Audit Proof

```text
node scripts/run-sr5-intrinsic-motivation-audit.js
```

Report:

```text
qa_screenshots/sr5_intrinsic_motivation_audit/2026-05-12T21-53-49-409Z/report.json
```

Result:

```text
overall: pass
assertions: 18
failed: []
```

Key proof sample:

```text
curiosity  -> curious-exploration
competence -> practice-from-competence
boredom    -> novelty-seeking
protected lifeSim.drives unchanged: true
```

## Regression Net

| Proof | Result | Report |
| --- | --- | --- |
| `node scripts/run-runtime-self-audit.js` | pass | `qa_screenshots/runtime_self_audit/report.json` |
| `node scripts/run-final-grand-plan-audit.js` | pass | `qa_screenshots/final_grand_plan_audit/2026-05-12T21-40-06-446Z/report.json` |
| `node scripts/run-r-block-cell-discipline-audit.js` | pass | `qa_screenshots/r_block_cell_discipline_audit/2026-05-12T21-40-55-323Z/report.json` |
| `node scripts/run-h5-long-running-save-smoothness-audit.js` | pass | `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-12T21-43-42-824Z/report.json` |
| `node scripts/run-g0h-scripted-playthrough.js` | pass, 13/13 | `qa_logs/g0h_scripted_playthrough/2026-05-12T21-44-24-171Z/report.json` |
| `node scripts/run-n8-social-save-continuity-audit.js` | pass | `qa_screenshots/n8_social_save_continuity_audit/2026-05-12T21-51-52-901Z/report.json` |
| `node scripts/run-r-cognition-trigger-coverage-audit.js` | pass | `qa_logs/r_cognition_trigger_coverage/2026-05-12T21-52-06-924Z/report.json` |
| `node scripts/run-sr1-workspace-attention-audit.js` | pass | `qa_screenshots/sr1_workspace_attention_audit/2026-05-12T21-52-17-345Z/report.json` |
| `node scripts/run-sr2-self-model-audit.js` | pass | `qa_screenshots/sr2_self_model_audit/2026-05-12T21-52-31-216Z/report.json` |
| `node scripts/run-sr3-metacognition-audit.js` | pass | `qa_screenshots/sr3_metacognition_audit/2026-05-12T21-53-32-978Z/report.json` |
| `node scripts/run-sr4-theory-of-mind-audit.js` | pass | `qa_screenshots/sr4_theory_of_mind_audit/2026-05-12T21-53-41-247Z/report.json` |
| `node scripts/run-sr5-intrinsic-motivation-audit.js` | pass | `qa_screenshots/sr5_intrinsic_motivation_audit/2026-05-12T21-53-49-409Z/report.json` |
| `node scripts/run-scenario.js --all` | pass, 43/43 | per-scenario reports under `qa_screenshots/scenario/*/2026-05-12T21-54-*..22-01-*` |

## G0H Runtime Parity

Full, non-accelerated G0H run:

```text
qa_logs/g0h_scripted_playthrough/2026-05-12T21-44-24-171Z/report.json
qa_logs/g0h_scripted_playthrough/2026-05-12T21-44-24-171Z/capture/summary.txt
```

Summary:

```text
lanes: 13/13 pass
pressureTier: hot
avgUpdateMs: 2.61
avgRenderMs: 11.74
p99FrameMs: 22.80
runtimeIssues: 96 warnings, 0 errors
freezeSuspects: 0
spriteCache: 92/224, 2.74MB, hits 901929/184
topUpdate: foundation.lifeSimSystemMs 0.63ms, foundation.selfModelSystemMs 0.48ms
```

## Performance Finding

The first H5 rerun after SR5 failed the shell-heavy update budget:

```text
avgUpdateMs: 19.06
```

Root cause was unnecessary per-call normalization allocation for
`lifeSim.intrinsicDrives` in hot `ensureLifeSimState()` paths. The fix now only
normalizes when the profile is missing or malformed. After the fix:

```text
H5 shell-heavy avgUpdateMs: 11.41
H5 shell-heavy avgRenderMs: 5.05
H5 pressureTier: hot
```

No audit thresholds were relaxed.

## Rollback

Set:

```js
gameConfig.cognition.intrinsicDrives.enabled = false
```

Expected rollback behavior:

- per-tick SR5 intrinsic values are zeroed
- `intrinsicMotivationBias.active` is false
- inspect row is hidden
- save/load still preserves the additive `lifeSim.intrinsicDrives` field

## Honest Findings

- SR5 does not create literal sentience or subjective feeling.
- SR5 does not add online ML learning; SR6 remains the ML value/learning layer.
- SR5 does not rename or replace the locked drive/emotion/memory/social-edge
  vocabulary.
- SR5 provides an internal motivational bias layer that can make agents seek
  novelty, practice competence, or escape boredom based on existing world and
  memory signals.

## What SR5 Does Not Do

- It does not make dialogue more natural by itself.
- It does not train a new ML artifact.
- It does not change spatial projection, block placement, save key, or schema
  version.
- It does not overwrite protected identity, drives, emotions, memories,
  relationship edges, or lineage.

## Cross-References

- `docs/SR0-SENTIENCE-TARGET-DEFINITION-2026-05-12.md`
- `docs/SR-SAVE-SCHEMA-MIGRATION-2026-05-12.md`
- `docs/SR1-EVIDENCE-LOCK-2026-05-12.md`
- `docs/SR2-EVIDENCE-LOCK-2026-05-12.md`
- `docs/SR3-EVIDENCE-LOCK-2026-05-12.md`
- `docs/SR4-EVIDENCE-LOCK-2026-05-12.md`
- `docs/SAVE-SCHEMA-REGISTRY.md`
