# Claude Review - G0H Full-Success Verdict and Next Plan

Date: 2026-05-01
Author: Claude Opus 4.7
Branch reviewed: `codex/milestone-freeze-playtest`
Latest pushed commit: `d240da6 Stabilize G0H cognition UI and ML proofs`
Workspace: `C:\Users\fishe\Documents\projects\ephemera`
Source request: live user request, supersedes
  `docs/CLAUDE-WHOLE-GAME-REVIEW-G0H-3D-AI-UI-SPRITE-NEXT-PLAN-2026-05-01.md`
  for the next implementation slice.
Status: binding for the next slice. Replaces the prior X1..X5 / Y1..Y3
ordering with a "Z-phase" polish slice that closes the residual gaps
between "scripted harness passes" and "human player feels a believable
society".

---

## Section 0 - Executive Verdict

```text
verdict
+- the build is materially closer to "real game" than any prior packet.
|  Y1 (block restore), Y2 (UI parity), Y3 (sprite fidelity), X2 (loyalty
|  dedupe), X3 (cognition coverage), X4 (organic floor lanes), and X5
|  (m5 trainer, gated) all landed since the prior review. The 12/12 G0H
|  pass at 2026-05-01T22-05-14-550Z is real evidence, not a paper green.
+- BUT 12/12 overstates "ready for human G0 capture". Three problems hide
|  inside the green:
|  +- performance pressure tier is CRITICAL. Sprite cache is at 31.988
|  |  of 32 MB; 34 cadence-budget-overrun warnings; p99 frame 18.2 ms;
|  |  max update 48 ms, max render 58 ms. Y3 fidelity landed correctly
|  |  and is at the cap. A long human capture risks visible stutter.
|  +- two cognition trigger classes pass the lane via memory state, not
|  |  via lived emit. bereavementLongAbsence has eventCount=0,
|  |  memoryCount=1 (seeded on Pollen by the fixture builder). shame
|  |  anchors are 0 across all inspections in the live run; the standalone
|  |  cognition-trigger-coverage audit covers them, the G0H lived run
|  |  does not.
|  `- the world's organic cleanup is going BACKWARDS during play. The
|     G0H run started with 26 dirt piles, 31 normal flowers; ended with
|     76 dirt piles, 25 flowers, 105 lifecycle objects. Only 1 pile was
|     cleaned in 7 minutes. A human player will read this as
|     "ecosystem dying", not "alive society".
+- one more soft signal: Vale's inspection shows memoryPacketCount=0,
|  edgeCount=0 after 7 minutes. Either the fixture isolation is so
|  extreme she sees no one, OR there is a real social-edge initialization
|  bug. Either way, a human will notice "she has nothing in her head."
+- spatial / projection / save / save-reload / sprite math is honestly
|  green. No spatial rebuild. No save-schema bump. No vocabulary
|  expansion needed.
+- ML stays at m4 (correct call). m5 trainer + candidate exist; gate
|  fails on fresh corpus + value-band metrics. ML is currently NEUTRAL
|  (heuristic-equivalent net behavior). This is an honest research
|  posture, not a release blocker.
`- recommendation: do NOT promote to human G0 capture yet. Land a small
   Z-phase slice (5 surgical phases, all save-additive or audit-only).
   Then re-run G0H. Then human G0.
```

Honest score against the user's stated goals (delta from prior review):

```text
spatial / 3D-backed board truth          95%  (Y1 fix verified; +10)
visual clarity (sprite legibility)       80%  (Y3 landed; +40)
visual clarity (height / depth cues)     65%  (drop shadows under stacks
                                                still missing; unchanged)
AI / cognition wiring                    85%  (X2/X3 verified; +10)
AI / cognition emergence in lived play   55%  (long-absence + shame still
                                                not firing organically; +5)
organic ecosystem floor                  35%  (cleanup gradient backward;
                                                NEW finding)
performance / capture readiness          55%  (critical pressure tier;
                                                NEW finding)
ML earning its keep                      25%  (m5 trainer landed but gate
                                                failed; +5 for honest trainer)
UI parity DOM <-> canvas                 90%  (Y2 verified; +25)
proof harness reliability                90%  (cognition-coverage lane,
                                                evidence-fidelity lane,
                                                X1 fixes verified; +20)
```

Two of those numbers - emergence-in-lived-play and ecosystem-floor - are
the ones that gate "feels alive when a human watches it." Those are what
the Z-phase fixes.

---

## Section 1 - Layer-by-Layer Honest Read

### 1A - Spatial / 3D / projection / blocks

**STRONG**. Y1 fix verified at:
- `entities/block.js:182-208` `applyBoardCell` syncs `stackIndex` and
  `lastPlacedMode` with accepted h.
- `systems/saveSystem.js:1061-1093` `normalizeRestoredBlockBoardPos`
  prefers `boardPos.h` over `block.stackIndex` (heightHint logic at
  line 1067).
- `systems/saveSystem.js:1041-1059` `recordBlockStackHeightDivergence`
  emits a runtime issue when the two disagree, providing migration
  visibility for player saves with stale state.

G0H 12/12 confirms: 9 blocks, 0 duplicates, 0 half-cells, 0 out-of-range,
0 unsupported stacks. Save-reload-continuity passes for 16 butterflies +
9 blocks + 15 fixture flowers.

`boardToScreen`/`screenToBoard` math at `core/renderManager.js:517-547`
is sound. `structureSystem.normalizeBlockCell` at lines 405-412 is sole
owner of block grid snapping. No raw `gridPos` writes outside
`syncDebugGridPos`. Ability radius prefers board units; legacy
pixel-only path is gated by telemetry warning at
`systems/communicationSystem.js:717-722`.

Two minor residuals tracked, not blockers:
- particles still use legacy isometric drift (`systems/particleSystem.js:140-180`)
- ability legacy pixel-radius escape hatch retained for audit visibility

### 1B - Visual clarity (sprite resolution)

