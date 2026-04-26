# Visual-First Runtime Optimization Plan — Refined (Implementation-Ready)

> Companion to `VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN.md`. The original remains the intent / guardrails artifact. This document adds the concrete work items, thresholds, flags, and measurement harness needed to actually start cutting code.

```text
╔══════════════════════════════════════════════════════════════════════════════╗
║ What this document adds on top of the original plan                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ • measurable before/after thresholds grounded in existing telemetry fields  ║
║ • a baseline capture protocol (v0) before any optimization work begins      ║
║ • per-phase work items with file-level targets                              ║
║ • feature-flag registry so each phase is individually rollback-able         ║
║ • measurement harness spec tied to scripts/run-f2-performance-*             ║
║ • explicit phase dependencies and a review-gate checklist                   ║
║ • v0.5 free-wins pass (tab-hidden pause, async decode, ring caps,           ║
║   text measure cache, IDB save path)                                        ║
║ • asset-pipeline work folded into v3 (atlas pack, WebP, alpha pre-strip)    ║
║ • render-scale knob + adaptive quality scaler folded into v5                ║
║ • object pooling folded into v2                                             ║
║ • Investigate appendix for conditional optimizations (spatial index,        ║
║   p5-bypass draw path, OffscreenCanvas, ctx hints, pre-rotated bakes)       ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

The Hard Guardrails, Non-Negotiable Rules, and "What We Explicitly Will Not Do" sections from the original plan apply verbatim. They are not restated here; re-read them before starting any phase.

---

## 0. Grounding Facts (as of 2026-04-21)

```text
stack
├─ p5.js, single main-thread render loop
├─ 6 createGraphics layers: background, entitiesBehind, entities, particles, ui, debug
├─ gameUI.js              4,340 LOC — rendered on canvas ui layer
├─ debugUI.js             2,615 LOC — rendered on canvas debug layer
├─ renderManager.js       2,356 LOC — owns composite + atmosphere cache
├─ gameCore.js            4,915 LOC — update/tick orchestration
├─ lifeSimSystem.js       1,827 LOC
├─ communicationSystem.js 3,637 LOC
├─ mlInferenceSystem.js   2,101 LOC
├─ telemetrySystem.js     1,071 LOC — source of capture metrics
└─ specialEffects.js        720 LOC
```

```text
already-present infrastructure worth knowing before planning
├─ atmosphereCacheLayers (renderManager.js) — partial dirty-layer caching exists
├─ uiLayerPixelDensity config knob — UI layer already separately tunable
├─ uiRedrawState / debugRedrawState — frame-key gated UI redraw already attempted
├─ spriteManager — wings sliced + background-stripped once at load
├─ telemetrySystem emits avgUpdateMs, avgRenderMs, avgParticleRenderMs, pressureTier
├─ saveSystem now prefers IndexedDB for the main save slot, with legacy localStorage read/migration fallback
├─ scripts/run-f2-performance-hardening-audit.js — playwright-based capture runner
└─ qa_logs/session_captures/*/capture.json — real lived-in session data
```

```text
most recent f2-performance capture (2026-04-21, 10s, 12 butterflies, 108 blocks)
├─ avgUpdateMs       6.16
├─ avgRenderMs      11.67
├─ avgParticleRenderMs 0.20
└─ pressureTier     critical      ← already flagged critical at 10s short run
```

Implication: the render path is already the dominant cost, and pressureTier is critical even on a short, small-population run. This validates the original plan's ordering (shell-UI first, not creature sprites first).

---

## Phase Ladder (with v0, review gate, and the v8 split made concrete)

```text
v0   baseline capture protocol          ← run before any work begins
   │
   ▼
review gate (checklist below)
   │
   ▼
v0.5 free-wins pass                     ← cheap, low-risk, no visual impact
   │
   ▼
v1 shell-ui separation
   │
   ▼
v2 memory-growth audit + leak closure
   │
   ▼
v3 high-resolution creature sprite baking
   │
   ▼
v4 simulation cadence split
   │
   ▼
v5 render/composite pass reduction
   │
   ▼
v6 worker offload for non-render systems
   │
   ▼
v7 trails + visual-quality restoration pass
   │
   ▼
v8a runtime-only proof
   |
   v
v8b full-stack proof
   │
   ▼
v9 renderer escalation decision
```

### Phase dependencies (what must happen before what)

```text
v0   ──▶ every phase                baseline is the comparison surface
v0.5 ──▶ v1..v9                     free wins shift the baseline before architecture work
v1   ──▶ v5                         DOM shell means fewer canvas composite consumers
v2   ──▶ v3                         sprite cache is a leak vector; close leaks first
v2   ──▶ v6                         workers can mask leaks; fix visibility first
v4   ──▶ v6                         cadence split defines what's worth moving to a worker
v1+v2+v3+v4+v5 ──▶ v7               restoration only makes sense after wins banked
v1..v8b        ──▶ v9               escalation decision requires soak data
```

---

## Review Gate Checklist (run once, between v0 and v1)

The original plan says "no implementation until review is incorporated" but does not define the gate. Define it as follows. All five must pass before v1 begins:

1. Baseline capture (v0) exists on disk and is linked in this doc.
2. A real lived-in save file is identified and committed to `qa_logs/save_exports/` for reuse across all phases (same save at v0, v2, v4, v8a, and v8b).
3. Feature-flag registry (see below) is wired into `core/config.js` with explicit defaults recorded per flag.
4. Measurement harness (see below) produces a diff report between two captures.
5. Review-gate rubric is satisfied:
   - guardrails re-read
   - SAVE-SCHEMA-REGISTRY signed
   - geometry-freeze decision recorded in ACTIVE-PLAN-REGISTRY
   - SIM-CADENCE-CONTRACT signed
   - social measurement harness exists (`n0.5`)

Review-gate rubric status: _closed locally after the post-s3 full-duration canonical baseline landed in `BASELINE.md`._

---

## Baseline Capture Protocol — v0

**Goal.** Produce one canonical reference capture that every later phase is measured against. Without this, "improved" is unverifiable.

### Prerequisite

```text
geometry freeze commitment required before baseline capture
|- if geometry is frozen for the duration of v0-v3, keep this baseline
`- if geometry is not frozen for the duration of v0-v3, this baseline must be re-taken after spatial s3
```

### Work items

1. Add a `v0-baseline` label path to `scripts/run-f2-performance-hardening-audit.js` (or a thin wrapper `scripts/run-v0-baseline.js` that invokes f2 with a fixed seed + save file).
2. Extend `telemetrySystem.js` capture payload with:
   - `p50FrameMs`, `p95FrameMs`, `p99FrameMs` (not just avg)
   - `compositeCallsPerFrame` (hook `renderManager.compositeLayers()`)
   - `heapUsedMB` samples at 10s / 60s / 10min / 20min / 40min (where `performance.memory` is available; gracefully degrade otherwise)
   - `uiRedrawCount`, `debugRedrawCount` (counters already partially tracked)
3. Run each of the five proof lanes on a real, lived-in save:
   - focused garden, calm watching — 10min
   - shell-heavy reading (Feed/Inspect/Journal tours) — 10min
   - zone travel loop — 10min
   - battle scene — 5min
   - long-session soak — 40min continuous
4. Write results to `qa_logs/session_captures/v0-baseline/` and link them in a new `BASELINE.md` next to this plan.

### Exit criteria

- One capture per lane exists under a v0-baseline directory.
- `BASELINE.md` lists the p50/p95/p99 frame time, avg render ms, avg update ms, peak heap MB, and composite calls/frame per lane.
- All later phase "target" thresholds in this doc are expressed as deltas against those numbers.

### Feature flag

None. v0 is measurement only; no behavior change ships.

### Risk + mitigation

- **Risk:** baseline is taken on a toy save, hiding the real failure shape.
  **Mitigation:** the review gate explicitly requires a lived-in save, committed to `qa_logs/save_exports/`.

---

## Measurement Harness Spec

Every phase produces exactly this artifact:

```text
qa_logs/session_captures/v{N}-{phase-slug}/
├─ capture-calm.json
├─ capture-shell.json
├─ capture-travel.json
├─ capture-battle.json
├─ capture-soak40.json
└─ diff-vs-baseline.md       ← generated by scripts/compare-captures.js (new)
```

`scripts/compare-captures.js` (to be written during v0 as part of harness) reads two capture directories and emits a markdown table:

```text
┌────────────────────┬────────────┬────────────┬─────────┐
│ metric             │ v0         │ v{N}       │ Δ       │
├────────────────────┼────────────┼────────────┼─────────┤
│ avgRenderMs calm   │ 11.67      │ 7.10       │ -39.1%  │
│ p95FrameMs shell   │ 24.80      │ 14.90      │ -39.9%  │
│ heapMB @ 40min     │ 612        │ 430        │ -29.7%  │
│ pressureTier calm  │ critical   │ nominal    │  ✓      │
└────────────────────┴────────────┴────────────┴─────────┘
```

A phase cannot be marked done without a `diff-vs-baseline.md` that satisfies its target thresholds.

---

## Feature Flag Registry

All flags live in `core/config.js` under `performance.flags.*`. Each phase owns one flag or setting seam; phases can be rolled back independently.

```text
performance.flags
├─ pauseWhenHidden              v0.5 default false  noLoop when tab hidden
├─ asyncImageDecode             v0.5 default false  createImageBitmap for asset decode
├─ telemetryRingCap             v0.5 default false  bound event-history ring buffer
├─ textMeasureCache             v0.5 default false  memoize textWidth per (font,size,str)
├─ saveStoreIndexedDbOnly       v0.5 default false  retire localStorage save path
├─ shellUiDom                   v1   default false  route shell panels to DOM overlay
├─ memoryAttributionEnabled     v2   default false  extended heap + retention sampling
├─ entityObjectPools            v2   default false  pool short-lived per-tick allocations
├─ bakedCreatureSprites         v3   default false  serve from appearance-key cache
├─ spriteAtlas                  v3   default false  packed atlas instead of 38 PNGs
├─ simCadenceSplit              v4   default false  staggered cadence for deep sim
├─ compositeDirtyRegions        v5   default false  skip unchanged layer composites
├─ mainRenderScale              v5   default 1.0    DPR-aware main-canvas scale knob
├─ adaptiveQualityScaler        v5   default false  auto-ramp particles/foliage on p95 breach
├─ workerOffload                v6   default false  route ML/telemetry/ecology to worker
├─ trailsQualityReduced         v7   default false  trail preset: reduced available
├─ trailsQualityFull            v7   default false  trail preset: full available
└─ rendererBatchedWebGL         v9   default false  only if v9 decides to escalate
```

Rules:
- A flag ships **off** until the phase's exit criteria are met on the baseline save.
- v0.5 flags flip to default-on only at v0.5 exit; a regression flips them back per the P8 rollback rule.
- A flag flipped **on** by default requires an entry in `docs/INTENT-AND-EXCLUSIONS-LEDGER.md` noting the decision.
- No flag may silently permanently downgrade visual identity (see original plan's non-negotiables).

### P8 Flag-Rollback Rule

If a default-on flag produces a regression against `v0`, flip to
`default-off` within the same release, record the regression in `qa_logs/`,
and do not re-flip until a `diff-vs-baseline.md` shows the cause fixed.

---

## Phase Details (Refined)

Each phase below keeps the original Intent / Must-Preserve sections and adds: **baseline metric → target**, **work items**, **feature flag**, **risk + mitigation**.

---

### v0.5. Free-Wins Pass

**Goal.** Five low-risk, no-visual-impact changes that improve the v0 baseline before any architectural work begins. Each is independently flagged so a regression in one doesn't block the others.

```text
scope
├─ tab-hidden pause / RAF throttle
├─ async image decode (createImageBitmap)
├─ telemetry event-history ring cap
├─ textWidth memoization
└─ retire localStorage save path in favor of IndexedDB
```

**Baseline metric → target** (against v0)
- `heapMB @ 40min` with tab backgrounded for 10min mid-session: **target −40% or better** (tab-hidden pause does the work).
- Cold-start time to interactive: **target −15% or better** (createImageBitmap).
- `avgRenderMs shell` on panels that stay on canvas post-v1: **target −10%** from textWidth cache alone.
- Autosave main-thread stall: **target ≤ 1 ms p95** (IndexedDB async path).

**Work items**

1. **Tab-hidden pause.** In `core/gameCore.js`, register `document.addEventListener('visibilitychange', ...)`. On `document.hidden === true`: call `noLoop()` and record a "pause-for-hidden" telemetry event. On return: `loop()` and reset frame-time tracker so the first resumed frame doesn't poison the p95. Behind `flags.pauseWhenHidden` (default false until `v0.5` exit).
2. **Async image decode.** In `core/spriteManager.js`, replace `loadImage(path)` with a helper that `fetch(path).then(r => r.blob()).then(createImageBitmap)` where supported; fall back to `loadImage` when `createImageBitmap` is absent. Result stored as a p5-compatible image wrapper. Behind `flags.asyncImageDecode` (default false until `v0.5` exit).
3. **Telemetry ring cap.** In `systems/telemetrySystem.js`, cap the event-history array at `performance.telemetry.eventHistoryMax` (new config, default 2000). Drop oldest on overflow. Capture payload gains `eventHistoryDroppedCount` so we can see when we're truncating. Behind `flags.telemetryRingCap` (default false until `v0.5` exit).
4. **Text-measurement cache.** New helper `ui/textMeasureCache.js` exporting `measure(str, font, size)`. Backing `Map` keyed on the tuple. Eviction: simple size cap (default 4096 entries). `ui/gameUI.js` and `ui/debugUI.js` call it instead of raw `textWidth`. Behind `flags.textMeasureCache` (default false until `v0.5` exit).
5. **IndexedDB save migration proof.** The main save path now prefers IndexedDB with legacy `localStorage` read/migration fallback. v0.5 should validate that path on a real lived-in save, trim remaining debug/audit storage pressure, and only then decide whether `flags.saveStoreIndexedDbOnly` should retire the legacy fallback entirely. Do **not** re-implement the save backend from scratch here.

**Feature flags:** see registry. The four `v0.5` flags start default-off and only flip default-on at `v0.5` exit if their regression checks stay clean. The save-store migration defaults off until migration is proven.

**Risk + mitigation**
- **Risk:** tab-hidden pause misses `requestAnimationFrame` edge cases and the game stalls on return.
  **Mitigation:** resume path calls `loop()` explicitly and verifies `frameCount` advances within 2 frames; telemetry records the resume event.
- **Risk:** `createImageBitmap` wrappers don't match the p5.Image API fully, breaking downstream code.
  **Mitigation:** thin adapter that exposes `.width`, `.height`, `.get()`. Any consumer that needs more falls back to `loadImage`.
- **Risk:** text cache returns stale width after font change.
  **Mitigation:** key includes font name + size; any font swap path invalidates the cache.
- **Risk:** save migration loses a player's save.
  **Mitigation:** dual-read for one release (read IDB first, fall back to localStorage); only purge localStorage after an IDB write succeeds.

**Exit criteria**
- All four `v0.5` flags verified against v0 lanes; delta reports land in `qa_logs/session_captures/v0.5-free-wins/diff-vs-baseline.md`.
- Any `v0.5` flag that regresses against baseline remains default-off under the P8 rollback rule.
- Save migration proven on the committed lived-in save + at least one other real save.

---

### v1. Shell-UI Separation

**Original intent preserved.** Move text-heavy static UI out of the main canvas redraw path; keep art scene on canvas; shell chrome in DOM.

```text
scope (ordered by expected shell-cost impact)
1. Feed      — long scrolling list, redrawn every frame even when idle
2. Journal   — text-heavy, rarely interactive
3. Inspect   — medium text + small portrait, currently on canvas ui layer
4. Access    — menu surface, mostly static
5. debug     — developer-only, lowest priority within v1
```

**Baseline metric → target** (against v0 shell-heavy lane)
- `avgRenderMs shell` baseline: TBD at v0 — **target: −30% or better**
- `uiRedrawCount / sec shell` baseline: TBD — **target: redraw only on state change (≤1 Hz when idle on a panel)**

**Work items**
1. Create `ui/dom/` directory. One file per panel: `feedPanel.js`, `journalPanel.js`, `inspectPanel.js`, `accessPanel.js`.
2. Each panel exports `mount(container, state)`, `update(state)`, `unmount()`. State shape documented in a new `ui/dom/README.md`.
3. Add a top-level `<div id="shell-overlay">` in `index.html`, z-indexed above the p5 canvas, pointer-events gated per panel.
4. Behind `flags.shellUiDom`, `gameUI.js` stops drawing Feed/Journal/Inspect/Access text to the canvas `ui` layer and instead dispatches state to the DOM panels via `eventBus`.
5. Keep canvas-side input routing for the garden; DOM panels handle their own events and call back through `eventBus`.
6. Session capture tooling (`telemetrySystem.js`) must still record "panel open/close" events — extend the event emitters, not the capture reader.
7. Accessibility parity: the DOM panels must pass the same keyboard-navigation flow already documented in `PAPILIONEM-PLAYER-GUIDE.md`.

**Feature flag:** `performance.flags.shellUiDom`. Default off until all five panels are migrated and exit criteria pass on the baseline save.

**Risk + mitigation**
- **Risk:** DOM panels diverge visually from canvas style and violate the "visual identity preserved" guardrail.
  **Mitigation:** screenshot parity test — capture each panel open on baseline save before/after flag and visually diff.
- **Risk:** input routing regression — buttons double-fire or swallow clicks destined for the garden.
  **Mitigation:** event-bus contract test in `scripts/run-a5-control-continuity-audit.js` extended to cover DOM panels.
- **Risk:** capture tooling stops recording panel content because it was reading canvas pixels.
  **Mitigation:** capture reads state objects from `gameUI.js`, not canvas — verify before flip.

---

### v2. Memory-Growth Audit + Leak Closure

**Original intent preserved.**

**Baseline metric → target** (against v0 soak-40 lane)
- `heapMB @ 40min` baseline: TBD — **target: ≤ 1.3× `heapMB @ 10min` of the same session** (i.e., growth factor bounded).
- No unbounded array in `communicationSystem.js` dialogue history, `telemetrySystem.js` event history, or `specialEffects.js` residue.

**Work items**
1. Land the extended heap sampling from v0 (it carries forward — this is the phase that *acts* on it).
2. Add a retention attribution pass: a small dev-only panel (behind `flags.memoryAttributionEnabled`) that snapshots `performance.memory` and counts entries in the known suspect collections:
   - `renderManager.worldSectionAssets` and atmosphere caches
   - dialogue / feed / journal history in `communicationSystem.js`
   - telemetry event ring buffer in `telemetrySystem.js`
   - particle / residue pools in `specialEffects.js`
   - capture/export staging buffers
3. For each collection that grows unboundedly across the 40min soak: apply a bounded ring buffer or eviction rule. Do **not** shrink user-visible history (dialogue, feed) silently — if eviction is needed, persist to disk-backed history with a documented cap.
4. Fix leaks identified, one PR per subsystem, each with a before/after capture.
5. **Object pooling for per-tick allocations.** Introduce pools for the hottest short-lived allocation sites — particle records in `systems/specialEffects.js`, per-tick temp vectors in `systems/behaviorSystem.js` / `systems/interactionSystem.js`, and ephemeral arrays in `systems/communicationSystem.js` message formatting. Pools live behind `flags.entityObjectPools` so they can be toggled off if any correctness issue surfaces. Primary goal is to flatten GC pauses during the 40min soak, not raw throughput.

**Feature flag:** `performance.flags.memoryAttributionEnabled` gates the dev panel. `performance.flags.entityObjectPools` gates the pooling rollout. Leak *fixes* (bounded ring buffers, eviction rules) ship unflagged (they're correctness).

**Risk + mitigation**
- **Risk:** eviction drops dialogue or feed rows a player was reading, violating "current shell features" preservation.
  **Mitigation:** any cap ≥ 2× what a lived-in save contains at 40min; verified against the real save before ship.
- **Risk:** baking sprites (v3) masks leak signal if v3 lands first.
  **Mitigation:** dependency enforced — v2 ships before v3.

---

### v3. High-Resolution Creature Sprite Baking

**Original intent preserved.**

**Baseline metric → target**
- `avgRenderMs calm` must not regress vs post-v1+v2 numbers. **Target: ≤ post-v2 calm render ms**, with creature resolution restored to design intent.
- Sprite cache size bounded (see mitigation below).

**Work items**
1. Define the **appearance key** schema. Initial proposal:
   ```
   sex | personalityType | baseType (for hybrids) | wingDonor signatures | variant tint hash
   ```
   Document in `core/spriteManager.js` header comment and in a new `docs/SPRITE-CACHE-CONTRACT.md`.
2. Extend `spriteManager.js` with `getBakedSprite(spec): p5.Graphics`. First call composites body + antenna + four wing pieces into a single offscreen graphic at the source resolution; subsequent calls return cached.
3. Creature entity render paths (`entities/butterfly.js` and related) call `getBakedSprite` instead of compositing pieces every frame. Animation (wing flap, tilt) applied as transforms over the baked sprite, not by recompositing.
4. Cache size bound: LRU with cap from `performance.cache.maxBakedSprites` (new config, default 256). Eviction frees the `p5.Graphics` via `remove()`.
5. Appearance invalidation: any mutation of a creature's appearance key invalidates that key's cache entry.
6. Sex/variant/genetic readability audit — screenshot parity against v0 for each personality × sex.
7. **Sprite atlas + asset pipeline pass.** Add a build step `scripts/pack-sprite-atlases.js` that:
   - packs the 38 wing / body / antenna PNGs into 1–2 atlases and emits a JSON manifest of per-piece UV coords.
   - converts sources to WebP (lossless or high-quality lossy — verify no perceptible diff against the original against the creature readability audit in item 6).
   - performs alpha pre-stripping at build time, so `spriteManager._removeBlackBackground` and its `loadPixels`/`updatePixels` roundtrip can be **deleted from the runtime path**.
   Runtime: `spriteManager.initialize` loads the atlases and the manifest, slices via manifest coords, and feeds the appearance-key cache. Behind `flags.spriteAtlas`. The raw-PNG path stays as fallback until the atlas path is proven on all lanes.

**Feature flag:** `performance.flags.bakedCreatureSprites` for the runtime cache. `performance.flags.spriteAtlas` for the atlas asset source. They compose: atlas-on + cache-on is the target end state.

**Risk + mitigation**
- **Risk:** animation shortcuts make wings look stiff, violating "expressive creature readability".
  **Mitigation:** baked sprite retains wing-piece sub-regions as animatable; transform budget is per-piece, not per-whole-sprite. Screenshot a flapping comparison.
- **Risk:** cache becomes a leak (retained `p5.Graphics`).
  **Mitigation:** v2 infrastructure detects it; LRU eviction enforced.

---

### v4. Simulation Cadence Split

**Original intent preserved.**

**Baseline metric → target**
- `avgUpdateMs calm` baseline 6.16 — **target: ≤ 3.0 ms** with no core-sim family disabled.
- No visible behavior regression on scripted scenarios (see work item 5).

**Work items**
1. Document current cadence in `docs/SIM-CADENCE-CONTRACT.md` (new). One row per system: current tick interval, proposed interval, rationale.
2. Gated on social `n1` family lock. Cadence values must be proposed in `docs/SIM-CADENCE-CONTRACT.md` with `social-n1` as a co-owner.
3. Proposed staggered cadences (starting point; tune from captures):
   - flight / movement / battle motion: every frame
   - life-sim deep evaluation: every 6 frames, phase-staggered per butterfly
   - ecology refresh: every 30 frames
   - ML scoring: every 12 frames, phase-staggered
   - dialogue/feed shaping: event-driven
4. Implement via a scheduler in `core/gameCore.js` that takes `(systemId, interval, phase)` and owns the divmod.
5. Time-budget guard: if a staggered tick exceeds its budget, the scheduler logs to telemetry (do not skip; visibility first).
6. Scripted behavior parity: a new `scripts/run-sim-cadence-parity.js` runs two seeds for N ticks with flag off and on, compares per-tick observable state (positions quantized to grid, relationship edge set, ecology summary). Bounded divergence allowed; unbounded drift fails the phase.

**Feature flag:** `performance.flags.simCadenceSplit`.

**Risk + mitigation**
- **Risk:** emergent behavior dulls when sim ticks less often, violating "emergent behavior integrity".
  **Mitigation:** parity script + a 1-hour observation run logged to `qa_logs/` with the flag on.
- **Risk:** battle fairness shifts because battle still reads sim state.
  **Mitigation:** battle system continues to read on its own cadence; cadence split never applies *inside* `battleSystem.js`.

---

### v5. Render / Composite Pass Reduction

**Original intent preserved.** This phase is partially prefigured by existing `atmosphereCacheLayers` — expand that pattern, do not re-invent it.

**Baseline metric → target**
- `compositeCallsPerFrame calm` baseline: TBD — **target: −50% or better**.
- `avgRenderMs calm` post-v5: **target: ≤ 5.0 ms** (combined with wins from v1).

**Work items**
1. Audit pass on `renderManager.compositeLayers()` (line 2146) and `drawEntitiesLayer()` (line 735). Classify each full-canvas operation as: *always-needed*, *only-on-state-change*, or *skippable-when-flag-on*.
2. Extend the existing atmosphere cache pattern to: background, entitiesBehind, ui (post-v1 DOM shift should empty this most frames), debug.
3. Dirty signaling — each owning system marks its layer dirty on state change; the composite step skips clean layers.
4. Battle scene is explicitly excluded from aggressive dirty gating in v5 (battle runs short, readability matters more than composite savings); revisit in v9.
5. Before/after screenshot sweep across all five proof lanes to catch "scene still looks like the intended game" regressions.
6. **Main-canvas render-scale knob.** Add `performance.flags.mainRenderScale` (default 1.0, player-settable 0.75–1.25). On a 2× or 3× DPR display a full-canvas composite pays 4×/9× pixel bandwidth; a render-scale <1.0 is the single biggest lever on HiDPI laptops. UI layer stays at full DPR via the existing `uiLayerPixelDensity` knob, so text readability is preserved. Expose as an accessibility setting so players opt in.
7. **Adaptive quality scaler.** Behind `flags.adaptiveQualityScaler`: a controller that watches rolling `p95FrameMs`. If it exceeds the budget for N consecutive seconds, ramp down in tiers: particle cap → 0.5×, foliage wave → static frame, background re-render cadence → halved. Ramps back automatically when frame time recovers for M consecutive seconds. Every ramp emits a telemetry event so the player-facing doc can explain it honestly. This is the "temporary visual fallback explicitly marked temporary" guardrail from the original plan, implemented as a measured controller rather than a silent downgrade.

8. **Negotiation rule.** `adaptiveQualityScaler` never reduces quality below what `mainRenderScale` establishes as the player-expressed floor. The player setting is a hard lower bound on particles, foliage, and background cadence.

**Feature flag:** `performance.flags.compositeDirtyRegions` for dirty-gating. `performance.flags.mainRenderScale` as a numeric knob. `performance.flags.adaptiveQualityScaler` for the auto-ramp.

**Risk + mitigation**
- **Risk:** dirty-gating misses a mutation and leaves stale pixels — visible artifact.
  **Mitigation:** a dev-mode overlay (debug flag) tints each layer by dirty-state so visual bugs are caught in QA.
- **Risk:** covered/behind-wall spatial staging breaks because entitiesBehind skips composite on a frame it shouldn't.
  **Mitigation:** entitiesBehind dirty rule errs on the side of always-dirty when any creature crosses a zone boundary.

---

### v6. Worker Offload For Non-Render Systems

**Original intent preserved.**

**Baseline metric → target**
- `p95FrameMs calm` post-v5 baseline: TBD — **target: −25% after v6**.
- Save/load roundtrip correctness: **100% match against pre-v6 saves** (no new state lives only in a worker).

**Work items**
1. Worker bootstrap module `workers/offloadHost.js` — owns a pool of one worker (start simple).
2. Protocol: structured-clone messages with `{kind, seq, payload}`. First kinds: `ml.infer`, `telemetry.aggregate`, `ecology.summarize`, `dialogue.format`.
3. `mlInferenceSystem.js` splits into `mlInferenceCore.js` (pure) + `mlInferenceSystem.js` (orchestrator). Core is what the worker loads.
4. Fallback: if `Worker` is unavailable or a message times out (>250 ms budget), orchestrator runs core inline. No silent data loss.
5. Determinism: any RNG used inside worker paths must accept a seed from the main thread; no worker-local `Math.random` for gameplay-affecting code.

**Feature flag:** `performance.flags.workerOffload`.

**Risk + mitigation**
- **Risk:** save/load drift because worker state isn't serialized.
  **Mitigation:** worker is stateless — only the orchestrator holds state; save/load exercises unchanged code paths. Roundtrip test required.
- **Risk:** ownership confusion where two subsystems both touch a value.
  **Mitigation:** only four `kind`s land in v6; expansion requires a follow-up phase.

---

### v7. Trails + Visual-Quality Restoration Pass

**Original intent preserved.**

**Baseline metric → target**
- With `trailsQualityReduced` on: `avgRenderMs calm` ≤ 1.5× the off-baseline.
- With `trailsQualityFull` on: `avgRenderMs calm` ≤ 2.5× the off-baseline (full is allowed to be heaviest, but must remain playable).
- With both off (default): parity with post-v5 numbers.

**Work items**
1. Add `settings.trails: 'off' | 'reduced' | 'full'` to save file, default `off`.
2. Route the two non-off modes behind the paired flags `trailsQualityReduced` and `trailsQualityFull`.
3. Update the accessibility/settings UI (DOM, per v1) with the three-state control, copy drawn from the original plan's wording.
4. Player-facing doc update in `docs/PAPILIONEM-PLAYER-GUIDE.md` — short section describing the three settings.
5. QA: capture the calm lane under each setting. Numbers recorded in `BASELINE.md` as the v7 row.

**Feature flag:** two paired flags; see registry. `off` needs no flag.

**Risk + mitigation**
- **Risk:** `reduced` or `full` silently becomes the default.
  **Mitigation:** save file schema test: new saves must serialize `trails: 'off'` unless the player explicitly changed it.

---

### v8a. Runtime-Only Proof

**Original intent preserved.**

**Baseline metric → target**
- All five proof lanes pass their per-phase targets *on the committed lived-in save* with spatial and social state held frozen.
- Zero `freezeSuspects`, zero `errors`, ≤ 3 `warnings` across the 40min soak capture.

**Work items**
1. Re-run the full harness (five lanes) with all v1–v7 flags on, against the committed lived-in save.
2. Produce a single consolidated `qa_logs/session_captures/v8a-runtime-proof/REPORT.md` summarizing against v0.
3. Update `docs/ACTIVE-PUBLIC-SHARE-BOARD.md` to reflect that the runtime blocker is cleared (or, if it isn't, list which lane failed — triggers v9).
4. Hold a no-flag run on the same save to confirm default behavior is still correct (regression insurance).

**Feature flag:** none. This phase is proof, not behavior.

**Risk + mitigation**
- **Risk:** passing on the committed save but failing on other lived-in saves.
  **Mitigation:** soak on at least one additional real save drawn from the save-export archive.

---

### v8b. Full-Stack Proof

**Original intent preserved.**

**Baseline metric → target**
- Runtime gains from `v1` through `v7` still hold after `s7` and `n8` ship on the migrated lived-in save.
- Zero `freezeSuspects`, zero `errors`, ≤ 3 `warnings` across the 40min soak capture on the migrated save.

**Work items**
1. Re-run the full harness on the migrated lived-in save after `s7` and `n8` land.
2. Produce `qa_logs/session_captures/v8b-full-stack-proof/REPORT.md` against both v0 and v8a.
3. Confirm the migrated save keeps identity, memories, relationships, and lineage intact while runtime targets still hold.

**Feature flag:** none. This phase is proof, not behavior.

**Risk + mitigation**
- **Risk:** full-stack migration hides whether a regression is runtime, spatial, or social.
  **Mitigation:** `v8a` must close first, so `v8b` is judged against both the original baseline and the runtime-only proof.

---

### v9. Renderer Escalation Decision

**Original intent preserved.**

**Decision criteria (make explicit what "not enough" means)**
- If after v8 any of these hold, open a separate batched-WebGL renderer plan:
  - `avgRenderMs calm` > 6.0 ms on the lived-in save
  - `p95FrameMs battle` > 33 ms
  - any freezeSuspect recorded in the 40min soak
- Otherwise record the keep decision in `docs/INTENT-AND-EXCLUSIONS-LEDGER.md` with the numbers that justified it.

**Work items**
1. Write `docs/RENDERER-ESCALATION-DECISION.md` containing the decision, numbers, and (if keeping) the re-evaluation trigger condition.
2. If escalating, open a new plan document — do not append renderer-rewrite work items to this plan.

**Feature flag:** `performance.flags.rendererBatchedWebGL` exists in the registry only as a placeholder; phase v9 decides whether it ever gets wired up.

---

## Proof Requirements (unchanged)

The original plan's five proof lanes are authoritative. This document adds: **every phase produces one capture per lane, one diff-vs-baseline report, and signs off only when the diff passes the target threshold.** No prose-only sign-off.

---

## Investigate Appendix (promote to a phase only if v0 captures justify it)

These are real optimizations, but their ROI depends on what v0 actually shows. Do not schedule them up front. If v0 or post-v5 captures indicate the specific failure mode below, promote the relevant item into the phase noted.

```text
trigger condition                              → candidate                         → promote into
──────────────────────────────────────────────────────────────────────────────────────────────────
avgUpdateMs rises super-linearly with pop      spatial index (grid / quadtree)     v4 addendum
entity draw dominates post-v3 + v5             drop p5 wrappers in hot draw path   v5 addendum
browser supports OffscreenCanvas + worker wins OffscreenCanvas for atmosphere/bg   v6 addendum
presentation stalls visible in capture         canvas context hints (desync/alpha) v5 addendum
rotate/scale cost still visible on entities    pre-rotated bake variants in LRU    v3 addendum
```

### C1. Spatial index for entity queries
Proximity queries in `systems/interactionSystem.js`, `systems/behaviorSystem.js`, `systems/communicationSystem.js` are likely O(n²). Fine at 12 creatures, expensive at 60+. Uniform grid first (simpler), quadtree if non-uniform density becomes a problem.

### C2. Drop p5 wrappers in hottest entity draw path
`image()/push/pop/translate/rotate` each carry measurable per-call overhead. Bypass to raw 2D context in the one file that does per-entity draws (likely `entities/butterfly.js`). Typically reclaims 20–40% of entity render cost. Scope: one file, one code path, behind a flag.

### C3. OffscreenCanvas for atmosphere/background
Natural pair with v6. OffscreenCanvas is worker-transferable, so static caches can be composed off the main thread on supported browsers. Gate on feature detection; fall back to current path.

### C4. Canvas context hints
`createGraphics` wraps `getContext('2d')`. Passing `{ desynchronized: true, alpha: <needed> }` can reduce presentation stalls. Low code risk, browser-dependent benefit — worth a quick probe if v5 captures show presentation-bound frames.

### C5. Pre-rotated/pre-scaled bake variants
Inside the v3 sprite cache, bake a small N of pre-rotated frames to avoid per-frame `rotate()` transform cost. Memory tradeoff stays inside the LRU cap.

---

## Open Questions (to resolve during the review gate)

1. Which concrete lived-in save is the baseline? It should be a fresh export from the author's longest-running garden, not the `h5` fixture world.
2. Is there appetite to make v7's `reduced` the default *after* v8 proves headroom, or do we keep `off` as default forever? Original plan says keep `off` default.
3. Is Playwright the right driver for the 40min soak, or should soak be run manually with capture enabled? Playwright is fine for short lanes; soak likely wants a manual run with `npm run playtest` + capture button.
4. Do we have a named reviewer for the review-gate sign-off, or does the author self-review?

---

## Recommended Next Step

```text
now
├─ freeze or supersede `ACTIVE-RUNTIME-HARDENING-BOARD.md` so there is one live implementation sequence
├─ answer the four open questions above
├─ export and commit the real baseline save file to `qa_logs/save_exports/`
├─ execute v0 (baseline capture protocol)
├─ execute v0.5 (free-wins pass) and re-run the baseline harness
└─ then — and only then — begin v1
```
