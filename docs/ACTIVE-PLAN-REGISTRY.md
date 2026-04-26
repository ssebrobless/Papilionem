# Papilionem Active Plan Registry

## Purpose

This is the single index for the plans that are still meaningfully in play.

Use it to answer:

```text
which plans are active?
which are supporting?
which are frozen history?
which doc is the source of truth for each one?
```

## Program Shape

```text
╔══════════════════════════════ Papilionem Active Plan Stack ══════════════════════════════╗
║ release-facing parent track                                                             ║
║ └─ public-share readiness                                                               ║
║    ├─ runtime/smoothness child track      -> visual-first runtime optimization          ║
║    ├─ geometry/unit child track           -> spatial unification                        ║
║    ├─ society/feeling child track         -> social-cognition depth                     ║
║    ├─ tester intake + evidence docs       -> playtest matrix / triage / feedback       ║
║    └─ frozen local precursor boards       -> follow-up + old runtime hardening          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════╝
```

## Active Plans

| Track | Status | Role | Source of truth | Companion docs |
| --- | --- | --- | --- | --- |
| `completion board` | `active coordinator` | coordinates the exact remaining closure order across runtime, spatial, social, and public-share work | [ACTIVE-COMPLETION-BOARD.md](./ACTIVE-COMPLETION-BOARD.md) | [ACTIVE-PUBLIC-SHARE-BOARD.md](./ACTIVE-PUBLIC-SHARE-BOARD.md), [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md), [ACTIVE-SPATIAL-UNIFICATION-BOARD.md](./ACTIVE-SPATIAL-UNIFICATION-BOARD.md), [ACTIVE-SOCIAL-COGNITION-BOARD.md](./ACTIVE-SOCIAL-COGNITION-BOARD.md) |
| `public-share readiness` | `active parent` | governs launch quality, onboarding, outside testing, and public-alpha freeze | [ACTIVE-PUBLIC-SHARE-BOARD.md](./ACTIVE-PUBLIC-SHARE-BOARD.md) | [PUBLIC-SHARE-READINESS-ROADMAP.md](./PUBLIC-SHARE-READINESS-ROADMAP.md), [EXTERNAL-PLAYTEST-MATRIX.md](./EXTERNAL-PLAYTEST-MATRIX.md), [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md), [../PLAYTEST.md](../PLAYTEST.md), [../PLAYTEST-FEEDBACK.md](../PLAYTEST-FEEDBACK.md) |
| `visual-first runtime optimization` | `active child` | solves lag/freezing/smoothness without sacrificing visuals or core systems | [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md) | [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN.md), [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md), [BASELINE.md](./BASELINE.md), [V0-5-FREE-WINS-AUDIT.md](./V0-5-FREE-WINS-AUDIT.md), [V1-SHELL-UI-SEPARATION-AUDIT.md](./V1-SHELL-UI-SEPARATION-AUDIT.md), [V2-MEMORY-GROWTH-AUDIT.md](./V2-MEMORY-GROWTH-AUDIT.md), [SPRITE-CACHE-CONTRACT.md](./SPRITE-CACHE-CONTRACT.md), [V3-SPRITE-BAKING-AUDIT.md](./V3-SPRITE-BAKING-AUDIT.md), [V4-SIM-CADENCE-AUDIT.md](./V4-SIM-CADENCE-AUDIT.md), [V5-COMPOSITE-REDUCTION-AUDIT.md](./V5-COMPOSITE-REDUCTION-AUDIT.md), [V6-WORKER-OFFLOAD-AUDIT.md](./V6-WORKER-OFFLOAD-AUDIT.md), [V7-VISUAL-RESTORATION-AUDIT.md](./V7-VISUAL-RESTORATION-AUDIT.md) |
| `spatial unification` | `live child` | unifies board bounds, one-block-to-one-unit truth, doorway corridors, footprints, occupancy, interaction-space behavior, and save normalization | [ACTIVE-SPATIAL-UNIFICATION-BOARD.md](./ACTIVE-SPATIAL-UNIFICATION-BOARD.md) | [SPATIAL-UNIFICATION-ROADMAP.md](./SPATIAL-UNIFICATION-ROADMAP.md), [CURRENT-SPATIAL-TRUTH.md](./CURRENT-SPATIAL-TRUTH.md), [SPATIAL-UNIT-CONTRACT.md](./SPATIAL-UNIT-CONTRACT.md), [SPATIAL-BOUNDARY-EXPANSION-AUDIT.md](./SPATIAL-BOUNDARY-EXPANSION-AUDIT.md), [DOORWAY-CORRIDOR-ALIGNMENT-AUDIT.md](./DOORWAY-CORRIDOR-ALIGNMENT-AUDIT.md), [ENTITY-FOOTPRINT-UNIFICATION-AUDIT.md](./ENTITY-FOOTPRINT-UNIFICATION-AUDIT.md), [BLOCK-PLACEMENT-SUPPORT-UNIFICATION-AUDIT.md](./BLOCK-PLACEMENT-SUPPORT-UNIFICATION-AUDIT.md), [SHARED-INTERACTION-SPACE-RECONCILIATION-AUDIT.md](./SHARED-INTERACTION-SPACE-RECONCILIATION-AUDIT.md), [SPATIAL-SAVE-MIGRATION-AUDIT.md](./SPATIAL-SAVE-MIGRATION-AUDIT.md) |
| `social-cognition depth` | `live child` | deepens feelings, relationships, butterfly society behavior, and neural social scoring so the simulation reads as emotionally alive instead of mostly functional warning loops | [ACTIVE-SOCIAL-COGNITION-BOARD.md](./ACTIVE-SOCIAL-COGNITION-BOARD.md) | [SOCIAL-COGNITION-ROADMAP.md](./SOCIAL-COGNITION-ROADMAP.md), [SOCIAL-TRUTH-AUDIT.md](./SOCIAL-TRUTH-AUDIT.md), [SOCIAL-MEASUREMENT-HARNESS.md](./SOCIAL-MEASUREMENT-HARNESS.md), [SOCIAL-FAMILY-LOCK.md](./SOCIAL-FAMILY-LOCK.md), [SOCIAL-MOTIVE-REBALANCE-AUDIT.md](./SOCIAL-MOTIVE-REBALANCE-AUDIT.md), [PAIR-CHEMISTRY-TEXTURE-AUDIT.md](./PAIR-CHEMISTRY-TEXTURE-AUDIT.md), [BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md](./BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md), [DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md](./DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md), [NEURAL-SOCIAL-SCORING-AUDIT.md](./NEURAL-SOCIAL-SCORING-AUDIT.md), [SOCIAL-SAVE-CONTINUITY-AUDIT.md](./SOCIAL-SAVE-CONTINUITY-AUDIT.md), [DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md](./DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md), [COGNITION-ML-CONTRACT.md](./COGNITION-ML-CONTRACT.md) |

