# Social Family Lock

## Purpose

This doc is the stable `n1` contract for social truth ownership and canonical
family names.

It exists so later social-depth work does not solve repetition by inventing
overlapping mini-systems.

```text
n1 lock
├─ one family map
├─ one owner map
└─ one cadence boundary handshake with runtime v4
```

Use this with:

- [ACTIVE-SOCIAL-COGNITION-BOARD.md](./ACTIVE-SOCIAL-COGNITION-BOARD.md)
- [SOCIAL-COGNITION-ROADMAP.md](./SOCIAL-COGNITION-ROADMAP.md)
- [SIM-CADENCE-CONTRACT.md](./SIM-CADENCE-CONTRACT.md)
- [DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md](./DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md)
- [SAVE-SCHEMA-REGISTRY.md](./SAVE-SCHEMA-REGISTRY.md)

## Canonical Family Map

### Emotion channels

```text
emotion channels
├─ threat
├─ relief
├─ attachment
├─ rejection
├─ significance
├─ failure
├─ curiosity
├─ agitation
└─ exhaustion
```

### Pair chemistry summaries

```text
pair chemistry
├─ ease
├─ playfulness
├─ tenderness
├─ fascination
├─ irritation
├─ longing
├─ rivalryHeat
└─ repairOpenness
```

### Society summaries

```text
society summaries
├─ reputation
├─ belonging
├─ cliqueComfort
├─ cliqueTension
├─ witnessedWarmth
├─ witnessedEmbarrassment
├─ protectivenessField
└─ teachingPrestige
```

### Conversation motive families

```text
conversation motives
├─ maintenance
├─ companionship
├─ observation
├─ admiration
├─ play
├─ flirtation
├─ repair
├─ complaint
├─ rivalry
├─ warning
├─ teaching
└─ statusPerformance
```

## Owner Map

```text
lifeSimSystem
├─ emotion channels
├─ pair chemistry summaries
├─ society summaries
├─ later behavior follow-through pressure
└─ durable social summaries derived from memory + edges

communicationSystem
├─ emitted motive family
├─ exchange flow
├─ heard interpretation envelope
└─ residue labeling attached to spoken interaction

durable social state
├─ relationship edges
├─ dialogue residue packets
├─ witnessed/social-memory packets
└─ repetition / novelty counters

mlInferenceSystem
└─ later scoring / weighting only

gameUI + DOM panels + debugUI
└─ presentation only, never truth ownership
```

## Durable vs Derived Rule

```text
durable truth
├─ emotions
├─ memories
├─ relationship edges
└─ long-running social residue

derived truth
├─ pair chemistry summaries
├─ society summaries
├─ feed thread groupings
└─ debug/player-facing explanation shells
```

Rules:

- pair chemistry must be derived from durable edges, recent interaction history,
  and current emotion channels instead of being stored as a second competing
  relationship model
- society summaries must be derived from witnessed/social memory, belonging,
  clique pressure, protectiveness, and teaching prestige instead of being
  hard-authored UI labels
- UI may format the result but may not invent or persist it

## ML Boundary

```text
mlInferenceSystem
├─ may score who to approach
├─ may score whether to warn / comfort / tease / praise / withdraw
├─ may score whether to repair / escalate / avoid
└─ may not create new durable emotions, memories, or relationship edges
```

This lock is subordinate to [COGNITION-ML-CONTRACT.md](./COGNITION-ML-CONTRACT.md)
and [SAVE-SCHEMA-REGISTRY.md](./SAVE-SCHEMA-REGISTRY.md).

## Cadence Handshake

`n1` co-owns [SIM-CADENCE-CONTRACT.md](./SIM-CADENCE-CONTRACT.md) with runtime
`v4`.

The rule is:

```text
no cadence value is final
until this family lock exists
and the cadence contract is signed for sequencing
```

That sequencing signoff is now recorded.

## Phase Gate

`n1` closes when:

1. one canonical family map exists
2. one owner map exists
3. the cadence contract is signed from the `n1` side
4. the active social board and roadmap point to this doc instead of only to a
   recommended family list embedded in prose

That gate is now satisfied.
