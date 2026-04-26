# Papilionem Active Completion Board

## Purpose

This board collapses the remaining active work into one exact closure ladder.

Use it to answer:

```text
what is still open?
what closes first?
what can run in parallel safely?
what still gates public alpha?
when are we actually done?
```

It does not replace the child boards.
It coordinates them.

Read this with:

- [ACTIVE-PLAN-REGISTRY.md](./ACTIVE-PLAN-REGISTRY.md)
- [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md)
- [ACTIVE-SPATIAL-UNIFICATION-BOARD.md](./ACTIVE-SPATIAL-UNIFICATION-BOARD.md)
- [ACTIVE-SOCIAL-COGNITION-BOARD.md](./ACTIVE-SOCIAL-COGNITION-BOARD.md)
- [ACTIVE-PUBLIC-SHARE-BOARD.md](./ACTIVE-PUBLIC-SHARE-BOARD.md)
- [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md)
- [SPATIAL-UNIFICATION-ROADMAP.md](./SPATIAL-UNIFICATION-ROADMAP.md)
- [PUBLIC-SHARE-READINESS-ROADMAP.md](./PUBLIC-SHARE-READINESS-ROADMAP.md)

## Non-Negotiables

```text
always preserve
|- no performance fix may solve smoothness by gutting the look
|- no core life-sim / social / genetics / battle system gets removed
|- long-running saves stay sacred across every migration and proof pass
|- UI surfaces truth but never owns durable state
|- ML may score choices but never own durable social truth
|- runtime proof must use the real lived-in save, not only fixture worlds
`- public alpha stays gated until both local smoothness and outside evidence are honest
```

## Current Truth

```text
2026-04-25 closure update
|- c1 runtime v3 closure -> live
|  `- retained reduced-bucket battle-only pose slice is now banked as a default-off runtime seam
|- runtime child track   -> live through v7
|  |- c3 runtime v4      -> live as the promoted 18/36/30 cadence slice
|  |- c4 runtime v5      -> live on the promoted clean-shell composite + DOM-guide + baked-flower + idle-HUD reduction stack
|  |- c5 runtime v6      -> live as improved default-off worker groundwork
|  |- c6 runtime v7      -> live with sharp creatures restored and trails back as off/reduced/full
|  |- c7 schema signoff  -> live at `schemaVersion = 4`
|  `- c8 runtime proof   -> now frozen live on the committed lived-in save
|- spatial child track   -> live through s8
|  `- current read       -> `r2`, `b4`, `r7`, `a4`, and `h5` are green, so the board/unit/corridor contract is now frozen honestly
`- social child track    -> live through n8
   `- current read       -> shared save-schema signoff is now recorded jointly at `schemaVersion = 4`
```

```text
2026-04-25 v6/v7 runtime read
|- v6 deferred-trace seam -> best worker cut so far, but still default-off groundwork only
|- v7 visual restoration  -> frozen live
|- h5 off/reduced/full    -> all pass on the lived-in save
|- r4 full-path           -> green
|- v3 parity              -> green
|- r5 note                -> control/candidate both fail the same guard-only fixture, so `r5` was not used as the v7 differentiator
`- next active closure step -> c9 outside-session triage
```

```text
2026-04-26 c8 closeout packet
|- full pack  -> qa_logs/session_captures/v8a-runtime-proof/2026-04-26T02-19-35-305Z
|- diff       -> qa_logs/session_captures/v8a-runtime-proof/diff-vs-v0-full-baseline.md
|- calm       -> render 24.58 -> 12.14 | update 24.17 -> 9.20
|- shell      -> render 32.08 -> 12.55 | update 25.73 -> 7.01
|- travel     -> render 35.08 -> 13.38 | update 25.54 -> 12.82
|- battle     -> render 43.52 -> 22.70 | update 36.98 -> 16.98
|- soak40     -> render 27.56 -> 13.10 | update 26.34 -> 6.94
|- pack totals -> warnings 0 | errors 0 | freezeSuspects 4 | telemetryWarnings 6914
|- soak gate  -> warnings 0 | errors 0 | freezeSuspects 0
|- no-flag hold -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-26T01-37-28-769Z/report.json -> pass
`- honest read -> c8 is now frozen honestly; the next active closure step is c9 outside-session triage
```

```text
remaining active stack
|- runtime child track       -> live through c8
|  `- next runtime gate      -> c10 / v8b after c9 outside-session triage
|- spatial child track       -> live through s8
|- social child track        -> live through n8
`- public-share parent track -> active at r4
   `- r5 is now gated mainly on outside evidence plus the later full-stack proof
```

```text
done does not mean
|- "the game systems exist"
`- "the old boards are frozen"

done does mean
|- runtime track closed through v8a / v8b, with v9 explicitly decided
|- spatial track frozen honestly at s8
|- shared save-schema signoff recorded for v7 / s7 / n8
`- public-share track closed through r5
```

## Status Key

```text
live
|- closure step is frozen honestly

active
|- current closure work

queued
|- next in exact order

gated
`- cannot close honestly until upstream proof exists
```

## Completion Shape

