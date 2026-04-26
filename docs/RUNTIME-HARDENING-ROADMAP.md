# Papilionem Runtime Hardening Roadmap

## Purpose

This roadmap expands the active runtime-hardening board into exact build order,
owner seams, and finish conditions.

It is narrower than the older freeze board:

```text
this roadmap is for
|- sustained lag on real saves
|- keeping the garden responsive during ordinary play
|- preserving repaired shell/life-sim behavior while decimating cost
`- handing a smoother build back to public-share readiness
```

## Program Shape

```text
+=====================================================================================================+
| Remaining Runtime Program                                                                          |
+=====================================================================================================+
| attribute the lag       | h1                                                                        |
| cut render cost         | h2                                                                        |
| cut simulation cost     | h3                                                                        |
| cut shell redraw cost   | h4                                                                        |
| prove on real save      | h5                                                                        |
| hand back to release    | h6                                                                        |
+=====================================================================================================+
```

## H1 - Real-Save Lag Capture + Attribution

Status:
- `live`

```text
goal
|- stop saying only "it feels laggy"
|- turn the real save into an attributed runtime profile
`- decide what actually dominates: render, simulation, or shell
```

Build order:

1. run session capture on the real long-running save that still feels bad
2. log:
   - focused zone
   - open shell state
   - avg update / render
   - spike counts
   - top system costs
3. split the captured result into:
   - render-dominant
   - simulation-dominant
   - mixed
4. write the attributed result into the triage log so later cuts stay evidence-based

Primary owners:

- `systems/telemetrySystem.js`
- `core/gameCore.js`
- `core/renderManager.js`
- `docs/PLAYTEST-TRIAGE-LOG.md`

Exit condition:

- dedicated capture export now reports `lagCategory`, shell state, top update contributors, and top render contributors in both `capture.json` and `summary.txt`

## H2 - Render-Pass Slimming

Status:
- `live`

```text
goal
|- make the garden cheaper to draw every frame
`- degrade gracefully before the browser feels heavy
```

Build order:

1. cut or cache the heaviest atmosphere/background passes first
2. reduce layer compositing cost where a layer can be reused instead of redrawn
3. tighten sprite smoothing and expensive per-entity visual choices earlier under pressure
4. re-check the battle shell separately so garden cuts do not quietly regress combat readability

Primary owners:

- `core/renderManager.js`
- `sketch.js`
- `core/config.js`
- `systems/specialEffects.js`

Exit condition:

- layer presentation is materially slimmer: empty presentation layers no longer composite, the UI layer no longer renders at the old over-dense backing resolution, and the focused-garden proof lane now sits around `15.7ms render` instead of the earlier low-20s

## H3 - Simulation Cadence + Budget Enforcement

Status:
- `live`

```text
goal
|- reduce steady update cost
|- keep life-sim truth correct
`- stagger what does not need to happen every frame
```

Build order:

1. measure foundation-system cost by family:
   - life sim
   - communication
   - behavior
   - ecology
   - ML
2. stagger slow-moving systems under pressure:
   - ecology refresh
   - social scans
   - migration scoring
   - ML garden cadence if still needed
3. keep save/load, battle, and direct player actions immediate
4. widen the proof so cadence cuts cannot silently corrupt social or ecology truth

Primary owners:

- `core/gameCore.js`
- `systems/lifeSimSystem.js`
- `systems/communicationSystem.js`
- `systems/behaviorSystem.js`
- `systems/mlInferenceSystem.js`
- `systems/zoneSystem.js`

Exit condition:

- unchanged structure state no longer triggers a full structure rebuild every frame, focused-garden update averages now sit around `7.8ms`, and the affected proof lanes remain green

## H4 - Shell Redraw Discipline

Status:
- `live`

```text
goal
|- stop idle shell states from paying full layout cost every frame
`- keep the UI sharp while making it cheaper
```

Build order:

1. identify views that still recompute or reflow too much:
   - feed
   - inspect
   - journal
   - debug
2. cache static or unchanged layouts
3. only redraw expensive panels when their underlying state actually changes
4. re-check UI readability after the caching pass

Primary owners:

- `ui/gameUI.js`
- `ui/debugUI.js`
- `ui/butterflyCollection.js`

Exit condition:

- UI-heavy lanes remain readable while idle shell cost drops, the three-panel host-local shell lane now holds around `15.4ms update / 18.8ms render` instead of the older mid/high-20s range, and the ordinary feed lane stays near `6.6ms update / 12.7ms render` without reintroducing freeze suspects

## H5 - Long-Running Save Smoothness Retest

Status:
- `active`

```text
goal
|- prove the actual save feels better
`- avoid declaring victory from audit-only numbers
```

Build order:

1. export the current browser save from the debug panel into `qa_logs/save_exports`
2. rerun the exported save through `run-h5-long-running-save-smoothness-audit.js`
3. keep capture on for the full imported-save pass
4. cover:
   - calm garden observation
   - Inspect / Feed / Journal
   - zone travel
   - save/load
   - battle entry/exit
5. compare the new capture against the old laggy baseline

Primary owners:

- `PLAYTEST.md`
- `ui/debugUI.js`
- `server.js`
- `qa_logs/`
- `docs/PLAYTEST-TRIAGE-LOG.md`
- `scripts/run-h5-long-running-save-smoothness-audit.js`

Exit condition:

- the real exported long-running save no longer feels extremely laggy in the ordinary garden loop

## H6 - Outside Retest + Public-Share Handoff

Status:
- `queued`

```text
goal
|- confirm smoother behavior beyond the host machine
`- hand the result back to the public-share board honestly
```

Build order:

1. run at least one `M2+` session with capture enabled if possible
2. collect notes in `PLAYTEST-FEEDBACK.md`
3. promote real blockers into the triage log
4. either:
   - close `r4` if the smoother build holds, or
   - reopen the next runtime issue with real outside evidence

Primary owners:

- `docs/EXTERNAL-PLAYTEST-MATRIX.md`
- `PLAYTEST-FEEDBACK.md`
- `docs/PLAYTEST-TRIAGE-LOG.md`
- `docs/ACTIVE-PUBLIC-SHARE-BOARD.md`

Exit condition:

- the public-share track can advance on real smoother-play evidence instead of host-only hope

## Exact Implementation Order

```text
phase order

h1 real-save lag capture + attribution
  ▼
h2 render-pass slimming
  ▼
h3 simulation cadence + budget enforcement
  ▼
h4 shell redraw discipline
  ▼
h5 long-running save smoothness retest
  ▼
h6 outside retest + public-share handoff
```

## Why This Order

```text
first
|- attribute the lag honestly
`- do not optimize blind

then
|- cut render cost
|- cut simulation cost
`- cut shell redraw cost

last
|- prove it on the real save
`- only then hand it back to outside playtesting
```

## Current Read

```text
current runtime shape
|- fixture imported-save proof lane
|  |- calm garden     -> ~3.25ms update / ~11.22ms render
|  |- shell exercise  -> ~2.52ms update / ~13.92ms render
|  `- state           -> green, but still only the fixture world
|- broader f2 stress lane
|  |- avg update      -> ~6.16ms
|  |- avg render      -> ~11.67ms
|  `- remaining issue -> pressure tier still reads `critical`
`- next exact target
   `- h5 exported-save rerun on the real lived-in world
```
