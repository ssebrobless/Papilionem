# Papilionem Playtest Triage Log

## Purpose

This log is the intake landing spot for real outside-tester findings during
`R4 feedback triage + readability hardening`.

Do not add speculative polish ideas here.
Only capture issues backed by a real session from the lanes in
[EXTERNAL-PLAYTEST-MATRIX.md](./EXTERNAL-PLAYTEST-MATRIX.md).

## Intake Rule

```text
outside session
      |
      v
PLAYTEST-FEEDBACK.md
      |
      v
triage entry here
      |
      v
runtime/doc fix
      |
      v
rerun affected audits
```

## Status Key

```text
open
|- confirmed outside-session issue, not fixed yet

in progress
|- actively being repaired or reworded

closed
`- fixed and rechecked against the affected audits/docs
```

## Entry Template

Copy one block per actionable issue:

```text
id                :
status            : open / in progress / closed
lane              : M1 / M2 / M3 / M4 / M5 / M6 / M7
bucket            : startup / onboarding / readability / save-load / battle / browser-specific / performance / known-issue
severity          : low / medium / high
summary           :
what the tester saw:
expected instead  :
reproduction notes:
source session    :
owner files       :
audit to rerun    :
resolution notes  :
```

## Active Queue

```text
open outside-session queue
`- no confirmed M2+ issues logged yet; waiting on the first real outside session
```

