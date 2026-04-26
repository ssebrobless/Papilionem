# Papilionem Baseline Ledger

## Purpose

This document is the canonical home for the `v0` lived-in-save baseline.

```text
baseline flow
real lived-in save export
        │
        ▼
run `node scripts/run-v0-baseline.js`
        │
        ▼
qa_logs/session_captures/v0-baseline/<stamp>/
        │
        ├─ capture-calm.json
        ├─ capture-shell.json
        ├─ capture-travel.json
        ├─ capture-battle.json
        ├─ capture-soak40.json
        └─ diff-vs-baseline.md   (for later phases)
```

## Current Status

```text
v0 baseline
├─ harness scripts               -> live
├─ compare script                -> live
├─ fixture smoke                 -> live
├─ real lived-in save export     -> live
├─ real-save import path         -> live
├─ quick five-lane real-save run -> live
├─ pre-s3 canonical full-duration -> historical
├─ post-s3 quick recapture         -> live
└─ post-s3 canonical full-duration -> live
```

## Required Inputs

- `qa_logs/save_exports/<real-lived-in-save>/save.json`
- [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md)
- [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md)

## Closure Conditions

`v0` only closes when all of the following are true:

1. the baseline run used a real lived-in save export, not the fixture world
2. all five capture lanes exist on disk
3. the saved captures include frame percentiles, composite calls per frame,
   redraw counts, and heap milestone data where available
4. the baseline directory is linked below
5. the review-gate checklist in the refined plan can point back here

Those conditions are now satisfied for the post-`s3` runtime baseline.

## Baseline Runs

```text
fixture smoke only
└─ [2026-04-21T21-47-27-533Z](../qa_logs/session_captures/v0-baseline/2026-04-21T21-47-27-533Z)
   ├─ save kind        -> fixture export
   ├─ purpose          -> harness validation only
   ├─ calm             -> update 3.01ms | render 10.73ms | p95 14.70ms
   ├─ shell            -> update 2.57ms | render 14.67ms | p95 22.00ms
   ├─ travel           -> update 4.04ms | render 15.97ms | p95 27.50ms
   ├─ battle           -> update 4.60ms | render 12.72ms | p95 21.70ms
   └─ soak40           -> update 3.60ms | render 17.99ms | p95 26.20ms

real-lived-in baseline blocked in battle
└─ [2026-04-21T22-12-09-446Z](../qa_logs/session_captures/v0-baseline/2026-04-21T22-12-09-446Z)
   ├─ save kind        -> real export
   ├─ source           -> `2026-04-21T21-56-03-846Z-playtest-manual`
   ├─ import           -> restored cleanly through IndexedDB-backed storage
   ├─ calm             -> update 26.95ms | render 28.15ms | p95 71.70ms
   ├─ shell            -> update 24.64ms | render 32.54ms | p95 76.70ms
   ├─ travel           -> update 23.45ms | render 32.46ms | p95 72.40ms
   └─ blocker          -> quick run still timed out in the battle lane before full closure

pre-s3 quick real-save baseline
└─ [2026-04-22T00-52-16-156Z](../qa_logs/session_captures/v0-baseline/2026-04-22T00-52-16-156Z)
   ├─ save kind        -> real export
   ├─ source           -> `2026-04-21T21-56-03-846Z-playtest-manual`
   ├─ geometry         -> not frozen through `v0-v3`; retake after spatial `s3`
   ├─ calm             -> update 26.40ms | render 28.94ms | p95 74.40ms
   ├─ shell            -> update 25.34ms | render 34.55ms | p95 85.00ms
   ├─ travel           -> update 24.57ms | render 37.11ms | p95 75.30ms
   ├─ battle           -> update 39.01ms | render 48.02ms | p95 108.90ms
   ├─ soak40           -> update 25.43ms | render 29.08ms | p95 74.90ms
   └─ pressure         -> `critical` in all five quick lanes

pre-s3 full-duration canonical baseline
└─ [2026-04-22T01-24-32-742Z](../qa_logs/session_captures/v0-baseline/2026-04-22T01-24-32-742Z)
   ├─ save kind        -> real export
   ├─ source           -> `2026-04-21T21-56-03-846Z-playtest-manual`
   ├─ geometry         -> not frozen through `v0-v3`; retake after spatial `s3`
   ├─ calm             -> update 21.49ms | render 30.73ms | p95 68.60ms | heap 124.93MB
   ├─ shell            -> update 22.58ms | render 39.40ms | p95 79.70ms | heap 159.26MB
   ├─ travel           -> update 32.38ms | render 37.57ms | p95 86.50ms | heap 159.26MB
   ├─ battle           -> update 45.13ms | render 41.11ms | p95 114.80ms | heap 159.26MB
   ├─ soak40           -> update 36.14ms | render 37.64ms | p95 89.60ms | heap 256.54MB
   ├─ runtime issues   -> 0
   ├─ pressure         -> `critical` in all five full-duration lanes
   └─ current state    -> historical reference only; superseded for review-gate purposes once `s3` landed

post-s3 quick real-save baseline
└─ [2026-04-22T21-29-05-105Z](../qa_logs/session_captures/v0-baseline/2026-04-22T21-29-05-105Z)
   ├─ save kind        -> real export
   ├─ source           -> `2026-04-21T21-56-03-846Z-playtest-manual`
   ├─ geometry         -> re-taken after spatial `s3`
   ├─ calm             -> update 25.20ms | render 25.35ms | p95 68.60ms | heap 124.93MB
   ├─ shell            -> update 24.06ms | render 30.82ms | p95 73.80ms | heap 124.93MB
   ├─ travel           -> update 23.94ms | render 33.94ms | p95 83.30ms | heap 124.93MB
   ├─ battle           -> update 38.85ms | render 44.91ms | p95 101.00ms | heap 124.93MB
   ├─ soak40           -> update 24.46ms | render 27.76ms | p95 70.10ms | heap 124.93MB
   ├─ pressure         -> `critical` in all five quick lanes
   └─ current use      -> comparison surface for the live `v0.5` rollback pass

post-s3 full-duration canonical baseline
└─ [2026-04-22T22-11-18-179Z](../qa_logs/session_captures/v0-baseline/2026-04-22T22-11-18-179Z)
   ├─ save kind        -> real export
   ├─ source           -> `2026-04-21T21-56-03-846Z-playtest-manual`
   ├─ geometry         -> re-taken after spatial `s3`
   ├─ calm             -> update 24.17ms | render 24.58ms | p95 67.10ms | heap 124.93MB
   ├─ shell            -> update 25.73ms | render 32.08ms | p95 72.10ms | heap 168.80MB
   ├─ travel           -> update 25.54ms | render 35.08ms | p95 74.00ms | heap 168.80MB
   ├─ battle           -> update 36.98ms | render 43.52ms | p95 99.80ms | heap 168.80MB
   ├─ soak40           -> update 26.34ms | render 27.56ms | p95 71.60ms | heap 272.75MB
   ├─ runtime issues   -> 0
   ├─ pressure         -> `critical` in all five full-duration lanes
   ├─ hottest shell    -> compositeMs 14.28ms | entitiesComposite 13.35ms
   ├─ hottest battle   -> uiLayerMs 20.00ms | entityLayerMs 16.40ms
   └─ current use      -> canonical post-`s3` comparison surface for `v1+`
```

