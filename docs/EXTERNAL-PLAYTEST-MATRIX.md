# Papilionem External Playtest Matrix

## Purpose

This document turns outside playtesting into a repeatable matrix instead of an
informal "send the build around" step.

Use it together with:

- [../PLAYTEST.md](../PLAYTEST.md)
- [../PLAYTEST-FEEDBACK.md](../PLAYTEST-FEEDBACK.md)
- [ACTIVE-PUBLIC-SHARE-BOARD.md](./ACTIVE-PUBLIC-SHARE-BOARD.md)
- [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)

## Status Key

```text
validated
|- passed in a real session

prepared
|- launch path exists and is documented, but still needs a real session

queued
|- intended test lane, not yet run

not targeted
`- explicitly outside the current public-share goal
```

## Current Baseline

```text
validated now
|- host-local launch
|  |- npm install
|  |- npm run playtest
|  `- http://127.0.0.1:3000/
|- runtime shell
|  |- title start
|  |- button-first controls
|  |- quick-start card
|  `- debug optional
`- baseline environment
   |- Node 18+
   `- desktop Chromium-family browser
```

## Intake Path

Record sessions in this order:

- launch with [../PLAYTEST.md](../PLAYTEST.md)
- if the host can use debug tools comfortably, run `Start Capture` before play and `Export Capture` after play
- capture observations in [../PLAYTEST-FEEDBACK.md](../PLAYTEST-FEEDBACK.md)
- promote actionable issues into [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)

## Immediate Next Lane

```text
next required outside proof
|- lane        -> M2 same-LAN desktop Chromium
|- host build  -> frozen `v8a` runtime stack
|- required    -> one real session reaching garden + core interaction path
|- collect     -> PLAYTEST-FEEDBACK.md
|- optional    -> Start Capture / Export Capture if the host can drive debug tools comfortably
`- after run   -> copy only actionable issues into PLAYTEST-TRIAGE-LOG.md
```

## Environment Matrix

| Lane | Target | Status | What to prove | Notes |
| --- | --- | --- | --- | --- |
| `M1` | host-local Windows + Chromium | `validated` | install, launch, title start, top-right shell, Inspect/Feed/Journal/Access, save/load, battle entry | current strongest proved path |
| `M2` | same-LAN desktop Chromium | `prepared` | second-device connection using `http://<host-ip>:3000/`, normal play loop, save/load, feedback submission | server now prints LAN URLs, but still needs a real second-device session |
| `M3` | same-LAN desktop Edge | `queued` | full local-host-share flow plus shell readability parity | likely near Chromium path, but not yet proved |
| `M4` | same-LAN desktop Firefox | `queued` | startup, shell layout, rendering correctness, save/load, battle readability | explicitly verify no browser-specific rendering regressions |
| `M5` | same-LAN macOS Safari | `queued` | title start, shell controls, accessibility readability, save/load, battle shell | important if broader non-Chromium sharing is desired |
| `M6` | same-LAN iPhone Safari | `queued` | touch startup, readability, basic shell use, viewport fit | only worth promoting if mobile sharing becomes part of alpha scope |
| `M7` | same-LAN Android Chrome | `queued` | touch startup, readability, shell fit, general stability | secondary mobile lane |
| `M8` | public internet hosting | `not targeted` | deployment hardening, remote hosting, public URL ownership | outside the current local-host/public-alpha scope |

## Required Test Flow

Every real outside session should cover:

```text
1. launch
   |- could the tester reach the URL?
   `- did the title screen transition cleanly?

2. first five minutes
   |- did the quick-start shell help?
   |- could they find Inspect / Feed / Journal / Access?
   `- did they understand what to do next?

3. core interaction
   |- read the garden
   |- inspect a butterfly
   |- open the feed
   |- open the journal
   `- try accessibility controls

4. stability
   |- save
   |- load
   |- export session capture if debug was available
   |- verify roundtrip if comfortable
   `- note any visual or startup failures

5. optional advanced pass
   |- debug presets
   |- battle shell
   `- feedback handoff
```

## Failure Buckets

Classify outside findings into one of these buckets first:

```text
startup
onboarding
readability
save/load
battle
browser-specific
performance
known-issue / non-blocking
```

## Promotion Rule

Do not call a lane `validated` until:

- the tester used the documented launch path
- the session reached the garden successfully
- the tester completed the core interaction path
- feedback was captured in the template
- actionable blockers were copied into the triage log when present

Until then, use `prepared` or `queued`, not `validated`.
