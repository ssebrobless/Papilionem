# V4 Sim Cadence Audit

## Purpose

This audit freezes the currently earned `v4` seams.

```text
v4 live slices
|- owner seam         -> lifeSimSystem deep butterfly evaluation + mlInferenceSystem garden trace refresh + zoneSystem ecology refresh
|- scheduler owner    -> gameCore owns cadence div/mod + over-budget hook
|- guardrails         -> battle bypass + zone-travel bypass + parity proof
`- honest phase state -> v4 retained slice is now promoted into the live default runtime shape
```

## Live Runtime Shape

```text
flag
`- performance.flags.simCadenceSplit
   |- off -> legacy every-frame life-sim butterfly deep eval + legacy every-frame garden ML trace scan
   `- on  -> live-default scheduler-owned cadence seams
      |- life-sim deep eval
      |  |- interval    18 frames
      |  `- bypass      battle view + zoneTravel
      `- ML garden scoring
         |- interval    36 game frames
         |- bypass      battle view + zoneTravel
         |- readers     consume last-valid trace freshness markers
         `- ecology refresh
            |- interval    30 game frames
            |- phase       zoneIndex % 30
            `- readers     consume last-valid zone freshness markers
```

## Files

- `core/gameCore.js`
- `systems/lifeSimSystem.js`
- `systems/mlInferenceSystem.js`
- `systems/zoneSystem.js`
- `core/config.js`
- `core/entity.js`
- `scripts/run-sim-cadence-parity.js`

## Proof

```text
parity
|- script           -> qa_screenshots/v4_sim_cadence_parity_audit/2026-04-24T03-16-08-170Z/
|- result           -> pass
|- life-sim stale   -> 22 frames max
|- ML stale         -> 46 frames max
|- ecology stale    -> 29 frames max
|- avg pos drift    -> 0.12 buckets
|- max pos drift    -> 3 buckets
|- zone mismatches  -> 1 sample
`- social drift     -> 0.0071 max aggregate drift
```

```text
quick lived-in same-code compare
|- baseline  -> qa_logs/session_captures/v4-control-no-flag-tuned18-current/2026-04-24T02-19-53-983Z/
|- candidate -> qa_logs/session_captures/v4-sim-cadence-tuned18-current/2026-04-24T02-19-53-801Z/
`- diff      -> qa_logs/session_captures/v4-sim-cadence-tuned18-current/2026-04-24T02-19-53-801Z/diff-vs-no-flag-control.md
```

```text
earned wins
|- calm avgUpdateMs    43.74 -> 13.08  (-70.1%)
|- shell avgUpdateMs   41.44 -> 10.49  (-74.7%)
|- battle avgUpdateMs  54.06 -> 26.29  (-51.4%)
|- soak avgUpdateMs    37.67 -> 10.08  (-73.2%)
|- calm p95FrameMs      88.50 -> 42.90 (-51.5%)
|- battle p95FrameMs   114.80 -> 64.00 (-44.3%)
|- soak avgRenderMs    37.64 -> 28.64  (-23.9%)
|- heap                159.26 -> 159.26 MB (flat)
`- social audits       r6 pass, f5/f6 pass
```

## Guardrail Read

```text
what passed
|- no page/runtime errors in parity run
|- bounded divergence stayed inside thresholds
|- durable social texture stayed intact
|- life-sim derived state still carries frame stamps for last-valid reads
|- ML trace readers now receive freshness markers with last-valid frame + stale frame count
|- zone ecology readers now receive freshness markers with last-valid frame + stale frame count
`- cadence-budget-overrun capture telemetry now records as warning-level evidence rather than a hard runtime error
```

```text
what is still not earned
|- broader runtime closure is still not earned
|- cadence alone does not close the runtime program; `v5`, `v6`, and `v7` still own the remaining proof
|- pressure can still surface warning-level cadence overruns on hot captures even after the cadence split is banked
|- render/composite work was still required to get the lived-in save through the stricter `h5` lane
`- worker offload and visual-restoration proof remain downstream of this frozen cadence slice
```

## Honest Phase State

```text
v4 today
|- life-sim cadence seam  -> live
|- ML garden cadence seam -> live
|- ecology cadence seam   -> live
|- retained slice         -> promoted into the live default runtime stack
`- carry forward
   |- keep the live 18/36/30 cadence slice
   |- keep cadence-budget-overrun capture telemetry in the warning bucket unless a later phase proves a true runtime fault
   |- do not reopen geometry work to explain runtime-heavy proof seams
   `- push the remaining runtime pressure through `v5` / `v6` / `v7` while keeping this cadence proof frozen
```
