# Papilionem Active Implementation Board

## Purpose

This board is the frozen sequencing record for the post-polish implementation
work derived from the source coverage scan.

Use [SOURCE-CHAPTER-COVERAGE-MATRIX.md](./SOURCE-CHAPTER-COVERAGE-MATRIX.md) as
the intake map.

This board is now frozen clean after `I1` through `I5`.

Use it to:

- understand the completed implementation sequence
- verify what was closed versus what remains deferred
- reopen the work only if a fresh non-deferred phase is intentionally promoted

Do not use this board to reopen frozen repair or polish areas unless a fresh
audit proves a real regression or a new promoted implementation board is opened.

## Current Implementation Shape

```text
+=======================================================================+
| Current Implementation Shape                                          |
+=======================================================================+
| I1 life-sim expression depth               | live                      |
| I2 dialogue residue / relationship follow  | live                      |
| I3 genetics edge-rule lock + surfacing     | live                      |
| I4 voice / signal / ML trace proof         | live                      |
| I5 meta-doc reclassification + freeze      | live                      |
+=======================================================================+
```

## Status Key

```text
live
|- implemented and holding through current evidence

active
|- current working phase
`- next implementation work should stay here until it is clean

queued
`- intentionally sequenced later
```

## Current Baseline Snapshot

```text
baseline now
|- repair closure is frozen clean
|- player-facing polish closure is frozen clean
|- source docs are broadly aligned with the repaired runtime
`- no non-deferred implementation gap remains on this board
```

```text
implementation now
|- I1 through I5 are closed
|- source docs, audit docs, and the source book now read against the same
|  frozen runtime baseline
`- only deferred later work like fuller 3D physics, later ML replacement, and
   online battle stays off this board
```

## Phase Detail

### I1 - Life-Sim Expression Depth

```text
phase goal
|- make memories, routines, upbringing, and distortion more behavior-driving
|- improve Inspect/debug surfacing for the still-partial life-sim families
|- keep one-owner cognition boundaries intact
`- upgrade the life-sim expression audit from descriptive to closure-grade proof
```

```text
status
|- closed in I1 with deeper life-sim family feedback into behavior
|- Inspect now surfaces memory, habit, upbringing, and distortion residue directly
`- audit and roundtrip proof now hold for the widened runtime
```

Primary source docs:
- `docs/LIFESIM-EXPRESSION-AUDIT.md`
- `docs/COGNITION-ADDENDUM-NEW-SYSTEMS.md`
- `docs/PAPILIONEM-GUIDEBOOK.md`

Owners:
- `systems/lifeSimSystem.js`
- `systems/behaviorSystem.js`
- `ui/gameUI.js`
- `scripts/run-lifesim-expression-audit.js`

Baseline evidence:
- `docs/LIFESIM-EXPRESSION-AUDIT.md`
- `scripts/run-lifesim-expression-audit.js`
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-runtime-self-audit.js`

### I2 - Dialogue Residue / Relationship Follow-Through

```text
phase goal
|- make remembered dialogue change later behavior more legibly
|- prove rejection, repair / forgiveness, courtship, and follow-through rules
|- preserve the current composer, feed grounding, and relationship-owner boundaries
`- keep feed text as proof surface, never as relationship truth owner
```

Primary source docs:
- `docs/DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md`
- `docs/COMMUNICATION-LANGUAGE-CONTRACT.md`

Owners:
- `systems/communicationSystem.js`
- `systems/lifeSimSystem.js`
- `ui/gameUI.js`
- `scripts/`

Baseline evidence:
- `scripts/run-r6-communication-audit.js`
- `scripts/run-lifesim-expression-audit.js`

```text
status
|- closed in I2 with rememberability bands, courtship/rejection residue,
|  repair-state follow-through, and retained dialogue Learn outcomes
|- Inspect and feed now surface recent residue, reciprocity, rejection,
|  repair, and retained lesson proof without moving truth out of
|  communicationSystem
`- the shipped repair path currently rides reassurance / acceptance residue,
   not a separate apology-only signal type
```

### I3 - Genetics Edge-Rule Lock + Surfacing

```text
phase goal
|- lock the unresolved genetics presentation and inheritance edge rules
|- improve player-readable surfacing for inherited vs learned vs current modifiers
|- keep statProfileSystem as the canonical stat derivation owner
`- avoid improvising golden/legendary or latent/dormant behavior outside the contract
```

