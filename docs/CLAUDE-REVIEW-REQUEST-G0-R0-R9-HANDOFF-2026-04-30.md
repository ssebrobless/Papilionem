# Claude Review Request - G0 R0-R9 Handoff

Date: 2026-04-30
Prepared by: Codex
Project: Papilionem / Ephemera
Workspace: `C:\Users\fishe\Documents\projects\ephemera`

## Purpose

Codex has implemented the G0 visual / spatial / AI repair ladder from R0
through R9. This document is the handoff packet for Claude to review the
current implementation, proof artifacts, and remaining gap to the user's real
goal: a believable butterfly society with functional artificial emotion,
memory, relationships, social capability, and ML-backed decision scoring.

Claude should not merely rubber-stamp the prior plan. Please review whether the
game is now ready for G0 human close testing, whether any issues remain from
the user's reported symptoms, and what the next concrete implementation plan
should be if the current build still falls short.

## Current Phase Shape

```text
G0 repair ladder
+-- R0  comprehension repair              complete
+-- R1  spatial readability               complete
+-- R2  movement truth unification         complete
+-- R3  block cell discipline              complete
+-- R4  height legibility                  complete
+-- R5  sprite fidelity audit              complete
+-- R6  flower lifecycle                   complete
+-- R7  feed / talk reality                complete
+-- R8  cooperation + emergence + ML proof complete
+-- R9  player/cursor seam reservation     complete
`-- G0  fresh human capture/review         still needed
```

G0 should not be considered fully closed until a fresh human play capture
confirms the user-facing symptoms are gone or clearly identifies the remaining
ones.

## Binding / Background Documents To Read

Read these before reviewing code:

- `docs/CLAUDE-REVIEW-G0-VISUAL-SPATIAL-AI-2026-04-29.md`
- `docs/CLAUDE-REVIEW-REQUEST-G0-VISUAL-SPATIAL-AI-2026-04-29.md`
- `docs/VISUAL-SIM-BOARD-REBUILD-PLAN-2026-04-29-CLAUDE-REVIEW.md`
- `docs/ACTIVE-PLAN-REGISTRY.md`
- `docs/ACTIVE-COMPLETION-BOARD.md`
- `docs/ACTIVE-SOCIAL-COGNITION-BOARD.md`
- `docs/SOCIAL-FAMILY-LOCK.md`
- `docs/COGNITION-ML-CONTRACT.md`
- `docs/ML-IMPLEMENTATION-CONTRACT.md`
- `docs/LIFESIM-EXPRESSION-AUDIT.md`
- `docs/PLAYER-CURSOR-SOCIAL-SEAM.md`

## Hard Constraints Still In Force

- Long-running saves are sacred. Do not recommend wiping saves to hide symptoms.
- `1 block = 1 board unit = 1 support / stack unit`.
- Sun-court remains Training Grounds; no ambient blocks there.
- First ML runtime remains local static policy scoring.
- ML scores choices only; it should not silently own durable emotions, memories,
  or bonds. If Claude proposes deeper learned cognition later, it must describe
  the ownership boundary, migration path, and safety proof clearly.
- Durable feelings, memories, routines, relationships, and social truth currently
  live in life-sim / social systems. Claude may challenge or expand that design
  if doing so materially improves the goal and preserves save continuity.
- The current drive, emotion, memory, motive, and relationship vocabulary is a
  baseline, not a sacred limit. Claude should evaluate whether it is expressive
  enough for believable living creatures. If it is too narrow, bland,
  repetitive, or too rule-like, Claude is encouraged to propose concrete
  expansions, replacements, or a staged redesign.
- Target is believable butterfly society, not a claim of literal
  consciousness or human-equivalent subjective feeling.
- Battle remains top-down; do not reopen the single-player autobattle contract
  unless a named contradiction requires it.
- Save schema `5` remains canonical; only additive migrations this round.

## What Changed By Phase

### R0 - Comprehension Repair

Intent: stop the game from fighting the player.

Landed:
- Ambient zone travel no longer force-focuses the player unless the travel
  action explicitly opts into camera follow.
- Sim-board ground was flattened from the confusing inner rectangle treatment.
- Focused mode suppresses the centered legacy zone overlay.

Primary proof:
- `qa_screenshots/r0_comprehension_repair_2026_04_30/2026-04-30T01-09-24-091Z`

### R1 - Spatial Readability

Intent: make the board read as one playable field with a visible grid.

Primary proof:
- `qa_logs/bench/r1_spatial_readability_2026_04_30`
- `qa_logs/session_captures/2026-04-30T01-59-39-731Z-r1-spatial-readability-60s-capture-1777514319471`

### R2 - Movement Truth Unification

Intent: align movement intent, board coordinates, edge travel, and projected
position so butterflies stop pushing toward confusing old targets.

Primary proof:
- `qa_screenshots/r_movement_board_truth_audit/2026-04-30T02-16-36-934Z`
- `qa_logs/bench/r2_movement_truth_2026_04_30`

### R3 - Block Cell Discipline

Intent: blocks snap to integer board cells and obey occupancy/support truth.

Primary proof:
- `qa_screenshots/r_block_cell_discipline_audit/2026-04-30T02-31-07-150Z`

### R4 - Height Legibility

Intent: make altitude, ground relation, and shadow separation legible.

Primary proof:
- `qa_screenshots/r_altitude_probe/2026-04-30T03-15-43-614Z`
- `qa_logs/bench/r4_height_legibility_2026_04_30`

### R5 - Sprite Fidelity

Intent: prove the high-resolution butterfly path is actually being used and
surface sprite cache telemetry.

Primary proof:
- `qa_screenshots/r5_sprite_fidelity_audit/2026-04-30T04-12-00-802Z`
- close-ups:
  - `01-sun-court-wing-closeup.png`
  - `02-sun-court-wing-tight-closeup.png`
  - `03-ivy-cloister-wing-closeup.png`
  - `04-ivy-cloister-wing-tight-closeup.png`
  - `05-inspect-sprite-fidelity.png`
  - `06-debug-cache-overlay.png`
- manual captures:
  - `qa_logs/session_captures/2026-04-30T04-12-18-394Z-r5-sprite-fidelity-capture-1777522329794`

### R6 - Flower Lifecycle

Intent: reduce visible stacking and add the user-requested lifecycle:
fresh flower -> decay -> dirt pile -> cleanup affordance, plus picked flower
reserve-food behavior.

Primary proof:
- `qa_screenshots/r_flower_lifecycle_audit/2026-04-30T04-21-48-528Z`
- screenshot: `01-flower-lifecycle-proof.png`

### R7 - Feed / Talk Reality

Intent: feed filters map to real categories and conversation reads as motive,
target, response, and consequence instead of isolated warning spam.

Landed:
- Canonical feed categories: `talk`, `action`, `learn`, `warning`, `system`.
- Warning entries require grounding such as safety trigger / danger memory /
  threat signal.
- Talk entries thread same pair + same motive family within 3 seconds.
- Thread details include durable consequence tails when relationship edges move.

Primary proof:
- `qa_screenshots/r_feed_thread_audit/2026-04-30T04-53-45-906Z`
- screenshots:
  - `01-thread-category-contract.png`
  - `02-filter-chip-isolation.png`
- regression proofs:
  - `qa_screenshots/r6_communication_audit/2026-04-30T04-51-31-734Z/report.json`
  - `qa_screenshots/f5_f6_social_depth_audit/2026-04-30T04-51-32-029Z/report.json`

### R8 - Cooperation + Emergence + ML Evidence

Intent: create real world reasons for butterflies to need each other and prove
ML runtime/trace lanes honestly.

Landed:
- Heavy block cooperation: heavy blocks require two adjacent carriers.
- Shelter trust scaling: trusted co-occupants improve rest/recovery.
- Scarcity pulse: a zone can enter scarcity, emit warning/sharing pressure, and
  trigger reserve-food sharing.
- Distress cascade: high threat/exhaustion can call caregivers and reinforce
  care/protectiveness edges.
- Scout discovery: scouts can invite nearby butterflies toward better zones.
  Cadence was corrected to 30 seconds, capped at 3 emissions per pass.
- ML on/off audit: proves static policy runs when enabled and heuristic
  fallback owns decisions when disabled.
- Trace corpus: outcome windows populate rows for future training evidence.

Primary proof:
- `qa_screenshots/r_cooperation_pressure_audit/2026-04-30T04-50-36-656Z`
- screenshots:
  - `01-h1-heavy-block-cooperation.png`
  - `02-h2-shelter-trust-scaling.png`
  - `03-h3-scarcity-sharing.png`
  - `04-h4-distress-cascade.png`
  - `05-h5-scout-discovery.png`
- ML on/off:
  - `qa_screenshots/ml_on_off_capture_audit/2026-04-30T04-54-07-215Z/report.json`
  - `qa_screenshots/ml_on_off_capture_audit/2026-04-30T04-54-07-215Z/side-by-side.json`
- ML trace:
  - `qa_screenshots/ml_trace_capture_audit/2026-04-30T04-50-52-029Z/report.json`
- C2 corpus:
  - `qa_screenshots/c2_trace_corpus/2026-04-30T04-50-52-044Z/corpus-manifest.json`
  - `qa_screenshots/c2_trace_corpus/2026-04-30T04-50-52-044Z/corpus-records.json`
  - measured decision-row outcome coverage: `10/10`.

Important honesty note:
The ML on/off audit proves that ML is wired and distinguishable from fallback.
It does not yet prove that ML produces better, more emergent, or more socially
believable behavior by the earlier proposed thresholds. Claude should decide
whether the next plan needs a stronger ML-value evaluation lane.

### R9 - Player / Cursor Seam Reservation

Intent: protect the future player-name / cursor-as-social-actor idea without
implementing it prematurely.

Landed:
- `docs/PLAYER-CURSOR-SOCIAL-SEAM.md`
- Linked from `docs/ACTIVE-PLAN-REGISTRY.md`

No runtime behavior changed in R9.

## Proof Commands Recently Run Green

```powershell
node scripts/run-r-cooperation-pressure-audit.js
node scripts/run-ml-on-off-capture-audit.js
node scripts/run-ml-trace-capture-audit.js
node scripts/build-c2-trace-corpus.js
node scripts/run-r-feed-thread-audit.js
node scripts/run-r6-communication-audit.js
node scripts/run-f5-f6-social-depth-audit.js
node scripts/run-runtime-self-audit.js
```

Also syntax checked:

```powershell
node --check core/config.js
node --check entities/block.js
node --check systems/structureSystem.js
node --check systems/communicationSystem.js
node --check systems/zoneSystem.js
node --check systems/lifeSimSystem.js
node --check scripts/run-r-cooperation-pressure-audit.js
node --check scripts/run-ml-on-off-capture-audit.js
node --check scripts/run-r-feed-thread-audit.js
```

## Files Most Relevant To Review

Implementation-heavy files:

- `core/config.js`
- `entities/block.js`
- `entities/butterfly.js`
- `entities/flower.js`
- `systems/structureSystem.js`
- `systems/communicationSystem.js`
- `systems/zoneSystem.js`
- `systems/lifeSimSystem.js`
- `systems/mlInferenceSystem.js`
- `ui/gameUI.js`
- `ui/dom/feedPanel.js`

New / relevant audit scripts:

- `scripts/run-r-cooperation-pressure-audit.js`
- `scripts/run-ml-on-off-capture-audit.js`
- `scripts/run-ml-trace-capture-audit.js`
- `scripts/build-c2-trace-corpus.js`
- `scripts/run-r-feed-thread-audit.js`
- `scripts/run-r-flower-lifecycle-audit.js`
- `scripts/run-r5-sprite-fidelity-audit.js`
- `scripts/run-r-altitude-probe.js`
- `scripts/run-r-block-cell-discipline-audit.js`
- `scripts/run-r-movement-board-truth-audit.js`

## Current Open Question

The implementation has moved the game closer to the goal, but the next review
must be honest about whether it is enough.

```text
the real question
+-- Are the original user-visible issues actually gone in normal play?
|   +-- forced zone swapping
|   +-- confusing green rectangle / zone overlay
|   +-- butterflies pushing upward
|   +-- jitter / vibration
|   +-- pixelated butterflies
|   +-- flowers stacking
|   +-- feed filters not working
|   `-- talk feeling scripted or shallow
+-- Are cooperation pressures visible enough to feel like society?
+-- Is the ML runtime doing meaningful work beyond being connected?
+-- Is the trace corpus enough for the next training/imitation step?
`-- What exact next plan should Codex execute?
```

## Added Review Scope: Artificial Life / Cognition Vocabulary

Claude should evaluate the current social and cognition model against the real
goal: butterflies that feel like living social creatures, not just agents
following clever rules. The current vocabulary and contracts are useful
evidence, but they should not be protected at the expense of the game becoming
emotionally believable.

Claude is allowed and encouraged to propose new or changed:

- drives
- emotions
- memories
- relationship edges
- personality traits
- attachment patterns
- social needs
- conflict states
- dialogue motives
- learned preferences
- ML features or trace labels

The standard is not "avoid new vocabulary." The standard is "make every concept
real in the game."

```text
new cognition concept must become real by changing
+-- what causes it
+-- how long it persists
+-- what future choices it changes
+-- movement / proximity / avoidance / seeking
+-- who the butterfly talks to
+-- what the butterfly says
+-- what the butterfly remembers
+-- cooperation / conflict / caregiving / rivalry
+-- what the player can perceive in feed, inspect, capture, or behavior
+-- how it saves and migrates
`-- how an audit or capture proves it improved believability
```

