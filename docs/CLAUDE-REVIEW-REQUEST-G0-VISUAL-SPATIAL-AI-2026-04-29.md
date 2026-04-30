# Claude Review Request - G0 Visual / Spatial / AI Replan - 2026-04-29

## Purpose

This document is a focused review packet for Claude. It gathers the current
Papilionem rebuild concerns into one place so Claude can deeply review the
plan, correct it, and return a Codex-executable implementation order.

The user is no longer asking only for isolated bug fixes. The desired direction
is:

```text
Papilionem target
|- a clear 3D-backed sim board the player can understand at a glance
|- honest visible movement boundaries and board-unit grid logic
|- butterflies, blocks, flowers, abilities, battle attacks, and travel all using
|  the same spatial truth
|- high-resolution butterfly sprites restored to the clarity of the original art
|- flowers and blocks behaving like meaningful world objects, not clutter
|- conversation/feed behavior grounded in durable social state
`- a staged path toward genuinely less-scripted artificial intelligence:
   emotion-like state, memory, relationships, routines, cooperation, ML traces,
   and future model-assisted behavior
```

Claude should review this packet against the existing repository docs and code,
then write an adjusted plan that Codex can implement phase by phase.

## Current Evidence

### Human Capture

Held G0 capture:

`qa_logs/session_captures/2026-04-29T23-39-22-983Z-playtest-manual-capture-1777505666832`

Observed / recorded:

```text
capture evidence
|- duration                 -> about 4:56
|- focus-zone events         -> 83 in under five minutes
|- flowers                   -> 183 -> 186
|- sprite cache telemetry    -> 0/0
|- runtime page errors       -> 0
|- runtime console errors    -> 0
`- player verdict            -> G0 hold
```

User-observed issues from that capture:

```text
visual / spatial symptoms
|- zones swap/focus forcefully without player clicking
|- zone artwork reads as green field plus unexplained inner rectangle
|- highlighted map/zone section sits awkwardly in the middle of the window
|- highlighted map does not reflect the real playable size
|- no visible grid system in normal play
|- hard to tell where butterflies can move
|- hard to tell whether butterflies are moving up/down in 3D space
|- butterflies push toward the top edge
|- butterflies sometimes vibrate/jitter
|- butterflies are still not as clear as the original high-resolution art
|- flowers stack on top of each other
|- feed/talking/action/learn filters do not behave correctly
|- feed still emits contextless warning lines
`- talking still does not feel like real socializing
```

### Visual/Spatial Audit

Audit screenshot folder:

`qa_screenshots/g0_visual_spatial_audit_2026_04_29/`

Important files:

- `03-focused-after-dismiss.png`
- `04-overview-after-dismiss-forced.png`
- `focused-runtime-geometry-after-dismiss.json`
- `overview-runtime-geometry-after-dismiss.json`

Runtime geometry from the focused screenshot:

```text
focused sim-board geometry
|- renderMode       -> sim-board
|- focusedZoneId    -> ivy-cloister
|- focused label    -> Open Land NW
|- board origin     -> (40, 96)
|- board units      -> width 36, depth 22
|- ppu              -> 20
|- groundT          -> 0.56
|- hStep            -> 8
|- projected field  -> x 40..760, y 96..342.4
|- placement region -> x 28..772, y 108..396
|- grid guides      -> false by default
`- sampled butterflies -> boardPos.h = 0 in sample
```

Source contradictions found:

```text
current spatial contradictions
|- core/renderManager.js drawSimBoardGround()
|  `- draws full canvas fill plus hard inner rectangle
|- core/renderManager.js drawUILayer()
|  `- still calls drawZoneWorldOverlay() during normal focused play
|- core/renderManager.js drawZoneWorldOverlay()
|  `- draws legacy gridManager.isoToScreen(zone.bounds) diamond in sim-board mode
|- systems/zoneSystem.js createZoneBoardConfig()
|  `- every focused board currently defaults to the same board origin
|- entities/butterfly.js movement
|  `- normal movement still targets legacy gridPos while boardPos is derived later
|- entities/block.js placement
|  `- has boardPos/h and visual lift, but placement is still screen-point based
`- core/gameCore.js updateSimBoardZoneTraveler()
   `- ambient travel can still call focusZone(), causing camera hijack
```

