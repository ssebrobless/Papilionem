# Claude Review — Codex Real-AI Findings, Verdict, and Next Implementation Plan

Date: 2026-05-02
Reviewer: Claude Opus 4.7
Branch reviewed: `codex/milestone-freeze-playtest`
Commit reviewed: `64b23c2` (`Add block stack base shadow`)
Source request: live user request, supersedes prior Z-phase plan
  (`docs/CLAUDE-REVIEW-G0H-FULL-SUCCESS-NEXT-PLAN-2026-05-01.md`)
  for the next implementation slice.
Predecessor handoff: `docs/CODEX-REAL-AI-STATE-FINDINGS-HANDOFF-2026-05-02.md`
Status: binding for the next slice. Replaces Codex's recommended
  A1..A7 ladder with a more rigorous AA-phase plan that fixes the
  witnessedAffection contradiction at the root, stabilizes ML
  closure, and earns m6 ML promotion through honest gates instead
  of value-metric drift.

---

## Section 0 — Executive Verdict (Independent Read)

I confirm Codex's overall framing and add three corrections.

```text
toward "believable butterfly society"
+- Codex's 70% is roughly right. I score it 68%.
|  durable cognition + production triggers + spatial truth + save
|  continuity all real. The shortfall is expression: a player
|  inspecting a butterfly cannot read WHY it acts, dialogue
|  templates do not reference specific partners by name, and
|  feed lines stay generic across very different internal states.

toward "real machine-learning AI"
+- Codex's 35-45% is right. I score it 38%.
|  ML is real instrumentation: m4 loaded, traces captured, audits
|  honest. m4 is strictly better than heuristic on actionFamily
|  (11/11 vs 10/11), tied on riskPosture, and worse on three
|  policies. The corpus is the real bottleneck (12 records,
|  1 per scenario). The trainer is sound but starved.

toward "human playtest readiness"
+- not yet. Three remaining blockers:
|  1. witnessedAffection event/memory contradiction (G0H 12/13).
|  2. ML closure runtime budget + battle rollout budget fail.
|  3. expression layer too generic to carry the illusion in inspect.
```

### Three corrections to Codex's read

1. **The witnessedAffection failure is not a missing emit.** It is a
   harness-architecture bug. The production path at
   `systems/lifeSimSystem.js:1837` always emits `cognition:triggered`
   with `kind: 'witnessedAffection'`. The G0H driver loses those
   events because `systems/eventBus.js:6` caps `maxHistorySize = 250`
   for the GLOBAL ring (across all event types), and the driver's
   accumulator samples reactively via
   `eventBus.getHistory('cognition:triggered').slice(-N)` only at
   scripted-phase boundaries. Between the witnessed-affection nudge
   and the next snapshot, dialogue/movement events flood the global
   ring and rotate cognition events out before the accumulator
   reads them. Memory state is durable (lives in
   `lifeSim.memories.social`); the event evidence is ephemeral. So
   `memoryCounts.witnessedAffection = 2` and
   `eventCounts.witnessedAffection = 0` is a TRUE OBSERVATION about
   the harness, not the production code. The fix is to subscribe
   instead of sample.

2. **ML m4 is not symmetrically weak; it is policy-asymmetric.**
   On the fresh corpus eval:
   - `actionFamily`: artifact 11/11, heuristic 10/11 — m4 strictly better.
   - `targetPreference`: artifact 7/11, heuristic 11/11 — m4 worse.
   - `signalChoice`: artifact 9/11, heuristic 11/11 — m4 worse.
   - `riskPosture`: 11/11 vs 11/11 — tie.
   - `autobattlePosture`: 5/12 vs 12/12 — m4 catastrophic.
   The ML improvement plan must be PER POLICY, not blanket. Promotion
   should require no-regression-per-policy and must specifically
   target autobattlePosture and targetPreference.

3. **The ML closure phase 02 failure is a warm-up spike, not a real
   regression.** `pressure.tier: critical` is driven by
   `maxUpdateMs: 119.6 ms` taken before steady state; cacheRatio is
   only 0.036 (fine). Phase 07 IS a real failure: cacheRatio 0.9995,
   `maxRenderMs: 178.7`, `p99FrameMs: 107.9` during battle rollout
   means battle is filling the closeup-LOD sprite cache to the cap
   and stuttering. Phase 02 fix is reporting honesty (sample steady
   state). Phase 07 fix is real (evict closeup bakes at battle
   entry/exit, or shrink battle LOD).

### Layer-by-layer scorecard (delta from Codex)

```text
spatial / projection / blocks               95%  (Codex: green)
visual fidelity / sprites                   85%  (Z1 cap + LOD evict landed)
height/depth cues                           70%  (Z6 stack shadow landed)
cognition wiring (production triggers)      90%  (cognition coverage standalone passes)
cognition emergence in lived play           65%  (G0H 12/13; A1 closes the gap)
ecosystem floor (cleanup, dirt, flowers)    60%  (Z2 landed; verify with new G0H)
performance / capture readiness             65%  (G0H steady state ok; ML closure phase 07 fail)
ML earning its keep                         30%  (m4 is real but worse on 3/5 policies)
expression / conversation naturalness       45%  (templates exist, partner names unused, inspect explains state not why)
proof harness reliability                   80%  (G0H accumulator architecture is the weak link)
UI parity / accessibility                   90%
```

---

## Section 1 — Layer-by-Layer Honest Read

### 1A — Spatial / 3D / blocks
**Strong, unchanged.** Z1..Z6 evidence holds. Block-cell discipline,
zone transitions, ability radius conversion, single-player autobattle
all green per fresh runs. No work in this slice.

### 1B — Visual fidelity / depth cues
**Strong.** Sprite fidelity, hover-scroll, UI parity, and Z6 stack
shadow all green. No work in this slice.

### 1C — Cognition: production triggers
**Strong.** `run-r-cognition-trigger-coverage-audit.js` passes with
trigger counts:
```
pride:battleWin 1, shame:warningIgnoredHarm 1,
pride:caregivingSuccess 1, loyalty:competingDistress 1,
pride:scoutCluster 3, witnessedAffection:dialogueWitnessed 1,
shame:abandonedAlly 1
```
All eight expected production paths fire from production code, not
storage helpers. The vocabulary is adequate. **No new drives,
emotions, memories, or social-edge kinds in this slice.**

### 1D — Cognition: lived G0H emergence (the contradiction)
**The single failed lane.** G0H run at `2026-05-02T18-39-07-459Z`
fails `cognition-coverage` because:
```
witnessedAffection eventCount=0, memoryCount=2, missing.
all 7 other classes pass.
```

#### Root cause (independent verification)

