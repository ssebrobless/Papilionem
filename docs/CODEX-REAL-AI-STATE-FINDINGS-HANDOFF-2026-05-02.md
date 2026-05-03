# Codex Real-AI State Findings Handoff

Date: 2026-05-02  
Branch reviewed: `codex/milestone-freeze-playtest`  
Commit reviewed: `64b23c2` (`Add block stack base shadow`)  
Reviewer: Codex, fresh local test pass  

## Executive Verdict

The current game is much closer to a believable butterfly society than it was before the G0H / R / W / X / Y / Z work. The strongest evidence is that deterministic scenarios, production cognition trigger coverage, save continuity, block/zone spatial truth, ability radius conversion, and autobattle all pass. The life-sim layer now has durable state and production causality: butterflies can acquire persisted pride, shame, loyalty, grief, long-absence grief, witnessed-affection memory, social edges, and other functional cognition packets from gameplay paths.

However, the current build should not be described as "real AI" in the strong machine-learning sense yet. It is best described as:

- A real functional life-simulation state machine with durable memory, social causality, and increasingly believable behavior hooks.
- A local static ML scoring layer that is instrumented and explainable, but does not currently outperform the heuristic baseline reliably.
- A scripted G0H evidence harness that is mostly strong, but currently has one fresh failed lane: `cognition-coverage`, caused by `witnessedAffection` being present in memory counts but missing from accumulated cognition events in the latest full G0H rerun.

Codex's honest estimate:

- Toward "believable butterfly society": about 70%.
- Toward "real machine-learning AI": about 35-45%.
- Toward literal consciousness / subjective feelings: not applicable and should not be claimed.

## Current Shape

```text
Papilionem AI / Life-Sim State, 2026-05-02

╔════════════════════════════════════════════════════════════════════╗
║ Goal: 100% believable butterfly society                           ║
╠══════════════════════╦══════════════╦══════════════════════════════╣
║ Layer                ║ Current      ║ Evidence                     ║
╠══════════════════════╬══════════════╬══════════════════════════════╣
║ Durable cognition    ║ Strong       ║ packets + save continuity    ║
║ Production triggers  ║ Strong-ish   ║ cognition audit passes       ║
║ Lived G0H play       ║ Almost green ║ 12/13, one event gap         ║
║ Spatial 3D board     ║ Green        ║ zone/block/ability pass      ║
║ Battle/autobattle    ║ Green        ║ single-player audit passes   ║
║ UI/accessibility     ║ Recently green, needs human feel check       ║
║ ML value             ║ Weak         ║ 3/6 value metrics pass       ║
║ Conversation feel    ║ Weak-medium  ║ functional, not lifelike     ║
╚══════════════════════╩══════════════╩══════════════════════════════╝
```

The main gap is no longer "there is no cognition." The main gap is: cognition exists, but the ML layer is not yet meaningfully better than heuristic choice, and the social/conversation expression is still too mechanical to carry the user's desired illusion of living creatures.

## Fresh Tests Run By Codex

All tests below were run locally from:

`C:\Users\fishe\Documents\projects\ephemera`

### 1. Cognition Trigger Coverage

Command:

```bash
node scripts/run-r-cognition-trigger-coverage-audit.js
```

Result: pass  
Report:

`C:\Users\fishe\Documents\projects\ephemera\qa_logs\r_cognition_trigger_coverage\2026-05-02T18-31-38-840Z\report.json`

Key assertions all passed:

- `battle pride production trigger`
- `caregiving pride production trigger`
- `scout pride production trigger`
- `warning shame production trigger`
- `abandoned shame production trigger`
- `loyalty production trigger`
- `pride anchor persisted`
- `shame anchor persisted`
- `loyalty choice persisted`

Trigger counts:

```json
{
  "pride:battleWin": 1,
  "shame:warningIgnoredHarm": 1,
  "pride:caregivingSuccess": 1,
  "loyalty:competingDistress": 1,
  "pride:scoutCluster": 3,
  "witnessedAffection:dialogueWitnessed": 1,
  "shame:abandonedAlly": 1
}
```

Interpretation:

This is strong evidence that production trigger paths exist and can create durable cognition. It does not prove they happen often enough in unscripted long play, but it disproves the earlier concern that pride/shame/loyalty/witnessed affection only exist as storage-layer smoke tests.

### 2. Runtime Self Audit

Command:

```bash
node scripts/run-runtime-self-audit.js
```

Result: pass  
Report:

`C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\runtime_self_audit\report.json`

Interpretation:

The basic runtime shell stayed green during this pass.

### 3. Deterministic Scenario Suite

Command:

```bash
node scripts/run-scenario.js --all
```

Result: pass, 23/23 scenarios.

Scenarios passed:

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

Interpretation:

This is one of the strongest pieces of evidence in the repo. It means rare social situations are now covered by deterministic fixtures rather than depending only on a random long-running save. It still does not prove fully emergent long-horizon behavior, but it gives the team a reliable lab for development.

### 4. ML On/Off Capture Audit

Command:

```bash
node scripts/run-ml-on-off-capture-audit.js
```

Result: pass structurally  
Report:

`C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\ml_on_off_capture_audit\2026-05-02T18-35-24-937Z\report.json`

Checks passed:

- `ml-on-loads-static-policy-and-produces-ml-decisions`
- `ml-off-stays-on-heuristic-fallback`
- `outcome-window-row-coverage-at-least-80-percent`
- `browser-clean`
- `value-band-metrics-present-and-tagged`

Value metrics:

| Metric | Result | Notes |
| --- | --- | --- |
| `chi-square-motive-distribution-per-pair` | fail | Did not meet `>= 3.84` |
| `edge-delta-churn-per-minute` | pass | ML 18.9618 vs heuristic 13.6998, ratio 1.38 |
| `migration-target-shannon-entropy` | fail | ML 0.1847 vs heuristic 0.1934, ratio 0.955 |
| `target-acquisition-latency` | fail | ML 413.68 vs heuristic 97, ratio 4.26; ML is worse |
| `top-15-percent-top-edge-fraction` | pass | ML 0.124 vs heuristic 0.1682 |
| `near-target-jitter-ratio` | pass | ML 0.0073 vs heuristic 0.0122, ratio 0.598 |

Interpretation:

The ML path is real instrumentation, not a fake label. But it is not yet consistently useful. Only 3/6 value metrics meet threshold, and target acquisition is much worse with ML than without it. This is the strongest reason Codex does not call the current game "real machine-learning AI" yet.

### 5. ML Phase M4 Audit

Command:

```bash
node scripts/run-ml-phase-m4-audit.js
```

Result: warn  
Report:

`C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\ml_phase_m4_audit\2026-05-02T18-36-36-738Z\report.json`

Phase results:

- `01-artifact-contract-and-runtime`: pass
- `02-corpus-coverage-and-eval-thresholds`: fail
- `03-posture-to-action-mapping`: pass
- `04-live-battle-ui-and-rounds`: pass

Corpus/evaluation:

```json
{
  "recordCount": 12,
  "scenarioCount": 12,
  "reviewedRecordCount": 3,
  "correctedRecordCount": 1,
  "correctedPolicyCount": 1,
  "evaluatedPolicyCount": 56,
  "artifactTotalMatches": 43,
  "heuristicTotalMatches": 55,
  "correctedImprovementCount": 1,
  "traceAlignmentCount": 56
}
```

Interpretation:

The ML artifact is wired and can drive choices, but the corpus is tiny and m4 still trails the heuristic baseline on artifact match. The ML layer needs corpus growth, better labels, trainer iteration, and promotion gates. It should not be sold as the heart of the "real AI" yet.

### 6. ML Closure Audit

Command:

```bash
node scripts/run-ml-closure-audit.js
```

Result: fail  
Report:

`C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\ml_closure_audit\2026-05-02T18-36-36-694Z\report.json`

Phase results:

- `01-ml-summary-shape`: pass
- `02-runtime-budget-proof`: fail
- `03-inspect-ml-rows`: pass
- `04-history-buffer`: pass
- `05-live-inspect-visual`: pass
- `06-debug-explainability-shell`: pass
- `07-battle-rollout-budget`: fail
- `08-fallback-trace-contract`: pass