## Goal Alignment Companions

```text
goal-alignment companion set
├─ GAME-SUCCESS-CRITERIA.md
├─ CURRENT-STATE-GAP-ASSESSMENT.md
├─ GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md
└─ GOAL-ALIGNMENT-REVIEW-PACKET.md
```

Use these when the question is not "which historical phase landed?" but:

```text
what does success actually mean now?
what still does not line up with that target?
what should reopen next, if anything?
```

## Shared Contracts

```text
shared contracts
|- SAVE-SCHEMA-REGISTRY.md
|- SIM-CADENCE-CONTRACT.md
|- spatial-unit contract (`s1`)
|- social-family lock (`n1`)
|- CROSS-TRACK-ARBITRATION.md
`- COGNITION-ML-CONTRACT.md
```

| Contract | Purpose |
| --- | --- |
| [SAVE-SCHEMA-REGISTRY.md](./SAVE-SCHEMA-REGISTRY.md) | canonical save field families, protected-state groups, and the shared `schemaVersion` used jointly by runtime `v7`, spatial `s7`, and social `n8` |
| [SIM-CADENCE-CONTRACT.md](./SIM-CADENCE-CONTRACT.md) | co-owned cadence boundary between runtime `v4` and social `n1` |
| [SPATIAL-UNIT-CONTRACT.md](./SPATIAL-UNIT-CONTRACT.md) | canonical `s1` lock for `1 block = 1 board unit = 1 support/stack unit`, with later adoption sequenced in [SPATIAL-UNIFICATION-ROADMAP.md](./SPATIAL-UNIFICATION-ROADMAP.md) |
| [SOCIAL-FAMILY-LOCK.md](./SOCIAL-FAMILY-LOCK.md) | canonical `n1` lock for feeling, pair-chemistry, society, and motive families, with the detailed sequence preserved in [SOCIAL-COGNITION-ROADMAP.md](./SOCIAL-COGNITION-ROADMAP.md) |
| [CROSS-TRACK-ARBITRATION.md](./CROSS-TRACK-ARBITRATION.md) | contested-file owner table and merge-time tie-breaker |
| [COGNITION-ML-CONTRACT.md](./COGNITION-ML-CONTRACT.md) | ML boundary rules, including the later P6 audit requirement |

## Cross-Track Gates

| Gate | Requires | Recorded status |
| --- | --- | --- |
| `v0 baseline` | geometry-freeze commitment (`P2`) | `satisfied: geometry was not frozen through v0-v3; spatial s3 is live, and both the quick plus full-duration post-s3 recaptures are now on disk` |
| `v4 cadence` | social `n1` family lock + [SIM-CADENCE-CONTRACT.md](./SIM-CADENCE-CONTRACT.md) | `satisfied locally: n1 is frozen live, the shared cadence contract is signed, and v4 is now banked as the retained 18/36/30 slice` |
| `v5 composite` | spatial `s3` doorway corridor alignment | `satisfied locally; runtime v5 may now consume the live corridor geometry` |
| `v7 / s7 / n8` | [SAVE-SCHEMA-REGISTRY.md](./SAVE-SCHEMA-REGISTRY.md) signed off jointly | `satisfied locally: schemaVersion 4 is now the explicit shared signoff for runtime v7, spatial s7, and social n8` |
| `v8 split` | `v8a runtime-only proof` + `v8b full-stack proof` | `partially satisfied: v8a is frozen live; v8b stays gated behind c9 / r4 outside-session triage` |

## Review-Gate Rubric

| Gate | Source of truth | Current status |
| --- | --- | --- |
| `runtime review-gate rubric` | [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md) | `closed locally: shared contracts are in place, v0.5 is closed with default-off regressors, and the canonical post-s3 full-duration baseline is frozen in BASELINE.md` |

## How They Relate

```text
ACTIVE-COMPLETION-BOARD
├─ asks: what exact order closes every remaining active track?
│
ACTIVE-PUBLIC-SHARE-BOARD
├─ asks: can we hand the game to more people safely?
│
├─ ACTIVE-VISUAL-FIRST-RUNTIME-BOARD
│  └─ answers: can the game run smoothly at the visual quality we want?
│
├─ ACTIVE-SPATIAL-UNIFICATION-BOARD
│  └─ answers: do bounds, units, doorways, blocks, and entity footprints share one spatial truth?
│
└─ ACTIVE-SOCIAL-COGNITION-BOARD
   └─ answers: do butterflies actually feel like a society with emotions, chemistry, and memory?
