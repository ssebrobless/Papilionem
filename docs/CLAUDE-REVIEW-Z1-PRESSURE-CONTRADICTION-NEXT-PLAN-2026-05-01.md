# Claude Review - Z1 Pressure Contradiction and Revised Plan

Date: 2026-05-02
Author: Claude Opus 4.7
Branch reviewed: `codex/milestone-freeze-playtest`
Latest pushed commit before Z1: `d240da6 Stabilize G0H cognition UI and ML proofs`
Workspace: `C:\Users\fishe\Documents\projects\ephemera`
Source request: live user request after Codex's Z1 attempt failed proof 1.
Binding upstream: `docs/CLAUDE-REVIEW-G0H-FULL-SUCCESS-NEXT-PLAN-2026-05-01.md`
Status: binding for the revised next slice. Replaces "Z1 - performance
pressure relief" with "Z1a + Z1b + Z1c". Codex's local changes from the
failed Z1 attempt are KEPT (the cache work was correct); the audit
acceptance criteria are recalibrated and a separate stutter investigation
is added.

---

## Section 0 - Executive Verdict

```text
verdict
+- Codex's Z1 implementation was technically correct. All six local
|  changes (cache cap raise, evictCreatureCloseupBakes, inspect-close
|  delayed eviction, pressure-headroom lane, G0H pressure gate) work
|  exactly as designed.
+- Z1 FAILED proof 1 because the original Z1 plan made a wrong
|  assumption: it assumed pressureTier=critical is driven by sprite
|  cache pressure. It is not.
+- Reading systems/telemetrySystem.js:1245-1311 buildPressureProfile()
|  shows pressureTier=critical fires when ANY of:
|    avgRenderMs >= 52, avgUpdateMs >= 20, visibleEntities >= 30,
|    visibleEffects >= 10, particleCount >= 110.
|  In the Z1 failed run:
|    avgRenderMs is well below 52 (steady-state avg ~6 ms)
|    avgUpdateMs is well below 20 (steady-state avg ~3 ms)
|    visibleEntities is far above 30 (16 butterflies + 9 blocks + 30
|      to 100 flowers + caterpillars/hybrids = 60+ visible at any
|      moment)
|    visibleEffects and particleCount are not the persistent drivers
|  -> the LIVE driver of pressureTier=critical is `visibleEntities >= 30`.
|     This is a normal property of the sim-board world, not a stutter
|     signal. The threshold of 30 was calibrated for an earlier era
|     with smaller entity counts and is no longer right.
+- BUT the failed run also reports REAL stutter signals:
|    maxRenderMs steady-sample max: 83.9 ms (5x frame budget)
|    p99FrameMs steady-sample max: 31.8 ms (2x frame budget)
|    final maxRenderMs: 14.9 ms (normal, post-spike)
|  These are transient spikes, NOT continuous load. They probably
|  correlate with the new pressure-headroom lane's periodic inspect
|  open/close transitions: a closeup LOD bake of wing 384x256 + body
|  256x256 + antenna 128x128 on a single frame is genuinely expensive
|  and the audit lane provokes one every ~15 seconds.
+- the cache work itself was a clear win:
|    spriteCacheEstimatedSurfaceMB: 31.988 (was) -> 5.6 (now), 88%
|      headroom against the new 48 MB cap
|    cache hit rate: 99.95%
|    cadence-budget-overrun count: 34 (was) -> 12 (now)
|  reverting these would lose real progress for no gain.
`- recommendation: KEEP all local changes. Pivot to Z1a (pressure tier
   disambiguation) + Z1b (stutter source investigation) + Z1c
   (calibrated audit acceptance). Then close Z1.