Claude should be especially honest about whether the current system still reads
as repetitive or scripted. If the existing families cannot express things like
loneliness, affection, rivalry, grief, pride, jealousy, loyalty, dependency,
social insecurity, comfort-seeking, or long-term bonding well enough, Claude
should say so and propose a grounded expansion.

Suggested taxonomy to use in the review:

```text
behavior source taxonomy
+-- direct rule branch
+-- feedback-loop simulation
+-- durable emotional/social state
+-- ML-scored choice
+-- learned/offline-trained behavior candidate
`-- future model-driven cognition proposal
```

Do not claim literal consciousness. It is fine to design functional artificial
emotion: stored/derived internal state that changes from events, persists,
alters behavior, affects relationships, and is visible enough for the player to
understand.

## Added Review Scope: Deterministic Scenario Harnesses

Claude should plan deterministic scripted tests for Codex to run while making
future changes. The project should not rely only on a random long-running save
to prove rare social, spatial, battle, or ML behavior. Long human captures are
still valuable for feel, but each implementation phase should also have
controlled scenarios that summon the target behavior in a lab and assert the
result.

```text
deterministic scenario harness
+-- controlled population
|   +-- exact butterflies with fixed traits / drives / emotions
|   +-- exact relationships, memories, and routines
|   `-- exact starting board positions and heights
+-- controlled world state
|   +-- known zone and board bounds
|   +-- known flowers / blocks / piles / reserve food
|   +-- known scarcity / shelter / battle setup
|   `-- known ML on/off and trace-capture settings
+-- scripted timeline
|   +-- step N frames
|   +-- inject event or stimulus
|   +-- step N more frames
|   `-- assert expected state / behavior / trace change
+-- assertions
|   +-- board position / projection / movement / proximity
|   +-- dialogue category, thread, motive, and consequence
|   +-- relationship edge deltas
|   +-- memory packet creation
|   +-- drive / emotion / routine change
|   +-- ML trace source / feature row / outcome window
|   +-- ability radius / projectile / battle hit logic
|   `-- visual proof screenshot when relevant
`-- output
    +-- report.json
    +-- screenshots
    +-- optional short capture
    `-- failure reason with exact contradiction
