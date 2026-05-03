# Codex Post-AA8 Current State and Next-Plan Handoff - 2026-05-02

## Purpose

This document summarizes the current Papilionem state after the completed AA1-AA8 implementation/audit slice. It is intended for a fresh Claude Code review that should:

- verify what Codex implemented,
- inspect whether the current game is actually moving toward the user's target,
- judge how close the game is to a believable butterfly society with real machine-learning support,
- identify remaining contradictions, product gaps, and maintainability risks,
- create the next concrete phase plan for Codex to implement.

The important distinction:

- The game is technically much healthier than before: spatial/save/UI/runtime/cognition evidence is green.
- The game is not yet "100% believable butterfly society" or "real AI" in the user's desired sense.
- The next plan should focus on lived society behavior and ML value, not another spatial foundation rebuild.

## Current Shape

```text
+----------------------+----------------------+-----------------------------+
| Layer                | Current Gate          | Honest Meaning              |
+----------------------+----------------------+-----------------------------+
| 3D / board / save    | Green                 | Good enough for product work |
| UI / accessibility   | Green                 | Audits pass after scroll fix |
| Sprite fidelity      | Green enough          | High-res path restored       |
| Cognition storage    | Green                 | Durable packets/edges work   |
| Cognition triggers   | Green in G0H/scenario | Production paths are wired   |
| Expression           | Green in audit        | Better, not yet naturally    |
|                      |                      | rich over long play          |
| ML runtime           | Stable                | m4 remains default           |
| ML training          | Candidate only        | m6 not promoted              |
| Long-soak society    | Warning               | Repetition/staticness remain |
| Human G0 capture     | Allowed with warnings | Useful, not final success    |
+----------------------+----------------------+-----------------------------+
```

## Completed Work Since the Earlier Stabilization Plan

### Harness and Evidence Reliability

The earlier harness false-green risks were addressed across the prior P/R/W/X/Y/Z/AA phases. The latest evidence layer now includes:

- persistent G0H cognition subscriber instead of sampling the eventBus history ring,
- evidence-fidelity lane,
- cognition-coverage lane,
- deterministic fixture saves,
- scripted 7-minute G0H run,
- long-soak society audit,
- expression naturalness audit,
- UI parity and hover-scroll audits,
- ML closure and promotion gates.

The biggest conceptual improvement is that memory state and cognition events are now both visible. The harness no longer relies only on recent eventBus history, which previously lost cognition events under normal game noise.

### Spatial / 3D / Board Truth

The spatial system does not currently need a rebuild. The named surgical contradictions from earlier reviews were handled:

- zone lookups migrated away from stale pixel/isometric assumptions where previously flagged,
- ability/battle radius audits pass,
- block cell discipline passes,
- block stack height restore was fixed,
- no blocks spawn in sun-court / Training Grounds in the fixture proof,
- save/reload preserves block cells and social state in G0H.

Evidence:

- `qa_screenshots/r_block_cell_discipline_audit/2026-05-02T22-56-15-698Z/report.json`
- `qa_screenshots/r2_zone_transition_audit/2026-05-02T22-56-15-682Z/report.json`
- `qa_screenshots/ability_radius_conversion_audit/2026-05-02T22-56-54-263Z`
- `qa_screenshots/single_player_autobattle_audit/2026-05-02T22-56-54-277Z/report.json`
- `qa_logs/g0h_scripted_playthrough/2026-05-02T23-16-58-153Z/report.json`

Open spatial concern:

- The proof says the board/projection contracts are stable, but a human capture still matters for visual legibility: whether the player can understand height, movement bounds, zone identity, and construction intent without reading debug truth.

### Sprite / Visual Fidelity

The high-resolution source asset path has been restored enough for the audit gates:

- smooth creature layers,
- high-resolution creature bake lifting,
- cache cap and pressure relief,
- sprite fidelity audits passing.

Evidence:

