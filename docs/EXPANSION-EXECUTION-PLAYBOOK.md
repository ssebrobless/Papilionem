# Papilionem Expansion Execution Playbook

## Purpose

This document now preserves how the Papilionem expansion work was executed in
practice and how its phases were closed.

It is the build-method companion to:

- [ACTIVE-EXPANSION-BOARD.md](./ACTIVE-EXPANSION-BOARD.md)
- [REMAINING-IMPLEMENTATION-ROADMAP.md](./REMAINING-IMPLEMENTATION-ROADMAP.md)

Use it to answer:

```text
how each phase should be built
how work should be sequenced safely
what to audit before promotion
what artifacts should exist when a phase closes
```

It is now a frozen execution record for the completed expansion track.

```text
current execution snapshot
|- ecology depth
|  `- a1-a6 live
|- later 3-D
|  `- b1-b7 live
`- machine learning
   `- c1-c7 live
```

## Program Execution Shape

```text
frozen baseline
   |
   v
c1 runtime + training contract lock
   |
   v
ecology foundation
|- a1 zone signatures + pressure state
|- a2 flower + habitat resource loop
`- a3 migration + home-range personality
   |
   v
spatial foundation
|- b1 physics ownership consolidation
|- b2 collision-ready structure geometry
`- b3 occupancy bands + body-fit traversal
   |
   +--> ecology second pass
   |    |- a4 social-ecology emergence
   |    |- a5 release + lineage ecology feedback
   |    `- a6 long-soak ecology proof
   |
   v
later 3-D completion
|- b4 carry + stack physicalization
|- b5 impact + shove integration
|- b6 visual + debug spatial shell
`- b7 spatial soak + save/load freeze
   |
   +--> rerun ecology soak on the later 3-D baseline
   |
   v
ML rollout
|- c2 heuristic trace capture + scenario corpus
|- c3 feature builder v1
|- c4 model artifact + evaluation harness
|- c5 runtime inference rollout
|- c6 explainability + inspect/debug shell
`- c7 soak + regression freeze
```

## Execution Doctrine

```text
every phase follows the same loop

1. lock owner boundaries
2. add durable state containers
2b. if durable state widened: update save migration and round-trip proof
3. add owner APIs and derived summaries
4. connect behavior to the new truth
5. expose player/debug proof if the state is visible
6. widen or add audits
7. run regression stack
8. update docs and rebuild the source book
9. freeze the phase only if the full gate is clean
```

### Workstream Rules

```text
always do
|- keep one owner per truth
|- prefer additive seams over destructive rewrites
|- keep save/load migration explicit whenever durable state widens
|- define performance budgets before hot-loop work broadens materially
|- land debug-truth surfaces before relying on observation alone
|- widen audits in the same phase that widens behavior
`- document the exit gate before coding the phase
```

```text
never do
|- hide new behavior behind prose-only claims
|- let UI invent truth that belongs to owner systems
|- let later 3-D create a second border model
|- let ML become the source of truth for cognition or genetics
`- promote a downstream phase while its upstream proof is noisy
```

## Branching And Change Shape

```text
phase branch shape

phase start
|- owner systems
|- audit scripts
|- docs
`- optional UI/debug shell

phase close
|- runtime green
|- target audits green
|- source docs updated
`- source book rebuilt
```

Practical rule:

- each phase should aim for one coherent patch set, not a giant mixed refactor
- if a phase gets too wide, split it by owner seam before splitting it by feature fantasy

## Sequencing Authority

```text
authoritative future ladder
`- ACTIVE-EXPANSION-BOARD.md

local contract ladders
|- later 3-D P1-P6
`- ML M1-M5
```

Use the expansion board and this playbook for future execution order.

Read the local contract ladders as:

- shipped context
- local decomposition
- mapping references

not as competing future boards.

## Shared Regression Gate

Run the narrow phase proof first, then the shared baseline gate:

```text
shared baseline gate
|- node scripts/run-runtime-self-audit.js
|- explicit save round-trip proof when the phase widens durable state
|- node scripts/run-r4-ui-readability-audit.js        when visible shell changes
|- node scripts/run-r5-battle-presentation-audit.js   when battle readability changes
|- node scripts/run-r6-communication-audit.js         when communication or social proof changes
|- node scripts/run-w2-wild-ecology-audit.js          when ecology/release logic changes
|- node scripts/run-a4-spatial-truth-audit.js         when spatial ownership changes
`- node scripts/build-source-book.js                  when docs change
```

