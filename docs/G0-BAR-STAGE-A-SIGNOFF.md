# G0-Bar Stage A Signoff

## Purpose

This is the human-review signoff sheet for Stage A goal-alignment closure:

```text
Stage A
├─ g1 spatial acceptance sweep
├─ g2 live building behavior proof
└─ g3 movement naturalness acceptance
```

Use this after a real lived-in free-play session.

It exists so Stage A does not stall at:

```text
"needs human signoff"
```

without a concrete signoff artifact.

## Session Bar

```text
g0-bar session requirements
├─ duration    -> at least 20 continuous minutes
├─ observer    -> one human reviewer
├─ entry state -> real lived-in save, not a fresh seed
└─ closure     -> written signoff against this named rubric
```

Recommended setup:

- launch with [../PLAYTEST.md](../PLAYTEST.md)
- use the same lived-in save family referenced by:
  - [G1-SPATIAL-ACCEPTANCE-SWEEP.md](./G1-SPATIAL-ACCEPTANCE-SWEEP.md)
  - [G2-LIVE-BUILDING-BEHAVIOR-PROOF.md](./G2-LIVE-BUILDING-BEHAVIOR-PROOF.md)
  - [G3-MOVEMENT-NATURALNESS-ACCEPTANCE.md](./G3-MOVEMENT-NATURALNESS-ACCEPTANCE.md)
- if comfortable, run `Start Capture` before play and `Export Capture` after play

## Session Info

```text
session info
├─ reviewer            :
├─ date                :
├─ branch / build      :
├─ device / browser    :
├─ session duration    :
├─ save used           :
├─ capture exported    : yes / no
└─ capture path        :
```

## G1 Spatial Acceptance Sweep

Rate each item:

- `good`
- `mixed`
- `rough`

```text
g1 rubric
├─ butterflies read at the correct height/band
├─ flowers sit/read correctly against the board
├─ blocks read correctly on ground / connected / stacked states
├─ eggs read correctly if present
├─ cocoons read correctly if present
├─ caterpillars read correctly if present
├─ carry / cover / overhead states read correctly
├─ doorway travel matches the visible corridor/path truth
└─ no obvious pseudo-3D contradiction appeared during ordinary play
```

Notes:

- strongest contradiction seen:
- where it happened:
- repeatable:

## G2 Live Building Behavior Proof

Rate each item:

- `good`
- `mixed`
- `rough`

```text
g2 rubric
├─ butterflies choose blocks under ordinary motivation
├─ carry behavior looks intentional, not glitchy
├─ placement resolves cleanly
├─ flower conflict resolution reads cleanly when it occurs
├─ stacking / support results read cleanly
├─ butterflies revisit or grow an earlier structure pocket
├─ resulting change feels colony-shaped, not random prop shuffling
└─ building is readable without opening debug truth
```

Notes:

- best building moment:
- weakest / thinnest building moment:
- did the colony create a readable structural change:

## G3 Movement Naturalness Acceptance

Rate each item:

- `good`
- `mixed`
- `rough`

```text
g3 rubric
├─ calm wandering feels natural
├─ social linger / approach feels natural
├─ doorway travel feels graceful
├─ carrying movement feels grounded
├─ threat / scared motion reads clearly
├─ recovery after pressure reads naturally
└─ no snap / zoom / route ugliness stood out in ordinary play
```

Notes:

- best movement moment:
- ugliest movement moment:
- did any motion feel like teleport choreography:

## Closure Call

```text
Stage A closure call
├─ g1 -> close / hold
├─ g2 -> close / hold
├─ g3 -> close / hold
└─ overall Stage A -> close / hold
```

If any item is `hold`, name the blocker type:

- `implementation gap`
- `acceptance gap`
- `proof gap`
- `outside-evidence gap`

Blockers:

```text
1.
├─ phase / pillar :
├─ blocker type   :
├─ what happened  :
└─ next action    :

2.
├─ phase / pillar :
├─ blocker type   :
├─ what happened  :
└─ next action    :
```

## Final Signoff

```text
final signoff
├─ reviewer:
├─ result  : Stage A accepted / Stage A held
└─ date    :
```

If accepted, copy the result into:

- [ACTIVE-PLAN-REGISTRY.md](./ACTIVE-PLAN-REGISTRY.md)
- [CURRENT-STATE-GAP-ASSESSMENT.md](./CURRENT-STATE-GAP-ASSESSMENT.md)
- [GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md](./GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md)

If held, promote only actionable blockers into:

- [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)
