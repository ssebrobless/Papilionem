# Claude Review: Papilionem Stabilization Phase Plan (2026-04-28)

Reviewed plan: `docs/PAPILIONEM-STABILIZATION-PHASE-PLAN-2026-04-28.md`
Review pass: 2026-04-28
Working tree: branch `codex/milestone-freeze-playtest` (15 ahead / 1 behind `origin/game-development`)

## TL;DR

```text
verdict
|- Phase 0 (harness correctness)        -> KEEP, sharpen, do this first
|- Phases 1-4 (spatial rebuild)         -> REJECT framing, replace with named-contradiction triage
|- Phase 5 (clarify ML)                 -> REJECT framing, the work is already locked in COGNITION-ML-CONTRACT
|- Phase 6 (life-sim causality)         -> REJECT framing, all 14 families are live; reopen only legibility/breadth
|- Phase 7 (emergent scenario proofs)   -> REPLACE with the existing g1-g8 goal-alignment ladder
`- Phase 8 (perf + polish lock)         -> REPLACE with the existing c8 -> c9 -> c10 -> c11 closure ladder
```

The plan correctly diagnoses one urgent and novel problem (the post-`a72a157` harness is not yet trustworthy) and then over-extrapolates that surprise into a full re-foundation of the game. Most of what it proposes to "establish" is already locked. The actual remaining work is captured by the active completion ladder, the goal-alignment packet, and a small set of named-contradiction reopens.

## What I Verified Directly

```text
verified by reading source on 2026-04-28
|- sketch.js installPapilionemHarness()
|  |- noLoop() is called (line 108)
|  |- stepFrame() calls gameCore.update() + gameCore.draw() directly (110-113)
|  |- p5 frameCount does NOT advance through stepFrame
|  `- scatterButterflies only mutates butterfly.x / butterfly.y (216-231)
|    `- gridPos, movement target, physics state, and ButterflyStore proximity grid stay stale
|- core/butterflyStore.js
|  |- ProximityGrid keys rebuild on (frame, bucketLength) (38-40)
|  |- _currentFrame() returns frameCount directly (217-218)
|  |- with frozen frameCount, grids will not rebuild between harness ticks
|  |  unless bucket length changes (i.e. an entity entered or left the zone)
|  `- invalidateGrid(zoneId) exists but no scatter / teleport path calls it
|- core/gameCore.js, core/renderManager.js, core/progressionManager.js,
|  systems/communicationSystem.js, systems/physicsSystem.js,
|  systems/lifeSimSystem.js, systems/teachingSystem.js,
|  systems/breedingSystem.js, systems/mlInferenceSystem.js,
|  systems/structureSystem.js, systems/objectSystem.js,
|  systems/specialEffects.js, systems/colorPool.js, systems/eventBus.js,
|  systems/zoneSystem.js, systems/telemetrySystem.js
|  `- 16 files read frameCount directly; harness ticks expose all of them
`- scripts/bench.js
   `- page errors / console errors are warned after persistDigest, never affect exit code (218-225)
