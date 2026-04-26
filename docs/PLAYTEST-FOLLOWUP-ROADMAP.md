# Papilionem Playtest Follow-Up Roadmap

## Purpose

This roadmap expands the active follow-up board into exact implementation order,
owner seams, and finish conditions.

It is intentionally narrower than the older grand boards:

```text
this roadmap is for
|- real remaining issues found during current play
|- release-blocking stability work
|- social/material/spatial depth that is still visibly under-expressed
`- explicit scope decisions where current truth is still ambiguous to the player
```

## Program Shape

```text
+=====================================================================================================+
| Remaining Work Program                                                                              |
+=====================================================================================================+
| stabilize runtime     | f1 -> f2 -> f3                                                              |
| re-validate shell     | f4                                                                          |
| deepen social feel    | f5 -> f6                                                                    |
| improve material feel | f7 -> f8                                                                    |
| lock spatial boundary | f9                                                                          |
| hand back to release  | f10                                                                         |
+=====================================================================================================+
```

## F1 - Session Capture + Freeze Triage

Status:
- `live`

```text
goal
|- capture what happened during a real play session
|- stop relying on memory for freeze diagnosis
`- make later test reviews faster and more trustworthy
```

Build order:

1. add session-start / session-stop capture controls in the debug shell
2. record:
   - uncaught errors
   - console warnings/errors that matter
   - frame/update spikes
   - focused-zone changes
   - save/load events
   - battle start/end
   - major butterfly/social/material events
3. export the capture to a stable folder path
4. add a short human-readable session summary beside the raw data
5. document how to use it in the playtest docs

Primary owners:

- `systems/telemetrySystem.js`
- `ui/debugUI.js`
- `core/gameCore.js`
- `PLAYTEST.md`
- `docs/ACTIVE-PUBLIC-SHARE-BOARD.md`

Exit condition:

- you can run a real session, export the capture, and review a freeze afterward without guessing

Closed state:

- debug mode now exposes `Start Capture` and `Export Capture`
- exports land in `qa_logs/session_captures/...`
- each export includes both `capture.json` and `summary.txt`
- the capture records runtime issues, frame spikes, focused-zone changes, save/load events, event history, replay markers, and start/end world summaries
- `run-f1-session-capture-audit.js` proves the path end to end and bypasses stale older servers by standing up a fresh audit port when needed

## F2 - Freeze / Performance Hardening

Status:
- `live`

```text
goal
|- stop the game from freezing on real saves
|- prefer the smallest reversible clamps first
`- keep visual readability gains without overloading the runtime
```

Build order:

1. review one or more `f1` session captures and identify the hottest spikes
2. clamp the likely first offenders:
   - afterimage trail accumulation
   - butterfly draw/update density when many are visible
   - UI redraw pressure in large-shell states
   - any runaway event/feed growth
3. tighten performance fallbacks so pressure drops earlier before the browser hard-stalls
4. retest on the same long-running save that previously froze
5. widen the runtime/performance proof if a new hotspot was found

Primary owners:

- `core/renderManager.js`
- `entities/butterfly.js`
- `ui/gameUI.js`
- `systems/telemetrySystem.js`
- `core/config.js`

Exit condition:

- the same real session no longer hard-freezes, and the focused-garden runtime stays within the live budget seam often enough to play normally

Closed state:

- oversized browser windows now clamp to a safer display size before the canvas is resized
- large high-DPI windows now cap canvas pixel density more aggressively instead of scaling the backing store toward runaway cost
- butterfly sprite smoothing now disables automatically under pressure instead of paying the full per-entity cost in crowded scenes
- `run-f2-performance-hardening-audit.js` proves the high-DPI stress lane with a passing session capture and no freeze-suspect events
- `run-r4-ui-readability-audit.js` stayed green and `run-runtime-self-audit.js` still passed all audited steps after the hardening pass

Current note:

- the high-DPI stress lane can still enter `hot` pressure during the run, but it no longer produces freeze-suspect captures in the local proof lane after the clamps

## F3 - Long-Running Save Regression Sweep

Status:
- `live`

```text
goal
|- keep using long-running saves
|- stop environment/runtime refreshes from forcing resets
`- prove that identity and relationship state survive the fixes
```

Build order:

1. load a lived-in save after `f2`
2. verify:
   - butterfly identity and display names
   - memories / residues / relationships
   - journal / lineage / hybrid state
   - ambient block refresh truth
   - doorway travel truth
3. fix any refresh/migration drift found
4. add or widen roundtrip proof cases for whatever drift was real