Important details from failed phases:

- Pressure profile in this audit reached `critical`.
- Cache was near cap in this audit sample: `cacheMB: 63.9662`, `cacheCapMB: 64`, `cacheRatio: 0.9995`.
- `stutterTier: critical`, `cacheTier: critical`.
- ML runtime battle decision budget was false in the captured profile.

Interpretation:

This may be partly audit-specific pressure, but it is still real evidence: ML closure is not complete. The UI/explainability shell works, but runtime and battle budget proof do not fully hold.

### 7. Full G0H Scripted Playthrough

Command:

```bash
node scripts/run-g0h-scripted-playthrough.js
```

Result: fail, 12/13 lanes passed  
Output folder:

`C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-02T18-39-07-459Z`

Report:

`C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-02T18-39-07-459Z\report.json`

Capture:

`C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-02T18-39-07-459Z\capture\capture.json`

Summary:

`C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-02T18-39-07-459Z\capture\summary.txt`

Failed lane:

`cognition-coverage`

G0H cognition coverage details:

```json
{
  "checks": {
    "bereavementDeath": true,
    "bereavementLongAbsence": true,
    "witnessedAffection": false,
    "loyaltyChoice": true,
    "prideBattleWin": true,
    "prideCaregivingSuccess": true,
    "shameAbandonedAlly": true,
    "shameWarningIgnoredHarm": true
  },
  "missingKinds": ["witnessedAffection"],
  "eventCounts": {
    "bereavementDeath": 1,
    "bereavementLongAbsence": 2,
    "witnessedAffection": 0,
    "loyaltyChoice": 1,
    "prideBattleWin": 1,
    "prideCaregivingSuccess": 2,
    "shameAbandonedAlly": 1,
    "shameWarningIgnoredHarm": 1
  },
  "memoryCounts": {
    "bereavementDeath": 1,
    "bereavementLongAbsence": 1,
    "witnessedAffection": 2,
    "loyaltyChoice": 1,
    "prideAnchor": 1,
    "shameAnchor": 1
  },
  "accumulatedCognitionCount": 14
}
```

Interpretation:

This is a narrow but important contradiction. `witnessedAffection` exists in memory counts, so the state appears to be created/persisted. But the G0H event evidence did not see a corresponding accumulated cognition event. Claude should inspect whether:

1. `recordWitnessedAffection` emits `cognition:triggered` in all successful packet creation paths.
2. The G0H driver accumulates the emitted event correctly.
3. The event kind/subtype naming differs between the production path and the G0H assertion.
4. The memory packet was created by a path that does not emit event evidence.
5. The test sequence creates memory before the accumulator window begins or outside the expected event history capture.

Runtime details from this G0H run:

```json
{
  "runtimeIssueCount": 8,
  "errorRuntimeIssueCount": 0,
  "warningRuntimeIssueCount": 8,
  "runtimeIssueKinds": { "cadence-budget-overrun": 8 },
  "pressureTier": "hot",
  "densityTier": "normal",
  "stutterTier": "hot",
  "cacheTier": "warm",
  "p95FrameMs": 20.4,
  "p99FrameMs": 22.7,
  "maxRenderMs": 22.1,
  "captureMaxRenderMs": 54.4,
  "captureP99FrameMs": 23.3,
  "spriteCacheEstimatedSurfaceMB": 42.9034,
  "spriteCacheMaxSurfaceMB": 64,
  "spriteCacheCacheHits": 816490,
  "spriteCacheCacheMisses": 209
}
```

Runtime interpretation:

The run had no page errors, console errors, or runtime errors. It did have 8 cadence-budget warnings and hot stutter/cache tiers. This is acceptable for review but should remain on the roadmap for human capture comfort.

### 8. Support / Spatial / Battle Audits

Commands:

```bash
node scripts/run-n8-social-save-continuity-audit.js
node scripts/run-h5-long-running-save-smoothness-audit.js
node scripts/run-r2-zone-transition-audit.js
node scripts/run-r-block-cell-discipline-audit.js
node scripts/run-ability-radius-conversion-audit.js
node scripts/run-single-player-autobattle-audit.js
```

