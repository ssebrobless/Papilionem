# Papilionem Remaining Implementation Roadmap

## Purpose

This roadmap now records the completed expansion path for the intentionally-later
parts of Papilionem.

It does not reopen the frozen repair, polish, or `I1`-`I5` closure work.
It now answers:

```text
what is left
what order it should land in
which owners should carry each layer
which proofs must pass before the next layer begins
```

## Planning Shape

```text
frozen current baseline
|- repaired runtime
|- polished player shell
|- frozen implementation board
`- source docs aligned
        |
        v
remaining implementation roadmap
|- 1A ecology depth
|- 2B later 3-D
`- 3C machine learning
```

```text
recommended program order

1. early ML contract lock
   c1

2. ecology foundation first
   a1 -> a2 -> a3

3. spatial foundation second
   b1 -> b2 -> b3

4. ecology expression second pass
   a4 -> a5 -> a6

5. later 3-D completion
   b4 -> b5 -> b6 -> b7

6. model-backed decision layer last
   c2 -> c3 -> c4 -> c5 -> c6 -> c7
```

```text
current program status
|- 1A ecology depth
|  `- a1-a6 live
|- 2B later 3-D
|  `- b1-b7 live
`- 3C machine learning
   `- c1-c7 live
```

Why this order:

- `c1` is contract/spec work and should land before `b3` or `c3` reserve new hooks
- ecology depth raises game-feel fastest on the current stable shell
- later 3-D should consume clearer long-horizon motives, not invent them
- ML should consume stable ecology and spatial truth instead of masking gaps in either

## Sequencing Authority

```text
authoritative future ladder
`- ACTIVE-EXPANSION-BOARD.md

older local ladders
|- P1-P6 in the later 3-D plan
`- M1-M5 in the ML contract
```

Use the expansion board as the future execution source of truth.

Read the older local ladders as:

- contract-local breakdowns
- shipped closure context
- mapping references for existing docs and audits

not as competing expansion boards.

## Ownership Map

```text
owner map
├─ ecology truth
│  ├─ zoneSystem / gameCore
│  │  └─ durable zone pressure state, live budget updates, travel scoring context
│  ├─ lifeSimSystem / behaviorSystem
│  │  └─ motives, affinities, migration urges, social ecology
│  ├─ progressionManager / statProfileSystem
│  │  └─ release pressure, lineage value, wild baseline feedback
│  └─ UI
│     └─ presentation only
├─ later 3-D truth
│  ├─ gameCore / zoneSystem
│  │  └─ legal bounds, travel anchors, border clamps
│  ├─ structureSystem
│  │  └─ static geometry, openings, interior/roof/body-fit truth
│  ├─ physicsSystem
│  │  └─ dynamic contacts, impulses, final resolved positions
│  └─ renderManager
│     └─ visuals only
└─ ML truth
   ├─ lifeSimSystem
   │  └─ canonical cognition state
   ├─ statProfileSystem / progressionManager / battleSystem
   │  └─ feature-owner state for genetics, ecology, and battle context
   ├─ mlInferenceSystem
   │  └─ feature building, model execution, arbitration traces
   └─ UI/debug
      └─ explanation only
```

## Cross-Track Invariants

```text
must stay true
|- one owner per truth
|- no return to the old rarity unlock ladder or pool-era mechanics
|- no second world border outside the current visible zone bounds
|- no freeform rigid-body sandbox as a side effect of later 3-D work
|- no ML ownership of memories, emotions, genetics, lineage, or lifecycle truth
|- save/load only persists durable state and rebuilds cheap caches
`- player-facing shell and debug shell must agree about what is really happening
```

## Recurring Obligations

```text
whenever durable state widens
|- update save migration in saveSystem
`- add or widen round-trip proof in the same phase
```

```text
whenever a hot loop broadens materially
|- define the new performance budget first
`- prove it before the phase closes
```

## 1A - Ecology Depth

```text
track intent
|- deepen the living-garden loop inside the current pseudo-3D baseline
|- make zones differ by long-horizon pressures, not just flavor labels
|- make release and lineage feedback visible in future wild behavior
`- preserve the wild-ecology contract as the canonical floor
```

