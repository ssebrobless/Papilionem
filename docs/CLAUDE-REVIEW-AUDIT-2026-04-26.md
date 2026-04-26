# Claude Review Audit — 2026-04-26

## Purpose

This is a one-shot record of the goal-alignment review Claude performed on
`2026-04-26` against the Papilionem planning layer. It exists so a second
reviewer (e.g. Codex) can verify the review without re-deriving everything
from scratch.

This is **not** part of the canonical planning stack. It is a frozen audit
trail of what Claude did, why, and where to look to challenge it.

The canonical planning docs remain:

- [GAME-SUCCESS-CRITERIA.md](./GAME-SUCCESS-CRITERIA.md)
- [CURRENT-STATE-GAP-ASSESSMENT.md](./CURRENT-STATE-GAP-ASSESSMENT.md)
- [GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md](./GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md)
- [GOAL-ALIGNMENT-REVIEW-PACKET.md](./GOAL-ALIGNMENT-REVIEW-PACKET.md)
- [ACTIVE-PLAN-REGISTRY.md](./ACTIVE-PLAN-REGISTRY.md)

---

## Codex Review Prompt (Copy-Paste)

Copy everything between the `BEGIN PROMPT` and `END PROMPT` markers and
paste into Codex.

```text
============================ BEGIN PROMPT ============================

You are reviewing a goal-alignment review that another AI (Claude)
performed on the Papilionem butterfly-society life-sim's planning layer
on 2026-04-26.

The project lives at: C:\Users\fishe\Documents\projects\ephemera\

Claude's full audit record (reasoning, evidence, edits, sources) is at:
  docs/CLAUDE-REVIEW-AUDIT-2026-04-26.md

Read that file first. It points to everything else.

Hard invariants the project must preserve (do not let Claude's edits
violate any of these):
  - one-owner-per-truth across runtime, spatial, and social tracks
  - ML scores choices, never owns durable state (feelings, memories,
    bonds, lineage)
  - UI never owns truth
  - frozen child boards (v0-v8a, s0-s8, n0-n8) are never reopened
    without a named contradiction
  - long-running saves are sacred; no save wipes to simplify proof
  - success target = "believable butterfly society", NOT
    "indistinguishable from real humans"

Your task: read the audit doc, then read the 5 docs Claude edited and
the audit reports they reference. Decide:

  1. Is Claude's verdict ("structurally strong, calibration-mixed")
     well supported?
  2. Are Claude's modified findings defensible? Specifically:
     - runtime / visual quality downgraded from "mostly aligned" to
       "partially aligned"
     - dialogue (g5) early-start in Stage A based on f5/f6 evidence
     - ML value proof (g6) expanded to include cost-vs-value
     - acceptance bar (g0-bar) declared a one-time precondition
     - g4 ambient-observation early-start in Stage A
  3. Are there real findings Claude missed?
  4. Are any of Claude's edits over-reaching, sloppy, or do any of
     them violate the hard invariants above?
  5. Did Claude correctly distinguish acceptance gaps from
     implementation gaps from outside-evidence gaps?
  6. Are the audit data points Claude cites accurate? Spot-check at
     least one cited audit JSON.

Edited docs to review:
  - docs/GOAL-ALIGNMENT-REVIEW-PACKET.md (added "Claude Review
    Integration" section near the bottom)
  - docs/GAME-SUCCESS-CRITERIA.md (added "Acceptance Bar" section
    before "Final Rule")
  - docs/CURRENT-STATE-GAP-ASSESSMENT.md (status table downgrade for
    runtime; pillar 7 telemetry caveat; pillar 6 cost-vs-value
    sub-blocker)
  - docs/GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md (added g0-bar
    precondition; expanded g6; expanded parallel-safe shape with
    g4/g5 early-start)
  - docs/ACTIVE-PLAN-REGISTRY.md (added "Goal-Alignment Next Move"
    section)

Audit reports cited as evidence:
  - qa_screenshots/h5_long_running_save_smoothness_audit/
    2026-04-26T03-59-40-141Z/report.json
  - qa_screenshots/a6_live_dispersal_audit/
    2026-04-24T02-22-07-620Z/report.json
  - qa_screenshots/n6_neural_social_scoring_audit/
    2026-04-26T04-03-47-795Z/report.json
  - qa_screenshots/f5_f6_social_depth_audit/
    2026-04-26T17-01-36-382Z/report.json

Do NOT change docs. Write your conclusions back as a structured review
under these headings:
  - agree
  - partial agree (and why)
  - disagree (and why)
  - missing
  - recommendations

Reference specific docs and audit reports by path when challenging
Claude's reasoning. Cite the JSON field that supports your point.

============================= END PROMPT =============================
```