```

All four Phase 0 risks named in the plan are real. The Phase 0 fix list is correct in shape; it needs sharpening, not expanding.

## What I Verified About The Existing Planning Layer

The reviewed plan reads as if no foundation work has landed. The repository tells a different story:

```text
|- spatial unification s0..s8           -> live (frozen)
|  |- SPATIAL-UNIT-CONTRACT.md           -> 1 block = 1 board unit = 1 support/stack unit, locked
|  |- CURRENT-SPATIAL-TRUTH.md           -> grounded pseudo-3D, NOT volumetric, locked
|  |- ENTITY-FOOTPRINT-UNIFICATION-AUDIT -> family footprint registry owns radii/clearance, closed
|  |- BLOCK-PLACEMENT-SUPPORT-UNIFICATION-AUDIT
|  |   `- openings, columns, scatter spacing, safe-drop, lift all read one block unit, closed
|  |- DOORWAY-CORRIDOR-ALIGNMENT-AUDIT   -> corridor-owned anchors, closed
|  `- SHARED-INTERACTION-SPACE-RECONCILIATION-AUDIT -> butterflies, flowers, eggs, cocoons share
|     the widened interaction space, closed
|
|- runtime visual-first v0..v8a          -> live
|  `- c8 runtime-only proof frozen on the lived-in save 2026-04-26
|
|- social cognition n0..n8               -> live (jointly signed at schemaVersion=4)
|  `- LIFESIM-EXPRESSION-AUDIT shows all 14 cognition families
|     (drives, emotions, memories, social edges, social summary, routines,
|      interpretation, communication, social ecology, distortion, genetics,
|      upbringing, lifecycle, derived cognition) as `live`, behavior-driving,
|      inspectable, and audit-proved
|
|- ML / cognition c1..c7                 -> live
|  |- COGNITION-ML-CONTRACT.md           -> ML scores choices, never owns durable state
|  |- ML-IMPLEMENTATION-CONTRACT.md      -> first runtime locked to "local static policy artifact"
|  |- 14 feature groups / 98 flat / 124 vec, garden + battle policies live, fallback proved
|  `- the static linear-policy JSON is the LOCKED first runtime, not a thing to be honest about;
|     ONNX is explicit later optional replacement work
|
|- goal-alignment ladder g1..g8          -> active
|  |- Stage A (g1 spatial / g2 building / g3 movement) is the live acceptance work
|  |- Stage B (g4 social breadth / g5 dialogue / g6 ML value) starts in parallel
|  `- Stage C (g7 v8b full-stack / g8 outside-session) is the closure gate
|
`- composed benchmark workflow            -> live
   `- COMPOSED-BENCHMARK-HARNESS-WORKFLOW + COMPOSED-BENCHMARK-BASELINE-2026-04-27 are the
      runtime reality reference; single-zone-122 / -200 / block-carry-active / flower-feed-storm
      are the named lanes
```

**The frozen-board reopening rule is explicit (memory and `GOAL-ALIGNMENT-REVIEW-PACKET.md`):**

> Frozen child boards (`v0-v8a` runtime, `s0-s8` spatial, `n0-n8` social) are not to be reopened without a named contradiction.

The reviewed plan reopens all three of those tracks at once, with no named contradiction other than the user's intuition that the foundations may not have nailed it. That intuition is worth taking seriously, but the right response is **named-contradiction triage**, not a re-foundation.

## Where The Plan's Diagnosis Is Right

```text
correct
|- the harness is NOT yet trustworthy (Phase 0 risks are real)
|- the COMPOSED-BENCHMARK-BASELINE-2026-04-27 records a real named contradiction
|  `- single-zone-122 reality lane is at 172.5ms p50 vs the older scenario note's 83ms p50
|     (this is a runtime regression, surfaced AFTER the harness was written)
|- the working tree is dirty with many modified core files plus a g2 proof script in flight
|  `- a stabilization pass on what is in flight is appropriate
`- the user's underlying instinct "do not declare anything done by audit-only evidence" matches
   GOAL-ALIGNMENT-REVIEW-PACKET's own self-criticism: "system exists -> one audit passed ->
   assume done" is the false-positive pattern the entire goal-alignment ladder was built
   to guard against
```

## Where The Plan Drifts