**STRONG**. Y3 fidelity landed cleanly:
- `core/config.js:364-381` defines `creatureBakeMode: 'fixed-high-res'`,
  `creatureBakeSize: { body: 96, wing: { width: 128, height: 96 },
  antenna: 48 }`, `creatureLodCloseupSize: { body: 256,
  wing: 384x256, antenna: 128 }`.
- `core/spriteManager.js:597-663` enforces fixed bake dimensions, LOD
  profile selection, and FIFO LRU at lines 266-276.
- `core/renderManager.js:106-131` sets creature layers to smooth, blocks
  layer to `noSmooth()` (pixel-crisp).
- `entities/butterfly.js:4273-4421` reads from baked high-res surfaces
  and downscales at draw via `graphics.image(...)` at the on-screen size.

G0H proof: `wing-trimmed maxWidth=384, maxHeight=256`, `body-trimmed
maxWidth=256, maxHeight=256`, `antenna-trimmed maxWidth=128, maxHeight=128`,
`spriteCacheCacheHits=390582`, `spriteCacheCacheMisses=928` (99.76% hit
rate). The R-sprite-fidelity-audit asserts 9 properties including bake
size minimums and SSIM-style hash-distance against source.

**One real concern (Z1)**: cache surface at `31.988 / 32 MB` ceiling is
an active LRU eviction cliff. `pressureTier: critical` and 34
cadence-budget-overrun warnings during the lived run point at
sustained pressure, not just transient spikes.

### 1C - Visual clarity (height / depth cues)

**WEAK, unchanged**. `entities/block.js:395-397` `drawShadow()` is a
no-op. Stacked blocks at `h>=1` render visually flat - the player cannot
see "this is a column" without inspecting. `core/renderManager.js`
computes shadow offsets for butterfly altitude (R4) but does NOT render
a drop shadow under the stack base for blocks at h>=1.

Doorway / zone-edge depth hint also missing, as before.

These remain visual polish, not contract gaps. They surface in Z6.

### 1D - Real AI / cognition

**MOSTLY STRONG**. The G0H accumulated cognition shows 6 trigger classes
firing from production paths:

```text
G0H lived run (7 min)
+- pride scoutCluster      x3  (Aster, Briar, Clover; frame 1671)
+- pride caregivingSuccess x1  (Aster -> Briar; frame 4313)
+- loyalty competingDistress x1  (Aster: Briar > Clover; frame 4313)
|                             (X2 dedupe verified - asymmetric)
+- bereavement butterflyDied x1  (Orchid grieves Pollen; frame 7242)
+- witnessedAffection x1   (Iris witnesses Juniper->Kite; frame 9753)
+- pride battleWin x1      (Wisp wins; frame 13288)
+- bereavement long-absence eventCount=0, memoryCount=1
|                            (Pollen has packet; emit not captured)
`- shame eventCount=0, memoryCount=0  (no abandoned-ally, no
                                        warning-ignored fired in run)