---

## Scope of the Review

Claude was asked to:

- pressure-test the success criteria, gap assessment, and g1→g8 ladder
- challenge (not agree with) the assumption that the game is no longer
  foundation-blocked but instead blocked by acceptance / breadth /
  closure gaps
- preserve hard invariants (see invariant list in the Codex prompt above)
- output an 8-part structured review (verdict, findings, per-pillar
  review, gap-assessment review, sequencing review, hidden/overstated
  blockers, refinement pass, revised ladder)
- propagate findings into the planning docs as targeted edits

Claude was NOT asked to change game code, runtime, configs, systems,
assets, scripts, or save behavior. Only docs under
`C:\Users\fishe\Documents\projects\ephemera\docs\` were edited.

---

## Sources Read

### Primary planning docs

- `docs/GAME-SUCCESS-CRITERIA.md` (full)
- `docs/CURRENT-STATE-GAP-ASSESSMENT.md` (full)
- `docs/GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md` (full)
- `docs/GOAL-ALIGNMENT-REVIEW-PACKET.md` (full)
- `docs/ACTIVE-PLAN-REGISTRY.md` (full)
- `docs/ACTIVE-COMPLETION-BOARD.md` (full)
- `docs/ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md` (full)
- `docs/ACTIVE-SPATIAL-UNIFICATION-BOARD.md` (full)
- `docs/ACTIVE-SOCIAL-COGNITION-BOARD.md` (full)
- `docs/ACTIVE-PUBLIC-SHARE-BOARD.md` (full)

### Shared contracts

- `docs/SAVE-SCHEMA-REGISTRY.md`
- `docs/SIM-CADENCE-CONTRACT.md`
- `docs/SPATIAL-UNIT-CONTRACT.md`
- `docs/SOCIAL-FAMILY-LOCK.md`
- `docs/DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md`
- `docs/COGNITION-ML-CONTRACT.md`
- `docs/CROSS-TRACK-ARBITRATION.md`

### Identity / context

- `docs/PAPILIONEM-GUIDEBOOK.md` (partial: first 500 lines)
- `docs/PAPILIONEM-PLAYER-GUIDE.md` (partial: first 300 lines)
- `docs/source-book/PAPILIONEM-SOURCE-BOOK.md` (TOC only, 200 lines —
  full file is ~24,660 lines)

### Historical / supporting audits

- `docs/V3-SPRITE-BAKING-AUDIT.md`
- `docs/V7-VISUAL-RESTORATION-AUDIT.md`
- `docs/SOCIAL-COGNITION-ROADMAP.md` (partial)
- `docs/SPATIAL-UNIFICATION-ROADMAP.md` (partial)
- `docs/SOCIAL-TRUTH-AUDIT.md`
- `docs/NEURAL-SOCIAL-SCORING-AUDIT.md`
- `docs/DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md`
- `docs/PAIR-CHEMISTRY-TEXTURE-AUDIT.md`
- `docs/BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md`
- `docs/SOCIAL-MOTIVE-REBALANCE-AUDIT.md`
- `docs/VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md` (partial)

### Audit reports spot-checked (JSON evidence)

- `qa_screenshots/a6_live_dispersal_audit/2026-04-24T02-22-07-620Z/report.json`
- `qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-26T03-59-40-141Z/report.json`
- `qa_screenshots/n6_neural_social_scoring_audit/2026-04-26T04-03-47-795Z/report.json`
- `qa_screenshots/f5_f6_social_depth_audit/2026-04-26T17-01-36-382Z/report.json`

---

## Spot-Check Evidence

The four audit JSONs above were the deciding evidence behind the
modified findings. Key data extracted from each:

### `h5_long_running_save_smoothness_audit` (2026-04-26T03-59-40-141Z)

```text
gate verdict: overall = "pass"
all 7 phases pass

underneath:
├─ pressureTier: "critical"
├─ runtimeIssueCount: 92 (all "cadence-budget-overrun")
├─ lagCategory: "simulation-dominant"
├─ peakHeapUsedMB: 159.26
├─ p50FrameMs: 21.30
├─ p95FrameMs: 31.90
├─ p99FrameMs: 37.80   (>2 frames at 60fps budget)
├─ maxUpdateMs: 58.60
├─ topUpdateContributors[0]:
│    foundation.mlCadenceIntervalFrames -> 37.27 ms
├─ duration: 30.7 seconds
└─ heapMilestones:
     tenSeconds:       populated
     sixtySeconds:     null
     tenMinutes:       null
     twentyMinutes:    null
     fortyMinutes:     null
