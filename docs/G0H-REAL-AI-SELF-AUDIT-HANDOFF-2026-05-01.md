# G0H Real-AI Self-Audit Handoff - 2026-05-01

## Purpose

This document records the current Codex self-audit after implementing the scripted G0H playthrough fixture and running the current deterministic harnesses. It is meant to be handed to Claude for an independent review and for planning the next concrete implementation sequence toward the user's target: a readable 3D-backed butterfly life sim that feels like a believable society with increasingly real AI behavior.

The latest committed build reviewed here is:

- Branch: `codex/milestone-freeze-playtest`
- Commit: `d3bd27f Add scripted G0H playthrough fixture`
- Repo: `C:\Users\fishe\Documents\projects\ephemera`

## Evidence Shape

```text
current proof ladder
+------------------------------------------------------------+
| G0H official scripted playthrough                          |
| 420004ms, 10/10 lanes passed, no page/console/runtime errors|
+------------------------------------------------------------+
| G0H fast sanity                                            |
| current code still passes the 10-lane fixture harness      |
+------------------------------------------------------------+
| Deterministic scenario suite                               |
| 23/23 scenarios passed, including organic social cases     |
+------------------------------------------------------------+
| Regression audits                                          |
| runtime, H5 save, zone transition, block cells, N8 save,   |
| capture export, ability radius, autobattle all green       |
+------------------------------------------------------------+
| ML / "real AI" value                                       |
| not solved: static artifact underperforms heuristic labels |
+------------------------------------------------------------+
```

## Relevant Files And Evidence

Binding and planning docs:

- `docs/G0H-SCRIPTED-PLAYTHROUGH-FIXTURE-PLAN-2026-05-01.md`
- `docs/ML-VALUE-DECISION-2026-05-01.md`
- `docs/CLAUDE-REVIEW-FREEZE-PLAYTEST-NEXT-PLAN-2026-04-30.md`

Scripted G0H tooling added:

- `scripts/g0h/fixtureSpec.js`
- `scripts/build-g0h-fixture-save.js`
- `scripts/run-g0h-scripted-playthrough.js`
- `scripts/g0h/playthroughDriver.js`
- `scripts/g0h/evidenceAssertions.js`

Small supporting fix:

- `scripts/run-h5-long-running-save-smoothness-audit.js`
  - The latest-save picker now ignores `g0h-scripted-fixture-*` exports unless explicitly provided, so H5 does not accidentally treat a synthetic fixture as the user's latest real save.

Official G0H packet:

- Root: `qa_logs/g0h_scripted_playthrough/2026-05-01T01-50-18-071Z`
- Report: `qa_logs/g0h_scripted_playthrough/2026-05-01T01-50-18-071Z/report.json`
- Human review: `qa_logs/g0h_scripted_playthrough/2026-05-01T01-50-18-071Z/human-review.md`
- Capture: `qa_logs/g0h_scripted_playthrough/2026-05-01T01-50-18-071Z/capture/capture.json`
- Summary: `qa_logs/g0h_scripted_playthrough/2026-05-01T01-50-18-071Z/capture/summary.txt`
- Screenshots: `qa_logs/g0h_scripted_playthrough/2026-05-01T01-50-18-071Z/screenshots/`

Latest fast G0H sanity packet:

- Root: `qa_logs/g0h_scripted_playthrough/2026-05-01T02-32-15-724Z`
- Report: `qa_logs/g0h_scripted_playthrough/2026-05-01T02-32-15-724Z/report.json`

Latest deterministic scenarios:

- Root: `qa_screenshots/scenario/`
- Command run: `node scripts/run-scenario.js --all`
- Result: 23/23 passed.
- Latest scenarios include:
  - `seed-affection`
  - `seed-battle-radius`
  - `seed-bond-progression`
  - `seed-bond-progression-organic`
  - `seed-cleanup-floor-organic`
  - `seed-cooperation-h1`
  - `seed-cooperation-organic-floor`
  - `seed-flower-lifecycle`
  - `seed-grief`
  - `seed-grief-long-absence-organic`
  - `seed-grief-organic`
  - `seed-jealousy`
  - `seed-jealousy-organic`
  - `seed-loneliness`
  - `seed-loneliness-organic`
  - `seed-loyalty`
  - `seed-loyalty-organic`
  - `seed-ml-value`
  - `seed-pride`
  - `seed-pride-organic`
  - `seed-shame`
  - `seed-shame-organic`
  - `seed-spatial-truth`

Regression audits run after the official G0H packet:

- `node scripts/run-runtime-self-audit.js` -> pass
- `node scripts/run-h5-long-running-save-smoothness-audit.js` -> pass
- `node scripts/run-r2-zone-transition-audit.js` -> pass
- `node scripts/run-r-block-cell-discipline-audit.js` -> pass
- `node scripts/run-n8-social-save-continuity-audit.js` -> pass
- `node scripts/run-f1-session-capture-audit.js` -> pass
- `node scripts/run-ability-radius-conversion-audit.js` -> pass
- `node scripts/run-single-player-autobattle-audit.js` -> pass

## Official G0H Result Summary

The official packet passed:

- Overall: `pass`
- Duration: `420004ms`
- Evidence lanes: `10/10`
- Accelerated: `false`
- Page errors: `0`
- Console errors: `0`
- Runtime errors: `0`
- Runtime warnings: `6`, all `cadence-budget-overrun`
- Zones visited: `ivy-cloister`, `moss-hollow`, `pool-heart`, `sun-court`
- Fixture: `16` butterflies, `15` flowers/lifecycle objects, `9` blocks, `0` sun-court blocks
- Inspections: `9`, including `1` after save/load
- Feed shape: motive, target, response, and consequence were present
- Flower lifecycle evidence: captured
- Battle/ability evidence: captured
- Save/reload continuity: passed
- Block-cell discipline: passed