Primary owners:

- `systems/saveSystem.js`
- `core/gameCore.js`
- `scripts/run-runtime-self-audit.js`
- `scripts/run-long-soak-generational-audit.js`

Exit condition:

- a lived-in save can keep being used after the fixes without losing the long-running butterfly/social story

Closed state:

- per-butterfly active-signal target fanout is now treated as transient runtime state instead of durable save truth
- active doorway travel now restores against the current doorway route so load/refresh does not strand a traveler in the source zone
- `run-f3-long-running-save-regression-audit.js` now passes on the social web, nursery lineage, and stale refresh + doorway-travel lanes

## F4 - Shell Follow-Up Retest

Status:
- `live`

```text
goal
|- re-validate the shell repairs on the stabilized runtime
`- separate real regressions from issues that were only artifacts of freezing
```

Retest list:

- battle field-first shell
- battle movement/pacing readability
- doorway travel through the old wall/warp route
- inspect clearing when a zone-scoped butterfly leaves
- inspect `All` browse path
- feed overlap cleanup
- trail toggle behavior

Primary owners:

- `ui/gameUI.js`
- `core/gameCore.js`
- `core/renderManager.js`
- `docs/PLAYTEST-TRIAGE-LOG.md`

Exit condition:

- the repaired shell items still feel correct in ordinary play after `f2` and `f3`

Closed state:

- inspect `All` browse and zone-scoped inspect clearing both still hold on the stabilized runtime
- doorway travel still reaches the doorway route before warping across zones
- the cleaned feed shell and default-off trail toggle both still hold after the save/runtime fixes
- `run-f4-shell-followup-audit.js`, `run-r2-zone-transition-audit.js`, `run-r4-ui-readability-audit.js`, and `run-r5-battle-presentation-audit.js` are green together

## F5 - Feed Threading + Conversation Surfacing

Status:
- `live`

```text
goal
|- make current talk easier to read as social exchange
`- improve visibility before deepening the underlying sim
```

Build order:

1. group adjacent same-pair talk into short exchange bursts
2. keep `Talk / Actions / Learn` color coding, but let talk render as a thread instead of isolated cards
3. show subtle pair continuity instead of repeated system tags
4. keep the feed visually lighter than battle or inspect

Primary owners:

- `ui/gameUI.js`
- `systems/communicationSystem.js`

Exit condition:

- players can visually follow who is talking to whom and feel continuity across 2-3 line exchanges

Closed state:

- same-pair talk now groups into short 2-3 line threaded exchanges instead of isolated single-line cards
- talk cards render speaker-labelled thread lines directly, while keeping the lighter `Talk / Actions / Learn` color coding
- pair continuity now shows through the exchange headline and pair-mode footer instead of the older cluttered proof tags
- `run-f5-f6-social-depth-audit.js`, `run-r6-communication-audit.js`, and `run-r4-ui-readability-audit.js` are green together

## F6 - Emergent Casual Conversation Depth

Status:
- `live`

```text
goal
|- make friendships and relationships feel more human
|- keep the behavior emergent
`- make later actions prove that the talk mattered
```

Build order:

1. add low-stakes talk intents:
   - `check_in`
   - `shared_observation`
   - `playful_banter`
   - `gentle_tease`
   - `quiet_companionship`
   - `small_praise`
   - `light_irritation`
   - `soft_repair`
2. derive pair conversation modes from existing trust/comfort/resentment/attachment
3. add tiny recent accumulators:
   - `recentWarmth`
   - `recentEase`
   - `recentFriction`
   - `recentMutualAttention`
4. fold those slowly back into existing relationship edges
5. couple speech to later behavior:
   - lingering
   - re-seeking
   - following
   - drifting apart
   - resting together
6. surface the result in inspect/feed without making UI the owner of truth

Primary owners:

- `systems/communicationSystem.js`
- `systems/lifeSimSystem.js`
- `ui/gameUI.js`
- `docs/DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md`

Exit condition:

- butterflies visibly produce more casual friendship/relationship talk and later behave as if those exchanges mattered

Closed state:

- low-stakes talk now includes `check_in`, `shared_observation`, `playful_banter`, `gentle_tease`, `quiet_companionship`, `small_praise`, `light_irritation`, and `soft_repair`
- pair conversation modes now derive from live trust / comfort / resentment / attachment instead of being implied only by courtship outcomes
- social edges now keep short-horizon conversation texture through `recentWarmth`, `recentEase`, `recentFriction`, and `recentMutualAttention`
- life-sim follow-through now folds recent conversation texture back into belonging, confidence, attachment, relief, agitation, and slight lingering bias
- Inspect/feed surfacing now proves the pair mode and recent texture without turning UI into the owner of the relationship truth
- `run-f5-f6-social-depth-audit.js` proves threaded exchange surfacing, casual subtype selection, pair-texture accumulation, and later life-sim follow-through

## F7 - Material Behavior Visibility

Status:
- `live`

```text
goal
|- make block interaction easier to notice
`- let ordinary play reveal building behavior without debug forcing
```

