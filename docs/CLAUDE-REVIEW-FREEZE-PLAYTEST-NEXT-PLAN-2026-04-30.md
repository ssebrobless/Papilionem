# Claude Review - codex/milestone-freeze-playtest Next Plan

Date: 2026-04-30
Author: Claude Opus 4.7
Branch / commit reviewed: `codex/milestone-freeze-playtest` @ `a8f4c95`
Workspace: `C:\Users\fishe\Documents\projects\ephemera`
Binding upstream: `docs/CLAUDE-REVIEW-G0-R0-R9-HANDOFF-NEXT-PLAN-2026-04-30.md`
Status: binding for the next implementation slice; supersedes only the phases it
explicitly re-opens (E5 / E6 wiring, R10 honesty-gate widening, R11 caller
migration, scenario harness rigor).

---

## Section 0 - Executive Verdict

```text
verdict
+- the build is materially closer to "believable butterfly society" than it was
|  10 days ago; spatial truth is honest, durable cognition vocabulary is in
|  place, R12 scenario harness exists and runs deterministically, and ML
|  source-distinction is honestly measured
+- BUT the slice as actually shipped is narrower than the slice the upstream
|  next-plan promised:
|  +- E5 pride/shame anchors and E6 loyalty packets have storage, derivation,
|  |  and downstream effects, but ZERO production triggers - they only fire
|  |  from the scenario harness
|  +- E3/E4 packets fire correctly when invoked, but the seeded scenarios call
|  |  the bookkeeping helpers DIRECTLY rather than driving the production
|  |  event chain (BUTTERFLY_DIED / dialogue emission); the gameplay-loop is
|  |  unproven
|  +- R10 ML value-band audit ran honestly and reports 0/6 metrics meet
|  |  threshold (correct, exactly the data the user asked for)
|  +- R11 added getZoneAtBoard but did not migrate four callers
|  |  (objectSystem.js:21, 143; behaviorSystem.js:67; gameUI.js:2180, 3016);
|  |  the legacy short-circuit + warning still fires
|  +- R10 italic line lives in the canvas-mode feed only (gameUI.js:2767);
|  |  the DOM-mode feed panel (ui/dom/feedPanel.js) does not surface heard
|  |  meaning
|  +- the scenarios all pass but with weakened thresholds (loneliness >= 0.25
|  |  instead of the spec's 0.55; bond-progression preloads edges to ~0.6 and
|  |  asserts companion after 20s instead of organic 12 min; loyalty preloads
|  |  the "chosen" answer)
+- the spatial system does NOT need a rebuild; the projection contract is
|  honest and reversible; remaining contradictions are surgical
+- the cognition vocabulary is in place but the gameplay -> cognition wiring
|  is incomplete, so a fresh human capture today would mostly look like the
|  build before the slice
`- the next plan should:
   |- finish the gameplay -> cognition trigger wiring for E3..E6
   |- harden the scenario harness so seeds do not bypass the production loop
   |- migrate the four remaining R11 callers to board lookups
   |- decide what to do about ML once the value-band evidence stays at 0/6
   |- collect the fresh G0 capture only AFTER R10/R11/R12/E* wiring is real
