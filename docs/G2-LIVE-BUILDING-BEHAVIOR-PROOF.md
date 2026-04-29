# G2 Live Building Behavior Proof

## Purpose

This is the dedicated proof note for `g2 live building behavior proof`.

Its job is to answer:

```text
can the current autonomous block-interaction path produce repeated,
readable building behavior on the lived-in save?
```

## Current Read

```text
g2 status
|- guided proof lane      -> green
|- free-play signal lane  -> green, but not closure-ready
|- full g2 closure        -> still pending
`- next remaining gap     -> repeated colony-shaped free-play building
```

## Proof Lanes

```text
proof shape
|- source save -> real export
|- zone        -> focused pool-heart pocket
|- action path -> existing butterfly checkBlockExperimentation()
|- guided lane -> travel leg compressed for deterministic repeated proof
`- signal lane -> no pilot / no direct target forcing during observation
```

The proof reports used:

- [original g2 live building behavior report](../qa_screenshots/g2_live_building_behavior_proof/2026-04-26T23-13-25-245Z/report.json) -> `pass`
- [updated g2 free-play signal report](../qa_screenshots/g2_live_building_behavior_proof/2026-04-29T00-37-41-869Z/report.json) -> `pass`

Anchor save summary inside the updated report:

```text
lived-in source
|- butterflies   -> 28
|- flowers       -> 141
|- blocks        -> 108
`- hybridJournal -> 16
```

## Guided Lane

The guided lane proves the deterministic choose/carry/place path still works
on the lived-in save and can revisit a nearby structure pocket.

```text
guided proof
|- first cycle  -> block placed, flower conflict cleared
|- second cycle -> block placed near the same structure pocket
|- owner path   -> existing autonomous block interaction path
`- caveat       -> the travel leg is compressed by the audit fixture
```

Explicit flower relocation remains proven by
[b4 carry/stack physics audit](../qa_screenshots/b4_carry_stack_physics_audit/2026-04-26T22-54-31-850Z/report.json).

## Free-Play Signal Lane

The updated `2026-04-29T00-37-41-869Z` report adds a fresh-save,
unpiloted observation lane after the guided proof.

```text
free-play signal
|- setup                  -> real lived-in save, focused pool-heart pocket
|- guidance during watch  -> none
|- placements             -> 2
|- carries                -> 1
|- contributing builders  -> 1
|- unique blocks placed   -> 2
|- same-pocket placements -> 1
`- closureReady           -> false
```

This separates two claims:

```text
claim A
`- the existing autonomous path can produce real free-play block placements

claim B
`- the colony repeatedly creates a readable, colony-shaped structure pocket
```

The updated lane supports `claim A`.
It does not close `claim B`.

## Honest Limits

```text
not closed yet
|- the guided lane proves repeated behavior in one lived-in pocket
|- the free-play lane proves a real autonomous placement signal
|- the free-play lane does not yet show repeated colony-shaped structure growth
`- broader colony-richness judgment is still missing
```

So the correct read is:

```text
g2 is stronger than before because
|- there is a real lived-in proof lane on disk
|- repeated choose/carry/place/revisit behavior is demonstrated under guidance
|- unpiloted free play can produce block placements without direct target forcing
`- the existing autonomous system does not need a from-scratch rebuild

g2 remains open because
|- the free-play signal is too sparse for closure
|- only one builder materially contributed in the latest observation
|- same-pocket growth was weak
`- broader colony-richness judgment is still missing
```

## Implementation Note

The current slice adds a small continuity bias rather than a rebuild:

```text
continuity slice
|- block choice      -> motivated butterflies score nearby block clusters higher
|- placement anchors -> high object/shelter motivation asks structure continuity first
|- cooldown          -> successful motivated builders can continue sooner
`- durable state     -> unchanged
```

This preserves the existing owner model:

```text
ownership
|- behavior chooses
|- structure proposes continuity
|- physics validates final placement
`- no new drive / memory / relationship vocabulary
```
