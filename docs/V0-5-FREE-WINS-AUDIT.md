# V0.5 Free-Wins Audit

## Purpose

This is the closure note for the `v0.5` runtime phase.

```text
v0.5
├─ seam audit                 -> proves the flags really wire into the runtime
├─ post-s3 quick baseline     -> re-taken with the flags forced back off
├─ post-s3 quick compare      -> measures the same save with the flags forced on
└─ rollback rule              -> if the compare regresses, defaults stay off
```

`v0.5` is now locally closed:
- all four flags were verified individually against the post-`s3` quick baseline
- every regressing flag remains default-off under the `P8` rollback rule
- save migration was proven on the committed lived-in save and on one derived
  second real save export

## Live Runtime State

```text
implemented
├─ pauseWhenHidden
├─ asyncImageDecode
├─ telemetryRingCap
└─ textMeasureCache

default state
└─ all four flags remain default-off in core/config.js
```

Reason:
- the dedicated seam audit passed
- the full all-on compare regressed visible-frame lanes
- the one-flag isolation pass proved no flag clean enough to justify a
  default-on flip yet
- per the `P8` rollback rule, defaults stay off until a later diff proves a
  specific flag safe to re-enable

## Evidence

### 1. Dedicated seam audit

```text
proof lane
├─ flag overrides live         -> pass
├─ async decode mode           -> pass
├─ pause / resume hidden tab   -> pass
├─ telemetry ring caps         -> pass
├─ text-measure cache          -> pass
└─ IndexedDB-backed save read  -> pass
```

Artifacts:
- [report.json](../qa_screenshots/v0_5_free_wins_audit/2026-04-22T21-20-36-620Z/report.json)

### 2. Post-s3 quick baseline with flags off

```text
baseline
└─ qa_logs/session_captures/v0-baseline/2026-04-22T21-29-05-105Z
```

Artifacts:
- [summary.json](../qa_logs/session_captures/v0-baseline/2026-04-22T21-29-05-105Z/summary.json)
- [report.json](../qa_logs/session_captures/v0-baseline/2026-04-22T21-29-05-105Z/report.json)

### 3. Post-s3 quick candidate with all four runtime flags on

```text
candidate
└─ qa_logs/session_captures/v0.5-free-wins/2026-04-22T21-26-17-254Z
```

Artifacts:
- [summary.json](../qa_logs/session_captures/v0.5-free-wins/2026-04-22T21-26-17-254Z/summary.json)
- [report.json](../qa_logs/session_captures/v0.5-free-wins/2026-04-22T21-26-17-254Z/report.json)
- [diff-vs-post-s3-baseline.md](../qa_logs/session_captures/v0.5-free-wins/2026-04-22T21-26-17-254Z/diff-vs-post-s3-baseline.md)

## Honest Read

```text
best results
├─ shell render      -> slightly improved
├─ travel p95/p99    -> improved
└─ seam wiring        -> proven

remaining regressions
├─ calm update/render -> worse
├─ battle p50/p95     -> worse
└─ soak render         -> slightly worse
```

That is not good enough to claim that any `v0.5` runtime flag has earned
default-on status.

### 4. One-flag isolation

```text
single-flag isolates
├─ pauseWhenHidden     -> foreground lanes not clean enough to flip on
├─ asyncImageDecode    -> battle/soak improve, calm/shell regress
├─ telemetryRingCap    -> near-neutral, but not clean enough to call earned
└─ textMeasureCache    -> clearest repeatable regressor
```

Artifacts:
- [SUMMARY.md](../qa_logs/session_captures/v0.5-flag-isolation/2026-04-22T21-36-57-211Z/SUMMARY.md)
- [report.json](../qa_logs/session_captures/v0.5-flag-isolation/2026-04-22T21-36-57-211Z/report.json)

### 5. Save migration on a second real save

```text
save proof
├─ committed lived-in export      -> restored and saved through IndexedDB
└─ derived second real save export -> restored and saved through IndexedDB
```

Artifacts:
- [report.json](../qa_screenshots/v0_5_save_migration_proof/2026-04-22T21-44-28-634Z/report.json)

## Phase Result

```text
v0.5 closure
├─ implemented seams      -> live
├─ default-on flips       -> none earned yet
├─ save migration proof   -> live
└─ runtime state          -> safe to proceed with all four flags still default-off
```

## Next Exact Move

```text
next runtime blocker
└─ post-s3 full-duration baseline rerun
   ├─ closes the remaining `v0` gap
   ├─ closes the remaining review-gate gap
   └─ only then allows `v1` to become the active runtime phase
```
