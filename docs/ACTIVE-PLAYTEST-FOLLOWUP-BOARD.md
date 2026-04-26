# Papilionem Active Playtest Follow-Up Board

## Purpose

This board turns the remaining local-playtest findings into one concrete,
ordered implementation path.

It sits underneath `R4 feedback triage + readability hardening` and answers:

```text
+====================================================================================+
| Remaining Work Order                                                               |
+====================================================================================+
| 1. stop the game from freezing                                                     |
| 2. capture better runtime evidence                                                 |
| 3. re-check the repaired shell on a real long-running save                         |
| 4. deepen social conversation so bonds feel visible and emergent                   |
| 5. make material / building behavior easier to observe                             |
| 6. decide whether fuller vertical butterfly movement is real next work or later    |
+====================================================================================+
```

Read this together with:

- [ACTIVE-PUBLIC-SHARE-BOARD.md](./ACTIVE-PUBLIC-SHARE-BOARD.md)
- [PUBLIC-SHARE-READINESS-ROADMAP.md](./PUBLIC-SHARE-READINESS-ROADMAP.md)
- [PLAYTEST-FOLLOWUP-ROADMAP.md](./PLAYTEST-FOLLOWUP-ROADMAP.md)
- [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)
- [DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md](./DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md)
- [CURRENT-SPATIAL-TRUTH.md](./CURRENT-SPATIAL-TRUTH.md)
- [WILD-ECOLOGY-RELEASE-CONTRACT.md](./WILD-ECOLOGY-RELEASE-CONTRACT.md)

## Current Shape

```text
frozen baselines
|- repair / parity closed
|- polish closed
|- implementation closed
|- expansion closed
`- public-share board active
        |
        v
playtest follow-up
|- f1 session capture + freeze triage
|- f2 freeze / performance hardening
|- f3 long-running save regression sweep
|- f4 shell follow-up retest
|- f5 feed threading + conversation surfacing
|- f6 emergent casual conversation depth
|- f7 material behavior visibility
|- f8 flower-carry / build scope lock
|- f9 vertical habitat contract lock
`- f10 outside retest + freeze handoff
```

## Status Key

```text
live
|- phase landed and current docs/proof agree

active
|- current phase

gated
`- requires an upstream decision or proof gate first
```

## Invariants

```text
always preserve
|- freezing/performance is treated as a release blocker before deeper polish work
|- long-running butterfly identity, memory, bonds, and lineage must survive refresh-oriented fixes
|- feed / inspect UI must not become the source of truth for social state
|- casual conversation should emerge from state and context, not fixed scripted scenes
|- flower carry/build work must not be implied as live until it is truly implemented
`- full free-flight volumetric 3D is still out of scope unless a later board promotes it
```

## Phase Ladder

| Phase | Status | Goal | Primary owners | Proof gate |
| --- | --- | --- | --- | --- |
| `f1 session capture + freeze triage` | `live` | record real session errors, warnings, frame spikes, and important player actions so freezes can be diagnosed from evidence instead of memory | `systems/telemetrySystem.js`, `ui/debugUI.js`, `core/gameCore.js`, `docs/`, `qa_logs/` | export exists, capture survives a real play session, and at least one freeze session artifact can be reviewed after play |
| `f2 freeze / performance hardening` | `live` | remove the hard stutter / freeze behavior on real saves by clamping the hottest update/render paths first | `core/renderManager.js`, `entities/butterfly.js`, `core/config.js`, `systems/telemetrySystem.js`, `scripts/` | real session no longer freezes, pressure profile stays under the focused-garden budget seam, and affected audits remain green |
| `f3 long-running save regression sweep` | `live` | make sure refresh-aware world fixes do not force save resets and do not break long-running bonds, memories, or lineage | `systems/saveSystem.js`, `core/gameCore.js`, `scripts/`, `docs/` | save/load roundtrip stays green on a lived-in save, refreshed worlds preserve butterfly/social identity, and no reset is needed to see current environment truth |
| `f4 shell follow-up retest` | `live` | retest the already-repaired shell items on the stabilized runtime: battle readability, doorway travel, inspect clearing, and feed cleanliness | `ui/gameUI.js`, `core/gameCore.js`, `core/renderManager.js`, `scripts/`, `PLAYTEST-TRIAGE-LOG.md` | the current repaired items still hold in real play after `f2` and `f3` |
| `f5 feed threading + conversation surfacing` | `live` | make ongoing talk read more like actual exchanges instead of isolated system cards | `ui/gameUI.js`, `systems/communicationSystem.js`, `docs/` | feed shows short grouped exchanges, old overlap/proof clutter stays gone, and communication/readability audits stay green |
| `f6 emergent casual conversation depth` | `live` | add low-stakes social talk, pair rhythm, and visible relationship texture without abandoning emergence | `systems/communicationSystem.js`, `systems/lifeSimSystem.js`, `ui/gameUI.js`, `docs/` | butterflies produce richer casual talk, repeated warmth/friction changes later behavior, and the contract/docs stay aligned |
| `f7 material behavior visibility` | `live` | make block pickup / carrying / placement show up more reliably in live play and easier to notice in the shell | `entities/butterfly.js`, `systems/lifeSimSystem.js`, `ui/gameUI.js`, `scripts/` | block interaction occurs often enough to witness in ordinary sessions and related audits stay green |
| `f8 flower-carry / build scope lock` | `live` | explicitly decide whether flower carry/build becomes real shipped behavior now or is documented as intentionally not live | `docs/`, `entities/flower.js`, `entities/butterfly.js`, `systems/communicationSystem.js` | a clear yes/no decision is recorded before any flower-carry implementation claims are made |
| `f9 vertical habitat contract lock` | `live` | decide whether to promote true butterfly altitude-band movement and high-home behavior beyond the current grounded spatial model | `docs/CURRENT-SPATIAL-TRUTH.md`, `docs/`, `core/config.js`, `systems/physicsSystem.js`, `entities/butterfly.js` | the contract clearly says either `still grounded only` or `promoted to implementation`, with no ambiguous middle state |
| `f10 outside retest + freeze handoff` | `active` | rerun internal and outside play once the remaining local blockers are settled, then hand the result back to `R4/R5` | `docs/EXTERNAL-PLAYTEST-MATRIX.md`, `docs/PLAYTEST-TRIAGE-LOG.md`, `PLAYTEST.md`, `scripts/` | local freezes are closed, top follow-up issues are resolved or intentionally deferred, and the public-share board can advance honestly |