The official packet proves that the current implementation can stage a controlled 7-minute playthrough where spatial, social, save, flower, block, battle, and ability evidence all appear without hard runtime failure.

## Honest Interpretation

### What Is Strong Now

Spatial and board truth are much better than before. The current evidence does not support a full spatial rebuild as the next best step. G0H and `seed-spatial-truth` prove that the current board/projection stack can support focused zones, legal block cells, save/load, battle/ability radius evidence, and screenshot-backed review.

Save continuity is strong. The synthetic G0H save loads cleanly, the player's real save is protected by storage snapshot/restore, and N8 social save continuity remains green.

Life-sim state is real as game data. The butterflies now have durable identity, drives, emotions, memories, social edges, derived feelings, production triggers, and inspect/feed surfaces. The deterministic scenario suite proves grief, long-absence grief, loneliness, jealousy, loyalty, pride, shame, cooperation, cleanup, bond progression, battle radius, and spatial truth at the harness level.

### What Is Still Weak

The current system is not yet "real AI" in the user's intended sense. It is a structured life simulation plus heuristic behavior plus a static local ML scorer. The life-sim is meaningful, but the learning layer has not proven value.

The ML value document is the key caution:

- `gameConfig.ml.cadenceFactor = 2` is a conservative default, not proof of ML success.
- Cadence factor 1: `1/6` value metrics passed.
- Cadence factor 2: `1/6` value metrics passed.
- Cadence factor 4: `3/6` value metrics passed.
- Expanded corpus M4 audit: `warn`.
- Static artifact: `38/56` matches.
- Heuristic labels: `55/56` matches.

Interpretation: the current static artifact is not better than the heuristic. The next honest ML step is a real training/update path, not more runtime tuning.

The official G0H social proof is still partly staged. Production events fire, but the official packet only saw one cognition trigger in the final evidence summary, a battle pride anchor. The deterministic scenarios are broader and greener, but lived, unscripted society over long play remains under-proven.

## Approximate Current Readiness

These are Codex's rough estimates, not acceptance facts:

- Spatial / 3D-backed board truth for G0 playtesting: `75-85%`
- Save/social continuity: `80%+`
- Believable scripted social situations: `65-75%`
- Lived unscripted society feeling real over long play: `35-50%`
- Real ML-driven intelligence: `20-30%`

## Constraints For Next Planning

Use these as guardrails, not blind shackles:

- Do not claim literal consciousness or subjective feeling.
- The user wants the game to feel like living creatures with thoughts, relationships, and emotions. Claude should be allowed to propose new cognition vocabulary or state expansions if existing families are insufficient, but it must provide an owner system, migration path, proof strategy, and reason existing fields cannot express the behavior.
- Do not wipe the player's real long-running save. Synthetic saves and deterministic scenarios are allowed and encouraged.
- Save schema should remain v5 unless Claude names a concrete contradiction requiring a bump.
- ML should not own durable feelings, memories, or bonds. Durable social truth should remain life-sim/communication owned. ML may score choices, rank alternatives, and produce traceable policy outputs.
- Spatial system should not be re-founded unless Claude finds a named contradiction in the current board/projection/block contracts.
- Battle remains top-down/autobattle unless a separate named contradiction requires reopening it.
- Human-facing believability matters. Audit pass is not the same as emotional success.

## Recommended Claude Review Task

Claude should now do an independent review and produce a next implementation plan. The review should answer:

1. Does the current evidence justify moving from G0H to human G0 playtest, or are there blocking issues hidden by the harness?
2. Are the 3D/spatial/zone/block/battle/ability systems close enough for the next phase, or are there named contradictions still requiring surgical fixes?
3. Which parts of the life-sim are real durable behavior versus staged scenario proof?
4. What exact gap prevents the game from feeling like "real AI" right now?
5. What is the next best phase order to make butterflies feel more alive in unscripted play?
6. What training/evaluation pipeline should replace or update the current static ML policy?
7. What new deterministic scenarios should Codex implement so we can prove improvements without waiting for random play?
8. What human playtest script should the user run after the next implementation phase?

## Suggested Next Direction

The likely next plan should focus on AI value and lived social believability, not another spatial rebuild.

```text
next likely ladder
+----------------------------------------------------------+
| A1 Lived behavior observability                         |
| richer traces: motive, alternatives, chosen action, result|
+----------------------------------------------------------+
| A2 Unscripted social pressure scenarios                 |
| scarcity, absence, rejection, cooperation, conflict      |
+----------------------------------------------------------+
| A3 Real training/update path                            |
| consume corpus -> train candidate -> write policy artifact|
+----------------------------------------------------------+
| A4 ML-vs-heuristic promotion gate                       |
| artifact must beat heuristic and improve lived metrics   |
+----------------------------------------------------------+
| A5 Social believability pass                            |
| reduce repetitive talk, improve bonds, consequences      |
+----------------------------------------------------------+
| A6 Human G0 playtest                                    |
| user judges whether the society feels alive              |
+----------------------------------------------------------+
```

Claude should revise this ladder as needed and give Codex a phase-by-phase implementation plan with owned files, forbidden files, rollback flags, proofs, expected artifacts, and acceptance criteria.
