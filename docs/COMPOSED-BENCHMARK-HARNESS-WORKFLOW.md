# Composed Benchmark Harness Workflow

## Purpose

This doc defines how Papilionem should use the new deterministic benchmark
harness for runtime and hotspot work.

It does not replace human acceptance or outside-session proof.
It replaces the older habit of treating synthetic `butterflies-N` sweeps as the
main runtime truth.

## Workflow Shape

```text
+---------------- Runtime Benchmark Ladder ----------------+
| reality baseline    -> single-zone-122                  |
| stress baseline     -> single-zone-200                  |
| targeted block lane -> block-carry-active               |
| targeted flower lane-> flower-feed-storm                |
| scaling sweeps      -> butterflies-100 / 200 / 400      |
| deep diagnosis      -> rerun heaviest failing lane      |
|                        with --profile                   |
+---------------------------------------------------------+
```

## Scenario Roles

| Scenario | Role | Use |
| --- | --- | --- |
| `single-zone-122` | reality baseline | default runtime truth for current real-play density |
| `single-zone-200` | composed stress baseline | above-real-play single-zone density; use to find the cliff above the observed free-play regime |
| `block-carry-active` | targeted structure/carry lane | isolate structure, carry, perch, and block-heavy physics pressure |
| `flower-feed-storm` | targeted flower/feed lane | isolate flower density, feed loops, and crowded butterfly targeting behavior |
| `butterflies-100/200/400` | synthetic scaling sweeps | secondary evidence for O(N) / O(N^2) shape; do not use as the only runtime proof |

## Runtime Claim Rule

```text
no runtime win is accepted unless
|- single-zone-122 improves or holds
|- the relevant targeted lane improves or holds
|- single-zone-200 does not collapse unexpectedly
`- a synthetic sweep only supports, never replaces, the composed proof
```

Synthetic sweeps are still useful, but they are no longer the primary answer to
"did this help the real game?"

## Standard Runtime Loop

1. Run `single-zone-122`.
2. Run the targeted lane that matches the changed subsystem:
   - `block-carry-active` for structure/carry/block work
   - `flower-feed-storm` for flower/feed/seek-loop work
3. Run `single-zone-200`.
4. Run `butterflies-200` or `butterflies-400` only when scaling shape still matters.
5. If a composed lane is heavy, rerun the heaviest failing composed lane with `--profile`.
6. Record:
   - digest path
   - raw path
   - top breakdown fields
   - top `physics.*` fields when physics is materially present
   - whether the win/loss is reality, targeted, stress, or scaling only

## Current Harness Notes

```text
important current harness behavior
|- `single-zone-122` now sets `scatterButterfliesAcrossZone: true`
|  `- this keeps the reality lane from clustering at doorway anchors
|- physics now exports per-stage breakdown fields
|  |- syncTrackedEntitiesMs
|  |- syncButterfliesMs / syncBlocksMs / syncPruneMs
|  |- reconcileUnsupportedBlocksMs
|  |- resolveButterflyContactsMs
|  |- resolveButterflyImpulsesMs
|  `- resolveButterflyStructureCollisionsMs
`- when physics is hot, these stage fields are now the first diagnosis surface
```

## Profile Rule

Use `--profile` when:

- a composed lane is materially worse than expected
- the breakdown says one large system block is dominant
- a top-line average improved but the tail got worse

The `.cpuprofile` file is the tie-breaker for function-level diagnosis.

## What This Does Not Replace

```text
still human-only
|- g0-bar free-play signoff
|- movement grace/readability judgment
|- social realism / dialogue naturalness review
|- colony believability review
`- outside-session acceptance
```

The harness owns runtime and hotspot truth.
Humans still own feel, readability, and acceptance closure.