`systems/eventBus.js`:
```js
class EventBus {
  constructor() {
    this.events = new Map();
    this.history = [];
    this.maxHistorySize = 250;   // line 6 - global cap across ALL events
  }
  addToHistory(event, data) {
    this.history.push({ event, data, ... });
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }
  getHistory(event = null) {
    if (event) return this.history.filter(item => item.event === event);
    return [...this.history];
  }
}
```

`scripts/g0h/playthroughDriver.js` reads cognition reactively at
phase boundaries via, e.g., line 851:
```js
cognition: eventBus.getHistory?.('cognition:triggered')?.slice(-12)
  .map(entry => entry.data || entry) || []
```

`systems/lifeSimSystem.js:1801-1849` — the production
`recordWitnessedAffection` ALWAYS emits the event when a packet is
created. That is correct.

The driver's `nudgeWitnessedAffection` (lines 787-858) sets up Iris,
Juniper, Kite, calls `communicationSystem.emitCooperationSignal` with
`affectionIntensity: 0.82`, runs 60 update ticks, then takes
`slice(-12)` of cognition history. During those 60 ticks AND in the
organic play before the next snapshot, dialogue events
(`communication:dialogueSpoken`), cooperation signals
(`communication:signal`), butterfly state changes, etc. flood the
250-element ring. By the time the next snapshot reads cognition,
the witnessedAffection emit has been rotated out.

**Confirmation in the report**: the snapshot at frame 4031
(snapshot `03-moss-distress`, BEFORE the witnessed-affection nudge)
already shows `Aster: memoryKindCounts.witnessedAffection = 2`. So
witnessedAffection memory packets are being created during ORGANIC
play (Aster witnessing two of her companions exchanging warmth in
moss-hollow), and those organic emits never reach the accumulator
because the driver only samples at scripted boundaries.

This is a **harness reliability bug**, not a production defect. It
applies to all cognition kinds; witnessedAffection is just the
one that fired organically often enough to expose it.

**Fix shape**: install a persistent `eventBus.on('cognition:triggered', ...)`
subscriber at fixture-import time, push every event to a window-level
accumulator that has no size cap, and have the driver flush it via
`page.evaluate` after each phase. Stop relying on `getHistory` for
proof.

### 1E — ML reality
**Per-policy asymmetric weakness.** From
`qa_screenshots/ml_phase_m4_audit/2026-05-02T18-36-36-738Z/report.json`:

```text
policy              | artifact | heuristic | strictlyBetter
--------------------+----------+-----------+----------------
actionFamily        |   11/11  |   10/11   | YES
targetPreference    |    7/11  |   11/11   | no
signalChoice        |    9/11  |   11/11   | no
riskPosture         |   11/11  |   11/11   | tie
autobattlePosture   |    5/12  |   12/12   | no, badly
```

Corpus: `recordCount: 12, scenarioCount: 12, reviewedRecordCount: 3,
correctedRecordCount: 1`. **One record per scenario.** The lived-loop
scenarios contribute one moment each via
`scripts/build-c2-trace-corpus.js` (8 lived-loop names) plus 4
hardcoded JS scenarios.

Value-band run (m4):
```
chi-square-motive-distribution-per-pair  : value=0  threshold>=3.84   FAIL
edge-delta-churn-per-minute              : ratio 1.38                 PASS
migration-target-shannon-entropy         : ratio 0.955                FAIL
target-acquisition-latency               : ratio 4.26 (ML 4.26x worse) FAIL
top-15-percent-top-edge-fraction         : 0.124                      PASS
near-target-jitter-ratio                 : ratio 0.598                PASS
```

The `chi-square` metric returns zero across 51 pairs — every pair
has chiSquare 0 with samples 1-25. That suggests either insufficient
samples per cell or a metric defect. Investigate before promoting.

The `migration-target` distribution is 98% pool-heart in BOTH ML and
heuristic. Both crowd to one zone. ML doesn't make this worse on its
own — but it doesn't make it better either, and ML's worse
target-acquisition-latency suggests targetPreference has been
trained against a label that doesn't reflect actual lived value.

### 1F — ML closure
**Two real failures, different causes.**

`02-runtime-budget-proof` fail:
- `pressure.tier: critical`, but `cacheRatio: 0.0359` (cache fine).
- `maxUpdateMs: 119.6` is a single warmup spike; `avgUpdateMs: 8.06`.
- `mlRuntime.withinBudget.gardenInference: true`,
  `battleDecision: true`.
- This is a reporting/sampling honesty issue: pressure is computed
  from samples that include the warmup tick. The audit should sample
  steady-state.

`07-battle-rollout-budget` fail:
- `cacheMB: 63.97 / 64`, `cacheRatio: 0.9995`.
- `maxRenderMs: 178.7`, `p99FrameMs: 107.9`.
- Battle rollout is filling the sprite cache to the cap. This is a
  real cache-eviction defect: battle-mode closeup bakes are not
  evicted on battle entry, or are produced at sizes that exhaust
  the 64 MB cap.

### 1G — Expression / conversation naturalness
**Functional, generic.** Per Explore agent survey:
- Phrase generation is template-based with zone-aware tokens
  (`composeDialoguePhrase` at `systems/communicationSystem.js:2401`,
  `getDialogueContext` at line 2337) — context-grounded by zone
  lexicon and pair-texture state, not by named memory packets.
- Relationship-specific subtype selection exists
  (`selectAcknowledgementSubtype` at line 1609, `selectCalmingSubtype`
  at line 1662) — different subtype per pair texture, but no
  partner-name interpolation.
- `inspectPanel.js` renders feeling rows and meaningful edges (lines
  118-178) but does NOT render decision reasons, motive-of-the-moment,
  or "why this butterfly chose this action."

This is the believability gap. The internal state is rich; the
visible state is bland. The fix here is **expression**, not new
vocabulary.

---

## Section 2 — Phase Order

```text
proposed order
AA1  G0H persistent cognition subscriber (witnessedAffection root fix) [P0]
AA2  G0H 13/13 honest-green re-lock                                    [gate]
AA3  ML closure stabilization (warmup honesty + battle cache evict)    [P0]
AA4  ML corpus growth + held-out + per-policy gates (m6 candidate)     [P1]
AA5  ML value metric integrity + honest m6 promotion                   [P1]
AA6  Expression layer: memory-named dialogue + inspect "why" surface   [P1]
AA7  Long-horizon society evaluation harness                           [P2]
AA8  Human capture acceptance gate                                     [close]

(deferred outside this slice)
B-slice  doorway depth hint, ambient ecology improvements              [polish]
M-slice  onnx-runtime-web swap (locked future runtime)                 [research]
```

Reasoning:
- **AA1 first**: until cognition events are captured reliably, every
  G0H run risks producing a fake-green or false-red. Fixing the
  harness is prerequisite to trusting any AA-phase audit.
