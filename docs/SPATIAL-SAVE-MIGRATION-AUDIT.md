# Spatial Save Migration Audit

## Purpose

This closes `s7` on the spatial unification board:

```text
saved world
   │
   ├─ preserves
   │  ├─ butterfly identity / lineage / social truth
   │  └─ sacred long-running save continuity
   │
   └─ refreshes
      ├─ widened board geometry
      ├─ canonical interaction-space placement
      ├─ block scatter / placement-derived layout
      └─ cheap route / placement rebuild data
```

The goal is not exact no-op positional replay.
The goal is safe migration into the unified board without wiping lived-in state.

## What Landed

```text
s7 migration seam
├─ refresh revision owner         -> `systems/saveSystem.js`
├─ current layout revision        -> `garden-placement-v3`
├─ restore placement profiles     -> butterfly / flower / caterpillar / block
├─ restore clamp source           -> live interaction-space + canonical block unit
├─ block rebuild normalization    -> widened-board padding + spread
└─ recovery note                  -> explicit re-seat note without fresh-world reset
```

## Proof Shape

```text
proof stack
├─ runtime self audit
│  ├─ 17 / 17 steps passing
│  ├─ stale-save refresh lane green
│  └─ overall warn only from runtime budget pressure
├─ spatial truth audit
│  └─ save/load rebuilds spatial truth on the widened board
├─ social save continuity audit
│  └─ sacred hybrid identity / journal / memory edges preserved
└─ lived-in save reload
   └─ remains stable after refresh-driven autosave
```

## Evidence

- Runtime self audit:
  [report.json](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/runtime_self_audit/report.json)
- Spatial truth audit:
  [2026-04-22T20-24-14-364Z/report.json](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/a4_spatial_truth_audit/2026-04-22T20-24-14-364Z/report.json)
- Social save continuity audit:
  [2026-04-22T20-24-14-364Z/report.json](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/n8_social_save_continuity_audit/2026-04-22T20-24-14-364Z/report.json)
- Long-running save smoothness context:
  [2026-04-22T20-18-16-667Z/report.json](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-22T20-18-16-667Z/report.json)

## Closure

`s7` is honest to freeze because:

```text
green now
├─ stale refresh revisions rewrite to current build revisions
├─ widened-board placement re-seat happens through live spatial profiles
├─ block collapse recovery restores spread instead of preserving bad overlap
├─ restore path does not force a fresh world
└─ protected social / lineage truth survives migration
```

## Remaining Pressure

`s7` is closed, but `s8` remains open:

```text
still to prove in s8
├─ longer real-save play on the unified board
├─ travel / placement / structure lanes together under soak
└─ runtime-heavy h5 lane separated from migration truth
```

That means the migration contract is now stable, while the next honest spatial
pressure is proof freeze on the lived-in board under normal play.

## Shared Schema Note

```text
shared save-schema gate
|- s7 migration truth -> frozen
|- joint signoff      -> now recorded at `schemaVersion = 4`
`- carry forward      -> later runtime proof should treat schema as frozen unless a new joint migration is opened explicitly
```
