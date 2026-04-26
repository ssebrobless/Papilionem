# Genetics / Inheritance / Stat Contract

## Purpose

This document is the implementation contract for Papilionem's genetics, inheritance, stat expression, and battle-facing stat derivation.

It exists to stop drift.

If a genetics/stat behavior is not supported by:

- this contract
- the verified live formulas in code
- or later explicit user direction

then it should be treated as unresolved rather than improvised.

## Source Anchors

- [C:\Users\fishe\Documents\projects\ephemera\systems\breedingSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/breedingSystem.js)
- [C:\Users\fishe\Documents\projects\ephemera\systems\statProfileSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/statProfileSystem.js)
- [C:\Users\fishe\Documents\projects\ephemera\entities\butterfly.js](C:/Users/fishe/Documents/projects/ephemera/entities/butterfly.js)
- [C:\Users\fishe\Documents\projects\ephemera\docs\guidebook\gemini-prompts\05-genetics-breeding-lifecycle.md](C:/Users/fishe/Documents/projects/ephemera/docs/guidebook/gemini-prompts/05-genetics-breeding-lifecycle.md)
- [C:\Users\fishe\.codex\skills\life-simulation-architecture\references\genetics-lineage-inheritance.md](C:/Users/fishe/.codex/skills/life-simulation-architecture/references/genetics-lineage-inheritance.md)

## Current Runtime Status

As of the current implementation baseline:

- mutation is explicitly treated as post-average genetics truth and is surfaced in Inspect, journal, and save/load proof
- multi-generation lineage summaries are live through `lineageTypes`, `lineageDepth`, and archived parent/ancestor refs
- lineage rarity is now surfaced separately from encounter rarity; it is descriptive lineage context, not wild unlock or spawn truth
- golden / legendary ancestry follows the same trait, ability, and wing inheritance rules as every other line and does not carry special unlock logic
- the shipped runtime does not implement a separate hidden latent/dormant stat layer; unused parent abilities can appear as lineage notes, but numeric baseline truth is direct

## Shape

```text
╔════════════ Genetic Truth Flow ════════════╗
║ parents                                    ║
║  ├─ baseline traits                        ║
║  ├─ ability                                ║
║  ├─ wing donor sources                     ║
║  └─ colors                                 ║
║            │                               ║
║            ▼                               ║
║ inherited baseline                         ║
║  ├─ averaged core traits                   ║
║  ├─ one inherited ability                  ║
║  ├─ per-wing donor inheritance             ║
║  └─ averaged colors                        ║
║            │                               ║
║            ▼                               ║
║ expressed profile                          ║
║  ├─ baseline traits                        ║
║  ├─ upbringing modifiers                   ║
║  ├─ current-state modifiers                ║
║  └─ effective traits                       ║
║            │                               ║
║            ▼                               ║
║ battle profile                             ║
║  ├─ initiative / offense                   ║
║  ├─ guard / resolve / support              ║
║  └─ derived max HP                         ║
║            │                               ║
║            ▼                               ║
║ readiness profile                          ║
║  ├─ score / tier                           ║
║  ├─ current HP / pressure                  ║
║  └─ strengths / watch-outs                 ║
╚════════════════════════════════════════════╝
```

## Ownership

```text
one owner per truth

breedingSystem     │ parent combination + offspring inheritance
statProfileSystem  │ expressed stats + battle stats + readiness
lifeSimSystem      │ live emotional/social/state modifiers
progressionManager │ lineage journal entries
UI                 │ presentation only
```

## Locked Trait Axes

These are the canonical inherited baseline traits.

```text
speed
jitteriness
trustPropensity
trustSpeed
scareThreshold
happinessBonus
```

UI labels:

```text
speed            │ Speed
jitteriness      │ Jitter
trustPropensity  │ Trust lean
trustSpeed       │ Trust rate
scareThreshold   │ Calmness
happinessBonus   │ Joy gain
```

## Locked Inheritance Rules

These are already explicit and should not be changed without an intentional redesign.

```text
child sex                   │ random
core trait values           │ average mother + father
mutation variance           │ rare post-average trait shifts
inherited ability           │ choose one parent ability randomly
wing inheritance            │ each wing donor chosen independently
colors                      │ average parent colors
bred fertility uses         │ limited
```

## Locked Runtime Layers

### 1. Baseline Traits

Baseline traits are the inherited or archetype-defined starting truth.

Priority order:

```text
1. lifeSim.genetics.baselineTraits
2. lineageRecord.inheritedTraits
3. parent midpoint reconstruction
4. subject.traits
5. archetype fallback
```

### 1b. Mutation Layer

Mutation is part of genetics truth, not upbringing or current state.

Rule:

```text
baseline with mutation
  = inherited parent midpoint
  + optional mutant-gene trait shifts
```

Current mutation contract:

