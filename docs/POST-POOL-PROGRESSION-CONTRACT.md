# Post-Pool Progression Contract (Superseded Archive)

## Superseded Direction Note

This contract is no longer current runtime truth.

The current intended direction is now:

- [C:\Users\fishe\Documents\projects\ephemera\docs\WILD-ECOLOGY-RELEASE-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/WILD-ECOLOGY-RELEASE-CONTRACT.md)

Keep this document only as an archive of the removed breeding-gated unlock
ladder.

The live runtime has already moved to the ecology / release loop described in:

- [C:\Users\fishe\Documents\projects\ephemera\docs\WILD-ECOLOGY-RELEASE-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/WILD-ECOLOGY-RELEASE-CONTRACT.md)

```text
╔════════════════════ Archived Progression Loop ═════════════════════╗
║ starter pairs in every zone                                       ║
║      │                                                            ║
║      ▼                                                            ║
║ same-type wild pair produces child                                ║
║      │                                                            ║
║      ├─▶ unlock next rarity/type in order                         ║
║      └─▶ spawn 1 female + 1 male of that new type in every zone   ║
║                                                                   ║
║ after same-type success once                                      ║
║      ▼                                                            ║
║ that wild butterfly only pursues mixed-type breeding              ║
║      ▼                                                            ║
║ after 3 successful hybrid breedings                               ║
║      ▼                                                            ║
║ that wild butterfly permanently leaves the garden                 ║
╚═════════════════════════════════════════════════════════════════════╝
```

## Scope

This contract replaces:

```text
forbidden as progression owners
├─ pool percentage
├─ collect-to-unlock flow
├─ golden-only special-case progression logic
└─ any old Ephemera unlock path

canonical owner
└─ progressionManager
```

## Ownership

```text
progressionManager owns
├─ progression order
├─ current unlocked type/rarity
├─ per-type unlock completion
├─ per-wild-butterfly breeding progression
├─ spawn directives for newly unlocked types
└─ persistence of all progression truth

breedingSystem owns
├─ detecting successful same-type breeding
├─ detecting successful hybrid breeding
└─ reporting those outcomes to progressionManager

gameCore owns
├─ creating starter pairs
├─ spawning newly unlocked zone pairs
└─ ambient wild arrivals using only currently unlocked types
```

## Canonical Type Order

```text
unlock order
1. friendly
2. cautious
3. energetic
4. skittish
5. wise
6. mystic
7. golden
```

Assumption locked for now:
- "same rarity order as the old game" is implemented as the ordered base-variant ladder above.

## Initial Garden State

On a fresh progression reset:

```text
each zone receives
├─ 1 female friendly butterfly
└─ 1 male friendly butterfly
```

Those starter butterflies are:

```text
starter pair rules
├─ warm to the player/cursor
├─ persistent enough to establish the opening loop
└─ part of the progression ladder, not debug-only entities
```

## Unlock Rule

The next type unlocks when:

```text
female wild butterfly of type T
        +
male wild butterfly of type T
        +
successful child production
        ▼
unlock next type in the canonical order
```

Successful child production means:

```text
minimum required truth
└─ a real offspring result from that mating path exists
```

Implementation note:
- The runtime may certify this at the first durable offspring-success checkpoint in the lifecycle path, but it must not unlock from mere attraction or mating-start.

## New Unlock Spawn Rule

Every time a new type unlocks:

```text
for every zone
├─ spawn 1 female of the new type
└─ spawn 1 male of the new type
```

Those butterflies become part of the normal living garden and can participate in breeding and later progression.

## Wild Butterfly Lifecycle Rule

Each wild butterfly tracks three progression facts:

```text
per-wild-butterfly progression
├─ sameTypeChildCompleted   │ boolean
├─ hybridBreedCount         │ 0..3
└─ permanentDepartureQueued │ boolean
```

Behavior rules:

```text
before same-type child success
└─ wild butterfly may breed only with same type

after same-type child success
└─ wild butterfly will not breed same type again

after same-type child success
└─ wild butterfly remains until 3 successful mixed-type breedings

after 3rd successful mixed-type breeding
└─ wild butterfly permanently leaves the garden
```

## Mixed-Type Breeding Rule

Mixed-type breeding is the intended lineage-growth phase.

```text
mixed-type rule
├─ only unlocked types may appear as wild candidates
├─ wild butterflies shift into mixed-type breeding after their same-type success
└─ mixed-type breeding is the intended source of hybrid lineage growth
```

## Ambient Wild Arrival Rule

Ambient wild arrivals must use only the currently unlocked type set.

```text
ambient arrivals may use
├─ currently unlocked types
└─ weighted preference inside that unlocked set

ambient arrivals may not use
└─ any locked future type
```

## Persistence

Persist:

```text
progressionOrderIndex
unlockedTypes
unlockHistory
starterPairsSeeded
perTypeUnlockStatus
perWildButterflyProgress
hybridJournal
nextHybridId
```

Rebuild:

```text
current live zone pair counts
ambient wild arrival weights
UI summaries derived from progression state
```

## Invariants

```text
1. Fresh reset starts with only friendly starter pairs in every zone.
2. A locked type can never appear before its predecessor is unlocked.
3. Same-type child success is the only unlock path.
4. Wild butterflies stop same-type breeding after their first same-type child success.
5. Wild butterflies leave permanently after 3 successful mixed-type breedings.
6. New unlocks always seed 1 female + 1 male into every zone.
7. No pool percentage or collect-to-unlock flow participates anywhere.
8. Debug-spawned butterflies never mutate real progression state unless explicitly intended.
```

## Audit Requirements

```text
must verify
├─ reset world seeds correct starter pairs in every zone
├─ locked types do not appear early
├─ same-type child success unlocks exactly one next type
├─ unlock seeding spawns 1 female + 1 male in every zone
├─ wild butterflies stop same-type breeding after success
├─ wild butterflies leave after 3 successful mixed-type breedings
└─ progression survives save/load without pool-era leakage
```
