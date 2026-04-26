# Papilionem Active Expansion Board

## Purpose

This board now preserves the completed expansion implementation path that landed
beyond the frozen repair, polish, and `I1`-`I5` implementation baseline.

Read this together with:

- [REMAINING-IMPLEMENTATION-ROADMAP.md](./REMAINING-IMPLEMENTATION-ROADMAP.md)
- [EXPANSION-EXECUTION-PLAYBOOK.md](./EXPANSION-EXECUTION-PLAYBOOK.md)
- [INTENT-AND-EXCLUSIONS-LEDGER.md](./INTENT-AND-EXCLUSIONS-LEDGER.md)
- [CURRENT-SPATIAL-TRUTH.md](./CURRENT-SPATIAL-TRUTH.md)
- [LATER-3D-PHYSICS-IMPLEMENTATION-PLAN.md](./LATER-3D-PHYSICS-IMPLEMENTATION-PLAN.md)
- [COGNITION-ML-CONTRACT.md](./COGNITION-ML-CONTRACT.md)
- [ML-IMPLEMENTATION-CONTRACT.md](./ML-IMPLEMENTATION-CONTRACT.md)

This board is now frozen against the live expansion baseline.

No active expansion phase remains on this board.

It also remains the authoritative executed ladder for this expansion track.
Older local ladders such as `P1`-`P6` in the later 3-D plan and `M1`-`M5` in
the ML contract should be read as contract-local context and boundary maps.

## Current Expansion Shape

```text
+=================================================================================+
| Future Expansion Shape                                                          |
+=================================================================================+
| 1A ecology depth                        | a1-a6 live                             |
| 2B later 3-D                           | b1-b7 live                             |
| 3C machine learning                    | c1-c7 live                              |
+=================================================================================+
```

```text
executed promotion order

c1
|
v
a1 -> a2 -> a3
            |
            v
b1 -> b2 -> b3
            |
            v
a4 -> a5 -> a6
            |
            v
b4 -> b5 -> b6 -> b7
                  |
                  +--> rerun a6 ecology soak on the later 3-D baseline
                  |
                  v
c2 -> c3 -> c4 -> c5 -> c6 -> c7
```

## Status Key

```text
active
|- next phase to implement

parallel-safe
|- can land early without reopening the main baseline

queued
|- intentionally sequenced later in the same track

gated
`- may not start until the named dependency phases land cleanly
```

## Cross-Track Invariants

```text
always preserve
|- one owner per truth
|- frozen repair/polish/runtime baselines stay green while future phases land
|- if durable state widens, save migration and round-trip proof land in the same phase
|- ecology depth must not reintroduce the old rarity unlock ladder
|- later 3-D must not create a second world border or a full physics sandbox
|- performance budgets must be defined before hot-loop systems broaden materially
|- ML may score actions, but may not own memories, emotions, genetics, or lifecycle truth
`- player-facing shell and debug shell must stay honest about which layer is live
```

## 1A - Ecology Depth

