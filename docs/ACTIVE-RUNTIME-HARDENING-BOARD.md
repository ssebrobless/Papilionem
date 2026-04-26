# Papilionem Active Runtime Hardening Board

> Superseded on 2026-04-21 by
> [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md).
> Keep this board as historical context for the already-landed `h1`-`h5`
> runtime-hardening work; do not use it as the active sequencing source of
> truth.

## Purpose

This board turns the still-open smoothness problem into one exact implementation
path.

It sits underneath `R4 feedback triage + readability hardening` and answers:

```text
+====================================================================================+
| Remaining Runtime Work Order                                                       |
+====================================================================================+
| 1. prove where real-save lag still comes from                                      |
| 2. slim the render path until the garden stops feeling heavy                       |
| 3. decimate non-visual simulation work under pressure without breaking behavior    |
| 4. stop the shell from redrawing expensive views every frame                       |
| 5. retest on the same long-running save that currently feels bad                   |
| 6. only then hand the smoother build back to outside playtesting                   |
+====================================================================================+
```

Read this together with:

- [ACTIVE-PUBLIC-SHARE-BOARD.md](./ACTIVE-PUBLIC-SHARE-BOARD.md)
- [PUBLIC-SHARE-READINESS-ROADMAP.md](./PUBLIC-SHARE-READINESS-ROADMAP.md)
- [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)
- [EXTERNAL-PLAYTEST-MATRIX.md](./EXTERNAL-PLAYTEST-MATRIX.md)
- [PLAYTEST.md](../PLAYTEST.md)
- [CURRENT-SPATIAL-TRUTH.md](./CURRENT-SPATIAL-TRUTH.md)

## Current Shape

```text
runtime state
|- black-screen collapse           -> repaired
|- hard freeze suspect lane        -> repaired
|- shell readability regressions   -> repaired
|- long-running save continuity    -> repaired
`- sustained smoothness on real save
    |- still too laggy
    `- still active
```

## Status Key

```text
live
|- phase landed and current docs/proof agree

active
|- current phase

queued
`- next sequenced phase, not started yet
```

## Invariants

```text
always preserve
|- no performance fix should require resetting progression or wiping long-running saves
|- fail-soft rendering stays in place; a bad frame must not collapse to a black screen
|- button-first shell readability must survive every runtime cut
|- social / ecology / lineage truth stays correct even if expensive systems are decimated under pressure
|- visual cuts should prefer graceful degradation over feature disappearance
`- outside-playtest handoff only happens after the host-local save feels meaningfully smoother
```

## Comfort Target

```text
host-local comfort target
|- ordinary focused-garden lane
|  |- pressure tier          -> warm or lower
|  |- avg update            -> <= 12ms
|  |- avg render            -> <= 14ms
|  `- repeated 40ms+ spikes -> rare, not persistent
|- no black-screen or frame-collapse symptom
`- same long-running save remains usable throughout
```

## Phase Ladder

| Phase | Status | Goal | Primary owners | Proof gate |
| --- | --- | --- | --- | --- |
| `h1 real-save lag capture + attribution` | `live` | capture and separate real-save lag into render cost, simulation cost, UI redraw cost, or browser/canvas stress | `systems/telemetrySystem.js`, `core/gameCore.js`, `core/renderManager.js`, `PLAYTEST-TRIAGE-LOG.md`, `qa_logs/` | dedicated `h1` capture export now reports lag category, shell state, and top update/render contributors instead of only `hot` |
| `h2 render-pass slimming` | `live` | reduce sustained render cost by cutting or caching the heaviest world/background/layer work first | `core/renderManager.js`, `sketch.js`, `core/config.js`, `systems/specialEffects.js` | shell-heavy attribution lane dropped from roughly `29ms render` into the low-20s, and the focused-garden audit now holds near `15.7ms render` without freeze suspects |
| `h3 simulation cadence + budget enforcement` | `live` | decimate or stagger expensive non-visual work under pressure without breaking the life-sim | `core/gameCore.js`, `systems/lifeSimSystem.js`, `systems/communicationSystem.js`, `systems/behaviorSystem.js`, `systems/mlInferenceSystem.js`, `systems/zoneSystem.js`, `systems/structureSystem.js` | unchanged structure state no longer pays a full rebuild every frame; focused-garden update averages now sit near `7.8ms` in the current proof lane |
| `h4 shell redraw discipline` | `live` | stop feed/inspect/journal/debug surfaces from paying full layout cost every frame when nothing changed | `ui/gameUI.js`, `ui/debugUI.js`, `ui/butterflyCollection.js`, `core/renderManager.js` | UI-heavy lanes stay readable while idle redraw cost drops |
| `h5 long-running save smoothness retest` | `active` | rerun the exact long-running host-local save with capture, battle, zone travel, and save/load after `h2-h4` | `PLAYTEST.md`, `ui/debugUI.js`, `server.js`, `scripts/run-h5-long-running-save-smoothness-audit.js`, `qa_logs/`, `PLAYTEST-TRIAGE-LOG.md` | exported-save retest tooling is live, the imported-save fixture proof is now green end to end, session capture survives save/load, and the real exported save is the remaining honest smoothness gate |
| `h6 outside retest + public-share handoff` | `queued` | rerun `M2+` with the smoother build and hand the result back to `R4/R5` | `docs/EXTERNAL-PLAYTEST-MATRIX.md`, `PLAYTEST-FEEDBACK.md`, `docs/PLAYTEST-TRIAGE-LOG.md`, `scripts/` | host-local smoothness is acceptable, outside session evidence exists, and `R4` can advance honestly |

## Exact Order

```text
must land in this order

h1 real-save lag capture + attribution
  v
h2 render-pass slimming
  v
h3 simulation cadence + budget enforcement
  v
h4 shell redraw discipline
  v
h5 long-running save smoothness retest
  v
h6 outside retest + public-share handoff
```

## Current Focus

```text
current focus
`- h5 long-running save smoothness retest
```

Immediate reasons `h5` is next:

- `h1` now proves the lag shape instead of only saying `hot`
- `h2` and `h3` materially lowered the focused-garden lane
- `h4` is now live: text/layout caches and UI-layer redraw throttling cut the three-panel shell lane from the mid/high-20s down to roughly `15.4ms update / 18.8ms render`, while the ordinary feed lane now holds near `6.6ms update / 12.7ms render`
- `h5` now has a real imported-save path: `Export Save` writes the browser world to `qa_logs/save_exports`, and `run-h5-long-running-save-smoothness-audit.js` can load that same world into a fresh audit browser context
- session capture now survives save/load during the `h5` retest instead of being wiped by foundation reset
- the current fixture-export proof is now green for calm garden, shell exercise, zone travel, save/load, battle, and capture export, with the calm lane landing near `3.25ms update / 11.22ms render`
- the only remaining honest blocker is that `qa_logs/save_exports` still does not contain the real lived-in browser save, so `h5` still needs that direct exported-save rerun before closure

## Open Items This Board Covers

```text
open / partial items
|- host-local long-running save still feels extremely laggy
|- shell-heavy lanes are materially lower, but they still need direct real-save confirmation from an exported long-running world
|- the imported-save fixture proof is now fully green, but it is still only the fixture world
|- the real lived-in browser save has not been exported yet, so `h5` cannot close honestly
|- ordinary focused-garden/feed play now sits in the low-teens render range in proof lanes
|- multi-panel shell play is cheaper and remains readable, but still above ideal comfort
|- update cost is materially better in the focused-garden lane
`- outside playtest handoff is blocked until host-local smoothness improves
```