```

Claude should propose specific scenario scripts for the next plan. Good example
scenario families:

```text
scenario families
+-- affection / attachment
|   `-- repeated comfort or successful cooperation increases trust, attachment,
|      future proximity, and warmer dialogue
+-- rivalry / jealousy / conflict
|   `-- repeated resource or partner conflict increases friction, avoidance,
|      possessive/socially insecure behavior, or conflict dialogue
+-- loneliness / seeking
|   `-- an isolated butterfly develops social-seeking pressure and emits
|      appropriate signals or movement
+-- grief / absence / separation
|   `-- a bonded partner leaves or disappears; memory, routine, emotion, and
|      seeking/withdrawal behavior change
+-- cooperation
|   `-- heavy block, scarce food, or shelter pressure requires help/sharing and
|      proves request -> response -> durable consequence
+-- spatial truth
|   `-- scripted movement across cells, heights, and zone edges proves boardPos,
|      projection, and screenshots agree
+-- flower lifecycle
|   `-- flower -> decay -> dirt pile -> cleanup -> reserve food transitions
|      happen without stacking or save breakage
+-- battle ability radius
|   `-- exact attacker/target/projectile positions prove radius and hit math
|      match units
`-- ML value
    `-- same scenario with ML on/off proves policy source, features, outcome
       windows, and behavior differences are measurable
