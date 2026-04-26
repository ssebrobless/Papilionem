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
   `- next runtime gate -> `v8b` full-stack proof after `c9` outside-session triage closes
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

## Latest V3 Note

```text
sharp-creature state
|- parity        -> pass with spriteAtlas + bakedCreatureSprites enabled
|- live flag     -> bakedCreatureSprites is now live by default through `v7`
|- atlas flag    -> spriteAtlas stays default-off
|- blocked path  -> higher-fidelity baked body + antenna + caterpillar helpers still do not beat the retained live slice
`- next push     -> only reopen atlas/body/antenna/caterpillar work on a source path that beats the current live slice in smoke, not just parity
```