- `qa_screenshots/r5_sprite_fidelity_audit/2026-05-02T21-16-05-010Z/report.json` if present from the latest Z/Y work
- `qa_screenshots/r_expression_naturalness_audit/2026-05-02T23-08-25-482Z/report.json`
- `docs/AA8-HUMAN-CAPTURE-GATE-2026-05-02.md`

Open visual concern:

- Audits prove the pipeline is not destroying as much detail as before, but the user's eye is still the final authority. Human capture should explicitly check close-up wing/body clarity, garden-scale clarity, and whether sprite scale feels right against the board.

### UI / Accessibility / Scroll

The UI layer is now much better covered:

- canvas hit-box overlap passes,
- colorblind mode persists and applies canvas filter,
- high-contrast and trail settings are wired,
- DOM/canvas inventory parity passes,
- feed heard-meaning DOM line renders,
- inspect feeling row renders,
- hover-scroll works for feed, access, inspect, journal, debug, and canvas panels.

Latest evidence:

- `qa_screenshots/r_ui_parity_audit/2026-05-02T23-08-25-474Z/report.json`
- `qa_screenshots/r4_ui_readability_audit/2026-05-02T23-08-25-483Z/report.json`
- `qa_screenshots/r_hover_scroll_audit/2026-05-02T23-07-58-031Z/report.json`

AA8 UI fix:

- `ui/dom/debugPanel.js`: preserve debug scroll through rerenders and route wheel events.
- `ui/dom/feedPanel.js`: preserve feed scroll through rerenders and route wheel events.
- `scripts/run-r-hover-scroll-audit.js`: make synthetic overflow stable and freeze/restart the loop per panel setup so hover-scroll checks are deterministic.

Open UI concern:

- The audits are strong for parity and scroll, but there should still be a focused human pass through every panel: feed, inspect, journal, accessibility, battle setup, debug, save/reload, zone controls.

### Cognition / Life-Sim

The current life-sim is no longer just a hidden collection of simple if/then responses. It has durable state and production evidence for:

- drives and derived feelings,
- social edges,
- memory packets,
- witnessed affection,
- bereavement / long absence,
- pride,
- shame,
- loyalty,
- caregiving,
- warnings and ignored warnings,
- feed interpretation,
- named-memory dialogue,
- inspect "Why This Moment".

Latest G0H evidence:

- `qa_logs/g0h_scripted_playthrough/2026-05-02T23-16-58-153Z/report.json`
- `qa_logs/session_captures/2026-05-02T23-24-08-715Z-g0h-scripted-playthrough-capture-1777763827504`

G0H latest lane summary:

```json
{
  "overall": "pass",
  "laneSummary": {
    "total": 13,
    "passed": 13,
    "failed": [],
    "residual": []
  }
}
```

Latest cognition accumulator digest from the 2026-05-02T23-16-58-153Z run:

```json
{
  "accumulatedCognitionCount": 29,
  "eventKindCounts": {
    "bereavement:long-absence": 5,
    "pride": 13,
    "witnessedAffection": 5,
    "loyalty": 1,
    "shame": 4,
    "bereavement": 1
  },
  "subscriber": {
    "attached": true,
    "dropped": 0,
    "detached": true
  }
}
```

Expression audit:

```json
{
  "overall": "pass",
  "distinctDialogueTemplates": 9,
  "namedMemoryDialogueEvents": 10,
  "dialogueRepetitionRate": 0,
  "inspectWhyCoverage": 1.0
}
```

Evidence:

- `qa_screenshots/r_expression_naturalness_audit/2026-05-02T23-08-25-482Z/report.json`
- `qa_logs/r_cognition_trigger_coverage/2026-05-02T22-57-23-451Z/report.json`
- `qa_screenshots/r_cooperation_pressure_audit/2026-05-02T22-57-23-501Z/report.json`

Honest limitation:

- The systems are durable and observable, but long-run behavior is still not self-sustaining enough. The butterflies can produce the right states under targeted pressure, but the long-soak says those states do not yet arise with enough organic variety.