```

## Exact Reading Order

### If you need the big picture

1. [ACTIVE-PLAN-REGISTRY.md](./ACTIVE-PLAN-REGISTRY.md)
2. [ACTIVE-COMPLETION-BOARD.md](./ACTIVE-COMPLETION-BOARD.md)
3. [ACTIVE-PUBLIC-SHARE-BOARD.md](./ACTIVE-PUBLIC-SHARE-BOARD.md)
4. [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md)
5. [ACTIVE-SPATIAL-UNIFICATION-BOARD.md](./ACTIVE-SPATIAL-UNIFICATION-BOARD.md)
6. [ACTIVE-SOCIAL-COGNITION-BOARD.md](./ACTIVE-SOCIAL-COGNITION-BOARD.md)

### If you are working on lag/freezing first

1. [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md)
2. [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md)
3. [BASELINE.md](./BASELINE.md)
4. [V0-5-FREE-WINS-AUDIT.md](./V0-5-FREE-WINS-AUDIT.md)
5. [V1-SHELL-UI-SEPARATION-AUDIT.md](./V1-SHELL-UI-SEPARATION-AUDIT.md)
6. [V2-MEMORY-GROWTH-AUDIT.md](./V2-MEMORY-GROWTH-AUDIT.md)

### If you are working on movement/bounds/3D consistency first

1. [ACTIVE-SPATIAL-UNIFICATION-BOARD.md](./ACTIVE-SPATIAL-UNIFICATION-BOARD.md)
2. [SPATIAL-UNIFICATION-ROADMAP.md](./SPATIAL-UNIFICATION-ROADMAP.md)
3. [CURRENT-SPATIAL-TRUTH.md](./CURRENT-SPATIAL-TRUTH.md)

### If you are working on feelings / society / conversation depth first

1. [ACTIVE-SOCIAL-COGNITION-BOARD.md](./ACTIVE-SOCIAL-COGNITION-BOARD.md)
2. [SOCIAL-COGNITION-ROADMAP.md](./SOCIAL-COGNITION-ROADMAP.md)
3. [SOCIAL-MEASUREMENT-HARNESS.md](./SOCIAL-MEASUREMENT-HARNESS.md)
4. [BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md](./BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md)
5. [DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md](./DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md)
6. [NEURAL-SOCIAL-SCORING-AUDIT.md](./NEURAL-SOCIAL-SCORING-AUDIT.md)
7. [DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md](./DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md)
8. [COGNITION-ML-CONTRACT.md](./COGNITION-ML-CONTRACT.md)

## Supporting Evidence Docs

```text
evidence + intake
├─ EXTERNAL-PLAYTEST-MATRIX.md
├─ PLAYTEST-TRIAGE-LOG.md
├─ PLAYTEST.md
└─ PLAYTEST-FEEDBACK.md
```

These are not separate implementation plans.
They support the active boards by capturing:

- where testing is supposed to happen
- what players found
- what still blocks wider sharing

## Historical But Still Useful

```text
historical boards
├─ ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md
│  └─ local issue ladder that fed into the runtime/share tracks
├─ ACTIVE-RUNTIME-HARDENING-BOARD.md
│  └─ older runtime repair ladder, now superseded
├─ ACTIVE-IMPLEMENTATION-BOARD.md
│  └─ frozen implementation closure board
└─ ACTIVE-EXPANSION-BOARD.md
   └─ frozen expansion closure board
