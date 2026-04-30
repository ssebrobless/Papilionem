# Papilionem Stabilization Phase Plan

Date: 2026-04-28
Repo: `C:\Users\fishe\Documents\projects\ephemera`
Branch reviewed: `codex/milestone-freeze-playtest`

## Purpose

This document is a concrete implementation plan for stabilizing the game before deeper feature expansion. It is intended to be reviewed by Claude Code, then returned to Codex for phase-by-phase implementation.

The core question is whether the current game has truly nailed down:

- the 2.5D / 3D spatial model,
- the neural-network or ML decision layer,
- the life-simulation layer for believable butterfly behavior,
- the new deterministic benchmark harness and proof workflow.

Current conclusion: the project has meaningful foundations in all of these areas, but none of the major pillars should be considered closed yet.

```text
╔══════════════════════╦════════════════════════════════════════════╗
║ Area                 ║ Current read                               ║
╠══════════════════════╬════════════════════════════════════════════╣
║ Git state            ║ Up to date with milestone/harness branch    ║
║                      ║ 0 ahead / 0 behind origin/codex/...         ║
║                      ║ 15 ahead / 1 behind origin/game-development ║
║                      ║ Missing there appears to be README-only      ║
╠══════════════════════╬════════════════════════════════════════════╣
║ Harness              ║ Useful, but not trustworthy until patched    ║
║                      ║ Frame clock, scatter, stale grid, page errs  ║
╠══════════════════════╬════════════════════════════════════════════╣
║ Spatial model        ║ Real 2.5D foundation, not true internal 3D   ║
║                      ║ Screen-space zones + stack/support semantics ║
╠══════════════════════╬════════════════════════════════════════════╣
║ Neural / ML layer    ║ Static linear policy JSON + heuristics       ║
║                      ║ Not currently a neural network runtime       ║
╠══════════════════════╬════════════════════════════════════════════╣
║ Life simulation      ║ Drives/emotions/memory/relationships exist   ║
║                      ║ Visible behavior still largely rule-driven   ║
╚══════════════════════╩════════════════════════════════════════════╝
```

## Current Repo State To Consider

As of the review pass:

- `HEAD` is `56c9a4f Add per-stage physics breakdown + scatterButterflies bench knob`.
- `HEAD...origin/codex/milestone-freeze-playtest` is `0 0`.
- `HEAD...origin/game-development` is `15 1`.
- Recent commits include:
  - `56c9a4f Add per-stage physics breakdown + scatterButterflies bench knob`
  - `34d1c6d Add composed bench scenarios that reproduce real-play cost`
  - `7bc32e8 Surface per-system breakdown in bench digests + add CPU profile capture`
  - `f4335e6 Add proximity API on ButterflyStore + ProximityGrid scaffolding`
  - `7f9a6da Replace zone-cache band-aid with ButterflyStore sidecar index`
  - `404729c Cache getButterfliesInZone per frame to soften the cliff`
  - `a72a157 Add deterministic perf benchmark harness`

The workspace also has many modified files and untracked benchmark/docs artifacts. A reviewer should not assume the working tree is clean.

Important modified areas include:

- `core/butterflyStore.js`
- `core/config.js`
- `core/gameCore.js`
- `core/renderManager.js`
- `entities/butterfly.js`
- `systems/communicationSystem.js`
- `systems/physicsSystem.js`
- `systems/structureSystem.js`
- `systems/telemetrySystem.js`
- `scripts/run-g2-live-building-behavior-proof.js`
- several docs and `qa_logs/bench/...` artifacts

## Known Correctness Risks From Recent Review

These are the highest-priority issues because they affect whether benchmark or proof artifacts can be trusted.

```text
┌─ Harness / Proof Risks
│
├─ P1: Harness ticks freeze the frame clock
│  ├─ `sketch.js` enters `noLoop()`
│  ├─ harness then calls `gameCore.update()` / `gameCore.draw()` directly
│  ├─ p5 `frameCount` does not advance through that path
│  └─ systems using `frameCount` can behave differently from real play
│
├─ P2: `scatterButterflies` leaves spatial state stale
│  ├─ only `x` / `y` are rewritten
│  ├─ `gridPos`, movement target, physics state, and proximity grid stay stale
│  └─ scattered benchmarks can snap or drift back toward old coordinates
│
├─ P2: Proximity grid can reuse stale positions
│  ├─ grid rebuild is keyed mostly by frame and bucket length
│  ├─ positions can change after an earlier same-frame proximity query
│  └─ later proximity calls may observe old positions
│
└─ P2: `scripts/bench.js` succeeds despite page errors
   ├─ page errors / console errors are warned after digest write
   └─ CI or manual compare may accept broken captures as evidence
```