Results: all pass.

Important support evidence:

- Social save continuity preserves protected social truth and sacred hybrid identity.
- Long-running save smoothness passes.
- Zone transition audit confirms all four zones and focused-zone truth remain coherent.
- Block-cell discipline passes, including the block stack roundtrip lane.
- Ability radius conversion audit passes current radius-unit defaults.
- Single-player autobattle passes and shows battle decisions sourced from ML where expected.

## Architecture Observations

### Durable Life-Sim State

The life-sim side is now the strongest AI-related layer. Relevant systems include:

- `systems/lifeSimSystem.js`
- `systems/communicationSystem.js`
- `systems/behaviorSystem.js`
- `systems/mlInferenceSystem.js`
- `systems/saveSystem.js`

Current durable and semi-durable truths include:

- drives
- emotions
- derived feelings
- social edges
- memories / memory packets
- interpretation residue
- routines and behavior biases
- grief / bereavement packets
- witnessed affection packets
- pride / shame anchors
- loyalty choices
- save/load continuity for social state

Codex does not recommend adding new vocabulary as the first move. The evidence says existing vocabulary is broad enough for the next slice. The bottleneck is frequency, quality of expression, observability, and ML value.

### Production Causality

Production triggers are substantially better than before. The cognition trigger audit proves pride/shame/loyalty/witnessed-affection paths can fire without direct scenario helper shortcuts.

Remaining concern:

The full G0H rerun failed only on `witnessedAffection` event coverage even though memory counts showed `witnessedAffection: 2`. That indicates a mismatch between state creation and event evidence. Claude should treat that as the next highest-priority concrete bug.

### ML Reality

Current ML runtime:

- Local static policy JSON.
- m4 default policy artifact.
- Offline-only training contract.
- Heuristic fallback required.
- 15 feature groups, 106 flat features, vector length 124.
- Shared spatial hooks include verticality, structure role, path state, body fit.

The ML layer is not fake, but it is weak:

- m4 artifact total matches: 43/56.
- heuristic total matches: 55/56.
- on/off value metrics: 3/6 pass.
- target acquisition latency is much worse with ML on.
- ML closure audit failed runtime and battle budget proof.

Claude should develop a concrete ML improvement plan that includes:

1. Corpus growth from G0H and scenario traces.
2. Better labeling / reviewed records.
3. Trainer iteration for m5 or later.
4. Promotion gates requiring ML to beat heuristic, not merely differ from it.
5. Runtime budget protections for garden and battle.
6. A clear separation between life-sim durable truth and ML scoring.

### Believability / Conversation Gap

The current feed and social behavior are functional but likely still not rich enough to feel like "living creatures" to a human player. The game has internal events, but the expression layer needs work:

- Less repetitive feed text.
- More context-sensitive dialogue.
- Better continuity between what a butterfly remembers and what it says.
- Relationship-specific speech and behavior.
- Better explanation/inspection UI so the player can see why a butterfly chose something.
- More long-horizon effects: recurring partners, avoidance, reconciliation, grief recovery, rivalry, social learning, repeated choices shaping future behavior.

Important boundary:

Do not claim literal consciousness or real subjective feeling. The target is believable artificial life: functional emotions, durable memory, social causality, and learning-driven behavior.

## Relevant Prior Documents

Claude should read these as background, but should prioritize the fresh evidence in this document when there is conflict:

- `C:\Users\fishe\Documents\projects\ephemera\docs\G0H-SCRIPTED-PLAYTHROUGH-FIXTURE-PLAN-2026-05-01.md`
- `C:\Users\fishe\Documents\projects\ephemera\docs\G0H-REAL-AI-SELF-AUDIT-HANDOFF-2026-05-01.md`
- `C:\Users\fishe\Documents\projects\ephemera\docs\CLAUDE-REVIEW-G0H-REAL-AI-NEXT-PLAN-2026-05-01.md`
- `C:\Users\fishe\Documents\projects\ephemera\docs\CLAUDE-WHOLE-GAME-REVIEW-G0H-3D-AI-UI-SPRITE-NEXT-PLAN-2026-05-01.md`
- `C:\Users\fishe\Documents\projects\ephemera\docs\CLAUDE-REVIEW-G0H-FULL-SUCCESS-NEXT-PLAN-2026-05-01.md`
- `C:\Users\fishe\Documents\projects\ephemera\docs\CLAUDE-REVIEW-Z1-PRESSURE-CONTRADICTION-NEXT-PLAN-2026-05-01.md`

