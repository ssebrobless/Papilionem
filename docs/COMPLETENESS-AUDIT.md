# Papilionem Grand-Plan Completeness Audit

## Scope

This audit is intentionally scoped to the Papilionem overhaul grand plan.

Removed Ephemera-era mechanics remain out of scope unless they were explicitly carried forward into current Papilionem contracts.

This file is a historical completeness checkpoint.
Use [C:\Users\fishe\Documents\projects\ephemera\docs\ACTIVE-REPAIR-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-REPAIR-BOARD.md)
and [C:\Users\fishe\Documents\projects\ephemera\docs\IMPLEMENTATION-PARITY-AUDIT.md](C:/Users/fishe/Documents/projects/ephemera/docs/IMPLEMENTATION-PARITY-AUDIT.md)
for the frozen closure baseline.
Use [C:\Users\fishe\Documents\projects\ephemera\docs\ACTIVE-POLISH-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-POLISH-BOARD.md)
and [C:\Users\fishe\Documents\projects\ephemera\docs\PLAYER-FACING-POLISH-AUDIT.md](C:/Users/fishe/Documents/projects/ephemera/docs/PLAYER-FACING-POLISH-AUDIT.md)
for live player-facing polish status.

## Historical Snapshot

```text
╔════════════════════ Current Reality ════════════════════╗
║ owner-system architecture          │ real              ║
║ life-sim emotion / cognition state │ real              ║
║ genetics / inheritance core        │ real              ║
║ player-readable stat surfacing     │ real, rough UI    ║
║ wild ecology / release loop        │ real              ║
║ roster + strongest-team selection  │ real, rough UI    ║
║ single-player autobattle           │ real, rough view  ║
║ ML-backed decision layers M1-M4    │ real              ║
║ structure / shelter / 3D-ready     │ real              ║
║ feed / communication readability   │ partial           ║
║ Inspect / Journal readability      │ partial           ║
║ visible closure polish             │ still open        ║
╚═════════════════════════════════════════════════════════╝
```

## Confirmed In Code

```text
implemented now
├─ owner systems for sleep / teaching / communication / breeding / saves
├─ butterfly life-sim fields:
│  ├─ drives
│  ├─ emotions
│  ├─ memories
│  ├─ routines
│  ├─ social
│  ├─ interpretation
│  ├─ distortion
│  ├─ communication
│  └─ lifecycle
├─ hybrid inheritance and lineage records
├─ canonical stat profile system
├─ wild-release-loop ownership
├─ roster truth + strongest-team autobuild
├─ top-right single-player battle mode
├─ ML feature / action / target / signal / risk / battle-posture layers
├─ structure / shelter / opening / carry truth
└─ debug / audit tooling
```

## Partial Or Under-Expressed

```text
still needs stronger player-facing proof
├─ Inspect text size / blur / layout
├─ Journal layout / overflow / roster readability
├─ battle presentation and combat readability
├─ communication feed alignment to visible action
├─ block outline consistency
└─ final visible shared audit closure
```

## Still Active From The Grand Plan

```text
still active work
├─ polish the current single-player autobattle presentation
├─ make genetics / battle relevance easier to read at a glance
├─ deepen communication believability and visible proof
├─ keep 3D-aware shelter / movement behavior stable under load
├─ close remaining UI readability issues
└─ preserve explainable ML decisions in Inspect / Debug
```

```text
deferred later work
├─ fuller online battle implementation
└─ any future ML runtime expansion beyond the current local policy path
```

## Current Priorities

```text
highest-value next work
1. fix Inspect / Journal readability and layout
2. recover battle presentation so it visibly matches the autobattle design
3. align feed text with visible communication and movement
4. clean up remaining block visual issues
5. close with a shared visible browser audit
```

## Notes

- Older versions of this file under-reported what was already implemented.
- [C:\Users\fishe\Documents\projects\ephemera\docs\CLOSURE-AUDIT-MATRIX.md](C:/Users/fishe/Documents/projects/ephemera/docs/CLOSURE-AUDIT-MATRIX.md) is the best current completion baseline.
- [C:\Users\fishe\Documents\projects\ephemera\docs\IMPLEMENTATION-RECOVERY-PLAN.md](C:/Users/fishe/Documents/projects/ephemera/docs/IMPLEMENTATION-RECOVERY-PLAN.md) is the best current execution order for the remaining closure work.
- This audit should stay honest about the difference between:
  - implemented owner truth
  - player-visible quality
  - future deferred systems