## Current Architectural Assessment

### Spatial / 3D

The game should be treated as a 2.5D isometric/painterly world unless the team explicitly chooses a larger rewrite.

The current model has real spatial concepts:

- screen-space roam and placement polygons,
- zone screen regions,
- block stack indices,
- support checks,
- occupancy bands such as ground / stacked / overhead,
- `zLift`,
- body fit and structure role semantics,
- collision and clearance checks,
- structure profiles and shelter-like interpretations.

But it does not appear to have a true internal 3D grid or full volume occupancy model. That means a concern like "blocks look like they overlap" is plausible and should be treated as a spatial-contract gap, not merely a rendering polish issue.

The likely target is a rigorous 2.5D model:

```text
Background art
     │
     ▼
Per-zone ground plane calibration
     │
     ▼
Shared placement / movement / occupancy surface
     │
     ├── flowers
     ├── butterflies
     ├── eggs / cocoons / caterpillars
     └── blocks / structures
             │
             ▼
Support, collision, draw depth, and visual anchoring
```

### Neural / ML

The current system should not be described as a completed neural network layer.

The current implementation appears closer to:

- a local static policy artifact,
- linear-policy JSON scoring,
- heuristic fallback,
- debug/trace affordances,
- a future-facing contract that could later support ONNX or another runtime.

That can still be useful, but the project should be honest about the current layer: it is a policy scoring interface, not yet a rich neural cognition system.

### Life Simulation

The game has meaningful life-sim state containers:

- drives,
- emotions,
- memories,
- relationship/social edges,
- routines,
- genetics/migration hooks,
- communication/social systems,
- derived behavior biases.

However, visible butterfly behavior still appears largely authored through state machines, score formulas, and conditional rules. This is not inherently bad, but the current behavior should not yet be described as deeply emergent or human-like.

The desired next evolution is causal continuity:

```text
Event
  ▼
Memory
  ▼
Emotion / drive shift
  ▼
Relationship change
  ▼
Future decision bias
  ▼
Visible behavior
  ▼
New event
```

The important test is whether a butterfly's past visibly changes what it does later.

## Proposed Phase Plan

```text
╔══════════╦══════════════════════════════╦════════════════════════╦════════════╗
║ Phase    ║ Goal                         ║ Exit Gate              ║ Priority   ║
╠══════════╬══════════════════════════════╬════════════════════════╬════════════╣
║ 0        ║ Clean proof foundation       ║ Harness can be trusted ║ Immediate  ║
║ 1        ║ Define spatial contract      ║ One source of truth    ║ Immediate  ║
║ 2        ║ Fix 2.5D world alignment     ║ Objects sit correctly  ║ High       ║
║ 3        ║ Fix occupancy / overlap      ║ Blocks read as solid   ║ High       ║
║ 4        ║ Make movement spatially true ║ Butterflies don't snap ║ High       ║
║ 5        ║ Clarify ML layer             ║ Honest policy runtime  ║ Medium     ║
║ 6        ║ Upgrade life-sim causality   ║ State causes behavior  ║ High       ║
║ 7        ║ Prove emergent scenarios     ║ Repeatable acceptance  ║ High       ║
║ 8        ║ Performance + polish lock    ║ Playable at target     ║ Final gate ║
╚══════════╩══════════════════════════════╩════════════════════════╩════════════╝
```

## Phase 0: Proof Foundation

Goal: make the benchmark harness and proof artifacts trustworthy before relying on them.

Tasks:

1. Add or formalize a game-owned frame clock, likely `gameState.currentFrame`.
2. Make harness ticks advance the game-owned frame clock.
3. Replace core-system reliance on p5 `frameCount` where deterministic harness behavior matters.
4. Fix `scatterButterflies` so every spatial representation updates together:
   - `x`
   - `y`
   - `gridPos`
   - movement target / intent
   - physics state
   - proximity-grid invalidation
5. Add proximity-grid invalidation or a movement/version counter whenever butterfly positions change.
6. Make `scripts/bench.js` exit nonzero on page errors and console errors unless an explicit allow-errors flag is passed.
7. Re-run the composed benchmark packet after fixes.

Exit gate:

- harness behavior and real-play behavior use the same frame semantics,
- scatter and spawn paths do not leave stale spatial state,
- page-level errors cannot silently pass as valid evidence,
- fresh benchmark digests exist after the harness patch.

