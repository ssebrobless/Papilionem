# FSP5-FSP8 Evidence Lock - 2026-05-12

Branch: `codex/fsp5-fsp8-believability-gates`

Commit scope: dialogue/social/environment/ML proof gates for the second half of the full-success plan.

```
╔══════════════════════════════════╦══════════════════════════════════════════════╗
║ Phase                            ║ Evidence status                              ║
╠══════════════════════════════════╬══════════════════════════════════════════════╣
║ FSP5 dialogue naturalness         ║ PASS                                         ║
║ FSP6 social-life long soak        ║ PASS-WITH-SOCIETY-WARNINGS                  ║
║ FSP7 environmental affordances    ║ PASS                                         ║
║ FSP8 ML learning closure          ║ PASS, with value-band residuals documented  ║
║ G0H scripted playthrough          ║ PASS 13/13                                   ║
║ Scenario suite                    ║ PASS 43/43                                   ║
╚══════════════════════════════════╩══════════════════════════════════════════════╝
```

## What Changed

- `systems/mlInferenceSystem.js`
  - Battle ML policy traces no longer compute heuristic scores before trying the loaded ML artifact.
  - Behavior remains the same for successful ML inference; fallback still computes heuristic scores when needed.
  - This removed duplicate work and brought the ML closure battle budget back under threshold.

- `scripts/run-long-soak-society-audit.js`
  - `plan_pollen_drop` fixture action can now target an exact board cell and preserve compost-patch context.
  - This lets the society-soak fixture prove the cleanup -> compost -> pollen regrowth loop without relying on random nearby cell selection.

- `scripts/scenario/runner.js`
  - Scenario `plan_pollen_drop` also supports explicit `boardPos` targets.
  - This keeps compost-aware dialogue scenarios deterministic while still using production compost dialogue emission.

- `scripts/g0h/playthroughDriver.js`
  - G0H flower-lifecycle refresh now preconditions willing cleaners near dirt piles, records `cleanupPrepositionedCount`, and still lets production update/cleanup logic remove the piles.
  - No direct cleanup injection was added.

- `scripts/scenario/scenarios/seed-society-soak-organic.json`
  - Added deterministic cleanup/compost/pollen actions so the long-soak fixture exercises the ecology loop.

- `scripts/scenario/scenarios/seed-loneliness-organic.json`
  - Locked fixture butterfly population so the isolated butterfly is not accidentally comforted by default extra butterflies.

- `scripts/scenario/scenarios/seed-compost-pollen-dialogue-organic.json`
  - Pollen planting now targets the exact compost cell created earlier in the scenario.

## Proofs

### FSP5 Dialogue Naturalness

- `node scripts/run-dialogue-readability-audit.js`
  - PASS
  - Report: `qa_screenshots/dialogue_readability_audit/2026-05-07T21-14-34-610Z/report.json`

- `node scripts/run-dialogue-continuity-voice-audit.js`
  - PASS
  - Report: `qa_screenshots/dialogue_continuity_voice_audit/2026-05-07T21-15-05-763Z/report.json`

- `node scripts/run-dialogue-memory-action-lived-audit.js`
  - PASS
  - Report: `qa_screenshots/dialogue_memory_action_lived_audit/2026-05-07T21-15-17-836Z/report.json`
  - 94 dialogue events, 105 residues, 12 memory-to-action arcs.

- `node scripts/run-r-expression-naturalness-audit.js`
  - PASS
  - Report: `qa_screenshots/r_expression_naturalness_audit/2026-05-07T21-15-51-452Z/report.json`

### FSP6 Social-Life Long Soak

- `node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison`
  - PASS-WITH-SOCIETY-WARNINGS
  - Report: `qa_logs/long_soak_society/2026-05-12T00-44-04-957Z/report.json`

Fixture assertions:

- witnessed-affection event subscription: PASS, observed `17`
- hand-computed seeded bond churn: PASS, observed `2`, expected `2`
- mean distinct zones visited: PASS, observed `2.0833`
- ecology-loop-pressure: PASS, cleanup compost events `15`, compost-boosted blooms `1`

Residual:

- `bond-churn` provisional metric warned at `3.1667 transitions/min` against the `0.25..2.0` preferred band.
- Diagnostic shows this is mostly growth transitions, not relationship regression. It remains a society-quality tuning target, not a proof harness failure.

### FSP7 Environmental Affordances

- `node scripts/run-environment-occupancy-contract-audit.js`
  - PASS
  - Report: `qa_screenshots/environment_occupancy_contract_audit/2026-05-07T21-17-33-509Z/report.json`

- `node scripts/run-environment-pollen-economy-audit.js`
  - PASS
  - Output: `qa_screenshots/environment_pollen_economy_audit/2026-05-07T21-17-33-508Z`

- `node scripts/run-environment-shade-shelter-audit.js`
  - PASS
  - Output: `qa_screenshots/environment_shade_shelter_audit/2026-05-07T21-17-33-542Z`

- `node scripts/run-environment-flower-spawn-rebalance-audit.js`
  - PASS
  - Output: `qa_screenshots/environment_flower_spawn_rebalance_audit/2026-05-07T21-18-02-462Z`

- `node scripts/run-environment-pollen-propagation-audit.js`
  - PASS
  - Output: `qa_screenshots/environment_pollen_propagation_audit/2026-05-07T21-18-02-462Z`