```

Honest score against the user's stated goal "believable butterfly society":

```text
mechanical truth         strong (board math, save sacredness, harness)
durable cognition state  strong (storage, derivation, save round-trip)
gameplay -> cognition    WEAK (E5/E6 unwired; E3/E4 not lab-proven)
ambient legibility       partial (canvas feed has italic; DOM feed missing)
ML earning its keep      not yet (0/6 value-band metrics meet threshold)
behavior emergence       unproven (scenarios bypass production triggers)
```

The build IS demonstrably better. The proofs Codex listed all pass. But the
proofs as currently written do not yet say what the user thinks they say.

---

## Section 1 - What Actually Landed (verified in code)

### Confirmed in code on `a8f4c95`

| Concern | Evidence | Status |
| --- | --- | --- |
| R12 scenario harness | `scripts/scenario/{runner,dsl,index}.js`, 13 scenarios, deterministic Playwright runner | landed |
| Scenario CLI | `scripts/run-scenario.js --all` runs all 13 in order with deterministic-replay check | landed |
| 13 seed scenarios pass | `qa_screenshots/scenario/<name>/<ts>/report.json` (37/37 individual assertions) | passes (caveat: thresholds soft) |
| Cognition flag gate | `core/config.js:740-747` `cognition: { derivedFeelings, bondTier, grief, jealousy, anchors, loyalty }` | landed |
| Derived feelings (E1) | `systems/lifeSimSystem.js:1570-1669` `deriveDerivedFeelings` | landed |
| `derivedFeelings` consumed by behavior | `lifeSimSystem.js:1828-1879` (recovery, status expression, return-home, social avoidance) | landed |
| `motiveBias` selected on threshold | `lifeSimSystem.js:1652-1664`; consumed at `communicationSystem.js:3354` | landed |
| Bond tier ladder (E2) | `lifeSimSystem.js:1502-1540` `deriveBondTier` / `updateBondTiers` | landed |
| Bonded-pair recovery uplift | `structureSystem.js:374` `tierBonus = bondTier=='bonded' ? 0.16 : ...` consumed in `getShelterTrustRecoveryScale` | landed |
| Bereavement on death (E3) | `lifeSimSystem.js:1682-1703` `recordBereavementForDeath` registered to `BUTTERFLY_DIED` event at `lifeSimSystem.js:10-15`; emitted from `gameCore.js:466` | wired (storage + event) |
| Witnessed-affection (E4) | `lifeSimSystem.js:1705-1743`; called from `communicationSystem.js:4214` on every `emitDialogue` | wired (every dialogue) |
| Pride / shame storage (E5) | `lifeSimSystem.js:1745-1767` `createOutcomeAnchor` | wired storage; **NO production triggers** |
| Loyalty choice storage (E6) | `lifeSimSystem.js:1769-1784` `recordLoyaltyChoice` | wired storage; **NO production triggers** |
| Cognition packet pruning | `lifeSimSystem.js:1542-1568` (witnessedAffection 60s, bereavement 3 min, loyaltyChoice 6 min, anchor decay 5 min) | landed |
| Save additive fields | `socialEdges[id].bondTier`, `coTimeSeconds`, `lastTierChangeAtFrame`; `memories.social[bereavement|witnessedAffection|loyaltyChoice]`; `memories.outcome[anchor]` | landed; round-trip verified by 4 scenarios |
| ML on/off audit value-band metrics (R10.1) | `scripts/run-ml-on-off-capture-audit.js:165-235` chi-square / edge-churn / migration entropy / acquisition latency / top-edge fraction / jitter | landed; 6/6 evaluated; 0/6 meet threshold (honest) |
| Cooperation 5-min lane (R10.2) | `scripts/run-r-cooperation-pressure-audit.js:263-495` 18000 frames, scripted H1..H5 injections at 1800/3600/10800/14400/16200, per-minute counters | landed; lane runs and meets bar (1+ of each in 5 min); injection-based not lived |
| Cleanup-floor lane (R10.3) | `scripts/run-r-flower-lifecycle-audit.js:200-287` seeds 8 piles, 12 butterflies, teleports butterflies onto piles every 30 frames, 60s | landed; 8/8 cleaned; teleport-driven not lived |
| R10.4 italic in feed | `ui/gameUI.js:2745, 2765-2767` renders `(heard: <meaning>)` under spoken line in canvas feed thread | landed for canvas only |
| `gameConfig.ui.feedThreads.interpretationItalic` flag | `ui/gameUI.js:1376` reads it; default `!== false` | landed |
| F'1 `getZoneAtBoard` added | `systems/zoneSystem.js:563-584`; legacy `getZoneAtGrid` warns once and short-circuits | landed (but callers not migrated) |
| F'2 legacy radius warning | `communicationSystem.js:393-415` records runtime issue once per call site; verified by spatial-cleanup audit | landed |
| F'3 `/20` hardcode replaced | `structureSystem.js:299` `Math.hypot(...) / this.getBoardPixelsPerUnit(zoneId)` | landed; verified by audit (`sourceContainsHardcodedDivide20: false`) |
| F'4 block placement consolidated | `entities/block.js:64-66, 110, 204, 296` all funnel through `syncDebugGridPos`; `saveSystem.js:1053, 1428, 1458, 1534` use the same helper | landed |
| Inspect "Feeling" surface | `gameUI.js:621-622` shows loneliness / comfortSeeking / socialInsecurity counters | landed (canvas) |
| ML feature schema additive | `derivedFeelings` group surfaces via `mlInferenceSystem.buildFeatureGroups` (consumed by scenario `ml_feature` assertion) | landed (read-only; ownership preserved) |
| Spatial cleanup audit | `scripts/run-r-spatial-cleanup-audit.js`; report `pass` | landed |
| Camera-follow guard (R0.1) | `core/gameCore.js:4483-4485` only follows when `zoneTravel.cameraFollow === true` | landed (verified) |
| Sim-board edge-travel pipeline | `gameCore.js:4470-4530` phases `entering -> in-transit -> arriving` with anchor warps | landed |
| Movement target in board units (R2) | `entities/butterfly.js:1211-1297` clamp/make/screenPointToBoard/normalize/ensure/applyScreen | landed |
| Altitude split (R4) | `butterfly.js:1119-1209` `getFlightHConfig`/`getDesiredFlightH`/`updateFlightH`/`getShadowScreenPoint`/`getFlightRenderOffset` | landed |
| Block cell discipline (R3) | `block.js:174-278` `shouldSnapToCell`, `applyBoardCell`, `snapToBoardCell`, runtime issue on coerce | landed |
| Reversible projection (R0..R5) | `renderManager.js:517-547` boardToScreen/screenToBoard | landed |

### Numbers from the on-disk audit reports (verified 2026-04-30 06:30-06:54)

```text
audit reports actually opened
+- ml_on_off_capture_audit  06-05-58Z  overall=pass
|  metricsEvaluated=6  metricsMeetingThreshold=0
|  chi-square: 0 vs 3.84 threshold      meets=false
|  edge-churn: 14.66/13.43=1.09 < 1.15  meets=false
|  migration entropy: 0.12/0.19         meets=false (regression)
|  target acquisition: 111/60.65=1.83   meets=false (regression, lower=better)
|  top-edge fraction: 0.31/0.22         meets=false (regression)
|  jitter ratio: 0.0017/0.001=1.65      meets=false (regression)
|  source distinction itself: pass (ml=70 vs heuristic-fallback path correctly gated)
+- r_cooperation_pressure_audit  06-11-09Z  overall=pass  6 phases
|  windowTotals = {H1:1, H2:1, H3:1, H4:1, H5:1}
|  perMinute spread (one event per scheduled frame, not organic frequency)
+- r_flower_lifecycle_audit  06-12-15Z  overall=pass
|  cleanupFloor = {seeded:8, cleaned:8, remaining:0, teleport-driven}
+- r_spatial_cleanup_audit  06-30-26Z  overall=pass
|  gridAgreement, zoneAtBoard (4/4), distancePpu (4/4), legacyRadiusWarning fired
+- runtime_self_audit  06-52-41Z  overall=pass  17/17 steps  (avg update 3.91 ms,
|  avg render 6.23 ms over the audit's instrumented window)
`- scenario/<all>  06-53-...Z  37/37 assertions across 13 scenarios pass
   (deterministic over 1 repeat each; storage-layer assertions only)
```

The audits are real. Their gates are met. But the gates do not measure
"believable butterfly society"; they measure "the new bookkeeping wires up
correctly." That is the honest read.

---

## Section 2 - Honest Gap List, Ranked

Findings are tagged as: **B** (behavior gap - code path not connected),
**E** (evidence gap - proof does not measure what it claims), **S** (spatial /
contract residual), **U** (UI / surfacing).

### Gap-1 [B, P0] - E5 pride / shame anchors have NO production triggers

`createOutcomeAnchor` is reachable only from
`scripts/scenario/runner.js:416`. No system in `systems/`, `core/`, or
`entities/` calls it. The plan's spec'd triggers are **all unwired**:

```text
spec said              actual wiring
-------                -------------
battle won             not wired (battleSystem emits BATTLE_COMMITTED, no listener)
caregiving success     not wired (distress cascade resolution does not anchor)
scout cluster led      not wired (scout discovery does not anchor)
egg -> chrysalis       not wired
warning ignored+harm   not wired
abandoned ally         not wired
broken bond            not wired
```

Effect: in normal play, butterflies will **never** acquire pride or shame.
The Inspect surface will keep reading 0% pride / 0% shame for the entire save.
This is the largest "we said we shipped E5 but we didn't" gap.

**Fix:** wire 3 high-confidence triggers (battle commit on participant
contribution score, distress-cascade resolution where caregiver helped, scout
discovery where recipients adopted target zone). Defer egg-to-chrysalis and
broken-bond to E6.5 / E7.

### Gap-2 [B, P0] - E6 loyalty choice has NO production triggers

`recordLoyaltyChoice` is reachable only from
`scripts/scenario/runner.js:435`. Plan said: when two butterflies emit
competing distress signals OR competing scout invitations within ~2s, the
witness's chosen response is recorded. Not wired.

Effect: loyalty bias will never form in normal play; `loyaltyBias` derived
feeling stays 0.

**Fix:** in `communicationSystem.updateDistressCascade` and
`updateScoutDiscovery`, when a butterfly responds to one of two competing
cooperation signals from butterflies in the witness's top-3 priority sources,
call `recordLoyaltyChoice`. Add a 60-frame de-dupe.

### Gap-3 [E, P0] - Scenario harness bypasses the production gameplay loop

The 13 scenarios prove storage and derivation. They do not prove the
gameplay-loop -> cognition path. Specifically:

```text
scenario        bypass mechanism                                 production proof status
seed-grief      "kill" action sets dead=true AND directly        UNPROVEN: would the
                calls recordBereavementForDeath. The             eventBus dispatch from
                BUTTERFLY_DIED event chain is NOT exercised.     gameCore.js:466 actually
                                                                  trigger lifeSimSystem
                                                                  in production?
seed-jealousy   "witness_affection" action directly calls        UNPROVEN: would B's
                lifeSimSystem.recordWitnessedAffection with      tender dialogue toward C
                pre-named witnesses. The                         in line of sight of A
                communicationSystem.emitDialogue path is NOT     actually trigger A's
                exercised.                                       packet?
seed-pride      "outcome_anchor" action directly calls           UNPROVEN: as Gap-1 -
                createOutcomeAnchor.                              there is no production
                                                                  path that calls this.
seed-shame      same as seed-pride.                              same.
seed-loyalty    "loyalty_choice" pre-specifies chosen and        UNPROVEN: as Gap-2 -
                rejected partners and calls recordLoyaltyChoice  there is no production
                with them.                                       path; the choice logic
                                                                  itself is not tested.
```

Also, `seed-bond-progression` preloads the edge to `trust 0.62 / comfort 0.58 /
attachment 0.56 / coTime 590s` - one second of cognition flips the tier to
`companion`. The plan called for **30 minutes of game time** to walk through
familiar -> companion -> bonded organically. The current scenario tests only
the `deriveBondTier` thresholds, not the progression.

`seed-loneliness` asserts loneliness >= 0.25, not the plan's 0.55. With
`lerpValue` factor 0.18 toward a base that can hit 1.0 when alone, the test
should be able to reach 0.55 in ~4 deep updates. The threshold was lowered
without a recorded reason.

Effect: the audits read green but they're testing whether the helpers store
data correctly, not whether normal play produces the believable society.

**Fix:** add a second class of "lived-loop" scenarios that:
- do NOT call cognition helpers from the action DSL
- spawn butterflies with the right initial state and let the simulation run
- assert the packet appears via the production trigger (death event dispatched
  by gameCore, dialogue emitted by communicationSystem, etc.)
- raise the cognition assertion thresholds back to the plan's values

The harness already supports an `advance_cognition` action; what's missing is
a `step_simulation` action that runs `gameCore.update()` for N frames AND a
`run_for_seconds_with_render` action that exercises the full update loop.

### Gap-4 [B/E, P0] - R10 cooperation 5-min lane is injection-driven

`run-r-cooperation-pressure-audit.js` line 468-474 fires H1..H5 by directly
calling their conditioning code at fixed frames. So the audit proves: "if you
manually arm H1's preconditions at frame 1800, H1 fires." It does NOT prove:
"in 5 minutes of unscripted play, H1 fires at least once organically."

The plan's wording was intentional: **"at least one event per 5 minutes in
lived play"**. The current lane meets the letter ("at least one fires") but
not the spirit ("in lived play").

**Fix:** add a `06b-r10-cooperation-organic-floor` lane that does the same
seeding but does NOT inject conditions. Run for 5 minutes. Count organic
firings. Acceptance: at least one of EACH hook fires organically. If a hook
does not fire organically in 5 minutes, that is a real product gap to close.

### Gap-5 [E, P0] - R10 cleanup floor is teleport-driven

`run-r-flower-lifecycle-audit.js:259-274` teleports butterflies onto remaining
piles every 30 frames. So the audit proves: "if a butterfly is colocated with
a dirt pile, the cleanup affordance fires." It does NOT prove: "butterflies
will navigate to nearby dirt piles in lived play."

**Fix:** add a `cleanup-floor-organic` lane that seeds 8 piles + 12 mixed-trait
butterflies, places butterflies AROUND the piles (not on them), and runs 60s
without teleporting. Acceptance: at least 4 piles cleaned organically.

### Gap-6 [B/U, P1] - DOM feed panel does not render the italic line

`ui/dom/feedPanel.js:100-138` renders `headline`, `detail`, `footer` only -
no `heardMeaning`. If the user is in DOM-shell mode (the future direction
according to ACTIVE-PUBLIC-SHARE-BOARD.md), the italic line is invisible.

**Fix:** in `feedPanel.renderEntries`, when `entry.threadLines` carry
`heardMeaning`, render an italic span under the spoken line. Cap at 60 chars
to match the canvas path.

### Gap-7 [S, P1] - R11 left four `getZoneAtGrid` callers unmigrated

`getZoneAtBoard(boardPos)` exists, but these callers still pass `entity.gridPos`
through `getZoneAtGrid`:

```text
file                                  line  caller
systems/objectSystem.js                21   object zone resolution on register
systems/objectSystem.js               143   object zone resolution on update
systems/behaviorSystem.js              67   behavior runtime zone read
ui/gameUI.js                         2180   inspect lookup (sim-board mode)
ui/gameUI.js                         3016   target preview
```

In sim-board mode each call short-circuits to focused zone AND records the
`legacy-zone-grid-lookup` runtime issue once. The runtime correctness is fine
in single-zone focus, but at zone boundaries (sim-board edge travel), an
entity mid-transit will be reported as "in focused zone" even when its
boardPos says otherwise.

**Fix:** add a `getEntityZone(entity)` helper on `zoneSystem` that prefers
`entity.boardPos`, falls back to `entity.currentZoneId`, then board lookup.
Migrate the five callers. Keep `getZoneAtGrid` only for legacy debug.

### Gap-8 [S, P1] - butterfly.js still has ~17 production-path `screenToIso` calls

`entities/butterfly.js` lines 989, 1031, 1735, 1771, 1782, 1986, 2526, 2573,
2593, 2612, 2695, 2713, 2881, 2938, 2947, 3059, 3082 all use
`gridManager.screenToIso(x, y)` for movement target normalization, carry/drop
target derivation, flower targeting, and cursor-derived navigation.

This is not a correctness bug today (iso and board projections agree on the
shared ppu). It IS a coupling bug: the iso transform is a back-compat
artifact that any future zone with a different ppu will silently break.

**Fix (lower-priority cleanup, R11.5):** centralize via
`butterfly.normalizeTargetFromScreen(x, y)` which uses `screenToBoard`
directly. Migrate the 17 sites in three batches: movement targets, carry/drop,
flower/cursor.

### Gap-9 [B, P1] - E3 long-absence variant not implemented

The plan called for soft-bereavement when a 'companion'+ partner is unobserved
in same zone for > 5 minutes (E3.3 in the upstream plan). Not implemented.

Effect: a partner who travels to a different zone and stays there does not
trigger any seeking behavior in the survivor. Only literal death does.

**Fix:** add `lifeSimSystem.checkLongAbsence(entity, gameState, deltaSeconds)`
called from `updateCognitionExpansion`. If a `companion`+ edge has had no
co-zone time for > 300s, create a soft-bereavement packet with intensity
halved and decay shortened to 90s.

### Gap-10 [E, P1] - bond-progression scenario does not actually progress

`seed-bond-progression.json` preloads
`{ trust: 0.62, comfort: 0.58, attachment: 0.56, coTimeSeconds: 590 }` and
runs 20s of cognition. With the existing thresholds, this trivially flips to
'companion' in one tick. The original plan called for **30 minutes** of game
time to demonstrate the ladder.

Effect: we have not actually proven the tier progression - only that the
tier function reads correctly when given pre-staged inputs.

**Fix:** add `seed-bond-progression-organic.json` that:
- seeds A and B at all-zero edges
- places them within 2 board units in ivy-cloister
- spawns a flower nearby (so they have a reason to interact)
- runs 30 game-minutes (108000 frames)
- asserts tier transitions at expected wallclock points (ish: familiar by
  ~90s, companion by ~12 min, bonded by ~30 min)
- screenshots tier change frames

This is the kind of scenario the scenario harness was added for.

### Gap-11 [E, P1] - loneliness threshold lowered without justification

`seed-loneliness.json` asserts `loneliness >= 0.25`. The motiveBias trigger in
`lifeSimSystem.js:1654` requires `loneliness > 0.55`. The asserted value is
below the trigger threshold, meaning the scenario passes without proving the
motive bias actually fires.

**Fix:** raise the assertion to `>= 0.55` and place the lonely butterfly
genuinely alone in moss-hollow with the rest of the colony in pool-heart (the
original plan). Add an additional assertion that the butterfly's
`movement.target.zoneId` is a moss-hollow exit toward pool-heart.

### Gap-12 [E, P2] - jealousy / pride / grief scenarios have no movement assertion

The plan explicitly required:
- grief: A's chosen target is within 2.0 board units of `lastSharedBoardPos`
  within 30s
- jealousy: A's next chosen target is NOT B for 20s
- pride: A emits at least one `admiration`/`statusPerformance` line within 90s
  of the anchor

None of these are asserted. The scenarios only check packet existence and
feeling magnitude.

**Fix:** add the missing behavioral assertions. They require
`step_simulation` (run gameCore.update() for N frames) which is missing from
the scenario action DSL - see Gap-3.

### Gap-13 [E, P2] - ML evidence is unambiguous and points to a decision

ML on/off audit shows 0/6 metrics meet threshold, with several being
regressions (latency 1.83x, top-edge fraction 1.36x, jitter 1.65x, migration
entropy 0.63x). This is not a Codex bug; it is the data the user asked for.

The decision the user must make:
- Option A: keep ML; treat 0/6 as a current-corpus problem and invest in
  scenario-curated trace corpus (R8.5 spec did call for `corpusSource:
  heuristic-traces-plus-curated-audit-scenarios`).
- Option B: gate ML behind a feature flag at runtime, default off, save the
  37.27ms cadence cost the h5 audit attributed to `mlCadenceIntervalFrames`.
- Option C: keep ML but reduce cadence to 1/4 and re-audit; if value-band
  improves, the cost was the issue.

Recommend Option A + Option C combined: add a `gameConfig.ml.cadenceFactor`
(default 1, but 4 in M5 trial) and grow `c2-trace-corpus` from the scenario
seeds (specifically the lived-loop scenarios in Gap-3).

**Status: This is not a code fix - it is a product decision the user owes
themselves before any further ML investment.**

### Gap-14 [B/U, P2] - Inspect surface is canvas-only

`gameUI.js:621` renders Feeling counters only when the canvas-based UI is
active. The DOM Inspect panel does not yet receive feeling state. Same kind
of issue as Gap-6 but for the inspect path.

**Fix:** thread `cognition.feelings` into the DOM inspect data shape.

---

## Section 3 - Spatial / 3D Truth Audit

### What is now correct

```text
projection
  visual    -> renderManager.boardToScreen({u,v,h}) -> screen{x,y,z}
  inverse   -> renderManager.screenToBoard(x,y,zone,h) -> {u,v,h}
  source    -> zoneSystem.getBoardConfigForZone(zone) per-zone
  reversible at h=0 (verified by run-r-spatial-cleanup-audit / grid_board_agreement assertion)
butterfly movement
  truth     -> butterfly.boardPos
  intent    -> butterfly.movement.target normalized to board units (R2)
  shadow    -> boardToScreen({...,h:0})
  sprite    -> boardToScreen({...,h:flightH})  (R4)
blocks
  truth     -> block.boardPos {u,v,h}
  spawn     -> integer u/v, integer h, supported h>0, no sun-court (R3)
  carry     -> block follows carrier; resnaps on drop
  visual    -> sortKey via computeBoardSortKey(boardPos)
flowers / piles
  truth     -> flower.boardPos via syncBoardPosFromScreen
  spawn     -> spawnedAtFrame additive (R6)
  decay     -> ~60s -> dirt pile -> cleanup affordance
zones
  bounds    -> per-zone widthUnits/depthUnits in zoneSystem.getBoardConfigForZone
  exits     -> sim-board edge-travel pipeline owns zone-swap; gameCore.js:4470
  adjacency -> zone.adjacentZoneIds
abilities (garden)
  truth     -> isEntityWithinRadius(_,_,_, radiusUnits, zoneId)
  fallback  -> still pixel-based but emits legacy-radius-px-only (F'2)
abilities (battle)
  truth     -> battleSystem motion.unitsPerArenaCell
ML features
  spatial   -> mlInferenceSystem stores boardPos in trace
  semantic  -> structureSystem owns verticality/structureRole/pathState/bodyFit
```

### What is still residual but does not break the game today

```text
+- objectSystem.js:21,143 use entity.gridPos to locate zone (Gap-7)
+- behaviorSystem.js:67 same (Gap-7)
+- gameUI.js:2180,3016 same (Gap-7)
+- butterfly.js ~17 sites use gridManager.screenToIso for target derivation (Gap-8)
+- DOM feed/inspect surfaces lack feeling state and italic heard-meaning
   (Gap-6, Gap-14)
+- getZoneAtBoard's "contains" check is permissive: since u/v are zone-local,
   any zone with similar bounds will accept; correctness depends on
   boardPos.zoneId being authoritative
```

### What does NOT need work

```text
+- the projection itself (boardToScreen / screenToBoard reverse cleanly)
+- camera-follow guard (R0.1 verified at gameCore.js:4485)
+- the soft envelope and ambient grid (R0.2 / R1)
+- altitude shadow / sprite split (R4)
+- block cell discipline (R3)
+- save schema (stays at v5; only additive)
```

The spatial system does NOT need a rebuild. The remaining contradictions are
the surgical ones already named above. The projection contract is honest
enough to support the full E1..E6 expansion.

---

## Section 4 - Code-Judgable vs Needs-Human-Capture

### Already judgable from code + audits (do not need a fresh capture)

- R0..R9 contracts are landed (verified above).
- R12 scenario harness exists, runs, is deterministic over 1 repeat.
- 13 seed scenarios pass at storage layer.
- ML on/off source distinction works (ml=70 vs heuristic-fallback=12 in
  populated rows).
- ML value-band metrics report 0/6 meeting threshold (the data the user asked
  for).
- Cooperation 5-min lane fires each H1..H5 at least once when injected.
- Cleanup floor cleans 8/8 piles when butterflies are colocated.
- R11 `getZoneAtBoard` exists; legacy warning fires once per call site.
- F'3 `/20` hardcode replaced with `getBoardPixelsPerUnit`.
- Bonded-pair recovery scaling uplift exists (`structureSystem.js:374`).
- Save round-trip preserves cognition packets (4 scenarios assert this).

### Needs a fresh human capture before judgment

- whether the focused-mode field READS as one playfield in the user's eyes
  (R0/R1 ambient grid + soft envelope subjective bar);
- whether wing close-ups read as high fidelity in the user's eye (R5);
- whether the talk thread reads as motive -> target -> response -> consequence
  at human reading speed (R7);
- whether the cooperation hooks H1..H5 feel like real social pressure or
  pity-fired one-shots in lived play (R8 + Gap-4);
- whether butterflies actually approach and clean dirt piles organically
  (R6 + Gap-5);
- whether the colony DEVELOPS bond ladders over a 30-minute session
  (E2 + Gap-10);
- whether the italic line "(heard: ...)" is readable and not noisy (R10.4);
- whether butterflies that lose a bonded partner exhibit grief-shaped
  movement (E3 + Gap-12);
- whether jealousy reads as jealousy in lived play (E4 + Gap-12);
- whether ML feels useful or wasted at the user's eye (the metric report
  already tells one story; the player feel is the second story).