### ML / "Real Machine Learning"

Current default remains `m4-garden-policy-v1`.

m6 was trained and evaluated as a candidate, but AA5 correctly did not promote it. This is a good outcome: the project now has a real trainer/corpus path and an honest gate, not just a pretend ML switch.

Evidence:

- `docs/ML-PROMOTION-DECISION-2026-05-02.md`
- `assets/ml/m6-garden-policy.json`
- `scripts/train-m6-garden-policy.js`
- `scripts/run-ml-phase-m6-audit.js`
- `qa_screenshots/m6_policy_training/2026-05-02T22-09-27-675Z/m6-training-evaluation.json`
- `qa_screenshots/ml_phase_m6_audit/2026-05-02T22-19-10-098Z/report.json`
- `qa_screenshots/ml_on_off_capture_audit/2026-05-02T22-22-27-665Z/report.json`

m6 gate summary:

- corpus: 191 records,
- m6 beats m4 on 4 of 5 policy families,
- m6 clears some value gates,
- m6 fails no-regression-vs-heuristic for `signalChoice` and `autobattlePosture`,
- m4 stays default.

Honest limitation:

- This is now a real ML pipeline, but not yet a high-value learned intelligence. The learned policy still needs better data balance, stronger held-out cases, and lived-value proof before it should own default decisions.

## How Close Are We to the User's Goal?

The user's goal is best interpreted as:

- not literal consciousness,
- not a claim that butterflies truly feel subjective experiences,
- but a game system where butterflies appear to live as individuals with persistent needs, memories, bonds, emotions, social interpretation, cooperation, conflict, routines, and learning-supported decision making.

Current estimate:

```text
+-----------------------------+-----------+----------------------------------+
| Goal Dimension              | Estimate  | Reason                           |
+-----------------------------+-----------+----------------------------------+
| Technical stability         | 85-90%    | Major proof suite is green        |
| 3D/board correctness        | 80-90%    | Audits green; visual review left  |
| UI usability                | 75-85%    | Audits green; human pass needed   |
| Sprite fidelity             | 70-80%    | Pipeline fixed; eye test remains  |
| Durable cognition           | 75-85%    | Packets/edges/events persist      |
| Lived society believability | 45-60%    | Long-soak warnings are serious    |
| Real ML value               | 35-50%    | Trainer exists; default not ML-win |
| Overall target              | 60-70%    | Strong foundation, weak ecology   |
+-----------------------------+-----------+----------------------------------+
```

Why not higher?

- Partner repetition is still very high.
- Relationships do not churn or stabilize in a believable long-run pattern.
- Witnessed affection does not arise organically enough.
- Zone migration entropy is too low.
- Cleanup/ecosystem pressure is borderline.
- ML has a candidate pipeline but the candidate cannot safely replace m4.

Why not lower?

- The game now has production-path cognition events.
- Save/reload preserves identity, memories, social edges, and block truth.
- UI, sprite, spatial, flower, battle, and ability audits are green.
- The deterministic scenario suite is now broad and passes 32/32.
- The long-soak audit gives us a real measurement surface for society behavior.

## Long-Soak Warnings That Should Drive the Next Plan

Source:

- `qa_logs/long_soak_society/2026-05-02T22-50-53-345Z/report.json`

```text
+-------------------------+----------+--------------------------+--------------+
| Signal                  | Observed | Target                   | Severity     |
+-------------------------+----------+--------------------------+--------------+
| bond stability          | 0.355    | <= 0.30                  | medium       |
| bond churn              | 0        | 0.5..4 transitions/min   | high         |
| partner repetition      | 0.896    | <= 0.40                  | high         |
| witnessed affection     | 0/min    | >= 0.10/min              | high         |
| cleanup gradient        | 0.50     | < 0.50 non-positive wins | medium       |
| zone migration entropy  | 0.077    | >= 0.50 stretch          | high/stretch |
+-------------------------+----------+--------------------------+--------------+
```