```text
chance                  │ 0.20
major mutation chance   │ 0.06
mutated traits          │ 1..2
ability mutation        │ none
```

### 2. Upbringing Modifiers

Upbringing changes expression, not genotype truth.

Signals already used:

```text
lessons
routineReinforcement
teaching routine strength
warped lesson count
care lessons
social lessons
training lessons
```

### 3. Current-State Modifiers

Current-state modifiers are derived from live state, not inherited truth.

Signals already used:

```text
emotions
social confidence / belonging
interpretation clarity
status bonuses
sleep exhaustion
pressure / HP state for readiness
```

## Locked Combination Rule

```text
effective traits
  = baseline
  + upbringing modifiers
  + current-state modifiers
```

Upbringing must never overwrite baseline truth.
Current state must never overwrite baseline truth.

## Locked Battle Stat Formulas

These formulas already exist in the live stat system and should be treated as the current source of truth.

```text
initiative
  = speed*16
  + trustSpeed*11
  + (2.4 - jitteriness)*7
  + confidence*12
  - exhaustion*22

offense
  = speed*15
  + happinessBonus*10
  + jitteriness*4
  + significance*10

guard
  = scareThreshold*12
  + trustSpeed*6
  + (1 - threat)*10
  + (1 - exhaustion)*8

resolve
  = scareThreshold*10
  + happinessBonus*9
  + belonging*12
  + (1 - failure)*8

support
  = trustPropensity*12
  + happinessBonus*8
  + confidence*10
  + attachment*12

derivedMaxHp
  = 70 + guard*0.8 + resolve*0.35
```

All five battle stats are clamped to `10..120`.

## Locked Readiness Formula

```text
readiness score
  = initiative*0.16
  + offense*0.18
  + guard*0.18
  + resolve*0.18
  + support*0.14
  + hpRatio*14
  + clarity*8
  + confidence*8
  - exhaustion*22
  - pressurePenalty*100
  - threat*10
```

Where:

```text
pressurePenalty = min(0.22, pressure*0.018)
hpRatio         = hp / derivedMaxHp
```

Current readiness tiers:

```text
82+  │ Prime
68+  │ Ready
52+  │ Watch
else │ Rest
```

## Ability-Origin Contract

Visible ability origin must be one of:

```text
natural
inherited
bred
```

Rule:

```text
if inheritedAbility exists         │ inherited
else if bred/hybrid source         │ bred
else                               │ natural
```

## Required UI Surfacing

### Inspect

Inspect must present these sections for living butterflies:

```text
Stats
├─ effective trait lines
├─ baseline trait lines
├─ upbringing modifier lines
└─ current-state modifier lines

Genes
├─ inherited ability + origin
├─ parent summary
├─ comparison vs parent midpoint
└─ wing donor summary where applicable

Battle
├─ initiative / offense
├─ guard / resolve
├─ support / HP seed
└─ readiness score / tier / concerns
```

Added surfacing now locked in runtime:

- heritage depth and archived ancestor summaries
- lineage rarity versus encounter rarity
- a direct lock note that no hidden latent/dormant numeric stat layer ships today

### Journal

Hybrid and lineage pages must show:

```text
baseline traits
inherited ability
parent comparison
battle profile
readiness profile
wing donor summary
```

Added journal surfacing now locked in runtime:

- heritage summary lines that can extend beyond direct parents
- rarity split lines that keep lineage context separate from encounter rarity
- mutation and latent/dormant lock notes when relevant

### Garden-Level Proof

The player must be able to confirm in normal play that:

```text
different lineages produce different effective traits
different lineages produce different battle-readiness profiles
inherited abilities are visible and attributable
```

Added normal-play proof now expected:

- multi-generation lines can be distinguished by heritage depth and archived ancestry
- golden / legendary lineage context never implies wild unlock or encounter rarity carry

## Invariants

```text
1. genotype truth is stored separately from learned modifiers
2. upbringing never mutates genotype truth
3. current state never mutates genotype truth
4. battle stats are derived, not stored as canonical genetics
5. readiness is derived from battle stats + current state
6. inherited ability origin must be visible
7. parent references must remain stable and journal-safe
```

## Locked Edge Rules

These edge rules are now explicit in the shipped runtime and should not drift without a deliberate redesign.

```text
latent/dormant stat layer      | none in shipped runtime; baseline truth is direct
multi-generation heritage      | lineage types + depth + archived parent/ancestor refs
golden/legendary inheritance   | same numeric/ability/wing rules as any other parent
mutation variance              | post-average trait shifts only; no ability mutation
rarity split                   | lineage rarity is descriptive; encounter rarity remains separate
```

## Definition Of Done

This contract is complete in implementation when:

```text
player can answer
|- what was inherited?
|- what was learned?
|- what is currently modifying this butterfly?
|- why is this butterfly strong or weak in battle?
`- which parent contributed the visible ability and wing traits?
```