```

These should be treated as:

```text
reference / proof history
not the current implementation queue
```

## Current Truth

```text
do not lose this distinction
├─ completion board        = exact remaining closure ladder
├─ public-share board      = release-facing parent program
├─ visual-first board      = runtime/smoothness child program
├─ spatial board           = board/unit/occupancy child program
├─ social board            = feelings/society/neural-social child program
└─ older boards            = frozen context, not active sequencing
```

## Goal-Alignment Next Move

Updated by the `2026-04-26` Claude Review.

```text
start now (Stage A acceptance closure)
├─ g1 spatial acceptance sweep
├─ g2 live building behavior proof
└─ g3 movement naturalness acceptance

run in parallel with Stage A (prep-only early-start)
├─ g4-observation: begin ambient social observation now
│   └─ evidence gathering only; formal close still waits for Stage B
└─ g5-style: begin dialogue style cleanup now
    └─ prep-only style work; formal close still waits for Stage B

precondition (one-time)
└─ g0-bar: adopt the acceptance-bar definition in
   GAME-SUCCESS-CRITERIA.md before closing any of g1-g5
```

Why early-start g4 and g5:

- g4 needs accumulated free-play observation; starting in Stage A means
  the social breadth read does not start from zero when Stage A closes
- g5 has actionable text-style evidence today (f5/f6 audit lines read as
  system-authored); cleanup does not need to wait for Stage B
- the parallel-safe shape in
  [GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md](./GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md#parallel-safe-shape)
  already permits this; this section surfaces it as the active next move


## Recommended Next Review Hand-Off

If you want Claude to review the active planning layer before implementation,
give it this exact set first:

1. [ACTIVE-PLAN-REGISTRY.md](./ACTIVE-PLAN-REGISTRY.md)
2. [ACTIVE-COMPLETION-BOARD.md](./ACTIVE-COMPLETION-BOARD.md)
3. [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md)
4. [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md)
5. [ACTIVE-SPATIAL-UNIFICATION-BOARD.md](./ACTIVE-SPATIAL-UNIFICATION-BOARD.md)
6. [SPATIAL-UNIFICATION-ROADMAP.md](./SPATIAL-UNIFICATION-ROADMAP.md)
7. [ACTIVE-SOCIAL-COGNITION-BOARD.md](./ACTIVE-SOCIAL-COGNITION-BOARD.md)
8. [SOCIAL-COGNITION-ROADMAP.md](./SOCIAL-COGNITION-ROADMAP.md)

That gives one map plus the three active issue-resolution tracks.