### a1 - Zone Signatures + Pressure State

Status:
- `live` on the current expansion board

```text
goal
|- create explicit zone ecology containers
|- track food richness, shelter capacity, crowding tolerance, migration pull,
|  social/training valence, and recovery pressure
`- expose those pressures to life-sim and debug summaries
```

Owners:
- `systems/zoneSystem.js`
- `core/gameCore.js`
- `systems/lifeSimSystem.js`
- `ui/gameUI.js`
- `scripts/run-a3-zone-identity-audit.js`
- `scripts/run-w3-flower-ecology-audit.js`

Implementation notes:
- zone identity now lives as durable zone-pressure state in `zoneSystem.js`
- `gameCore.js` is the live writer for pressure refresh and travel scoring consumption
- `lifeSimSystem.js` consumes the zone summary directly into motives and inspectable summaries
- pressures should be durable enough to shape behavior over time, but cheap local
  summaries should still rebuild
- foundation save/load stays green through widened `zoneSystem` durable state
- this phase only widens the player shell through compact inspectable summary lines

Proof gate:
- `scripts/run-a3-zone-identity-audit.js`
- `scripts/run-w3-flower-ecology-audit.js`
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-runtime-self-audit.js`

Exit condition:
- each zone produces a stable and distinct ecological signature that later
  behavior systems can consume directly

### a2 - Flower + Habitat Resource Loop

Status:
- `live` on the current expansion board

```text
goal
|- turn flowers into renewable local resources instead of flat static supply
|- add depletion, regrowth, habitat-quality consequences, and a minimum
|  population-health floor
`- let feeding pressure respond to ecology rather than constant abundance
```

Owners:
- `systems/zoneSystem.js`
- `core/gameCore.js`
- `systems/lifeSimSystem.js`
- `scripts/run-w3-flower-ecology-audit.js`
- `scripts/run-long-soak-generational-audit.js`

Implementation notes:
- resource loops should stay graceful under long soak and must not starve the
  garden into deadlock
- define the recovery floor before behavior wiring so a depleted garden cannot
  collapse into a non-recovering state
- habitat quality should affect future bloom recovery and zone attractiveness
- the durable resource/habitat fields now ride inside the widened `zoneSystem.js`
  ecology state rather than adding a separate save-owned container
- `gameCore.js` owns reserve spend, emergency floor recovery, spawn targets, and
  flower-consumption bookkeeping so supply stays coupled to live zone demand
- `lifeSimSystem.js` only consumes the habitat/resource summary and does not
  become a second flower-ecology owner
- keep current flower visual direction; this is ecology depth, not a flower-art rewrite

Proof gate:
- `scripts/run-w3-flower-ecology-audit.js`
- `scripts/run-long-soak-generational-audit.js`
- `scripts/run-a3-zone-identity-audit.js`
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-runtime-self-audit.js`

Exit condition:
- feeding, crowding, and regrowth create readable local booms and recovery cycles

### a3 - Migration + Home-Range Personality

```text
goal
|- give butterflies long-horizon place preference
|- add scouting, mate-seeking, overcrowding escape, and return-home behavior
`- make cross-zone movement read as motive-driven rather than churn
```

Status:
- `live`

Owners:
- `core/entity.js`
- `systems/lifeSimSystem.js`
- `core/gameCore.js`
- `ui/gameUI.js`
- `scripts/run-a6-live-dispersal-audit.js`
- `scripts/run-a3-zone-identity-audit.js`

Implementation notes:
- use zone affinity, novelty, caution, and social motive as a combined travel driver
- keep zone travel ownership in `gameCore`
- let the ecology layer choose why to move; let existing travel systems choose how
- make home-range state durable in `lifeSim` and keep inspect copy display-only
- keep save/load proof on the existing life-sim foundation path by rebuilding
  migration summaries with zero-delta refreshes instead of mutating durable state

Proof gate:
- `scripts/run-a6-live-dispersal-audit.js`
- `scripts/run-a3-zone-identity-audit.js`
- `scripts/run-w2-wild-ecology-audit.js`
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-runtime-self-audit.js`

