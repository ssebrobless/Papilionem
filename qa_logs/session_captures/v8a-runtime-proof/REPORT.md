# V8a Runtime-Only Proof Report

## Purpose

This report is the runtime-only closeout packet for `v8a`.

It judges the frozen lived-in-save runtime stack after:

```text
v4 cadence live
   |
   v
v5 composite stack live
   |
   v
v6 worker groundwork frozen default-off
   |
   v
v7 visual restoration live
```

with spatial `s8` and social `n8` held frozen on the same save.

## Live Runtime Shape Under Proof

```text
live runtime stack
|- shellUiDom                 -> on
|- retained 18/36/30 cadence  -> on
|- compositeDirtyRegions      -> on
|- compositeNativeDraw        -> on
|- compositeBlocksLayer       -> on
|- compositeBlocksLayerReuse  -> on
|- bakedFlowerHeads           -> on
|- bakedCreatureSprites       -> on
|- trails shipped default     -> off
|- trails available           -> reduced / full
`- workerOffload              -> off by default
```

## Frozen Live Evidence Before Closeout

```text
shipped-default hold (no overrides)
|- report -> ../../qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-26T01-37-28-769Z/report.json
|- result -> pass
|- calm   -> 6.29 / 12.51
|- shell  -> 8.33 / 12.08
`- travel/save/load/battle -> pass
```

```text
reduced trails
|- report -> ../../qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T22-46-43-006Z/report.json
|- result -> pass
|- calm   -> 6.56 / 12.96
|- shell  -> 10.60 / 13.08
`- ratio  -> calm render 0.97x off-baseline
```

```text
full trails
|- report -> ../../qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T22-44-10-129Z/report.json
|- result -> pass
|- calm   -> 6.89 / 13.13
|- shell  -> 9.81 / 12.77
`- ratio  -> calm render 0.98x off-baseline
```

```text
guardrails
|- sharp-creature parity -> ../../qa_screenshots/v3_sprite_parity_audit/2026-04-25T22-42-38-064Z/report.json -> pass
|- readability          -> ../../qa_screenshots/r4_ui_readability_audit/2026-04-25T22-45-01-908Z/report.json -> pass
|- spatial truth        -> ../../qa_screenshots/a4_spatial_truth_audit/2026-04-25T04-06-27-885Z/report.json -> pass
`- r5 note              -> control/candidate both fail the same guard-only fixture, so r5 is not the current differentiator
```

## Full Five-Lane Runtime-Only Pack

```text
full runtime-only pack
|- pack   -> ../v8a-runtime-proof/2026-04-26T02-19-35-305Z
|- diff   -> ./diff-vs-v0-full-baseline.md
|- calm   -> render 24.58 -> 12.14 | update 24.17 -> 9.20 | p95 67.10 -> 26.10
|- shell  -> render 32.08 -> 12.55 | update 25.73 -> 7.01 | p95 72.10 -> 26.60
|- travel -> render 35.08 -> 13.38 | update 25.54 -> 12.82 | p95 74.00 -> 30.10
|- battle -> render 43.52 -> 22.70 | update 36.98 -> 16.98 | p95 99.80 -> 61.30
|- soak40 -> render 27.56 -> 13.10 | update 26.34 -> 6.94 | p95 71.60 -> 27.40
`- pressure -> still `critical` in all five full-duration lanes
```

## Warning / Error Summary

```text
pack totals
|- lanes                -> 5
|- warnings             -> 0
|- errors               -> 0
|- freezeSuspects       -> 4
|- runtimeIssueWarnings -> 480
|- telemetryWarnings    -> 6914
`- note                 -> the 4 freeze suspects are confined to the short battle lane, not the 40-minute soak gate
```

```text
soak40 strict gate
|- report         -> ../v8a-runtime-proof/2026-04-26T02-19-35-305Z/summary-soak40.txt
|- warnings       -> 0
|- errors         -> 0
|- freezeSuspects -> 0
|- runtime warns  -> 96 (`cadence-budget-overrun`)
|- telemetry warn -> 2580
`- required gate  -> zero freezeSuspects, zero errors, <= 3 warnings across the 40min soak
```

```text
gate read
|- raw frame-time deltas -> strong pass versus v0
|- strict soak freeze bar -> pass
`- carry-forward watch    -> battle lane still logs 4 freeze suspects; keep that lane watched in `v8b`
```

## No-Flag Regression Hold

```text
no-flag hold (no overrides; shipped defaults)
|- report -> ../../qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-26T01-37-28-769Z/report.json
|- result -> pass
|- calm   -> 6.29 / 12.51
|- shell  -> 8.33 / 12.08
`- note   -> the older all-flags-false control is still useful rollback evidence, but it is stricter than the v8a shipped-default hold
```

## Shared Schema State

```text
cross-track save contract
|- runtime v7 -> signed
|- spatial s7 -> signed
|- social n8  -> signed
`- schema     -> SAVE-SCHEMA-REGISTRY.md @ schemaVersion 4
```

## Honest State

```text
v8a today
|- full five-lane pack      -> on disk
|- v0 diff                  -> on disk
|- warning/error summary    -> explicit
|- shipped-default hold     -> pass
|- runtime stack delta      -> strongly better than v0
|- strict soak freeze bar   -> met
`- freeze status            -> live, frozen honestly for runtime-only proof
```

## Carry-Forward Note

```text
watch, not blocker
|- battle lane still records 4 freeze suspects inside the short five-lane pack
|- soak40 no longer records freeze suspects
`- recheck battle in `v8b` after migrated-save proof and outside-session triage are in the loop
```