## Phase Template

Every phase below follows this structure:

```text
build order
|- foundation state
|- owner APIs
|- behavior wiring
|- UI/debug proof
`- audit/doc freeze
```

## 1A - Ecology Depth

### a1 - Zone Signatures + Pressure State

```text
execution intent
|- convert zone identity from loose behavior scoring into explicit ecology state
`- make later ecology, later 3-D, and ML consume a stable zone truth seam
```

Current status:
- `live`

Build order:
1. Add durable per-zone ecology containers in `zoneSystem.js`.
2. Widen the existing foundation round-trip path so the new `zoneSystem.js` state survives save/load cleanly.
3. Add live pressure refresh and travel scoring consumption in `gameCore.js`.
4. Add readable zone-summary APIs for `lifeSimSystem.js` and inspect/debug consumers.
5. Feed zone pressure summaries into behavior scoring without changing travel ownership.
6. Add compact inspect summaries that expose current zone pressure without reopening the full shell.
7. Widen `run-a3-zone-identity-audit.js` and `run-w3-flower-ecology-audit.js`.

Primary files:
- `systems/zoneSystem.js`
- `core/gameCore.js`
- `systems/lifeSimSystem.js`
- `ui/gameUI.js`
- `scripts/run-a3-zone-identity-audit.js`
- `scripts/run-w3-flower-ecology-audit.js`

Main risks:
- duplicating zone truth between `gameCore` and `zoneSystem`
- making zone signatures so volatile that they stop reading as identity

Phase close artifacts:
- stable zone pressure state shape
- one inspectable summary path
- audit proof for distinct zone signatures

### a2 - Flower + Habitat Resource Loop

```text
execution intent
|- make food and habitat recover on a real ecological rhythm
`- avoid flat abundance or irreversible collapse
```

Current status:
- `live`

Build order:
1. Define the minimum population-health floor and emergency recovery mechanism before wiring depletion into behavior.
2. Widen the existing `zoneSystem.js` ecology state with reserve, habitat-quality, depletion, and recovery-floor fields.
3. Let `gameCore.js` own reserve spend, emergency floor recovery, spawn targets, and flower-consumption bookkeeping without creating a second ecology container.
4. Feed habitat quality, depletion, and reserve summaries into pressure refresh and life-sim consumption.
5. Extend flower ecology and soak audits with floor-invariant proof.
6. Keep the widened zone-state round-trip green through the existing foundation path.

Primary files:
- `systems/zoneSystem.js`
- `core/gameCore.js`
- `systems/lifeSimSystem.js`
- `scripts/run-w3-flower-ecology-audit.js`
- `scripts/run-long-soak-generational-audit.js`

Main risks:
- starving zones permanently
- making the ecology too noisy to read from normal play

Phase close artifacts:
- renewable flower/habitat model
- extended `w3`, zone-identity, and soak proof

### a3 - Migration + Home-Range Personality

```text
execution intent
|- make movement across zones feel chosen
`- establish long-horizon residence and dispersal logic before social emergence
```

Current status:
- `live`

Build order:
1. Add durable migration/home-range memory state in `core/entity.js` and `systems/lifeSimSystem.js`.
2. Add motive-aware travel scoring and reason routing in `core/gameCore.js`.
3. Surface the resulting home-range summary through Inspect without making the UI the owner.
4. Keep round-trip proof on the existing life-sim foundation path by making rebuild refreshes zero-delta and deterministic.
5. Widen `a6` dispersal and zone-identity audits, then keep wild-ecology and runtime-self proof green.

Primary files:
- `core/entity.js`
- `systems/lifeSimSystem.js`
- `core/gameCore.js`
- `ui/gameUI.js`
- `scripts/run-a6-live-dispersal-audit.js`
- `scripts/run-a3-zone-identity-audit.js`