The capture **cannot** answer these questions today because the codepaths
that would produce the observable behavior are missing or scripted-only:

- pride / shame anchors (Gap-1) WILL not appear in the capture
- loyalty bias (Gap-2) WILL not appear in the capture
- grief on long-absence (Gap-9) WILL not appear in the capture
- the italic line will appear only in canvas-mode UI (Gap-6)
- pair-progression to bonded WILL not appear in a single session (the
  thresholds need ~30 min co-time, which is the design)

So: **do not collect the human capture yet**. Land the wiring fixes first,
then collect the capture as the closing proof.

---

## Section 5 - Concrete Next Implementation Plan

### Ladder

```text
ladder for the next slice
+-- W1 wire E5 / E6 production triggers (Gap-1, Gap-2)
+-- W2 grow scenario harness with step_simulation + lived-loop scenarios
|                                                       (Gap-3, Gap-10, Gap-11, Gap-12)
+-- W3 R10 organic floors (Gap-4, Gap-5)
+-- W4 R11 caller migration (Gap-7) + DOM feed/inspect surfacing (Gap-6, Gap-14)
+-- W5 E3 long-absence variant (Gap-9) + cleanup of remaining butterfly.js
|       screenToIso (Gap-8)
+-- W6 ML decision: Option A trace corpus growth + Option C cadence-factor knob
|       (Gap-13)
`-- G0H human capture (the official close)
```

W1..W4 are required before any human capture.
W5 is high-value but additive; can early-start with W3 if Codex has bandwidth.
W6 is a product decision - W6.1 is just the cadence flag; W6.2 is the corpus
growth that needs W2 to land first.

---

### W1 - Wire E5 / E6 production triggers

Goal: pride/shame anchors and loyalty choices form in normal play, not only
from the scenario harness.

Owned files:
- `systems/lifeSimSystem.js` (no API change; wire callers)
- `systems/battleSystem.js` (emit pride anchor at commit on contribution)
- `systems/communicationSystem.js` (loyalty choice on competing
  cooperation responses; pride/shame anchors on
  caregiving-success / warning-ignored-then-harm)
- `systems/structureSystem.js` (pride anchor when heavy-block carry succeeds
  with the carrier-2 helper)
- `systems/eventBus.js` (no change; existing events suffice)

Forbidden files:
- save schema (stays additive at v5)
- `systems/mlInferenceSystem.js` (read-only consumer, do not mutate)
- `core/renderManager.js`
- `entities/*` (pride/shame are owned by lifeSim)
- `gridManager.js`

Contracts touched: none. The triggers all use existing public APIs on
`lifeSimSystem`.

Implementation steps:

W1.1 - Battle-win pride anchor.
  - In `battleSystem.commitBattleResult` (or wherever
    `BATTLE_COMMITTED` is emitted), for each victorious participant whose
    contribution score (existing in `participant.commit` or
    `participantBattleSnapshot`) is in the top half, call
    `lifeSimSystem.createOutcomeAnchor(entity, 'pride', 'battle-win', { strength: 0.55 + contributionScore * 0.25 })`.
  - Cap: 1 anchor per butterfly per 5 game-minutes.
  - Skip if `gameConfig.cognition.anchors.enabled === false`.

W1.2 - Caregiving-success pride anchor.
  - In `communicationSystem.updateDistressCascade`, when a caregiver
    successfully delivers care (existing: distress drops on the recipient
    AND caregiver was within 2 board units when it dropped), call
    `createOutcomeAnchor(caregiver, 'pride', 'distress-resolved', { strength: 0.55 })`.
  - Cap: 1 per caregiver per 5 game-minutes.

W1.3 - Scout-cluster pride anchor.
  - In `communicationSystem.updateScoutDiscovery`, when at least 2
    recipients adopt the scout's target zone within 60 frames of the
    discovery emit, call
    `createOutcomeAnchor(scout, 'pride', 'scout-cluster-led', { strength: 0.5 })`.
  - Cap: 1 per scout per 5 game-minutes.

W1.4 - Warning-ignored-then-harm shame anchor.
  - In `communicationSystem.handleWarning`, mark the warning emission with
    `warning.witnessIds` and `warning.emittedAtFrame`.
  - In the entity damage / harm pipeline (find via existing
    `lifeSim.emotions.threat` jumps or `eventBus.HEALTH_DAMAGED` if it exists;
    if not, hook on the next `lifeSimSystem.applyHarm` or similar), if the
    harmed butterfly was a `witnessIds` recipient AND the original warner is
    still alive AND the warning was within last 600 frames, call
    `createOutcomeAnchor(warner, 'shame', 'warning-ignored-then-harm', { strength: 0.5 })`.
  - Cap: 1 per warner per 5 minutes.

W1.5 - Abandoned-ally shame anchor.
  - In `communicationSystem.updateDistressCascade`, when a candidate caregiver
    who has a `companion`+ edge to the distressed butterfly does NOT respond
    within 600 frames AND distress remains high, call
    `createOutcomeAnchor(candidate, 'shame', 'abandoned-ally', { strength: 0.45 })`.
  - Cap: 1 per candidate per 5 minutes.

W1.6 - Loyalty choice on competing distress.
  - In `communicationSystem.updateDistressCascade`, when a caregiver
    responds to butterfly X but butterfly Y is also broadcasting distress
    AND Y is in the witness's top-3 priority sources within 120 frames, call
    `lifeSimSystem.recordLoyaltyChoice(caregiver, X.id, Y.id)`.

W1.7 - Loyalty choice on competing scout invitation.
  - In `communicationSystem.updateScoutDiscovery`, when a recipient adopts
    scout A's target zone but scout B was also offering a different target
    within 120 frames AND A and B are both in the recipient's top-3, call
    `recordLoyaltyChoice(recipient, A.id, B.id)`.

Acceptance:
- new audit `scripts/run-r-cognition-trigger-coverage-audit.js` (NEW)
  - 5-minute deterministic seeded scenario; assert at least one anchor of
    each kind (pride/shame) and at least one loyaltyChoice fire from
    PRODUCTION code paths
- `run-runtime-self-audit.js` stays green
- `run-h5-long-running-save-smoothness-audit.js` stays green (the cadence
  cost of these hooks is small but verifiable)
- `run-n8-social-save-continuity-audit.js` stays green

Probes:
```
node scripts/run-r-cognition-trigger-coverage-audit.js
node scripts/run-runtime-self-audit.js
node scripts/run-n8-social-save-continuity-audit.js
node scripts/run-scenario.js --all
```

Rollback flag: each trigger gated by
`gameConfig.cognition.triggers[name].enabled = true` (default true). The flag
group is added under existing `cognition` block in `core/config.js`.

Risks:
- caregiving-success trigger may fire on every distress cascade resolution
  and feel spammy. Cap is 1 per 5 minutes; tune later if needed.
- abandoned-ally trigger may misfire if the candidate is in a different zone
  and physically cannot respond. Add a same-zone check before counting it
  as "candidate".
- ML may consume the anchor strength as a feature. That is fine; ML may not
  mutate it. Document in the trigger source.

Deterministic scenario tests: see Section 6.

---

### W2 - Scenario harness rigor (lived-loop scenarios)

Goal: scenarios prove the gameplay -> cognition path, not only the storage
helpers.

Owned files:
- `scripts/scenario/runner.js` (extend action DSL)
- `scripts/scenario/dsl.js`
- `scripts/scenario/scenarios/` (add lived-loop seeds)

Forbidden files:
- everything in `systems/`, `entities/`, `core/`, save schema

Contracts touched: scenario-action DSL gains
`step_simulation { frames: N }`. Existing `advance_cognition` stays for
storage-only assertions.

Implementation steps:

W2.1 - Add `step_simulation` action.
  - In `runner.js` action loop, when `action.type === 'step_simulation'`,
    invoke `gameCore.update()` `action.frames` times (default 60).
  - This already exists as the `step` action - **rename the DSL key to
    `step_simulation` AND keep `step` as a backward-compat alias** so older
    seeds keep working.
  - Each step must call `gameCore.update()` only - no direct cognition calls.

W2.2 - Add `assert_movement_target_near` assertion.
  - Inputs: `{ entity, near_id?, near_boardPos?, max_units }`
  - Reads `entity.movement.target` (board units), computes board distance to
    the named entity or the named boardPos. Pass if within `max_units`.

W2.3 - Add `assert_dialogue_intent` assertion.
  - Inputs: `{ entity, expected_intent_tags, within_seconds? }`
  - Returns pass if any dialogue from `entity.id` in the last `within_seconds`
    of game time has any of `expected_intent_tags`.

W2.4 - Add `assert_recovery_rate_below` assertion (for grief).
  - Inputs: `{ entity, max_ratio_of_baseline, observation_window_seconds }`
  - Reads `entity.lifeSim.derived.routine.recoveryDrive` (or whatever the
    existing recovery field is named) before and after the observation window.
  - Pass if active recovery is < `max_ratio_of_baseline` of the
    pre-observation baseline.

W2.5 - Re-author the existing E1..E6 scenarios as lived-loop scenarios:

```text
seed-loneliness-organic
  butterflies: 1 lonely in moss-hollow; 4 in pool-heart
  actions: step_simulation 3600
  assertions:
    feeling_min loneliness >= 0.55 (raised from 0.25)
    assert_movement_target_near a -> moss-hollow exit toward pool-heart
    assert_dialogue_intent a expected=[companionship,observation]
seed-bond-progression-organic
  butterflies: 2 with all-zero edges, within 2 board units
  flower seeded between them
  duration: step_simulation 108000 (30 minutes)
  assertions:
    bond_tier a->b >= familiar after 5400 frames (90s)
    bond_tier a->b >= companion after 43200 frames (12 min)
    bond_tier a->b >= bonded after 108000 frames (30 min)
seed-grief-organic
  butterflies: 2 as bonded pair (preset edges)
  step 7200 to settle
  kill b (sets dead=true and emits BUTTERFLY_DIED on event bus)
  step 1800 (30s)
  assertions:
    memory_packet a kind=bereavement >= 1
    feeling_min a grief >= 0.4
    assert_movement_target_near a -> b.lastSharedBoardPos max=2.0
    assert_dialogue_intent a expected=[observation,repair]
seed-jealousy-organic
  butterflies: 3 (a-b companion, c neutral)
  step 3600 to settle
  emit dialogue: source=b, recipients=[c], tags=[comfort,warmth]
    (NOT a direct call to recordWitnessedAffection)
  step 1800
  assertions:
    memory_packet a kind=witnessedAffection >= 1
    feeling_min a jealousy >= 0.3
    edge_min a->c rivalry >= 0.05
    assert_movement_target_near a NOT b for next 1200 frames
seed-pride-organic
  butterflies: 3 (a high caregiving, b in distress, c bystander)
  step 60 to settle
  set b distress
  step 7200 (2 minutes)
  assertions:
    memory_packet a anchor=pride family=outcome >= 1   <-- relies on W1.2
    feeling_min a pride >= 0.4
    assert_dialogue_intent a expected=[admiration,statusPerformance]
seed-shame-organic
  butterflies: 3 (a high caregiving but companion-edge to b, b in distress,
                  c far away)
  set a movement.target to a position far from b (so a "ignores" b)
  step 7200
  assertions:
    memory_packet a anchor=shame family=outcome >= 1   <-- relies on W1.5
    feeling_min a shame >= 0.4
seed-loyalty-organic
  butterflies: 3 (a equal edges to b/c, b and c distressed simultaneously)
  step 60 to settle
  set b distress; set c distress (both within 60 frames of each other)
  step 1800
  assertions:
    memory_packet a kind=loyaltyChoice >= 1   <-- relies on W1.6
    edge_min a->[chosen] loyalty >= 0.04
seed-cleanup-floor-organic
  butterflies: 12 (mixed selfMaintenance/caregiving traits) AROUND piles
  piles: 8 dirt-piles in moss-hollow at fixed boardPos
  step 3600 (60s)  -- NO teleporting
  assertions:
    object_count kind=dirt-pile <= 4 (cleaned at least 4 of 8)
seed-cooperation-organic-floor
  butterflies: 14 (2 companion pairs)
  flowers: 8 (will be hit by scarcity at ~3 minutes)
  step 18000 (5 minutes)  -- NO injection of H1..H5 conditions
  inject_event: scarcity at frame 10800 (production scarcityPulse only)
  assertions:
    cooperation_count_min H1 >= 1 in 5 minutes (organic)
    cooperation_count_min H2 >= 1
    cooperation_count_min H3 >= 1
    cooperation_count_min H4 >= 1
    cooperation_count_min H5 >= 1
```

The existing 13 storage-layer scenarios STAY in place as smoke tests. The
new "-organic" scenarios are the bar.

W2.6 - Document the bypass distinction.
  - Add `scripts/scenario/scenarios/README.md` listing each scenario as
    "storage" or "lived-loop" so future contributors do not confuse them.

Acceptance:
- `node scripts/run-scenario.js --all` runs all scenarios (storage + organic)
- new organic scenarios deterministic across 1 repeat
- scenarios that depend on W1 trigger wiring pass after W1 lands
- existing scenarios still pass

Probes:
```
node scripts/run-scenario.js --all
node scripts/run-scenario.js seed-loneliness-organic
node scripts/run-scenario.js seed-grief-organic
node scripts/run-scenario.js seed-jealousy-organic
node scripts/run-scenario.js seed-pride-organic
node scripts/run-scenario.js seed-loyalty-organic
node scripts/run-scenario.js seed-bond-progression-organic
node scripts/run-scenario.js seed-cleanup-floor-organic
node scripts/run-scenario.js seed-cooperation-organic-floor
```

Rollback flag: scenarios are additive. Removing the scenario JSONs reverts.

Risks:
- bond-progression-organic is 30 minutes of game time; it must be deterministic
  AND fast enough to run in CI. Use the existing harness's
  `gameConfig.simulation.cadence.lifeSimDeepIntervalFrames` and headless
  mode; expect ~3-5 minutes wallclock.
- pride-organic depends on W1.2 trigger; do not run before W1 lands.
- loyalty-organic depends on W1.6 trigger; same.

Deterministic scenario tests: this phase IS the rigorous scenarios.

---

### W3 - R10 organic floors

Goal: prove R10's behavior bar in lived play, not in injected lab.

Owned files:
- `scripts/run-r-cooperation-pressure-audit.js` (add 06b organic lane)
- `scripts/run-r-flower-lifecycle-audit.js` (add cleanup-organic lane)

Forbidden files: everything else.

Contracts touched: none.

Implementation steps:

W3.1 - Cooperation organic lane.
  - Mirrors current 06-r10-cooperation-floor-5min seeding (14 butterflies, 2
    companion pairs, 8 flowers, scarcity scheduled at frame 10800).
  - Does NOT call runH1..runH5 directly.
  - Counts hook firings by listening on `eventBus` for the existing
    cooperation events (`structureSystem.recordHeavyBlockCarryAttempt` should
    emit a runtime issue or event we can count; if not, instrument it).
  - Acceptance: each hook fires at least once organically in 5 minutes.
    If a hook does not fire organically, document the gap in the audit
    report and gate the audit with `pass: hook-organic-fail-tracked` so
    Codex sees a real signal.

W3.2 - Cleanup organic lane.
  - Mirrors current cleanup-floor seeding (8 piles, 12 mixed-trait
    butterflies in moss-hollow).
  - Places butterflies AROUND the piles, not on them, with at least 3 board
    units between each butterfly and its nearest pile.
  - Does NOT teleport.
  - Acceptance: at least 4 of 8 piles cleaned organically in 60s.

Acceptance:
- both audits report organic and injection lane separately
- the organic lane is allowed to report `cooperation-h?-not-organic` failures;
  those are real product gaps, not audit bugs; do not silently fall back to
  injection

Probes:
```
node scripts/run-r-cooperation-pressure-audit.js
node scripts/run-r-flower-lifecycle-audit.js
```

Rollback: the new lanes are additive.

Risks:
- one or more cooperation hooks may not fire organically in 5 minutes. That
  is signal, not failure. Land the audit, accept the failures, then close
  them in a follow-up.

---

### W4 - R11 caller migration + DOM feed/inspect

Goal: close Gap-7 (5 callers) and Gap-6/Gap-14 (DOM surfacing).

Owned files:
- `systems/zoneSystem.js` (add `getEntityZone(entity)` helper)
- `systems/objectSystem.js` (lines 21, 143)
- `systems/behaviorSystem.js` (line 67)
- `ui/gameUI.js` (lines 2180, 3016 for zone lookup; verify italic
  rendering does not regress)
- `ui/dom/feedPanel.js` (render heard-meaning italic)
- DOM Inspect path (whatever module owns it - find via
  `Grep -nE "panel.*inspect|inspectPanel|InspectPanel"`)

Forbidden files:
- entities/, save schema, render math, projection math, ML runtime contract

Implementation steps:

W4.1 - Add `zoneSystem.getEntityZone(entity)`:
```js
getEntityZone(entity) {
  if (!entity) return null;
  if (entity.boardPos && this.getZoneAtBoard) {
    const zone = this.getZoneAtBoard(entity.boardPos);
    if (zone) return zone;
  }
  if (entity.currentZoneId) return this.getZone(entity.currentZoneId);
  if (entity.gridPos) return this.getZoneAtGrid(entity.gridPos.x, entity.gridPos.y);
  return null;
}
```

W4.2 - Migrate the five callers in objectSystem (2), behaviorSystem (1),
gameUI (2) to call `getEntityZone(entity)` instead of `getZoneAtGrid`.

W4.3 - DOM feed italic.
  - In `feedPanel.renderEntries`, when an entry has
    `threadLines` carrying `heardMeaning`, render an italic `<em>` line under
    the spoken phrase. Cap at 60 chars. Match canvas behavior gated by
    `gameConfig.ui.feedThreads.interpretationItalic !== false`.
  - Add CSS class `shell-feed-heard-meaning` for styling.

W4.4 - DOM Inspect feeling counters.
  - Find the DOM inspect data shape. Add `cognition.feelings` keys for
    loneliness, comfortSeeking, socialInsecurity, jealousy, grief, pride,
    shame, loyaltyBias.
  - Render a "Feeling: X | lonely 26 | grief 0 | jealous 0 | pride 0 |
    shame 0" row (or grid). Match the canvas layout at gameUI.js:621.

Acceptance:
- new audit `scripts/run-r-zone-lookup-coverage-audit.js` (NEW): drives a
  butterfly across a sim-board edge and asserts that
  `objectSystem.update`, `behaviorSystem.tick`, and the inspect path all
  return the correct zone for the boardPos at every frame
- legacy-zone-grid-lookup runtime issue count drops to 0 in normal play
- DOM feed renders an italic line in `r10_interpretation_italic_probe`
  screenshot
- DOM Inspect reads feeling counters in `n6_neural_social_scoring_audit`
  screenshot

Probes:
```
node scripts/run-r-zone-lookup-coverage-audit.js
node scripts/run-r6-communication-audit.js
node scripts/run-r4-ui-readability-audit.js
node scripts/run-runtime-self-audit.js
```

Rollback flag: `gameConfig.spatial.boardZoneLookup` already exists. Add
`gameConfig.ui.feedThreads.interpretationItalicDom = true` for the DOM path.

Risks:
- the DOM panel layout may reflow; cap text and use existing class hierarchy.

---

### W5 - E3 long-absence variant + butterfly.js iso cleanup

Goal: complete the E3 spec (long-absence soft-bereavement) and remove the
last batch of legacy iso transform calls in `entities/butterfly.js`.

Owned files:
- `systems/lifeSimSystem.js` (long-absence)
- `entities/butterfly.js` (~17 sites - migrate to `screenToBoard` directly)

Forbidden files:
- save schema, render math, projection math, ML runtime contract

Implementation steps:

W5.1 - Long-absence packet.
  - `lifeSimSystem.checkLongAbsence(entity, gameState, deltaSeconds)` called
    inside `updateCognitionExpansion`.
  - For each `companion`+ edge, track `co-zone-time` already maintained at
    `socialEdges[id].coTimeSeconds`. Add `socialEdges[id].lastSeenAtFrame` set
    when both are in the same zone.
  - If `(currentFrame - lastSeenAtFrame) > 18000` (5 min), and no
    bereavement packet exists for this partner, create a soft-bereavement
    packet with intensity halved, decay 90s. Tag `kind: 'bereavement'`,
    `subtype: 'long-absence'`.
  - On reunion, decay the soft-bereavement to 0 within 60 frames.

W5.2 - butterfly.js cleanup batch 1: movement targeting.
  - Replace `gridManager.screenToIso(...)` calls at lines 989, 1031,
    1735, 1771, 1782, 1986 with `this.screenPointToBoardTarget(...)`. The
    helper already exists at line 1238.
  - Behavior is identical at the current shared ppu.

W5.3 - butterfly.js cleanup batch 2: carry / drop / placement.
  - Replace iso calls at lines 2526, 2573, 2593, 2612, 2695, 2713, 2881,
    2938, 2947 with `this.screenPointToBoardTarget(...)`.

W5.4 - butterfly.js cleanup batch 3: flower targeting.
  - Replace iso calls at lines 3059, 3082 with
    `this.screenPointToBoardTarget(...)`.

Acceptance:
- new scenario `seed-grief-long-absence-organic` (extends seed-grief-organic):
  - bonded pair; B travels to a different zone and stays there; A stays put.
  - assert: A's bereavement packet (subtype: `long-absence`) exists by
    t=320s; intensity is half of normal bereavement.
- run-r-spatial-cleanup-audit.js stays green
- run-runtime-self-audit.js stays green
- grep `gridManager\.screenToIso` in `entities/butterfly.js` returns only
  back-compat / debug call sites (zero on movement / carry / drop / flower)

Probes:
```
node scripts/run-scenario.js seed-grief-long-absence-organic
node scripts/run-r-spatial-cleanup-audit.js
node scripts/run-runtime-self-audit.js
```

Rollback flag: `gameConfig.cognition.grief.longAbsence.enabled = true`
(default true).

Risks:
- iso cleanup may surface tiny pixel-level drifts where rounding differs
  between iso and board; verify against the existing
  `run-r-block-cell-discipline-audit.js` and `run-a4-spatial-truth-audit.js`.

---

### W6 - ML decision (cadence-factor + corpus growth)

Goal: turn the 0/6 value-band evidence into a product decision, not silent
acceptance.

Owned files:
- `core/config.js` (add `ml.cadenceFactor`)
- `systems/mlInferenceSystem.js` (read cadenceFactor)
- `scripts/build-c2-trace-corpus.js` (extend)

Forbidden files:
- save schema; ML runtime contract surface (the corpus format itself)

Implementation steps:

W6.1 - Cadence factor knob.
  - Add `gameConfig.ml.cadenceFactor` (default 1).
  - In `mlInferenceSystem.update`, multiply the decision interval by
    `cadenceFactor` (so factor 4 = run ML 1/4 as often).
  - Re-run `run-ml-on-off-capture-audit.js` with factor=4. Compare results.
  - If value-band metrics improve at factor=4, the cost was the issue; ship
    factor=2 as default and document.
  - If they do not improve, the policy itself is the issue and proceed to
    W6.2.

W6.2 - Corpus growth.
  - Extend `scripts/build-c2-trace-corpus.js` to consume the W2 lived-loop
    scenarios as additional trace sources.
  - Re-train the static policy artifact from the larger corpus.
  - Re-run the value-band audit. Document the delta (positive or negative).

Acceptance:
- value-band audit produces a side-by-side report at factor=1 and factor=4
- value-band audit produces a side-by-side report before / after corpus
  growth
- the report is published to `docs/ML-VALUE-DECISION-2026-05-XX.md` for the
  user to read and decide

Probes:
```
node scripts/run-ml-on-off-capture-audit.js
node scripts/build-c2-trace-corpus.js
```

Rollback flag: `gameConfig.ml.cadenceFactor` defaults 1; raising it is the
trial.

Risks:
- corpus growth may make the policy worse on lived play if scenario
  distribution does not match. That is a real signal; document it.

---

### G0H - Human capture (the official close)

Goal: confirm the believability bar in lived play. Only run AFTER W1..W4.

Owned files: none; this is a capture step.

Procedure:
- record one fresh capture of >= 7 minutes of lived play
- visit all four zones via player UI
- inspect 3 different butterflies via the Inspect surface
- save mid-session, reload, inspect that the same butterflies retain
  identity, memory, edges, and any pride/shame/loyalty packets they
  acquired
- collect 4 focused-mode screenshots, 1 overview, 4 wing close-ups, and at
  least 1 italic-line (heard: ...) feed thread screenshot
- if the session contains a death, capture the Inspect of the survivor
  showing bereavement
- if the session contains a heavy block carry or distress cascade, capture
  the resulting pride anchor (or absence of one) on the actor

Acceptance: 14 G0 close conditions from upstream Section 7 hold OR the gap
is documented as an explicit residual.

---

## Section 6 - Believable AI Direction (real-AI plan)

### Hard constraint: this is functional AI, not consciousness

The deliverable is a butterfly society where:
- each butterfly has durable feelings, edges, memories, and routines
- each butterfly's behavior is predictable from its state, not random
- each butterfly's state changes from observable events (death, dialogue,
  caregiving, choice under conflict)
- the player can read those changes in feed, inspect, and movement
- ML scores the choice; the durable truth lives in lifeSim/communication

We do NOT claim subjective feeling. The evidence is behavioral consistency.

### Specific real-AI work, in order

```text
real-AI plan
+-- production trigger wiring (W1)             - largest believability win
+-- lived-loop scenarios (W2)                  - the proof the user reads
+-- E3 long-absence variant (W5)               - extends grief to absence
+-- ML cadence + corpus growth (W6)            - earns ML's keep
+-- conversation depth follow-ups (later)
|   +-- thread-aware reply selection: when responding inside a 3s thread,
|   |   the responder consults thread state instead of fresh signal
|   +-- voice-band drift on edge change: when bondTier changes,
|   |   communicationProfile.voiceBand drifts for the next K dialogues so
|   |   "we just became companions" reads tonally
|   `-- conversation valence remembered: dialogues that ended in
|       laughter / agitation / care leave a small bias on the next
|       dialogue's tone selection
+-- ambient migration as social fact (later)
|   +-- when a high-attachment partner migrates, the survivor's
|   |   `migration.cohortPreferredZoneId` follows by a configurable
|   |   probability gated on edge.attachment
|   `-- when a society has 4+ butterflies in one zone, "belonging" rises
|       on each of them; this already exists but check the threshold
+-- learnable cognition (much later, c2)
    +-- once trace corpus is large enough (>= 4000 rows from lived-loop
    |   scenarios and h5-class captures), train a policy that can score
    |   target preference using durable feelings as a feature group
    `-- still ML-as-scorer, never ML-as-owner-of-feelings
```

### Trace corpus bar before learnable cognition

Do NOT begin learnable cognition work until the value-band audit is
**non-zero on at least 3/6 metrics at any cadenceFactor**. The current 0/6
data says ML-as-currently-trained does not buy anything. Add training data
(lived-loop scenarios) or do not invest further; do not silently keep the
existing policy.

### The "Inspect must read functional, not metaphysical" rule

When the player inspects a grieving butterfly:
- show "Misses [partner] for 2:14 more" (functional, decaying packet)
- not "Has feelings" (metaphysical claim)

When the player inspects a jealous butterfly:
- show "Watched [partner] grow close to [third party] 35s ago"
- not "Feels jealous"

When the player inspects a butterfly with pride:
- show "Took pride in [reason] - statusExpression +0.05 for 4:50 more"
- not "Feels proud"

This is the believability discipline. The Inspect surface already does
this for drives and emotions; extend it to feelings packets.

---

## Section 7 - Believable 3D / Sim-Board Direction

### What the sim-board already does well

```text
+- the focused mode is one playfield (R0/R1)
+- ambient grid is in the bake (no per-frame overdraw)
+- altitude shadow / sprite split reads as flight (R4)
+- block placement integer-snaps to legal cells (R3)
+- flower lifecycle has decay -> dirt-pile -> reserve-food (R6)
+- save round-trip preserves spatial truth
```

### What still hurts player readability

```text
+- focused-mode chip is canvas-only; DOM shell does not surface "you are
|  in: ivy-cloister" prominently. (out of scope for this slice but real)
+- block stacking in lived play does not visibly communicate "this stack
|  is on a supporter" - the player has to trust integer-snap. Consider a
|  ground shadow under stacks > h=1.
+- doorway corridors between zones in sim-board mode have arrival anchors
|  but no obvious "this is a doorway" cue when the player approaches one.
+- ability radii draw correctly but feel disconnected from the social
|  feed when an ability is used; tying ability emit -> feed thread (a
|  later R-phase) would help.
+- the feed italic line lives in canvas only (Gap-6).
```

### Specific 3D / sim-board work, in order

```text
sim-board plan (player legibility)
+-- W4 DOM feed/inspect surfacing                - already in W4
+-- BR1 stack ground shadow                      - additive, render-only
+-- BR2 doorway approach hint                    - additive, render-only
+-- BR3 ability emit -> feed thread coupling     - communication / UI
`-- BR4 mini-map in DOM shell                    - long-term polish
```

### BR1 - Stack ground shadow (proposed, optional, P2)

When a block stack has h >= 2 occupants, render a single soft shadow
under the bottom block at boardToScreen({...,h:0}) with alpha 80. This
communicates "this column is a real 3D stack" without changing the math.

Owned: `core/renderManager.js` only.
Forbidden: entities/, structureSystem placement, projection math.
Acceptance: visible in `r5-sprite-fidelity` and `r7-block-visual` screenshots.

### BR2 - Doorway approach hint (proposed, optional, P2)

When a butterfly is within 4 board units of a `zone.exits[*]` entry AND
state is `seeking-zone-travel`, render a 1-frame ghost outline of the
exit. Subtle (alpha 60), 60 frames duration.

Owned: `core/renderManager.js` only.
Forbidden: zoneSystem, gameCore.

### BR3 - Ability emit -> feed thread coupling (later)

When `specialEffects.emitAbility(entity, ability)` fires, also push a
feed thread row "[entity] used [ability]" under the existing emitter.
Already exists for some abilities; verify coverage in R6 audit.

### BR4 - Mini-map in DOM shell (long-term)

A small zone-grid view in the DOM shell that lights up the focused zone.
Out of scope for this slice; tracked in `ACTIVE-PUBLIC-SHARE-BOARD.md`.

---

## Section 8 - Save Continuity Protocol

```text
save continuity rules for W1..W6
+-- saves remain at schemaVersion 5
+-- W1 only emits packets via existing additive families (memories.outcome
|   for anchors, memories.social for loyaltyChoice). No new fields.
+-- W2 scenario harness does not touch the live save (verified by
|   storageRestored check in runner.js:185)
+-- W4 DOM surfacing reads from existing data; no save change
+-- W5 long-absence adds `socialEdges[id].lastSeenAtFrame` (optional, default
|   currentFrame) - additive
+-- bond progression scenarios run on synthetic test saves; the scenario
|   harness already resets baseline (runner.js:210) before each run
+-- the player's long-running save is sacred; never wipe to simplify
|   acceptance work
`- if any future phase needs a real schema bump, document in
   SAVE-SCHEMA-REGISTRY first; that is its own joint signoff
```

---

## Section 9 - Risk Summary

```text
high
+-- W1 trigger wiring may double-fire if not de-duped (e.g., distress
|   cascade resolves multiple times during a single resolution event).
|   Mitigate: per-trigger 5-minute caps; idempotency via packet existence
|   check in createOutcomeAnchor.
+-- W2 lived-loop scenarios may be flaky if simulation cadence is not
|   deterministic over 30-minute runs. Mitigate: seed all RNG, run all
|   scenarios in headless single-page; use existing storageRestored guard.
+-- W6 corpus growth may lower value-band metrics on lived play if scenario
|   distribution does not represent it. Mitigate: keep an ablation report;
|   never silently retune to make the audit pass.

medium
+-- W3 organic floor may report failures on real product gaps (e.g., scarcity
|   pulse not reaching every zone in 5 minutes); that is signal, not failure.
|   Mitigate: lane reports each hook independently; the failures get tracked
|   as separate issues, not silenced.
+-- W4 DOM feed re-flow on long heard-meaning text; cap at 60 chars and use
|   text-overflow: ellipsis.
+-- W5 iso cleanup batch may surface tiny pixel drifts at edge-of-zone;
|   verify via run-a4-spatial-truth-audit and run-r-block-cell-discipline.

low
+-- BR1 / BR2 are render-only; rollback by removing the new draw calls.
+-- W4 helper getEntityZone may be called pre-zone-init; gate on
|   entity.boardPos and entity.currentZoneId before lookup.
```

---

## Section 10 - Audit Lane Map

```text
must stay green through W1..W6
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
+-- run-h5-long-running-save-smoothness-audit.js
+-- run-lifesim-expression-audit.js
+-- run-n6-neural-social-scoring-audit.js
+-- run-n8-social-save-continuity-audit.js
+-- run-ml-trace-capture-audit.js
+-- run-r-spatial-cleanup-audit.js
+-- run-r-cooperation-pressure-audit.js (06 scripted lane)
+-- run-r-flower-lifecycle-audit.js (cleanup-floor scripted lane)
`-- run-scenario.js --all (13 storage scenarios)

new in this slice
+-- W1: scripts/run-r-cognition-trigger-coverage-audit.js (new)
+-- W2: 8 organic scenarios in scripts/scenario/scenarios/
+-- W3: 06b cooperation-organic lane in run-r-cooperation-pressure-audit.js
+-- W3: cleanup-organic lane in run-r-flower-lifecycle-audit.js
+-- W4: scripts/run-r-zone-lookup-coverage-audit.js (new)
+-- W6: ML cadence-factor side-by-side report
```

---

## Section 11 - Files / Owners Summary

```text
owned this slice
+-- W1
|   systems/lifeSimSystem.js (no API change)
|   systems/communicationSystem.js (callers of createOutcomeAnchor /
|                                    recordLoyaltyChoice)
|   systems/structureSystem.js (caller in heavy-block carry success)
|   systems/battleSystem.js (caller on commit)
|   core/config.js (cognition.triggers.* flags)
+-- W2
|   scripts/scenario/runner.js (new actions / assertions)
|   scripts/scenario/scenarios/seed-*-organic.json (new)
|   scripts/scenario/scenarios/README.md (new)
+-- W3
|   scripts/run-r-cooperation-pressure-audit.js (new lane)
|   scripts/run-r-flower-lifecycle-audit.js (new lane)
+-- W4
|   systems/zoneSystem.js (getEntityZone)
|   systems/objectSystem.js (2 callers)
|   systems/behaviorSystem.js (1 caller)
|   ui/gameUI.js (2 callers; preserve italic)
|   ui/dom/feedPanel.js (italic rendering)
|   ui/dom/<inspect panel> (feeling counters)
|   scripts/run-r-zone-lookup-coverage-audit.js (new)
+-- W5
|   systems/lifeSimSystem.js (long-absence)
|   entities/butterfly.js (~17 site iso cleanup)
|   scripts/scenario/scenarios/seed-grief-long-absence-organic.json (new)
`-- W6
    core/config.js (ml.cadenceFactor)
    systems/mlInferenceSystem.js (read cadenceFactor)
    scripts/build-c2-trace-corpus.js (extend)

forbidden across all phases
+-- save schema bump
+-- ML runtime contract surface (the c1 spec stays)
+-- new drive / emotion / motive / memory family vocabulary
+-- gridManager.js
+-- core/renderManager.js projection math
+-- battleSystem.js battle math (only the commit hook is owned)
```

---

## Section 12 - End-of-Document Honest Framing

```text
honest framing (this slice)
+-- the prior plan was right that R0..R9 + R10..R12 + E1..E6 was the right
|   ladder
+-- Codex landed the contracts (storage, derivation, scenario harness,
|   spatial cleanup, ML value-band metrics)
+-- Codex did NOT land the gameplay -> cognition triggers for E5/E6 (Gap-1,
|   Gap-2) and the scenarios as written test storage, not behavior (Gap-3)
+-- this is not a Codex error of intent; it is the boundary that always
|   creeps when "implement E3" can mean "ship recordBereavementForDeath"
|   OR "ship the BUTTERFLY_DIED -> bereavement chain that fires in lived
|   play". The first ships fast; only the second is the goal
+-- the next slice (W1..W6) is small and close-in; it is mostly closing
|   the gap between "function exists" and "function is reachable in
|   normal play"
+-- the spatial system does NOT need a rebuild; W4/W5 are surgical
+-- the ML evidence is now strong enough to make a product decision; that
|   decision is W6 + the user's read of the value-band report
+-- save sacredness holds; only additive fields with neutral defaults
+-- consciousness is not claimed; the new feelings remain functional
|   state with named triggers, decay, save persistence, and audit proofs
`- this is the slice that takes the build from "wired" to "alive"; the
   capture comes after, not during
```

---

## Section 13 - One-paragraph capture for prompt-pasting

```text
The codex/milestone-freeze-playtest @ a8f4c95 build has landed R0..R9
visual / spatial / cooperation contracts AND the R10/R11/R12/E1..E6
extensions Codex committed to. Storage, derivation, scenario harness, and
ML value-band metrics are in place; 0/6 ML metrics meet threshold, which
is honest signal not failure. However: (1) E5 pride/shame and E6 loyalty
have NO production triggers - they only fire from the scenario harness;
(2) E3/E4 packets fire correctly but the seeded scenarios call the
bookkeeping helpers directly rather than driving the BUTTERFLY_DIED /
emitDialogue chain; (3) R10 cooperation 5-min and cleanup floor are
scripted-injection / teleport-driven, not lived play; (4) R11 left
five getZoneAtGrid callers unmigrated; (5) the italic feed line lives in
the canvas-mode UI only. The next slice is W1 (production triggers) ->
W2 (lived-loop scenarios) -> W3 (organic R10 floors) -> W4 (R11 caller
migration + DOM surfacing) -> W5 (E3 long-absence + butterfly.js iso
cleanup) -> W6 (ML cadence-factor + corpus growth). Save schema stays
v5; only additive fields. The user's long-running save remains sacred.
The fresh G0 human capture comes AFTER W1..W4.
```