```text
closed local-session fixes
|- M1 battle shell clutter / field occlusion
|- M1 battle feel / pacing readability
|- M1 focused-garden freeze / high-DPI pressure
|- M1 sustained lag / low smoothness after freeze fix
|- M1 save refresh / doorway continuity
|- M1 shallow social feed / casual conversation visibility
`- M1 weak visible material/build behavior
```

```text
id                : r4-m1-battle-shell-clutter-2026-04-20
status            : closed
lane              : M1
bucket            : battle
severity          : high
summary           : battle mode covered too much of the field and let the garden feed stay visible behind the match
what the tester saw: left/right team panels, a visible battle feed, and the leftover garden feed crowded the arena and made the fight harder to read
expected instead  : battle should read primarily through the field, with only a light support shell
reproduction notes: host-local Windows + Chromium self-test; enter Battle while Feed was visible
source session    : local M1 self-test on 2026-04-19/2026-04-20
owner files       : ui/gameUI.js, core/renderManager.js, scripts/run-r5-battle-presentation-audit.js, scripts/run-single-player-autobattle-audit.js
audit to rerun    : run-r5-battle-presentation-audit.js, run-single-player-autobattle-audit.js, run-r4-ui-readability-audit.js
resolution notes  : battle now uses a minimal field shell, hides garden-side feed/inspect panels while the match is active, keeps the event log internal, and moves HP readability onto small in-field health bars
```

```text
id                : r4-m1-battle-feel-2026-04-20
status            : closed
lane              : M1
bucket            : battle
severity          : high
summary           : battle opened and resolved too abruptly to feel like a real field exchange
what the tester saw: butterflies barely moved, appeared too large for the arena, did not feel released from back lines, and the fight ended before ability traces read clearly
expected instead  : teams should launch from the back of each side, spread into the arena, and fight long enough for movement, dodging, and ability traces to register
reproduction notes: host-local Windows + Chromium self-test; run single-player autobattle from the top-right Battle flow
source session    : local M1 self-test on 2026-04-19/2026-04-20
owner files       : systems/battleSystem.js, core/renderManager.js, entities/butterfly.js, core/config.js
audit to rerun    : run-r5-battle-presentation-audit.js, run-single-player-autobattle-audit.js, run-runtime-self-audit.js
resolution notes  : battle now starts from narrow back-line spawn bands, uses smaller battle-only butterfly scale, adds wider roam/release motion, lengthens visible ability/projectile windows, and slows the cadence enough to watch the fight without restoring the old speed-control shell
```

```text
id                : r4-m1-freeze-hardening-2026-04-20
status            : closed
lane              : M1
bucket            : performance
severity          : high
summary           : larger browser windows and high-DPI rendering could push the garden into hard stutter/freeze territory
what the tester saw: the game could freeze or stall heavily during ordinary garden play, especially after the visual-resolution increase and on larger windows
expected instead  : the garden should stay playable on a normal large local-host browser window without forcing a save reset or disabling the newer visual clarity entirely
reproduction notes: host-local Windows + Chromium self-test; follow-up proof used high-DPI stress playback plus session capture export
source session    : local M1 self-test on 2026-04-20
owner files       : sketch.js, core/gameCore.js, core/config.js, core/renderManager.js, entities/butterfly.js, scripts/run-f2-performance-hardening-audit.js
audit to rerun    : run-f2-performance-hardening-audit.js, run-r4-ui-readability-audit.js, run-runtime-self-audit.js
resolution notes  : the runtime now clamps oversized browser windows, caps large-window canvas density more aggressively, disables costly butterfly sprite smoothing automatically under pressure, turns off animated atmosphere earlier when the renderer is already hot, and keeps the previous composed frame visible if a render-frame error occurs instead of wiping to black; the dedicated high-DPI stress audit now passes with no freeze-suspect capture events
```

```text
id                : r4-m1-save-refresh-continuity-2026-04-20
status            : closed
lane              : M1
bucket            : save-load
severity          : high
summary           : refresh-aware world fixes could force a reset to see current block/runtime changes, and active doorway travel could drop during save/load
what the tester saw: older saves sometimes needed a reset to pick up current environment truth, and a butterfly traveling between zones could fail to complete the trip after load
expected instead  : long-running saves should keep butterfly identity, memory, and lineage while refreshing the world to the current build without stranding travelers
reproduction notes: host-local Windows + Chromium self-test; follow-up proof used lived-in save roundtrip plus stale block-layout refresh injection
source session    : local M1 self-test on 2026-04-20
owner files       : systems/saveSystem.js, core/gameCore.js, scripts/run-f3-long-running-save-regression-audit.js
audit to rerun    : run-f3-long-running-save-regression-audit.js, run-runtime-self-audit.js, run-long-soak-generational-audit.js
resolution notes  : the save path now strips transient per-butterfly active-signal fanout from durable state, restores active doorway travel against the live doorway route, and keeps refreshed block layouts compatible with long-running social/lineage saves without forcing a reset
```

```text
id                : r4-m1-social-thread-depth-2026-04-20
status            : closed
lane              : M1
bucket            : readability
severity          : medium
summary           : ordinary talk looked shallow and isolated, so friendships and pair bonds were hard to perceive in live play
what the tester saw: the feed mostly read as separate acknowledgement-style cards instead of visible short conversations, and the social layer did not clearly show warmth, friction, or companionship building over time
expected instead  : the feed should show short exchange threads, low-stakes casual talk should sound more human, and later Inspect/social state should prove that those exchanges mattered
reproduction notes: host-local Windows + Chromium self-test; observe normal feed activity during calm garden play and Inspect after repeated pair interactions
source session    : local M1 self-test on 2026-04-20
owner files       : systems/communicationSystem.js, systems/lifeSimSystem.js, ui/gameUI.js, scripts/run-f5-f6-social-depth-audit.js, scripts/run-r6-communication-audit.js
audit to rerun    : run-f5-f6-social-depth-audit.js, run-r6-communication-audit.js, run-r4-ui-readability-audit.js, run-runtime-self-audit.js
resolution notes  : same-pair talk now groups into threaded exchange cards, low-stakes talk now includes casual friendship/relationship subtypes, pair conversation modes and short-horizon warmth/ease/friction/attention texture are live, and life-sim follow-through now reflects those recent exchanges in later social state
```

```text
id                : r4-m1-material-visibility-2026-04-20
status            : closed
lane              : M1
bucket            : readability
severity          : medium
summary           : block pickup / carrying / placement was hard to witness in ordinary play, so shelter-building behavior read as mostly absent
what the tester saw: butterflies rarely followed through on block behavior long enough to make the material system feel real without debug help
expected instead  : calm garden play should show occasional pickup, carrying, and placement clearly enough that a player can tell the material loop exists
reproduction notes: host-local Windows + Chromium self-test; ordinary garden play near ambient blocks without forced pickup/place calls
source session    : local M1 self-test on 2026-04-20
owner files       : entities/butterfly.js, systems/lifeSimSystem.js, ui/gameUI.js, scripts/run-f7-material-visibility-audit.js
audit to rerun    : run-f7-material-visibility-audit.js, run-r7-block-visual-audit.js, run-r4-ui-readability-audit.js, run-runtime-self-audit.js
resolution notes  : butterflies now keep pursuing nearby block opportunities more reliably, follow through from pickup into carry/place more often, and surface lighter `shelter block` wording in the feed; the dedicated material-visibility audit and the broader block/UI audits are now green together
```

```text
id                : r4-m1-sustained-lag-2026-04-20
status            : closed
lane              : M1
bucket            : performance
severity          : high
summary           : the game no longer collapses into a black screen, but the host-local long-running save still feels extremely laggy during ordinary garden play
what the tester saw: the garden remained visibly heavy even after the freeze/black-screen hardening work, with sluggish motion and a low-FPS feel during the normal loop
expected instead  : the same long-running save should feel meaningfully smoother, not merely "less broken"
reproduction notes: host-local Windows + Chromium self-test on the long-running save after the latest freeze hardening pass
source session    : local M1 self-test on 2026-04-20, followed by runtime-hardening proof passes on 2026-04-21
owner files       : core/renderManager.js, core/gameCore.js, systems/telemetrySystem.js, systems/structureSystem.js, ui/gameUI.js, docs/ACTIVE-RUNTIME-HARDENING-BOARD.md, docs/RUNTIME-HARDENING-ROADMAP.md
audit to rerun    : run-h1-real-save-attribution-audit.js, run-f2-performance-hardening-audit.js, run-runtime-self-audit.js, real-save session capture export
resolution notes  : the live runtime stack is now frozen through `v7`, the committed exported long-running save is under `qa_logs/save_exports/2026-04-22T21-44-34-355Z-v0-5-derived-real/`, the shipped-default `h5` retest is green at `qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-26T01-37-28-769Z/report.json`, and `v8a` runtime-only proof is frozen honestly in `qa_logs/session_captures/v8a-runtime-proof/REPORT.md`. Autosave serialization now defers out of the update tick, cadence-budget-overrun telemetry no longer inflates the main warning count, the strict 40-minute soak is green at `0 warnings / 0 errors / 0 freezeSuspects`, and the local blocker is no longer host-local smoothness. Carry forward only one watch item: the short battle lane still logged 4 freeze suspects inside the five-lane `v8a` pack, so recheck battle inside `v8b` after outside-session triage.
```