```text
track goal
|- deepen the living garden on the current pseudo-3D baseline first
|- make zones feel distinct over long horizons, not just by labels
|- make migration, release, and habitat pressure visible in behavior
`- keep the current wild ecology contract as the ownership floor
```

### Phase Ladder

| Phase | Status | Goal | Primary owners | Proof gate |
| --- | --- | --- | --- | --- |
| `a1 zone signatures + pressure state` | `live` | add explicit zone budgets for food, shelter, crowding, migration pull, and social/training valence | `zoneSystem.js`, `gameCore.js`, `lifeSimSystem.js`, `ui/gameUI.js`, `scripts/` | `run-a3-zone-identity-audit.js`, `run-w3-flower-ecology-audit.js`, `run-r4-ui-readability-audit.js`, and `run-runtime-self-audit.js` stay green |
| `a2 flower + habitat resource loop` | `live` | turn flowers into renewable local resources with depletion, recovery, habitat quality effects, and a minimum population-health floor | `zoneSystem.js`, `gameCore.js`, `lifeSimSystem.js`, `scripts/` | `run-w3-flower-ecology-audit.js`, `run-long-soak-generational-audit.js`, `run-a3-zone-identity-audit.js`, `run-r4-ui-readability-audit.js`, and `run-runtime-self-audit.js` stay green |
| `a3 migration + home-range personality` | `live` | give butterflies long-horizon place preference, scouting, mate-seeking, and overcrowding dispersal motives | `core/entity.js`, `systems/lifeSimSystem.js`, `core/gameCore.js`, `ui/gameUI.js`, `scripts/` | `run-a6-live-dispersal-audit.js`, `run-a3-zone-identity-audit.js`, `run-w2-wild-ecology-audit.js`, `run-r4-ui-readability-audit.js`, and `run-runtime-self-audit.js` stay green |
| `a4 social-ecology emergence` | `live` | make roosting, warning cascades, shelter seeking, teaching pockets, and courtship territories appear as zone rhythms once `b3` shelter truth is stable | `lifeSimSystem.js`, `communicationSystem.js`, `behaviorSystem.js`, `sleepSystem.js`, `saveSystem.js` | `run-e4-social-ecology-audit.js`, `run-lifesim-expression-audit.js`, `run-r6-communication-audit.js`, `run-r4-ui-readability-audit.js`, `run-w2-wild-ecology-audit.js`, serial `run-a4-spatial-truth-audit.js`, and `run-runtime-self-audit.js` stay green |
| `a5 release + lineage ecology feedback` | `live` | make release pressure reshape future wild cohorts visibly through lineage, familiarity, zone affinity summaries, batch/cohort shell proof, and mild preferred-zone shaping without creating a dominant progression strategy | `progressionManager.js`, `statProfileSystem.js`, `lifeSimSystem.js`, `ui/gameUI.js`, `saveSystem.js` | `run-w2-wild-ecology-audit.js`, `run-genetics-mutation-audit.js`, `run-r4-ui-readability-audit.js`, `run-a6-live-dispersal-audit.js`, and `run-runtime-self-audit.js` stay green while the anti-progression check holds |
| `a6 long-soak ecology proof` | `live` | freeze ecology depth with multi-generation soak coverage, doc alignment, and debug summaries | `scripts/`, `telemetrySystem.js`, `docs/` | `run-e6-ecology-depth-audit.js --full`, `run-a6-live-dispersal-audit.js`, `run-w2-wild-ecology-audit.js`, `run-runtime-self-audit.js`, and source-book rebuild stay green |

## 2B - Later 3-D

```text
track goal
|- promote current pseudo-3D seams into more spatially honest physical truth
|- keep zone-border, structure, and render ownership boundaries clean
|- let movement, shelter, carry, shove, and contact feel physically coherent
`- stop before free-flight sandbox behavior or a second world model appears
```

### Phase Ladder

| Phase | Status | Goal | Primary owners | Proof gate |
| --- | --- | --- | --- | --- |
| `b1 physics ownership consolidation` | `live` | make `physicsSystem` the single owner for dynamic contact, legalized step commits, impulses, and the focused-garden frame-budget seam | `physicsSystem.js`, `gameCore.js`, `entities/butterfly.js`, `telemetrySystem.js`, `scripts/` | `run-r1-movement-stability-audit.js`, `run-a4-spatial-truth-audit.js`, and `run-runtime-self-audit.js` stay green while the `2.5ms physics / 16ms total update` budget seam remains live |
| `b2 collision-ready structure geometry` | `live` | expose normalized opening corridors, interior volumes, wall normals, roof footprints, and occupancy columns through a stable `structureSystem` -> `physicsSystem` query seam | `structureSystem.js`, `physicsSystem.js`, `scripts/` | `run-m5-structure-audit.js`, `run-a4-spatial-truth-audit.js`, and `run-r1-movement-stability-audit.js` stay green while the geometry packet and physics query seam remain live |
| `b3 occupancy bands + body-fit traversal` | `live` | lock discrete height bands, shared spatial hook ownership, opening traversal, shelter entry/exit, and trapped/body-fit outcomes | `physicsSystem.js`, `structureSystem.js`, `butterfly.js`, `lifeSimSystem.js` | `run-a4-spatial-truth-audit.js`, `run-r2-zone-transition-audit.js`, `run-m5-structure-audit.js`, `run-r1-movement-stability-audit.js`, and `run-ml-phase-m1-audit.js` stay green |
| `b4 carry + stack physicalization` | `live` | route carried-object attachment, stack stability, and legal placement through occupancy truth without reintroducing flower carry | `physicsSystem.js`, `objectSystem.js`, `block.js`, `structureSystem.js` | `run-b4-carry-stack-physics-audit.js`, `run-r7-block-visual-audit.js`, `run-m5-structure-audit.js`, `run-r1-movement-stability-audit.js`, and `run-a4-spatial-truth-audit.js` stay green |
| `b5 impact + shove integration` | `live` | unify training and garden contact impulses while keeping battle truth inside `battleSystem` | `physicsSystem.js`, `teachingSystem.js`, `battleSystem.js`, `statusSystem.js` | extend `run-p5-training-physics-audit.js`, `run-r5-battle-presentation-audit.js`, and `run-runtime-self-audit.js` |
| `b6 visual + debug spatial shell` | `live` | make occupancy bands, shelter state, contacts, and carry anchors legible in render/debug shells | `renderManager.js`, `ui/debugUI.js`, `ui/gameUI.js` | extend `run-r7-block-visual-audit.js` and `run-r4-ui-readability-audit.js` |
| `b7 spatial soak + save/load freeze` | `live` | prove long-run stability, rebuild dynamic caches after load, freeze the later 3-D baseline, and re-check ecology on the new spatial truth | `saveSystem.js`, `physicsSystem.js`, `scripts/`, `docs/` | `run-b7-spatial-soak-audit.js`, `run-a4-spatial-truth-audit.js`, `run-e6-ecology-depth-audit.js` / long soak, and `run-runtime-self-audit.js` all stay green on the frozen spatial baseline |

