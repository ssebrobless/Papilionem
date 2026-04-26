# Papilionem Grand-Plan Closure Roadmap

## Scope

This roadmap is the reality-based closure plan for the Papilionem overhaul.

It now serves as a historical closure roadmap.
Use [C:\Users\fishe\Documents\projects\ephemera\docs\ACTIVE-REPAIR-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-REPAIR-BOARD.md)
and [C:\Users\fishe\Documents\projects\ephemera\docs\IMPLEMENTATION-PARITY-AUDIT.md](C:/Users/fishe/Documents/projects/ephemera/docs/IMPLEMENTATION-PARITY-AUDIT.md)
for the frozen closure baseline.
Use [C:\Users\fishe\Documents\projects\ephemera\docs\ACTIVE-POLISH-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-POLISH-BOARD.md)
and [C:\Users\fishe\Documents\projects\ephemera\docs\PLAYER-FACING-POLISH-AUDIT.md](C:/Users/fishe/Documents/projects/ephemera/docs/PLAYER-FACING-POLISH-AUDIT.md)
for live player-facing polish sequencing.

It is intentionally anchored to:

- current implemented owner systems
- current contract docs
- current audited closure state

It does not treat removed Ephemera systems as active requirements.

Hard exclusions:

- no pool-driven progression
- no old Ephemera gameplay loops that were intentionally removed
- no placeholder battle/team structures that drift away from the locked contracts

## Historical Closure Snapshot

```text
╔════════════════════ Current Reality ════════════════════╗
║ life-sim foundation              │ real                ║
║ genetics / inheritance / stats   │ real                ║
║ wild ecology / release loop      │ real                ║
║ single-player autobattle         │ real                ║
║ ML decision layers M1-M4         │ real                ║
║ structure / shelter truth        │ real                ║
║ movement / stability polish      │ still rough         ║
║ Inspect / Journal readability    │ still rough         ║
║ battle presentation fidelity     │ still rough         ║
║ feed / communication grounding   │ still rough         ║
║ final shared visible QA closure  │ still required      ║
╚═════════════════════════════════════════════════════════╝
```

## Active Grand-Plan Items That Still Matter

These are still part of the intended direction even when implementation is only partial.

```text
active now
├─ living garden with social / memory / sleep / teaching truth
├─ breeding, genetics, lineage, and readable inherited stats
├─ wild ecology / release-driven lineage pressure
├─ single-player autobattle as a separate battle mode
├─ ML-backed decision layers that remain inspectable and auditable
├─ 3D-aware shelter / opening / occupancy understanding
├─ stronger visible communication and behavior proof
└─ final player-facing readability / polish passes
```

```text
still intended later
├─ richer battle presentation with clearer visible combat expression
├─ deeper communication realism and less primitive translated feed output
├─ fuller ML runtime maturity beyond the current local policy artifact path
└─ online battle as a later separately specified phase
```

## Closure Baseline

The following major contracts are already closed at the owner-system level:

- [C:\Users\fishe\Documents\projects\ephemera\docs\GENETICS-STAT-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/GENETICS-STAT-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ADDENDUM-NEW-SYSTEMS.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ADDENDUM-NEW-SYSTEMS.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\WILD-ECOLOGY-RELEASE-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/WILD-ECOLOGY-RELEASE-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\ML-IMPLEMENTATION-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/ML-IMPLEMENTATION-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\CLOSURE-AUDIT-MATRIX.md](C:/Users/fishe/Documents/projects/ephemera/docs/CLOSURE-AUDIT-MATRIX.md)

## Evidence-Based Remaining Gaps

### 1. Movement And Stability Are Better, But Not Final

Current reality:

- physics, structure, and shove ownership are now separated cleanly
- zone-border-safe physics is in place
- structure / opening / carry truth is in place

Still active:

- vibration and rubberband edge cases need continued visible QA
- debug-spawn stress and dense-contact cases still need careful live validation
- movement truth is ahead of visual feel; the polish gap is real

### 2. Inspect And Journal Need A Readability Pass

Current reality:

- genetics/stat surfacing exists
- inspect browsing and mate-list flow were modernized
- roster and battle surfaces exist

Still active:

- blur/high-contrast readability issues
- text size and overlap problems
- roster card overflow and button collisions

Conclusion:

- the systems are there
- the player-facing readability shell is not closed yet

### 3. Battle Exists, But Presentation Still Needs Recovery

Current reality:

- top-right battle mode exists
- strongest-team auto-selection exists
- single-player autobattle resolves and commits back into garden truth
- battle posture and ML-driven decision inputs exist

Still active:

- arena visual corruption must stay gone in live play
- combatants need clearer visible engagement
- battle effects, abilities, and readable combat feedback need to better match the intended battle fantasy
- `Commit` must feel understandable as the post-battle return step, not like stray UI

Conclusion:

- battle is no longer missing
- battle presentation is still under-expressed

### 4. Communication Is Real, But Player Proof Is Too Primitive

Current reality:

- communication systems, signals, and translation layers exist
- cognition and social context feed those systems

Still active:

- repetitive translated phrases
- weak visible-to-text alignment
- feed lines that imply movement or lessons more strongly than the butterflies visibly show

Conclusion:

- communication is implemented
- communication readability is not yet at the intended level

### 5. Shared Visible Audit Closure Is Still Required

Current reality:

- focused script audits exist for genetics, progression, autobattle, ML, structure, runtime, and soak runs
- local-only audit tooling exists

Still active:

- player-visible QA must remain the final pass criteria for visual, UI, and battle-facing systems
- headless or state-only passes are not enough for closure

Conclusion:

- the audit stack is strong
- final closure still depends on visible browser verification

### 6. Online Battle Remains Deferred

Current reality:

- single-player autobattle is the current battle scope

Still active later:

- online battle flow
- networking/sync/authority model
- online UX and validation rules

Conclusion:

- online play is still part of the larger intended direction
- it is intentionally not part of the current closure sprint

## Closure Plan From Here

```text
╔════════════════════ Remaining Phase Map ════════════════════╗
║ Closed  │ R1 movement stabilization                         ║
║ Closed  │ R2 zone transition reliability                    ║
║ Closed  │ R3 progression runtime rewrite                    ║
║ Next    │ R4 Inspect / Journal readability repair           ║
║ Next    │ R5 battle presentation recovery                   ║
║ Next    │ R6 feed / communication alignment                 ║
║ Next    │ R7 block visual cleanup                           ║
║ Final   │ R8 shared visible audit closure                   ║
╚═════════════════════════════════════════════════════════════╝
```

Reference execution plan:

- [C:\Users\fishe\Documents\projects\ephemera\docs\IMPLEMENTATION-RECOVERY-PLAN.md](C:/Users/fishe/Documents/projects/ephemera/docs/IMPLEMENTATION-RECOVERY-PLAN.md)

## Recommended Near-Term Execution Order

```text
1. R4  Inspect / Journal readability repair
2. R5  battle presentation recovery
3. R6  feed / communication alignment
4. R7  block visual cleanup
5. R8  shared visible audit closure
```

## Important Rule

```text
do not regress toward older false summaries:
├─ battle is not missing
├─ roster is not missing
├─ progression is not pool-based
├─ ML work is not absent
└─ wild exit logic is not missing
```

The current project state is:

```text
implemented foundation
        ▼
remaining readability / presentation / closure work
        ▼
later deferred systems like online battle
```