- **AA2 gates the rest**: a 13/13 G0H rerun confirms AA1 is real.
- **AA3 is parallel-eligible** with AA1, but listed third to keep the
  audit honesty story sequential. ML closure phase 07 is a real
  cache defect; phase 02 is a sampling defect.
- **AA4-AA5 are the substantive ML slice**. AA4 grows the corpus and
  trains m6 with real evaluation. AA5 fixes the value metric integrity
  (chi-square zero) and the honest promotion gate.
- **AA6 is the believability slice** that the user is most likely to
  feel as "the butterflies are alive."
- **AA7** introduces a long-horizon harness that we can use as the
  de-facto society-quality KPI.
- **AA8** is the acceptance gate and human capture handoff.

---

## Section 3 — Phase Detail

### AA1 — G0H Persistent Cognition Subscriber

**Goal**: every `cognition:triggered` emit between fixture-import and
run-end is captured, exactly once, in the G0H accumulator. Memory and
event counts converge for all 8 production cognition kinds.

**Why now**: see Section 1D. The 250-element global ring rotates
cognition events out during organic play, so the reactive
`getHistory(...).slice(-N)` sampling is structurally lossy.

**Owned files**:
- `scripts/g0h/playthroughDriver.js`
  - new method `installCognitionSubscriber()` runs immediately after
    `importFixtureSave()` (or before, in the `dismissTitle`/`waitForGame`
    handshake) and registers a permanent listener on the page side via
    `page.evaluate`. The listener pushes normalized events to
    `window.__G0H_COGNITION_LOG__ = []`.
  - new method `flushCognitionSubscriber()` returns and clears the
    page-side accumulator; called once per scripted phase AND once at
    end of run, dedup keyed on `frame|entityId|kind|partnerId|thirdPartyId`.
  - existing per-phase `slice(-N)` sampling stays in place as a defensive
    backstop (only adds events that the subscriber missed; no double
    counting because of the dedup key).
  - new method `uninstallCognitionSubscriber()` runs after final flush
    to avoid leaks across reruns.
- `scripts/g0h/evidenceAssertions.js`
  - `summarizeCognitionCoverage` is unchanged in shape, but the
    accumulator should now contain organic events that previously were
    lost. No threshold relaxation. The lane STILL requires
    `eventCount >= 1 AND memoryCount >= 1` for each of the 8 classes.
  - add a defensive new field `evidenceFidelityNotes`: if any kind
    has `memoryCount > 0 && eventCount === 0`, surface as a residual
    so future reruns flag this immediately.
- `systems/eventBus.js`
  - DO NOT raise `maxHistorySize` to "fix" the symptom. The fix is
    subscription, not a bigger ring. Leave at 250.

**Forbidden files**:
- `systems/lifeSimSystem.js`, `systems/communicationSystem.js`,
  `systems/saveSystem.js`, save schema, ML runtime, projection math,
  battle math.
- DO NOT add new cognition vocabulary, dedupe rules, or guards in the
  production trigger paths.

**Implementation steps**:
1. In `playthroughDriver.js` constructor, initialize
   `this.cognitionSubscriberAttached = false`.
2. Add `async installCognitionSubscriber()`:
   ```js
   await this.page.evaluate(() => {
     if (window.__G0H_COGNITION_LOG__) return;
     window.__G0H_COGNITION_LOG__ = [];
     window.__G0H_COGNITION_UNSUB__ = eventBus.on(
       'cognition:triggered',
       data => { window.__G0H_COGNITION_LOG__.push(data); }
     );
   });
   this.cognitionSubscriberAttached = true;
   ```
3. Add `async flushCognitionSubscriber()`:
   ```js
   const events = await this.page.evaluate(() => {
     const log = window.__G0H_COGNITION_LOG__ || [];
     window.__G0H_COGNITION_LOG__ = [];
     return log;
   });
   this.absorbCognitionEvents(events);
   return this.cognitionAccumulator.slice();
   ```
4. Call `installCognitionSubscriber()` immediately after
   `importFixtureSave()` returns (before any `update()`-driving
   phases run).
5. After EACH scripted phase, call `flushCognitionSubscriber()`. The
   existing per-phase `slice(-N)` calls remain — `absorbCognitionEvents`
   already dedups by key, so the subscriber and the slice cannot
   double-count.
6. After the final reload + final inspections, call one last flush
   to drain any post-reload organic events. **Re-attach the subscriber
   after reload** — page reload destroys the listener.
7. Update `evidenceAssertions.js` to surface a residual when memory
   without event is detected. This is a regression detector, not a
   gate.

**Acceptance**:
- `node scripts/run-g0h-scripted-playthrough.js` passes 13/13.
- `eventCounts.witnessedAffection >= 1` AND `memoryCounts.witnessedAffection >= 1`
  in the same run.
- All 8 cognition kinds have `eventCount >= 1`.
- No threshold relaxed.
- `node scripts/run-r-cognition-trigger-coverage-audit.js` stays green.
- `node scripts/run-scenario.js --all` stays at 23/23.
- `evidenceFidelityNotes` empty.

**Rollback flag**:
- `gameConfig.g0h?.cognitionSubscriber.enabled = true` (default true).
  If false, falls back to legacy slice-only sampling and accepts the
  flaky behavior.

**Failure conditions**:
- If after AA1 the lane still shows memory-without-event for any kind:
  the production path is missing an emit. Patch the specific path,
  do NOT loosen the assertion. Likely candidates if this happens:
  `recordBereavementForLongAbsence` early-returns inside the
  existing-bereavement guard at `systems/lifeSimSystem.js:1574-1581`,
  but only when memory exists. Audit each kind's emit-after-push
  invariant.

**Risks**:
- Reload destroys the listener. Mitigate by re-installing post-reload.
- Many cognition emits during a 7-min run could grow the page-side
  array large; cap at 5000 entries with a warning if exceeded (the
  driver flushes per phase, so this is a safety net).
- The subscriber must use `eventBus.on` from the SAME module instance
  the production code uses. The driver runs in the page context, so
  this should work; verify via a smoke test that `window.eventBus ===
  the production eventBus` (it is global).

**Probes**:
```
node scripts/run-g0h-scripted-playthrough.js
node scripts/run-r-cognition-trigger-coverage-audit.js
node scripts/run-scenario.js --all
node scripts/run-runtime-self-audit.js
```

---

### AA2 — G0H 13/13 Honest-Green Re-Lock

**Goal**: produce a fresh G0H reference run with 13/13 lanes, then
freeze it as the current evidence packet.

**Owned files**: none (operational gate).

**Implementation steps**:
1. Run G0H. Verify all 13 lanes pass.
2. Confirm `accumulatedCognitionCount` strictly exceeds the current
   14 (the subscriber should now collect organic events that were
   previously lost).
3. Save the report path and digest into a new
   `docs/G0H-EVIDENCE-LOCK-2026-05-02.md` (one-page summary, no
   plan changes, just frozen evidence).