These are not proof that the systems are broken. They are proof that the lived ecology is still too narrow.

## Ownership Map for the Next Plan

The next plan should preserve one-owner-per-truth:

```text
+-------------------------+---------------------------+----------------------------+
| Truth                   | Owner                     | ML Role                    |
+-------------------------+---------------------------+----------------------------+
| drives / needs pressure | lifeSim / behavior layer  | consumes as features       |
| current emotion values  | lifeSim                   | consumes as features       |
| memory packets          | lifeSim memory paths      | consumes as features       |
| social edges            | lifeSim / social systems  | consumes as features       |
| interpretation quality  | communicationSystem       | consumes as features       |
| routines / habits       | routine/behavior systems  | consumes as features       |
| movement target choice  | behavior + movement       | may score candidates       |
| durable save state      | saveSystem                | no durable ownership       |
| dialogue expression     | communication + UI        | may explain, not own truth |
+-------------------------+---------------------------+----------------------------+
```

Do not solve repetition or social flatness by inventing duplicate hidden relationship systems. Improve the existing candidate selection, pressure gradients, routine loops, and expression surfacing.

## Discussion Agenda for the Next Plan

Claude should help decide these before Codex implements the next ladder.

### 1. Human Capture Now vs. One More Believability Slice

Question:

- Should the user run a human capture now that technical gates pass, or should Codex first address the long-soak society warnings?

Recommended answer:

- One human capture now is defensible, but the most efficient engineering path is one more believability slice first, because the long-soak already names the weaknesses the user will likely notice.

### 2. Social Partner Diversity

Problem:

- Partner repetition is 0.896 against <= 0.40.

Potential plan areas:

- add recency/cooldown penalties to repeated dialogue partner selection,
- increase value of underserved meaningful edges,
- distinguish "checking in with a bonded partner" from generic repeated chatter,
- add group-context selection where a third-party witness matters,
- make butterflies seek different partners for different needs.

Acceptance ideas:

- long-soak partner repetition <= 0.60 first, then <= 0.40 later,
- no collapse in bond memory or affection visibility,
- G0H remains 13/13.

### 3. Organic Affection Exposure

Problem:

- Witnessed affection fires in G0H and scenario lanes, but long-soak witnessed affection rate is 0/min.

Potential plan areas:

- increase production opportunities for affectionate dialogue around bonded pairs,
- ensure third-party witnesses are spatially likely to be nearby,
- add "social gathering" or "rest near others" routine pressure using existing families,
- make affection events sometimes happen in visible/common zones, not isolated loops.

Acceptance ideas:

- witnessed affection rate >= 0.05/min as first gate, then >= 0.10/min,
- memory packets and feed expression both show it,
- no new memory vocabulary unless Claude names a concrete insufficiency.

### 4. Relationship Churn and Stability

Problem:

- Bond churn is 0 while bond stability is slightly outside target.

Interpretation:

- Edges are alive enough to wobble but not dynamic enough to form visible relationship arcs.

Potential plan areas:

- add event-weighted edge deltas for conflict, help, shared success, absence, and repeated neglect,
- use existing edge families instead of new ones,
- define "relationship arc" audit over 20 minutes,
- avoid random noise masquerading as change.

Acceptance ideas:

- 0.25..2.0 meaningful transitions/min as first provisional gate,
- bond stability <= 0.33 first, then <= 0.30,
- at least one visible relationship arc in scripted and long-soak evidence.

### 5. Zone Migration Entropy

Problem:

- Zone migration entropy is 0.077 against >= 0.50 stretch.

Potential plan areas:

- add zone-specific needs/opportunities without turning zones into vague themes,
- Training Grounds remains sun-court and no ambient blocks there,
- open lands should differ by resource/social/build pressure rather than arbitrary names,
- migration must not hijack camera focus,
- edge travel should remain board-driven.

Acceptance ideas:

- entropy >= 0.25 first, then >= 0.50 stretch,
- no unprompted focus-zone events,
- no top-edge pushing regression,
- G0H zone visits still pass.

### 6. Cleanup / Flower / Food Reserve Ecology

Problem:

- Cleanup gradient is borderline.

Potential plan areas:

- better prioritization of dirt piles when enough flowers are available,
- avoid teleport-driven cleanup proof as the only confidence,
- make cleanup socially meaningful: caregiving/resource-control/status-expression can bias cleanup,
- food reserve behavior should matter in social/ecosystem pressure.

Acceptance ideas:

- cleanup gradient strictly below 0.50 in long-soak,
- organic cleanup floor scenario still green,
- no excessive flower stacking,
- food reserve state appears in inspect/feed when relevant.

### 7. ML Value and m7

Problem:

- m6 is not promotable due `signalChoice` and `autobattlePosture` regressions vs heuristic.

Potential plan areas:

- collect more corrected signalChoice and autobattlePosture records,
- balance corpus by policy family,
- create held-out organic cases not derived from the same fixtures,
- train m7 with no-regression gates,
- keep m4 default until m7 beats m4 and heuristic in all required families.

Acceptance ideas:

- signalChoice held-out >= heuristic,
- autobattlePosture held-out >= heuristic,
- m7 beats m4 on >= 4/5 and does not regress vs heuristic,
- value audit improves >= 4/6 without worsening top-edge or migration entropy.

### 8. Player-Facing "Why" and Inspectability

Problem:

- "Why This Moment" exists and passes audit, but the user ultimately needs to understand behavior without reading debug text.

Potential plan areas:

- improve concise inspect explanations,
- feed entries should reference real memory/state cause,
- social events should be visibly tied to movement/interaction,
- avoid over-explaining in normal UI.

Acceptance ideas:

- human capture reviewer can identify why at least 5 notable events happened,
- expression naturalness audit remains green,
- no feed spam or repetitive explanation templates.

## Proposed Next Implementation Ladder for Claude to Review

This is not final. It is a candidate ladder for Claude to refine.

```text
B0  Review current proof packet and confirm no hidden blocker
B1  Social partner diversity and repeat-loop pressure
B2  Organic affection exposure and witness opportunity
B3  Relationship arc dynamics: churn without noise
B4  Migration pressure and zone-use entropy
B5  Cleanup / flower / food-reserve ecology pressure
B6  ML corpus rebalance and m7 trainer/promotion gate
B7  Player-facing why/readability pass
B8  Long-soak + G0H rerun + human capture packet
```

Suggested order rationale:

- B1-B3 attack the biggest "not real society" problem directly.
- B4 addresses movement/ecology variety without reopening spatial foundations.
- B5 makes the world create reasons to cooperate.
- B6 improves real ML once better behavior targets exist.
- B7 makes the internal truth visible to the player.
- B8 proves it all in the harness and a human capture.

## Suggested Acceptance Targets for the Next Plan

These should be refined by Claude, not blindly copied:

```text
+-----------------------------+---------------------+------------------------+
| Metric                      | First Target        | Later Target           |
+-----------------------------+---------------------+------------------------+
| partner repetition          | <= 0.60             | <= 0.40                |
| witnessed affection rate    | >= 0.05/min         | >= 0.10/min            |
| bond churn                  | 0.25..2.0/min       | 0.5..4.0/min           |
| bond stability              | <= 0.33             | <= 0.30                |
| zone migration entropy      | >= 0.25             | >= 0.50                |
| cleanup gradient            | < 0.50              | < 0.35                 |
| expression repetition       | <= 0.05             | <= 0.03                |
| ML value metrics            | >= 4/6              | >= 5/6                 |
| G0H lanes                   | 13/13               | 13/13 plus new lanes   |
+-----------------------------+---------------------+------------------------+
```

## Constraints Claude Should Preserve