Main risks:
- turning travel into churn
- mixing travel motive truth into path/execution truth
- mutating durable migration state during save/load rebuilds

Phase close artifacts:
- home-range summary
- motive-driven travel traces
- green dispersal, zone-identity, UI, wild-ecology, and runtime-self proof

### a4 - Social-Ecology Emergence

```text
execution intent
|- use the stabilized ecology layer to produce visible group rhythms
`- deepen feel without creating separate ecology-only mini-systems
```

Current status:
- `live`

Build order:
1. Confirm `b3` shelter/occupancy truth is stable enough to support roosting and shelter-seeking honestly.
2. Add reusable life-sim summaries for roost preference, shelter preference, warning sensitivity, and teaching-cluster affinity.
3. Update `saveSystem.js` migration and round-trip coverage if any new social-ecology state is durable.
4. Connect them to `communicationSystem.js`, `sleepSystem.js`, and `behaviorSystem.js`.
5. Surface these rhythms through Inspect/debug summaries and feed evidence where appropriate.
6. Create a dedicated social-ecology audit scenario script.

Primary files:
- `systems/lifeSimSystem.js`
- `systems/communicationSystem.js`
- `systems/sleepSystem.js`
- `systems/behaviorSystem.js`
- `systems/saveSystem.js`
- `ui/gameUI.js`
- `ui/debugUI.js`

Main risks:
- fake emergence that only exists in text
- duplicating memory/social state with ecology-specific flags

Phase close artifacts:
- social-ecology scenario script
- Inspect/debug proof
- widened life-sim and communication audits

Closed proof:
- `run-e4-social-ecology-audit.js`
- `run-lifesim-expression-audit.js`
- `run-r6-communication-audit.js`
- `run-r4-ui-readability-audit.js`
- `run-w2-wild-ecology-audit.js`
- serial `run-a4-spatial-truth-audit.js`
- `run-runtime-self-audit.js` with all audited steps green

### a5 - Release + Lineage Ecology Feedback

```text
execution intent
|- make release consequences legible in future wild cohorts
`- connect ecology feedback to the existing wild-release contract, not a new progression loop
```

Current status:
- `live`

Build order:
1. Add lineage/ecology feedback summaries in `progressionManager.js` and `statProfileSystem.js`.
2. Update `saveSystem.js` migration and round-trip coverage for any widened lineage/ecology state.
3. Feed release-derived affinity and cohort-shaping context into `lifeSimSystem.js`.
4. Surface the results in Inspect/journal in a way that distinguishes inherited, ecological, and current state.
5. Add an anti-progression soak check so focused release does not become a dominant strategy.
6. Extend wild ecology, genetics, and readability audits.

Primary files:
- `core/progressionManager.js`
- `systems/statProfileSystem.js`
- `systems/lifeSimSystem.js`
- `systems/saveSystem.js`
- `ui/gameUI.js`
- `ui/butterflyCollection.js`

Main risks:
- reintroducing rarity-ladder logic in disguise
- making release effects impossible to understand from the shell

Current live result:
- `progressionManager.js` owns release-batch lineage/zone counts, completed cohort summaries,
  blend-guarded baseline uplift, and release-wave cohort ids
- `gameCore.js` routes release-wave spawns through mild preferred-zone shaping instead of direct
  stat duplication or a new unlock path
- `lifeSimSystem.js`, Inspect, and journal surfaces show batch progress, cohort familiarity,
  preferred root zone, and modifier highlights without becoming the truth owner

Phase close artifacts:
- cohort/ecology feedback summary
- journal/Inspect proof
- widened `w2` and genetics proof

### a6 - Long-Soak Ecology Proof

