# Cognition Addendum For New Systems

## Purpose

This addendum extends the cognition contract for systems added after the original grand-plan draft.

It exists so newer gameplay additions are integrated into the butterfly mind intentionally rather than as disconnected one-off behaviors.

This addendum is subordinate to:

- [C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ML-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ML-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\GENETICS-STAT-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/GENETICS-STAT-CONTRACT.md)

## Shape

```text
╔════════════ Addendum Coverage ════════════╗
║ player interaction  │ cursor trust / pet  ║
║ object affordance   │ flower / pollen /   ║
║                     │ egg / block         ║
║ space understanding │ obstacle / opening  ║
║                     │ / shelter / 3D prep ║
║ ecology context     │ wild / bred / release║
║ battle context      │ autobattle scoring  ║
╚═══════════════════════════════════════════╝
```

## Locked Rule

New systems must extend the existing cognition stack.

They must not:

- reintroduce removed pool-era logic
- depend on old Ephemera progression assumptions
- bypass owner systems with hardcoded one-off behavior

## New Feature Groups To Add

### 1. Player Interaction Memory

These should become explicit cognition inputs and memory summaries:

```text
cursorTrust
cursorFear
petHistory
clapStartleHistory
calmedByCursor
startledByCursor
```

Purpose:

- let butterflies become friendlier by experience, not by static script
- let clap meaningfully affect sleep, caution, and future approach bias
- let pet/trust behavior persist as part of social memory with the player

### 2. Object Affordance Awareness

These should become explicit world/context features:

```text
objectType
├─ flower
├─ pollen
├─ egg
└─ block

objectAffordance
├─ feedFrom
├─ carry
├─ plant
├─ drop
├─ stack
└─ shelterUse
```

Purpose:

- unify flower, pollen, egg, and block reasoning
- stop object behavior from living only inside ad hoc per-entity logic

### 3. 3D-Ready Spatial Understanding

These should be added now even if full 3D occupancy is implemented later.

```text
verticality
├─ ground
├─ stacked
└─ overhead

structureRole
├─ loose
├─ wall
├─ roof
├─ opening
└─ shelter

pathState
├─ open
├─ obstructed
├─ enterable
└─ trapped

bodyFit
├─ canPass
├─ tooNarrow
└─ canShelterInside
```

Purpose:

- prepare butterflies to understand blocks under real 3D logic
- make future roof/interior/shelter work an extension of cognition instead of a bolt-on

### 4. Ecology / Lineage Context

These should become explicit long-lived context channels:

```text
originType
├─ wild
├─ bred
└─ rostered

ecologyPressure
variantFamiliarity
lineageValue
releaseValue
zoneAffinity
```

Purpose:

- support the live wild ecology / release loop cleanly
- let discovery, bonding, breeding, release pressure, and roster value become part of the living simulation

### 5. Autobattle Context

These should become explicit battle-mode cognition features:

```text
allyPressure
enemyThreat
targetPriority
spacingState
retreatPressure
supportOpportunity
```

Purpose:

- support autobattle reasoning without inventing a separate fake brain
- keep battle decisions rooted in the same butterfly identity used in the garden

## Contract Dependencies Now

The following now anchor this addendum:

```text
1. wild ecology / release contract
2. single-player autobattle contract
3. current spatial truth + later 3D shelter planning docs
```

## Definition Of Done

This addendum is implemented correctly when:

```text
1. newer systems feed the same cognition stack as older systems
2. butterflies can reason about player interaction, objects, and space coherently
3. future 3D block logic has reserved cognitive hooks already in place
4. no new implementation depends on removed pool / old Ephemera mechanics
```
