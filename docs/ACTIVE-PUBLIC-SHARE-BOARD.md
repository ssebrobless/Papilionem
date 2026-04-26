# Papilionem Active Public-Share Board

## Purpose

This board sequences the work needed to move Papilionem from a frozen internal
baseline to a public-share-ready build.

This track is not about inventing new core simulation systems.
It is about making the existing game:

- easier to launch
- easier to understand in the first session
- safer to hand to outside testers
- easier to freeze as a public alpha

Read this together with:

- [PUBLIC-SHARE-READINESS-ROADMAP.md](./PUBLIC-SHARE-READINESS-ROADMAP.md)
- [ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md](./ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md)
- [PLAYTEST-FOLLOWUP-ROADMAP.md](./PLAYTEST-FOLLOWUP-ROADMAP.md)
- [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md)
- [ACTIVE-RUNTIME-HARDENING-BOARD.md](./ACTIVE-RUNTIME-HARDENING-BOARD.md)
- [RUNTIME-HARDENING-ROADMAP.md](./RUNTIME-HARDENING-ROADMAP.md)
- [EXTERNAL-PLAYTEST-MATRIX.md](./EXTERNAL-PLAYTEST-MATRIX.md)
- [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)
- [README.md](./README.md)
- [../README.md](../README.md)
- [../PLAYTEST.md](../PLAYTEST.md)
- [../PLAYTEST-FEEDBACK.md](../PLAYTEST-FEEDBACK.md)
- [ACTIVE-EXPANSION-BOARD.md](./ACTIVE-EXPANSION-BOARD.md)

## Current Shareability Shape

```text
+=================================================================================+
| Public-Share Readiness                                                          |
+=================================================================================+
| current runtime baseline              | frozen clean                            |
| local-host playtest build             | validated on host-local Windows+Chrome  |
| first-session onboarding              | live lightweight quick-start            |
| outside-tester matrix                 | live, with documented intake path       |
| stranger-safe public alpha            | waiting on real outside sessions        |
+=================================================================================+
```

```text
phase order

r1 -> r2 -> r3 -> r4 -> r5
```

## Status Key

```text
live
|- phase landed and current docs/proof agree

active
|- current phase

gated
`- cannot close until upstream evidence exists
```

## Invariants

```text
always preserve
|- the frozen repair / polish / implementation / expansion baselines stay green
|- this board hardens sharing and usability before it broadens scope
|- startup instructions must match the real launch path exactly
|- player-facing docs must match the real button-first shell exactly
|- onboarding should explain current truth, not an imagined future shell
|- bug fixes should prefer the smallest reversible change
`- no deferred dream-feature work belongs on this board
```

## Phase Ladder

| Phase | Status | Goal | Primary owners | Proof gate |
| --- | --- | --- | --- | --- |
| `r1 startup/package sanity` | `live` | make the repo surface, startup scripts, launch docs, and local-host instructions truthful and easy to follow | `package.json`, `server.js`, `README.md`, `PLAYTEST.md`, `docs/`, `scripts/` | launch path works from the documented commands, root/docs maps agree, and source-book rebuild stays green |
| `r2 first-session onboarding` | `live` | make the first five minutes understandable without a developer walking alongside the player | `ui/gameUI.js`, `ui/debugUI.js`, `docs/PAPILIONEM-PLAYER-GUIDE.md`, `PLAYTEST.md` | new-player start path is readable, `r4` stays green, and core shell docs match the live onboarding path |
| `r3 external playtest matrix` | `live` | define supported baseline environments, outside-tester flow, and useful feedback collection | `PLAYTEST.md`, `PLAYTEST-FEEDBACK.md`, `README.md`, `docs/` | tester matrix exists, feedback template is actionable, and at least one outside-tester path is documented cleanly |
| `r4 feedback triage + readability hardening` | `active` | fix the highest-value confusion, friction, and breakage issues found by real players | `runtime files as needed`, `docs/`, `scripts/`, `PLAYTEST-TRIAGE-LOG.md` | blocker bugs are closed, top confusion points are addressed, and the affected regression stack stays green |
| `r5 public alpha freeze` | `gated` | freeze a public-facing alpha baseline with known-issues framing, launch guidance, and a final audit sweep | `docs/`, `scripts/`, `README.md`, `PLAYTEST.md` | final release-readiness sweep is green, docs are aligned, and the source book rebuilds cleanly |