## Phase 1: Spatial Contract

Goal: establish one spatial truth that placement, movement, collision, support, and rendering all query.

Tasks:

1. Explicitly decide the world target:
   - recommended: rigorous 2.5D isometric / painterly spatial model,
   - avoid: pretending the existing game has true 3D volume simulation.
2. Define a shared spatial schema for each zone:
   - walkable polygon,
   - placement polygon,
   - visual depth range,
   - forbidden regions,
   - doorway lanes,
   - depth/draw-order rules.
3. Define a shared spatial schema for each object type:
   - visual anchor,
   - ground footprint,
   - collision footprint,
   - height / stack behavior,
   - draw-depth rule,
   - interaction reach,
   - carry/cover behavior.
4. Identify and remove competing assumptions across:
   - rendering,
   - physics,
   - structure placement,
   - flower placement,
   - butterfly movement,
   - save/load reconstruction,
   - benchmark scenario setup.
5. Add debug overlays for:
   - zone ground plane,
   - placement region,
   - occupied footprints,
   - depth bands,
   - anchor points,
   - support columns.

Exit gate:

- every spatially relevant system reads from the same contract,
- no major object class has ad hoc placement/rendering offsets outside the contract.

## Phase 2: 2.5D World Alignment

Goal: make objects visually belong to the background.

Tasks:

1. Calibrate each zone's ground plane against the current background art.
2. Verify object anchor points against that ground plane:
   - flowers,
   - butterflies,
   - eggs,
   - cocoons,
   - caterpillars,
   - blocks,
   - carried blocks,
   - sheltered/covered entities.
3. Move persistent offsets into object definitions or asset metadata.
4. Avoid hiding alignment problems inside movement/rendering one-offs.
5. Produce screenshot acceptance captures per zone.

Exit gate:

- objects appear to sit on the same ground plane as the background,
- visual depth ordering is credible in all zones,
- major lifecycle objects and structures have acceptance evidence.

## Phase 3: Occupancy, Support, And Overlap

Goal: make blocks and structures read as solid, supported, and non-overlapping.

Tasks:

1. Replace loose overlap checks with a shared occupancy query.
2. Track occupancy by:
   - zone,
   - ground footprint,
   - depth band,
   - stack index / support level,
   - height or vertical band,
   - support state.
3. Make block placement, flower placement, butterfly avoidance, and draw order query the same occupancy data.
4. Make unsupported structures settle, fall, or reject through one system.
5. Create visual debug mode for:
   - occupied footprints,
   - support columns,
   - collision regions,
   - invalid placement reasons.

Exit gate:

- blocks, flowers, butterflies, and renderer agree about occupied space,
- overlapping blocks are rejected or represented as intentional stacks,
- support behavior is deterministic and visible in debug traces.

## Phase 4: Movement Truth

Goal: make butterfly movement obey the same spatial model as structures and rendering.

Tasks:

1. Unify movement targets with ground-point updates.
2. Ensure every teleport/scatter/spawn/migration path updates:
   - screen position,
   - grid position,
   - physics state,
   - movement intent,
   - proximity grid/versioning.
3. Add movement constraints for:
   - doors,
   - corridors,
   - structures,
   - flowers,
   - crowding,
   - blocked paths.
4. Add acceptance scenarios for:
   - dense feeding,
   - structure crossing,
   - migration,
   - scatter,
   - blocked path recovery.

Exit gate:

- butterflies do not snap back after scatter/spawn,
- movement does not clip through structures,
- harness movement and real-play movement match.

## Phase 5: Honest ML Layer

Goal: make the current policy layer explicit and replaceable.

Tasks:

1. Document current runtime as policy scoring unless a real neural runtime is implemented.
2. Define exactly what ML/policy is allowed to decide:
   - action family,
   - target preference,
   - signal choice,
   - risk posture,
   - migration tendency,
   - building intent,
   - social response.
3. Keep deterministic fallback behavior.
4. Add decision traces showing:
   - inputs,
   - policy score,
   - fallback status,
   - final selected action.
5. If future neural runtime is desired, preserve the interface and swap the scorer later.

Exit gate:

- the project no longer overstates the ML layer,
- the policy interface can support either current linear scoring or a future neural runtime.

## Phase 6: Life-Sim Causality

Goal: make internal state visibly change future behavior.

Tasks:

1. Define core butterfly drives:
   - hunger,
   - safety,
   - curiosity,
   - attachment,
   - fatigue,
   - social comfort,
   - nesting/building.