```text
execution intent
|- treat ecology as frozen only after multi-generation proof
`- stop later layers from building on unstable ecological behavior
```

Current status:
- `live`

Build order:
1. Add ecology-depth soak script and output schema.
2. Add telemetry summaries for zone health, migration health, cohort turnover, and release feedback.
3. Run long soak, inspect failures, tighten thresholds, and re-run.
4. Update docs and source book only after the final green pass.

Primary files:
- `scripts/run-e6-ecology-depth-audit.js`
- `scripts/run-long-soak-generational-audit.js`
- `systems/telemetrySystem.js`
- `docs/`

Main risks:
- hidden collapse loops that short audits miss
- promoting later 3-D or ML on unstable ecology

Phase close artifacts:
- ecology soak artifact set with full multi-seed `e6` proof plus targeted dispersal and wild-ecology regressions
- updated docs
- frozen ecology baseline

## 2B - Later 3-D

### b1 - Physics Ownership Consolidation

```text
execution intent
|- unify dynamic movement resolution before adding richer geometry
`- remove owner ambiguity first, not last
```

Current status:
- `live`

Build order:
1. Keep butterflies choosing intent, but move legalized step commits into `physicsSystem.js`.
2. Route final resolved movement through one owner API instead of direct butterfly-side position writes.
3. Keep zone-border clamp order explicit in `gameCore.js`.
4. Expose a focused-garden budget seam through `telemetrySystem.js` and `physicsSystem.js`.
5. Extend movement and spatial-truth audits so they prove ownership plus budget, not just initialization.

Primary files:
- `systems/physicsSystem.js`
- `core/gameCore.js`
- `entities/butterfly.js`
- `systems/telemetrySystem.js`
- `scripts/run-r1-movement-stability-audit.js`
- `scripts/run-a4-spatial-truth-audit.js`

Main risks:
- double-applying movement or impulses
- breaking current stable motion while refactoring ownership

Phase close artifacts:
- one per-frame motion pipeline
- live `physicsMs` telemetry seam with a `2.5ms physics / 16ms total update` target
- green movement, spatial-truth, and runtime-self audits

### b2 - Collision-Ready Structure Geometry

- `live`

Build order:
1. Normalize opening/interior/roof/column outputs in `structureSystem.js`.
2. Create a clean query seam for `physicsSystem.js`.
3. Replace scattered geometry guesses with structure queries.
4. Extend structure and spatial-truth audits.

Primary files:
- `systems/structureSystem.js`
- `systems/physicsSystem.js`
- `scripts/run-m5-structure-audit.js`

Main risks:
- too many geometry formats
- leaving half the codebase on old point-test logic

Closed state:
- `structureSystem.js` publishes a versioned collision packet for each zone/component with openings, interiors, roofs, walls, and occupancy columns
- `physicsSystem.js` uses and exposes a single structure-query helper for later traversal phases
- structure and spatial-truth audits prove the packet in both shelter fixtures and the live focused-garden baseline

### b3 - Occupancy Bands + Body-Fit Traversal

Build order:
1. Lock discrete occupancy bands and body-fit enums.
2. Lock shared ownership of `verticality`, `structureRole`, `pathState`, and `bodyFit` so later consumers import them instead of redefining them.
3. Add structure-to-physics traversal rules for openings and shelter interiors.
4. Feed those summaries to `lifeSimSystem.js`.
5. Add debug readouts and screenshot-backed proof.

Primary files:
- `systems/physicsSystem.js`
- `systems/structureSystem.js`
- `systems/lifeSimSystem.js`
- `ui/debugUI.js`

Main risks:
- implicit band logic scattered across render/gameplay
- body-fit truth diverging from visible shelter behavior

Closed state:
- `structureSystem.js` is now the single owner for shared spatial semantics, including occupancy bands and the four cross-track hook domains
- opening corridors, interior shelter states, and body-fit outcomes now resolve through the same spatial packet that physics and later ML consumers read
- `run-a4-spatial-truth-audit.js`, `run-r2-zone-transition-audit.js`, `run-m5-structure-audit.js`, and `run-r1-movement-stability-audit.js` now cover the live traversal seam

### b4 - Carry + Stack Physicalization

Build order:
1. Route carry attachment through `physicsSystem.js`.
2. Route stack legality and stability through `structureSystem.js`.
3. Keep object-use flow in `objectSystem.js`, but make it call the new physical seams.
4. Add a dedicated carry/stack physics audit.

Primary files:
- `systems/physicsSystem.js`
- `systems/objectSystem.js`
- `entities/block.js`
- `systems/structureSystem.js`

Main risks:
- introducing sandbox wobble
- accidentally reintroducing retired flower-carry behavior

