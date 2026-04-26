# Papilionem Public-Share Readiness Roadmap

## Purpose

This roadmap turns "we should be able to share this" into one concrete closure
path.

It sits on top of the frozen runtime baseline and answers:

```text
what must be true before wider sharing
what order those fixes should land in
what counts as local-host-ready versus public-alpha-ready
which proofs should block release-facing claims
```

The exact remaining local-playtest implementation order now lives in:

- [ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md](./ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md)
- [PLAYTEST-FOLLOWUP-ROADMAP.md](./PLAYTEST-FOLLOWUP-ROADMAP.md)
- [ACTIVE-RUNTIME-HARDENING-BOARD.md](./ACTIVE-RUNTIME-HARDENING-BOARD.md)
- [RUNTIME-HARDENING-ROADMAP.md](./RUNTIME-HARDENING-ROADMAP.md)

## Program Shape

```text
frozen game baseline
|- repair / parity closed
|- player-facing polish closed
|- implementation board closed
|- expansion board closed
`- final grand-plan audit passed
        |
        v
public-share readiness
|- r1 startup/package sanity
|- r2 first-session onboarding
|- r3 external playtest matrix
|- r4 feedback triage + readability hardening
`- r5 public alpha freeze
```

## Release Levels

```text
current levels
|- internal frozen baseline
|  `- already reached
|- local-host shareable playtest
|  `- reached on the validated host-local Windows + Chromium lane
|- wider public alpha
|  `- waiting on outside sessions plus triage
`- beyond-alpha expansion
   `- separate future boards only
```

## R1 - Startup / Package Sanity

Status:
- `live`

```text
goal
|- make startup truthful
|- make the repo landing page match the live shell
|- make the local-host share path explicit
`- remove obvious launch / control / doc drift
```

Owners:

- `package.json`
- `server.js`
- `README.md`
- `PLAYTEST.md`
- `docs/README.md`
- `docs/source-book/book-manifest.json`

Implementation notes:

- the documented launch path should be one short command set, not multiple competing stories
- root README control notes must match the live button-first runtime
- the playtest doc should clearly distinguish host-local access from same-LAN access
- this phase should not over-promise browser/device support that has not been proved yet
- if the runtime launch path is already technically fine, fix the documentation drift first

Proof gate:

- documented launch path works in the current environment
- local HTTP endpoint responds from the documented command path
- root README, playtest doc, and docs map agree
- source-book rebuild stays green

Exit condition:

- a collaborator can clone, install, launch, and reach the garden without asking what command or URL to use

Closed state:

- `npm run playtest` launches cleanly from the documented path
- the host URL and same-LAN URL are both documented clearly
- root/docs maps now point at the public-share track directly
- the live controls summary matches the button-first shell and current debug keys

## R2 - First-Session Onboarding

Status:
- `live`

```text
goal
|- make the first five minutes readable
|- teach the shell through the shell
`- reduce reliance on external explanation
```

Owners:

- `ui/gameUI.js`
- `ui/debugUI.js`
- `docs/PAPILIONEM-PLAYER-GUIDE.md`
- `PLAYTEST.md`

Implementation notes:

- teach the current loop: read the garden, use Inspect/Feed/Journal, understand release, understand battle
- avoid building a heavy tutorial layer unless lighter guidance fails
- prefer concise prompts, highlighted first actions, and clearer labels over large modal walls

Proof gate:

- new-player start path can be followed without debug knowledge
- `run-r4-ui-readability-audit.js` stays green
- player-facing docs match the live onboarding path

Exit condition:

- a new player can start, inspect a butterfly, read the feed, open the journal, and understand the main loop without coaching

Closed state:

- the garden now shows a lightweight quick-start card on first entry
- the card auto-hides and persists dismissal once the player uses real shell surfaces
- the player guide now explains that first-session helper explicitly

## R3 - External Playtest Matrix

Status:
- `live`

```text
goal
|- define what environments and testers we actually support
|- make feedback collection useful
`- turn "share it around" into a repeatable process
```

Owners:

- `PLAYTEST.md`
- `PLAYTEST-FEEDBACK.md`
- `README.md`
- `docs/README.md`
- `docs/EXTERNAL-PLAYTEST-MATRIX.md`

Implementation notes:

- define the validated baseline clearly, then expand only with evidence
- include browser, OS, device class, and whether the tester is local-host or same-LAN
- feedback should capture friction, confusion, bugs, and beauty separately

Proof gate:

- tester matrix exists
- feedback template is concise and actually useful
- one clean outside-tester flow is documented from install to report-back

Exit condition:

- an outside tester has a clear, repeatable path from "I got the build" to "here is actionable feedback"

Closed state:

- the environment matrix now distinguishes `validated`, `prepared`, and `queued` lanes
- host-local Windows + Chromium is the current proved path
- same-LAN and broader browser/device lanes are documented without being over-claimed
- the feedback template now captures startup mode, URL used, and first blocker cleanly

## R4 - Feedback Triage + Readability Hardening

Status:
- `active`

```text
goal
|- fix the biggest real-user problems
`- freeze only after outside friction is addressed
```

Owners:

- `runtime files as needed`
- `docs/`
- `scripts/`
- `docs/PLAYTEST-TRIAGE-LOG.md`

Implementation notes:

- prioritize crashes, broken saves, impossible flows, severe confusion, and misleading shell copy
- do not disappear into speculative polish when real-user blockers are still open
- every fix should widen or rerun the relevant audit path
- classify incoming outside findings by lane, bucket, severity, and reproduction clarity before changing code
- do not invent blocker fixes locally that are not backed by real outside-session evidence
- a structured session-capture export is now live as support tooling for `r4` triage because it improves evidence quality without broadening product scope
- the remaining local-playtest follow-up work now has an exact implementation order, with freezing first, in [PLAYTEST-FOLLOWUP-ROADMAP.md](./PLAYTEST-FOLLOWUP-ROADMAP.md)
- the still-open host-local lag and smoothness work now has its own exact implementation order in [RUNTIME-HARDENING-ROADMAP.md](./RUNTIME-HARDENING-ROADMAP.md)

Proof gate:

- top blocker issues from external playtests are closed or explicitly documented as known issues
- affected audits stay green
- player-facing docs remain aligned

Exit condition:

- there are no major unresolved issues that would make a stranger bounce immediately

Current blocker:

- `r4` now has its intake structure, but it still needs real sessions from the
  prepared/queued lanes in [EXTERNAL-PLAYTEST-MATRIX.md](./EXTERNAL-PLAYTEST-MATRIX.md)
  before it can close honestly
- local `M1` self-test findings are still worth landing when they are clear,
  and the current battle-shell clutter/pacing repairs now hold green through
  `r5`, `single-player-autobattle`, `r4`, and `runtime-self`
- host-local smoothness is still an active blocker, but the runtime-hardening
  track has now closed `h1` through `h4`, and the `h5` imported-save fixture
  proof is now green; the remaining honest gate is rerunning that same path on
  the real lived-in save instead of only the current fixture export
- the local follow-up ladder has now closed `f1` through `f9`, which means the
  capture tooling, freeze hardening, save-refresh seam, repaired shell,
  threaded talk surfacing, deeper casual relationship layer, material visibility,
  and remaining flower/spatial scope locks all hold before outside-session
  evidence becomes the next honest gate

## R5 - Public Alpha Freeze

Status:
- `gated`

```text
goal
|- freeze a public-facing alpha baseline
|- state what the build is and is not
`- stop confusing "playable" with "unboundedly ready"
```

Owners:

- `README.md`
- `PLAYTEST.md`
- `docs/`
- `scripts/`

Implementation notes:

- include a known-issues list if needed
- keep the scope honest: this is about a public alpha, not "the ultimate final version"
- freeze against the current runtime, not deferred future expansion ideas

Proof gate:

- release-readiness sweep is green
- final doc pass is green
- source-book rebuild is green

Exit condition:

- the project can be publicly shared as an alpha without the docs or launch path misleading people