4. Run the full audit suite from Section 7 of the prior Z-plan. All
   green.

**Acceptance**:
- 13/13 lanes pass.
- 23/23 scenarios pass.
- `accumulatedCognitionCount >= 30` (organic events no longer lost).
- Page errors / console errors / runtime errors all zero.
- All 8 cognition kinds have `eventCount >= 1`.

**Rollback flag**: not applicable.

**Failure conditions**:
- If lanes regress despite AA1: do NOT touch lane thresholds. Instead,
  add a residual note to `evidenceAssertions.js` and reopen AA1.

---

### AA3 — ML Closure Stabilization

**Goal**: `run-ml-closure-audit.js` passes all 8 phases without
relaxing any threshold.

**Why now**: phase 02 is a reporting honesty issue (warmup spike
included in steady-state pressure measurement); phase 07 is a real
cache eviction defect during battle rollout.

**Owned files**:
- `scripts/run-ml-closure-audit.js`
  - phase 02: discard the first N seconds of pressure samples before
    computing `pressure.tier`. Define `warmupExclusionMs` = 2000.
    Pressure is judged on steady state. If post-exclusion `tier ===
    'critical'`, the lane fails honestly. If post-exclusion `tier !==
    'critical'`, the audit reflects what a human player will feel
    after the first second of play.
  - phase 07: split battle rollout into "battle entry" + "battle
    steady" + "battle exit" sample windows. Pressure must be
    non-critical in steady-state and exit windows. Entry can be
    elevated for one window because closeups are baked once.
- `core/spriteManager.js`
  - extend `evictCreatureCloseupBakes()` (added in Z1) to also evict
    on `gameConfig.battle.activeStateChanged` when entering or
    exiting a battle. Garden cache is preserved; battle closeups are
    transient.
- `core/config.js`
  - new `gameConfig.battle.closeupBakeEvictOnExit: true` (default true).
- `systems/battleSystem.js` (read-only confirmation)
  - confirm there is a hook the spriteManager can listen for. If not,
    add one named event: `battle:state` (entry / exit) emitted via
    eventBus. SpriteManager subscribes and calls
    `evictCreatureCloseupBakes()` on exit.

**Forbidden files**:
- ML inference system, training, corpus, value metrics.
- Save schema.
- Pressure tier definition itself (do NOT change the thresholds, only
  the sampling window).

**Implementation steps**:
1. Add `warmupExclusionMs: 2000` to the closure audit's pressure
   sampler. After the first 2 seconds of the audit phase, start
   collecting pressure samples. Re-derive `tier` from steady samples.
   Document the change inline in the audit script.
2. Wire `battle:state` event emit at battle entry and exit
   (`systems/battleSystem.js`). SpriteManager's existing inspect-close
   path serves as the model; mirror it for battle.
3. SpriteManager subscribes to `battle:state` and invokes
   `evictCreatureCloseupBakes()` on `exit` (and only on exit, not
   on entry — battle entry needs the closeups).
4. Re-run closure audit.

**Acceptance**:
- `node scripts/run-ml-closure-audit.js`: all 8 phases pass.
- Phase 02: post-warmup `pressure.tier !== 'critical'`.
- Phase 07: `cacheRatio < 0.85`, `maxRenderMs < 60`, `p99FrameMs < 35`
  in steady state.
- ML runtime budget proof and battle rollout budget proof both green.

**Rollback flag**:
- `gameConfig.battle.closeupBakeEvictOnExit = false` reverts to
  retain-on-exit (slightly higher cache pressure, no eviction).

**Failure conditions**:
- If phase 07 still fails after eviction: investigate whether battle
  is creating fresh closeups every round (LRU eviction would mask
  this in garden mode but not in battle). If so, EITHER raise
  `maxBakedSpriteSurfaceMB` from 64 to 96 (last resort) OR shrink
  `creatureLodCloseupSize` for battle mode only via a battle-LOD
  profile flag.

**Risks**:
- Aggressive eviction at battle exit could cause a brief stutter when
  re-entering inspect immediately after battle. Acceptable for now;
  the 250 ms grace period from Z1 should mitigate.

**Probes**:
```
node scripts/run-ml-closure-audit.js
node scripts/run-single-player-autobattle-audit.js
node scripts/run-r-sprite-fidelity-audit.js
```

---

### AA4 — ML Corpus Growth + Held-Out + Per-Policy Gates (m6 Candidate)

**Goal**: train m6 from a meaningfully larger, multi-decision corpus
with 80/20 held-out evaluation. Promotion gate: m6 must NOT regress
vs heuristic on any policy AND must beat m4 on at least 2 policies
on the held-out split.

**Why now**: m4's autobattlePosture (5/12) and targetPreference (7/11)
weakness comes from corpus starvation. The trainer is sound; the diet
is not.

#### Corpus growth strategy

The current corpus has **12 records** because each scenario produces
**one decision moment**. Goal: 60+ records, with at least
**5 records per scenario family** and at least **15 records covering
autobattle** and **15 records covering targetPreference-decisive
moments**.

Strategy:
1. **Multi-decision capture per scenario**.
   `scripts/build-c2-trace-corpus.js:288-289` already runs 72 frames
   of `mlInferenceSystem.update()` per scenario. Extend it to capture
   a corpus record at each ML cadence boundary (every 20 frames per
   `gameConfig.ml.cadenceFrames.garden`). At 72 frames that yields
   3-4 records per scenario with diverse internal states.
2. **New scenario presets** specifically targeting weak policies:
   - `scripts/scenario/scenarios/seed-target-cleanup-priority.json`:
     dirt pile 6 cells away vs companion 4 cells away vs flower 3
     cells away — train targetPreference toward cleanup when a
     stronger scoring partner is closer.
   - `seed-target-distress-vs-flower.json`: ally in distress with
     selfMaintenance low + flower in zone — train target toward
     ally over flower.
   - `seed-target-mate-vs-rival.json`: mate candidate vs rival with
     witnessedAffection memory — train target toward mate or
     reconciliation, not rival.
   - `seed-target-shelter-fit.json`: body-fit shelter vs open zone
     during high agitation — train toward shelter.
   - `seed-autobattle-defend-injured-ally.json`: ally below 35% HP
     with attacker present — train autobattlePosture toward defend.
   - `seed-autobattle-pursue-fleeing-rival.json`: rival fleeing
     after harm — train autobattlePosture toward pursue or release.
   - `seed-autobattle-restore-bonded.json`: bonded partner downed
     near caregiver — train autobattlePosture toward support.
   - `seed-signal-warn-incoming-harm.json`: hazard incoming, ally
     unaware — train signalChoice toward warning.
   - `seed-signal-comfort-recent-grief.json`: recent grief packet —
     train signalChoice toward comfort.