Closed state:
- `physicsSystem.js` now resolves carry anchors, legal block placements, and unsupported-stack settling through one owner seam
- `structureSystem.js` now treats stacked placement as a support-column legality check instead of a generic overlap failure
- `block.js` and `objectSystem.js` now expose carried / stacked / grounded object truth clearly enough for audits and later debug work
- `run-b4-carry-stack-physics-audit.js`, `run-r7-block-visual-audit.js`, `run-m5-structure-audit.js`, and `run-r1-movement-stability-audit.js` now cover the live carry/stack runtime

### b5 - Impact + Shove Integration

Build order:
1. Add impulse request APIs to `physicsSystem.js`.
2. Change `teachingSystem.js` to request impulse instead of faking displacement.
3. Keep battle results in `battleSystem.js`, but let battle visuals request spatial cues safely if needed.
4. Widen training-physics and battle-presentation audits.

Primary files:
- `systems/physicsSystem.js`
- `systems/teachingSystem.js`
- `systems/battleSystem.js`
- `systems/statusSystem.js`

Main risks:
- battle truth drifting into physics truth
- training/battle both touching the same displacement path unsafely

Closed state:
- the live runtime already used `physicsSystem.applyImpulse(...)` as the garden/training recoil seam, so this phase closed by proving and freezing the owner split rather than widening it again
- `battleSystem.js` remains the battle-truth owner while battle-facing render work continues to consume presentation snapshots only
- `run-p5-training-physics-audit.js`, `run-r5-battle-presentation-audit.js`, `run-single-player-autobattle-audit.js`, and `run-runtime-self-audit.js` prove the split holds on the repaired baseline

### b6 - Visual + Debug Spatial Shell

Build order:
1. Add render-readable spatial summaries.
2. Add debug overlays for occupancy band, shelter state, contact state, and carry anchors.
3. Add player-facing spatial cues only where they improve comprehension.
4. Re-run readability and block-visual audits.

Primary files:
- `core/renderManager.js`
- `ui/debugUI.js`
- `ui/gameUI.js`
- `systems/physicsSystem.js`

Main risks:
- correct logic with misleading visuals
- overloading the player shell with debug detail

Closed state:
- `physicsSystem.js` now publishes a shared spatial summary for occupancy, role, path, body-fit, contact, and carry state
- `renderManager.js`, `ui/debugUI.js`, and `ui/gameUI.js` now read that summary directly so the world cue, debug shell, and Inspect all describe the same live state
- `run-r7-block-visual-audit.js` and `run-r4-ui-readability-audit.js` now prove the visible shell by asserting the summary-backed cues directly

### b7 - Spatial Soak + Save/Load Freeze

Build order:
1. Add long-run spatial soak cases.
2. Verify save/load only persists durable spatial truth.
3. Stress carry, stack, shelter, shove, and travel continuity after reload.
4. Re-run ecology soak on the later 3-D baseline to make sure `b4`-`b7` did not regress `a4`-`a6`.
5. Freeze docs only after stable soak and round-trip results.

Primary files:
- `systems/saveSystem.js`
- `systems/physicsSystem.js`
- `scripts/run-b7-spatial-soak-audit.js`
- `docs/`

Main risks:
- persisting transient physics caches
- long-soak drift that single-scene tests miss

Closed state:
- `systems/saveSystem.js` now keeps durable carry / placement identifiers while rebuilding transient spatial caches during load restoration
- `scripts/run-b7-spatial-soak-audit.js` now freezes the later 3-D layer with save-payload hygiene, post-load continuity, and short-soak proof
- `scripts/run-a4-spatial-truth-audit.js`, `scripts/run-runtime-self-audit.js`, and the full ecology re-soak rerun now confirm the later 3-D closure did not regress `a4`-`a6`

## 3C - Machine Learning

### c1 - Runtime Lock + Offline Training Contract

