# Next Session Run Packet - 2026-04-29

## Purpose

P0 through P8 of the visual sim-board rebuild are machine-green. The next useful work is not another hidden implementation pass; it is to collect human and outside-session evidence against the promoted sim-board build.

This packet gives the exact order.

```text
+====================================================================+
|| Current Gate                                                       ||
+====================================================================+
|| completed machine work | P0 through P8                             ||
|| remaining local gate   | G0-bar human visual/naturalness signoff   ||
|| remaining share gate   | C9 / R4 outside-session triage evidence   ||
|| do not start yet       | C10 full-stack proof / C11 alpha freeze    ||
+====================================================================+
```

## Build Context

```text
branch       : codex/milestone-freeze-playtest
base commit  : c87f98b
local url    : http://127.0.0.1:3000/
LAN url      : http://<host-ip>:3000/
render mode  : sim-board promoted by default
legacy mode  : section-scenes retained for one release-cycle comparison
```

Relevant proof reports:

- `docs/P7-SIM-BOARD-PROMOTION-REPORT-2026-04-29.md`
- `docs/P8-ML-TRACE-CAPTURE-REPORT-2026-04-29.md`
- `docs/STAGE-A-G0-SIGNOFF-2026-04-29.md`
- `docs/EXTERNAL-PLAYTEST-MATRIX.md`
- `PLAYTEST.md`
- `PLAYTEST-FEEDBACK.md`

## Exact Order

```text
next work
|- 1. checkpoint current P0-P8 work before collecting more evidence
|- 2. run G0-bar local human signoff
|  |- duration: 20 continuous minutes
|  |- save: real lived-in save
|  |- evidence: optional Start Capture -> Export Capture
|  `- record result in docs/STAGE-A-G0-SIGNOFF-2026-04-29.md
|
|- 3. if G0-bar closes, run M2 same-LAN desktop Chromium
|  |- use http://<host-ip>:3000/ from a second desktop/laptop
|  |- complete the core path from docs/EXTERNAL-PLAYTEST-MATRIX.md
|  |- collect PLAYTEST-FEEDBACK.md
|  `- copy actionable issues only into docs/PLAYTEST-TRIAGE-LOG.md
|
|- 4. triage anything real from G0/M2
|  |- blocker -> fix narrowly and rerun affected audit
|  |- confusion -> docs/onboarding/readability issue
|  |- performance -> capture-backed runtime issue
|  `- non-blocker -> known issue, not a rebuild trigger
|
`- 5. only after C9/R4 evidence is honest, start C10 v8b full-stack proof
```

## G0-Bar Local Signoff

Use:

- `docs/STAGE-A-G0-SIGNOFF-2026-04-29.md`

What it decides:

```text
Stage A
|- G1 spatial readability
|- G2 live building behavior
`- G3 movement naturalness
```

Minimum pass:

- no obvious pseudo-3D contradiction in ordinary play
- blocks, flowers, butterflies, carry/cover/stack states read coherently
- building feels intentional enough to keep developing, not broken
- movement does not snap, zoom, teleport, or route awkwardly in normal play

If held:

- name the blocker
- classify it as implementation, acceptance, proof, or outside-evidence gap
- open the smallest named contradiction rather than reopening the whole spatial rebuild

## M2 Same-LAN Outside Session

Use:

- `docs/EXTERNAL-PLAYTEST-MATRIX.md`
- `PLAYTEST.md`
- `PLAYTEST-FEEDBACK.md`

Required flow:

```text
M2 outside session
|- reach URL from a second desktop Chromium browser
|- start title -> garden
|- use Inspect / Feed / Journal / Access
|- try save / load
|- play normally long enough to notice confusion or breakage
|- export capture if the host can use debug tools comfortably
`- record feedback before discussing fixes
```

Promotion rule:

- do not mark M2 validated until feedback exists
- do not close R4 from vibes
- only actionable findings go into `docs/PLAYTEST-TRIAGE-LOG.md`

## What Not To Do Next

```text
do not
|- start another map/3D rebuild without a named contradiction
|- reopen frozen spatial, ML, or life-sim contracts from general unease
|- rename drive/emotion/memory/social families
|- change save schema without a migration phase
|- chase pre-fix benchmark numbers
`- call public alpha frozen before C9 and C10 are both green
```

## Ready-To-Use Local Session Prompt

```text
I am running the Papilionem G0-bar local signoff for the promoted sim-board build.

Build:
- branch: codex/milestone-freeze-playtest
- base commit: c87f98b
- URL: http://127.0.0.1:3000/
- signoff sheet: docs/STAGE-A-G0-SIGNOFF-2026-04-29.md

Please play for at least 20 continuous minutes on the real lived-in save. Watch G1 spatial readability, G2 building behavior, and G3 movement naturalness. If debug tools are comfortable, start a capture before play and export it after play. Record close/hold decisions directly in the signoff sheet. If anything holds, name the blocker and classify it as implementation, acceptance, proof, or outside-evidence gap.
```

## Ready-To-Use M2 Prompt

```text
I am running the Papilionem M2 same-LAN outside session.

Build:
- host branch: codex/milestone-freeze-playtest
- base commit: c87f98b
- target: desktop Chromium on a second machine
- URL: http://<host-ip>:3000/
- feedback sheet: PLAYTEST-FEEDBACK.md
- matrix: docs/EXTERNAL-PLAYTEST-MATRIX.md

Please try to reach the URL, start the game, reach the garden, use Inspect / Feed / Journal / Access, try save/load, and play normally long enough to notice confusion or breakage. If debug tools are comfortable, use Start Capture before play and Export Capture after play. Record feedback before discussing fixes. Only actionable issues should later be copied into docs/PLAYTEST-TRIAGE-LOG.md.
```