```text
drift
|- restates the spatial / 3D question as if `CURRENT-SPATIAL-TRUTH.md` does not exist
|  `- the answer "grounded pseudo-3D, not volumetric" is already locked
|- treats `ML scoring is static linear policy JSON` as a problem to be honest about
|  `- the static policy artifact IS the locked first runtime; ONNX is later optional work
|- proposes drive/memory/relationship lists that don't match the locked families
|  |- proposed drives:        hunger, safety, curiosity, attachment, fatigue, social comfort,
|  |                          nesting/building
|  `- locked drives (n1):     selfMaintenance, safetyAvoidance, resourceControl, socialConnection,
|                             caregiving, exploration, statusExpression, rest
|  `- this would be exactly the renamed-by-drift pattern that SOCIAL-FAMILY-LOCK was created to prevent
|- proposes Phase 7 emergent scenarios (pair bonding, avoidance, builder tendency, social repair,
|  migration, group behavior, save/load continuity)
|  `- these scenarios already exist in g4 / g5 / g6 acceptance work and the n2..n8 audits
|- proposes Phase 8 perf lock without referencing the live composed benchmark workflow,
|  the v8a frozen baseline, or the c10 / c11 closure gates that already define the perf lock
```

## Direct Answers To The Plan's Review Questions

### 1. Is the phase order correct?

Half. The harness fix (Phase 0) is correctly first. The rest of the order is wrong because it presupposes a re-foundation that the locked contracts already accomplish. The right order, integrated with the existing planning layer, is:

```text
revised order
|- P0  proof-foundation correctness (harness)
|- P0.5 re-baseline composed bench on the fixed harness
|- P1  named-contradiction triage (one ticket per visible symptom against the frozen audit it touches)
|- P2  resume Stage A goal-alignment closure (g1 + g2 + g3 + g0-bar precondition)
|- P3  Stage B (g4 ambient social breadth + g5 dialogue naturalness + g6 ML cost-vs-value)
|- P4  Stage C (g7 v8b full-stack migrated-save proof + g8 outside-session + public alpha freeze)
```

### 2. Are any phases too large or missing sub-phases?

Yes. Phase 0 in the original plan packs four corrections into one bullet list. It should be split because the order matters and because frame-clock plumbing changes the meaning of every later test:

```text
P0.a  introduce gameState.currentFrame
      |- increment in gameCore.update() at the head of the tick
      |- expose getRuntimeQueryFrame() routed through gameState.currentFrame
      `- harness step path advances it; the p5 draw path also advances it
P0.b  migrate frame-cadence reads off raw frameCount
      |- proximity grid (butterflyStore.js _currentFrame)
      |- structureSystem / lifeSimSystem / mlInferenceSystem / communicationSystem
      |  /  teachingSystem / objectSystem cadence reads
      `- leave purely-cosmetic uses (sprite anims, render-only counters) on frameCount
P0.c  unify post-position-mutation invalidation
      |- ButterflyStore.afterTeleport(butterfly, prevZoneId) helper
      |  -> resets butterfly.gridPos, movement target, physics velocity / impulse,
      |     and calls invalidateGrid(prevZoneId) + invalidateGrid(currentZoneId)
      |- harness scatter calls it
      |- gameCore zone-travel commit calls it
      `- save-load entity rehydration calls it
P0.d  bench.js exit-on-error
      |- page errors and console errors set a non-zero exit unless --allow-errors is passed
      |- the digest still writes (so the artifact is captured for triage)
      `- existing scenarios that legitimately log allowed warnings get an explicit allow-list
P0.e  re-run the composed packet
      |- single-zone-122, single-zone-200, block-carry-active, flower-feed-storm
      |- record digests in qa_logs/bench/composed_baseline_post_p0/
      `- write COMPOSED-BENCHMARK-BASELINE-2026-04-29.md (or the next dated baseline) ONLY
         after P0.a..P0.d are landed; do not promote a baseline taken on the broken harness
```

Phase 0 is the only phase that needs sub-phases. Everything else collapses into existing tickets.

### 3. Should the spatial target stay rigorous 2.5D, or move to deeper internal 3D?

**Stay 2.5D (grounded pseudo-3D, with derived occupancy/support/lift).** This is already the locked decision in `CURRENT-SPATIAL-TRUTH.md` and `LATER-3D-PHYSICS-IMPLEMENTATION-PLAN.md`. The locked model already covers what the original plan calls a "spatial-contract gap":

```text
already locked
|- 1 block = 1 board unit = 1 support/stack unit
|- per-zone roam polygon + placement region + doorway anchors
|- entity footprint registry for radii / clearance
|- structureSystem owns derived static truth (occupancy columns, openings, interiors,
|  body-fit, support, valid placement geometry)
|- physicsSystem owns dynamic truth (contacts, impulses, separation, final clamps)
|- gameCore owns zone clamps + travel orchestration
|- renderManager is presentation-only
`- explicit non-goals: free-flight volume, rigid-body airborne motion, separate altitude-band
   habitat, broad gravity, sandbox 3D