Primary source docs:
- `docs/GENETICS-STAT-CONTRACT.md`
- `docs/PAPILIONEM-GUIDEBOOK.md`

Owners:
- `systems/statProfileSystem.js`
- `systems/breedingSystem.js`
- `core/progressionManager.js`
- `ui/gameUI.js`
- `ui/butterflyCollection.js`

Baseline evidence:
- `scripts/run-genetics-mutation-audit.js`
- `scripts/run-phase2-stats-audit.js`
- `scripts/run-foundation-contract-audit.js`

```text
status
|- closed in I3 with archived lineage types/depth, lineage-vs-encounter rarity
|  surfacing, explicit latent/dormant lock notes, and mutation-as-baseline proof
|- Inspect, journal, and roster now explain inherited, learned, current, and
|  battle-facing stat layers without moving derivation truth out of
|  statProfileSystem
`- golden/legendary ancestry is now locked as normal lineage context rather
   than special unlock or encounter-rarity behavior
```

### I4 - Voice / Signal / ML Trace Proof

```text
phase goal
|- strengthen proof for dialogue voice, internal signals, and current ML traces
|- add or tighten audits where the contracts are currently broader than the proof
|- keep current shipped ML/runtime boundaries explicit
`- avoid pulling deferred later-ML work onto the current board
```

Primary source docs:
- `docs/DIALOGUE-VOICE-CONTRACT.md`
- `docs/INTERNAL-SIGNAL-CONTRACT.md`
- `docs/COGNITION-ML-CONTRACT.md`
- `docs/ML-IMPLEMENTATION-CONTRACT.md`

Owners:
- `systems/communicationSystem.js`
- `systems/mlInferenceSystem.js`
- `ui/gameUI.js`
- `ui/debugUI.js`
- `scripts/`

Baseline evidence:
- `scripts/run-r6-communication-audit.js`
- `scripts/run-ml-closure-audit.js`
- `scripts/run-runtime-self-audit.js`
- `scripts/run-r4-ui-readability-audit.js`

```text
status
|- closed in I4 with explicit voice-band/register/tone proof, source-side
|  signal support summaries, and Inspect/debug trace surfacing for current ML
|- `r6` now proves voice shaping plus targeted signal support without feed
|  leakage, and `ml-closure` now proves the heuristic-fallback path directly
`- later ML runtime replacement and 3D occupancy work remain deferred on purpose
```

### I5 - Meta-Doc Reclassification + Source-Book Freeze

```text
phase goal
|- reclassify stale "active intended" wording once I1-I4 land
|- keep historical docs clearly historical and live docs clearly present-tense
|- refresh source-book appendices that shadow changed systems
`- freeze this board only after the matrix and source book read honestly end to end
```

Primary source docs:
- `docs/SOURCE-CHAPTER-COVERAGE-MATRIX.md`
- `docs/INTENT-AND-EXCLUSIONS-LEDGER.md`
- `docs/README.md`
- `docs/source-book/book-manifest.json`

Owners:
- `docs/`
- `scripts/build-source-book.js`

Baseline evidence:
- `docs/SOURCE-BOOK-DESTALING-RULES.md`
- `docs/SOURCE-CHAPTER-COVERAGE-MATRIX.md`
- `node scripts/build-source-book.js`

```text
status
|- closed in I5 by reclassifying the intent ledger, freezing the implementation
|  board state, and updating the coverage matrix to match the post-I4 reality
|- the source book now rebuilds from docs that read honestly in present tense
|  against the current shipped runtime
`- open a fresh board only if new non-deferred work is intentionally promoted
```

## Not On This Board

```text
deferred later
├─ fuller later 3D physics beyond current pseudo-3D runtime
├─ later ML runtime replacement / training-host decisions
└─ online battle / multiplayer expansion
```

Those remain intentionally outside the active implementation board until they
are explicitly promoted out of the deferred boundary docs.

## Exact Implementation Order

```text
1. I1 life-sim expression depth
2. I2 dialogue residue / relationship follow-through
3. I3 genetics edge-rule lock + surfacing
4. I4 voice / signal / ML trace proof
5. I5 meta-doc reclassification + source-book freeze
```