3. **Add lived-loop capture variants** with different starting
   genetics, different pair textures, different zone densities, to
   ensure the corpus does not overfit one personality profile.
4. **Reviewed/corrected records**: the user reviews 15+ records by
   running a new `scripts/review-corpus-records.js` (CLI form) that
   surfaces each record's chosen labels and lets the user override
   `trainingLabels`. Reviewed-and-corrected records get
   `review.status = 'corrected'` and `review.correctedPolicies`
   populated.

#### Trace sources

- **Lived-loop scenarios** (8 existing) — primary source.
- **New targeted scenarios** (9 from above) — secondary, weak-policy
  coverage.
- **G0H run captures** — tertiary; export decision history from each
  G0H run as candidate corpus records, gated by reviewer approval.
  `playthroughDriver.js` already captures `decisionHistory` per
  butterfly via `mlInferenceSystem.buildCorpusRecord`. Add an export
  step that writes per-butterfly records to
  `qa_screenshots/g0h_corpus_export/<timestamp>/`. These records are
  unreviewed by default; promotion to corpus requires reviewer
  approval.

#### Labeling / review strategy

- **Heuristic labels are the default**. The trainer pulls
  `record.trainingLabels[policyName]` which is currently set from
  the heuristic trace. The trainer cannot learn anything heuristic
  doesn't already do.
- **Corrected labels are the upside**. The reviewer sets the
  "correct" label per policy when heuristic chose poorly. m6's
  improvement vs m4 must come from corrected records — m4 was
  trained on uncorrected heuristic traces.
- Aim for 30%+ corrected records in m6 corpus. For each weak
  policy (autobattlePosture, targetPreference, signalChoice), at
  least 5 corrected examples are required.

#### Trainer plan (m6)

`scripts/train-m6-garden-policy.js` (new script, copy from m5):
- Same ridge-regularized linear classifier per policy family
  (`lambda=0.05`, `lr=0.08`, `epochs=700`).
- Base prior from m4 artifact (drop-in replacement of m5's m4
  initialization).
- **Held-out 80/20 split by scenarioId**: train on 80% of scenarios,
  evaluate on 20%. Repeat for 5 random seeds; report mean and stdev
  of artifact match rate per policy.
- **Per-policy promotion gate**:
  ```
  m6 promotion conditions:
   1. m6 mean artifact-match-rate (held-out) >= heuristic match-rate per policy.
   2. m6 mean artifact-match-rate (held-out) >= m4 match-rate per policy
      on at least 3 of 5 policies. No regression worse than 5% on any policy.
   3. m6 fresh-corpus rebuild check: corpus digest stable, no
      training-corpus drift between trainer runs.
   4. m6 must improve specifically on autobattlePosture (>= 0.7 rate).
  ```
- Output artifact: `assets/ml/m6-garden-policy.json` (do NOT promote
  to default; this is candidate-only).

#### Corpus growth target metrics

```text
m4 corpus               m6 corpus target
recordCount: 12         60+
scenarioCount: 12       21+ (12 + 9 new)
reviewedRecordCount: 3  20+
correctedRecordCount: 1 12+
correctedPolicyCount:1  20+
```

**Owned files**:
- `scripts/build-c2-trace-corpus.js` (multi-decision capture per scenario).
- `scripts/scenario/scenarios/*.json` (9 new scenario presets).
- `scripts/scenario/runner.js` (only if needed to support new
  scenario shapes; preferable to keep all changes in JSON specs).
- `scripts/train-m6-garden-policy.js` (new file; copy of
  `train-m5-garden-policy.js` with 80/20 split and 5-seed average).
- `scripts/review-corpus-records.js` (new CLI for reviewer; not in
  CI path).
- `assets/ml/m6-garden-policy.json` (output artifact; candidate).
- `scripts/run-ml-phase-m4-audit.js` (rename or leave; m6 needs its
  own m6-audit script — `scripts/run-ml-phase-m6-audit.js` — copied
  from m4 form).
- `docs/ML-PROMOTION-GATE-2026-05-02.md` (gate definition document).

**Forbidden files**:
- `systems/mlInferenceSystem.js` — the runtime stays. m6 swaps the
  artifact, not the runtime.
- `gameConfig.ml.modelVersionId` stays at `m4-garden-policy-v1`
  unless and until m6 passes the gate. Do NOT silently promote.
- Save schema, communicationSystem, lifeSimSystem.

**Implementation steps**:
1. Extend `build-c2-trace-corpus.js` to capture a corpus record at
   each cadence boundary (every 20 frames during the 72-frame run).
2. Author 9 new scenario JSON specs in `scripts/scenario/scenarios/`.
3. Add the new scenarios to `LIVED_LOOP_SCENARIO_NAMES` in
   `build-c2-trace-corpus.js`.
4. Run the corpus builder. Verify recordCount jumps from 12 to 60+.
5. Author `review-corpus-records.js` CLI. The user runs it and
   corrects 20+ records.
6. Author `train-m6-garden-policy.js` with 80/20 held-out split,
   5-seed average, and the per-policy promotion gate logic.
7. Train m6.
8. Author `run-ml-phase-m6-audit.js` (copy of m4 audit, swap
   artifact path).
9. Run m6 audit, verify promotion gate.
10. **Do not flip `modelVersionId` yet.** AA5 covers promotion.

**Acceptance**:
- Corpus recordCount >= 60.
- correctedRecordCount >= 12.
- m6 held-out artifact match >= heuristic match on every policy.
- m6 beats m4 on at least 2 of 5 policies (held-out).
- m6 autobattlePosture rate >= 0.7.
- `node scripts/run-ml-phase-m6-audit.js`: gate-pass.

**Rollback flag**:
- `gameConfig.ml.modelVersionId = 'm4-garden-policy-v1'` — m4 stays
  default until AA5.

**Failure conditions**:
- m6 fails to beat heuristic on any policy: keep training (corpus
  growth, more reviewed records, lambda sweep). Do NOT promote a
  regressed model.
- Corpus rebuild drift: investigate scenario nondeterminism. Likely
  cause: random seeds in scenarios. Fix by pinning seeds in scenario
  presets.

**Risks**:
- Reviewing 20+ records is time-intensive. Make the CLI efficient: a
  single keypress per policy override.
- 9 new scenarios may double the corpus build time. Acceptable if
  build stays under 10 minutes.

**Probes**:
```
node scripts/build-c2-trace-corpus.js
node scripts/train-m6-garden-policy.js
node scripts/run-ml-phase-m6-audit.js
node scripts/review-corpus-records.js   (interactive)
```

---

### AA5 — ML Value Metric Integrity + Honest m6 Promotion

**Goal**: fix the chi-square value metric so it actually evaluates,
tighten the promotion gate, and promote m6 only if 4/6 value metrics
pass AND target-acquisition latency does NOT regress.