## Existing Planning / Contract Docs To Read

Claude should read these first:

- `docs/G0-HOLD-TRIAGE-PLAN-2026-04-29.md`
- `docs/ACTIVE-COMPLETION-BOARD.md`
- `docs/VISUAL-SIM-BOARD-REBUILD-PLAN-2026-04-29.md`
- `docs/VISUAL-SIM-BOARD-REBUILD-PLAN-2026-04-29-CLAUDE-REVIEW.md`
- `docs/ACTIVE-SOCIAL-COGNITION-BOARD.md`
- `docs/ACTIVE-PLAN-REGISTRY.md`
- `docs/CURRENT-SPATIAL-TRUTH.md`
- `docs/SPATIAL-UNIT-CONTRACT.md`
- `docs/COGNITION-ML-CONTRACT.md`
- `docs/ML-IMPLEMENTATION-CONTRACT.md`
- `docs/LIFESIM-EXPRESSION-AUDIT.md`
- `docs/SOCIAL-FAMILY-LOCK.md`
- `docs/DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md`
- `docs/NEURAL-SOCIAL-SCORING-AUDIT.md`

Code areas Claude should inspect as needed:

- `core/renderManager.js`
- `core/gameCore.js`
- `core/gridManager.js`
- `core/config.js`
- `systems/zoneSystem.js`
- `systems/structureSystem.js`
- `systems/physicsSystem.js`
- `systems/lifeSimSystem.js`
- `systems/communicationSystem.js`
- `systems/mlInferenceSystem.js`
- `systems/battleSystem.js`
- `entities/butterfly.js`
- `entities/block.js`
- `entities/flower.js`

## Hard Constraints

Do not recommend a plan that violates these:

```text
hard constraints
|- long-running saves are sacred; do not wipe the user's save to hide symptoms
|- 1 block = 1 board unit = 1 support/stack unit
|- Training Grounds is top-right; other three zones are open land
|- no ambient blocks in Training Grounds
|- first ML runtime remains local/static policy scoring
|- ML may score choices but must not own durable feelings, memories, or bonds
|- life-sim/social systems own durable truth
|- no new drive/emotion/memory/social-edge vocabulary unless a named contract is reopened
|- preserve existing identity, memory, lineage, relationship, and save continuity
|- success target is believable butterfly society, not indistinguishable humans
`- do not claim literal consciousness/subjective feeling
```

## User's Current Desired Spatial Direction

The user is leaning away from ornate/complex old backgrounds and toward a
clearer 3D-backed board:

```text
desired spatial shape
|- one large understandable board/map concept
|- zones remain assigned by quadrant:
|  |- top-left     -> Open Land NW
|  |- top-right    -> Training Grounds
|  |- bottom-left  -> Open Land SW
|  `- bottom-right -> Open Land SE
|- focused zone may still show one area at a time
|- zoom-out / overview may show the full quadrant board
|- Next Zone buttons are player-controlled camera/zone jumps
|- autonomous butterfly travel must not move the camera
|- butterflies should exit by flying to the real border edge of the map/field
|- old doorway anchor points should stop driving normal sim-board travel
|- top movement limit should stay below the UI band
|- visible background should communicate where butterflies can move
|- normal play should have a subtle visible unit grid or equivalent unit cue
`- board height / butterfly altitude should be readable
```

Claude should decide whether the implementation should remain focused-zone
rendering with shared board rules, or whether a true unified zoomable full-board
view should be introduced now. If a unified zoomable board is recommended,
Claude should define exact math and migration steps.

## Visual / 3D Logic Questions Claude Must Answer

Claude should go deep on the math and ownership:

1. What is the authoritative coordinate for each entity after the replan?
2. Should `boardPos { zoneId, u, v, h }` become the movement truth for
   butterflies, or should `gridPos` remain primary temporarily?
3. How should screen projection work for:
   - full focused field,
   - zoom-out quadrant board,
   - board height `h`,
   - butterfly altitude,
   - blocks,
   - flowers,
   - attacks/projectiles,
   - ability radii?
4. How should the top UI-safe boundary be expressed mathematically?
5. How should visible grid lines align to board units without making the game
   look like a debug tool?
6. How should normal play show height/up-down movement?
7. Which legacy spatial systems should be suppressed immediately?
8. Which legacy systems should be kept only as compatibility/migration helpers?
9. How should edge-based zone travel choose exit/arrival points?
10. How should block placement snap exactly to integer board cells?
11. How should occupancy reject duplicate/half-cell/unsupported placements?
12. What audits prove top-edge pressure and butterfly vibration are fixed?
13. What screenshots/probes prove the background reflects real movement bounds?

## Concrete World-Object Changes To Include

### Blocks

Desired:

```text
block truth
|- one block occupies exactly one board unit/cell
|- placement snaps to integer { zoneId, u, v, h }
|- no half-cell placement
|- no duplicate solid blocks in one cell
|- no unsupported floating stacks unless a future explicit rule opens it
|- Training Grounds receives no ambient blocks
`- block visual size may change if the math requires it
```