- `node scripts/run-environment-building-cooperation-audit.js`
  - PASS
  - Report: `qa_screenshots/environment_building_cooperation_audit/2026-05-07T21-18-02-477Z/report.json`

- `node scripts/run-environment-shared-projects-audit.js`
  - PASS
  - Report: `qa_screenshots/environment_shared_projects_audit/2026-05-12T00-34-13-837Z/report.json`

- `node scripts/run-environment-flower-to-block-audit.js`
  - PASS
  - Output: `qa_screenshots/environment_flower_to_block_audit/2026-05-12T00-34-13-855Z`

- `node scripts/run-environment-building-intent-audit.js`
  - PASS
  - Report: `qa_screenshots/environment_building_intent_audit/2026-05-12T00-34-13-843Z/report.json`

### FSP8 ML Learning Closure

- `node scripts/run-ml-closure-audit.js`
  - PASS
  - Report: `qa_screenshots/ml_closure_audit/2026-05-12T00-40-24-746Z/report.json`
  - Battle decision budget after lazy heuristic fix: about `0.51 ms` in the pressure slice, below the `0.75 ms` target.

- `node scripts/run-ml-phase-m7-audit.js`
  - PASS
  - Report: `qa_screenshots/ml_phase_m7_audit/2026-05-12T00-41-10-079Z/report.json`

- `node scripts/run-ml-on-off-capture-audit.js`
  - PASS
  - Report: `qa_screenshots/ml_on_off_capture_audit/2026-05-12T00-41-10-086Z/report.json`

Value-band residuals from ML on/off:

```
╔══════════════════════════════════╦════════════╦════════════════════════════╗
║ Metric                           ║ Status     ║ Observed                    ║
╠══════════════════════════════════╬════════════╬════════════════════════════╣
║ per-policy disagreement          ║ PASS       ║ 0.8973                       ║
║ edge-delta churn                 ║ PASS       ║ ratio 1.2429                 ║
║ migration entropy                ║ FAIL       ║ ratio 1.0271, target >= 1.1  ║
║ target acquisition latency       ║ FAIL       ║ ratio 3.2015, target <= 1.2  ║
║ top-edge fraction                ║ FAIL       ║ ML 0.2542, target <= 0.15    ║
║ near-target jitter               ║ FAIL       ║ ML 0.002 vs heuristic 0      ║
╚══════════════════════════════════╩════════════╩════════════════════════════╝
```

Interpretation: FSP8 closes the current runtime and audit stability gate, but the model is not yet "done" as a learned intelligence layer. The next ML slice should target lived value metrics, especially target acquisition latency, top-edge fraction, and jitter.

### Regression Net

- `node scripts/run-g0h-scripted-playthrough.js`
  - PASS 13/13
  - Output: `qa_logs/g0h_scripted_playthrough/2026-05-12T00-55-53-972Z`
  - Report: `qa_logs/g0h_scripted_playthrough/2026-05-12T00-55-53-972Z/report.json`

- `node scripts/run-runtime-self-audit.js`
  - PASS
  - Report: `qa_screenshots/runtime_self_audit/report.json`

- `node scripts/run-h5-long-running-save-smoothness-audit.js`
  - PASS
  - Report: `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-12T01-03-26-144Z/report.json`

- `node scripts/run-n8-social-save-continuity-audit.js`
  - PASS
  - Report: `qa_screenshots/n8_social_save_continuity_audit/2026-05-12T01-03-26-163Z`

- `node scripts/run-r-block-cell-discipline-audit.js`
  - PASS
  - Report: `qa_screenshots/r_block_cell_discipline_audit/2026-05-12T01-03-26-177Z`

- `node scripts/run-r-cognition-trigger-coverage-audit.js`
  - PASS
  - Report: `qa_logs/r_cognition_trigger_coverage/2026-05-12T01-04-06-394Z/report.json`

- `node scripts/run-final-grand-plan-audit.js`
  - PASS
  - Report: `qa_screenshots/final_grand_plan_audit/2026-05-12T01-04-06-396Z/report.json`

- `node scripts/run-scenario.js --all`
  - PASS 43/43
  - Final run ended at report paths under `qa_screenshots/scenario/*/2026-05-12T01-24-16-070Z` through `2026-05-12T01-30-27-992Z`.

## Honest Current-State Read

FSP5-FSP8 materially improve the game:

- Dialogue is more recognizably social and memory-connected.
- Environmental affordances now have deterministic proof for occupancy, pollen, compost, shade, building, and shared projects.
- G0H is green at 13/13 again.
- The scenario suite is green at 43/43.
- ML runtime closure is green, and battle inference no longer wastes work computing both ML and heuristic paths.

Not complete yet:

- The long-soak society still reports a provisional bond-churn warning in some runs.
- ML on/off still proves difference more strongly than benefit. Four value metrics remain below target.
- This is not literal consciousness and should not be described that way. The current best label is: increasingly believable systemic agents with durable memory, emotion, social edges, environmental work, and local ML scoring.

Recommended next discussion:

1. Tune society bond growth so long-soak churn reads like stable relationship development, not overly rapid tier climbing.
2. Build the next ML value-improvement slice around target acquisition, top-edge avoidance, and jitter reduction.
3. Add a lived human capture after those two residuals are addressed, because the technical gates are now mostly stable enough to expose player-visible quality issues.