```

For every implementation phase Claude proposes, include at least one
deterministic scenario test unless the phase is docs-only. Each scenario should
define: initial state, seeded agents, world setup, timeline, assertions,
expected artifacts, and pass/fail criteria.

## Added Review Scope: Whole-Game 3D / Spatial Truth Audit

Claude should perform a whole-game 3D/spatial truth review, not only a plan
review. The central question is whether every major gameplay path now agrees
with the same board-backed spatial model, or whether legacy screen-pixel /
isometric assumptions still steer behavior, rendering, saves, abilities, or AI.

```text
3D / spatial truth review
+-- projection
|   +-- screen <-> board conversion is reversible enough for gameplay
|   +-- height h changes visual altitude clearly
|   +-- shadows and ground contact match board position
|   `-- fixed UI bands do not conflict with playable board bounds
+-- movement
|   +-- butterflies choose targets in board units
|   +-- no legacy pixel/isometric targets still steer normal movement
|   +-- edge exits use real board edges, not preserved old doorway points
|   +-- no upward/top-edge bias remains
|   `-- no settled-target jitter or vibration remains
+-- zones
|   +-- every zone has clear board bounds
|   +-- visual background matches the playable movement envelope
|   +-- next-zone UI does not contradict edge travel
|   +-- overview/focused labels do not cover the playfield
|   `-- sun-court remains Training Grounds / no ambient blocks
+-- blocks
|   +-- 1 block = 1 board unit = 1 support/stack unit
|   +-- integer grid snapping works for carry/drop/build
|   +-- occupancy prevents duplicate cells and overlap
|   +-- stack/support height is coherent
|   `-- heavy-block cooperation uses board adjacency, not screen coincidence
+-- flowers / food / piles
|   +-- spawn spacing uses board occupancy / spacing truth
|   +-- decay piles sit in the intended board cell
|   +-- reserve-food balls intentionally occupy or ignore cells
|   `-- cleanup affordance has a clear spatial trigger
+-- garden abilities and battle
|   +-- garden ability radii use board units
|   +-- battle ability radii use the intended arena units
|   +-- projectile visuals match hit/collision logic
|   +-- attack/projectile timelines still respect the top-down battle contract
|   `-- no battle math silently depends on old isometric background coordinates
+-- AI / life sim / ML spatial inputs
|   +-- social signal radius uses board distance where applicable
|   +-- proximity, caregiving, shelter, scarcity, and scout hooks use board truth
|   +-- ML feature rows include the correct zoneId / boardPos / h context
|   +-- trace outcome windows preserve the spatial context needed for training
|   `-- no durable feelings/memories/bonds are owned by ML
+-- UI readability
|   +-- grid overlay communicates playable space without dominating
|   +-- altitude is readable without debug tools
|   +-- zone chip/overview never sits awkwardly over active play
|   `-- screenshots prove each zone reads as an inhabitable place
`-- save continuity
    +-- old saves normalize into boardPos correctly
    +-- no duplicate/overlapping blocks or flowers after load
    +-- schemaVersion 5 remains canonical
    `-- long-running save identity / memory / lineage continuity is preserved
