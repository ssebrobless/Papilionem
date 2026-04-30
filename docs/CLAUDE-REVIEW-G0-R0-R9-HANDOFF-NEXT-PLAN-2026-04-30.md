# Claude Review - G0 R0-R9 Handoff Next Plan

Date: 2026-04-30
Author: Claude Opus 4.7
Source request: `docs/CLAUDE-REVIEW-REQUEST-G0-R0-R9-HANDOFF-2026-04-30.md`
Binding upstream: `docs/CLAUDE-REVIEW-G0-VISUAL-SPATIAL-AI-2026-04-29.md`
Workspace: `C:\Users\fishe\Documents\projects\ephemera`
Status: binding for the next implementation slice; supersedes nothing in the
upstream Claude review except where the next plan is explicit about it.

---

## Section 0 - Executive Verdict

```text
verdict
|- R0..R9 contracts have all landed in code; the patches Claude specified
|  are in place and the audits Codex listed pass at the proof level
|- the build is materially closer to G0 close than the prior packet was
|- but G0 cannot be honestly closed yet; three classes of risk remain
|  |- "plumbing pass / behavior unproven" - hooks fire once in scripted lab,
|  |  no longitudinal evidence that they shape lived play in the user's eye
|  |- "ML on/off proves source distinction, not value" - the audit gates the
|  |  source path correctly but does not measure the metrics R8.5 promised
|  |  (conversation distinctness, edge churn, migration entropy, jitter ratio)
|  `- "cognition surfacing still cannot say loneliness/grief/jealousy" - the
|     vocabulary is rich enough for behavior bias and motive selection, but
|     it cannot express several feelings the user named as the real target
|- the spatial truth contract has migrated honestly for the playfield and
|  primary movement; remaining iso/screen calls are mostly debug bridges
|  but a small number are real contradictions worth a one-shot R10 pass
`- the next plan should NOT re-found the spatial system; it should
   |- prove behavior, not plumbing, on R8 (R10)
   |- finish moving the small set of remaining contradictions onto board
   |  truth (R11)
   |- add a deterministic scenario harness (R12)
   |- expand cognition expressively where the current vocabulary is
   |  visibly inadequate, with save-additive, staged, ML-respecting
   |  changes (R13..R16)
   `- collect the fresh G0 capture only AFTER R10..R12 land, since the
      capture is the closing proof, not the starting one
```

---

## Section 1 - Honest Read of R0-R9 (verified in code)

### What is actually in the build

| Phase | Code surface verified | Honest verdict |
| --- | --- | --- |
| R0.1 | `core/gameCore.js:4483-4485` `cameraFollow === true` guard | Landed. Ambient travel can no longer hijack focus unless `zoneTravel.cameraFollow === true`. |
| R0.2 | `core/renderManager.js:664-691` flatten + soft envelope edge | Landed. Out-of-play tint, `palette.ground` rect, single soft 60-alpha border, ambient grid bake call. No double border / hard inner rect. |
| R0.3 | `core/renderManager.js:3260` `if (this.isSimBoardWorld() && !isOverview && gameConfig?.world?.simBoardSuppressOverlay !== false) return` | Landed. Sim-board focused mode no longer paints the iso polygon overlay. |
| R1 | `renderManager.drawSimBoardAmbientGrid` (716-731), `drawSimBoardGridLines` (693-715), `getSimBoardAmbientGridConfig` | Landed. Grid bakes into ground via `drawSimBoardGround`. Diagnostic grid stays behind toggle. |
| R2 | `entities/butterfly.js:1211-1297` (`clampBoardTarget`, `makeBoardMovementTarget`, `screenPointToBoardTarget`, `normalizeMovementTarget`, `ensureBoardPos`, `applyScreenFromBoardPos`, `syncDebugGridPos`, `getMovementTargetBoardPos`); `core/renderManager.boardToScreen/screenToBoard` (517-547) | Landed. Movement target now lives in board units; gridPos is computed once per frame as a debug helper (`syncDebugGridPos`); render uses `boardToScreen`. The 39 remaining `gridPos` references inside butterfly.js are debug/back-compat reads only. |
| R3 | `entities/block.js:166-298` (`shouldSnapToCell`, `applyBoardCell`, `snapToBoardCell`, integer `Math.round(cell.h)` clamps), `systems/structureSystem.acceptCellPlacement` (and `findNearestAcceptedCell`) | Landed with care. Placement snaps integer u/v/h, rejects duplicate cells, requires support for h>0, rejects sun-court. Coercion path on load is wired through `block-cell-placement-rejected` runtime issue. |
| R4 | `entities/butterfly.js:390 (this.flightH = 0)`, `1119-1208` (config gate, oscillator, `getShadowScreenPoint`, `getFlightRenderOffset`), `core/renderManager.getAltitudeProbeForEntity` (581-605) | Landed. Shadow renders at h=0 board projection; sprite at flightH; debug probe override usable for altitude scenarios. |
| R5 | `qa_screenshots/r5_sprite_fidelity_audit/2026-04-30T04-12-00-802Z/` (proofs cited), debug-cache overlay screenshot present | Landed. Cache telemetry surfaced; screenshots in evidence packet. |
| R6 | `entities/flower.js:56-227` (spawnedAtFrame additive field, `getDecayFrames`, `isReadyToDecay`), reserve-food + dirt-pile transitions, `objectSystem` registration | Landed. Save reads `spawnedAtFrame` defaulted to current frame; decay, pile, reserve-food path exist. |
| R7 | `systems/communicationSystem.js:4502-4592` (`normalizeFeedCategory`, `getDialoguePairKey`, `getDialogueMotiveFamily`, `buildDialogueThreadDetail`, `getDialogueConsequenceTail`); `ui/gameUI.js:2540-2596` (warning grounding demote at line 2560 `groundedWarning ? warning : action`, `hasWarningGrounding`) | Landed. Categories canonicalize to talk/action/learn/warning/system; ungrounded warnings demote to action; same-pair lines within 3s collapse into thread rows; consequence tail formats edge deltas. |
| R8 | `systems/structureSystem.js:248-354` (heavy block carry-2, shelter trust scaling); `systems/zoneSystem.js:223-448` (scarcity pulse); `systems/communicationSystem.js:118-311` (distress cascade, scout discovery); `systems/mlInferenceSystem.js:155-167, 2280, 2419-2425, 2864` (outcome window lazy population at 60-frame delay) | Landed at the plumbing level. Cooperation audit shows each H1..H5 fires exactly once in scripted lab. ML on/off audit shows source distinction (ml=72 vs heuristic-fallback=68 in sample). |
| R9 | `docs/PLAYER-CURSOR-SOCIAL-SEAM.md` exists, linked from registry | Landed. Docs only. |

### Where the proof is honest, and where it overshoots

```text
honest enough to stand on
|- R0/R1/R2/R3/R4/R5 visual + spatial fixes are in code AND have proof
|- R6 flower lifecycle is in code AND has proof
|- R7 feed thread + warning grounding is in code AND has proof
|- R8 cooperation H1..H5 are wired AND each fires once in lab (audit pass)
|- R8 ML on/off proves the SOURCE switch works (ml vs heuristic-fallback)
|- R9 reservation doc exists
`- save schema 5 holds; only additive fields landed (flower.spawnedAtFrame)

overshoots / gaps
|- R8 ML on/off does NOT measure value-band metrics from upstream Section 6.5
|  |- conversation distinctness (chi-square) - missing
|  |- relationship edge churn - missing
|  |- migration target diversity (entropy) - missing
|  |- target-acquisition speed - missing
|  |- top-15% top-edge fraction - missing
|  |- jitter ratio - missing
|  `- only `topActions` is logged; that proves a behavior tilt, not value
|- R8 cooperation audits prove ONE event per hook, not lived-play frequency
|  |- "at least one help-on-distress per 5 minutes" - unproven in long play
|  |- "at least one informed-migration cluster per 5 minutes" - unproven
|  `- "reserveFoodBall sharing happens at least once in 5 minutes" - unproven
|- R7 thread aggregator runs in code; "warning ignored" / "lesson taken"
|  tail is emitted from communicationSystem; we do not yet have a fresh
|  human capture proving it READS as motive->target->response->consequence
|- R5 sprite cache telemetry surfaces, but the user-visible blur fix has not
|  been re-evaluated by the user; that is intentionally a human-judgment item
|- R6 dirt-pile cleanup has the affordance and path, but no audit proves
|  cleanup actually happens in lived play within 60s of pile creation
|- the original G0 user complaints (forced focus, green rectangle, top bias,
|  jitter, pixelated wings, stacked flowers, broken filters, scripted talk)
|  are addressed at the system level; no fresh human capture exists yet
```

The build is in much better shape than it was; the next plan should not
pretend the proofs already cover what the user actually wants to feel.

---

## Section 2 - Correctness Risks and Maintainability Concerns

### F-prime findings (verified against code)

#### F'1 (medium) - `getZoneAtGrid` short-circuit short-cuts wrong

`systems/zoneSystem.js:538-550`:

```js
getZoneAtGrid(gridX, gridY) {
    if (['section-scenes', 'sim-board'].includes(gameConfig?.world?.renderMode)) {
        return this.getFocusedZone();
    }
    // fallthrough scans bounds in iso space
}
```

In sim-board world the function ignores its arguments and returns the
currently focused zone. Several callers pass an entity's `gridPos`
(`saveSystem` line 66-67, `objectSystem` line 21, 143). When a butterfly is
mid edge-travel between ivy-cloister and pool-heart, every caller will be
told the entity is in the focused zone, regardless of board position. This
papers over the fact that `gridPos` is no longer authoritative AND the
function is making a zone decision that only the board projection should
make.

