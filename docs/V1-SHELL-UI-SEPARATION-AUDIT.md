# V1 Shell-UI Separation Audit

```text
v1 shell-ui separation
├─ feed DOM slice        -> live
├─ access DOM slice      -> live
├─ inspect DOM slice     -> live
├─ journal DOM slice     -> live
├─ debug DOM slice       -> live
├─ eventBus action path  -> preserved
├─ canvas garden input   -> preserved
└─ closure state         -> earned on canonical post-s3 save
```

## Intent Held

- move shell-heavy panels off the canvas UI path
- preserve button-first shell behavior and garden ownership
- improve shell readability without flattening the scene

## Canonical Proof Surface

- baseline:
  `qa_logs/session_captures/v0-baseline/2026-04-22T22-11-18-179Z/`
- candidate:
  `qa_logs/session_captures/v1-shell-ui-smoke/2026-04-23T04-16-03-452Z/`
- canonical diff:
  [diff-vs-post-s3-canonical-baseline.md](../qa_logs/session_captures/v1-shell-ui-smoke/2026-04-23T04-16-03-452Z/diff-vs-post-s3-canonical-baseline.md)

## Earned Result

```text
against canonical post-s3 baseline
├─ shell avgRenderMs   32.08 -> 26.07   (-18.7%)
├─ shell p95FrameMs    72.10 -> 57.00   (-20.9%)
├─ travel avgRenderMs  35.08 -> 25.73   (-26.6%)
├─ travel p95FrameMs   74.00 -> 58.40   (-21.1%)
├─ shell uiRedrawCount 7275  -> 22      (-99.7%)
└─ travel uiRedrawCount 4268 -> 28      (-99.3%)
```

The refined `-30% shell avgRenderMs` stretch target was not fully reached, but
the active board gate was met: shell-heavy lanes are materially cheaper on the
committed lived-in save while readability holds and input ownership stays
correct.

## Default-On State

```text
live default
|- performance.flags.shellUiDom -> true
|- DOM-owned shell panels       -> feed / access / inspect / journal / debug
|- canvas-owned shell remains   -> top HUD, save pills, garden interaction
`- retained fallback            -> canvas panel path still exists for proof/regression checks
```

## Kept Boundaries

- `gameUI` still owns shell state, button actions, and save status truth
- `debugUI` still owns debug state and debug actions
- DOM panels remain presentation-only
- battle HUD remains canvas-owned in this phase

## Rejected Branch

```text
tested then reverted
└─ DOM top HUD (button bar + save pills)
   ├─ looked promising as a shell-only follow-up
   ├─ regressed the canonical quick proof path
   └─ was removed before phase closure
```

That branch is not part of the shipped `v1` result. Canvas top buttons and save
status remain the live path.

## Next Runtime Pressure

```text
remaining blocker after v1
└─ v2 memory-growth audit + leak closure
   ├─ canonical long-session heap growth still needs attribution
   ├─ freeze-risk confidence still depends on soak evidence
   └─ creature-visual restoration stays gated behind that work
```