```

Conclusion: passes the gate definition, but underneath shows the audit
is telling a story of critical-pressure simulation lag dominated by ML
cadence cost. The "long-running" label is not earned by a 30-second
audit. This drove the **runtime pillar downgrade** and the **g6
cost-vs-value clause**.

### `a6_live_dispersal_audit` (2026-04-24T02-22-07-620Z)

```text
gate verdict: overall = "warn"
all 3 movement steps pass

console:
└─ 56 identical "Canvas2D willReadFrequently" warnings per run

other:
├─ pageErrors: 0
├─ deferredOptimizationWarnings: 0
└─ summary.passingSteps: 3 / 3
```

Conclusion: dismissal as render-tooling noise is defensible (movement
correctness is intact); the warning *volume* is itself a real perf
footgun. Logged as a watchlist item, not a finding strong enough to
change pillar status.

### `n6_neural_social_scoring_audit` (2026-04-26T04-03-47-795Z)

```text
gate verdict: overall = "pass"
all 5 phases pass

phases:
├─ 00 feature contract expanded
├─ 01 clique-comfort raises social targeting
├─ 02 devoted-seek lifts approach + butterfly targeting
├─ 03 strained-avoid lifts avoidance
└─ 04 protective-warning weights signal choice

console errors: 0
```

Conclusion: clean evidence the scorer responds correctly to social
context, but only across 4 hand-crafted scenarios. Does not prove
free-play value. This **confirmed** the gap doc's existing self-criticism
and supports the **cost-vs-value expansion** of g6.

### `f5_f6_social_depth_audit` (2026-04-26T17-01-36-382Z)

```text
gate verdict: overall = "pass"
all 4 phases pass:
├─ 01 threaded exchange feed
├─ 02 casual subtype selection
├─ 03 pair texture accumulation
└─ 04 life-sim follow-through

mechanically clean: trust 82->85, comfort 86->90, attachment surfaces

dialogue text inside the audit:
├─ "That was a good read, and I do not want to let it pass unnamed;
│   you carried that moment with more grace than you know."
├─ "We do not have to fill every quiet moment; this part of the quiet
│   ground is easier to hold when you are beside me; it feels steady
│   like this."
└─ "Fly with me for a while; I like the way you move through this
    quiet ground; we move well together here."
```

Conclusion: passes structurally, but the dialogue text itself reads
system-authored — verbose, semicolon-heavy, abstract. The dialogue
naturalness gap is **already actionable from the audit's own evidence**.
This drove the **g5 early-start in Stage A** finding.

---

## 8-Part Structured Review

### Part 1 — Overall Verdict

**Structurally strong, calibration-mixed.**

The five-layer success stack (mechanical / visual / behavioral /
persistence / runtime) is the right framework. The diagnosis "no longer
foundation-blocked, now blocked by acceptance + breadth + closure" is
broadly correct. The g1→g8 ladder is in the right order at the macro
level, and the non-negotiables protect the things that need protecting.

Two pillars are graded more generously than the underlying evidence
supports, the dialogue gap is more actionable than the plan treats it,
and the central acceptance bar — "lived-in" / "long free play" — is
referenced in every Stage A/B step without ever being defined.

### Part 2 — Findings (severity / confidence)

| #  | Finding | Severity | Confidence |
|----|---------|----------|------------|
| F1 | Runtime status overstated. h5 reports `pressureTier=critical`, 92 cadence-budget overruns in 30s, `foundation.mlCadenceIntervalFrames` top contributor at 37.27ms. | High   | High |
| F2 | h5 audit duration (30s) does not match label "long-running save smoothness." Heap milestones beyond `tenSeconds` all null. | Medium | High |
| F3 | Dialogue naturalness gap is already visible inside f5/f6 audit text. g5 has actionable evidence today. | High   | High |
| F4 | Stage A→B→C order delays social discovery by ~3 phases. The parallel-safe shape allows overlap, but the registry's "next move" focuses only on g1-g3. | Medium | Medium |
| F5 | "Lived-in acceptance" / "long free play" / "ordinary play" appear as closure language for g1-g5 with no defined duration / observer / signoff format. The acceptance bar is itself a hidden gap. | High   | High |
| F6 | a6 `warn` dismissal as canvas-readback noise is defensible, but 56 identical `willReadFrequently` warnings per run is a real perf footgun. | Low    | High |
| F7 | g6 ML value proof is framed only as "does it help feel?" — does not include runtime-cost-vs-value tradeoff. | Medium | Medium |
| F8 | Frozen-board reopening discipline holds. No findings against it. | —      | High |
| F9 | The five-layer stack and one-owner-per-truth invariant are correctly preserved across all child boards. No findings against them. | —      | High |

### Part 3 — Per-Pillar Success-Criteria Review

| Pillar | Calibration | Note |
|--------|-------------|------|
| 1. Spatial / Pseudo-3D | correct | remaining gap is acceptance, not contract |
| 2. Blocks / Flowers / Building | mostly correct | "autonomous building behavior" criterion not yet operationalized |
| 3. Movement / Travel | correct | "naturalness" needs g0-bar definition |
| 4. Social Relationships / Emotion | correct | "believable society, not human-equivalent" target is right |
| 5. Dialogue / Conversation | correct | gap is already measurable today (F3) |
| 6. Neural / Scoring | incomplete | should include "ML cost is justified by its value" |
| 7. Runtime / Visual Quality | criterion right, evidence overstated | F1, F2 |
| 8. Persistence / Continuity | correct | gap is genuinely outside-evidence + v8b |

### Part 4 — Gap Assessment Review

The pillar-by-pillar reads are mostly accurate. Two recalibrations:

1. **Runtime / Visual Quality**: change `mostly aligned` →
   `partially aligned` until h5 is re-run on a duration that earns the
   "long-running" label and ML cadence cost is either reduced or
   justified by g6.
2. **Neural / Scoring**: keep `partially aligned`, but add a concrete
   sub-blocker — "ML cadence is the top update contributor; its cost
   is not yet justified by its value."

Everything else in the gap doc reads honestly.

### Part 5 — Sequencing Review

Macro order Stage A → B → C is sound. Intra-stage parallel shape exists
in the plan but is not used by the registry's "next move."

```
Stage A starts now
├─ g1 spatial acceptance sweep
├─ g2 live building behavior proof
└─ g3 movement naturalness acceptance