Relevant fresh reports:

- `C:\Users\fishe\Documents\projects\ephemera\qa_logs\r_cognition_trigger_coverage\2026-05-02T18-31-38-840Z\report.json`
- `C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\ml_on_off_capture_audit\2026-05-02T18-35-24-937Z\report.json`
- `C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\ml_phase_m4_audit\2026-05-02T18-36-36-738Z\report.json`
- `C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\ml_closure_audit\2026-05-02T18-36-36-694Z\report.json`
- `C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-02T18-39-07-459Z\report.json`
- `C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-02T18-39-07-459Z\capture\summary.txt`
- `C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\r_block_cell_discipline_audit\2026-05-02T18-47-26-479Z\report.json`
- `C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\ability_radius_conversion_audit\2026-05-02T18-47-26-512Z`
- `C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\single_player_autobattle_audit\2026-05-02T18-47-26-526Z`

## Recommended Next Plan For Claude To Review

Codex's recommended next implementation order:

```text
╔════════════════════════════════════════════════════════════════════╗
║ Next Implementation Ladder                                        ║
╠══════╦═════════════════════════════════════════════════════════════╣
║ A1   ║ Fix G0H witnessedAffection event evidence contradiction    ║
║ A2   ║ Rerun full G0H until 13/13 is honest-green                 ║
║ A3   ║ Stabilize ML closure runtime/battle budget failures        ║
║ A4   ║ Build ML corpus-growth + labeling + m5/m6 trainer plan     ║
║ A5   ║ Improve social expression / conversation naturalness       ║
║ A6   ║ Add long-horizon unscripted society evaluation             ║
║ A7   ║ Human capture only after A1-A3 are green                   ║
╚══════╩═════════════════════════════════════════════════════════════╝
```

### A1: Witnessed-Affection Evidence Repair

Goal:

Make G0H `cognition-coverage` pass for `witnessedAffection` by proving event evidence and memory state align.

Likely files to inspect:

- `systems/lifeSimSystem.js`
- `systems/communicationSystem.js`
- `scripts/g0h/playthroughDriver.js`
- `scripts/g0h/evidenceAssertions.js`
- `scripts/run-g0h-scripted-playthrough.js`

Questions:

- Does `recordWitnessedAffection` emit `cognition:triggered` every time it creates a new packet?
- Does the event payload use `kind: 'witnessedAffection'`, or a different kind/subtype shape?
- Does G0H accumulate events from the whole run, or only recent event history?
- Does the G0H witnessed-affection scene create packets through a production path or a memory-only side path?
- Are memory packets created before the accumulator starts listening?

Acceptance:

- Full G0H passes 13/13.
- `witnessedAffection` has event count >= 1 and memory count >= 1 in the same run.
- No direct helper shortcuts are introduced in G0H for the lived-loop test.
- Existing 23 scenarios remain green.
- Cognition trigger coverage audit remains green.

### A2: Fresh G0H Evidence Lock

Goal:

After A1, rerun the full G0H and record a new evidence packet as the current reference.

Acceptance:

- `node scripts/run-g0h-scripted-playthrough.js`: 13/13 pass.
- `node scripts/run-r-cognition-trigger-coverage-audit.js`: pass.
- `node scripts/run-scenario.js --all`: 23/23 pass.
- No page errors, console errors, or runtime errors.

### A3: ML Closure Stabilization

Goal:

Resolve `run-ml-closure-audit.js` failures without hiding real pressure.

Failures to inspect:

- `02-runtime-budget-proof`
- `07-battle-rollout-budget`

