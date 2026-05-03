# Capture Brief Post-B Ladder - 2026-05-03

Status: **B8 evidence sweep completed with residual society warnings.**

Recommendation: **do not call this a final human G0 greenlight yet.** The game is much closer, and the player-facing "why" layer is now legible, but the long-soak still shows social-selection variance that should become the next planning target.

## Evidence Shape

```
╔══════════════════════╦══════════════════════╦══════════════════════╗
║ Layer                ║ Evidence             ║ Read                 ║
╠══════════════════════╬══════════════════════╬══════════════════════╣
║ Inspect/feed why     ║ B7 audits green      ║ Ready for capture    ║
║ G0H lived play       ║ 13/13 green          ║ Ready for capture    ║
║ UI hover/parity      ║ Green                ║ Ready for capture    ║
║ Scenario suite       ║ 38/38 green on rerun ║ Mostly stable        ║
║ Long-soak society    ║ Warnings remain      ║ Needs B9 planning    ║
╚══════════════════════╩══════════════════════╩══════════════════════╝
```

## What Changed Across The B Ladder

```
B0 measurement honesty
  └─ event-subscription cognition metrics, fixture-aware long-soak
B1/B2 social breadth
  └─ partner diversity and witnessed-affection production coverage
B3 relationship arcs
  └─ relationshipArcEvent evidence for rivalry-to-companion transitions
B4 zone migration pressure
  └─ affordance-based zone pull and entropy proof
B5 ecology pressure
  └─ cleanup / flower / reserve pressure with inspect ecology readout
B6 ML candidate work
  └─ m7 artifact created but not promoted; m4 remains default
B7 why legibility
  └─ inspect strongest-feeling packet line + feed causeLabel
B8 evidence sweep
  └─ long-soak + G0H + scenario/UI proof pass with residual warnings
```

## B7 Evidence Lock

Reference: `docs/B7-EVIDENCE-LOCK-2026-05-03.md`

Proofs:

- `qa_screenshots/r_expression_naturalness_audit/2026-05-03T14-23-43-335Z/report.json`
  - Overall: pass
  - Distinct dialogue templates: 8
  - Repetition rate: 0
  - Inspect strongest-feeling packet coverage: 1.0
  - Packet-backed feed entries with cause labels: 8/8
- `qa_screenshots/r_feed_thread_audit/2026-05-03T14-23-54-685Z/report.json`
  - Overall: pass
  - Grouped social thread retained `referencedMemoryPacketId` and `causeLabel`.
- `qa_screenshots/r4_ui_readability_audit/2026-05-03T14-24-13-951Z/report.json`
  - Overall: pass
- `qa_screenshots/r_ui_parity_audit/2026-05-03T14-24-13-966Z/report.json`
  - Overall: pass
- `qa_logs/g0h_scripted_playthrough/2026-05-03T14-25-08-244Z/report.json`
  - Overall: pass
  - G0H lanes: 13/13

## B8 Evidence Sweep

### Long-Soak: ML + Heuristic

Report: `qa_logs/long_soak_society/2026-05-03T14-32-47-738Z/report.json`

Overall: `pass-with-society-warnings`

Key values:

- ML-on partner repetition: 0.5263, which meets B8 first target `<= 0.60`.
- Heuristic partner repetition: 0.5220, which meets B8 first target `<= 0.60`.
- ML-on witnessed-affection event-rate: 1.6667/min, above target.
- Heuristic witnessed-affection event-rate: 1.6667/min, above target.
- ML-on bond churn: 1.8333/min, within B8 target `0.25..2.0`.
- Heuristic bond churn: 2.8333/min, above B8 target and a residual.
- ML-on bond stability: 0.3269, within B8 target `<= 0.33`.
- Heuristic bond stability: 0.3311, just above B8 target by roughly 0.0011.
- ML-on zone entropy: 0.6762, above target.
- Heuristic zone entropy: 0.8296, above target.
- Cleanup gradient non-positive fraction: 0 for both runs.
- Conversation repetition: 0 for both runs.