Claude should review how to convert current screen-point placement into
board-cell placement without breaking saves.

### Flowers

Already started:

- New normal flower spawns now respect a readable per-zone cap.
- Unsafe overlap fallback was removed for ordinary preferred points.
- A loaded-save readability cleanup path was added to reduce old flower piles.

Desired next:

```text
flower lifecycle
fresh flower
|- if eaten -> nutrition/satisfaction
|- if picked -> same-color food reserve ball, no normal decay
`- if left for about 60 seconds -> dark decayed dirt pile

decayed dirt pile
|- visible clutter/garbage
|- butterflies can notice it
|- butterflies can clean it using existing drives/routines
`- cleanup can influence memory/social/reputation later
```

Claude should review:

- save/migration needs,
- object ownership,
- life-sim awareness hooks,
- visual design,
- cleanup behavior,
- food reserve behavior,
- acceptance tests.

### Butterfly Sprites

Known source assets:

- wings: `assets/butterflies/`, 1920x1080 wing assets
- body/antenna: 1080x1080

Problem:

- Player still reports pixelated/distorted butterflies.
- Capture reported `spriteCache: 0/0`.

Claude should review whether P0 sprite fidelity work was sufficient, whether
runtime drawing is actually using the high-resolution path, and what proof is
needed: close-up screenshots, cache telemetry, smoothing state, bake scale, and
canvas/CSS scaling.

## Battle / Attacks / Abilities

User clarified they meant attacks, not tanks.

Claude should include battle/attack math in the spatial plan:

```text
battle / attack spatial needs
|- battle remains top-down unless a named contradiction requires reopening it
|- attacks/projectiles should use board/arena units, not stale screen pixels
|- ability radius conversion should cover both garden and battle versions
|- projectile arcs / hit volumes need clear 3D-backed interpretation
|- visual effect radius should match gameplay radius
`- proofs should include garden ability radius and battle attack/projectile cases
```

Specific ability concern:

- Many butterfly abilities have radius/range logic that must convert correctly
  into the new 3D board/arena scale.
- Claude should review garden and battle versions of abilities, including
  social/teaching/trust/speed/sleep/comfort effects.

## Feed / Talk / Social Behavior

Current user concern:

```text
social symptoms
|- feed filters for talking/action/learn are unreliable
|- warning-flavored lines appear without meaningful visible cause
|- talking does not feel like real socializing
|- conversation feels more like output text than relationship action
`- butterflies feel too much like if/then scripts
```

Existing social docs say many systems are live:

- drives,
- emotions,
- memories,
- social edges,
- routines,
- interpretation,
- communication,
- social ecology,
- genetics,
- upbringing,
- lifecycle,
- derived cognition,
- static/local ML scoring.

But the user wants a more honest path toward real artificial intelligence in
the game sense.

## AI / Emergence Deep-Dive Required

Claude should not treat this as a minor appendix. It should deeply review the
"not real AI / too if-then" concern.

User's target:

```text
game AI target
|- persistent butterfly identity
|- durable memories
|- emotion-like internal state
|- relationships and social preferences
|- personality/history-shaped reactions
|- signal interpretation
|- adaptation from past outcomes
|- learned routines and place preferences
|- action choice from competing motives
|- cooperation and conflict driven by world incentives
|- conversation that changes later behavior
|- ML traces that can support future learned behavior
`- future player/cursor chat where butterflies know the player's chosen name
```

Honest boundary:

```text
we can build:
|- autonomous game agents
|- functional artificial emotions
|- memory-shaped behavior
|- relationship-shaped decisions
|- model/scoring-assisted action choice
|- falsifiable behavioral proof

