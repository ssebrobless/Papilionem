# Papilionem Active Visual-First Runtime Board

## Purpose

This board makes the reviewed visual-first optimization plan the active runtime
sequence.

It replaces the older `h1`-`h6` runtime-hardening ladder as the current source
of truth for smoothness work.

```text
╔══════════════════════════════════════════════════════════════════════════════╗
║ Visual-First Runtime Optimization                                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ target               │ smooth long-running play without sacrificing look    ║
║ preserve             │ core simulation, shell clarity, save continuity      ║
║ restore live         │ sharp creatures, trails off/reduced/full             ║
║ active sequence      │ v0 -> review gate -> v0.5 -> v1 -> ... -> v8a -> v8b║
║ current honest block │ shared save-schema is signed; runtime-only proof next║
╚══════════════════════════════════════════════════════════════════════════════╝
```

```text
runtime snapshot
├─ target          -> smooth long-running play without sacrificing look
├─ preserve        -> core simulation, shell clarity, save continuity
├─ restore live    -> sharp creatures, trails off/reduced/full
├─ active sequence -> v0 -> review gate -> v0.5 -> v1 -> ... -> v8a -> v8b
└─ current status  -> live through v8a; next runtime gate is v8b after c9
```

Read this together with:

- [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN.md)
- [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md)
- [BASELINE.md](./BASELINE.md)
- [V0-5-FREE-WINS-AUDIT.md](./V0-5-FREE-WINS-AUDIT.md)
- [ACTIVE-PUBLIC-SHARE-BOARD.md](./ACTIVE-PUBLIC-SHARE-BOARD.md)
- [PUBLIC-SHARE-READINESS-ROADMAP.md](./PUBLIC-SHARE-READINESS-ROADMAP.md)
- [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)
- [V2-MEMORY-GROWTH-AUDIT.md](./V2-MEMORY-GROWTH-AUDIT.md)
- [SPRITE-CACHE-CONTRACT.md](./SPRITE-CACHE-CONTRACT.md)
- [V3-SPRITE-BAKING-AUDIT.md](./V3-SPRITE-BAKING-AUDIT.md)
- [V4-SIM-CADENCE-AUDIT.md](./V4-SIM-CADENCE-AUDIT.md)
- [V5-COMPOSITE-REDUCTION-AUDIT.md](./V5-COMPOSITE-REDUCTION-AUDIT.md)
- [V6-WORKER-OFFLOAD-AUDIT.md](./V6-WORKER-OFFLOAD-AUDIT.md)
- [V7-VISUAL-RESTORATION-AUDIT.md](./V7-VISUAL-RESTORATION-AUDIT.md)
- [COMPOSED-BENCHMARK-HARNESS-WORKFLOW.md](./COMPOSED-BENCHMARK-HARNESS-WORKFLOW.md)
- [COMPOSED-BENCHMARK-BASELINE-2026-04-27.md](./COMPOSED-BENCHMARK-BASELINE-2026-04-27.md)
- [CURRENT-SPATIAL-TRUTH.md](./CURRENT-SPATIAL-TRUTH.md)

## Current Honest Block

```text
runtime frozen live
|- v4 retained 18/36/30 cadence slice
|- v5 composite/present/HUD reduction stack
|- v6 worker-offload groundwork (default-off)
|- v7 visual restoration stack
|- spatial s8 board/unit/corridor freeze
`- social n8 save continuity freeze

current blocker
`- no local runtime blocker is left inside `v8a`; runtime-only proof is now frozen honestly, and the next gate is `v8b` after outside-session triage

next proof
|- c8 runtime-only proof -> frozen live on the committed lived-in save
`- v8b full-stack proof  -> next runtime gate after `c9` outside-session triage closes