Exit condition:
- migration produces recognizable home ranges, scouting arcs, and repopulation behavior

### a4 - Social-Ecology Emergence

```text
goal
|- make ecology visible through group behavior
|- add roosting pockets, warning cascades, shelter seeking, teaching pockets,
|  and courtship territories
`- let zones feel socially alive even when the player is only observing
```

Status:
- `live`

Owners:
- `systems/lifeSimSystem.js`
- `systems/communicationSystem.js`
- `systems/behaviorSystem.js`
- `systems/sleepSystem.js`
- `systems/zoneSystem.js`
- `systems/saveSystem.js`

Implementation notes:
- this phase should distort shared systems rather than invent ecology-only one-off logic
- confirm `b3` shelter/occupancy truth is stable before building roosting or
  shelter-seeking behavior on top of it
- shelter, sleep, and warning behavior should reuse the same cognition families
- visible emergence must be mirrored in Inspect/debug truth

Proof gate:
- `scripts/run-e4-social-ecology-audit.js`
- `scripts/run-lifesim-expression-audit.js`
- `scripts/run-r6-communication-audit.js`
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-w2-wild-ecology-audit.js`
- serial `scripts/run-a4-spatial-truth-audit.js`
- `scripts/run-runtime-self-audit.js`

Exit condition:
- a player can watch a zone long enough to recognize its repeating social/ecological rhythm

### a5 - Release + Lineage Ecology Feedback

```text
goal
|- make selective release visibly reshape future wild cohorts
|- surface lineage familiarity, zone affinity, and release value in future ecology
`- connect genetics, ecology, and journal truth without duplicating ownership
```

Status:
- `live`

Owners:
- `core/progressionManager.js`
- `systems/statProfileSystem.js`
- `systems/lifeSimSystem.js`
- `ui/gameUI.js`
- `ui/butterflyCollection.js`
- `systems/saveSystem.js`

Implementation notes:
- released-stat uplift should stay averaged, clamped, and blended as the contract says
- visibility matters here: the player should be able to read what their releases changed
- current runtime stores cohort summaries with top lineages, top zones, modifier highlights,
  and a blend guard for each completed 10-release wave
- release-wave wilds may receive a mild preferred-zone bias and familiarity context from the
  latest qualifying cohort, but the shaping stays descriptive rather than progression-like
- do not turn release into a new unlock ladder or rarity gate
- if focused release of one line becomes a dominant strategy, the blending/clamp
  parameters are wrong and the phase is not ready to close

Proof gate:
- `scripts/run-w2-wild-ecology-audit.js`
- `scripts/run-genetics-mutation-audit.js`
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-a6-live-dispersal-audit.js`
- `scripts/run-runtime-self-audit.js`
- prove the anti-progression invariant in the wild-ecology proof stack

Exit condition:
- future wild populations visibly reflect the direction of release choices

### a6 - Long-Soak Ecology Proof

```text
goal
|- prove that deepened ecology stays healthy across generations
|- freeze the new ecology layer in docs, audits, and debug surfaces
`- catch degenerate loops before later 3-D or ML build on them
```

Status:
- `live`

Owners:
- `scripts/`
- `systems/telemetrySystem.js`
- `docs/`

Implementation notes:
- this is the ecology closure gate, and it now closes with a telemetry-backed
  soak layer instead of relying on shorter feature audits alone
- `scripts/run-long-soak-generational-audit.js` now seeds real scout and
  return-home travel, records ecology telemetry summaries, and reports overlap
  sightings separately from truly critical anomalies
- `scripts/run-e6-ecology-depth-audit.js` now judges zone identity, migration
  health, resource recovery, and release feedback across the soak artifact set
- do not advance to broad later 3-D completion or ML rollout if this phase is noisy

Proof gate:
- `scripts/run-e6-ecology-depth-audit.js --full`
- `scripts/run-long-soak-generational-audit.js`
- `scripts/run-a6-live-dispersal-audit.js`
- `scripts/run-w2-wild-ecology-audit.js`
- `scripts/run-runtime-self-audit.js`
- rebuild the source book after doc updates

Exit condition:
- multi-generation runs keep zone identity, migration health, resource recovery,
  and release feedback stable and readable while the targeted ecology regressions
  stay green

## 2B - Later 3-D

```text
track intent
|- promote pseudo-3D seams into more honest spatial truth
|- keep legal borders, structure truth, dynamic motion, and rendering separated
|- make contact, shelter, carry, and shove feel real in Papilionem's style
`- stop short of free-flight sandbox rules
```

