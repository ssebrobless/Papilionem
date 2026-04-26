# Sim Cadence Contract

## Co-Owners

```text
runtime v4
   +-- co-owned with -- social n1
```

This contract exists so cadence work does not freeze update budgets before the
social family map is locked.

## Sequencing Signoff

```text
signoff status
├─ social n1            -> signed for sequencing via `SOCIAL-FAMILY-LOCK.md`
├─ runtime review gate  -> may count this contract surface as present
└─ runtime v4           -> still owns final cadence tuning during implementation
```

Rule:
- this signoff means the contract surface is accepted for sequencing
- it does not mean the proposed numeric values are final before `v4`

## Every-Frame Systems

| System family | Tick rule | Why it stays every frame |
| --- | --- | --- |
| `flight + steering` | every frame | visible motion must stay smooth |
| `movement + zone travel` | every frame | approach, doorway, and battle positioning cannot stutter |
| `battle motion + collision response` | every frame | battle readability and fairness depend on it |
| `render + composite` | every frame | player-visible frame production |

## Cadence-Eligible Systems

| System family | Proposed interval | Proposed phase offset | Reader rule |
| --- | --- | --- | --- |
| `life-sim deep evaluation` | every `6` frames | `entityId % 6` | consumers read last-valid derived summary + frame stamp |
| `ecology refresh` | every `30` frames | `zoneIndex % 30` | zone readers tolerate cached summary until next refresh |
| `ML scoring` | every `12` frames | `entityId % 12` | consumers must tolerate up to `11` stale frames and carry `lastValidFrame` |
| `dialogue/feed shaping` | event-driven, with `1`-frame coalesce window | `n/a` | panels render last-valid social state only; no durable truth stored in UI |

## Contract Rules

- No cadence value is final until `social n1` family lock signs off.
- Any reader of an ML output must tolerate up to `N-1` stale frames, where `N`
  is the producer interval, and must carry a `last-valid` marker.
- If `social n1` changes the family map or durable social summaries, this doc
  must be re-signed before `runtime v4` can close.
- If a cadence change causes later-behavior regressions, `runtime v4` rolls
  back the cadence flag before any follow-on optimization phase proceeds.