post-v8a runtime watch
|- composed benchmark harness is now live
|- current branch tip must be judged against `single-zone-122`, not only synthetic `butterflies-N`
|- retained local recovery stack now brings the old clustered `single-zone-122` from `127.77 / 45.91 / 172.5` to `52.18 / 43.53 / 94.9`
|- the refreshed scattered `single-zone-122` packet on `56c9a4f` first landed at `52.43 / 50.20 / 102.8`
|- post-structure-query cut, scattered `single-zone-122` now lands at `43.77 / 44.98 / 89.4`
|- dense-flower direct-present gate now repairs `flower-feed-storm` to `32.54 / 63.95 / 98.2`
|- communication-maintenance + decision-trace cache now bring `single-zone-200` to `86.37 / 55.22 / 141.5`
|- the same retained slice moves scattered `single-zone-122` to `36.62 / 43.15 / 81.1`
|- structure-system frame-local runtime caches then move `single-zone-200` to `81.39 / 55.82 / 135.3`
|- the same retained slice keeps `single-zone-122` at `39.27 / 43.54 / 81.3`
|- pressure-gated crowd/cursor checks + critical communication cadence now move `single-zone-200` to `80.87 / 54.92 / 134.0`
|- the same retained slice moves `single-zone-122` to `34.71 / 41.86 / 74.7`
|- flower/feed and block/carry watch lanes both improve under the retained slice
|- carry/build guardrails still hold -> `a4` pass / `b4` pass
|- social/movement guardrails still hold -> `r6` pass / `f5-f6` pass / `r1` pass
`- runtime diagnosis stays active because the blocker has narrowed again: `single-zone-200` is still the remaining composed stress lane, while `single-zone-122`, `flower-feed-storm`, and `block-carry-active` are all local holds
```

## Status Key

```text
live
|- phase landed and current docs/proof agree

active
|- current implementation phase

queued
|- sequenced next, not yet active

gated
`- cannot close honestly until required evidence exists
```

## Non-Negotiables

```text
always preserve
|- no optimization phase may remove a core simulation system
|- no optimization phase may solve smoothness by permanently degrading visual identity
|- high-resolution butterflies, caterpillars, and cocoons remain part of the target state
|- trail options remain part of the target state: off by default, reduced, full
|- long-running saves must stay valid; no progression wipe is an optimization tool
|- benchmark truth must come from a real lived-in save, not only a fixture world
`- public-share handoff stays blocked until the lived-in save feels materially smoother
```

## Current Shape

```text
2026-04-25 runtime shape
|- v1 shell path            -> live and default-on through `performance.flags.shellUiDom`
|- v3 sharp-creature baking -> live and default-on through `performance.flags.bakedCreatureSprites`
|  `- spriteAtlas           -> still default-off
|- v4 live slice            -> retained 18/36/30 cadence seams are now promoted into the live default runtime shape
|- v5 live seams            -> frozen live; clean-shell dirty-region composites, native composite present, DOM guide, baked flower heads, live blocks composite reuse, and idle clean-shell HUD redraw now define the retained stack
|- v6 worker groundwork     -> live as improved default-off groundwork through `performance.flags.workerOffload`
`- v7 visual restoration    -> live; sharp creatures are back on by default, trails remain off by default, and reduced/full are both available again
```

```text
live proof held
|- h5          -> green off / reduced / full on the lived-in save
|- r4          -> green on the heavy full-trails path
|- a4          -> green on the frozen spatial/runtime stack
|- v3 parity   -> green on the restored sharp-creature path
`- capture lane -> exported captures now separate warning-level cadence-budget-overrun telemetry from hard runtime errors
```

```text
runtime path
|- freeze / quota crash lane             -> repaired
|- black-screen collapse lane            -> repaired
|- host-local shell/battle readability   -> repaired
|- imported-save smoothness fixture lane -> repaired
`- visual-first optimization
   |- baseline harness                   -> live
   |- review gate                        -> live
   |- v0.5 free-wins                     -> live
   `- v1+ implementation phases          -> active