In parallel with Stage A
├─ g4-observation: begin ambient social observation now
└─ g5-style: begin dialogue style cleanup now (evidence in f5/f6)

After Stage A closes
├─ g4 ambient social breadth (formal close)
├─ g5 dialogue naturalness (formal close)
└─ g6 ML value proof (must include cost-vs-value)

Stage C unchanged
├─ g7 v8b full-stack migrated-save proof
└─ g8 outside-session closure + public alpha freeze
```

### Part 6 — Hidden / Overstated Blockers

**Hidden:**
- ML cadence cost as a runtime risk (currently invisible in pillar 7).
- The acceptance bar itself — duration / observer / signoff format —
  is undefined for g1-g5.
- Canvas2D `willReadFrequently` perf footgun (56 warnings per run).

**Overstated:**
- Runtime "mostly aligned" given h5's `pressureTier=critical` and 92
  cadence-budget overruns.
- "Long-running save smoothness audit" labeling given 30s duration.

**Correctly identified:**
- Social/dialogue breadth.
- v8b full-stack closure.
- Outside-session evidence.
- Autonomous building behavior under-proof.

### Part 7 — Refinement Pass

Add:

- **Acceptance Bar** in `GAME-SUCCESS-CRITERIA.md`: lived-in sessions
  = ≥20 minutes free play / single observer / lived-in entry save /
  written signoff against a per-step rubric.
- **Runtime caveat** in `CURRENT-STATE-GAP-ASSESSMENT.md` pillar 7:
  h5 currently passes its gate but reports critical pressure tier and
  92 cadence-budget overruns; runtime closer to *partially aligned*.
- **g6 cost-vs-value clause** in `GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md`:
  ML value proof must compare ML-on/off both for behavioral improvement
  AND update-cost justification.
- **g4 / g5 early-start** in `ACTIVE-PLAN-REGISTRY.md`: ambient social
  observation and dialogue-style cleanup may run in parallel with
  Stage A.

### Part 8 — Revised Ladder

The ladder remains g1→g8. Revisions:

- g1 / g2 / g3 unchanged.
- **g4** unchanged but **may begin observation in Stage A**.
- **g5** unchanged but **may begin style cleanup in Stage A** (evidence
  already in hand).
- **g6** revised to include ML cost-vs-value, not only behavioral
  coherence.
- g7 / g8 unchanged.
- New cross-cutting: **g0-bar** (acceptance-bar definition) is a
  one-time precondition for closing any of g1-g5.

---

## Doc Edits Applied

Five docs edited. Frozen child boards (`v0-v8a`, `s0-s8`, `n0-n8`) were
**not** reopened. No code, configs, assets, scripts, or save behavior
were touched.

### 1. `docs/GOAL-ALIGNMENT-REVIEW-PACKET.md`

Added new section after `## Bottom Line`:

```
## Claude Review Integration
├─ Review Verdict
├─ Overall Strength (strong / mixed / weak)
├─ Key Accepted Findings
├─ Key Modified Findings
├─ Key Rejected Findings
├─ Spot-Check Notes
└─ Effect On Other Docs
```

### 2. `docs/GAME-SUCCESS-CRITERIA.md`

Added new section before `## Final Rule`:

```
## Acceptance Bar
├─ session shape (duration, observer, entry-state, closure format)
├─ per-step rubric requirements (g1, g2, g3, g4, g5, g6)
├─ why this bar exists
└─ declared as g0-bar one-time precondition for closing g1-g5
```

### 3. `docs/CURRENT-STATE-GAP-ASSESSMENT.md`

Three changes:

- Top status table: runtime / visual quality `mostly aligned`
  → `partially aligned`, with note pointing to the 2026-04-26 review.
- Pillar 7 (runtime / visual quality) expanded with h5 telemetry
  caveats: pressureTier, runtimeIssueCount, lagCategory, peak heap,
  p99 frame, ML cadence as top update contributor, 30-second duration,
  null heap milestones.
- Pillar 6 (neural / scoring) expanded with cost-vs-value sub-blocker
  citing the same h5 ML cadence cost.

### 4. `docs/GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md`

Three changes:

- Added `## g0-bar Precondition` section after non-negotiables.
- Expanded `g6 ML value proof` goal / outputs / close-when to include
  cost-vs-value reconciliation (cadence cost vs. coherence delta).
- Expanded `## Parallel-Safe Shape` to surface `g4-observation` and
  `g5-style` early-start in Stage A, with rationale.

### 5. `docs/ACTIVE-PLAN-REGISTRY.md`

Added new section after `## Current Truth`:

```
## Goal-Alignment Next Move
├─ start now (Stage A)
├─ run in parallel with Stage A (g4-observation, g5-style)
├─ precondition (g0-bar)
└─ why-early-start rationale
```

---

## Memory Updates

One project memory saved (auto-memory system, persists across
conversations):

- `C:\Users\fishe\.claude\projects\C--Users-fishe-Documents-projects\memory\project_papilionem.md`

Captures: planning-doc-driven discipline, frozen-board policy, hard
invariants, success-target calibration ("believable butterfly society",
not human-equivalence), audit-citation gotcha (`overall=pass` does not
always tell the full story — check pressureTier, runtimeIssueCount,
topUpdateContributors, audit duration before trusting the gate result).

---

## How To Verify Without Re-deriving

For each finding:

1. Read the relevant pillar in `GAME-SUCCESS-CRITERIA.md` /
   `CURRENT-STATE-GAP-ASSESSMENT.md`.
2. Read the related child board (e.g. `ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md`
   for runtime claims).
3. Read the cited audit JSON. Check the JSON fields named in the
   spot-check section above.
4. Decide whether the finding overstates, understates, or correctly
   names the gap.

For each doc edit:

1. Read the edited file at the path listed above.
2. Check whether the edit reuses existing terminology consistently and
   whether it introduces any contradictions with frozen contracts
   (`SPATIAL-UNIT-CONTRACT.md`, `SOCIAL-FAMILY-LOCK.md`,
   `COGNITION-ML-CONTRACT.md`, `SAVE-SCHEMA-REGISTRY.md`,
   `SIM-CADENCE-CONTRACT.md`).
3. Confirm no frozen child board was reopened.

For invariant compliance:

1. Verify no edit grants ML ownership of durable state.
2. Verify no edit grants UI ownership of truth.
3. Verify no edit calls for save wipes or schema breakage.
4. Verify success-target language has not drifted toward
   human-equivalence.

---

## Rejected Findings (Things Claude Considered But Did Not Surface)

For completeness, things Claude examined but did **not** turn into
findings:

- The `v8a` packet's "freeze suspects: 4 in battle lane" being a
  watch-only carry-forward to v8b — the existing plan absorbs this
  correctly; not a finding.
- Reopening any of `s0-s8`, `n0-n8`, or `v0-v8a` — no named
  contradiction surfaced; not a finding.
- Reopening the spatial unit contract, doorway/corridor model, or
  save schema — no named contradiction; not a finding.
- Changing the success-target calibration from "believable butterfly
  society" to anything else — the calibration is correct; not a
  finding.

---

## Bottom Line

```text
verdict
├─ structurally strong, calibration-mixed
├─ macro g1-g8 ladder is sound
├─ runtime and dialogue pillars are graded too kindly given evidence
├─ acceptance bar must be defined before Stage A/B closures land honestly
├─ ML cadence cost must be reconciled in g6, not only "value"
└─ frozen-board discipline is correctly preserved
```