Read: the full two-backend run proves the ecology, zone entropy, conversation repetition, and witnessed-affection improvements, but heuristic bond churn is too hot and should not be hidden.

### Long-Soak: ML-On Only

Report: `qa_logs/long_soak_society/2026-05-03T14-35-13-862Z/report.json`

Overall: `pass-with-society-warnings`

Key values:

- Partner repetition: 0.6266, above the B8 first target `<= 0.60`.
- Bond stability: 0.2310, green.
- Bond churn: 1.3333/min, green.
- Witnessed-affection event-rate: 0.8333/min, green.
- Cleanup gradient non-positive fraction: 0, green.
- Zone entropy: 0.3630, above B8 entropy floor `>= 0.25`.
- Mean distinct zones visited: 1.6923, below the earlier B4 desired value of 2.
- Conversation repetition: 0, green.

Read: the no-comparison run is viable, but partner selection is still too sticky in at least one deterministic soak.

### G0H Scripted Playthrough

Report: `qa_logs/g0h_scripted_playthrough/2026-05-03T14-25-08-244Z/report.json`

Overall: pass, 13/13 lanes.

Read: scripted lived-play evidence remains green after B7.

### Scenario Suite

First aggregate run:

- Report: `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-03T14-42-41-095Z/report.json`
- Aggregate: failed because `seed-zone-pull-resource` moved 2 of required 3 butterflies out of ivy-cloister.

Single rerun:

- Report: `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-03T14-43-38-630Z/report.json`
- Result: pass.

Second aggregate run:

- Overall: pass, 38/38
- Final scenario report for the previously red lane:
  `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-03T14-49-21-359Z/report.json`

Read: the scenario suite is green on rerun, but `seed-zone-pull-resource` has timing/interference sensitivity. This should be treated as a planning signal, not ignored.

### Hover Scroll

Report: `qa_screenshots/r_hover_scroll_audit/2026-05-03T14-36-58-061Z/report.json`

Overall: pass.

Read: hover-scroll works across DOM panels and canvas panel paths.

## Human Capture Guidance

The build is good enough for a short exploratory human capture if the goal is qualitative feedback on:

- inspect "Why This Moment"
- feed cause labels
- visible social memory references
- cleanup ecology pressure
- zone movement readability
- UI hover-scroll and accessibility parity

It is **not** yet good enough to declare the post-B ladder fully complete because the long-soak has residual social-selection instability.

## Residuals To Plan Next

```
╔══════════════════════════════╦════════════════════════════════════╗
║ Residual                     ║ Why it matters                    ║
╠══════════════════════════════╬════════════════════════════════════╣
║ Heuristic bond churn too hot ║ Relationships can feel unstable   ║
║ Partner repetition variance  ║ Society can still get socially    ║
║                              ║ sticky in deterministic soaks     ║
║ Zone-pull timing sensitivity ║ Migration proof can fail under    ║
║                              ║ aggregate-suite pressure          ║
║ m7 not promoted              ║ ML is still supportive, not the   ║
║                              ║ main believability engine         ║
╚══════════════════════════════╩════════════════════════════════════╝
```

Suggested next plan frame:

1. **B9 Social Selection Stabilization**
   - Tune partner-recency, relationship-arc hysteresis, and cross-zone social opportunity without adding new cognition vocabulary.
   - Add a deterministic repeated-run long-soak audit that reports variance across 3 seeds.
2. **B10 Zone Pull Determinism**
   - Investigate `seed-zone-pull-resource` aggregate-suite sensitivity.
   - Separate valid timing variance from real affordance-pull weakness.
3. **B11 ML Value Revisit**
   - Keep m4 default.
   - Use B9/B10 stabilized fixtures before another promotion attempt.

## Bottom Line

The game is substantially closer to the target believable butterfly society. The strongest recent win is legibility: the player can now see what memory/feeling is shaping an action. The remaining problem is not "no AI"; it is social dynamics stability over longer deterministic soaks. That is the correct next planning surface.
