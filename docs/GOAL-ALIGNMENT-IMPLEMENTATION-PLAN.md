# Goal Alignment Implementation Plan

## Purpose

This plan turns the remaining mismatches in
[CURRENT-STATE-GAP-ASSESSMENT.md](./CURRENT-STATE-GAP-ASSESSMENT.md)
into one clean implementation ladder.

It does not replace the frozen child boards.
It tells us what to reopen, what to prove, and what to leave alone.

## Program Shape

```text
╔════════════════════════ Goal Alignment Ladder ════════════════════════╗
║ A. acceptance closure on already-strong systems                      ║
║ B. social believability deepening on partially aligned systems       ║
║ C. final full-stack / outside-proof closure                          ║
╚═══════════════════════════════════════════════════════════════════════╝
```

## Non-Negotiables

```text
always preserve
├─ do not reopen green mechanics without a named gap
├─ do not degrade visuals to make later proof easier
├─ do not blur life-sim ownership just to get nicer dialogue
├─ do not let ML own durable feelings, memories, or bonds
└─ do not wipe long-running saves to simplify acceptance work
```

## g0-bar Precondition

Before any of `g1`-`g5` can close, the acceptance-bar definition in
[GAME-SUCCESS-CRITERIA.md](./GAME-SUCCESS-CRITERIA.md#acceptance-bar)
must be referenced as the closure rubric. This is a one-time precondition
added by the `2026-04-26` Claude Review.

```text
g0-bar
├─ defines what counts as a "lived-in" / "free-play" / "ordinary play"
│  acceptance session
├─ duration, observer, entry-state, signoff format
└─ one rubric per Stage A/B step
```

Without `g0-bar`, "lived-in" closure is subjective and prone to
reviewer-fatigue drift.

## Runtime Harness Rule

For any runtime-facing change or runtime-facing closure claim, the composed
benchmark harness is now the local proof owner.

```text
runtime benchmark routing
|- reality baseline    -> single-zone-122
|- stress baseline     -> single-zone-200
|- block lane          -> block-carry-active
|- flower lane         -> flower-feed-storm
|- scaling only        -> butterflies-100 / 200 / 400
`- deep diagnosis      -> rerun the heaviest failing composed lane with --profile
```

Synthetic `butterflies-N` sweeps remain useful, but they are no longer the
primary answer to "did this help the real game?"

## Exact Ladder

### `g1 spatial acceptance sweep`

```text
goal
└─ turn "mechanically unified" into "player-legible pseudo-3D truth"
```

Outputs:

- one lived-in manual acceptance sweep covering:
  - butterflies
  - flowers
  - blocks
  - eggs/cocoons/caterpillars where relevant
  - carry/cover/overhead readability
- one concise proof note recording any remaining contradictions

Owner shape:

```text
primary owner
└─ spatial board companion proof

consumes
└─ existing a4 / r2 / h5 green lanes
```

Close when:

- no visual contradiction appears in the lived-in acceptance sweep
- or any remaining contradiction is promoted as a named blocker

Current execution note (`2026-04-26`):

- local companion proof is now green in
  [G1-SPATIAL-ACCEPTANCE-SWEEP.md](./G1-SPATIAL-ACCEPTANCE-SWEEP.md)
- formal close still waits on one human `g0-bar` lived-in signoff

### `g2 live building behavior proof`

```text
goal
└─ prove that autonomous butterflies can build cleanly in ordinary play,
   not only in scripted placement harnesses
```

Outputs:

- a new proof lane or manual audit for:
  - choose block
  - carry block
  - relocate flower if needed
  - place block safely
  - stack or revisit structure
  - reuse or react to an earlier structure under ordinary motivation
  - produce a visible colony-shaped change, not only one legal placement cycle

Close when:

- autonomous build behavior looks stable, readable, and colony-shaped in free play
- at least one lived-in free-play session shows repeated choose/carry/place/revisit behavior
- any remaining thinness is promoted as a named richness blocker rather than hidden inside "placement passed"

Current execution note (`2026-04-26`):

- the first guided lived-in proof lane is now green in
  [G2-LIVE-BUILDING-BEHAVIOR-PROOF.md](./G2-LIVE-BUILDING-BEHAVIOR-PROOF.md)
- formal close still waits on an uncontrolled free-play acceptance session
  plus a broader colony-shaped richness read

### `g3 movement naturalness acceptance`

```text
goal
└─ close the gap between "movement is correct" and
   "movement feels graceful"
```

Outputs:

- one longer free-play capture focused on movement feel
- explicit review of:
  - calm wandering
  - social linger/approach
  - doorway travel
  - carrying motion
  - threat/scared motion

Close when:

- no obvious snap/zoom/route ugliness remains in ordinary play

Current execution note (`2026-04-26`):

- local companion proof is now recorded in
  [G3-MOVEMENT-NATURALNESS-ACCEPTANCE.md](./G3-MOVEMENT-NATURALNESS-ACCEPTANCE.md)
- current local read is green on correctness/dispersal, with the remaining
  open item being one human `g0-bar` free-play signoff

### `g4 ambient social breadth pass`

```text
goal
└─ make the society feel broad in free play, not only in curated scenarios
```

This is where to reopen the social track if needed.
Do not mutate the frozen `n0`-`n8` history.
Open a post-`n8` realism pass instead.

Outputs:

- wider ambient motive mix targets
- stronger group-rhythm persistence in uncontrolled play
- explicit acceptance review for companionship, praise, teasing, repair, tension, affection, curiosity

Close when:

- those modes appear frequently enough in long free play to feel like a society, not a demo harness

### `g5 dialogue naturalness + repetition pressure`

```text
goal
└─ close the gap between grounded dialogue and naturally readable dialogue
```

Outputs:

- repetition/naturalness review rubric
- topic-breadth targets
- line-style cleanup where wording still reads too system-authored

Close when:

- the colony no longer feels dominated by a narrow phrase style in longer play

### `g6 ML value proof`

```text
goal
└─ prove the neural/social scorer meaningfully improves the colony feel
   AND that its update cost is justified by that improvement
```

Outputs:

- ML-on versus ML-off free-play comparison
- acceptance read on:
  - coherence
  - social variety
  - follow-through quality
  - contradiction reduction
- cost-vs-value reconciliation:
  - ML cadence cost in update budget (currently top contributor in h5)
  - whether the observed coherence/variety delta justifies that cost
  - if value is real but cost is too high, recommend cadence reduction
    rather than scoring removal

Close when:

- we can honestly say the scorer helps free play, not just harnesses
- AND the update cost it consumes is paid back in lived-in coherence

### `g7 v8b full-stack migrated-save proof`

```text
goal
└─ prove runtime + spatial + social all hold together on the migrated save
```

Outputs:

- migrated-save full-stack packet
- final continuity read across runtime, spatial, and social truth

Close when:

- `v8b` is green on the real migrated lived-in save

### `g8 outside-session closure + public alpha freeze`

```text
goal
└─ turn local confidence into honest outside-player confidence
```

Outputs:

- real outside-session evidence
- triaged blocker list
- public-alpha freeze call or hold

Close when:

- outside evidence agrees with local proof strongly enough to close `r4` and gate `r5`

## Parallel-Safe Shape

```text
safe overlap (Stage A)
├─ g1 spatial acceptance sweep
├─ g2 live building behavior proof
└─ g3 movement naturalness acceptance

safe overlap with Stage A (prep-only early-start, added by Claude Review 2026-04-26)
├─ g4-observation: begin ambient social observation now
│   └─ preparatory evidence gathering only; formal close still waits for Stage B
└─ g5-style: begin dialogue style cleanup now
    └─ preparatory style work only; formal close still waits for Stage B

then (Stage B)
├─ g4 ambient social breadth (formal close)
├─ g5 dialogue naturalness (formal close)
└─ g6 ML value proof (now includes cost-vs-value)

finally (Stage C)
├─ g7 v8b full-stack proof
└─ g8 outside-session closure
```

Why g4 and g5 may early-start:

```text
g4 needs accumulated free-play observation
└─ starting that clock during Stage A means it does not start at zero
   when Stage A closes

g5 has actionable text-style evidence today
└─ the f5/f6 audit lines themselves expose the system-authored tone the
   gap doc warns about; cleanup does not need to wait for Stage B, but
   it does not advance formal Stage B closure on its own
```

## What Not To Reopen

```text
do not reopen by default
├─ the spatial unit contract
├─ the doorway/corridor model
├─ the shared save schema
├─ local runtime-only proof
└─ the frozen n0-n8 social history
```

Reopen only if a new named contradiction appears.

## Practical Next Move

```text
start here
├─ g1 spatial acceptance sweep
├─ g2 live building behavior proof
└─ g3 movement naturalness acceptance
```

Those three tell us whether the remaining 3D/build/movement gaps are real
implementation gaps or mostly acceptance gaps.

After that:

```text
if the main remaining misses are social feel
└─ promote g4 -> g5 -> g6

if the main remaining misses are only proof breadth
└─ skip directly toward g7 -> g8
```