Important observed values:

- `stutterTier: critical`
- `cacheTier: critical`
- `cacheMB: 63.9662`
- `cacheCapMB: 64`
- `cacheRatio: 0.9995`
- `maxRenderMs: 178.7`
- `p99FrameMs: 107.9`
- battle decision budget false

Claude should determine whether this is:

- A real regression from Z1/Z6.
- An ML closure audit stress case that needs the same pressure-headroom logic as G0H.
- A cache eviction / closeup bake issue.
- A battle ML cadence issue.
- A report window issue that should be made honest but not loosened.

Acceptance:

- `node scripts/run-ml-closure-audit.js`: pass.
- No threshold is relaxed without a named reason.
- ML runtime budget and battle rollout budget are genuinely green.

### A4: ML Improvement Plan

Goal:

Move from "static ML scorer exists" toward ML that improves behavior.

Claude should produce a concrete plan for:

- Corpus growth: how many records, from which scenarios, and how to label.
- Trainer architecture: ridge linear continuation, m5/m6, or a justified alternative.
- Promotion gates: ML must beat heuristic on artifact match and improve lived-play value metrics.
- Cadence tuning: avoid stutter while increasing behavioral value.
- Battle ML: separate pass/fail criteria for garden versus battle.
- Trace quality: identify which traces are too synthetic and which reflect lived play.
- Human review loop: how user feedback becomes labels without online training in the live game.

Do not promote ML merely because it is different. It must be measurably better.

### A5: Believable Conversation / Society Expression

Goal:

Make the player perceive the internal state that already exists.

Claude should inspect:

- Feed phrase generation.
- Dialogue thread rendering.
- Inspection UI.
- Relationship/memory summaries.
- Whether actions are visibly connected to motives and memories.

Potential plan areas:

- Contextual dialogue templates grounded in actual memory packets.
- Relationship-specific speech.
- Follow-up lines after grief, jealousy, loyalty, shame, pride, and affection.
- Reduced repetition.
- Better UI surfacing of "why this butterfly did this."
- A human-readable social diary per butterfly.

Do not add new cognition vocabulary as the first move unless Claude proves the current vocabulary cannot express the desired behavior.

### A6: Long-Horizon Society Evaluation

Goal:

Move beyond deterministic 5-7 minute proof toward "does this society feel alive over time?"

Claude should design tests for:

- 20-minute unscripted fixture run.
- 60-minute accelerated society run.
- Bond stability and churn.
- Grief recovery over time.
- Repeated partner preferences.
- Avoidance after harm/shame.
- Cleanup/home maintenance without teleporting.
- Zone migration entropy.
- Conversation repetition rate.
- ML-on versus ML-off social quality.

Acceptance should include metrics and screenshots/captures, not just pass/fail booleans.

## Hard Constraints

- Do not wipe the user's long-running save. Synthetic test saves are fine.
- Do not bump save schema unless Claude identifies a concrete blocker that cannot be solved additively.
- Do not claim literal consciousness, subjective feeling, or human equivalence.
- Keep ML as a scorer/selector; durable feelings, memories, and bonds remain owned by life-sim/social systems.
- Do not silently retune thresholds to turn red lanes green.
- Do not add new drive/emotion/memory/social-edge vocabulary casually. If Claude thinks new vocabulary is required, it must name the missing behavior, explain why current vocabulary cannot express it, provide a migration path, and provide tests.
- Do not re-found the 3D/spatial system unless a named contradiction proves the current board/projection contract is insufficient. Current spatial evidence is green.

## Requested Claude Output

Claude should produce:

1. A review of this document and the linked reports.
2. A clear verdict on how close the game is to:
   - believable butterfly society,
   - real machine-learning AI,
   - human-playtest readiness.
3. A concrete phase plan in exact implementation order.
4. Owned files, forbidden files, rollback flags, proofs/audits, acceptance criteria for every phase.
5. A specific ML improvement roadmap that can get the game closer to 100% believable butterfly society.
6. A singular copy-paste prompt for Codex that points to Claude's new plan document and tells Codex exactly what to implement first.