```text
completion ladder
|- c1 runtime v3 closure
|- c2 spatial s8 proof freeze
|- c3 runtime v4 cadence split
|- c4 runtime v5 composite reduction
|- c5 runtime v6 worker offload
|- c6 runtime v7 visual restoration
|- c7 shared save-schema signoff
|- c8 runtime-only proof (v8a)
|- c9 outside-session triage closure (r4)
|- c10 full-stack proof (v8b)
|- c11 public alpha freeze (r5)
`- c12 renderer escalation decision (v9, only if still needed)
```

## Exact Order

| Step | Status | Consumes | Produces | Honest gate |
| --- | --- | --- | --- | --- |
| `c1 runtime v3 closure` | `live` | runtime `v3` live narrowed slice, parity proof, cache attribution | honest close or rollback note for sharp-creature restoration path | runtime `v3` closes without reopening freeze symptoms or visual drift |
| `c2 spatial s8 proof freeze` | `live` | spatial `s0`-`s7` already live | frozen spatial board on the real save | travel, placement, structure, save, and longer lived-in play stay honest on the lived-in save |
| `c3 runtime v4 cadence split` | `live` | `c1`, `n1`, [SIM-CADENCE-CONTRACT.md](./SIM-CADENCE-CONTRACT.md) | smooth visual frame cadence with deep-sim staggering | retained 18/36/30 cadence slice is banked and parity-safe |
| `c4 runtime v5 composite reduction` | `live` | `c2`, `c3`, spatial `s3` already live | materially cheaper composite-heavy lanes | render/composite costs dropped enough to clear `h5` while preserving readability, battle presentation, and spatial truth |
| `c5 runtime v6 worker offload` | `live` | `c3`, `c4` | reduced main-thread contention for non-render work | improved default-off groundwork is landed honestly, even if it is not promoted into the live runtime shape |
| `c6 runtime v7 visual restoration` | `live` | `c1` through `c5` | trails + high-fidelity restoration on a smoother runtime | restored visuals hold on the real lived-in save |
| `c7 shared save-schema signoff` | `live` | `c6`, spatial `s7`, social `n8`, [SAVE-SCHEMA-REGISTRY.md](./SAVE-SCHEMA-REGISTRY.md) | one explicit cross-track migration signoff | runtime `v7`, spatial `s7`, and social `n8` agree on the shared schema state |
| `c8 runtime-only proof (v8a)` | `live` | `c6`, `c7` | clean runtime-only proof on the frozen lived-in save | all required runtime proof lanes hold before outside-proof mixing begins |
| `c9 outside-session triage closure (r4)` | `active` | `c8`, public-share `r4` intake path | outside evidence plus fixed top blockers | real outside findings are triaged, fixed, or honestly documented |
| `c10 full-stack proof (v8b)` | `gated` | `c7`, `c8`, `c9` | migrated-save proof after runtime + spatial + social + triage all coexist | full-stack proof stays green on the migrated lived-in save |
| `c11 public alpha freeze (r5)` | `gated` | `c9`, `c10` | public-share-ready alpha baseline | docs, launch path, known-issues framing, and proof stack all align |
| `c12 renderer escalation decision (v9)` | `gated` | `c10`, `c11` | explicit no-escalation note or a separately opened renderer program | renderer escalation is only opened if the proven post-v8b build still misses the runtime target |

## Parallel-Safe Window

```text
2026-04-25 active overlap
|- c8 runtime-only proof
`- public-share r4 intake / evidence loop
```

```text
safe overlap
|- c8 runtime-only proof
`- public-share r4 intake / evidence loop
   `- safe because the spatial/social contracts are now frozen and the remaining runtime work is proof, not new geometry or social schema churn
```

```text
not safe to skip
|- c3 before c5
|  `- cadence split defines what is worth moving off-thread
|- c6 before c8
|  `- runtime-only proof should judge the intended restored visual state
|- c7 before c8 / c10
|  `- proof cannot pretend the shared save contract is still unsettled
`- c9 before c11
   `- public alpha cannot freeze before real outside blockers are triaged
```

## Finish Conditions

```text
this board closes only when
|- runtime child board is no longer active
|- spatial child board is frozen clean at s8
|- social child board remains live-clean through n8 and is jointly signed at c7
|- public-share board is closed through r5
`- v9 is either explicitly declined or promoted into its own new program
```

## Immediate Next Moves

```text
2026-04-25 next moves
|- keep c2 frozen -> spatial board stays live/frozen unless a later migrated-save proof surfaces a real contradiction
|- keep c7 frozen -> shared save-schema signoff now stays at `schemaVersion = 4` unless a new joint migration is explicitly opened
`- continue c9 -> run the outside-session intake loop and promote any real blocker into `PLAYTEST-TRIAGE-LOG.md`
```

```text
right now
|- keep c2 frozen -> the spatial board/unit/corridor contract is now live through s8
|- keep c4 frozen -> the runtime composite/present/HUD stack is now live through v5
|- keep c6 frozen -> sharp creatures are live again and trails are back as off/reduced/full with off shipped by default
|- keep c7 frozen -> schemaVersion 4 is now the signed shared save contract for runtime/spatial/social
`- continue c9 -> close the first real outside-session triage loop before `v8b` full-stack proof
```