```

`recordBereavementForDeath` at `systems/lifeSimSystem.js:1768-1798`,
`recordWitnessedAffection` at lines 1801-1831, `checkLongAbsence` at
lines 1559-1625 are wired correctly with cognition:triggered emits and
proper guards (companion+ bond tier, zone diff, threshold gate, dedupe
on existing packet).

`recordProductionLoyaltyChoice` at
`systems/communicationSystem.js:330-338` uses canonical sort for the
dedupe key - X2 verified.

Shame anchors at:
- `systems/communicationSystem.js:513-517` (abandonedAlly: requires
  >=600 frames sustained distress >=0.64 with companion+ candidate not
  in `respondedCaregiverIds`).
- `systems/communicationSystem.js:4585` (warningIgnoredHarm: warning
  emitted, recipient takes harm).
Both are gated on conditions that the G0H driver does not provoke.

**Residuals**:
- **Z3 - Long-absence event capture**: per `lifeSimSystem.js:1574-1581,1598`,
  the existing-bereavement guard skips the emit if a long-absence packet
  already exists. The G0H fixture seeds Pollen with the packet at fixture
  build time (during the save's last update tick). On reload, the guard
  fires immediately, the lived emit never reaches the cognition
  accumulator. This is why eventCount=0 with memoryCount=1.
- **Z3 - Shame in lived G0H**: standalone `run-r-cognition-trigger-coverage-audit.js`
  asserts shame:warningIgnoredHarm and shame:abandonedAlly at lines
  328-329. The G0H scripted run does not provoke either. The
  cognition-coverage lane passes via memoryCount on long-absence and
  bereavementDeath, but accepts `shame=0` because the lane checks 6
  classes, not 8.
- **Vale isolation diagnosis (Z5)**: Vale shows `memoryPacketCount=0,
  edgeCount=0` after 7 minutes. Even at full social isolation, observation
  packets and zone-edge accumulation should produce nonzero values.
  Either the fixture seeds Vale with no edges and she stays out of any
  zone with another butterfly (intentional), or there is a real social
  edge initialization gap. Diagnose first; fix only if real.

Vocabulary remains adequate. No new drives, emotions, motives, memory
families, or social edges recommended in this slice.

### 1E - Organic ecosystem floor (NEW FINDING)

**WEAK by behavior, strong by hooks**.

Production cleanup hooks exist:
- `entities/flower.js:229` `tryCleanupDirtPile` accepts butterflies and
  performs the cleanup.
- `entities/flower.js:144,178` set `resourceTags: ['garden-object',
  'soiled-place', 'cleanup']`.
- `systems/lifeSimSystem.js:2078,2386,2410` set `currentAffordance =
  'clean'` when `selfMaintenance > 0.45` and a dirt pile exists in zone.

What is missing: the actual butterfly behavior path that consumes the
'clean' affordance and navigates to the pile. The G0H driver still
calls `pile.tryCleanupDirtPile?.([aster])` directly at
`scripts/g0h/playthroughDriver.js:549` - this is injection, not lived
behavior. The G0H lifecycle lane shows `pilesBefore: 26, pilesAfter: 25`
in 7 minutes, while NEW dirt piles spawn (final dirt-pile count: 76).
Net: ecosystem visibly decays.

The `seed-cleanup-floor-organic` scenario probably passes its lab gate
because it seeds idealized conditions. The G0H lived garden does not
recover the same gradient.

This is **Z2**: wire 'clean' affordance to actual navigation, OR add a
small "go-to-pile-and-cleanup" goal in the behavior tree path that
consumes the affordance hint. Acceptance: G0H pilesAfter < pilesBefore
by >=5 with NO driver injection; deterministic
`seed-cleanup-floor-organic` continues to pass without teleport.

### 1F - Performance / capture readiness (NEW FINDING)

**WEAK**. The G0H 7-min run reports:
- `pressureTier: 'critical'`
- 34 `cadence-budget-overrun` warnings
- `maxUpdateMs: 48.1`, `maxRenderMs: 58.2`
- `p50FrameMs: 9, p95FrameMs: 16.5, p99FrameMs: 18.2` (p99 > 16.67 ms
  budget = visible stutter at 60 fps)
- `peakHeapUsedMB: 48`, `spriteCacheEstimatedSurfaceMB: 31.988 / 32`
- 12 spike events, 0 freezeSuspects

This is the cost Y3 paid. The cache is right at the cap and LRU is
running constantly. The pressure tier is not "broken", but it is
"audibly stuttering during sprite-heavy moments."

A 7-minute scripted run is the easy case. A human capture is 20-60
minutes with arbitrary inspect/zoom/battle, which the LRU cliff makes
unpredictable.

This is **Z1**. Two safe options:
- Raise `maxBakedSpriteSurfaceMB` from 32 to 48 (plenty of headroom in
  the 48 MB peak heap; OS cache absorbs).
- OR shrink `creatureLodCloseupSize.wing` from 384x256 to 256x192 (cuts
  the LOD cache cost ~37% with little visible loss; the user has
  already approved a fixed-high-res garden bake of 128x96, the
  closeup-only LOD is now overkill against the cap).
- OR evict closeup bakes when inspect closes (specific eviction by
  `family + closeup tag`).

Recommend option 1 (raise cap) plus option 3 (evict-on-inspect-close)
together. Option 2 stays in reserve.

### 1G - UI parity / accessibility / hover-scroll

**STRONG**. Y2 verified:
- `scripts/run-r-ui-parity-audit.js` asserts hit-box vs draw-rect
  overlap >=95% across `playerButtons`, `accessibility controls/slider`,
  `feed filters`, `inspect mode buttons`, `journal tabs/actions` at
  uiScale 0.75 / 1.00 / 1.25.
- `scripts/run-r-hover-scroll-audit.js` verifies scrollTop advances on
  wheel for DOM panels (feed, access, inspect, journal, debug) at
  header / body / footer hover targets, AND for canvas panels via
  `gameUI.handleMouseWheel`.
- `ui/dom/accessPanel.js:1-124` mounts the DOM-mode accessibility
  surface with the 4 controls (highContrastUI, trailVisibility,
  colorblindMode cycle, disable colorblind) and the uiScale slider
  matching the canvas panel.
- `ui/dom/feedPanel.js:144-155` renders `<em
  class="shell-feed-heard-meaning">` italic.
- `ui/dom/inspectPanel.js:150-178` `renderFeelingRow` surfaces 8
  feelings + strongestFeeling.
- `ui/dom/shellOverlay.js:92-153` consumes wheel and routes to the
  panel scroller via 4-selector lookup.

Two minor residuals tracked, not blockers:
- canvas feed does NOT render heard-meaning italic (DOM-only). Acceptable
  parity gap because the canvas feed serves accessibility-low fallback.
- inspect detail "memory family counts" surfaces but is not formally
  asserted by the parity audit. Could be added later.

### 1H - ML / m5 trainer

**HONESTLY NEUTRAL**.
- `scripts/train-m5-garden-policy.js` is a real ridge-regularized linear
  classifier per policy family (lambda=0.05, lr=0.08, epochs=700,
  POLICY_FAMILIES = `['actionFamily', 'targetPreference', 'signalChoice',
  'riskPosture', 'autobattlePosture']`).
- `scripts/build-c2-trace-corpus.js` rebuilds corpus from 8 lived-loop
  scenario presets each run.
- m5 training corpus: 55/56; fresh-corpus rebuild: 47/56 vs heuristic
  55/56 -> overfitting visible.
- m5 value-band: 3/6 metrics pass (edge churn, migration entropy,
  latency); 3/6 fail (motive chi-square, top-edge fraction, jitter).
- `gameConfig.ml.modelVersionId = 'm4-garden-policy-v1'` (config.js:735),
  `useModelInference: true`, `cadenceFactor: 2`, `fallbackMode:
  'heuristic-fallback-required'`.
- Decision in `docs/ML-VALUE-DECISION-2026-05-01.md`: keep m4. Correct.

ML is not gating human G0 capture. The Z-phase does NOT include an ML
slice. m5 promotion is a separate research project that needs:
- proper held-out (80/20) eval inside the trainer
- corpus growth to 30+ records with 10+ reviewed/corrected
- regularization sweep
- promotion gate raised from 3/6 to 5/6 value metrics (or "must beat
  heuristic on fresh corpus")

Defer to a separate ML-only slice. Not a Z-phase concern.

---

## Section 2 - Phase Order Recommendation (Z-Phase)

```text
proposed order
Z1  performance pressure relief (sprite cache cap / LOD evict-on-close)  [P0]
Z2  organic cleanup gradient (consume 'clean' affordance in lived play)  [P0]
Z3  organic shame + long-absence event capture in G0H lived run          [P0]
Z4  Vale isolation diagnosis (fix-or-confirm)                            [P0]
Z5  G0H driver: accessibility + persistence phase + extended cognition   [P1]
Z6  block height drop-shadow under stacks (visual depth)                 [P1]
G0H rerun + Z-acceptance gate                                            [gate]
G0  human capture                                                        [close]

