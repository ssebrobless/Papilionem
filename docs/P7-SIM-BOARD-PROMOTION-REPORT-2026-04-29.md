# P7 Sim-Board Promotion Report

Date: 2026-04-29

## Promotion Shape

```text
P7 promotion gate
|- default render mode
|  |- sim-board -> ON by default
|  `- section-scenes -> retained as selectable fallback for one release cycle
|- composed benchmark evidence
|  |- single-zone-122 -> pass against post-P0 gate
|  `- single-zone-200 -> stress comparison retained
|- frozen audit lanes
|  `- spatial, save, sprite, movement, block, ability, battle, social, dialogue, ML, life-sim -> green
|- visual density captures
|  |- 12 / 50 / 100 -> clean
|  `- 200 -> readable stress lane, cadence pressure remains visible
`- external gate
   `- human g0-bar signoff still required before public promotion is called complete
```

## Bench Evidence

Final P7 bench folder:

`qa_logs/bench/p7_sim_board_promotion_2026_04_29_final`

| Lane | Mode | p50 | p95 | avg update | avg render | Read |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| post-P0 `single-zone-122` reference | section-scenes | 88.90 | 108.00 | 39.67 | 53.10 | pre-promotion gate |
| P7 `single-zone-122` | section-scenes | 86.30 | 100.30 | 35.87 | 49.48 | legacy fallback lane |
| P7 `single-zone-122-sim-board` | sim-board | 68.50 | 177.60 | 38.80 | 47.76 | passes +1.5ms avg gate; p95 variance noted |
| P7 `single-zone-200` | section-scenes | 159.40 | 179.10 | 100.97 | 64.91 | stress comparison |
| P7 `single-zone-200-sim-board` | sim-board | 136.80 | 214.50 | 82.74 | 62.99 | better average cost, worse tail |

The acceptance gate was the realistic `single-zone-122` lane: sim-board is below the post-P0 average update/render baseline, so it passes the +1.5ms promotion target. The 200 lane is preserved as a stress read, not a public-performance target.

## Density Captures

Final density report:

`qa_logs/session_captures/p7-sim-board-density-report-2026-04-29T06-35-15-233Z.json`

| Density | avg update | avg render | p95 | Runtime read | Capture |
| --- | ---: | ---: | ---: | --- | --- |
| 12 | 3.46 | 3.95 | 13.00 | clean | `qa_logs/session_captures/2026-04-29T06-35-26-651Z-p7-sim-board-density-12-capture-1777444523401` |
| 50 | 12.04 | 10.40 | 31.90 | clean | `qa_logs/session_captures/2026-04-29T06-35-35-235Z-p7-sim-board-density-50-capture-1777444531986` |
| 100 | 17.04 | 13.39 | 42.00 | clean | `qa_logs/session_captures/2026-04-29T06-35-44-188Z-p7-sim-board-density-100-capture-1777444540885` |
| 200 | 34.09 | 18.83 | 88.70 | 39 cadence-budget warnings, 1 freeze suspect | `qa_logs/session_captures/2026-04-29T06-35-53-426Z-p7-sim-board-density-200-capture-1777444550160` |

The 200-density scene remains useful as stress evidence. It should not be represented as a clean smoothness lane until the next performance pass reduces high-density simulation pressure.

## Audit Evidence

```text
green audit stack
|- sim-board foundation
|  |- qa_screenshots/sim_board_baseline_audit/2026-04-29T06-03-42-141Z/report.json
|  |- qa_screenshots/spatial_projection_unit_tests/2026-04-29T06-04-02-078Z/report.json
|  |- qa_screenshots/sim_board_edge_travel_audit/2026-04-29T06-04-02-115Z/report.json
|  |- qa_screenshots/sim_board_occupancy_audit/2026-04-29T06-05-19-464Z/report.json
|  `- qa_screenshots/s9_save_migration_v5_audit/2026-04-29T06-05-19-522Z/report.json
|- runtime / save / sprite
|  |- qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-29T06-19-19-177Z/report.json
|  |- qa_screenshots/runtime_self_audit/report.json
|  `- qa_screenshots/v3_sprite_parity_audit/2026-04-29T06-20-20-931Z/report.json
|- movement / spatial frozen lanes
|  |- qa_screenshots/r1_movement_stability_audit/2026-04-29T06-22-29-214Z
|  |- qa_screenshots/r2_zone_transition_audit/2026-04-29T06-25-26-327Z
|  |- qa_screenshots/a4_spatial_truth_audit/2026-04-29T06-24-49-037Z
|  |- qa_screenshots/b4_carry_stack_physics_audit/2026-04-29T06-22-50-895Z/report.json
|  `- qa_screenshots/r7_block_visual_audit/2026-04-29T06-23-33-174Z/report.json
|- ability / battle
|  |- qa_screenshots/ability_radius_conversion_audit/2026-04-29T06-13-01-686Z
|  |- qa_screenshots/r5_battle_presentation_audit/2026-04-29T06-13-01-692Z/report.json
|  `- qa_screenshots/single_player_autobattle_audit/2026-04-29T06-13-01-696Z/report.json
`- cognition / social / progression / ML
   |- qa_screenshots/f5_f6_social_depth_audit/2026-04-29T06-13-28-969Z/report.json
   |- qa_screenshots/e4_social_ecology_audit/2026-04-29T06-13-28-990Z/report.json
   |- qa_screenshots/r6_communication_audit/2026-04-29T06-15-36-478Z/report.json
   |- qa_screenshots/n6_neural_social_scoring_audit/2026-04-29T06-16-55-296Z
   |- qa_screenshots/lifesim_expression_audit/2026-04-29T06-19-01-466Z
   |- qa_screenshots/r3_progression_audit/2026-04-29T06-26-53-392Z
   `- qa_screenshots/r4_ui_readability_audit/2026-04-29T06-27-07-364Z/report.json
```

## Corrections Made During P7

```text
P7 corrections
|- bench harness
|  |- scenarios can pin worldRenderMode
|  `- single-zone lanes can disable auto habitat travel to keep focus stable
|- P6 block projection correction
|  `- blocks preserve ground x/y with boardPos.h as height truth
|- audit harness upkeep
|  |- R1 now isolates the physics source probe away from training impulses and uses gameCore.currentFrame
|  |- R3 now validates the current fresh-seed progression contract
|  `- A4 now expects sim-board as the default mode unless explicitly overridden
`- density evidence
   `- P7 density runner exports repeatable session captures and screenshots
```

## Decision

Machine-side P7 is ready to present for human g0-bar signoff.

Do not call public promotion complete yet. The remaining gate is the human visual/naturalness pass, especially at 12-100 density. The 200-density lane is documented as stress evidence with visible cadence pressure.