## V7 Restoration Proof

```text
live default (trails off)
└─ [2026-04-25T22-43-28-136Z](../qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T22-43-28-136Z/report.json)
   ├─ proof lane       -> lived-in `h5`
   ├─ calm             -> update 6.76ms | render 13.33ms
   ├─ shell            -> update 12.06ms | render 12.95ms
   ├─ export p95       -> 31.40ms
   └─ role             -> shipped runtime default after `v7`
```

```text
reduced trails
└─ [2026-04-25T22-46-43-006Z](../qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T22-46-43-006Z/report.json)
   ├─ proof lane       -> lived-in `h5`
   ├─ calm             -> update 6.56ms | render 12.96ms
   ├─ shell            -> update 10.60ms | render 13.08ms
   └─ ratio vs off     -> calm render 12.96 / 13.33 = 0.97x
```

```text
full trails
└─ [2026-04-25T22-44-10-129Z](../qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T22-44-10-129Z/report.json)
   ├─ proof lane       -> lived-in `h5`
   ├─ calm             -> update 6.89ms | render 13.13ms
   ├─ shell            -> update 9.81ms | render 12.77ms
   └─ ratio vs off     -> calm render 13.13 / 13.33 = 0.98x
```

```text
restoration guardrails
├─ sharp-creature parity
│  └─ [2026-04-25T22-42-38-064Z](../qa_screenshots/v3_sprite_parity_audit/2026-04-25T22-42-38-064Z/report.json)
│     └─ read -> pass
├─ readability under heaviest player path
│  └─ [2026-04-25T22-45-01-908Z](../qa_screenshots/r4_ui_readability_audit/2026-04-25T22-45-01-908Z/report.json)
│     └─ read -> pass
└─ battle presentation note
   ├─ [control](../qa_screenshots/r5_battle_presentation_audit/2026-04-25T22-40-44-517Z/report.json)
   ├─ [candidate](../qa_screenshots/r5_battle_presentation_audit/2026-04-25T22-39-53-556Z/report.json)
   └─ both failed the same guard-only fixture, so `r5` was not used as the `v7` differentiator
```

## Notes

- `scripts/run-v0-baseline.js --quick --allow-fixture` is allowed only as a
  harness smoke pass, not as the canonical baseline.
- `scripts/run-v0-baseline.js --quick` on the real lived-in save is still useful
  for rapid iteration, but it is not the full proof lane.
- the pre-`s3` canonical reference is now historical:
  `qa_logs/session_captures/v0-baseline/2026-04-22T01-24-32-742Z/`.
- the post-`s3` quick comparison surface remains useful for short iteration:
  `qa_logs/session_captures/v0-baseline/2026-04-22T21-29-05-105Z/`.
- the canonical runtime comparison surface is now the post-`s3`
  full-duration run:
  `qa_logs/session_captures/v0-baseline/2026-04-22T22-11-18-179Z/`.
- later phases should write `diff-vs-baseline.md` via
  `scripts/compare-captures.js`.