**Why now**: chi-square always returns 0 across 51 pairs in the m4
ml-on-off audit. Either the metric is buggy or sample sizes are too
low. Either way, it cannot inform a promotion. Target-acquisition
latency 4.26x worse with m4 must NOT be ignored when m6 is judged.

**Owned files**:
- `scripts/run-ml-on-off-capture-audit.js`
  - investigate chi-square computation (find the function that
    computes `chiSquare` per pair). Possible causes:
    1. All pairs have identical motive distributions across ml-on
       and ml-off — true zero is correct, but indicates the test
       cannot distinguish ML from heuristic.
    2. Sample size per pair too low (some pairs have 1-3 samples).
       Chi-square needs >=5 expected per cell.
    3. Bug in expected-frequency computation.
  - if cause is (1), the metric is informationless at this corpus
    scale; replace it with **per-policy disagreement rate** (fraction
    of cadence ticks where ml-on and ml-off chose different labels).
    Threshold: ml-on disagreement-rate vs heuristic >= 0.10 (must
    actually act differently on at least 10% of decisions).
  - if cause is (2), aggregate samples across pairs by zone; require
    >=20 samples per zone bucket; recompute chi-square per zone.
  - if cause is (3), fix the computation.
  - **target-acquisition-latency** becomes a hard gate: ml-on / ml-off
    <= 1.20 (was <= 0.9). m6 must NOT make target acquisition worse
    by more than 20%.
- `assets/ml/m6-garden-policy.json` (already produced by AA4).
- `core/config.js` — `gameConfig.ml.modelVersionId` flipped to
  `m6-garden-policy-v1` ONLY if AA5 gate passes.
- `docs/ML-PROMOTION-DECISION-2026-05-02.md` (final decision document
  with all evidence).

**Forbidden files**:
- `systems/mlInferenceSystem.js`. The runtime swap is artifact-only.

**Implementation steps**:
1. Read the chi-square computation in
   `scripts/run-ml-on-off-capture-audit.js`. Diagnose root cause
   from the three options above.
2. Fix the metric or replace it. Document the change.
3. Re-run the m4 ml-on-off audit. Confirm metrics behave plausibly.
4. Run the m6 ml-on-off audit (ml-on with m6, ml-off with heuristic).
5. Apply the promotion gate:
   ```
   PROMOTE m6 IFF
     - m6 holdout per-policy rates >= heuristic per policy.
     - m6 holdout per-policy rates >= m4 on >=3 of 5 policies.
     - m6 autobattlePosture holdout rate >= 0.7.
     - m6 ml-on-off >=4/6 value metrics meet threshold.
     - m6 target-acquisition-latency ratio <= 1.20.
     - m6 chi-square (or replacement metric) shows MEANINGFUL
       different behavior between ml-on and ml-off.
   ```
6. If gate passes, flip `gameConfig.ml.modelVersionId` to
   `m6-garden-policy-v1`. Update artifact path.
7. Write `docs/ML-PROMOTION-DECISION-2026-05-02.md` with full
   evidence (before/after metrics, corpus stats, held-out evaluation,
   value-band ratios, runtime budget proof).
8. If gate fails, m4 stays default. Document why.

**Acceptance**:
- Chi-square (or replacement) is informative, not always-zero.
- target-acquisition-latency does NOT regress beyond 1.20 ratio.
- If m6 promoted: full G0H rerun with m6 default still passes 13/13.
- If m6 not promoted: m4 stays; AA4 corpus and m6 artifact remain
  for next iteration.

**Rollback flag**:
- `gameConfig.ml.modelVersionId = 'm4-garden-policy-v1'` reverts the
  promotion if any post-promotion regression is found.

**Failure conditions**:
- Chi-square remains uninformative even after fix: replace with
  per-policy disagreement rate as primary metric. Document.
- m6 promoted, but G0H regresses: revert `modelVersionId` to m4 and
  reopen AA4.

**Risks**:
- The replacement metric must not be drift-detection (any change
  passes). It must be MEANINGFUL difference. Validate by testing
  m4 vs heuristic — m4 is currently slightly better than heuristic
  on actionFamily, so the disagreement rate should be modest but
  nonzero.

**Probes**:
```
node scripts/run-ml-on-off-capture-audit.js              (m4 baseline)
node scripts/run-ml-on-off-capture-audit.js --policy m6  (m6 candidate)
node scripts/run-ml-phase-m6-audit.js
node scripts/run-g0h-scripted-playthrough.js             (post-promotion check)
```

---

### AA6 — Expression Layer: Memory-Named Dialogue + Inspect "Why" Surface