```

If "blocks look like they overlap" is real, that is a contradiction against `r7_block_visual_audit` and `b4_carry_stack_physics_audit`, not a request for volumetric 3D. The right move is a tiny named-contradiction reopen of those audit lanes with a fresh capture, not a new spatial track.

### 4. What is the smallest elegant spatial contract that can support the intended game?

It exists. It is roughly four pieces:

```text
canonical spatial contract (already in repo)
|- unit          -> 1 block = 1 board unit = 1 support/stack unit  (SPATIAL-UNIT-CONTRACT.md)
|- zone          -> per-zone roam polygon + placement region + doorway anchors  (config + gameCore)
|- footprint     -> family footprint registry (radius, width, clearance, lift band)
|                   for butterflies / flowers / eggs / cocoons / caterpillars / blocks
|                   (ENTITY-FOOTPRINT-UNIFICATION-AUDIT)
`- ownership     -> structureSystem (derived static) + physicsSystem (dynamic) +
                    gameCore (zone clamp / orchestration), renderManager presentation-only
                    (CURRENT-SPATIAL-TRUTH.md ownership summary)
```

The right smallness check is "do these four pieces explain every spatial decision in the codebase?" If yes, do not invent a fifth. Today the answer is yes — the seams that still exist (e.g., structure spacing derives from `block.renderWidth` transitionally) are explicitly tolerated transitional seams, not contract gaps.

### 5. Are the proposed harness fixes sufficient?

Almost. The four bullets in the original Phase 0 are correct. Three additions are needed:

```text
add to Phase 0
|- a single afterTeleport / afterPositionMutation hook on ButterflyStore
|  `- so scatter, save-load rehydrate, zone-travel commit, and god-mode spawn all reset the
|     same invariants in one place (sketch.js scatter is just the first caller)
|- a determinism check on gameState.currentFrame
|  `- harness wraps the simulation seed; advancing currentFrame must be deterministic so
|     two harness runs at the same seed produce identical frame-stamped traces
`- a "harness-trustworthy" gate file under qa_logs/bench/
   `- a small report from each composed lane that asserts:
      (a) gameState.currentFrame advanced by exactly captureFrames + warmupFrames
      (b) ButterflyStore.debugStats().gridRebuilds is non-zero in stress lanes (proves the
          grid is actually rebuilding)
      (c) bench.js page-error count is 0 (or matches the explicit allow-list)
```

### 6. Are there missing acceptance tests, debug overlays, or proof artifacts?

The proposed Phase 1 / Phase 3 debug overlays (zone ground plane, placement region, occupied footprints, depth bands, anchor points, support columns) are **partly redundant** with the existing debug/spatial-focus shell, but a single "spatial truth overlay" toggle that visualizes the four canonical contract pieces is genuinely useful for `g1` acceptance and would not contradict any frozen audit. Recommend folding it into `g1_spatial_acceptance_sweep` as an acceptance aid, not a new system.

Specific proof-artifact gaps to add:

```text
add
|- harness-trustworthy gate file (see Q5)
|- post-P0 composed baseline, dated 2026-04-29 or later
|- a g0-bar precondition signoff for what "lived-in" / "ordinary play" / "long free play"
|  actually means as a duration / observer / signoff format
|  (this gap is already noted in GOAL-ALIGNMENT-REVIEW-PACKET; the Codex plan inherits it
|   silently and should make it explicit)
`- a pinned `before / after` capture for any reopen ticket from Q7
```

### 7. Is the life-sim causality plan concrete enough to avoid becoming more conditional spaghetti?

No, but it also doesn't need to be — because **the locked contracts already prevent that drift, and the work the original Phase 6 proposes is already done**. The cleaner question is "where does `behavior still feels rule-driven` become a named contradiction?"

The honest list of remaining causality work is small and is already named in `GOAL-ALIGNMENT-REVIEW-PACKET`:

```text
remaining causality work
|- ambient social breadth in long free play     (g4)
|- dialogue naturalness / repetition tolerance  (g5)
|- ML cost-vs-value in long free play           (g6, with cost gate from runtime caveat)
`- v8b full-stack migrated-save proof           (g7)
```

Reopening a "Phase 6: life-sim causality" with new drive names would:

```text
violations
|- contradict the SOCIAL-FAMILY-LOCK n1 contract
|- contradict the LIFESIM-EXPRESSION-AUDIT closure (all 14 families live)
|- create exactly the renamed-drift the planning layer is designed to prevent
`- not move g4 / g5 / g6 closer to closure
```

### 8. What should be the exact first implementation task?

`P0.a — introduce gameState.currentFrame`. Smaller than the original Phase 0's "add or formalize a game-owned frame clock" because it deliberately scopes itself to one file change and one new field, with no system migrations yet:

```text
P0.a deliverable
|- core/gameCore.js
|  |- gameState.currentFrame initialized to 0 in setup
|  |- gameCore.update() increments it at the head of the tick (before any system update)
|  |- export gameCore.getCurrentFrame() that returns gameState.currentFrame
|  `- KEEP getRuntimeQueryFrame() returning frameCount for now (do not migrate yet)
|- a tiny script qa_logs/bench/probes/probe-frame-clock.js (or extend an existing harness
|  smoke probe) that runs the harness for 100 ticks and asserts gameState.currentFrame
|  ended at 100 in both noLoop harness mode and the live p5 draw path
`- no other system migrations in this commit
```

This is roughly a 30-line change. P0.b begins migrating cadence reads to `gameCore.getCurrentFrame()` only after P0.a lands and the probe is green.

### 9. Are there existing files / docs that should be updated, merged, or deprecated before implementation starts?

```text
read before starting (load order)
|- ACTIVE-PLAN-REGISTRY.md
|- ACTIVE-COMPLETION-BOARD.md
|- GOAL-ALIGNMENT-REVIEW-PACKET.md
|- COMPOSED-BENCHMARK-HARNESS-WORKFLOW.md
|- COMPOSED-BENCHMARK-BASELINE-2026-04-27.md
|- CURRENT-SPATIAL-TRUTH.md
|- SPATIAL-UNIT-CONTRACT.md
|- COGNITION-ML-CONTRACT.md
|- ML-IMPLEMENTATION-CONTRACT.md
|- LIFESIM-EXPRESSION-AUDIT.md

update after P0 lands
|- COMPOSED-BENCHMARK-BASELINE-2026-04-27.md
|  `- supersede with COMPOSED-BENCHMARK-BASELINE-<post-P0 date>.md
|     (do not rewrite the 2026-04-27 doc; it is the pre-fix reference)
|- ACTIVE-PLAN-REGISTRY.md
|  `- add this review document and the new baseline to "Goal-Alignment Companions"

do NOT deprecate
|- any frozen audit doc (s0..s8, v0..v8a, n0..n8, c1..c8) without a named contradiction
|- LATER-3D-PHYSICS-IMPLEMENTATION-PLAN.md (it is correctly future-facing)
|- the original PAPILIONEM-STABILIZATION-PHASE-PLAN-2026-04-28.md (it is the input to this review)

deprecate / supersede only after P0
`- the "Phase 1 / Phase 3 debug overlays" wording in the original plan, replaced by a single
   spatial-truth overlay toggle folded into g1
```

## Risks And Constraints For The Implementer

```text
hard constraints
|- one-owner-per-truth: ML scores choices, never owns durable state (feelings, memories,
|  bonds, lineage, drives, emotions, social edges, genetics, lifecycle)
|- frozen child boards must not reopen without a named contradiction
|- long-running saves are sacred; do not wipe to simplify acceptance
|- success target: "believable butterfly society", NOT "indistinguishable from real humans"
|- the canonical spatial unit is locked: 1 block = 1 board unit = 1 support/stack unit
|- the locked first ML runtime is the local static policy artifact; ONNX is later optional
`- harness rule: do not promote a benchmark baseline taken on the broken harness

operational constraints
|- the working tree is dirty (modified core files + g2 proof script). Decide BEFORE Phase 0
|  whether to:
|    (a) commit / branch the in-flight changes,
|    (b) stash and start P0 from a clean tree, or
|    (c) thread P0 through the in-flight branch as additional commits
|  Option (a) or (b) is preferred so the harness fix is bisectable on its own.
|- 16 files read frameCount directly. Migrate cadence reads in P0.b incrementally; visual /
|  cosmetic uses (animation phase, sparkle counters) can stay on frameCount.
|- bench.js exit-on-error change is a CI-shape change; check if any external runner depends
|  on the current "exit 0 with warnings" behavior before promoting.
|- the renamed-drift risk: do NOT introduce new drive / memory / relationship vocabulary in
|  any P0..P4 work without first amending SOCIAL-FAMILY-LOCK and citing the named contradiction
|  that justifies the rename.