### b1 - Physics Ownership Consolidation

```text
goal
|- make `physicsSystem` the single owner of dynamic contact, impulse, and
|  final resolved movement
`- reduce entity-side teleport-style conflict paths
```

Status:
- `live`

Owners:
- `systems/physicsSystem.js`
- `core/gameCore.js`
- `entities/butterfly.js`
- `systems/telemetrySystem.js`
- `scripts/run-r1-movement-stability-audit.js`
- `scripts/run-a4-spatial-truth-audit.js`

Implementation notes:
- entities now keep motion intent and candidate steps, not final collision truth
- reuse current roam clamps and zone-border order from the later 3-D plan
- `physicsSystem` now legalizes and commits the final focused-garden step
- the baseline frame budget now lives as a real seam:
  `2.5ms physics / 16ms total update` in focused-garden play
- telemetry now records `physicsMs` separately so later 3-D phases can prove,
  not just claim, budget safety

Proof gate:
- `scripts/run-r1-movement-stability-audit.js`
- `scripts/run-a4-spatial-truth-audit.js`
- `scripts/run-runtime-self-audit.js`

Closure proof:
- `r1` now proves `motionOwner = physicsSystem`, synchronized entity/physics positions,
  and a live frame-budget seam
- `a4` now proves physics ownership is exposed through the spatial truth path and that
  the focused-garden budget seam is live

Exit condition:
- the project has one coherent per-frame motion-resolution path

### b2 - Collision-Ready Structure Geometry

Status:
- `live`

```text
goal
|- expose structure geometry in a physics-friendly form
|- define opening corridors, interior volumes, roof footprints, wall normals,
|  and occupancy columns
`- stop relying on scattered point tests as the final seam
```

Owners:
- `systems/structureSystem.js`
- `systems/physicsSystem.js`

Implementation notes:
- static truth stays in `structureSystem`
- dynamic contact stays in `physicsSystem`
- normalized collision packets now live per-zone / per-component inside `structureSystem`
- `physicsSystem` now exposes a dedicated structure-query seam instead of reaching into shelter internals ad hoc
- `run-m5-structure-audit.js` now proves the shelter packet and the physics query seam together
- `run-a4-spatial-truth-audit.js` now proves the geometry packet is visible on the live focused-garden baseline
- this phase should make later shelter/carry/stack work cheaper and safer

Proof gate:
- `scripts/run-m5-structure-audit.js`
- `scripts/run-a4-spatial-truth-audit.js`
- `scripts/run-r1-movement-stability-audit.js`

Exit condition:
- physics can query a stable geometry seam instead of inferring structure ad hoc

### b3 - Occupancy Bands + Body-Fit Traversal

Status:
- live