Fix shape: keep the focused-zone short-cut, but accept a `boardPos` overload
(`getZoneAtBoard(boardPos)`) that returns the zone whose board envelope
contains `(u, v)`. Migrate the four callers to pass boardPos when available.

#### F'2 (medium) - `isEntityWithinRadius` quietly falls back to screen-pixel distance

`systems/communicationSystem.js:382-393`:

```js
isEntityWithinRadius(source, target, radiusPx = 0, radiusUnits = null, zoneId = null) {
    if (Number.isFinite(radiusUnits)) {
        const boardDistance = this.getProjectedBoardDistanceUnits(source, target, zoneId);
        if (Number.isFinite(boardDistance)) {
            return boardDistance <= (radiusUnits + 0.025);
        }
    }
    const dx = (source.x || 0) - (target.x || 0);
    const dy = (source.y || 0) - (target.y || 0);
    return Math.hypot(dx, dy) <= Math.max(0, radiusPx || 0);
}
```

When a caller forgets to pass `radiusUnits`, the code silently uses raw
screen-pixel Euclidean distance. With the iso-style projection the y axis
is compressed by `groundT = 0.56`, so identical board distances produce
different screen distances. Any caller that still passes `radiusPx` only
will compute the wrong recipient set on the v axis.

Fix shape: require `radiusUnits` for any new call site; deprecate the
pixel-only path; add a runtime warning when only `radiusPx` is provided so
we can find the remaining legacy callers.

#### F'3 (medium) - `structureSystem.getBoardDistanceBetweenEntities` divides by hardcoded 20

`systems/structureSystem.js:270-277`:

```js
return Math.hypot((left?.x || 0) - (right?.x || 0), (left?.y || 0) - (right?.y || 0)) / 20;
```

The fallback uses 20 as ppu but does not consult the projection. Today
ppu is 20 everywhere, so this is currently silent; it becomes a bug the
moment a zone uses a different ppu.

Fix shape: divide by `this.getBoardPixelsPerUnit(zoneId)` (the helper
already exists nearby).

#### F'4 (medium) - `entities/block.js:101, 196, 288` rebuilds gridPos from x/y on every snap

After `applyBoardCell` and `snapToBoardCell`, the code recomputes
`gridPos = gridManager?.screenToIso?.(this.x, this.y)`. Block rendering
does not need this; the only consumer left is debug. The compute is cheap,
but it ties block placement to the legacy iso transform on every drop.