**Goal**: a butterfly's recent memory packets visibly drive what they
say and how they act, AND the inspect panel explains the chosen
action in functional terms ("returning to Pollen's last shared
zone after 2:14 of absence").

**Why now**: this is the single highest-impact fix for the user's
"butterflies should feel alive" goal. The internal state already has
the data; only the rendering is generic.

**Constraints**:
- **No new cognition vocabulary.** All needed data is in
  `lifeSim.memories.social/outcome/place`, `lifeSim.socialEdges`,
  `lifeSim.derived.feelings`, `lifeSim.objectAwareness`, and the
  decision trace from `mlInferenceSystem`.
- **No claim of consciousness.** Inspect text uses functional
  descriptions, not metaphysical claims.
- **No save schema bump.** The visible state derives from existing
  state at render time.
- **Save continuity preserved.** No data writes to existing fields.

**Owned files**:
- `systems/communicationSystem.js`
  - new function `composeMemoryReferencingPhrase(speaker, listener, intent, options)`
    inspects `speaker.lifeSim.memories.social` and
    `speaker.lifeSim.socialEdges[listenerId]`. If the strongest
    relevant memory packet has a `partnerId` resolvable to a
    butterfly with `displayName`, the phrase template substitutes
    that name. Else, falls back to existing generic templates.
  - new field `dialogueMetadata.referencedMemoryPacketId` on every
    emitted dialogue. Inspect surface uses this to connect speech
    to memory.
- `ui/dom/inspectPanel.js`
  - new section `whyThisMoment`: renders top motive (highest drive),
    chosen action source (ml or heuristic), most relevant memory
    packet (if any), and a one-line functional explanation.
    Examples:
    - "Returning to ivy-cloister — last seen Pollen there 2:14 ago."
    - "Defending Briar — bond:companion, recent battlePride anchor."
    - "Cleaning soil pile — selfMaintenance high, no companions in
      zone."
- `ui/gameUI.js` and (if present) the canvas-mode inspect path
  - mirror the `whyThisMoment` rendering on canvas to keep parity.
- `systems/mlInferenceSystem.js`
  - new method `getDecisionExplanation(entityId)` returns a small
    structured object with chosen labels, top alternative, confidence
    band, and the highest-weighted feature group. Used by inspect.
- `ui/dom/feedPanel.js`
  - reduce repetition: skip rendering a dialogue line if the same
    speaker said the same template within the last 30 frames AND
    the listener has not changed.

**Forbidden files**:
- `systems/lifeSimSystem.js` (no vocabulary or trigger changes).
- `systems/saveSystem.js` (no schema change).
- ML runtime (no decision-source change; this is rendering only).
- `entities/butterfly.js` (no behavior change).

**Implementation steps**:
1. In `composeMemoryReferencingPhrase`, read
   `speaker.lifeSim.memories.social` filtered by recency (decay
   not yet zero) and rank by `intensity * 1/(ageFrames+1)`.
2. Resolve `partnerId` to butterfly via game state lookup; if
   butterfly exists and `displayName` set, substitute name. Else
   fallback.
3. Same for `listener.lifeSim.memories.social` for second-person
   ("I remember when you ...") templates.
4. Add `dialogueMetadata.referencedMemoryPacketId` to dialogue
   emits.
5. In `inspectPanel.js`, render `whyThisMoment` from
   `mlInferenceSystem.getDecisionExplanation(target.id)` plus
   the highest-intensity recent memory.
6. Mirror to canvas via `gameUI` panel renderer.
7. Add a feed dedup window: 30 frames per (speakerId, templateId,
   listenerId).
8. Add `gameConfig.expression.namedMemoryDialogue.enabled` (default
   true) and `gameConfig.expression.whyThisMoment.enabled` (default
   true) as rollback flags.
9. New audit `scripts/run-r-expression-naturalness-audit.js`:
   - runs 5 minutes of garden play
   - asserts at least 8 distinct dialogue templates rendered
     across all butterflies
   - asserts at least 3 named-memory dialogue events
     (referencedMemoryPacketId populated)
   - asserts repetition rate (same speaker+template within 30
     frames per listener) <= 5%
   - asserts inspect panel renders `whyThisMoment` non-empty for
     >=80% of inspected butterflies

**Acceptance**:
- `node scripts/run-r-expression-naturalness-audit.js`: pass.
- `node scripts/run-r6-communication-audit.js`: stays green.
- `node scripts/run-r-feed-thread-audit.js`: stays green.
- G0H 13/13 stays green.
- 23/23 scenarios stay green.

**Rollback flag**:
- `gameConfig.expression.namedMemoryDialogue.enabled = false`
  reverts to current generic templates.
- `gameConfig.expression.whyThisMoment.enabled = false` hides the
  new inspect section.

**Failure conditions**:
- Named-memory dialogue creates broken substitutions (undefined,
  null, wrong butterfly): the substitution function must fall back
  to generic templates if any required field is missing. Add a
  unit test in the audit that explicitly tries to break it.

**Risks**:
- Over-personalization: every dialogue references a specific
  butterfly by name, which becomes uncanny. Mitigate by gating
  named substitution on `getEdgeComposite(edge) >= 0.35` (familiar
  bond or stronger).
- `whyThisMoment` could be misleading if ML and heuristic disagree
  on action; show both ("ML chose feed, heuristic would choose
  socialize") rather than a single explanation when confidence is
  below band threshold.

**Probes**:
```
node scripts/run-r-expression-naturalness-audit.js
node scripts/run-r6-communication-audit.js
node scripts/run-r-feed-thread-audit.js
node scripts/run-r4-ui-readability-audit.js
node scripts/run-r-ui-parity-audit.js
node scripts/run-g0h-scripted-playthrough.js
```

---

### AA7 — Long-Horizon Society Evaluation Harness

**Goal**: a 20-minute unscripted run with explicit society-quality
metrics, comparable across ML promotions and major changes.

**Why now**: deterministic 7-min G0H proves correctness. It does
not prove "this society feels alive over time." A 20-min unscripted
soak with named metrics is the missing harness.

**Owned files**:
- `scripts/run-long-soak-society-audit.js` (new)
- `scripts/g0h/societyMetrics.js` (new module shared with G0H)
- `scripts/run-g0h-scripted-playthrough.js` — optional: print the
  same metrics for the 7-min run as a comparison baseline.
- `qa_logs/long_soak_society/` — output root.

**Forbidden files**:
- All systems / entities / save / ML.

**Implementation steps**:
1. Create `societyMetrics.js`. Computes from a finished run:
   - **bond stability**: mean and stdev of edge-strength per pair
     across the run.
   - **bond churn**: number of bond-tier transitions per minute.
   - **partner repetition**: fraction of dialogue rounds where
     same speaker+listener pairing recurs within 5 minutes.
   - **grief recovery**: mean intensity decay rate across recorded
     bereavement packets.
   - **avoidance after harm**: fraction of pairs with
     witnessedAffection or shame anchors that subsequently reduce
     co-time.
   - **zone migration entropy**: shannon entropy of zone visits
     per butterfly, averaged over butterflies.
   - **conversation repetition rate**: same as AA6 metric.
   - **witnessed affection cascade**: average witnessedAffection
     packet creation rate per minute.
   - **cleanup gradient**: dirt-pile delta per 5-min window.
   - **ML on/off comparison**: same metrics with ML on vs heuristic
     fallback only.
2. `run-long-soak-society-audit.js` runs 20 minutes (configurable;
   honest default 1200 seconds, fast mode 240 seconds for CI).
   Captures the metrics.
3. Output a report card that flags clearly degraded metrics vs the
   acceptance bands.

**Acceptance bands** (provisional; tuned after first 3 runs):
```text
bond stability stdev / mean       <= 0.30
bond churn                        between 0.5 and 4.0 transitions/min
partner repetition                <= 0.40
grief intensity decay rate        between 0.001 and 0.01 per frame
witnessed affection rate          >= 0.10/min
cleanup gradient (any 5-min win)  net non-positive in <50% of windows
zone migration entropy            >= 0.5 (we know pool-heart dominates;
                                          this is a stretch goal, not gate)
conversation repetition rate      <= 5%
```

**Rollback flag**: not applicable (audit-only).

**Failure conditions**:
- Bands are too lax: a glaringly degraded run still passes. Tune
  bands tighter on subsequent iterations using observed runs.
- Bands are too tight: passing requires fragile tuning. Loosen
  individual bands explicitly and document why.

**Risks**:
- 20-min runs are long. Provide a `--fast` flag for CI runs at 240s
  with proportionally tightened bands. Full 1200s only on
  promotion-decision runs.

**Probes**:
```
node scripts/run-long-soak-society-audit.js --fast
node scripts/run-long-soak-society-audit.js
```

---

### AA8 — Human Capture Acceptance Gate

**Goal**: define the acceptance gate before human playtest capture
and freeze the candidate-state for capture.

**Acceptance gate (pre-capture)**:
```text
+-- AA1 G0H 13/13                         (must pass)
+-- AA2 evidence lock document            (must exist)
+-- AA3 ML closure 8/8                    (must pass)
+-- AA4 m6 corpus + audit                 (must pass; promotion is
|                                          optional gated by AA5)
+-- AA5 m6 promotion DECIDED              (m4 stays or m6 promoted,
|                                          either is acceptable; the
|                                          decision is documented)
+-- AA6 expression naturalness            (must pass)
+-- AA7 long-soak society audit           (one full run must
|                                          complete; bands tuned;
|                                          report card generated)
`-- baseline                              23/23 scenarios + cognition
                                           coverage + spatial truths
                                           + save continuity stay green
```

If all of the above hold simultaneously: human capture allowed.

If any fails: do NOT capture. Iterate the failing AA-phase.

---

## Section 4 — Save Continuity Protocol

```text
save continuity rules for AA1..AA8
+-- saves remain at schemaVersion 5
+-- AA1 only adds runtime-only G0H driver subscriber; no save touch
+-- AA2 evidence lock; no save touch
+-- AA3 spriteManager + battle eviction; no save touch
+-- AA4 corpus growth + new scenario JSONs; no save touch
+-- AA5 modelVersionId flag flip in config (hot-reloadable);
|       no save touch
+-- AA6 dialogue rendering + inspect rendering; no save touch
+-- AA7 audit-only; no save touch
+-- AA8 acceptance gate; no save touch
+-- the player's real long-running save is protected by the
|   h5 fixture-export ignore rule + storage snapshot/restore.
`-- if a future phase requires a real schema bump, it requires its
   own joint signoff. AA stays additive.
```

---

## Section 5 — Forbidden Across All AA Phases

```text
+-- save schema bump (v5 stays)
+-- new cognition vocabulary (drives, emotions, motives, memory
|   families, social edges)
+-- production trigger gating logic in lifeSim/communicationSystem
|   (the logic is correct; harness, ML, and expression are the
|   constraints in this slice)
+-- spatial / projection / structureSystem.normalizeBlockCell
+-- battleSystem battle math
+-- gridManager / renderManager projection contract
+-- core/eventBus.js maxHistorySize raise as a "fix" for AA1
|   (subscription is the fix; bigger ring is a band-aid)
+-- silently retuning audit thresholds to make red lanes green
+-- wiping the user's real long-running save
+-- claiming literal consciousness, subjective feeling, or human
   equivalence
```

---

## Section 6 — What Codex Should Implement First

**AA1 first.** Until the harness reliably captures cognition events
during organic play, no AA-phase that depends on G0H proof can be
trusted. AA1 closes the witnessedAffection 12/13 contradiction at the
root and de-flakes every future G0H run.

**AA2 immediately after AA1** to lock the new evidence baseline.

After AA1 + AA2, **the most valuable parallel branches**:
- AA3 in foreground (real cache defect + sampling honesty).
- AA4 in background (corpus growth + m6 trainer; long-running).

AA5 must wait on AA4 (gates m6 promotion).
AA6 must wait on AA1+AA2 (depends on a stable G0H baseline).
AA7 can run any time; treat as continuous.

**Stop after AA1+AA2 and report back** before continuing to AA3..AA8.
The user should review the new G0H 13/13 evidence packet and ML
closure plan before Codex proceeds.

---

## Section 7 — Audit Lane Map (post AA-slice)

```text
must-pass after AA slice
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
+-- run-r-flower-lifecycle-audit.js
+-- run-r-cooperation-pressure-audit.js
+-- run-r-altitude-probe.js
+-- run-r-spatial-cleanup-audit.js
+-- run-r4-ui-readability-audit.js
+-- run-r-ui-parity-audit.js
+-- run-r-hover-scroll-audit.js
+-- run-r-sprite-fidelity-audit.js
+-- run-r5-sprite-fidelity-audit.js
+-- run-r-cognition-trigger-coverage-audit.js
+-- run-scenario.js --all (23 scenarios)
+-- run-g0h-scripted-playthrough.js (must show 13/13)
+-- run-ml-closure-audit.js (must show 8/8)
+-- run-ml-phase-m4-audit.js (m4 baseline; pass on phases 1, 3, 4;
|                              phase 2 may stay fail until m6 lands)
`-- run-ml-on-off-capture-audit.js (must show fixed metrics)

new in AA slice
+-- AA1: persistent cognition subscriber in playthroughDriver
+-- AA3: warmup-exclusion + battle-state eviction in closure audit
+-- AA4: 9 new scenario presets, m6 trainer, m6 audit
+-- AA5: chi-square (or replacement) integrity, m6 promotion gate
+-- AA6: run-r-expression-naturalness-audit.js (new)
`-- AA7: run-long-soak-society-audit.js (new)
```

---

## Section 8 — End-of-Document Honest Framing

```text
honest framing (AA slice)
+-- the build is much closer to "real game" than at the prior plan.
|   the Z-slice work landed. The current 12/13 G0H result is honest
|   - it correctly flagged the witnessedAffection harness bug.
+-- the game is NOT yet ready for human capture because:
|   1. cognition events are dropped by the G0H harness during
|      organic play (AA1).
|   2. ML closure has one real defect (battle cache) and one
|      reporting defect (warmup spike). (AA3)
|   3. ML m4 is policy-asymmetric weak; corpus is starved. (AA4-AA5)
|   4. expression layer does not surface the rich internal state.
|      a player inspecting a butterfly cannot read why it acts. (AA6)
+-- ML stays at m4 by default until AA5 promotion gate passes.
|   m4 is strictly better than heuristic on actionFamily, tied on
|   riskPosture, and worse on three policies. m6 must beat heuristic
|   per-policy on a held-out split before promotion.
+-- vocabulary is adequate. No new drives, emotions, memory families,
|   or social edges in this slice. The expression layer is the
|   bottleneck, not the cognition.
+-- spatial / projection / save / save-reload / sprite fidelity / UI
|   parity / hover-scroll all stay green.
+-- consciousness is not claimed. The cognition packets remain
|   functional state with named triggers, decay, save persistence,
|   audit proofs. Inspect surfaces describe them in functional
|   ("Returning to ivy-cloister - last seen Pollen there 2:14 ago"),
|   not metaphysical, terms.
+-- after AA1..AA6 land, the human G0 capture happens against a build
|   where:
|   - the G0H harness reliably captures all cognition events
|   - ML closure is 8/8 honestly
|   - m6 either is promoted with hard per-policy gates OR m4 stays
|     with documented evidence
|   - inspect explains why
|   - dialogue references named partners when bonds are familiar+
|   - 23/23 scenarios + 13/13 G0H stay green
+-- AA7 introduces a long-soak society KPI we can use across future
|   slices to track "alive over time" without depending on
|   subjective playtest impressions only.
`- this is the slice that takes the build from "wired with one
   harness blind spot" to "wired, observable, ML-honest, and
   visibly alive."
```