Build order:

1. increase the probability that eligible butterflies choose block interaction in calm ordinary sessions
2. improve the follow-through so pickup -> carry -> place happens more reliably once started
3. surface this lightly in feed/inspect without clutter
4. widen audits so the behavior is proved as a live ordinary pattern, not only a forced test fixture

Primary owners:

- `entities/butterfly.js`
- `systems/lifeSimSystem.js`
- `ui/gameUI.js`
- `scripts/`

Exit condition:

- you can observe block pickup/build behavior in normal play often enough to understand that it exists

Closed state:

- ordinary block interaction now follows through more reliably from pursuit into pickup, carry, and placement without debug forcing
- calm/shelter-oriented butterflies now treat nearby blocks as real opportunities sooner instead of abandoning the behavior before arrival
- feed wording now uses lighter `shelter block` language so the action reads as garden behavior instead of audit-like jargon
- `run-f7-material-visibility-audit.js`, `run-r7-block-visual-audit.js`, and `run-r4-ui-readability-audit.js` are green together on the ordinary material lane

## F8 - Flower-Carry / Build Scope Lock

Status:
- `live`

```text
decision
|- if yes: promote it to real implementation after f7
`- if no: document clearly that flowers are not current build materials
```

Why this needed a scope lock:

- right now the runtime does not honestly support flower carrying/building as a normal live mechanic
- that needs a clear scope call before implementation claims expand further

Locked outcome:

1. `defer`
   - flowers stay in the ecology/lifecycle loop as feeding, egg, and chrysalis-context surfaces
   - flowers are not current shelter/build materials
   - any future flower-material system must reopen on a later intentionally promoted board instead of being implied here

## F9 - Vertical Habitat Contract Lock

Status:
- `live`

```text
decision
|- keep the current grounded spatial model
`- or promote true altitude-band butterfly behavior
```

Why this needed a contract lock:

- current runtime now supports taller structures and a larger grounded area
- it still does not honestly support a full butterfly altitude behavior model
- that needs a clean yes/no contract before implementation claims keep drifting upward

Locked outcome:

1. `hold grounded model`
   - keep current spatial truth
   - clarify the boundary in docs/player language
   - treat taller block stacks and shelter columns as part of the grounded pseudo-3D runtime, not proof of a separate butterfly altitude model
   - reserve any future altitude bands / high-home preference / doorway-height behavior for a later intentionally promoted board

## F10 - Outside Retest + Freeze Handoff

Status:
- `active`

```text
goal
|- prove the repaired build in real play again
`- hand the remaining result back to r4 / r5 cleanly
```

Build order:

1. re-run local self-test on the stabilized long-running save
2. run at least one outside session using the new capture tooling
3. log real findings in the triage log
4. close what is blocking
5. hand the surviving known issues and the clean runtime back to the public-share board

Exit condition:

- the project can move forward honestly on `R4/R5` with current blockers either fixed or explicitly bounded

Current active blocker:

- this phase now depends on real `M2+` outside-session evidence
- local follow-up closure is no longer the limiting factor
- the next useful artifact is a captured outside session plus any reproduced friction entered into the triage log

## Exact Implementation Order

```text
phase order

f1 session capture + freeze triage
  ▼
f2 freeze / performance hardening
  ▼
f3 long-running save regression sweep
  ▼
f4 shell follow-up retest
  ▼
f5 feed threading + conversation surfacing
  ▼
f6 emergent casual conversation depth
  ▼
f7 material behavior visibility
  ▼
f8 flower-carry / build scope lock
  ▼
f9 vertical habitat contract lock
  ▼
f10 outside retest + freeze handoff
```

## Why This Order

```text
first
|- stop freezes
|- protect long-running saves
`- re-validate earlier repairs

then
|- improve readability of social activity
|- deepen the underlying social simulation
`- improve material behavior visibility

last
|- make explicit scope calls on flower carrying and fuller altitude movement
`- only then freeze for wider sharing again
```