(deferred outside Z slice)
M-slice  m5 ML promotion: held-out eval, corpus growth, gate adjustment  [research]
B-slice  doorway depth hint, world ambient ecology improvements          [polish]
```

Reasoning:
- **Z1 first**: critical pressure tier risks visible stutter in the
  human capture. Cheapest fix in the slice. Unblocks confident capture.
- **Z2 next**: ecosystem-decay-during-play is the single clearest
  "this world is dying" signal. A human will read 76 dirt piles +
  shrinking flower count as failure even if the cognition is firing
  correctly under the hood.
- **Z3 next**: shame + long-absence are the two cognition trigger
  classes that pass via memory but do not emit during the lived run.
  Fixing these reaches the honest "all 8 trigger classes fire in lived
  play" bar.
- **Z4**: Vale's empty packet/edge state is small but visible. A
  human inspecting Vale will read "she has nothing" - either a feature
  (loneliness narrative) or a bug. Diagnose, then act.
- **Z5**: extends G0H driver to exercise the DOM accessibility surface
  (toggle colorblind/trail/contrast, save+reload, verify persisted) and
  to hold conditions long enough to provoke shame. Adds an acceptance
  lane.
- **Z6**: pure visual polish. Optional, schedules with Z5 if time
  permits.

Z2 + Z3 are the ones that move "emergence in lived play" from 55% to
80%+. Z1 + Z4 are the readiness fixes. Z5 + Z6 are the proof and
polish.

---

## Section 3 - Phase Plan Detail

### Z1 - Performance pressure relief

Goal: G0H 7-min run returns `pressureTier !== 'critical'`, sprite
cache estimated MB stays under 90% of cap throughout, p99 frame <=
16.7 ms in the steady-state phase (after warmup).

Why now: Y3 is at the cap. A long human capture amplifies the LRU
cliff. Either the cap rises or the LOD cache shrinks; doing nothing
ships visible stutter to the playtest.

Owned files:
- `core/config.js`
  - `gameConfig.rendering.maxBakedSpriteSurfaceMB` (raise 32 -> 48)
  - `gameConfig.rendering.creatureLodCloseupSize` (optional shrink -
    keep current values for now, leave the room for shrink in fallback)
  - new `gameConfig.rendering.creatureBakeEvictOnInspectClose: true`
- `core/spriteManager.js`
  - `evictOldestBakedSpriteEntry` extension: targeted eviction by
    family + LOD profile when inspect closes
  - new method `evictCreatureCloseupBakes()` callable when
    `gameUI.inspectPanel.lockedTargetId` clears
- `ui/gameUI.js`
  - on `clearInspectLockedTarget()` (or equivalent) call
    `spriteManager.evictCreatureCloseupBakes()`
- `scripts/run-r-sprite-fidelity-audit.js`
  - new lane: `pressure-headroom`
  - asserts `spriteCacheEstimatedSurfaceMB < 0.9 * cap`
  - asserts `pressureTier !== 'critical'` in a 7-min G0H rerun
- `scripts/run-g0h-scripted-playthrough.js`
  - acceptance threshold: `pressureTier !== 'critical'` becomes a
    must-pass for the `runtime-errors` lane (warn -> fail when critical)

Forbidden files:
- save schema, lifeSimSystem, communicationSystem, battle math
- m4/m5 ML artifacts
- entities/butterfly.js (sprite scale stays as-is)
- core/renderManager.js projection math

Implementation steps:
1. Raise `maxBakedSpriteSurfaceMB` from 32 to 48. The peak heap is 48
   MB, so even doubling the sprite cache lives within typical browser
   tab budget.
2. Add `evictCreatureCloseupBakes()` method. It walks the cache and
   evicts entries whose key ends with the LOD-profile suffix (e.g.,
   `closeup`).
3. Wire `clearInspectLockedTarget()` to call the eviction. Inspect
   open re-bakes; inspect close drops the LOD entries.
4. `pressureTier` derivation: confirm where it is computed (likely
   `core/telemetrySystem.js`) and that the criteria match the new
   smaller-cache + larger-cap configuration.
5. New audit lane in `run-r-sprite-fidelity-audit.js`:
   - Run 7 minutes of garden play with periodic inspect open/close.
   - Assert: cache MB stays under 0.9 * cap throughout.
   - Assert: pressureTier never reports critical.
6. G0H acceptance: the existing `runtime-errors` lane currently passes
   with `pressureTier=critical`. Tighten the lane: if `pressureTier ===
   'critical'`, the lane fails.

Acceptance:
- `node scripts/run-r-sprite-fidelity-audit.js` - new pressure-headroom
  lane passes.
- `node scripts/run-g0h-scripted-playthrough.js` - 7-min rerun;
  `pressureTier !== 'critical'`; cadence-budget-overrun count <= 12
  (was 34 before); p99 frame <= 16.7 ms in steady state.
- `node scripts/run-r5-sprite-fidelity-audit.js` - keeps passing.
- runtime self-audit + h5 + scenario suite stay green.

Rollback flag:
- `gameConfig.rendering.creatureBakeEvictOnInspectClose = false`
  reverts to retain-on-close.
- Cap can be reset via `gameConfig.rendering.maxBakedSpriteSurfaceMB`.

Failure: pressureTier still critical after both fixes -> escalate to
shrinking creatureLodCloseupSize (256x192 instead of 384x256). Land
under a separate flag `creatureLodMode: 'compact' | 'full'`.

Risks:
- Eviction of closeup bakes during rapid inspect-close-open thrashing
  (e.g., user quickly clicking different butterflies) could increase
  miss rate. Mitigate: add a small grace period (250 ms) before evicting
  on inspect close.
- Cap raise to 48 MB could push a low-memory browser tab into GC
  pressure. Mitigate: keep cap at 40 MB if 48 trips Z1's pressure
  acceptance bar in opposite direction.

Probes:
```
node scripts/run-r-sprite-fidelity-audit.js
node scripts/run-g0h-scripted-playthrough.js
node scripts/run-r5-sprite-fidelity-audit.js
node scripts/run-runtime-self-audit.js
node scripts/run-h5-long-running-save-smoothness-audit.js
```

---

### Z2 - Organic cleanup gradient

Goal: G0H 7-min lived run shows a NET cleanup of dirt piles (>= 5 piles
cleaned, no driver injection), without breaking the spawn rate that
proves a living ecosystem.

Why now: ecosystem-decaying-during-play is the strongest "world feels
dying" signal. The hooks exist; lived consumption is missing.

Owned files:
- `systems/lifeSimSystem.js` (consume 'clean' affordance into a
  navigation goal; document the cadence)
- `entities/butterfly.js` (movement step toward dirt pile when
  `currentAffordance === 'clean'` and a pile is in zone)
- `entities/flower.js` (the cleanup transaction stays - already calls
  `tryCleanupDirtPile`)
- `scripts/run-r-flower-lifecycle-audit.js`
  - new lane: `cleanup-organic-floor-lived` (no teleport, no injection,
    runs 5 min, asserts net-cleanup)
- `scripts/g0h/playthroughDriver.js`
  - REMOVE the `pile.tryCleanupDirtPile?.([aster])` injection at
    line 549 (replace with a status-check; the lived behavior should
    do the cleanup)
- `scripts/g0h/evidenceAssertions.js`
  - extend the flower-lifecycle assertion: assert `pilesAfter <
    pilesBefore - 5`

Forbidden files:
- save schema, ML runtime, projection math, battle math
- structure system

Implementation steps:
1. Read `systems/lifeSimSystem.js:2062-2078` and lines 2380-2412 for
   the 'clean' affordance scoring. Confirm where the affordance maps
   to a target / nav goal.
2. If the goal is set but the butterfly does not actually pathfind
   toward the pile, add a small "if `currentAffordance === 'clean'`
   and a `dirt-pile` is in zone within X board units, prefer it as
   the next movement target." Use `entity.boardPos` and dirt-pile
   `boardPos` distance, not pixel distance.
3. The cleanup itself: `entities/flower.js:268` already invokes
   `tryCleanupDirtPile` when butterflies overlap. Confirm the trigger
   condition uses board-cell adjacency and the butterfly's
   `lastInteractedAtFrame` cooldown is reasonable (<=600 frames).
4. Tune the cadence: the cleanup drive should not be so high that
   butterflies abandon all other behavior (caregiving, scout, mate,
   battle). The 'clean' affordance score is `0.16` extra weight in
   `lifeSimSystem.js:2410`, which is moderate. Verify it actually
   biases choice when other affordances are stronger.
5. Add the `cleanup-organic-floor-lived` lane in
   `run-r-flower-lifecycle-audit.js`. The lane:
   - seeds 12 piles in 4 zones
   - seeds 12 butterflies with diverse traits including 4 with
     `selfMaintenance >= 0.6`
   - runs 5 minutes of lived play (no teleport, no injection)
   - asserts: at least 6 piles cleaned, at most 18 new piles spawned
     (so the gradient is net-positive cleanup)
6. Update G0H driver: remove the `tryCleanupDirtPile` injection. The
   evidence assertion now requires lived cleanup.

Acceptance:
- `node scripts/run-r-flower-lifecycle-audit.js` - new lived lane
  passes (>=6 piles cleaned in 5 min, no teleport).
- `node scripts/run-g0h-scripted-playthrough.js` - 7-min rerun:
  `flowerLifecycle.pilesAfter < pilesBefore - 5`. Final dirt-pile
  count < 50 (was 76).
- `node scripts/run-scenario.js seed-cleanup-floor-organic` - existing
  scenario stays green (it uses idealized seed conditions).
- `node scripts/run-scenario.js seed-cooperation-organic-floor` - stays
  green.

Rollback flag:
- `gameConfig.cognition.affordances.cleanupNavigationBias` (default
  on; reverts to no movement bias if disabled)

Failure: lived cleanup fails -> investigate whether the affordance
score is being beaten by other affordances. Tune cadence or affordance
weight. Do NOT teleport butterflies onto piles in the lived run.

Risks:
- biasing too hard toward cleanup makes butterflies look
  "obsessive-compulsive" and drowns out the social behavior. Tune the
  weight so cleanup is a meaningful behavior, not a dominant one.
- spawn rate of dirt piles may need tuning if the gradient is still
  net-negative after Z2. Tune via `gameConfig.flowerLifecycle.dirtSpawnRateScale`
  (existing) - keep this as a separate dial.

---

### Z3 - Organic shame + long-absence event capture

Goal: G0H cognition-coverage lane reports `eventCounts.bereavementLongAbsence
>= 1` AND (`shame:abandonedAlly >= 1` OR `shame:warningIgnoredHarm >= 1`)
during lived play, NOT via pre-seeded memory.

Why now: cognition coverage is the difference between "we proved the
triggers" and "we proved they fire in human-visible play." The X3
lane currently passes the long-absence check via memoryCount, not
eventCount. Shame is uncovered entirely in the lived run.

Owned files:
- `scripts/g0h/fixtureSpec.js`
  - REMOVE the seeded long-absence packet on Pollen (keep
    `lastSeenAtFrameOffset: -120000` so the trigger fires on first tick
    of the run; the emit will reach the cognition accumulator).
- `scripts/g0h/playthroughDriver.js`
  - new driver phases:
    - "abandoned-ally provocation": set Vale (or Briar) to sustained
      distress 0.7 for 700 frames; ensure Aster is in same zone but
      occupied with Clover; assert `shame:abandonedAlly` event in
      cognition accumulator.
    - "warning-then-harm provocation": Lumen issues a warning to
      Mira about a hazard; force a small damage tick on Mira within
      600 frames; assert `shame:warningIgnoredHarm` event.
- `scripts/g0h/evidenceAssertions.js`
  - cognition-coverage lane now asserts EVENT counts, not memory
    counts, for all 6+2 = 8 trigger classes:
    - bereavementDeath, bereavementLongAbsence, witnessedAffection,
      loyaltyChoice, prideBattleWin, prideCaregivingSuccess,
      shameAbandonedAlly, shameWarningIgnoredHarm
- `systems/lifeSimSystem.js`
  - if Pollen's long-absence packet is intentionally seeded (i.e., not
    by an inadvertent fixture-build update tick), audit the fixture
    builder so the packet is left for the run to create.

Forbidden files:
- communicationSystem trigger logic itself (it works; do not change
  the gating)
- save schema
- entity vocabulary

Implementation steps:
1. Audit `scripts/build-g0h-fixture-save.js`: does it call
   `gameCore.update()` during fixture build? If yes, that is the path
   that seeds the bereavement packet during fixture creation. Either:
   - skip the lifeSim deep update during fixture build, OR
   - clear all bereavement packets after the fixture is loaded but
     before the cognition accumulator starts capturing.
2. Add G0H driver phase 03b ("abandoned-ally provocation") that:
   - sets Vale's distress to 0.7 at frame 1000
   - ensures Aster stays bound to Briar/Clover (existing fixture)
   - holds the state for 700 frames (~12 seconds)
   - asserts the shame event was captured in the accumulator
3. Add G0H driver phase 04b ("warning-then-harm provocation"):
   - Lumen emits a warning dialogue to Mira at frame 14500
   - small synthetic harm event delivered to Mira within 200 frames
   - assert the shame event was captured.
4. Update cognition-coverage lane in `evidenceAssertions.js`:
   - the lane now requires EVENT counts >=1 for all 8 trigger classes.
   - memory counts are reported but not the gate.
5. The standalone `run-r-cognition-trigger-coverage-audit.js` lanes
   stay unchanged (already cover shame triggers).

Acceptance:
- `node scripts/run-g0h-scripted-playthrough.js` - 7-min rerun;
  `evidenceLanes.cognition-coverage.eventCounts` reports nonzero
  values for all 8 trigger classes.
- standalone `run-r-cognition-trigger-coverage-audit.js` stays green.
- `run-scenario.js --all` stays at 23/23.

Rollback flag:
- `gameConfig.cognition.triggers.shame.abandonedAlly.enabled = true`
  / `warningIgnoredHarm.enabled = true` (already config-gated; keep
  defaults true).

Failure: shame events still don't fire in G0H -> trace the production
condition logs (via the runtime telemetry) to find what condition is
not being met. Tune the driver provocation, NOT the production gating.

Risks:
- making the driver too aggressive provokes shame "artificially" and
  loses the lived feel. Mitigate: keep provocations conservative and
  organic (Vale already has rejection emotion; Lumen already has
  warning intent in fixture).

---

### Z4 - Vale isolation diagnosis

Goal: either confirm Vale's empty packet/edge state is intentional
(loneliness narrative for inspection demo), or fix the underlying
social-edge initialization gap.

Why now: a human inspecting Vale will see "no memories, no
relationships." If intentional, the inspect surface should make this
LEGIBLE ("Vale has been alone for the entire session"); if a bug, it
hides cognition mass.

Owned files:
- diagnostic-only first; if a real bug surfaces:
  - `systems/lifeSimSystem.js` (ensureLifeSimState, ensureLifeSocialEdge)
  - `scripts/g0h/fixtureSpec.js` (Vale's initial state, zone, edges)
  - `ui/gameUI.js` and `ui/dom/inspectPanel.js` (loneliness narrative
    surface for low-edge butterflies)

Forbidden files:
- communicationSystem
- battle math, save schema

Implementation steps:
1. Run G0H scripted playthrough with EXTRA telemetry: log every
   ensureLifeSimState/ensureLifeSocialEdge call for Vale during the
   7-min run. Capture which production paths skip her or which
   initialization condition fails.
2. If Vale is genuinely never in a zone with another butterfly,
   confirm the fixture intentionally placed her at `pool-heart u=28
   v=17` (empty corner). Ratify intent.
3. If Vale's lifeSim is missing on init, fix `ensureLifeSimState` to
   create the default packet array even for "isolated" butterflies.
4. UI: if Vale is intentional, add a small "isolation marker" to
   inspect surface for butterflies with `edgeCount === 0` AND
   `memoryPacketCount < 3` AND lifeSim age >= 1800 frames. Render as a
   subdued italic line: "alone in the garden so far" (functional
   description, not metaphysical).

Acceptance:
- diagnostic logs identify the cause within one G0H run.
- if intentional: inspect surface shows the isolation marker for Vale
  in the next G0H run.
- if bug: Vale shows >=3 social packets and >=2 edges after 7 min of
  lived play.

Rollback flag: not needed; diagnostic-first slice.

Risks:
- the diagnostic phase may surface other low-packet butterflies (e.g.,
  Sage, Wisp) that are also being undercounted. If that happens,
  treat as a real bug (the fix is general, not specific to Vale).

---

### Z5 - G0H accessibility + extended cognition phase

Goal: G0H driver exercises the DOM accessibility surface (toggle
colorblind, trail, contrast, save+reload, verify persisted) and runs
long enough to provoke the Z3 shame events without manual scripting
of every condition.

Why now: the user has explicitly asked whether colorblind and
trail-effect settings work and persist across reloads. The Y2 audits
prove the surface; the G0H lived run never exercises the surface.

Owned files:
- `scripts/g0h/playthroughDriver.js`
  - new phase `00b-accessibility-cycle`:
    - opens DOM accessibility panel
    - cycles colorblindMode (off -> protanopia -> deuteranopia ->
      tritanopia -> monochrome -> off)
    - cycles trailVisibility (off -> reduced -> full)
    - toggles highContrastUI on, off, on
    - sets uiScale to 0.85, 1.10, 1.00
    - saves
    - reloads
    - verifies all settings persisted via `localStorage` /
      `papilionem-accessibility-v1`
- `scripts/g0h/evidenceAssertions.js`
  - new lane `accessibility-persistence` (must-pass)

Forbidden files:
- ui/dom/accessPanel.js (the surface is correct; do not modify)
- save schema

Implementation steps:
1. Add the driver phase between the fixture import and the lived run.
2. Add the lane assertion: each of the 4 settings was applied AND
   persisted across reload AND the canvas/DOM mode is in agreement.
3. Run; verify 13/13 lanes pass (was 12/12).

Acceptance:
- G0H rerun: 13/13 lanes; accessibility-persistence reports
  pass; all 4 settings persisted; DOM and canvas reflect the same
  state.

Rollback flag: not needed; audit-only phase.

Risks: low. The Y2 surface is already proven by run-r-ui-parity-audit.
The G0H driver is just exercising it in the scripted run.

---

### Z6 - Block height drop-shadow under stacks (visual polish)

Goal: stacked blocks at h>=1 render with a soft drop shadow at the
stack base, communicating "this column is real 3D".

Why now: the easiest visual cue that costs almost nothing. Improves
human-capture readability of the moss-hollow stack and any future
multi-zone block compositions.

Owned files:
- `entities/block.js`
  - replace the no-op `drawShadow()` at line 395-397 with a soft
    elliptical shadow at `boardToScreen({zoneId, u, v, h: 0})` for
    blocks where stackIndex >= 1
- `core/renderManager.js`
  - confirm the entitiesBehind layer is the right canvas for the
    shadow (it is; butterfly shadows already render here)
- `scripts/run-r-sprite-fidelity-audit.js`
  - new assertion: for blocks at h>=1, a shadow primitive renders at
    h=0 base (assert via screenshot pixel sample in the stack region)

Forbidden files:
- spatial math, save schema, lifeSimSystem

Implementation steps:
1. Implement `drawShadow` to render an elliptical alpha-blended
   shadow at `boardToScreen({zoneId, u, v, h: 0})`. Use the same
   shadow style as butterflies (R4) for consistency.
2. Test in a 2-block stack at moss-hollow:20:15:0 and :1. Confirm
   the shadow renders under the BASE block, not the top.
3. Add the audit assertion.

Acceptance:
- block at h>=1 has a visible shadow at h=0 base.
- audit assertion passes.
- runtime self-audit / scenario suite stay green.

Rollback flag:
- `gameConfig.rendering.blockStackShadow.enabled = true` (default
  true; reverts to no shadow if false).

Risks: low. Pure render addition.

---

## Section 4 - Acceptance Gate for Human G0 Capture

After Z1..Z6, the human capture is allowed when ALL of the following
hold simultaneously in a fresh G0H 7-min rerun:

```text
+-- runtime
|   pressureTier !== 'critical' (Z1)
|   cadence-budget-overrun count <= 12 (was 34)
|   p99 frame <= 16.7 ms in steady state
|   spriteCacheEstimatedSurfaceMB < 0.9 * cap (Z1)
+-- ecosystem
|   pilesAfter < pilesBefore - 5 (Z2; net cleanup positive)
|   final dirt-pile total < 50
|   no driver tryCleanupDirtPile injection (Z2)
+-- cognition
|   cognition-coverage lane reports EVENT counts >=1 for all 8 trigger
|     classes (Z3)
|   bereavementLongAbsence eventCount >= 1 (was 0)
|   shame:abandonedAlly OR shame:warningIgnoredHarm eventCount >= 1
|     (was 0)
|   no Vale-style empty-packet outliers (Z4)
+-- ui parity
|   accessibility-persistence lane passes (Z5)
|   all 4 accessibility settings persist across reload
+-- visual polish
|   block stacks render shadow at h=0 base (Z6)
+-- baseline
|   12/12 evidence lanes (now 13/13 with Z5) all pass
|   runtime errors count = 0
|   page errors / console errors = 0
|   save-reload continuity preserved
|   block-cell discipline preserved
```

If any of the above fails: do NOT promote to human G0. Iterate the
Z-phase that owns the failure.

---

## Section 5 - Save Continuity Protocol

```text
save continuity rules for Z1..Z6
+-- saves remain at schemaVersion 5
+-- Z1 only adjusts runtime cache cap and eviction; no save touch
+-- Z2 changes runtime navigation bias; no save touch
+-- Z3 removes a fixture-seeded packet; the FIXTURE save changes (regenerated
|   on next fixture build), the player's real save is not touched
+-- Z4 may change ensureLifeSimState; if it does, run a one-shot
|   reconciliation on load (similar to Y1's stackIndex sync) and emit
|   `lifesim-edge-divergence` runtime issues if the player's real save
|   has affected butterflies. Do not migrate the save bytes.
+-- Z5 only adds driver phases and audit lanes; no save touch
+-- Z6 only changes render output; no save touch
+-- the player's real long-running save (sacred) is protected by the
|   h5 fixture-export ignore rule + storage snapshot/restore. None of
|   Z1..Z6 needs a schema bump.
`-- if a future phase requires a real schema bump, it requires its own
   joint signoff via SAVE-SCHEMA-REGISTRY. Z stays additive.
```

---

## Section 6 - Risk Summary

```text
high
+-- Z1 cap raise + LOD eviction may interact with mid-run inspect open/
|   close thrashing. Mitigate: 250 ms grace period before eviction;
|   monitor cache miss rate during inspect-heavy phases.
+-- Z2 cleanup affordance bias may make butterflies look
|   obsessive-compulsive. Mitigate: keep weight at 0.16 (current) or
|   reduce to 0.12; tune via flag, not code.
+-- Z3 fixture-build update tick removal may break other fixture-based
|   audits if they rely on the same packets being seeded. Audit other
|   fixture-using scripts before removing.
medium
+-- Z4 may surface that several butterflies have low packet counts; the
|   fix should be general, not Vale-specific.
+-- Z5 G0H driver length grows; if it pushes the run over the 7-min
|   budget, accept up to 8.5 min total.
low
+-- Z6 shadow may need a depth-sort review if it stacks with butterfly
|   shadows. Land under a feature flag if any z-order issue surfaces.
```

---

## Section 7 - Audit Lane Map (post Z-phase)

```text
must-pass after Z slice (proof set)
+-- run-runtime-self-audit.js
+-- run-h5-long-running-save-smoothness-audit.js
+-- run-r2-zone-transition-audit.js
+-- run-r-block-cell-discipline-audit.js
+-- run-n8-social-save-continuity-audit.js
+-- run-f1-session-capture-audit.js
+-- run-ability-radius-conversion-audit.js
+-- run-single-player-autobattle-audit.js
+-- run-r6-communication-audit.js
+-- run-r-feed-thread-audit.js
+-- run-r-flower-lifecycle-audit.js   (with new cleanup-organic-floor-lived
|                                      lane in Z2)
+-- run-r-cooperation-pressure-audit.js
+-- run-r-altitude-probe.js
+-- run-r-spatial-cleanup-audit.js
+-- run-r4-ui-readability-audit.js
+-- run-r-ui-parity-audit.js
+-- run-r-hover-scroll-audit.js
+-- run-r-sprite-fidelity-audit.js   (with new pressure-headroom lane in
|                                      Z1, and stack-shadow lane in Z6)
+-- run-r5-sprite-fidelity-audit.js
+-- run-r-cognition-trigger-coverage-audit.js
+-- run-scenario.js --all (23 scenarios)
`-- run-g0h-scripted-playthrough.js (must show 13/13 lanes after Z5)

new in Z slice
+-- Z1: pressure-headroom lane in run-r-sprite-fidelity-audit.js
+-- Z2: cleanup-organic-floor-lived lane in run-r-flower-lifecycle-audit.js
+-- Z3: event-counts-required for cognition-coverage lane
+-- Z5: accessibility-persistence lane in run-g0h-scripted-playthrough.js
`-- Z6: block-stack-shadow lane in run-r-sprite-fidelity-audit.js

deferred (separate slices)
+-- M-slice: m5 ML promotion (held-out eval, corpus growth, gate
|   adjustment, regularization sweep)
`-- B-slice: doorway depth hint, world ambient ecology improvements
```

---

## Section 8 - Files / Owners Summary

```text
owned this slice
+-- Z1 performance pressure relief
|   core/config.js (maxBakedSpriteSurfaceMB, creatureBakeEvictOnInspectClose)
|   core/spriteManager.js (evictCreatureCloseupBakes)
|   ui/gameUI.js (eviction trigger on inspect close)
|   scripts/run-r-sprite-fidelity-audit.js (pressure-headroom lane)
|   scripts/run-g0h-scripted-playthrough.js (pressure acceptance)
+-- Z2 organic cleanup gradient
|   systems/lifeSimSystem.js (cleanup affordance navigation)
|   entities/butterfly.js (movement target preference under 'clean')
|   entities/flower.js (transaction stays; verify cooldown)
|   scripts/run-r-flower-lifecycle-audit.js (cleanup-organic-floor-lived)
|   scripts/g0h/playthroughDriver.js (remove tryCleanupDirtPile injection)
|   scripts/g0h/evidenceAssertions.js (assert net-cleanup)
+-- Z3 organic shame + long-absence
|   scripts/g0h/fixtureSpec.js (remove seeded long-absence packet)
|   scripts/build-g0h-fixture-save.js (skip update tick OR clear
|                                      bereavement packets)
|   scripts/g0h/playthroughDriver.js (provocation phases 03b, 04b)
|   scripts/g0h/evidenceAssertions.js (event-count gate for 8 classes)
+-- Z4 Vale isolation diagnosis
|   scripts/g0h/playthroughDriver.js (telemetry phase)
|   systems/lifeSimSystem.js (if a real init bug surfaces)
|   ui/dom/inspectPanel.js (isolation marker if intent confirmed)
|   ui/gameUI.js (canvas isolation marker counterpart)
+-- Z5 accessibility + extended cognition
|   scripts/g0h/playthroughDriver.js (00b-accessibility-cycle)
|   scripts/g0h/evidenceAssertions.js (accessibility-persistence lane)
`-- Z6 block stack shadow
    entities/block.js (drawShadow body)
    scripts/run-r-sprite-fidelity-audit.js (block-stack-shadow lane)

forbidden across all phases
+-- save schema bump (v5 stays)
+-- ML runtime contract surface (m4 stays default)
+-- new cognition vocabulary (drives, emotions, motives, memory families,
|   social edges)
+-- gridManager.js
+-- core/renderManager.js projection math (board math stays)
+-- battleSystem.js battle math
+-- structureSystem.normalizeBlockCell (the normalizer is correct)
+-- communicationSystem trigger gating logic (the conditions are
|   correct; the harness needs to provoke them)
```

---

## Section 9 - End-of-Document Honest Framing

```text
honest framing (Z slice)
+-- the build is real game now. Y1 + Y2 + Y3 + X2 + X3 + X4 + X5 trainer
|   all landed and the 12/12 G0H pass is real evidence. The cognition
|   layer fires 6 trigger classes from production paths in 7 minutes
|   of scripted lived play.
+-- the game is NOT yet ready for human capture because:
|   1. performance pressure is critical (Z1)
|   2. ecosystem visibly decays during play (Z2)
|   3. two cognition trigger classes pass via memory but do not emit
|      during the lived run (Z3)
|   4. a butterfly is socially dead in inspect (Z4)
|   5. accessibility persistence is unproven in the lived run (Z5)
+-- ML stays at m4. The trainer is real and gated correctly. m5
|   promotion is a separate research slice. NOT a human-capture blocker.
+-- vocabulary is adequate. No new drives / emotions / memory families /
|   social edges. The bottleneck is harness rigor + organic floors,
|   not expressiveness.
+-- spatial / projection / save / save-reload / sprite fidelity / UI
|   parity / hover-scroll are all honestly green.
+-- consciousness is not claimed. The cognition packets remain
|   functional state with named triggers, decay, save persistence,
|   audit proofs. Inspect surfaces describe them in functional
|   ("Misses Pollen for 2:14 more"), not metaphysical, terms.
+-- after Z1..Z6 land, the human G0 capture happens against a build
|   where:
|   - performance pressure is non-critical
|   - the ecosystem nets toward cleanup, not decay
|   - all 8 cognition trigger classes fire in lived play
|   - no socially-empty butterfly outlier
|   - all accessibility settings persist across reload
|   - block stacks visually communicate their height
|   - 13/13 G0H evidence lanes pass
`- this is the slice that takes the build from "wired and partially
   visible" to "wired, visible, and ready for human play".
```