## Current Focus

```text
current focus
`- r4 feedback triage + readability hardening
```

Current blocker:

- host-local runtime proof is now locally green on the committed long-running
  save through the frozen `v7` stack, so the remaining blocker is not a local
  freeze/lag emergency anymore
- real outside play sessions still need to run through the `M2`+ lanes in
  [EXTERNAL-PLAYTEST-MATRIX.md](./EXTERNAL-PLAYTEST-MATRIX.md)
- local intake is ready, but `r4` still cannot close until the runtime-only
  proof pack is frozen honestly; `v8a` is now frozen live at
  `qa_logs/session_captures/v8a-runtime-proof/REPORT.md`, so the remaining
  blocker is outside-session evidence plus the later `v8b` full-stack proof

Next exact move:

- run one real `M2` same-LAN desktop Chromium session on the frozen `v8a`
  stack
- collect [../PLAYTEST-FEEDBACK.md](../PLAYTEST-FEEDBACK.md)
- if the host is comfortable with debug tools, export one session capture
- copy only actionable issues into [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)
- if no blocker appears, advance to the next outside lane and keep `r4`
  active until outside evidence is broad enough to support `r5`

`r4` support tooling now live:

- structured session-capture export now exists so local and outside test runs can be reviewed after play without depending on manual note-taking alone
- exported-save retesting is now live too: `Export Save` writes the current browser world into `qa_logs/save_exports`, and `run-h5-long-running-save-smoothness-audit.js` can replay that exact world in a fresh audit browser context
- the remaining local-playtest follow-up work is now being executed through [ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md](./ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md) in the exact order recorded by [PLAYTEST-FOLLOWUP-ROADMAP.md](./PLAYTEST-FOLLOWUP-ROADMAP.md)
- the remaining sustained lag/smoothness work is now sequenced through [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md) and [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md); the canonical lived-in baseline is live, `v7` visual restoration is frozen, and `v8a` runtime-only proof is now frozen honestly while `v8b` waits behind outside-session triage

Fresh local `M1` triage now holding:

- session-capture export is now live for local and outside freeze/stutter review
- high-DPI freeze hardening now clamps oversized windows, backs off expensive background atmosphere and butterfly sprite smoothing earlier under pressure, and keeps a bad render frame from collapsing into a black screen
- host-local runtime hardening has now closed `h1` through `h4` with attributed capture export, slimmer render presentation, cached structure rebuilds, cached shell text/layout work, lighter journal redraw cadence, UI-layer redraw discipline, and battle-aware teaching cadence; the imported-save fixture lane is green, the real lived-in `h5` lane is green, and the frozen local runtime stack is now live through `v7`
- long-running saves now survive refresh-aware block/runtime fixes without forcing a reset, and active doorway travel survives roundtrip cleanly
- the battle shell no longer leaves the garden feed visible behind combat
- battle presentation now uses a minimal field-first shell with in-field HP bars instead of side roster slabs
- battle pacing now opens from back-line release positions and stays visible long enough for ability traces to read cleanly
- the shell retest lane now confirms inspect `All`, inspect clearing, doorway travel, feed cleanup, and trail toggling all still hold after the save/runtime fixes
- the social follow-up lane now has threaded talk exchanges, richer low-stakes casual conversation, pair-mode surfacing, and proven later relationship/life-sim follow-through
- the older local playtest follow-up board has now closed `f1` through `f9`, and the remaining local blocker has been split cleanly into the new runtime-hardening track plus the later `f10` outside-session handoff
- `run-f3-long-running-save-regression-audit.js`, `run-f4-shell-followup-audit.js`, `run-r5-battle-presentation-audit.js`, `run-single-player-autobattle-audit.js`, and `run-r4-ui-readability-audit.js` are green on that repaired shell/runtime baseline

Current intake path:

- [../PLAYTEST.md](../PLAYTEST.md)
- [../PLAYTEST-FEEDBACK.md](../PLAYTEST-FEEDBACK.md)
- [EXTERNAL-PLAYTEST-MATRIX.md](./EXTERNAL-PLAYTEST-MATRIX.md)
- [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)