```text
goal
|- lock discrete height bands and occupancy semantics
|- make entry, sheltering, narrow-pass failure, and trapped states spatially honest
`- reserve only the shared spatial hooks that `c1` has already locked
```

Owners:
- `systems/physicsSystem.js`
- `systems/structureSystem.js`
- `entities/butterfly.js`
- `systems/lifeSimSystem.js`
- `core/gameCore.js`

Implementation notes:
- use the `verticality`, `structureRole`, `pathState`, and `bodyFit` hooks already reserved
- lock those shared enums at the owner seam so later consumers import them
  instead of inventing their own copies
- this phase is the main bridge between spatial truth and cognition truth
- do not create a second travel model outside current zone bounds

Proof gate:
- extend `scripts/run-a4-spatial-truth-audit.js`
- extend `scripts/run-r2-zone-transition-audit.js`
- capture debug screenshot proof for blocked, enterable, and sheltered states
- keep the shared-hook ownership rule documented and consistent with `c1`

Exit condition:
- openings, interiors, roofs, and body-fit checks read consistently in play and debug views

Closed state:
- `structureSystem.js` owns the shared spatial semantics packet, including `verticality`, `structureRole`, `pathState`, `bodyFit`, and discrete `occupancyBand` values
- `physicsSystem.js`, `entity.js`, and `mlInferenceSystem.js` now consume those shared domains instead of carrying private copies
- `run-a4-spatial-truth-audit.js`, `run-r2-zone-transition-audit.js`, `run-m5-structure-audit.js`, and `run-r1-movement-stability-audit.js` prove opening/interior traversal, shelter targeting, carry/body-fit truth, and owner-seam stability

### b4 - Carry + Stack Physicalization

Status:
- live

```text
goal
|- route carry and stack behavior through occupancy truth
|- make attachment motion, placement, and stack stability physically coherent
`- keep the current no-flower-carry boundary intact unless explicitly reapproved later
```

Owners:
- `systems/physicsSystem.js`
- `systems/objectSystem.js`
- `entities/block.js`
- `systems/structureSystem.js`

Implementation notes:
- current carryable-object truth should stay narrow and explicit
- avoid physics chaos; placement still needs to feel hand-authored and readable

Proof gate:
- add `scripts/run-b4-carry-stack-physics-audit.js`
- extend `scripts/run-r7-block-visual-audit.js`
- keep `scripts/run-a4-spatial-truth-audit.js` green

Exit condition:
- carried and stacked objects feel physically honest without becoming sandbox noise

Closed state:
- `physicsSystem.js` now owns normalized carry anchors, legal placement resolution, and unsupported-stack settling instead of butterflies placing blocks ad hoc
- `structureSystem.js` now validates stacked placement against support-column truth, max stack height, doorway conflict, and support alignment
- `objectSystem.js` and `block.js` now surface carried / stacked / grounded occupancy states so audits can verify the same truth the runtime uses
- `run-b4-carry-stack-physics-audit.js`, `run-r7-block-visual-audit.js`, `run-m5-structure-audit.js`, `run-r1-movement-stability-audit.js`, and `run-a4-spatial-truth-audit.js` prove the live carry/stack seam

### b5 - Impact + Shove Integration

Status:
- live

```text
goal
|- make training and garden impacts use real impulse requests
|- preserve the rule that battle owns battle truth
`- use physics as a spatial cue layer, not a battle-rules replacement
```

Owners:
- `systems/physicsSystem.js`
- `systems/teachingSystem.js`
- `systems/battleSystem.js`
- `systems/statusSystem.js`

Implementation notes:
- training and garden interactions may request shove/impulse through `physicsSystem`
- `battleSystem` still owns combat outcomes and result commits
- keep the top-down battle shell distinct from the angled garden world

Proof gate:
- extend `scripts/run-p5-training-physics-audit.js`
- extend `scripts/run-r5-battle-presentation-audit.js`
- keep `scripts/run-single-player-autobattle-audit.js` green

Exit condition:
- impacts look spatially honest while combat ownership remains stable

Closed state:
- `teachingSystem.js` already routes garden recoil through `physicsSystem.applyImpulse(...)`, so no second garden-displacement owner had to be added for this phase
- `battleSystem.js` still owns battle outcomes, result commits, and participant state while `renderManager.js` only consumes battle presentation data
- `run-p5-training-physics-audit.js`, `run-r5-battle-presentation-audit.js`, `run-single-player-autobattle-audit.js`, and `run-runtime-self-audit.js` all stay green on the live owner split

### b6 - Visual + Debug Spatial Shell

Status:
- live

```text
goal
|- make spatial truth legible
|- expose occupancy bands, shelter state, contacts, and carry anchors in render
|  and debug shells
`- avoid logic-correct but visually misleading spatial states
```

Owners:
- `core/renderManager.js`
- `ui/debugUI.js`
- `ui/gameUI.js`
- `systems/physicsSystem.js`
- `systems/structureSystem.js`