2. Make memories typed and consequential:
   - fed near,
   - helped,
   - crowded,
   - rejected,
   - sheltered with,
   - threatened by,
   - built with.
3. Make relationship edges affect:
   - approach,
   - avoid,
   - follow,
   - help,
   - share,
   - signal,
   - repair.
4. Make emotions decay over time while leaving memory traces.
5. Give personalities stable weights:
   - bold,
   - social,
   - cautious,
   - builder,
   - wanderer,
   - nurturing.
6. Make routines emerge from repeated successful behavior.
7. Add "why did this butterfly do that?" debug inspection.

Exit gate:

- a butterfly's past visibly changes its later behavior,
- debug traces can explain behavior through drives, memories, emotions, and relationships.

## Phase 7: Emergent Scenario Proofs

Goal: prove behavior through repeatable scenarios, not vibes.

Acceptance scenarios:

1. Pair bonding:
   - two butterflies repeatedly feed/shelter together,
   - later they seek each other more often than neutral peers.
2. Avoidance:
   - repeated crowding or conflict causes temporary avoidance,
   - avoidance decays or repairs over time.
3. Builder tendency:
   - builder personality contributes more to structures over repeated sessions.
4. Social repair:
   - a negative relationship edge can recover through positive events.
5. Migration choice:
   - stress or depleted zone causes relocation.
6. Group behavior:
   - social butterflies cluster,
   - cautious butterflies maintain more distance.
7. Long-session continuity:
   - save/load preserves meaningful social and emotional state.

Exit gate:

- at least five scenarios are reproducible,
- each scenario has logs, screenshots/video if useful, and debug traces.

## Phase 8: Performance And Polish Lock

Goal: keep the richer simulation playable.

Tasks:

1. Re-run the full composed benchmark suite.
2. Profile the heaviest failing lane, especially `single-zone-200`.
3. Optimize:
   - render/composite/drawImage costs,
   - butterfly update loops,
   - structure queries,
   - proximity queries,
   - communication/social update cadence.
4. Run a long free-play soak.
5. Record final acceptance captures.

Exit gate:

- benchmark suite passes agreed thresholds,
- long-session play remains stable,
- no known correctness risks are hidden by the harness.

## Recommended Implementation Order

Do not begin with new life-sim complexity. The immediate order should be:

```text
Phase 0: proof foundation
  ▼
Phase 1: spatial contract
  ▼
Phase 2: world alignment
  ▼
Phase 3: occupancy / overlap
  ▼
Phase 4: movement truth
  ▼
Phase 5: honest ML interface
  ▼
Phase 6: life-sim causality
  ▼
Phase 7: emergent scenario proofs
  ▼
Phase 8: performance and polish lock
```

Reasoning:

- If the harness is wrong, every benchmark can mislead implementation.
- If the spatial model is inconsistent, life-sim behavior will look wrong even when the internal logic is improving.
- If occupancy and movement disagree, social behavior will appear broken because butterflies cannot navigate a trustworthy world.
- If the ML layer is overstated, the project will confuse policy scoring with emergent cognition.
- If life-sim causality is expanded before proof and space are stable, new behavior will be hard to evaluate.

## Review Questions For Claude Code

Claude Code should review and revise this plan with particular attention to:

1. Is the phase order correct?
2. Are any phases too large and in need of sub-phases?
3. Are there implementation risks in the current codebase that change the order?
4. Should the spatial target remain rigorous 2.5D, or is there evidence that a deeper internal 3D representation is required?
5. What is the smallest elegant spatial contract that can support the intended game?
6. What should be the exact first implementation patch?
7. Are the harness fixes sufficient to make benchmark evidence trustworthy?
8. Are there missing acceptance tests or proof artifacts?
9. Is the life-sim causality plan concrete enough to avoid becoming a pile of new conditionals?
10. Should any existing docs be updated, merged, or deprecated before implementation begins?

## Requested Claude Code Output Format

After reviewing and editing this plan, Claude Code should create a document in the repo with its revised plan, critique, and implementation recommendations.

Preferred output path:

`docs/CLAUDE-REVIEW-PAPILIONEM-STABILIZATION-PHASE-PLAN-2026-04-28.md`

Claude Code should then return one singular copy-paste prompt for the user to give back to Codex. That prompt should include:

- the path to Claude Code's review document,
- a concise summary of changes Claude made to the plan,
- the recommended final phase order,
- the exact first implementation task,
- any risks or constraints Codex must know before starting,
- instructions for Codex to read the Claude review document and begin Phase 0 unless the user says otherwise.