Fix shape: collapse into a single `syncDebugGridPos` helper on block (mirror
butterfly's pattern). Remove direct `gridManager.screenToIso` calls from
the placement path.

#### F'5 (medium) - `saveSystem` lines 1054, 1423, 1463, 1534 still rebuild gridPos on load and migration

Each `entity.gridPos = gridManager.screenToIso(...)` in saveSystem is a
write-only assignment whose only purpose is keeping legacy debug surfaces
working. None of these reads are required by the live runtime. They keep
the legacy field on an entity that has authoritative boardPos. They are
not correctness bugs but they tighten coupling between saveSystem and the
iso transform.

Fix shape: mark these as a single batch in R11 cleanup; replace with the
common helper `syncDebugGridPos(entity)`.

#### F'6 (low) - R8 ML on/off audit is honest about source but not value

`scripts/run-ml-on-off-capture-audit.js` only measures `policySourceCounts`
and `topActions`. The user originally asked whether ML buys anything
beyond connection. Today's audit cannot answer that. The metrics from
upstream Section 6.5 must be added before the user can judge whether to
keep investing in ML.

Fix shape: extend the audit to compute: pair-conversation distinctness
(chi-square over motive distribution per pair), per-minute |edgeDelta|
churn, migration entropy across zone targets, target acquisition latency,
top-15% top-edge fraction, jitter ratio. Output a side-by-side report.
Then RUN it on the lived save. (R10.)

#### F'7 (low) - cooperation hooks fire on cadence but no longitudinal floor exists

`systems/structureSystem.recordHeavyBlockCarryAttempt` cool-down is 180
frames; distress cascade and scout discovery are gated by lifeSim
state. The lab proves they CAN fire; they do not prove a floor of "at
least one event per 5 minutes" in lived play. Codex should add a long-soak
audit that runs a fixed 5-minute scenario seed and counts events per hook.

Fix shape: a 5-minute deterministic scenario harness counts H1..H5
events per zone. Pass criterion = each hook fires at least once. (R10.)

#### F'8 (low) - flower lifecycle has the path but no audit on cleanup occurrence

`scripts/run-r-flower-lifecycle-audit.js` proves the transitions exist.
It does not prove that, in lived play, dirt piles get cleaned up by a
butterfly within ~60 seconds of pile creation. The "soiled-place"
affordance exists but the actual approach + contact + pile destroyed
loop is not asserted longitudinally.

Fix shape: extend the lifecycle audit with a "lived-cleanup" lane that
seeds 8 piles, runs 60s, and asserts at least 6 cleaned. (R10.)

#### F'9 (low) - thread aggregation never emits "(heard: ...)" italic line

The upstream R7 spec proposed an "interpretation visibility" surface (S4)
that shows italic heard meaning under the spoken line when the recipient
misunderstood. The thread aggregator emits headline, lines, consequence
tail, but no italic heard-meaning. This is a user-visible expressivity
gap. Pure UI work; no save change.

Fix shape: when `residue.interpretation.misunderstood === true`, append
`(heard: <heardMeaning>)` to the thread row. Falls under R10 surfacing.

#### F'10 (low) - cognition vocabulary cannot explicitly express several
named feelings

The current locked families can BIAS behavior toward the user's named
feelings, but they cannot be inspected or surfaced as that feeling. The
user explicitly named loneliness, grief, jealousy, social insecurity,
comfort-seeking, and long-term bonding as the believability bar. None of
these have a first-class signal in feed or Inspect; some are only
inferable from drive/edge composites. This is the largest believability
gap in the build.

Fix shape: a STAGED additive expansion (R13..R16), each phase narrow,
save-additive, with a deterministic scenario test. See Section 6.

---

## Section 3 - Whole-Game 3D / Spatial Truth Audit

### Spatial trace per system

```text
projection
  visual   -> renderManager.boardToScreen({u,v,h}) -> screen{x,y,z}
  inverse  -> renderManager.screenToBoard(x,y,zoneId,hHint=0) -> {u,v,h}
  source   -> zoneSystem.getBoardConfigForZone(zoneId) per-zone projection
  state    -> CONSISTENT. One math owner; reversible at h=0.
  contradiction -> none.

butterfly movement
  visual   -> butterfly.x, butterfly.y derived per frame from boardToScreen
  truth    -> butterfly.boardPos is the canonical source post-R2
  intent   -> butterfly.movement.target is normalized to board units
  zone     -> butterfly.currentZoneId is authoritative for projection lookup
  audit    -> qa_screenshots/r_movement_board_truth_audit/2026-04-30T02-16-36-934Z/
  contradiction -> minor: gridPos is still rebuilt every frame from x/y for
                   debug; that is intentional but couples the runtime to the
                   legacy iso transform every frame.

butterfly altitude (R4)
  visual   -> shadow at boardToScreen({u,v,0}); sprite at boardToScreen({u,v,flightH})
  truth    -> butterfly.flightH (transient, NOT persisted)
  audit    -> qa_screenshots/r_altitude_probe/2026-04-30T03-15-43-614Z/
  contradiction -> none.

zones
  visual   -> baked background per zone; ambient grid bake; soft border;
              focused-mode chip
  truth    -> zoneSystem.getBoardConfigForZone(zoneId)
  bounds   -> placement region tightened in R1; assertions hold for normal play
  contradiction -> getZoneAtGrid short-circuits in sim-board world (F'1)

blocks
  truth    -> entities/block.boardPos {u,v,h} after R3 snap
  spawn    -> rejected in sun-court; supported test for h>0; integer cells
  carry    -> screen-anchor derived from carrier; boardPos derived from anchor
  visual   -> sortKey via computeRenderSortKey(boardPos)
  audit    -> qa_screenshots/r_block_cell_discipline_audit/2026-04-30T02-31-07-150Z/
  contradiction -> minor: gridPos rebuilt per snap; remove later (F'4)

flowers / food / piles
  truth    -> entities/flower.boardPos via syncBoardPosFromScreen
  spawn    -> spawnedAtFrame additive; per-zone cap; spacing live
  decay    -> 60s window -> dirtPile (subtype) -> cleanup affordance
  picked   -> reserveFood (no decay)
  audit    -> qa_screenshots/r_flower_lifecycle_audit/2026-04-30T04-21-48-528Z/
  contradiction -> low: cleanup verified at audit but not at lived-play floor
                   (F'8)

garden ability radii
  truth    -> isEntityWithinRadius(_,_,_, radiusUnits, zoneId) when radiusUnits set
  unit     -> radiusUnits in board units; visual ring projects via ppu / groundT
  contradiction -> medium: pixel fallback path is silent; legacy callers can
                   miss the v-axis compression (F'2)

battle ability radii
  truth    -> battleSystem motion.unitsPerArenaCell exists at line 227
  arena    -> top-down; battle math stays inside battleSystem
  audit    -> r5-battle-presentation-audit (regression guard)
  contradiction -> none verified inside the rays I checked.

ML feature inputs
  spatial  -> mlInferenceSystem stores boardPos in trace at line 2282, 2327-2332
  shared   -> spatialSemantics.verticality / structureRole / pathState / bodyFit
              owned by structureSystem; consumed by lifeSim + ML
  contradiction -> none in feature path; ML reads boardPos and the b3/b7 hooks.

UI readability
  visual   -> ambient grid (R1) + soft envelope (R0) + focused chip
  altitude -> shadow/sprite split per R4
  contradiction -> S4 interpretation italic line (heard: ...) is missing (F'9)

save continuity
  truth    -> schemaVersion 5; only additive (flower.spawnedAtFrame)
  load     -> normalizes boardPos; coerces blocks to legal cells; runtime issue
              emitted on coerce
  contradiction -> none yet observed.

life-sim spatial inputs
  truth    -> getEntityBoardPos returns clamped boardPos; falls back to
              screenToBoard if missing
  contradiction -> low (silent fallback OK at runtime; no lurking inverse bug
                   in the rays I checked)
```

### Sorted contradiction summary

```text
valid presentation math (keep as-is)
|- renderManager.computeLegacyRenderSortKey - documented fallback for entities
|  without boardPos
|- block.gridPos kept as a debug helper after snap
|- butterfly.syncDebugGridPos one-line debug helper called once per frame

questionable compatibility bridge (clean up in R11)
|- saveSystem.js lines 1054, 1423, 1463, 1534 - debug-only gridPos writes
|- structureSystem.getBoardDistanceBetweenEntities pixel fallback /20 hardcode
|- objectSystem.js lines 21, 143 - getZoneAtGrid call paths
|- block.js placement gridPos rebuilds (lines 101, 196, 288)

contradiction requiring concrete fix (R10/R11)
|- F'1 zoneSystem.getZoneAtGrid short-circuits in sim-board world
|- F'2 communicationSystem.isEntityWithinRadius silent pixel fallback
|- F'3 structureSystem fallback /20 hardcode
|- F'9 thread aggregator missing interpretation italic
```

The spatial system does NOT need a rebuild. The remaining contradictions
are surgical and named. The board/projection contract is honest enough to
support the social/cognition expansion in Section 6 without re-foundation.

---

## Section 4 - What Needs Fresh Human Capture vs What Is Code-Judgable

### Already judgable from code or audits

- the contracts of R0..R9 are landed (verified);
- R0 camera hijack is gone (guard exists);
- R0 inner rectangle/border is gone (renderManager flatten verified);
- R0 focused-mode polygon overlay is suppressed (renderManager guard verified);
- R1 ambient grid is wired into the bake (verified);
- R2 boardPos is the movement target (verified);
- R3 block placement integer-snaps and rejects sun-court (verified);
- R4 altitude split exists (verified);
- R5 cache telemetry is exposed (verified, screenshots in evidence packet);
- R6 lifecycle paths exist (verified);
- R7 feed categories normalize and warning ungrounding demotes (verified);
- R8 cooperation H1..H5 hooks fire under scripted conditions (audit pass);
- R8 ML on/off proves source distinction (audit shows source counts).

### Needs a fresh human capture before judgment

- whether the focused-mode field READS as one playfield in the user's eyes;
- whether ambient grid is "subtle enough" but "visible enough";
- whether butterfly altitude reads naturally without inspect;
- whether wing close-ups read as high fidelity (R5 user-judgment item);
- whether stacked-flower complaint is gone in lived play (long-soak,
  not the lab);
- whether the talk thread reads as motive -> target -> response ->
  consequence at human reading speed;
- whether the cooperation hooks (H1..H5) feel like real social pressure
  vs pity-fired one-shots in lab;
- whether the "feel of butterfly society" has crossed the line the user
  cares about, or is still on the wrong side.

The second list is intentional: those are the questions the human capture
exists to answer. The current packet is not equipped to answer them
without that capture.

---

## Section 5 - Cognition Vocabulary Honest Read

### Current vocabulary inventory (n1 lock)

```text
8 drives           selfMaintenance, safetyAvoidance, resourceControl,
                   socialConnection, caregiving, exploration,
                   statusExpression, rest
9 emotions         threat, relief, attachment, rejection, significance,
                   failure, curiosity, agitation, exhaustion
8 social edges     trust, comfort, attachment, dependence, rivalry,
                   resentment, admiration, protectiveness
8 memory families  place, object, interaction, outcome, routine, social,
                   danger, care
12 motives         maintenance, companionship, observation, admiration,
                   play, flirtation, repair, complaint, rivalry, warning,
                   teaching, statusPerformance
pair chemistry     ease, playfulness, tenderness, fascination, irritation,
                   longing, rivalryHeat, repairOpenness
society summaries  reputation, belonging, cliqueComfort, cliqueTension,
                   witnessedWarmth, witnessedEmbarrassment,
                   protectivenessField, teachingPrestige
distortion         traumaBias, anxietyBias, withdrawalBias, fixationBias,
                   insomniaBias, oversleepBias, warpedTeachingBias
```

### Coverage of the user's named feelings

| User feeling | Currently expressible? | How | What is missing |
| --- | --- | --- | --- |
| Affection | Yes | `attachment` edge + `tenderness` chemistry + `comfort` edge | None significant. |
| Loneliness | Weakly | low `socialConnection` drive + `rejection` emotion + low recent edge activity | No first-class derived signal; cannot be inspected; does not visibly drive seeking-others behavior independent from generic exploration. |
| Rivalry / jealousy | Partially | `rivalry` edge + `rivalryHeat` chemistry + `complaint`/`rivalry` motives | Jealousy as "my preferred partner spent time with X" is NOT modeled. Witnessed-affection-of-bond-partner has no specific reaction. |
| Grief / separation | No | `attachment` decays naturally; no event-driven loss signal | No bereavement packet on partner death/long absence; no routine/dialogue change on loss; no place-memory anchor that re-triggers seeking. |
| Pride | Partially | `significance` emotion + `statusExpression` drive + `teachingPrestige` summary | No event-anchored pride packet (won battle, raised young, helped under pressure). |
| Loyalty | Partially | `protectiveness` edge + `dependence` edge | Loyalty under conflict (chose to side with X over Y) has no explicit record. |
| Dependency | Yes | `dependence` edge | None significant. |
| Social insecurity | No | inferable from `confidence` low + `rejection` high + `witnessedEmbarrassment` summary | Not first-class; does not visibly bias dialogue style or movement-near-others. |
| Comfort-seeking | Partially | distress cascade calls caregivers TO them | The seeker themselves does not actively seek a caregiver based on internal state; the cascade is passive. |
| Long-term bonding | Weakly | high `attachment` + `comfort` + `trust` edges accumulate | No bond-tier ladder, no "this pair has been bonded for N seconds" milestone, no bonded-pair behavior unlock. |

The current vocabulary is good enough for behavior bias and motive
selection, but it is NOT good enough to surface those feelings to a human
who is looking for them. That is the believability gap.

### What I propose to add (staged, save-additive, ML-respecting)

```text
proposed cognition expansion (staged)
+-- E1 derived feelings (no save change)
|   +-- loneliness        derived from low socialConnection drive,
|   |                      low recent dialogue, no nearby attachment edge
|   +-- comfortSeeking    derived from high threat/exhaustion + low recent
|   |                      caregiving received
|   `-- socialInsecurity  derived from low confidence + recent
|                          witnessedEmbarrassment + recent rejection
+-- E2 bond-tier (additive durable per pair-edge)
|   +-- bondTier         enum: 'acquaintance' | 'familiar' | 'companion' | 'bonded'
|   |                      derived from co-time + edge composite + reciprocity
|   `-- bondedBehavior   threshold-gated (e.g., 'companion'): preferred roost,
|                          higher recovery scaling, joint scout invitations
+-- E3 grief packet (additive durable)
|   +-- bereavementPacket created on partner-death OR partner-absence > N min
|   |                      from a 'companion'+ bond
|   `-- effects           routine.movement bias toward last-shared-place,
|                          dialogue.motive shift toward observation/repair,
|                          slower recovery for ~K seconds, then fades
+-- E4 jealousy / witnessed rivalry (additive durable)
|   +-- witnessedAffection bystander packet when bond-partner shows
|   |                       high tenderness/playfulness with a third party
|   `-- effects             rivalry edge toward third party rises,
|                            rivalryHeat with bond-partner rises briefly,
|                            future approach to bond-partner cools for K sec
+-- E5 pride / shame anchors (additive durable)
|   +-- prideAnchor      packet created on (battle win, egg laid, helped
|   |                     someone in distress); biases statusExpression
|   `-- shameAnchor      packet created on (warning ignored, abandoned ally,
|                         broken promise); biases withdrawalBias
`-- E6 loyalty-under-conflict (additive derived)
    `-- loyaltyChoice   when forced to choose between two edges, the choice
                          becomes a packet; future choices bias toward the
                          chosen partner
```

Each addition is:

- save-additive (no schema break);
- functional emotion - stored, updated, behavior-driving, save-safe,
  inspectable, decayable;
- not consciousness - we do not claim subjective feeling;
- ML-respecting - ML may consume these as features but cannot mutate them;
- testable via deterministic scenarios.

The standard of "made real in the game" is honored:

```text
each new concept must change
  what causes it     (a named event or threshold)
  how long it lasts  (decay or durability)
  what choices change(action/target/signal/risk)
  movement           (proximity / avoidance / seeking)
  dialogue           (motive shift, tone shift)
  memory             (packet creation, decay)
  cooperation        (caregiving thresholds, distress threshold)
  player perception  (Inspect card, feed thread tail icon)
  save / migration   (additive durable field, default neutral)
  audit / capture    (deterministic scenario asserting the change)
```

Each E-phase below has a deterministic scenario harness in Section 7.

---

## Section 6 - Phase Plan, Exact Order

### Phase shape

```text
ladder for the next slice
+-- R10 prove R8 behavior  (extend ML on/off audit; long-soak cooperation;
|                            lifecycle cleanup floor; thread italics)
+-- R11 spatial cleanup     (close 4 named contradictions; debug-helper
|                            consolidation; no save change)
+-- R12 scenario harness    (deterministic scripted scenario engine for
|                            future phases; includes scenario manifest,
|                            assertion DSL, screenshot capture)
+-- G0H human capture       (only AFTER R10/R11/R12; the official close)
+-- E1 derived feelings     (loneliness, comfortSeeking, socialInsecurity)
+-- E2 bond-tier            (companion threshold + bonded behavior)
+-- E3 grief packet         (bereavement on bond-partner loss)
+-- E4 jealousy             (witnessed-affection of bond-partner)
+-- E5 pride / shame        (event-anchored memory packets)
`- E6 loyalty-under-conflict
```

R10..R12 are required before G0 closes.
E1..E6 are not required for G0 close, but they are the path to the
believability target the user named.

### R10 - Prove R8 behavior, not just plumbing

Goal: produce evidence that ML and cooperation hooks are doing real work,
not just connected. Surface the missing thread italic.

Owned files:
- `scripts/run-ml-on-off-capture-audit.js` (extend metric calc)
- `scripts/run-r-cooperation-pressure-audit.js` (extend with 5-min lane)
- `scripts/run-r-flower-lifecycle-audit.js` (extend with cleanup-floor lane)
- `systems/communicationSystem.js` (S4 interpretation italic in thread)
- `ui/gameUI.js` (render italic line under spoken in feed thread)
- one new file: `scripts/run-ml-value-band-audit.js` (NEW, optional split)

Forbidden files:
- entities/, save layer, ML runtime contract, gridManager.js, projection math

Contracts touched: none. No save schema change.

Implementation steps:

R10.1 - Extend ML on/off audit with the value-band metrics.
  - per pair, compute motive distribution; chi-square between mlOn/mlOff
  - per minute, sum |edgeDelta| across all edges, compare ml vs fb
  - per ml-decision row, compute target zone; compute Shannon entropy
  - per ml-decision row, compute time-to-arrive at chosen target
  - per butterfly, compute time-fraction with v < 0.15 * depthUnits
  - per butterfly, count sign-flips of velocity within 0.5 unit of target
  - Output a side-by-side report with each metric tagged
    `meets-threshold: true|false` against R8.5 thresholds.

R10.2 - Extend cooperation audit with a 5-minute scripted-seed lane.
  - fixed seed; deterministic; 5 minutes of game time
  - count H1..H5 events per minute and per 5-min window
  - assert each hook fires at least once in the window (current spec:
    "at least one event per 5 minutes")

R10.3 - Extend lifecycle audit with cleanup-floor lane.
  - seed 8 dirt piles in ivy-cloister; 12 butterflies present;
    fixed seed; 60s game time
  - assert at least 6 piles are gone (cleaned) by end

R10.4 - Add interpretation italic line to feed thread.
  - communicationSystem: include heardMeaning if
    `residue.interpretation.misunderstood === true`
  - gameUI feed thread row: render italic "(heard: <meaning>)" under
    the spoken line; respect existing thread-line cap (4)

Acceptance:
- ML value-band audit produces a report with at least 3 of 6 metrics
  meeting the R8.5 thresholds OR explicit numeric explanation of why
  they do not (this is signal, not a failure)
- cooperation 5-minute audit reports >=1 event per hook
- lifecycle cleanup audit reports >=6/8 piles cleaned
- italic line appears in audit screenshots when misunderstood = true

Probes:
```
node scripts/run-ml-on-off-capture-audit.js
node scripts/run-r-cooperation-pressure-audit.js
node scripts/run-r-flower-lifecycle-audit.js
node scripts/run-r-feed-thread-audit.js
node scripts/run-runtime-self-audit.js
```

Rollback: each audit extension is additive; UI italic gated by
`gameConfig.ui.feedThreads.interpretationItalic = true` (default true).

Risks:
- ML value-band audit may show ML is NOT meeting thresholds; that is
  evidence, not failure. Document the result honestly.
- italic line may overflow thread row at narrow widths; cap at 60 chars.

Deterministic scenario test: see Section 7.1 (R10-scenario-mlValue) and
7.2 (R10-scenario-cooperationFloor) and 7.3 (R10-scenario-cleanupFloor).

### R11 - Spatial cleanup (4 named contradictions, no save change)

Goal: close F'1, F'2, F'3, F'4 and consolidate debug gridPos rebuilds.

Owned files:
- `systems/zoneSystem.js` (add `getZoneAtBoard(boardPos)`; keep
  `getZoneAtGrid` as a back-compat wrapper)
- `systems/communicationSystem.js` (deprecate pixel-only path with a
  one-time runtime warning when `radiusUnits` is missing)
- `systems/structureSystem.js` (replace `/20` hardcode with
  `getBoardPixelsPerUnit(zoneId)`)
- `entities/block.js` (consolidate to `syncDebugGridPos`; remove direct
  `gridManager.screenToIso` calls from placement)
- `systems/saveSystem.js` (replace 4 inline gridPos rebuilds with
  `syncDebugGridPos`)
- `core/butterflyStore.js` (no behavior change; verify primary truth
  stays board)

Forbidden files:
- save schema, ML runtime, projection math, render math beyond the
  named callers

Contracts touched: none beyond a deprecation log channel.

Implementation steps:

R11.1 - `zoneSystem.getZoneAtBoard(boardPos)` returns zone whose board
  envelope contains `(u, v)`; `getZoneAtGrid` keeps the focused-zone
  short-circuit AND adds a one-time warning that the entity should
  pass boardPos.

R11.2 - `communicationSystem.isEntityWithinRadius` keeps both paths but
  emits a runtime issue `legacy-radius-px-only` once per call site.

R11.3 - `structureSystem.getBoardDistanceBetweenEntities` reads
  `getBoardPixelsPerUnit(zoneId)` instead of /20.

R11.4 - `entities/block.js` adds `syncDebugGridPos()` (mirroring
  butterfly's helper); remove direct `screenToIso` calls.

R11.5 - `saveSystem.js` replaces the 4 inline writes with the new helper.

Acceptance:
- runtime self audit stays green
- block discipline audit stays green
- carry-stack physics audit stays green
- communication audit stays green
- new probe: `scripts/run-r-spatial-cleanup-audit.js` asserts:
  - no entity ends a frame with non-null gridPos that disagrees with
    boardPos beyond 0.5 board units in either axis
  - all `getBoardDistanceBetweenEntities` calls use the projection ppu
  - `getZoneAtBoard` returns a zone for every test boardPos

Rollback flag: `gameConfig.spatial.boardZoneLookup = true` (default true).

Risks:
- the deprecation warning may fire often; that is the point. Keep the
  rate-limiter (once per call site).
- some legacy debug dashboards may read `gridPos`; verify before removal.

Deterministic scenario test: see Section 7.4 (R11-scenario-spatialTruth).

### R12 - Deterministic scenario harness

Goal: a reusable scripted scenario engine so Codex can prove rare social,
spatial, battle, or ML behavior without depending on long-running random
saves.

Owned files:
- `scripts/scenario/index.js` (NEW; harness entry)
- `scripts/scenario/runner.js` (NEW; loads a scenario file, applies
  initial state, runs the timeline, asserts, writes report)
- `scripts/scenario/dsl.js` (NEW; small assertion DSL)
- `scripts/scenario/scenarios/` (NEW; directory of scenario files)
- `scripts/run-scenario.js` (NEW; CLI: `node scripts/run-scenario.js <name>`)

Forbidden files:
- entities/, systems/ (the harness is a runner; it does not patch live
  systems)
- save schema, render math

Contracts touched: none; the harness reads and writes via existing
public surfaces (gameCore, lifeSimSystem, communicationSystem, etc.)

Implementation steps:

R12.1 - Define a scenario file shape (example):

```text
{
  "name": "affection-confirmation",
  "seed": 4242,
  "world": {
    "renderMode": "sim-board",
    "focusedZoneId": "ivy-cloister",
    "scarcity": false
  },
  "butterflies": [
    {
      "id": "b-anchor",
      "boardPos": { "u": 10, "v": 8, "h": 0 },
      "traits": { ... },
      "drives": { "socialConnection": 0.8 },
      "edgesTo": [
        { "id": "b-partner", "trust": 0.6, "comfort": 0.55,
          "attachment": 0.7 }
      ]
    },
    {
      "id": "b-partner",
      "boardPos": { "u": 11, "v": 8, "h": 0 },
      ...
    }
  ],
  "world_objects": [
    { "type": "flower", "boardPos": { "u": 12, "v": 8, "h": 0 } }
  ],
  "timeline": [
    { "atFrame": 60, "action": "emit_signal",
      "from": "b-anchor", "to": "b-partner", "motive": "companionship" },
    { "atFrame": 180, "assert": {
        "edge_delta": { "from": "b-anchor", "to": "b-partner",
          "field": "attachment", "min_delta": 0.02 },
        "movement": { "id": "b-anchor", "near_id": "b-partner",
          "max_units": 1.5 } } }
  ],
  "screenshot_at": [120, 240, 480],
  "report_path": "qa_screenshots/scenario/<name>/<timestamp>/"
}
```

R12.2 - The runner:
- boots gameCore in scenario mode
- applies butterflies (`butterflyStore.spawnExact`)
- applies world state
- steps the timeline frame-by-frame, applies actions, captures
  screenshots, runs assertions
- writes a report.json with pass/fail, per-assertion result, screenshot
  paths

R12.3 - Initial scenarios shipped with R12:
- scenario/seed-affection.json (used by E1 / E2)
- scenario/seed-grief.json (used by E3)
- scenario/seed-jealousy.json (used by E4)
- scenario/seed-pride.json (used by E5)
- scenario/seed-loneliness.json (used by E1)
- scenario/seed-cooperation-h1.json (used by R10/E)
- scenario/seed-spatial-truth.json (used by R11)
- scenario/seed-flower-lifecycle.json (used by R10)
- scenario/seed-battle-radius.json (used by ability presentation)
- scenario/seed-ml-value.json (used by R10/ML)

Acceptance:
- `node scripts/run-scenario.js seed-spatial-truth` exits 0 with a
  report.json in `qa_screenshots/scenario/seed-spatial-truth/<ts>/`
- runner is deterministic: same seed produces same assertion outcomes
- runner does not mutate save files
- runner can be invoked from the existing audit scripts

Rollback: feature is purely new; remove the harness directory if needed.

Risks:
- scenario seeding may bypass some spawn-time validation; document the
  difference between scenario-spawned and lived-spawned butterflies.

Deterministic scenario test: this phase IS the harness. Self-test runs
all 10 seeded scenarios.

### G0H - Human capture (the official close)

Goal: confirm the 14 G0 close conditions in lived play.

Owned files: none; this is a capture step.

Procedure:
- record one fresh capture of >= 7 minutes of lived play
- visit all four zones via player UI buttons
- allow ambient migrators to cross zones
- inspect 3 different butterflies via the Inspect surface
- save mid-session, reload, inspect that the same butterflies retain
  identity, memory, edges
- collect 4 focused-mode screenshots, 1 overview screenshot, and 4 wing
  close-ups

Acceptance: 14 G0 close conditions from upstream Section 7 G0 close (line
1664-1685) all hold. Document any that do not as "G0 hold residual".

### E1 - Derived feelings (loneliness, comfortSeeking, socialInsecurity)

Goal: surface three feelings that are currently inferable but not visible
or behavior-driving on their own.

Owned files:
- `systems/lifeSimSystem.js` (derive `derivedFeelings` shape per entity
  on the existing tick)
- `systems/communicationSystem.js` (motive bias when feelings cross
  threshold)
- `ui/gameUI.js` (Inspect card surface; feed thread tag when the
  triggering line is selected as a result of a feeling threshold)
- `systems/mlInferenceSystem.js` (read-only consumption as feature row
  additions; no policy change yet)

Forbidden files:
- save schema (E1 is purely derived; no durable field)
- entities/, structureSystem placement, render math

Contracts touched: additive feature group `derivedFeelings`. ML feature
schema bumps to `m4-feature-schema-v2` with strictly additive tail.

Implementation steps:

E1.1 - lifeSimSystem.deriveDerivedFeelings(entity):

```text
loneliness =
  base = (1 - clamp01(socialConnection drive)) * 0.4
  + (1 - clamp01(belonging summary)) * 0.2
  + (1 - clamp01(recentSocialActivity)) * 0.2
  + (max(0, 0.5 - nearbyEdgeAffection)) * 0.2
  + decay over time toward (1 - belonging)

comfortSeeking =
  base = clamp01(threat emotion) * 0.4
  + clamp01(exhaustion emotion) * 0.3
  + max(0, 0.4 - recentCaregivingReceived) * 0.3
  + decay toward 0 when receivedCaregiving > 0

socialInsecurity =
  base = (1 - clamp01(confidence summary)) * 0.4
  + clamp01(rejection emotion) * 0.3
  + clamp01(witnessedEmbarrassment summary) * 0.3
  decays slowly back toward (1 - confidence)
```

E1.2 - motive bias:
- when loneliness > 0.55: bias toward 'companionship' / 'observation'
- when comfortSeeking > 0.55: bias toward emit 'distress' (existing)
  AND bias movement toward nearest high-protectiveness/caregiver edge
- when socialInsecurity > 0.55: bias dialogue style toward 'guarded' or
  'soft', cap warmth slope, increase pause-before-speak

E1.3 - Inspect card "Feelings" with three rows; existing card grid.

E1.4 - feed thread tag:
- when a thread row was created with the motive selected because a
  derived feeling threshold was crossed, add a small icon (UI-only) to
  the thread row indicating the source feeling

Acceptance:
- `scripts/run-scenario.js seed-loneliness`:
  - butterfly placed alone in moss-hollow, no other butterflies in zone
    for 60s of game time
  - assert: loneliness rises above 0.55 by t=60s
  - assert: butterfly's chosen target boardPos approaches the nearest
    zone exit toward another zone with butterflies
  - assert: dialogue motive on next emit is 'companionship' or
    'observation'
- runtime self-audit stays green
- ML feature schema audit shows `derivedFeelings` group present and
  populated

Probes:
```
node scripts/run-scenario.js seed-loneliness
node scripts/run-lifesim-expression-audit.js
node scripts/run-runtime-self-audit.js
```

Rollback: `gameConfig.cognition.derivedFeelings.enabled = true`.

Risks:
- thresholds may need tuning; ship with conservative thresholds and
  expand only if scenario tests prove behavior is too quiet.

### E2 - Bond-tier ladder

Goal: explicit bond progression so the player can see "X and Y are
companions" instead of inferring it from edge composites.

Owned files:
- `systems/lifeSimSystem.js` (derive bondTier per pair-edge per tick)
- `systems/communicationSystem.js` (bonded-pair dialogue style)
- `systems/structureSystem.js` (bonded-pair recovery scaling cap raises)
- `ui/gameUI.js` (Inspect card: pair texture row gains tier label)
- `systems/saveSystem.js` (additive: persist bondTier on edge)

Forbidden files:
- ML runtime contract, render math, projection math

Contracts touched: additive `socialEdges[id].bondTier` per pair;
schemaVersion stays 5; loader defaults missing bondTier to
'acquaintance'.

Implementation steps:

E2.1 - bondTier derivation per pair-edge:

```text
bondTier(edge, pairChemistry, coTimeSeconds) =
  if attachment >= 0.7 AND comfort >= 0.55 AND trust >= 0.55
     AND coTimeSeconds >= 1800 (30 min)         -> 'bonded'
  if attachment >= 0.5 AND comfort >= 0.4 AND trust >= 0.4
     AND coTimeSeconds >= 600 (10 min)          -> 'companion'
  if (any edge channel >= 0.3) AND coTimeSeconds >= 60 -> 'familiar'
  else                                            -> 'acquaintance'

  bondTier may only INCREASE within a session; demotion happens only
  through betrayal events (E4) or edge collapse below floor for >= K min.
```

E2.2 - bonded-pair behavior:
- shelter recovery scaling for 'companion'+ co-occupants caps at 1.8
  (was 1.6); 'bonded' caps at 2.0
- distress cascade gives priority to 'companion'+ partners even if not
  closest by board distance
- scout discovery emits invitations preferentially to 'companion'+

E2.3 - dialogue style for bonded pairs:
- 'bonded' pair emits 'check_in' on lower threshold (less explicit
  trigger needed)
- 'bonded' pair pauses speak-before-respond shorter

E2.4 - additive save: `socialEdges[id].bondTier`,
`socialEdges[id].coTimeSeconds`, `socialEdges[id].lastTierChangeAtFrame`.

Acceptance:
- `scripts/run-scenario.js seed-bond-progression`:
  - two butterflies seeded with all-zero edges, placed near each other
    in a small zone, 30 minutes of game time scripted
  - assert: tier ladder progresses through familiar -> companion -> bonded
  - assert: tier visible in Inspect at each step
  - assert: shelter recovery scaling holds at 1.6 before 'companion',
    rises after, with delta visible in audit
- save round-trip preserves bondTier
- ML feature audit shows bondTier present in social feature row

Rollback: `gameConfig.cognition.bondTier.enabled = true`.

Risks:
- tier progression may be too slow; tune coTime thresholds via scenario
  iteration; do NOT ship a "fast-forward" since slow progression IS the
  feature.

### E3 - Grief packet

Goal: when a 'companion' or 'bonded' partner dies or is absent for >5min,
the surviving butterfly enters a brief bereavement state with visible
behavior change.

Owned files:
- `systems/lifeSimSystem.js` (bereavement packet creation; effects on
  derived behavior bias)
- `systems/communicationSystem.js` (grief-tagged dialogue motive bias)
- `systems/saveSystem.js` (additive: bereavement packets per butterfly)
- `ui/gameUI.js` (Inspect card: 'Memory' surface gains grief packet)

Forbidden files:
- entity death pipeline (event consumed, not modified)
- render math

Contracts touched: additive `lifeSim.memories.social[].bereavement = {
partnerId, lostAtFrame, lastSharedZoneId, lastSharedBoardPos,
intensity }`.

Implementation steps:

E3.1 - hook entity death event (existing eventBus):
- on butterfly death: for each surviving entity with edge.bondTier
  in ('companion', 'bonded') with the deceased, create a bereavement
  packet
- packet stores partnerId, lostAtFrame, lastSharedZoneId,
  lastSharedBoardPos (from memory.place), intensity (function of edge
  attachment + comfort + coTime)

E3.2 - effects on behavior bias (over the next ~3 minutes of game time):
- routine.movement bias toward lastSharedZoneId / lastSharedBoardPos
- recovery rate * 0.85
- dialogue motive bias toward 'observation' or 'soft repair'
- comfortSeeking += 0.2 with slow decay
- protectiveness toward third parties slightly raised (the survivor
  becomes more protective of others, not less)

E3.3 - long-absence variant:
- if a 'companion'/'bonded' partner has not been observed in same zone
  for > 5 minutes of game time, treat as soft-bereavement (intensity
  halved; effects shorter)

E3.4 - inspect surfacing:
- Memory card shows "Misses <partnerName>" with intensity bar
- feed thread for the survivor's next dialogue tags the source

Acceptance:
- `scripts/run-scenario.js seed-grief`:
  - two butterflies seeded as a 'bonded' pair, one is killed at t=120s
  - assert: bereavement packet exists on survivor at t=121s
  - assert: survivor's chosen target is within 2.0 board units of
    lastSharedBoardPos within the next 30s
  - assert: survivor's recovery rate is < 0.9 of baseline for next 60s
  - assert: at least one dialogue line emitted within 30s tagged
    'observation' or 'soft repair'
  - assert: Inspect screenshot shows the grief packet
- save round-trip preserves bereavement packets
- bereavement packet decays to zero over ~3 min and is then garbage-
  collected (not retained as durable shame)

Rollback: `gameConfig.cognition.grief.enabled = true`.

Risks:
- grief may misfire for transient absences (zone travel); guard with
  the bondTier threshold.
- Inspect surfacing must not claim subjective feeling; UI text must
  read as functional ("misses <name> for 2:14 more") not metaphysical.

### E4 - Jealousy (witnessed-affection of bond-partner)

Goal: when a butterfly's 'companion'+ partner shows tenderness/play
to a third party, the witness reacts.

Owned files:
- `systems/lifeSimSystem.js` (witnessedAffection packet)
- `systems/communicationSystem.js` (jealousy-tagged motive bias)
- `systems/saveSystem.js` (additive: witnessedAffection rolling buffer)
- `ui/gameUI.js` (Inspect card: pair texture surfaces "feels jealous")

Forbidden files: render math; battle math

Contracts touched: additive `lifeSim.derivedFeelings.jealousy` (per
witnessed-affection event); decays.

Implementation steps:

E4.1 - on dialogue emit, when (sourceId, targetId) pair has chemistry
tenderness or playfulness > 0.5 AND a third butterfly in zone has a
'companion'+ bond with sourceId AND has line-of-sight (within
visibility radius), create a witnessedAffection packet on the third
butterfly:

```text
witnessedAffection {
  watchedAtFrame,
  bondPartnerId: sourceId,
  thirdPartyId: targetId,
  intensity: tenderness + playfulness
}
```

E4.2 - effects (next ~30s):
- jealousy derived feeling rises by intensity * 0.3
- rivalry edge with thirdPartyId rises slightly
- approach to bondPartnerId cools (target preference decreased) for ~K sec
- next dialogue motive may bias toward 'complaint' or 'rivalry'

E4.3 - decay: jealousy decays to 0 over ~30s if no further witness;
witnessed packets are pruned after 60s.

Acceptance:
- `scripts/run-scenario.js seed-jealousy`:
  - three butterflies seeded; A and B as 'companion' bond; C neutral
  - script: at t=60s, B emits high-tenderness dialogue toward C while
    A is in line-of-sight (within 6 units)
  - assert: A's witnessedAffection packet exists at t=61s
  - assert: A's jealousy > 0.3 at t=62s
  - assert: A's edge.rivalry toward C rises by >= 0.05 within 30s
  - assert: A's next chosen target is NOT B for the next 20s

Rollback: `gameConfig.cognition.jealousy.enabled = true`.

Risks:
- jealousy may misfire on routine roost-mate observations; gate strictly
  on the chemistry threshold AND on visibility AND on a 60s cooldown.

### E5 - Pride / shame anchors

Goal: event-anchored memory packets that bias future statusExpression
and withdrawalBias.

Owned files:
- `systems/lifeSimSystem.js` (anchor packet creation; bias derivation)
- `systems/saveSystem.js` (additive: prideAnchors / shameAnchors arrays)
- `ui/gameUI.js` (Inspect card: 'Pride / Shame' row)

Forbidden files: render math; battle math; ML runtime contract

Contracts touched: additive `lifeSim.memories.outcome[].anchor = 'pride' |
'shame' | null`.

Implementation steps:

E5.1 - pride anchor triggers:
- battle win when butterfly's contribution was scored highly
- successful caregiving in distress cascade
- led a successful scout-discovery cluster
- raised an egg to chrysalis

E5.2 - shame anchor triggers:
- warning emitted but ignored AND followed by harm to another
- abandoned an ally during distress cascade
- broke a bond (rare; reserved for E6)

E5.3 - effects:
- pride anchor: statusExpression baseline +0.05 for 5 minutes; biases
  motive toward 'admiration' / 'statusPerformance'
- shame anchor: withdrawalBias +0.05 for 5 minutes; biases motive
  toward 'observation' / 'repair'

E5.4 - anchors decay strength over 5 min but the packet itself stays
in memory (becomes a 'remembered moment' the butterfly may revisit).

Acceptance:
- `scripts/run-scenario.js seed-pride`:
  - three butterflies; one is in distress; one is a high-caregiving
    candidate
  - script: caregiver responds to distress; distress drops
  - assert: pride anchor packet exists on caregiver at t=120s
  - assert: caregiver's statusExpression is > baseline for next 60s
  - assert: caregiver emits at least one 'admiration' or
    'statusPerformance' line within 90s
- shame anchor parallel scenario (`seed-shame.json`)
- save round-trip preserves both anchor types

Rollback: `gameConfig.cognition.anchors.enabled = true`.

Risks:
- spam: cap pride/shame anchor creation at 1 per 5 min per butterfly to
  avoid the feed becoming a trophy log.

### E6 - Loyalty under conflict

Goal: when a butterfly is forced to choose between two strong edges, the
choice becomes a packet and biases future similar choices.

Owned files:
- `systems/lifeSimSystem.js` (loyaltyChoice packet creation; bias)
- `systems/saveSystem.js` (additive: loyaltyChoice packets)

Forbidden files: render math; battle math

Contracts touched: additive `lifeSim.memories.social[].loyaltyChoice`.

Implementation steps:

E6.1 - detection: when two butterflies emit competing distress signals
within the same window, OR two butterflies emit competing scout-invitations
to different zones, the witness's chosen response counts as a loyalty
choice (favoring the chosen partner).

E6.2 - packet records (atFrame, chosenPartnerId, rejectedPartnerId,
chemistry of each at choice time).

E6.3 - effects (long-tail):
- chosen edge.loyalty +0.05
- rejected edge.loyalty -0.02 (small)
- future similar choices: bias toward the previously chosen pattern

Acceptance:
- `scripts/run-scenario.js seed-loyalty`:
  - three butterflies A, B, C; A has equal edges with B and C
  - script: B and C emit simultaneous distress calls in different
    directions
  - assert: A chooses one (e.g., B) and creates a loyaltyChoice packet
  - assert: in a second scripted choice 3 minutes later, A is more
    likely to choose B than random

Rollback: `gameConfig.cognition.loyalty.enabled = true`.

Risks:
- "competing signals" detection may pick up false positives in noisy
  scenes; require both signals to be in the top-3 priority sources for
  the witness within 2s.

---

## Section 7 - Deterministic Scenario Test Catalog

This section gives Codex one named scenario per implementation phase. Each
scenario is a single JSON file consumable by R12's harness. Until R12 ships,
these are runnable as targeted audit scripts (one per scenario).

### 7.1 R10-scenario-mlValue (`seed-ml-value.json`)

```text
seed: 7777
world: { renderMode: sim-board, focusedZoneId: 'ivy-cloister' }
butterflies: 12 fixed-trait, 3 species, 2 high-affection pairs
flowers: 6, fixed boardPos
duration: 120s game time
variantA: gameConfig.ml.preferModelBacked = true
variantB: gameConfig.ml.preferModelBacked = false
metrics: chi-square motive, edge churn, migration entropy, jitter ratio
assertions:
  - both variants run without errors
  - metric report.json contains all six metrics
  - metric thresholds tagged meet-or-not
artifacts: report.json, two screenshot stacks (8 each)
pass: report exists and at least 3 of 6 metrics are explicitly evaluated
```

### 7.2 R10-scenario-cooperationFloor (`seed-cooperation-floor.json`)

```text
seed: 4242
world: { renderMode: sim-board, focusedZoneId: 'ivy-cloister' }
butterflies: 14 with mixed traits and 2 'companion' pairs
blocks: 4 heavy (h=3), 6 normal
flowers: 8 (will be hit by scarcity at t=180s)
duration: 300s (5 min)
inject: scarcity pulse at t=180s; distress at t=240s
assertions:
  - heavy block carry-2 fires >= 1
  - shelter trust scaling > 1.0 observed >= 1
  - scarcity sharing fires >= 1
  - distress cascade fires >= 1
  - scout discovery fires >= 1
artifacts: report.json + 5 screenshots
pass: each H1..H5 fires >= 1
```

### 7.3 R10-scenario-cleanupFloor (`seed-cleanup-floor.json`)

```text
seed: 9090
world: { renderMode: sim-board, focusedZoneId: 'moss-hollow' }
butterflies: 12, mixed selfMaintenance / caregiving traits
seeded objects: 8 dirt-piles at fixed boardPos
duration: 60s
assertions:
  - >= 6 dirt-piles cleaned (removed) by t=60s
  - all cleanups are by butterflies with high selfMaintenance OR
    caregiving
  - each cleanup emits a soiled-place affordance read trace
artifacts: report.json + before/after screenshots
pass: cleanup count >= 6
```

### 7.4 R11-scenario-spatialTruth (`seed-spatial-truth.json`)

```text
seed: 1010
world: { renderMode: sim-board, focusedZoneId: 'pool-heart' }
butterflies: 10 placed at u in [2,30], v in [2,18]
script:
  for each butterfly, set target near each zone edge across 4 stages
assertions:
  - boardPos.v stays in [0.5, depthUnits-0.5]
  - boardPos.u stays in [0.5, widthUnits-0.5]
  - screen.x derived from boardPos matches butterfly.x within 0.5 px
  - getZoneAtBoard(boardPos) returns the focused zone for all
  - getBoardDistanceBetweenEntities(b, b') matches Euclidean board distance
    within 0.05 units
artifacts: report.json + 4 screenshots
pass: all assertions hold for >= 95% of frames
```

### 7.5 E1-scenario-loneliness (`seed-loneliness.json`)

```text
seed: 1313
world: { renderMode: sim-board, focusedZoneId: 'moss-hollow' }
butterflies: 1 ('lonely'), placed alone, no other butterflies in zone
adjacent zone (pool-heart): 4 butterflies present
duration: 60s game time
assertions:
  - lonely.derivedFeelings.loneliness > 0.55 by t=60s
  - lonely.movement.target boardPos within 1.5 units of pool-heart
    edge by t=60s
  - lonely.dialogue motive on next emit is 'companionship' or
    'observation'
artifacts: report.json + 1 screenshot per 15s
pass: all assertions hold
```

### 7.6 E2-scenario-bondProgression (`seed-bond-progression.json`)

```text
seed: 2424
world: { renderMode: sim-board, focusedZoneId: 'ivy-cloister' }
butterflies: 2 ('A', 'B') seeded with all-zero social edges
placed within 2 units of each other; flowers nearby
duration: 30 min game time (180000 frames @ 60fps)
periodic injects: ambient signals every 30s to encourage talk
assertions:
  - A's edge to B reaches 'familiar' within 90s
  - reaches 'companion' within 12 min
  - reaches 'bonded' within 30 min
  - shelter recovery scaling cap rises at 'companion' / 'bonded'
artifacts: report.json + 4 screenshots at tier transitions
pass: each tier transition observed
```

### 7.7 E3-scenario-grief (`seed-grief.json`)

```text
seed: 3535
world: { renderMode: sim-board, focusedZoneId: 'ivy-cloister' }
butterflies: 2 ('A', 'B') seeded as a 'bonded' pair (E2 must be live)
duration: 240s
inject: B dies at t=120s
assertions:
  - A's bereavement packet exists at t=121s
  - A's chosen target within 2.0 board units of lastSharedBoardPos
    within next 30s
  - A's recovery rate < 0.9 of baseline for next 60s
  - A emits at least one 'observation' or 'soft repair' line within 30s
  - Inspect screenshot at t=160s shows the grief packet
artifacts: report.json + 4 screenshots
pass: all assertions
```

### 7.8 E4-scenario-jealousy (`seed-jealousy.json`)

```text
seed: 4646
world: { renderMode: sim-board, focusedZoneId: 'ivy-cloister' }
butterflies: 3 ('A', 'B', 'C')
A and B seeded as 'companion' pair; C neutral
all within 6 units of each other
duration: 120s
inject: at t=60s, B emits high-tenderness dialogue toward C
assertions:
  - A's witnessedAffection packet exists at t=61s
  - A's jealousy > 0.3 at t=62s
  - A's edge.rivalry to C rises by >= 0.05 within 30s
  - A's next chosen target is NOT B for next 20s
artifacts: report.json + 3 screenshots
pass: all assertions
```

### 7.9 E5-scenario-pride (`seed-pride.json`)

```text
seed: 5757
world: { renderMode: sim-board, focusedZoneId: 'pool-heart' }
butterflies: 3 ('A', 'B', 'C')
A high caregiving trait; B in scripted distress at t=60s
duration: 240s
assertions:
  - A responds to B's distress by t=80s
  - B's distress drops by t=120s
  - A's prideAnchor packet exists at t=120s
  - A's statusExpression > baseline for next 60s
  - A emits at least one 'admiration' or 'statusPerformance' line
    within 90s of the anchor
artifacts: report.json + 4 screenshots
pass: all assertions
```

### 7.10 E5-scenario-shame (`seed-shame.json`)

```text
seed: 5858
world: { renderMode: sim-board, focusedZoneId: 'ivy-cloister' }
butterflies: 3 ('A', 'B', 'C')
A high caregiving trait; A is currently in 'guarded' pair texture with B;
B in scripted distress at t=60s; A scripted to ignore (target away)
duration: 240s
inject: B suffers harm at t=80s due to A's no-response
assertions:
  - A's shameAnchor packet exists at t=120s
  - A's withdrawalBias > baseline for next 60s
  - A emits at least one 'observation' or 'repair' line within 90s
artifacts: report.json + 4 screenshots
pass: all assertions
```

### 7.11 E6-scenario-loyalty (`seed-loyalty.json`)

```text
seed: 6868
world: { renderMode: sim-board, focusedZoneId: 'ivy-cloister' }
butterflies: 3 ('A', 'B', 'C') with A having equal edges to B and C
duration: 360s
inject:
  at t=60s: B emits distress (north of A)
  at t=60s: C emits distress (south of A)
  at t=240s: same setup repeated (B north, C south)
assertions:
  - A chooses one partner (record which) at first event
  - A's loyaltyChoice packet exists at t=61s
  - at second event, A is at least 60% likely to choose the same partner
artifacts: report.json + 4 screenshots
pass: all assertions
```

### Scenario family coverage check

```text
family vs scenario coverage
+-- affection / attachment           seed-bond-progression (E2)
+-- rivalry / jealousy / conflict    seed-jealousy (E4)
+-- loneliness / seeking             seed-loneliness (E1)
+-- grief / absence / separation     seed-grief (E3)
+-- cooperation                      seed-cooperation-floor (R10)
+-- spatial truth                    seed-spatial-truth (R11)
+-- flower lifecycle                 seed-cleanup-floor (R10)
+-- battle ability radius            (existing r5-battle-presentation;
|                                     promote to scenario in R12.3)
`-- ML value                         seed-ml-value (R10)
```

Coverage is complete for the named families.

---

## Section 8 - Behavior-Source Taxonomy Map

For each new concept proposed, the table below tags the source so future
contributors do not confuse hand-coded logic with ML-scored or learned.

| Concept | Source | Owner |
| --- | --- | --- |
| loneliness derived | feedback-loop simulation | lifeSimSystem |
| comfortSeeking derived | feedback-loop simulation | lifeSimSystem |
| socialInsecurity derived | feedback-loop simulation | lifeSimSystem |
| bondTier ladder | direct rule branch (threshold) + durable state | lifeSimSystem + saveSystem (additive) |
| bonded-pair recovery cap | direct rule branch | structureSystem |
| bereavement packet | durable emotional/social state | lifeSimSystem + saveSystem (additive) |
| witnessedAffection packet | durable emotional/social state | lifeSimSystem + saveSystem (additive) |
| jealousy derived | feedback-loop simulation | lifeSimSystem |
| prideAnchor / shameAnchor | durable emotional/social state | lifeSimSystem + saveSystem (additive) |
| loyaltyChoice packet | durable emotional/social state | lifeSimSystem + saveSystem (additive) |
| ML feature row additions | ML-scored choice (read-only consumer) | mlInferenceSystem |
| Future learned grief tone | future model-driven cognition proposal | mlInferenceSystem (later) |

ML may consume all derived feelings and durable packets as features. ML
may not own them. The ownership boundary stays:

```text
durable truth        -> lifeSimSystem + saveSystem
derived appraisal    -> lifeSimSystem (per-tick re-derived)
choice scoring       -> mlInferenceSystem (read-only consumer)
behavior execution   -> behaviorSystem / movement / communicationSystem
```

This honors the COGNITION-ML-CONTRACT and ML-IMPLEMENTATION-CONTRACT.

---

## Section 9 - Save Continuity Protocol

```text
save continuity rules for E1..E6
+-- saves remain at schemaVersion 5 through E1..E6
+-- new fields are strictly additive to existing groups
+-- old saves load with default-neutral values for new fields
+-- loader writes a one-time `runtime-issue type=cognition-additive-default`
|   per butterfly per missing field on first load
+-- additive fields are NOT required for the runtime to behave; missing
|   fields produce neutral behavior
+-- migration script (one per E phase): scripts/run-cognition-additive-
|   migrate-<phase>.js fills defaults if the loader did not
+-- long-running save proof: each E phase reruns
|   run-h5-long-running-save-smoothness-audit.js + run-n8-social-save-
|   continuity-audit.js
`- bumping schemaVersion is forbidden in this round; if a future phase
   needs a real schema bump, that is its own joint signoff under the
   SAVE-SCHEMA-REGISTRY
```

---

## Section 10 - Files / Owners Summary For Next Slice

```text
spatial truth         boardPos = { zoneId, u, v, h }   no change
projection            renderManager.boardToScreen / screenToBoard  no change
movement intent       butterfly.movement.target in board units  no change
debug iso             gridManager (read-only after R2)  no change
zone exits            zone.exits[*]; sim-board edgeMode  no change
block placement       structureSystem.acceptCellPlacement  no change
flowers               entities/flower lifecycle  no change
feed categories       communicationSystem.normalizeFeedCategory  no change
threads               ui/gameUI presents from communicationSystem aggregator
                      + interpretation italic added in R10
cooperation           structureSystem.heavyBlockCarry, lifeSimSystem.shelter,
                      zoneSystem.scarcityPulse, communicationSystem.distress &
                      scoutDiscovery  no change
ML scoring            systems/mlInferenceSystem (no durable mutation)
                      + ml-value-band metrics added in R10
trace capture         mlInferenceSystem.decisionLog.outcomeWindow  no change
save schema           v5; only additive (E1 derivedFeelings has no schema
                      change; E2 bondTier additive; E3 bereavement additive;
                      E4 witnessedAffection additive; E5 anchors additive;
                      E6 loyaltyChoice additive)
new owners            R12 scenario harness (new directory scripts/scenario/)
                      no live runtime ownership
forbidden files       (this round) every entity/system not named above;
                      schema bump; ML runtime contract; battle contract;
                      gridManager.js
```

---

## Section 11 - Audit Lane Map

```text
regression (must stay green through R10..E6)
+-- run-runtime-self-audit.js
+-- run-r1-movement-stability-audit.js
+-- run-r2-zone-transition-audit.js
+-- run-r4-ui-readability-audit.js
+-- run-r5-battle-presentation-audit.js
+-- run-r5-sprite-fidelity-audit.js
+-- run-r6-communication-audit.js
+-- run-r7-block-visual-audit.js
+-- run-b4-carry-stack-physics-audit.js
+-- run-b7-spatial-soak-audit.js
+-- run-f5-f6-social-depth-audit.js
+-- run-e4-social-ecology-audit.js
+-- run-h5-long-running-save-smoothness-audit.js
+-- run-lifesim-expression-audit.js
+-- run-v3-sprite-parity-audit.js
+-- run-n6-neural-social-scoring-audit.js
+-- run-n8-social-save-continuity-audit.js
+-- run-single-player-autobattle-audit.js
+-- run-ability-radius-conversion-audit.js
+-- run-r-movement-board-truth-audit.js
+-- run-r-block-cell-discipline-audit.js
+-- run-r-altitude-probe.js
+-- run-r-flower-lifecycle-audit.js
+-- run-r-feed-thread-audit.js
+-- run-r-cooperation-pressure-audit.js
+-- run-ml-on-off-capture-audit.js
`-- run-ml-trace-capture-audit.js

new (this round)
+-- (R10) extension to run-ml-on-off-capture-audit.js (value-band metrics)
+-- (R10) extension to run-r-cooperation-pressure-audit.js (5-min lane)
+-- (R10) extension to run-r-flower-lifecycle-audit.js (cleanup floor)
+-- (R11) run-r-spatial-cleanup-audit.js
+-- (R12) run-scenario.js + scripts/scenario/ harness
+-- (E1)  run-scenario.js seed-loneliness
+-- (E2)  run-scenario.js seed-bond-progression
+-- (E3)  run-scenario.js seed-grief
+-- (E4)  run-scenario.js seed-jealousy
+-- (E5)  run-scenario.js seed-pride + seed-shame
`-- (E6)  run-scenario.js seed-loyalty
```

---

## Section 12 - Risk Summary

```text
high
+-- E3 / E4 / E5 / E6 add durable additive fields; loader must default
|   neutrally; long-running saves must remain identical when fields are
|   absent
|   mitigate: explicit one-time loader log; reuse n8 continuity audit
+-- R10 ML value-band audit may report "ML is not currently buying much
|   beyond connection"; that is honest information, not failure
|   mitigate: report numeric findings; do NOT silently retune thresholds
|   to make the audit pass
+-- E2 bondTier might block-coerce edges of long-running saves on first
|   load if coTimeSeconds is missing; default to 0 and let tier rise from
|   there
|   mitigate: bondTier defaults to 'acquaintance'; actual bonded pairs
|   in old saves will need ~30 min of game time to re-tier

medium
+-- R12 scenario harness adds its own surface; if not deterministic,
|   scenarios become flaky and lose value
|   mitigate: harness is the runtime's only entry into scenario mode;
|   seeded RNG; no wall clock dependency; document the seed protocol
+-- E1 thresholds may underexpress or overexpress the new feelings;
|   conservative defaults + scenario-driven tuning
|   mitigate: ship with conservative thresholds; iterate via scenario tests
+-- R11 deprecation warnings may flood logs if many call sites remain;
|   rate-limit per call site
|   mitigate: emit once per call site per session

low
+-- R10 italic line may overflow at narrow widths
|   mitigate: cap heard-meaning text at 60 chars
+-- E5 anchors may spam if no cap
|   mitigate: 1 anchor per type per butterfly per 5 min
```

---

## Section 13 - End-of-Document Honest Framing

```text
honest framing (this round)
+-- the prior plan was right that R0..R9 were the correct ladder
+-- the Codex implementation landed those correctly at the contract level
+-- the missing piece is BEHAVIOR EVIDENCE, not more contracts
+-- the believability gap is real; the user named it precisely; the
|   current vocabulary cannot SPEAK loneliness, grief, jealousy, or
|   long-term bonding without help; E1..E6 add that help
+-- ML cannot be promoted to "doing real work" until R10's value-band
|   audit produces numbers worth promoting against
+-- the spatial system does NOT need a rebuild; F'1..F'4 are surgical
+-- a deterministic scenario harness pays back its cost in three phases
|   (E1, E3, E4 alone justify R12) and unblocks every later phase
+-- save sacredness holds: no schema bump in this round; only additive
|   fields with neutral defaults
+-- consciousness is not claimed; the new feelings are functional state
|   that can be inspected, decayed, saved, and proved to change behavior
`- this is the slice that gets the build to "feels like a society"
   without re-foundation
```

---

## Section 14 - Copy-Paste Prompt For Codex (the user's hand-off)

```text
Codex, the Claude review of the R0..R9 handoff is now complete and lives at:

  C:\Users\fishe\Documents\projects\ephemera\docs\CLAUDE-REVIEW-G0-R0-R9-HANDOFF-NEXT-PLAN-2026-04-30.md

Short summary of the findings:

- R0..R9 contracts have all landed in code and the audits Codex listed
  pass at the proof level
- the build is materially closer to G0 close, but G0 cannot close yet
  because R8 cooperation hooks were proven at one-shot lab pass, not at
  longitudinal lived play, and ML on/off proves source distinction but
  not value
- the spatial system does NOT need a rebuild; four named contradictions
  remain and all are surgical (F'1 zoneSystem.getZoneAtGrid short-circuit,
  F'2 isEntityWithinRadius silent pixel fallback, F'3 structureSystem
  /20 hardcode, F'4 block.js gridPos rebuilds)
- the cognition vocabulary cannot express loneliness, grief, jealousy,
  social insecurity, comfort-seeking, or long-term bonding as
  first-class signals; the next slice adds them in a staged additive way
- saves stay sacred; no schemaVersion bump this round; only additive
  fields with neutral defaults
- the next plan introduces a deterministic scenario harness so rare
  social interactions can be proved without random long-running saves

Start with R10. Implement these in order:

R10.1 - extend scripts/run-ml-on-off-capture-audit.js with value-band
        metrics: chi-square motive distribution per pair, |edgeDelta|
        churn per minute, migration-target Shannon entropy, target
        acquisition latency, top-15% top-edge fraction, jitter ratio.
        Output side-by-side report.json with each metric tagged
        meets-threshold: true|false against R8.5 thresholds. Run on the
        lived save. Honest report, do not silently retune to pass.

R10.2 - extend scripts/run-r-cooperation-pressure-audit.js with a
        deterministic 5-minute lane (seed=4242), inject scarcity at
        t=180s and distress at t=240s. Assert each H1..H5 fires >= 1
        in the 5-minute window. Add per-minute counters to the report.

R10.3 - extend scripts/run-r-flower-lifecycle-audit.js with a
        cleanup-floor lane (seed=9090), seed 8 dirt-piles in moss-hollow
        with 12 mixed-trait butterflies, run 60s, assert >= 6 cleaned
        by t=60s.

R10.4 - in systems/communicationSystem.js, when residue.interpretation
        .misunderstood === true, include heardMeaning in the thread
        emission. In ui/gameUI.js, render an italic "(heard: <meaning>)"
        line under the spoken line in the feed thread row. Cap heard
        meaning at 60 chars. Gate with
        gameConfig.ui.feedThreads.interpretationItalic = true (default true).

Owned files for R10:
  scripts/run-ml-on-off-capture-audit.js
  scripts/run-r-cooperation-pressure-audit.js
  scripts/run-r-flower-lifecycle-audit.js
  systems/communicationSystem.js
  ui/gameUI.js

Forbidden files for R10:
  entities/, structureSystem placement code, save schema, render math,
  projection math, ML runtime contract, gridManager.js

Acceptance for R10:
  - ML value-band audit produces a report with all 6 metrics; tag each
    pass/fail honestly; do not silently retune
  - cooperation 5-min audit reports >= 1 per hook
  - lifecycle cleanup audit reports >= 6/8 piles cleaned
  - italic heard-meaning line appears in feed thread audit screenshot
    when misunderstood is true
  - run-runtime-self-audit.js stays green
  - run-r-feed-thread-audit.js stays green

Do not start R11..E6 until R10 is fully landed and audited green. After
R10, ping for a quick check before starting R11 and R12.

Do not wipe saves. Do not bump schemaVersion. Do not introduce new drive,
emotion, memory, motive, or social-edge vocabulary in R10..R12. The
cognition vocabulary expansion happens in E1..E6 and is staged with
explicit save-additive defaults.

Begin with R10.1. Read the next-plan document above for the exact
metric definitions and thresholds.
```

---

## End of document