Implementation notes:
- player shell should read spatial truth quickly without becoming debug clutter
- debug overlays should clearly separate static structure from dynamic contacts

Proof gate:
- extend `scripts/run-r7-block-visual-audit.js`
- extend `scripts/run-r4-ui-readability-audit.js`

Exit condition:
- player-facing and debug-truth views agree about space and contact state

Closed state:
- `physicsSystem.js` now exposes one shared spatial summary seam so render, inspect, and debug surfaces read the same occupancy/contact/carry truth
- `renderManager.js` now draws focus-shell cards plus carried/stacked block badges, `ui/debugUI.js` now surfaces a compact spatial-focus panel, and `ui/gameUI.js` now folds the same truth into Inspect
- `run-r7-block-visual-audit.js` and `run-r4-ui-readability-audit.js` now assert the live shell summaries directly instead of relying only on screenshots

### b7 - Spatial Soak + Save/Load Freeze

```text
goal
|- prove long-run stability of the later 3-D layer
|- rebuild dynamic caches after load instead of persisting transient state
`- freeze the new spatial baseline before ML depends on it
```

Owners:
- `systems/saveSystem.js`
- `systems/physicsSystem.js`
- `scripts/`
- `docs/`

Implementation notes:
- do not persist velocity, contact caches, or transient push vectors
- use save/load and soak evidence as the freeze gate

Proof gate:
- add `scripts/run-b7-spatial-soak-audit.js`
- extend `scripts/run-a4-spatial-truth-audit.js`
- extend `scripts/run-runtime-self-audit.js`
- rerun `scripts/run-e6-ecology-depth-audit.js` and long-soak ecology proof on
  the later 3-D baseline

Exit condition:
- later 3-D becomes stable enough to serve as a long-term feature source for ML

Closed state:
- `systems/saveSystem.js` now persists durable carry / placement truth while rebuilding transient spatial caches after load instead of serializing them directly
- `scripts/run-b7-spatial-soak-audit.js` now proves payload hygiene, post-load carry/stack continuity, and short spatial-soak stability on the frozen later 3-D baseline
- `scripts/run-a4-spatial-truth-audit.js`, `scripts/run-runtime-self-audit.js`, and the full `scripts/run-e6-ecology-depth-audit.js` rerun now confirm later 3-D closure did not regress ecology or post-load spatial truth

## 3C - Machine Learning

```text
track intent
|- move from heuristic-only choice scoring to model-backed scoring
|- keep the system local, offline-capable, fallback-safe, and inspectable
|- consume stable ecology and spatial feature sources instead of guessing
|- treat `c1` as a parallel-safe contract lock
`- stop before online learning, server inference, or multiplayer determinism work
```

Current expansion state:
- `c1 - c7` are live and frozen on the expansion board

### c1 - Runtime Lock + Offline Training Contract

```text
goal
|- close the remaining contract ambiguity around runtime choice, artifact format,
|  inference cadence, trace schema, and fallback rules
`- make `b3` and `c3` implementable without drift
```

Owners:
- `systems/mlInferenceSystem.js`
- `docs/`
- `scripts/`

Implementation notes:
- recommended path remains local browser inference with ONNX Runtime Web
- keep heuristic fallback always available
- no online dependency should enter the main runtime
- land this before `b3` finalizes shared spatial hooks or `c3` finalizes feature groups

Proof gate:
- extend `scripts/run-ml-phase-m1-audit.js`
- extend `scripts/run-ml-phase-m2-audit.js`
- update the source contracts before code rollout

Exit condition:
- runtime, artifact, and fallback questions are concrete enough to implement safely

### c2 - Heuristic Trace Capture + Scenario Corpus

```text
goal
|- export reproducible action traces from the current sim and audits
|- build a curated scenario corpus with corrected labels where the heuristic is wrong
`- create the training and regression substrate before model rollout
```

Owners:
- `systems/telemetrySystem.js`
- `systems/mlInferenceSystem.js`
- `scripts/`

Implementation notes:
- traces should include garden, communication, ecology, and autobattle cases
- corpus should be reproducible from repo state and audit presets
- keep raw data outside save truth; this is tooling, not sim state