## Exact Order

```text
must land in this order

f1
  v
f2
  v
f3
  v
f4
  v
f5
  v
f6
  v
f7
  v
f8 decision
  |- no  -> hold as explicit non-live boundary
  `- yes -> implement flower carry/build after f7
  v
f9 decision
  |- no  -> hold grounded spatial model as current truth
  `- yes -> open a later implementation phase for true altitude movement
  v
f10
```

## Current Focus

```text
current focus
`- f10 outside retest + freeze handoff
```

`f1` closed state now live:

- debug mode now exposes `Start Capture` and `Export Capture`
- session captures export to `qa_logs/session_captures/...` with both `capture.json` and `summary.txt`
- exports include runtime issues, frame spikes, focused-zone changes, save/load events, event history, replay markers, and start/end world summaries
- `run-f1-session-capture-audit.js` proves the export end to end even when an older server is already occupying `3000`

`f2` closed state now live:

- oversized browser windows now clamp to a safer display size before the canvas is resized
- high-DPI canvases now cap backing density more aggressively on large windows instead of scaling toward runaway cost
- butterfly sprite smoothing now disables automatically under pressure instead of paying the full visual cost in crowded scenes
- `run-f2-performance-hardening-audit.js` proves the high-DPI stress lane with a passing session capture and no freeze-suspect events
- `run-r4-ui-readability-audit.js` stayed green and `run-runtime-self-audit.js` still passed all audited steps after the hardening pass

`f3` closed state now live:

- save/load roundtrip now strips transient per-butterfly signal fanout instead of treating it as durable save truth
- active doorway travel now restores against the live doorway route so a refresh/load does not strand a traveler in the source zone
- `run-f3-long-running-save-regression-audit.js` now passes on the social web, nursery lineage, and stale refresh + doorway travel lanes

`f4` closed state now live:

- inspect `All` browse and zone-scoped clearing both still hold on the stabilized runtime
- doorway travel still reaches the wall/warp route before crossing zones, instead of silently regressing to a middle-of-garden jump
- the cleaned feed shell and default-off trail toggle both still hold after the save/runtime fixes
- `run-f4-shell-followup-audit.js`, `run-r2-zone-transition-audit.js`, `run-r4-ui-readability-audit.js`, and `run-r5-battle-presentation-audit.js` are green together

`f5` closed state now live:

- talk feed entries now collapse same-pair exchanges into short 2-3 line threads instead of rendering each line as an isolated card
- talk cards now render speaker-labelled thread lines directly in the feed, with light pair-mode continuity instead of the older grounding clutter
- `run-f5-f6-social-depth-audit.js`, `run-r6-communication-audit.js`, and `run-r4-ui-readability-audit.js` are green together on the threaded feed shell

`f6` closed state now live:

- low-stakes casual talk now includes `check_in`, `shared_observation`, `playful_banter`, `gentle_tease`, `quiet_companionship`, `small_praise`, `light_irritation`, and `soft_repair`
- pair conversation modes (`easy`, `playful`, `tender`, `guarded`, `strained`, `admiring`) now derive from live relationship state instead of being implied only by courtship residue
- social edges now track short-horizon conversation texture (`recentWarmth`, `recentEase`, `recentFriction`, `recentMutualAttention`) and feed it back into later life-sim behavior
- Inspect and communication summaries now surface pair-mode and recent conversation texture without making UI the owner of the relationship truth

`f7` closed state now live:

- ordinary block interaction now follows through more reliably from pursuit into pickup, carry, and placement without debug forcing
- calm/shelter-oriented butterflies now treat nearby blocks as real opportunities sooner instead of dropping the behavior before arrival
- feed wording now uses lighter `shelter block` language so the behavior reads as part of the garden instead of a debug-like event
- `run-f7-material-visibility-audit.js`, `run-r7-block-visual-audit.js`, and `run-r4-ui-readability-audit.js` now hold green together on the ordinary material lane

`f8` decision now locked:

- flower carry/build is intentionally **not** a live mechanic on this board
- flowers remain feeding, egg-laying, and lifecycle ecology surfaces rather than current shelter/build materials
- no player-facing or source docs should imply that butterflies currently gather flowers as construction pieces

`f9` decision now locked:

- taller block stacks and shelter columns are live, but the butterfly runtime still uses the grounded pseudo-3D model
- this board does **not** promote a separate altitude-band habitat sim, high-home altitude routine layer, or free-flight volumetric movement
- any future altitude-focused butterfly movement work now belongs on a later intentionally promoted board instead of drifting into the current public-share path

Immediate reason `f10` is current:

- the remaining local follow-up blockers are now either fixed or explicitly bounded
- the next honest proof step is a fresh local handoff plus at least one outside captured session
- `R4/R5` can only advance from here on real `M2+` evidence, not more invented local closure

## Open Items This Board Covers

```text
open / partial items
|- fresh local handoff session on the stabilized long-running save
|- at least one captured `M2+` outside session
|- outside-session findings promoted into the triage log when real blockers appear
`- honest handoff back to `R4 / R5`
```