risk register
|- "harness fixes change observed performance" -> EXPECTED. The current baseline numbers are
|  partly artifacts of frame-stuck cadence + stale proximity grid. Do not chase pre-fix
|  numbers; capture a fresh baseline.
|- "scatter rebuild changes butterfly behavior in real play" -> mitigate by routing the
|  shared afterTeleport hook through ButterflyStore so save-load and zone-travel are
|  exercised by the same path (and proven by r2 zone transition + a4 spatial truth audits).
|- "broad debug overlay introduces render cost" -> ship as default-off; reuse the existing
|  debug-shell pattern rather than adding a parallel rendering layer.
`- "Phase 1 named-contradiction triage discovers a real spatial fault" -> good. Open the
   reopen ticket against the specific frozen audit (e.g. r7_block_visual_audit), not against
   the spatial unit contract.
```

## Acceptance Bar For This Stabilization Pass

The whole stabilization pass closes when ALL of the following hold:

```text
closure
|- harness is trustworthy
|  |- gameState.currentFrame advances exactly per tick in both harness and live draw paths
|  |- proximity grid rebuilds on movement, not only on bucket-length change
|  |- scatter / teleport / spawn / migrate all route through one afterTeleport hook
|  `- bench.js exit code reflects page-error / console-error state
|- composed baseline is fresh
|  |- single-zone-122 / -200 / block-carry-active / flower-feed-storm have post-P0 digests
|  `- the 2026-04-27 baseline is preserved as the pre-fix reference, not overwritten
|- named-contradiction triage is empty or reopened cleanly
|  |- each visible symptom (block overlap, behavior feels rule-driven, etc.) either:
|  |    (a) resolves with a fresh capture against its existing audit lane, or
|  |    (b) is opened as a named contradiction with a tiny scoped reopen
|  `- no new track is opened that competes with a frozen contract
|- Stage A acceptance is unblocked
|  `- g1 / g2 / g3 can re-run and signoff against the fresh harness without harness-shape
|     blockers
`- Phase 6 / Phase 7 are not opened as construction work
   `- ambient social breadth and dialogue naturalness work happens through g4 / g5,
      not through a renamed life-sim track
```

## Recommended Sequencing Detail

```text
week 1 (P0)
|- P0.a gameState.currentFrame              (single small commit)
|- P0.b migrate cadence reads               (one commit per consumer; visual frameCount kept)
|- P0.c afterTeleport hook + scatter fix    (one commit; r2 + a4 stay green)
|- P0.d bench.js exit-on-error              (one commit; existing allowlist if needed)
|- P0.e re-run composed baseline            (write COMPOSED-BENCHMARK-BASELINE-<date>.md)

week 2 (P1)
|- one named-contradiction ticket per visible symptom; each reopens at most one frozen
|  audit lane and produces (before, after) capture
|- if no symptoms remain after P0.e, P1 is empty and the stabilization pass closes here

week 3+ (P2..P4)
`- resume the existing g1..g8 ladder; this stabilization plan does not own that work
```

## What This Review Did Not Re-Decide

```text
not re-decided
|- the spatial target (still grounded pseudo-3D, locked)
|- the canonical spatial unit (still 1 block = 1 board unit = 1 support/stack unit, locked)
|- the ML runtime shape (still local static policy artifact, locked; ONNX later optional)
|- the locked drive / emotion / memory / relationship families (still per n1, locked)
|- the success target ("believable butterfly society", locked)
|- the order of g1..g8 (the prior 2026-04-26 Claude review already pressure-tested it)
`- the v8a runtime-only proof (frozen)
```

If any of these need to change, that requires an explicit named contradiction in its own document, not a side effect of stabilization work.

## Closing Note

The most generous read of the original Phase Plan is that it is a perfectly reasonable plan **for a project that did not yet have a planning layer**. Papilionem already has one, and a thorough one. The harness regression is the right pressure point to act on; everything else in the plan should be replaced by either the existing goal-alignment ladder or a small set of named-contradiction reopens. Doing it that way preserves the discipline that made the spatial / social / runtime contracts hold up.