- Do not claim literal consciousness or subjective feeling.
- Do not wipe the player's real long-running save.
- Synthetic saves and deterministic scenarios are allowed and encouraged.
- Save schema should remain v5 unless Claude names a concrete additive migration need.
- Do not re-found the spatial/3D system unless a named contradiction proves the current board/projection contract is insufficient.
- Keep sun-court as Training Grounds; no ambient blocks there.
- Keep 1 block = 1 board unit = 1 support/stack unit.
- ML may score choices but must not own durable feelings, memories, bonds, or save truth.
- Existing cognition vocabulary is currently sufficient by evidence; Claude may propose expansion only if it names an exact insufficiency and a migration/proof plan.
- Do not promote m6; m4 remains default until a future candidate clears the gate.

## Files and Reports Claude Should Read

Primary state docs:

- `docs/AA8-HUMAN-CAPTURE-GATE-2026-05-02.md`
- `docs/G0H-EVIDENCE-LOCK-2026-05-02.md`
- `docs/ML-PROMOTION-DECISION-2026-05-02.md`
- `docs/CLAUDE-REVIEW-CODEX-REAL-AI-NEXT-PLAN-2026-05-02.md`
- `docs/CLAUDE-WHOLE-GAME-REVIEW-G0H-3D-AI-UI-SPRITE-NEXT-PLAN-2026-05-01.md`

Current proof reports:

- `qa_logs/g0h_scripted_playthrough/2026-05-02T23-16-58-153Z/report.json`
- `qa_logs/long_soak_society/2026-05-02T22-50-53-345Z/report.json`
- `qa_screenshots/r_expression_naturalness_audit/2026-05-02T23-08-25-482Z/report.json`
- `qa_screenshots/r_ui_parity_audit/2026-05-02T23-08-25-474Z/report.json`
- `qa_screenshots/r_hover_scroll_audit/2026-05-02T23-07-58-031Z/report.json`
- `qa_screenshots/ml_phase_m6_audit/2026-05-02T22-19-10-098Z/report.json`
- `qa_screenshots/ml_on_off_capture_audit/2026-05-02T22-22-27-665Z/report.json`
- `qa_screenshots/m6_policy_training/2026-05-02T22-09-27-675Z/m6-training-evaluation.json`

Important code areas:

- `systems/lifeSimSystem.js`
- `systems/communicationSystem.js`
- `systems/mlInferenceSystem.js`
- `systems/behaviorSystem.js`
- `systems/movementSystem.js`
- `systems/flowerManager.js` or relevant flower lifecycle owner if renamed
- `systems/structureSystem.js`
- `core/config.js`
- `ui/gameUI.js`
- `ui/dom/feedPanel.js`
- `ui/dom/debugPanel.js`
- `scripts/g0h/playthroughDriver.js`
- `scripts/g0h/evidenceAssertions.js`
- `scripts/g0h/societyMetrics.js`
- `scripts/run-long-soak-society-audit.js`
- `scripts/train-m6-garden-policy.js`
- `scripts/run-ml-phase-m6-audit.js`
- `scripts/run-ml-on-off-capture-audit.js`
- `scripts/scenario/scenarios/*.json`

## What Claude Should Produce

Claude should create a new reviewed plan document that includes:

1. An honest current-state verdict.
2. A ranked list of remaining blockers/gaps.
3. A decision on human capture now vs. next believability slice first.
4. A concrete phase ladder in exact implementation order.
5. Owned files and forbidden files for each phase.
6. Rollback flags where useful.
7. Proof commands and acceptance criteria for each phase.
8. Scenario/fixture additions required to prove behavior without waiting for random live runs.
9. ML corpus/training/promotion plan for the next candidate after m6.
10. A final singular copy-paste prompt for Codex that starts with the first phase only.

## Bottom Line

Papilionem is no longer blocked by the old harness, sprite, spatial, UI, or evidence issues. The next challenge is more interesting: make the already-wired life-sim systems produce varied, player-legible, self-sustaining social behavior over time, and make ML prove it improves those behaviors before it becomes default.