```

## Phase Ladder

| Phase | Status | Goal | Primary owners | Honest gate |
| --- | --- | --- | --- | --- |
| `v0 baseline capture protocol` | `live` | build the canonical lived-in-save measurement harness, baseline artifacts, and compare tooling before changing behavior | `systems/telemetrySystem.js`, `core/renderManager.js`, `server.js`, `scripts/run-v0-baseline.js`, `scripts/compare-captures.js`, `docs/BASELINE.md`, `qa_logs/` | full-duration post-`s3` canonical run is on disk and frozen as the comparison surface |
| `review gate` | `live` | freeze the lived-in baseline, review-gate rubric sign-off, and flag registry before feature work | `docs/VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md`, `core/config.js`, `docs/BASELINE.md`, `docs/ACTIVE-PLAN-REGISTRY.md` | canonical post-`s3` baseline, shared contracts, flag registry, and `v0.5` closure all agree |
| `v0.5 free-wins pass` | `live` | land low-risk wins with no visual sacrifice before structural changes | `core/config.js`, `sketch.js`, `systems/saveSystem.js`, `systems/telemetrySystem.js`, `ui/`, `docs/V0-5-FREE-WINS-AUDIT.md` | seams are proven, all regressors remain default-off, and second-save migration proof is on disk |
| `v1 shell-ui separation` | `live` | move shell-heavy panels off the canvas path while preserving button-first shell behavior | `ui/gameUI.js`, `ui/debugUI.js`, `core/renderManager.js`, `index.html`, `styles/`, `docs/V1-SHELL-UI-SEPARATION-AUDIT.md` | shell lanes are materially cheaper than the post-`s3` canonical `v0` while readability improves or holds on the committed lived-in save |
| `v2 memory-growth audit + leak closure` | `live` | make long sessions stable before creature-visual restoration | `systems/telemetrySystem.js`, `core/gameCore.js`, `core/renderManager.js`, `systems/*`, `docs/V2-MEMORY-GROWTH-AUDIT.md` | 40-minute heap/profile deltas improve and freeze symptoms stay absent |
| `v3 high-resolution creature sprite baking` | `live` | restore sharp butterflies/caterpillars/cocoons via caching/atlas work instead of per-frame cost | `core/spriteManager.js`, `entities/`, `assets/`, `core/renderManager.js` | creature clarity improves while staying within the post-`v2` budget |
| `v4 simulation cadence split` | `live` | keep visual motion smooth while deep life-sim/ML/ecology cadence is staggered safely | `core/gameCore.js`, `systems/lifeSimSystem.js`, `systems/communicationSystem.js`, `systems/mlInferenceSystem.js`, `systems/zoneSystem.js` | retained 18/36/30 scheduler-owned slice is banked and the remaining blocker has moved downstream into render/composite pressure |
| `v5 render/composite pass reduction` | `live` | cut the number and cost of whole-canvas composites without flattening the look | `core/renderManager.js`, `core/config.js`, `docs/V5-COMPOSITE-REDUCTION-AUDIT.md` | composite-heavy lanes are materially cheaper than `v0`, `h5` is green, and readability/battle/spatial guardrails hold |
| `v6 worker offload for non-render systems` | `live` | move selected non-render work off the main thread once cadence boundaries are stable | `systems/mlInferenceSystem.js`, `systems/telemetrySystem.js`, `workers/`, `core/gameCore.js`, `docs/V6-WORKER-OFFLOAD-AUDIT.md` | improved default-off groundwork is landed honestly, even if it is not promoted into the live runtime shape |
| `v7 trails + visual-quality restoration pass` | `live` | reintroduce the desired high-fidelity visual state with proof that it still runs acceptably | `core/config.js`, `core/renderManager.js`, `entities/`, `ui/gameUI.js`, `docs/V7-VISUAL-RESTORATION-AUDIT.md` | high-res creatures and trail presets hold on the lived-in save without reopening the lag/freeze problem |
| `v8a runtime-only proof` | `live` | prove the optimized runtime stack on the real long-running save while spatial and social state stay frozen | `docs/BASELINE.md`, `qa_logs/`, `PLAYTEST.md`, `PLAYTEST-FEEDBACK.md`, `docs/EXTERNAL-PLAYTEST-MATRIX.md`, `qa_logs/session_captures/v8a-runtime-proof/REPORT.md` | lived-in save soak is honest and green before cross-track migration noise is introduced |
| `v8b full-stack proof` | `queued` | prove the optimized build again after `s7` and `n8` land on the migrated long-running save and outside-share path | `docs/BASELINE.md`, `qa_logs/`, `PLAYTEST.md`, `PLAYTEST-FEEDBACK.md`, `docs/EXTERNAL-PLAYTEST-MATRIX.md`, `docs/SAVE-SCHEMA-REGISTRY.md` | full-stack migrated-save proof is honest and green after runtime-only proof already holds |
| `v9 renderer escalation decision` | `queued` | only if needed, decide whether a deeper renderer migration is justified | `docs/`, `core/renderManager.js`, future renderer spikes if opened | decision is evidence-based and explicitly documented |

## Exact Order

```text
v0
  |
  v
review gate
  |
  v
v0.5
  |
  v
v1 -> v2 -> v3 -> v4 -> v5 -> v6 -> v7 -> v8a -> v8b -> v9
```

## Current Focus

```text
current focus
`- runtime track is live through `v8a`
   |- v8a report       -> qa_logs/session_captures/v8a-runtime-proof/REPORT.md
   |- inherited truth  -> shellUiDom is live, `bakedCreatureSprites` is live, 18/36/30 cadence is live, the retained v5 composite stack is live, and trails ship off by default with reduced/full available
   |- current evidence -> shipped-default `h5` is green, soak40 is green at 0 warnings / 0 errors / 0 freezeSuspects, `r4` is green, `a4` is green, and the full five-lane pack is on disk
   |- carry-forward    -> the short battle lane still logs 4 freeze suspects inside the five-lane pack, so keep that lane watched in `v8b`
   |- composed reality lane -> communication/trace-cache follow-up now has scattered `single-zone-122` at `36.62ms` avg update / `43.15ms` avg render / `81.1ms` p50
   |- composed carry lane   -> repaired locally to `30.47ms` avg update / `55.1ms` p50 / `73.1ms` p95 and still passes `b4`
   |- composed flower lane  -> repaired locally to `29.66ms` avg update / `61.31ms` avg render / `88.7ms` p50 and remains a watch lane only
   |- composed blocker      -> `single-zone-200` is now the remaining stress lane at `80.87ms` avg update / `54.92ms` avg render / `134.0ms` p50
   |- social guardrails     -> `r6` pass / `f5-f6` pass after the communication maintenance cut
   |- movement guardrail    -> `r1` pass after the cursor-risk lookup cut
   |- spatial/build guardrails -> `a4` pass / `b4` pass after the structure-runtime-cache cut
   `- next runtime gate -> `v8b` full-stack proof after `c9` outside-session triage closes, with composed stress-lane remediation still pending locally
```

## Latest V4 Note

```text
retained 18/36/30 v4 slice
|- owner seams     -> lifeSimSystem deep butterfly evaluation + mlInferenceSystem garden trace refresh + zoneSystem ecology refresh
|- scheduler owner -> gameCore currentFrame/cadence hook + budget-overrun hook
|- parity          -> pass, including life-sim stale max 22, ML stale max 46, ecology stale max 29
|- calm update     -> 31.56 -> 8.89ms
|- shell update    -> 28.13 -> 6.97ms
|- battle update   -> 45.96 -> 26.25ms
|- soak update     -> 28.59 -> 8.78ms
|- heap            -> 159.26 -> 159.26MB
`- honest read     -> v4 is now banked as the retained cadence slice; capture export treats cadence-budget-overrun as warning-only telemetry, and the remaining runtime work moved downstream into `v6` / `v7`
```

## Latest V5 Note

```text
current composite-reduction stack
|- owner seam 1   -> renderManager cropped entity + behind-cover composites on clean-shell lanes only
|- owner seam 2   -> gameUI first-session guide moved off the canvas path into the DOM shell
|- owner seam 3   -> spriteManager / flower mature-head bake on a bounded `flower-head` cache family
|- owner seam 4   -> clean-shell idle HUD redraw discipline only redraws calm shell HUD at full cadence when the player is actively interacting
|- inherited path -> shellUiDom default-on + retained 18/36/30 cadence slice
|- spatial proof  -> `a4` is green on the stacked runtime
|- h5             -> fully green on the lived-in save at calm 6.96 / 13.88 and shell-heavy 11.51 / 13.74
|- flag state     -> compositeDirtyRegions / compositeNativeDraw / compositeBlocksLayer are live defaults on clean-shell lanes; bakedFlowerHeads is default-on; directPresentFlowers remains retained default-off
|- rolled-back    -> raw butterfly canvas, direct entity present, segmented entity composite, region-layer follow-up, split-scenery layer, grounded-block backdrop, edge-outlier peel, wing-local bake, hybrid threshold, clip-present, and no-smooth-present all remain out
`- honest read    -> `v5` is frozen live; the remaining runtime work moved downstream into `v6` worker-offload decisions and `v8a` proof
```

## Latest V6 Note

```text
worker-offload state
|- worker scope     -> stateless ML policy scoring only
|- retained code    -> worker now returns prebuilt model traces and can defer unchanged garden cadence refreshes until worker results land
|- same-code h5     -> control and candidate both pass on the lived-in save
|- candidate read   -> calm 6.56 / 13.51 -> 6.70 / 13.53 | shell 10.81 / 13.26 -> 10.34 / 12.98 | p95 30.90 -> 30.80
|- heap             -> 168.80 -> 159.26 MB
|- trace churn      -> avgRefreshedTraceCount 3.31 -> 2.86
|- flag state       -> workerOffload stays default-off
`- honest read      -> groundwork landed and the deferred trace cut is the best worker seam so far; keep it as improved default-off scaffolding, not as live runtime truth
```

## Latest V7 Note

```text
visual restoration proof
|- sharp creatures -> live by default through `bakedCreatureSprites`
|- trail options   -> off / reduced / full are all live again
|- shipped default -> trails stay off by default
|- h5              -> pass on off / reduced / full
|- r4              -> pass on the heavy full-trails path
|- v3 parity       -> pass on the restored sharp-creature path
|- r5 note         -> control and candidate both failed the same guard-only fixture, so `r5` was not used as the `v7` differentiator
`- honest read     -> `v7` is frozen live; `c7` is signed, `v8a` is now frozen live too, and the next runtime gate is `v8b` after `c9`
```

## Latest V8a Note

```text
v8a runtime-only closeout
|- full pack -> qa_logs/session_captures/v8a-runtime-proof/2026-04-26T02-19-35-305Z
|- diff      -> qa_logs/session_captures/v8a-runtime-proof/diff-vs-v0-full-baseline.md
|- calm      -> render 24.58 -> 12.14 | update 24.17 -> 9.20
|- shell     -> render 32.08 -> 12.55 | update 25.73 -> 7.01
|- travel    -> render 35.08 -> 13.38 | update 25.54 -> 12.82
|- battle    -> render 43.52 -> 22.70 | update 36.98 -> 16.98
|- soak40    -> render 27.56 -> 13.10 | update 26.34 -> 6.94
|- pack totals -> warnings 0 | errors 0 | freezeSuspects 4 | telemetryWarnings 6914
|- soak gate -> warnings 0 | errors 0 | freezeSuspects 0
|- no-flag hold -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-26T01-37-28-769Z/report.json -> pass
`- honest read -> `v8a` is now frozen honestly; the runtime-only blocker is cleared locally, and the next runtime gate is `v8b`
```

## Latest Composed Harness Note

```text
2026-04-27 composed runtime reality check
|- workflow owner -> COMPOSED-BENCHMARK-HARNESS-WORKFLOW.md
|- official packet -> COMPOSED-BENCHMARK-BASELINE-2026-04-27.md
|- reality baseline -> single-zone-122
|- stress baseline  -> single-zone-200
|- targeted lanes   -> block-carry-active / flower-feed-storm
|- realistic hotspot 1 -> butterfly crowd / flower-targeting update path
|- realistic hotspot 2 -> flowers-direct composite / butterfly-present render path
`- honest read -> synthetic `butterflies-N` sweeps remain useful, but they are no longer the primary runtime truth for real-play cost
```

## Latest Single-Zone-200 Note

```text
single-zone-200 retained local stack
|- communication maintenance cadence under pressure
|- per-frame butterfly decision-trace / policy-choice cache
|- structureSystem frame-local collision-query cache
|- structureSystem frame-local spatial-context cache
|- pressure-gated normal crowd-retarget proximity checks
|- lazy cursor risk-profile lookup
`- cached communication maintenance phase per entity / interval

retained proof
|- single-zone-200 -> `96.94 / 56.00 / 153.1` -> `86.37 / 55.22 / 141.5` -> `81.39 / 55.82 / 135.3` -> `80.87 / 54.92 / 134.0`
|- single-zone-122 -> now holds at `34.71 / 41.86 / 74.7`
|- flower lane     -> holds at `29.66 / 61.31 / 88.7`
|- carry lane      -> holds at `30.47 / 25.78 / 55.1 / 73.1`
|- social guards   -> `r6` pass / `f5-f6` pass
|- movement guard  -> `r1` pass
`- spatial/build guards -> `a4` pass / `b4` pass

honest read
|- the remaining local blocker is no longer broad structure churn
|- the active stress lane is now smaller and more specific
|  |- composite / drawImage tail
|  |- residual butterfly-update pressure
|  `- only remaining structure-query misses that escaped the frame-local caches
`- `single-zone-122` is no longer an active blocker unless we want extra margin beyond the old note
```

## Latest Harness Accounting Note

```text
composed benchmark telemetry correction
|- `render.composite.totalCompositeMs` now includes direct-flower present cost
|- top-contributor attribution now filters to timing keys ending in `Ms`
|- proof artifact -> qa_logs/bench/flower_feed_composite_accounting_sanity/flower-feed-storm-2026-04-28T18-02-05-444Z.json
|- proved shape   -> totalComposite 69.22ms / flowersDirectPresent 64.88ms / timing-only top render contributors
`- caution        -> local absolute timings from this sanity run were noisy and are not promoted over the retained runtime proof above
```

## Latest V3 Note

```text
sharp-creature state
|- parity        -> pass with spriteAtlas + bakedCreatureSprites enabled
|- live flag     -> bakedCreatureSprites is now live by default through `v7`
|- atlas flag    -> spriteAtlas stays default-off
|- blocked path  -> higher-fidelity baked body + antenna + caterpillar helpers still do not beat the retained live slice
`- next push     -> only reopen atlas/body/antenna/caterpillar work on a source path that beats the current live slice in smoke, not just parity
```