```text
execution intent
|- remove contract ambiguity before any true model rollout
`- make the ML program implementable and reviewable
```

Build order:
1. Lock runtime choice, artifact format, fallback rules, and trace schema in docs.
2. Lock the shared spatial-hook contract early enough that `b3` does not invent ML-facing seams in a vacuum.
3. Update `mlInferenceSystem.js` config seams to match those docs.
4. Tighten `m1` and `m2` audits around those decisions.

Primary files:
- `systems/mlInferenceSystem.js`
- `docs/COGNITION-ML-CONTRACT.md`
- `docs/ML-IMPLEMENTATION-CONTRACT.md`
- `scripts/run-ml-phase-m1-audit.js`
- `scripts/run-ml-phase-m2-audit.js`

Main risks:
- beginning data/model work against unresolved runtime assumptions

### c2 - Heuristic Trace Capture + Scenario Corpus

Current state:
- live

Build order:
1. Define the trace schema and corpus manifest.
2. Export reproducible traces from audit scenarios.
3. Add hand-corrected labels only where the heuristic is visibly wrong.
4. Add tooling checks that the corpus can be rebuilt.

Primary files:
- `systems/telemetrySystem.js`
- `systems/mlInferenceSystem.js`
- `scripts/`

Main risks:
- unrepeatable data capture
- labels that mix owner truth with UI guesses

Closed state:
- `systems/mlInferenceSystem.js` now exposes corpus-ready garden and battle record builders so audit scenarios can export active traces, heuristic baselines, reviewed labels, and feature snapshots from one owner seam
- `systems/telemetrySystem.js` now profiles ML corpus captures without turning them into save truth
- `scripts/build-c2-trace-corpus.js` now writes the dedicated corpus records + manifest, and both `run-ml-phase-m1-audit.js` and `run-deep-systems-audit.js` now verify family coverage plus manifest rebuild proof

### c3 - Feature Builder V1

Build order:
1. Freeze enum/value encodings.
2. Define which spatial features are safe after `b3` and which remain deferred until the `b7` freeze.
3. Build deterministic feature extraction from owner systems only.
4. Update `saveSystem.js` for model version / trace-summary state if that state becomes durable.
5. Add a trace view that shows the feature groups without dumping raw noise.
6. Extend `m3` and runtime-self audits.

Primary files:
- `systems/mlInferenceSystem.js`
- `systems/lifeSimSystem.js`
- `systems/statProfileSystem.js`
- `core/progressionManager.js`
- `systems/physicsSystem.js`
- `systems/battleSystem.js`
- `systems/saveSystem.js`

Main risks:
- feature duplication
- hidden non-determinism
- unreadable trace surfaces

Closed state:
- `systems/mlInferenceSystem.js` now uses explicit ordered encodings for the live feature contract, adds the `b3` / `b7` spatial tier split, and reports the frozen counts as `14 groups / 94 flat / 116 vec`
- `ui/gameUI.js` now renders compact `Schema` / `Feat` / `Space` rows so the inspect shell can show the feature contract without dumping raw vectors
- `scripts/run-ml-phase-m3-audit.js` now proves exact counts, deterministic rebuilds, readable trace rows, and save/fallback continuity, while `scripts/run-runtime-self-audit.js` carries the post-load ML feature step

### c4 - Model Artifact + Evaluation Harness

Build order:
1. Create versioned local artifact structure in `assets/ml/`.
2. Build evaluation harness against the scenario corpus.
3. Compare model bundle against heuristic baselines by policy family.
4. Refuse rollout if the artifact cannot beat or safely match the baseline in the target cases.

Primary files:
- `assets/ml/`
- `systems/mlInferenceSystem.js`
- `scripts/`

Main risks:
- a model that looks impressive but is less stable than the heuristic
- insufficient evaluation breadth

Closed state:
- the live `m4-garden-policy-v1` artifact now carries explicit artifact/feature/trace/contract metadata instead of relying on ambient config alone
- `run-ml-phase-m4-audit.js` now rebuilds the `c2` corpus, writes a dedicated `artifact-evaluation.json`, and proves the artifact meets threshold gates across garden, communication, ecology, and autobattle coverage
- the reviewed teaching correction now lands as a measurable `actionFamily` win over the heuristic baseline while the ecology return-home case stays on `wander`

### c5 - Runtime Inference Rollout

Build order:
1. Add arbitration between model and heuristic fallback.
2. Roll out one policy family at a time if needed, but keep the external phase label intact.
3. Define and enforce the inference frame-time budget before broad rollout.
4. Re-run communication, autobattle, and closure audits after each rollout step.
5. Keep source path and fallback path exposed in traces.

Primary files:
- `systems/mlInferenceSystem.js`
- `systems/behaviorSystem.js`
- `systems/communicationSystem.js`
- `systems/battleSystem.js`

Main risks:
- silent fallback masking model failure
- regressions that only show in social or battle behavior

Closed state:
- `systems/mlInferenceSystem.js` now keeps live garden and battle policy scoring on the model-backed path, records runtime timing samples, and reports focused-garden / battle budget targets through `getRuntimeSummary()`
- `scripts/run-ml-closure-audit.js`, `scripts/run-r6-communication-audit.js`, and `scripts/run-single-player-autobattle-audit.js` now prove the live rollout, fallback honesty, and frame-budget proof directly
- the final grand-plan short-soak proof now keys off the live `16ms total update` seam rather than a stale pre-expansion threshold

### c6 - Explainability + Inspect/Debug Shell

Build order:
1. Add concise player-facing ML explanation rows.
2. Add richer debug rows for model version, confidence, alternatives, and source path.
3. Make sure explanations always point back to owner truth rather than vague story text.
4. Extend readability and ML closure audits.

Primary files:
- `ui/gameUI.js`
- `ui/debugUI.js`
- `systems/mlInferenceSystem.js`

Main risks:
- decorative explanations that do not match the actual trace
- debug clarity collapsing under too much raw information

Closed state:
- `systems/mlInferenceSystem.js` now builds concise explainability summaries from the live policy weights and feature values instead of decorative story text
- `ui/gameUI.js` now surfaces `Path` and `Why`, while `ui/debugUI.js` now renders a shared explainability snapshot with artifact path, confidence, alternatives, driver features, and budget lines
- `scripts/run-ml-closure-audit.js` and `scripts/run-r4-ui-readability-audit.js` now prove the explainability shell end to end

### c7 - Soak + Regression Freeze

Build order:
1. Run long-soak ML scenarios with fallback interruptions.
2. Verify save/load continuity of version ids and trace summaries.
3. Check performance budgets and regression budgets.
4. Freeze the ML baseline only after the long-run gate is repeatably green.

Primary files:
- `systems/saveSystem.js`
- `systems/telemetrySystem.js`
- `scripts/`
- `docs/`

Main risks:
- performance regressions
- behavior drift over long runs
- fallback path rot

Closed state:
- `scripts/run-runtime-self-audit.js` now proves post-load ML explainability rows, budget targets, and the shared debug snapshot
- `scripts/run-long-soak-generational-audit.js` now proves the model-backed path stays live through soak checkpoints instead of degrading into silent fallback
- `scripts/run-final-grand-plan-audit.js` now passes cleanly on the frozen expansion baseline

## Review Checklist Before Starting Any Phase

```text
pre-flight
|- is the owner of durable truth explicit?
|- is the save/load boundary explicit?
|- is there a debug-truth surface?
|- is there at least one audit to widen or add?
|- is the exit gate concrete?
`- does the phase avoid reopening already-frozen baseline work?
```

## Review Checklist Before Closing Any Phase

```text
phase close
|- target phase audits green
|- shared regression gate green
|- visible states match debug truth
|- docs updated
|- source book rebuilt
`- next downstream phase still makes sense after the observed results
```

## Historical First Execution Packet

If I were starting immediately, I would begin with:

```text
c1 runtime + training contract lock
|- lock runtime / artifact / trace / fallback rules
`- lock shared hook ownership before b3 and c3 broaden consumers

a1 zone signatures + pressure state
|- add durable zone ecology state
|- add save migration + round-trip proof
|- add zone summary APIs
|- wire life-sim consumption
|- add debug proof
`- widen a3/w3 audits
```

That is the safest first packet because it:

- improves the garden immediately
- removes contract ambiguity before later 3-D and ML reserve new seams
- has a narrow blast radius
- supplies clean inputs to both later 3-D and later ML
- does not require reopening battle or player-shell foundations