```

Claude should search for remaining legacy spatial assumptions, including raw
`x/y`, stale `gridPos`, old isometric map coordinates, old doorway corridors,
background-specific hardcoded regions, and screen-distance checks in systems
that should now use board/projection truth. The review should name whether each
use is still valid presentation math or an implementation contradiction.

Recommended trace shape:

```text
spatial trace per system
visual position -> board position -> movement target -> interaction radius
-> save/load field -> audit proof -> remaining contradiction, if any
```

## Requested Claude Output

Please create a new review document in `docs/` that contains:

1. Your verdict on the current R0-R9 implementation state.
2. Any correctness risks or maintainability concerns, with exact file/function
   references.
3. Which symptoms require a fresh human capture before judgment.
4. Which symptoms can already be judged from code/audits.
5. A concrete next implementation plan, phase by phase, in exact order.
6. For each phase: owned files, forbidden files, implementation steps,
   rollback flags if appropriate, proofs/audits to run, and acceptance criteria.
7. A specific plan for the "real artificial intelligence" direction:
   functional emotions, relationship memory, cooperation incentives,
   ML value measurement, trace corpus growth, and what should remain
   explicitly not claimed as literal consciousness.
8. A direct evaluation of whether the current drive, emotion, memory, motive,
   relationship, and ML-feature vocabulary is expressive enough. If not, propose
   concrete additions, replacements, or staged redesigns, with cause,
   persistence, behavior effects, save migration, UI surfacing, and tests.
9. A whole-game 3D/spatial truth audit covering projection, movement, zones,
   blocks, flowers, abilities, battle, UI readability, save continuity, and
   AI/ML spatial inputs.
10. A list of remaining legacy pixel/isometric assumptions, sorted into:
   valid presentation math, questionable compatibility bridge, and contradiction
   requiring a concrete fix.
11. A deterministic scenario-test plan for every implementation phase, including
    initial state, seeded agents, world setup, scripted timeline, assertions,
    expected screenshots/reports, and pass/fail criteria.
12. A final singular copy-paste prompt that the user can hand back to Codex.
   That prompt must include the path to your new review/plan document and exact
   instructions for the next implementation phase.

Recommended filename:

`docs/CLAUDE-REVIEW-G0-R0-R9-HANDOFF-NEXT-PLAN-2026-04-30.md`

## Important Review Framing

Do not treat "more AI" as automatically meaning "add random human-sounding
fields," but also do not preserve the current vocabulary merely because it is
already documented. The goal is not to protect the plan; the goal is to make
the butterflies feel like living social creatures.

The likely next work may include:

- making incentives stronger and more visible
- proving social causality through longer captures
- expanding ML value metrics beyond source on/off
- making feed/inspect/capture show why a butterfly chose something
- growing an offline trace corpus for later learned behavior
- preserving save continuity and player/cursor future seams
- adding or redesigning cognition/social vocabulary if the current model cannot
  express the emotional and relationship nuance the game needs
- adding deterministic scenario harnesses so Codex can prove rare interactions
  without waiting on random long-running saves

If Claude believes new vocabulary or a deeper redesign is necessary, it should
name the specific limitation being solved, explain why current state cannot
express it well, and propose a staged migration with clear acceptance tests.

Likewise, do not treat "3D logic" as automatically meaning a volumetric engine
rebuild. First determine whether the board-backed projection model is being used
consistently. A rebuild should be recommended only if a concrete contradiction
cannot be resolved by moving the remaining runtime paths onto the existing
board/projection contracts.