## 3C - Machine Learning

```text
track goal
|- replace selected choice scoring with a model-backed layer
|- keep the butterfly mind inspectable, fallback-safe, local, and deterministic
|- consume stable ecology and spatial features rather than guessing through gaps
`- stop before online learning, server inference, or multiplayer determinism work
```

### Phase Ladder

| Phase | Status | Goal | Primary owners | Proof gate |
| --- | --- | --- | --- | --- |
| `c1 runtime lock + offline training contract` | `live` | lock runtime choice, artifact format, inference cadence, trace schema, hook ownership, and no-online-dependency rules before `b3` / `c3` broaden consumers | `mlInferenceSystem.js`, `docs/`, `scripts/` | extend `run-ml-phase-m1-audit.js` and `run-ml-phase-m2-audit.js` |
| `c2 heuristic trace capture + scenario corpus` | `live` | export reproducible garden/battle traces and corrected labels from audit scenarios | `telemetrySystem.js`, `mlInferenceSystem.js`, `scripts/` | `build-c2-trace-corpus.js`, `run-ml-phase-m1-audit.js`, and `run-deep-systems-audit.js` now prove the corpus manifest, scenario coverage, and rebuild check on the live baseline |
| `c3 feature builder v1` | `live` | freeze deterministic feature encodings, lock the `b3` / `b7` spatial split, and expose a compact inspect trace for the live feature contract | `mlInferenceSystem.js`, `lifeSimSystem.js`, `statProfileSystem.js`, `progressionManager.js`, `physicsSystem.js`, `saveSystem.js` | `run-ml-phase-m3-audit.js` now proves `14 groups / 94 flat / 116 vec`, readable `Schema` / `Feat` / `Space` rows, deterministic rebuilds, and save/fallback continuity while `run-runtime-self-audit.js` keeps the post-load ML feature step green |
| `c4 model artifact + evaluation harness` | `live` | version a compact local `m4` bundle, lock artifact metadata compatibility, and compare it against curated heuristic baselines before rollout | `assets/ml/`, `mlInferenceSystem.js`, `scripts/` | `run-ml-phase-m4-audit.js` now proves artifact metadata compatibility, corpus coverage, runtime trace alignment, and a reviewed `actionFamily` improvement over the heuristic baseline |
| `c5 runtime inference rollout` | `live` | integrate model-backed action, target, signal, risk, and battle-posture scoring behind safe arbitration and fallback while staying within the frame budget | `mlInferenceSystem.js`, `behaviorSystem.js`, `communicationSystem.js`, `battleSystem.js` | `run-ml-closure-audit.js`, `run-r6-communication-audit.js`, `run-single-player-autobattle-audit.js`, and the frame-budget proof now stay green on the live model-backed path |
| `c6 explainability + inspect/debug shell` | `live` | expose confidence, alternatives, model version, source path, and feature highlights without hiding owner truth | `ui/gameUI.js`, `ui/debugUI.js`, `mlInferenceSystem.js` | `run-ml-closure-audit.js` and `run-r4-ui-readability-audit.js` now prove `Path` / `Why` rows and the shared debug explainability shell |
| `c7 soak + regression freeze` | `live` | prove save/load continuity, fallback resilience, performance budget, and long-soak stability before freezing the ML baseline | `saveSystem.js`, `telemetrySystem.js`, `scripts/`, `docs/` | `run-ml-closure-audit.js`, `run-long-soak-generational-audit.js`, `run-runtime-self-audit.js`, and `run-final-grand-plan-audit.js` now stay green on the frozen ML baseline |

## Frozen State

```text
no active expansion phase
|- a1-a6 ecology depth live
|- b1-b7 later 3-D live
|- c1-c7 machine learning live
`- open a fresh board only for work beyond the current expanded baseline
```

Closure note:

- `c4` is now live with a versioned `m4-garden-policy-v1` artifact, explicit artifact metadata compatibility, and a corpus-backed evaluation harness
- `c5` now keeps garden, communication, ecology, and autobattle on the live model-backed arbitration path while staying within the focused-garden budget seam
- `c6` now exposes truthful explainability through Inspect/debug `Path` / `Why` and shared trace summaries instead of decorative shell copy
- `c7` now closes with long-soak, runtime-self, ML closure, and final grand-plan proof all green on the frozen expansion baseline