Proof gate:
- extend `scripts/run-ml-phase-m1-audit.js`
- extend `scripts/run-deep-systems-audit.js`

Exit condition:
- training input can be regenerated and audited instead of hand-waved

Closed state:
- `systems/mlInferenceSystem.js` now exports corpus-ready garden and battle trace records with active-trace, heuristic-baseline, reviewed-label, and feature-snapshot seams
- `systems/telemetrySystem.js` now records ML corpus sample summaries so the corpus layer has its own profile and manifest inputs without entering save truth
- `scripts/build-c2-trace-corpus.js`, `scripts/run-ml-phase-m1-audit.js`, and `scripts/run-deep-systems-audit.js` now prove four-family scenario coverage, reviewed labels, and a manifest rebuild check from persisted corpus records

### c3 - Feature Builder V1

```text
goal
|- build deterministic feature vectors from canonical owners
|- include cognition, ecology, progression, autobattle, and 3-D-ready space fields
`- keep the feature builder cheap to recompute and safe to debug
```

Owners:
- `systems/mlInferenceSystem.js`
- `systems/lifeSimSystem.js`
- `systems/statProfileSystem.js`
- `core/progressionManager.js`
- `systems/physicsSystem.js`
- `systems/battleSystem.js`
- `systems/saveSystem.js`

Implementation notes:
- persist version ids and short trace summaries, not raw vectors
- missing values must encode explicitly, never as `NaN`
- stable enum ids matter here because future artifacts depend on them
- split spatial inputs into fields that are stable after `b3` and fields that
  are only valid after the `b7` freeze, rather than pretending the whole later
  3-D stack is already final

Proof gate:
- extend `scripts/run-ml-phase-m3-audit.js`
- extend `scripts/run-runtime-self-audit.js`
- keep save round-trip proof green for model version / trace-summary state

Exit condition:
- feature vectors are deterministic, rebuildable, and aligned with owner boundaries

Closed state:
- `systems/mlInferenceSystem.js` now freezes ordered drive/emotion/memory/progression encodings instead of leaning on object iteration order, and the live feature contract is now exact at `14 groups / 94 flat / 116 vec`
- the spatial feature family now names the `b3` stable hooks separately from the `b7` stable occupancy/shelter fields, and `ui/gameUI.js` now surfaces that split through compact `Schema` / `Feat` / `Space` inspect rows
- `scripts/run-ml-phase-m3-audit.js` and `scripts/run-runtime-self-audit.js` now prove deterministic rebuilds, readable trace surfacing, and post-load / fallback continuity for that feature contract

### c4 - Model Artifact + Evaluation Harness

```text
goal
|- train and version a compact local model bundle
|- compare it against curated heuristic baselines before live rollout
`- move from "we could infer" to "we have a measurable artifact"
```

Owners:
- `assets/ml/`
- `systems/mlInferenceSystem.js`
- `scripts/`

Implementation notes:
- start with small policy bundles, not one opaque mega-model
- artifact evaluation should include garden, communication, ecology, and battle cases
- keep the current JSON-policy bridge available as a fallback during transition

Proof gate:
- extend `scripts/run-ml-phase-m4-audit.js`
- add artifact version and threshold checks

Exit condition:
- there is a reproducible local artifact that meets clear evaluation gates

Closed state:
- `assets/ml/m4-garden-policy.json` is now a versioned local artifact with explicit `artifactFormat`, feature/trace schema versions, and contract version metadata
- `systems/mlInferenceSystem.js` now validates artifact metadata compatibility and reports a compact artifact summary through `getRuntimeSummary()`
- `scripts/run-ml-phase-m4-audit.js` now rebuilds the `c2` corpus, writes `artifact-evaluation.json`, proves runtime trace alignment, and confirms the reviewed teaching `actionFamily` correction beats the heuristic baseline without regressing ecology or autobattle

### c5 - Runtime Inference Rollout