we cannot prove:
`- literal subjective consciousness or real feelings in the human sense
```

Claude must answer:

1. Which current butterfly behaviors are mostly direct rule branches?
2. Which current behaviors are genuine feedback loops across drives, emotions,
   memory, social edges, routines, communication, and environment?
3. Where do feelings/emotions actually change later choices?
4. Where do relationships actually alter movement, talk, help, avoidance,
   rest, building, teaching, or battle posture?
5. What cooperation pressures should be introduced first?
6. What world objects/events should require or reward cooperation?
7. What trace fields do we need now for future learned behavior?
8. What should future ML own, and what must it never own?
9. How should ML-on vs ML-off be compared?
10. What acceptance proof would convince us the butterflies are not just
    replaying template branches?
11. How should future player/cursor-as-social-actor be preserved as a seam?
12. What should be implemented soon versus deferred until after spatial repair?

Claude should produce a staged AI path, probably like:

```text
AI path
|- Stage A: deterministic social truth and visible consequence
|- Stage B: cooperation/world incentives
|- Stage C: trace capture and outcome labeling
|- Stage D: ML-on vs ML-off evaluation
|- Stage E: trained/preference model exploration
`- Stage F: future player/cursor chat and model-assisted expression
```

Claude may revise that order, but it must be concrete and tied to files,
proofs, and acceptance tests.

## Current Recommended Repair Ladder Before Claude Review

Current Codex plan order in `G0-HOLD-TRIAGE-PLAN-2026-04-29.md`:

```text
repair ladder
|- H0   keep current capture as the G0 hold fixture
|- H-1  preserve correct zone meanings and no-block Training Grounds
|- H1   stop ambient travel from changing the player's focused zone
|- H3   suppress legacy zone highlight overlay in focused sim-board play
|- H2   replace inner-rectangle presentation with a full-field board/grid treatment
|- H2.1 enforce one spatial overlay rule
|- H2.2 add visible height / flight layer cue
|- H2.5 replace legacy exit anchors with border-based travel
|- H4   fix upward movement pressure and butterfly vibration with movement audits
|- H4.5 enforce exact one-unit block grid placement
|- H5   restore butterfly sprite fidelity from original high-resolution assets
|- H6   finish flower de-overlap / loaded-save cleanup verification
|- H6.5 add flower decay, rot cleanup, and reserve-food loop
|- H7   repair feed filters and remove contextless warning spam
|- H8   make talk visibly social through motive -> target -> response -> consequence
`- G0   rerun human capture, then only close G0 if held symptoms are gone
```

Claude should review whether this is the right order. It should feel free to
split, reorder, or rename phases if that makes implementation safer.

## Claude Output Requirements

Claude should create a new review document in `docs/` with:

1. Findings, ordered by severity.
2. A corrected phase plan, exact order.
3. For each phase:
   - goal,
   - files likely touched,
   - forbidden files or contracts,
   - implementation notes,
   - math/coordinate details,
   - acceptance tests,
   - screenshots/probes needed,
   - rollback/feature flag if useful.
4. A specific AI/emergence section, not just a short note.
5. A specific visual/spatial/3D math section.
6. A specific block/flower/object lifecycle section.
7. A specific battle/attack/ability radius section.
8. A specific "what Codex should implement first" section.
9. A final single copy-paste prompt that the user can give back to Codex.

That final prompt should include:

- path to Claude's review document,
- the exact first implementation task,
- the exact phase order,
- constraints,
- proof commands/screenshots/captures,
- where Codex should stop and ask for user approval.

## Important Tone / Judgment Request

Claude should be honest. It should not rubber-stamp the current plan.

If the current plan is too incremental for the user's goals, say so and propose
the smallest safe re-foundation. If a full rebuild is unnecessary or dangerous,
say that too and explain which contracts should remain.

The goal is not to preserve pride in prior work. The goal is to get to a game
that the player can understand visually and believe in emotionally.
