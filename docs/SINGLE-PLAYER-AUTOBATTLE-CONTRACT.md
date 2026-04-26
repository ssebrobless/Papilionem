# Single-Player Autobattle Contract

## Purpose

This document locks the intended single-player battle shape so battle implementation does not drift again.

It is intentionally limited to single-player first.
Online play is deferred and must be specified separately later.

## Source Anchors

- [C:\Users\fishe\Documents\projects\ephemera\docs\GENETICS-STAT-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/GENETICS-STAT-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ML-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ML-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ADDENDUM-NEW-SYSTEMS.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ADDENDUM-NEW-SYSTEMS.md)

## Locked Shape

```text
garden roster
   │
   ▼
top-right Battle mode
   │
   ▼
system builds strongest eligible player team
   │
   ▼
system builds opposing team by battle rules
   │
   ▼
autobattle runs on the battle arena map
   │
   ▼
result summary
   │
   ▼
commit back to garden truth
```

## Battle Map Rule

The current battle arena asset is the visible source of truth for the arena.

The arena is intentionally top-down.
It must not inherit the angled garden-ground presentation used in the living
zones.

Not allowed:

- custom visible grid overlay that ignores the arena art
- stray garden wall composition over the arena
- battle presentation that redraws a different playfield than the arena asset establishes
- reusing angled-garden projection logic as the visible battle plane

Internal slot geometry is allowed.
Visible battle borders should come from the battle map art.

## Team Selection Rule

The player does not manually build large teams butterfly by butterfly.

Default behavior:

```text
1. system reads all eligible living butterflies
2. system ranks them by battle readiness / strength
3. if roster members exist and non-roster opponents exist:
   - player team = strongest eligible roster members
   - opponent team = strongest eligible non-roster garden butterflies
4. otherwise:
   - strongest living butterflies are split into both sides
5. team size comes from arena battle capacity, capped by available fighters
```

This exists to keep battle usable at larger team sizes.

## Stat Rule

Battle strength must come from the genetics/stat contract, not a separate invented battle-only stat system.

Battle-relevant truth comes from:

```text
baseline inherited traits
upbringing modifiers
current-state modifiers
derived battle stats
readiness score/tier
special ability
```

## Decision Rule

Battle is autobattle.

Not allowed:

- turn-command HUD as the main battle model
- manual per-action player micromanagement as the core loop

Allowed:

- pause/resume
- compact field-status shell
- internal battle log / audit trail
- readable result summary
- small in-field health bars
- visible combat movement
- visible battle ability effects that match the current ability visual language

## Presentation Rule

Battle must visibly show the fight rather than only summarizing it in the log.

Visible combat should include, where applicable:

```text
movement into engagement
ability activation
special attacks
projectiles / emitted effects
flower-related battle behavior when the contracts call for it
health / damage consequence readability
```

The battle log is a support layer, not the main visible proof that combat happened.

The default player-facing battle shell should stay minimal:

- no large side roster slabs covering the field
- no permanent visible feed pane during combat
- a compact status rail is preferred over a dashboard-like HUD
- small in-field HP bars should carry most live unit readability

## Result Commit Rule

Battle outcomes must commit back into the garden simulation through owner systems.

Affected truth may include:

```text
memories
social edges
pressure / HP state
injury or strain state
confidence / fear / reputation
```

Battle must not be an isolated minigame with no effect on the living garden.

## Hard Exclusions

The single-player autobattle implementation must not depend on:

- pool completion
- old Ephemera progression loops
- manual squad/team concepts that were not part of the intended design

## Remaining Follow-Up Surface

These items still remain worth tracking, but opponent sourcing and team-size
selection are now live runtime rules:

```text
victory / retreat / KO end conditions
exact result-summary layout
future online battle sync model
```

## Definition Of Done

This contract is fulfilled when:

```text
1. battle launches from the top-right battle mode
2. team build follows roster-vs-garden first, then strongest-living fallback
3. the current battle map is rendered faithfully
4. the arena remains top-down and free of leaked garden-wall fragments
5. the fight resolves as an autobattle
6. stats, health, damage, and abilities visibly matter
7. results commit back into the live garden truth
```