```

The original Z1 plan conflated three separable signals - density,
stutter, cache - into one binary. The fix is to separate them, gate
G0H on the one that matters (stutter), and address the actual
inspect-bake spike directly.

---

## Section 1 - What pressureTier Actually Measures

`systems/telemetrySystem.js:1245-1311 buildPressureProfile()`:

```javascript
let tier = 'normal';
if (
    avgRenderMs >= 52 ||
    avgUpdateMs >= 20 ||
    visibleEntities >= 30 ||
    visibleEffects >= 10 ||
    particleCount >= 110
) {
    tier = 'critical';
}
```

This is an OR of five thresholds. Three of the five (visibleEntities,
visibleEffects, particleCount) are DENSITY signals. Two (avgRenderMs,
avgUpdateMs) are LOAD signals. None are SPIKE signals.

The current sim-board world targets a believable garden density:
- 16 butterflies (fixture intent; will scale to 16-32 in real play)
- 9 blocks (fixture intent; will scale to 0-30)
- 15-100+ flowers (organic propagation; intentional)
- 0-2 caterpillars / hybrids (genetics)

That is 40-150 visible entities in normal play. The threshold of 30
was set in a prior era and is now wrong for the actual game's density
target.

The two LOAD signals (avgRenderMs >= 52, avgUpdateMs >= 20) are honest
critical thresholds for sustained heavy load. They did NOT fire in the
failed Z1 run. That is correct - the game is NOT under sustained heavy
load.

The two DENSITY signals being conflated with LOAD is the bug. They
should be a separate `densityTier` that informs but does not gate.

---

## Section 2 - The Real Stutter Signal

The failed Z1 run measured:
- maxRenderMs steady-sample max: 83.9 ms
- maxP99FrameMs steady-sample max: 31.8 ms
- maxRenderMs final (latest 180 samples): 14.9 ms

The "steady-sample" values come from a 7-min lane that polls every
15 seconds while doing periodic inspect open/close. Each inspect-open
on a butterfly with no cached closeup LOD triggers:
- wing-trimmed bake at 384x256 (some 4x baked variants per personality)
- body-trimmed bake at 256x256
- antenna-trimmed bake at 128x128

A bake is a `createGraphics(W,H)` + drawImage source -> bake target
+ optional smoothing. Done in a single synchronous frame call, this
can run 50-100 ms on a typical browser depending on device.

The `cacheMisses=52` after inspect-cycling 3-6 butterflies confirms
this is the path: 52 cold misses spread across the 7-minute lane,
roughly 2 inspects/cycle * ~15 cycles * 4 surfaces / butterfly =
50-60 misses. Each cold-miss cycle is a one-frame stutter.

After the bakes are warm, the cache hit rate is 99.95% and the spike
goes away. That is exactly the pattern Codex observed: maxRenderMs
final = 14.9 ms (warm), maxRenderMs steady-max = 83.9 ms (cold-miss).

The spike is REAL but FIXABLE. Three honest options:

A. **Async / deferred bake**: on inspect open, render the first frame
   using the existing garden bake (which is already cached). Schedule
   the closeup bake via `queueMicrotask` or `requestIdleCallback` so it
   completes on the next frame. The user sees the inspect panel open
   smoothly with garden-quality art for one frame, then closeup-quality
   the next frame. Visually nearly indistinguishable; no stutter.

B. **Pre-warm closeup bakes on fixture import**: when the G0H driver
   imports the fixture, pre-bake the closeup LOD for all butterflies
   that would be inspected. Burns 200-300 ms once, eliminates all
   inspect-open spikes during the run.

C. **Lower closeup LOD wing size**: 384x256 -> 256x192 cuts the bake
   cost roughly 50%. Visually still much higher fidelity than garden
   bake (128x96). User-visible loss is small.

I recommend **A** as primary (most general, smallest behavior change)
with **C** as fallback if A is too invasive.

---

## Section 3 - Are Codex's Local Changes Worth Keeping?

Yes. Per file:

**core/config.js** (sprite cache cap 32 -> 48 MB)
- KEEP. Headroom is now 88% instead of 0%. Even with the cache work
  not closing pressureTier critical, the cap raise enables the LRU
  to actually do its job rather than thrashing on every frame. This is
  pure win.

**core/spriteManager.js** (evictCreatureCloseupBakes)
- KEEP. Targeted eviction is the right primitive; even if today's
  cache MB is far under cap, this method becomes load-bearing during
  long sessions where many butterflies have been inspected.

**ui/gameUI.js** (250 ms grace period before eviction on inspect close)
- KEEP. Sensible UX guard; no downside.

**scripts/run-r-sprite-fidelity-audit.js** (pressure-headroom lane)
- KEEP the lane structure (run length, sampling cadence, inspect
  open/close). The lane reveals the cold-miss bake spike, which is
  what we actually want to know.
- RECALIBRATE the assertions (Z1c).

**scripts/run-g0h-scripted-playthrough.js** (critical-pressure runtime
gate)
- KEEP the lane infrastructure but RECALIBRATE: gate on stutterTier,
  not the lumped pressureTier.

**scripts/g0h/playthroughDriver.js** (runtimeSummary pressure metrics)
- KEEP. Adds telemetry without changing behavior.

No revert. Z1a layers calibration on top; Z1b layers stutter fix on
top.

---

## Section 4 - Revised Phase Plan

```text
Z1a - pressure tier disambiguation                                    [P0]
Z1b - stutter source investigation + async closeup bake               [P0]
Z1c - audit lane re-acceptance with calibrated criteria               [P0]
G0H rerun + Z1 acceptance gate                                        [gate]
Z2 - organic cleanup gradient (only after Z1 closes)                  [P0 next]
Z3 - organic shame + long-absence event capture                       [P0 next]
Z4 - Vale isolation diagnosis                                         [P0 next]
Z5 - G0H accessibility + extended cognition                           [P1 next]
Z6 - block height drop-shadow under stacks                            [P1 next]
G0H rerun + full Z acceptance gate                                    [gate]
G0  human capture                                                     [close]
```

Z1a, Z1b, Z1c can be implemented in a single commit since they share
files and acceptance criteria. They are listed separately for clarity.

---

## Section 5 - Phase Plan Detail

### Z1a - Pressure tier disambiguation

Goal: separate density / stutter / cache signals in
`buildPressureProfile()` so G0H can gate on what actually matters
(stutter) without being false-failed by the sim-board's normal entity
density.

Why now: this is the named contradiction in the failed Z1 run. The
threshold of `visibleEntities >= 30` was calibrated for a smaller-density
world. The current target world has 40-150 visible entities in normal
play. Without this fix, NO Z-phase can pass the pressure gate, even
with zero stutter.

Owned files:
- `systems/telemetrySystem.js`
  - keep `buildPressureProfile()` returning the legacy `tier` for
    backwards compat
  - add three parallel tiers in the same return value:
    - `densityTier`: visibleEntities, visibleEffects, particleCount
    - `stutterTier`: maxRenderMs, maxUpdateMs, p99FrameMs (NEW; needs
      to read from session percentiles or from a small recentMax window)
    - `cacheTier`: cacheMB / cap ratio
  - the legacy `tier` is the worst-of-three (so existing consumers do
    not regress)
- `scripts/run-r-sprite-fidelity-audit.js`
  - change the pressure-headroom assertions:
    - `pressure-headroom-stutter-non-critical`: `stutterTier !== 'critical'`
      in steady state
    - `pressure-headroom-cache-non-critical`: `cacheTier !== 'critical'`
      in steady state
    - `pressure-headroom-cache-under-cap`: maxCacheMB <
      0.9 * configuredCapMB
    - `pressure-headroom-density` is INFORMATIONAL (no pass/fail)
- `scripts/run-g0h-scripted-playthrough.js`
  - update the runtime-errors lane:
    - the lane fails ONLY when `stutterTier === 'critical'` OR
      `cacheTier === 'critical'`
    - density tier reports informationally
- `scripts/g0h/playthroughDriver.js`
  - report all three sub-tiers in `runtimeSummary`

Forbidden files:
- save schema (v5)
- entities/butterfly.js, entities/block.js
- core/spriteManager.js bake-size policy (Y3 stays)
- core/renderManager.js projection math
- systems/lifeSimSystem.js, systems/communicationSystem.js
- battle math, ML artifacts

Implementation steps:
1. Read `systems/telemetrySystem.js:1245-1311` `buildPressureProfile()`.
2. Add three helper computations:
   ```js
   function computeDensityTier({ visibleEntities, visibleEffects, particleCount }) {
       if (visibleEntities >= 80 || visibleEffects >= 16 || particleCount >= 200) return 'critical';
       if (visibleEntities >= 50 || visibleEffects >= 10 || particleCount >= 130) return 'hot';
       if (visibleEntities >= 30 || visibleEffects >= 7  || particleCount >= 90)  return 'warm';
       return 'normal';
   }
   function computeStutterTier({ maxRenderMs, maxUpdateMs, p99FrameMs }) {
       if (maxRenderMs >= 60 || maxUpdateMs >= 40 || p99FrameMs >= 28) return 'critical';
       if (maxRenderMs >= 40 || maxUpdateMs >= 28 || p99FrameMs >= 22) return 'hot';
       if (maxRenderMs >= 28 || maxUpdateMs >= 20 || p99FrameMs >= 18) return 'warm';
       return 'normal';
   }
   function computeCacheTier({ cacheMB, capMB }) {
       if (capMB <= 0) return 'normal';
       const ratio = cacheMB / capMB;
       if (ratio >= 0.95) return 'critical';
       if (ratio >= 0.80) return 'hot';
       if (ratio >= 0.60) return 'warm';
       return 'normal';
   }
   const RANK = { normal: 0, warm: 1, hot: 2, critical: 3 };
   function worst(...tiers) {
       return tiers.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), 'normal');
   }
   ```
3. Wire `maxRenderMs` / `maxUpdateMs` / `p99FrameMs` into the pressure
   profile. The simplest sources are `this.lastSessionPercentiles`
   (already populated at lines around 805-832 in telemetrySystem.js)
   and `Math.max` over `recentRenderSamples`. If those structures
   already exist, read from them. Do NOT introduce a new sampling
   path.
4. Wire `cacheMB` / `capMB`: read from
   `spriteManager.getBakedSpriteCacheTelemetry()?.estimatedSurfaceMB`
   and `spriteManager.getMaxBakedSpriteSurfaceMB()`. If these are not
   accessible from telemetrySystem.js, expose them via a small
   getter (no dependency cycle).
5. The legacy `tier` becomes `worst(densityTier, stutterTier, cacheTier)`
   so existing consumers keep their meaning. Old code that reads `tier`
   still gets a worst-of signal; new code that wants the breakdown
   reads the parallel fields.
6. Update the pressure-headroom assertions in
   `run-r-sprite-fidelity-audit.js` to gate on `stutterTier` and
   `cacheTier`, not on the lumped `tier`.
7. Update the G0H runtime gate in
   `run-g0h-scripted-playthrough.js` likewise.
8. Update `playthroughDriver.js` `runtimeSummary` to include all four
   tier fields.

Acceptance for Z1a (independent of Z1b):
- `node --check systems/telemetrySystem.js` passes.
- `buildPressureProfile()` return now includes `densityTier`,
  `stutterTier`, `cacheTier`, plus the legacy `tier` (worst-of).
- `run-r-sprite-fidelity-audit.js` lane fails ONLY on stutter or
  cache, not on density.
- The G0H pressure gate fails ONLY on stutter or cache, not on
  density.

Z1a alone may NOT pass the proof if the inspect-bake spike persists.
That is what Z1b fixes.

Rollback: `gameConfig.performance.pressureTier.disaggregated = false`
(default true) reverts to lumped tier semantics.

Risks:
- if other parts of the runtime consume `pressureTier` to scale
  simulation cost (the multipliers at lines 1282-1293 in
  buildPressureProfile() do this: simulationMultiplier 0.38 at
  critical, visualMultiplier 0.28 at critical), they will START
  scaling down because density-driven `tier=critical` will keep
  triggering. CHECK: do these multipliers actually reduce cost in
  any system? If yes, document - the runtime may have been
  silently scaling itself down due to the false-critical signal,
  and removing that scale-down may itself increase frame cost. Z1a
  must verify the simulationMultiplier consumers and decide whether
  to keep the lumped `tier` or use `densityTier` for the
  multiplier.
  - Suggested resolution: keep the multipliers reading from `tier`
    (legacy worst-of), so simulation auto-scales down on density
    OR stutter OR cache critical. Only the AUDIT GATES use the
    disaggregated tiers.

### Z1b - Stutter source investigation + async closeup bake

Goal: identify the source of the 83.9 ms maxRender / 31.8 ms p99
spikes in the pressure-headroom lane and reduce them so
`stutterTier !== 'critical'` in the rerun.

Why now: even with Z1a's calibration, the steady-sample
`maxRenderMs >= 60` threshold still fails (83.9 ms is over). The
spike is real and needs a real fix.

Owned files (for the investigation phase):
- `scripts/run-r-sprite-fidelity-audit.js`
  - extend `runPressureHeadroomLane()` to log spike frames:
    - capture `frame`, `totalRenderMs`, `topRenderContributors` (3
      labels), `cacheMisses` since last sample, `inspectAction`
      (open / close / idle)
    - any frame with totalRenderMs > 30 is logged
    - emit a `spikeBreakdown` array in the lane report

Once the breakdown is in hand, two surgical fixes are likely:

Owned files (for the bake-async fix, IF the breakdown shows inspect
open is the cause):
- `core/spriteManager.js`
  - new `prebakeCreatureCloseup(entity, options)` that schedules the
    closeup LOD bake asynchronously
  - `getBakedWingPieceData(spec, wingKey, ws, bakeOptions)` checks
    if a closeup-profile bake already exists; if not AND
    `bakeOptions.async` is true, returns the existing garden bake
    AND schedules the closeup bake via `queueMicrotask` /
    `requestIdleCallback`
- `entities/butterfly.js`
  - `getCreatureBakeOptions()` adds `async: true` when the inspect
    just opened (track via a small `inspectOpenedAtFrame` field
    that decays over 4 frames)
- `ui/gameUI.js`
  - on inspect open, set `entity.inspectOpenedAtFrame = currentFrame`
    so the next-4-frame draws use async LOD
  - on inspect close, clear the field

Implementation steps:
1. First, run the pressure-headroom lane WITH the new spike logging
   but no other changes. Inspect the spikeBreakdown to confirm the
   cause. The expected pattern: spikes correlate with
   `inspectAction='inspect-open-N'` and `cacheMisses` jumps by 4-12
   on the same frame.
2. If the breakdown matches expectation: implement the async closeup
   bake. Inspect open shows garden-quality art for 1-2 frames, then
   the closeup LOD becomes available.
3. If the breakdown shows a different cause (e.g., particle effects,
   save-load transitions, or hybrid spawning): fix accordingly. Do
   not implement async bake speculatively if it is not the cause.
4. Re-run the pressure-headroom lane and confirm
   `maxRenderMs steady max < 50 ms`, `stutterTier !== 'critical'`.

Acceptance for Z1b:
- spike pattern is documented in the lane report (`spikeBreakdown`
  array with at least 5 spikes in the failed run, root-caused).
- the named cause is fixed (or, if the cause is unfixable in this
  slice, documented with why - and the audit threshold is calibrated
  honestly to match).
- pressure-headroom rerun: `maxRenderMs steady max < 50 ms`,
  `stutterTier !== 'critical'` for the steady window (after 60s
  warmup).

Rollback: `gameConfig.rendering.creatureBakeAsyncOnInspect = false`
(if the async bake fix lands; default true).

Risks:
- async bake means the first inspect-open frame uses garden-quality
  art for the wing, body, antenna. If this is visible to the human
  user, it could feel like a 1-frame "pop". Mitigate: limit the
  async window to 1-2 frames; the closeup bake completes well within
  16 ms on the next frame.
- if the cause is something other than inspect bake (e.g., save-load,
  particle burst, hybrid spawn): the async bake fix does nothing.
  Investigate first; do not skip step 1.

### Z1c - Audit lane re-acceptance with calibrated criteria

Goal: pressure-headroom lane and the G0H runtime gate close cleanly
under Z1a + Z1b.

Owned files:
- `scripts/run-r-sprite-fidelity-audit.js`
  - the lane has 4 must-pass assertions:
    1. `pressure-headroom-cache-under-cap`: maxCacheMB <
       0.9 * configuredCapMB
    2. `pressure-headroom-cache-non-critical`: cacheTier !== 'critical'
    3. `pressure-headroom-stutter-non-critical`: stutterTier !==
       'critical' (steady window)
    4. `pressure-headroom-stutter-max-render`: maxRenderMs steady
       max < 60 ms (Z1a + Z1b should achieve much lower; this is
       the floor)
  - additional informational checks (no pass/fail):
    - `pressure-headroom-density-snapshot`: log densityTier
    - `pressure-headroom-cadence-budget-overruns`: log count
    - `pressure-headroom-cache-hit-rate`: log %
    - `pressure-headroom-spike-breakdown`: log array
- `scripts/run-g0h-scripted-playthrough.js`
  - runtime-errors lane gate:
    - fail if `stutterTier === 'critical'` OR `cacheTier === 'critical'`
    - report `densityTier` informationally (do not gate)

Forbidden files:
- save schema, vocabulary, projection, ML

Implementation steps:
- Apply the new assertion keys to the audit lane.
- Update the G0H gate.
- No code changes outside scripts/.

Acceptance for Z1c:
- `node scripts/run-r-sprite-fidelity-audit.js` - all 4 must-pass
  pressure-headroom assertions pass.
- `node scripts/run-g0h-scripted-playthrough.js` - 12/12 lanes pass.
- All existing audits stay green.

Rollback: `gameConfig.performance.pressureGate.disaggregated = false`
(if used; default true) reverts to the lumped-tier gate.

---

## Section 6 - Combined Acceptance Gate (Z1 closed)

After Z1a + Z1b + Z1c, the slice is CLOSED when ALL of the following
hold:

```text
+-- runtime
|   stutterTier !== 'critical' (steady state)
|   cacheTier !== 'critical' (steady state)
|   cadence-budget-overrun count <= 12
|   maxRenderMs steady max < 60 ms (Z1b target)
|   maxP99FrameMs steady max < 28 ms
|   spriteCacheEstimatedSurfaceMB stays under 0.9 * cap
|   cache hit rate >= 95%
|   densityTier may be 'hot' or 'critical' (informational only)
+-- baseline (unchanged from prior Z1)
|   12/12 G0H lanes pass
|   runtime errors = 0
|   page errors / console errors = 0
|   save-reload continuity preserved
|   block-cell discipline preserved
|   sprite fidelity audits pass
|   scenario suite 23/23 pass
```

Once Z1 closes, Z2 (organic cleanup gradient) becomes the next slice.

---

## Section 7 - Save Continuity Protocol (unchanged)

- saves remain at schemaVersion 5
- Z1a-c only touch telemetry, audit lanes, and (potentially) sprite
  bake scheduling. No save touch.
- player's real save remains protected by storage snapshot/restore
  + h5 fixture-export ignore rule.

---

## Section 8 - Risk Summary

```text
high
+-- Z1a multiplier consumers may have been silently scaling simulation
|   cost down due to false-critical density signal. Removing the
|   false-critical may surface latent stutter that was masked. Mitigate:
|   keep the legacy `tier` (worst-of) feeding the multipliers; only
|   the gates use the disaggregated tiers.
+-- Z1b async closeup bake: a 1-frame "pop" between garden and closeup
|   quality on inspect open. Mitigate: limit async window to 1-2
|   frames; the closeup bake completes within 16 ms on next frame.
medium
+-- Z1b investigation: if the spike cause is NOT inspect-bake (e.g.,
|   save-load, particle burst), the async bake fix is wasted effort.
|   Spend Z1b's first hour on investigation; do not implement any
|   fix until the breakdown is in hand.
+-- Z1c calibrated thresholds may be too lenient. The maxRenderMs <
|   60 ms gate is a floor, not a target. Z1b should aim for < 35 ms.
|   If we ship at 50 ms, the human capture may still see occasional
|   1-frame stutter on inspect open.
low
+-- Z1a parallel-tier API may break a small number of downstream
|   consumers that destructure `tier` only. Spot-check.
```

---

## Section 9 - Audit Lane Map (post Z1)

```text
must-pass after Z1a + Z1b + Z1c
+-- run-r-sprite-fidelity-audit.js (with new pressure-headroom lane
|   asserting stutterTier and cacheTier non-critical)
+-- run-g0h-scripted-playthrough.js (12/12; runtime gate uses
|   stutterTier OR cacheTier, not lumped tier)
+-- run-runtime-self-audit.js
+-- run-h5-long-running-save-smoothness-audit.js
+-- run-n8-social-save-continuity-audit.js
+-- run-r-block-cell-discipline-audit.js
+-- run-r-cognition-trigger-coverage-audit.js
+-- run-scenario.js --all (23/23)
`-- run-r5-sprite-fidelity-audit.js (cache hit/miss + clean shell)

new in Z1
+-- pressure-headroom-stutter-non-critical assertion (Z1a)
+-- pressure-headroom-cache-non-critical assertion (Z1a)
+-- pressure-headroom-stutter-max-render assertion (Z1a)
+-- spikeBreakdown array in pressure-headroom report (Z1b)
`-- async closeup bake guard (if Z1b fix lands)
```

---

## Section 10 - End-of-Document Honest Framing

```text
honest framing (Z1 contradiction)
+-- the original Z1 plan was based on a wrong premise (cache pressure
|   = pressureTier critical). Codex implemented exactly what was
|   asked, and the implementation worked - the cache is now at 12% of
|   the new cap with 99.95% hit rate.
+-- pressureTier=critical is being driven by visibleEntities >= 30,
|   which is a normal property of the sim-board world's intentional
|   density (40-150 visible entities). The threshold was set in an
|   earlier era and is no longer right.
+-- there IS a real stutter signal in the data: maxRenderMs steady
|   max 83.9 ms. It correlates with the new pressure-headroom lane's
|   periodic inspect open/close. The cause is almost certainly cold
|   closeup LOD bakes triggered on inspect open.
+-- Codex's local Z1 changes stay. The cache work is genuine progress.
|   Reverting would lose the headroom AND make the eventual stutter
|   investigation harder.
+-- Z1a calibrates the diagnosis layer. Z1b investigates and fixes the
|   real spike. Z1c restates the audit acceptance honestly. Together
|   they close Z1 without cheating the audit.
+-- the new acceptance criteria do NOT relax stutter detection. They
|   tighten it: stutterTier explicitly looks at maxRenderMs / p99FrameMs
|   thresholds (which were missing from the original critical gate).
|   The original gate could fire `critical` from density alone with
|   zero stutter; the new gate fires `critical` only when there is
|   actual stutter.
+-- after Z1 closes honestly, Z2 (organic cleanup gradient) becomes
|   the next slice. Z3, Z4, Z5, Z6 follow as in the prior plan.
`- ML stays at m4. Vocabulary unchanged. Save schema unchanged. The
   build is closer to "ready for human G0 capture", not further.
```