```text
goal
|- let the model influence action, target, signal, risk, and battle-posture scoring
|- preserve heuristic fallback and existing owner systems
`- keep arbitration deterministic, reversible, and within the frame budget
```

Owners:
- `systems/mlInferenceSystem.js`
- `systems/behaviorSystem.js`
- `systems/communicationSystem.js`
- `systems/battleSystem.js`

Implementation notes:
- rollout should be staged and measurable
- behavior systems still execute actions; the model only scores preferences
- regressions in communication or autobattle should block advancement immediately
- treat performance budget proof as a close gate, not a cleanup task for `c7`

Proof gate:
- extend `scripts/run-ml-closure-audit.js`
- extend `scripts/run-r6-communication-audit.js`
- extend `scripts/run-single-player-autobattle-audit.js`
- prove the inference path stays within the agreed frame budget under garden and battle load

Exit condition:
- live behavior is model-influenced where allowed and still safe when the model is unavailable

Closed state:
- `systems/mlInferenceSystem.js` now keeps garden and battle policy scoring on the live model-backed path, records runtime budget samples, and exposes focused-garden / battle budget targets through one owner seam
- `scripts/run-ml-closure-audit.js`, `scripts/run-r6-communication-audit.js`, and `scripts/run-single-player-autobattle-audit.js` now prove live model-backed arbitration, truthful fallback boundaries, and the focused-garden / battle budget envelope
- the final grand-plan audit now consumes the live `16ms total update` budget seam during short-soak proof instead of a stale pre-expansion threshold

### c6 - Explainability + Inspect/Debug Shell

```text
goal
|- answer "why did this butterfly do that?" from the live shell
|- expose confidence, rejected alternatives, model version, source path,
|  and meaningful feature highlights
`- keep explanations truthful rather than decorative
```

Owners:
- `ui/gameUI.js`
- `ui/debugUI.js`
- `systems/mlInferenceSystem.js`

Implementation notes:
- player-facing copy should stay concise
- debug shell should show enough detail to audit the model-vs-heuristic boundary

Proof gate:
- extend `scripts/run-ml-closure-audit.js`
- extend `scripts/run-r4-ui-readability-audit.js`

Exit condition:
- model-backed choices are inspectable without guesswork

Closed state:
- `systems/mlInferenceSystem.js` now turns live linear-policy traces into short explainability summaries for action, target, signal, risk, and battle posture without inventing shell-only truth
- `ui/gameUI.js` now exposes compact `Path` and `Why` rows, and `ui/debugUI.js` now renders the shared ML explainability snapshot with artifact path, confidence, alternatives, feature drivers, and budget lines
- `scripts/run-ml-closure-audit.js` and `scripts/run-r4-ui-readability-audit.js` now prove those explainability surfaces directly

### c7 - Soak + Regression Freeze

```text
goal
|- prove save/load continuity, fallback resilience, and long-run behavioral stability
|- freeze the ML layer only after performance and regressions are understood
`- keep later multiplayer determinism as a separate future problem
```

Owners:
- `systems/saveSystem.js`
- `systems/telemetrySystem.js`
- `scripts/`
- `docs/`

Implementation notes:
- this is the ML closure gate
- no online/shared determinism claims should sneak in here

Proof gate:
- extend `scripts/run-ml-closure-audit.js`
- extend `scripts/run-long-soak-generational-audit.js`
- extend `scripts/run-runtime-self-audit.js`

Exit condition:
- the model-backed layer becomes a stable, documented, fallback-safe baseline

Closed state:
- `scripts/run-runtime-self-audit.js` now proves the post-load ML explainability shell, budget targets, and debug snapshot against the frozen runtime
- `scripts/run-long-soak-generational-audit.js` now proves the live model-backed path stays active through long-soak checkpoints without falling back silently
- `scripts/run-final-grand-plan-audit.js` now closes the whole expansion program with a green end-to-end pass on the frozen ML baseline

## Program-Level Definition Of Done

```text
done means
|- the garden develops richer ecology over long horizons
|- space feels more physically honest without becoming a sandbox
|- butterflies make some decisions through a real model-backed layer
|- Inspect/debug can still explain why behavior happened
|- save/load and long-soak audits stay green
`- source docs, audits, and runtime truth all agree again
```
