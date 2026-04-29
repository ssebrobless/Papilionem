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
|- free-play signal lane  -> green and closure-ready locally
|- full g2 closure        -> locally green
`- next remaining gap     -> human g0-bar free-play signoff
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
- [updated g2 free-play signal report](../qa_screenshots/g2_live_building_behavior_proof/2026-04-29T00-54-11-141Z/report.json) -> `pass`

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

The updated `2026-04-29T00-54-11-141Z` report adds a fresh-save,
unpiloted observation lane after the guided proof.

```text
free-play signal
|- setup                  -> real lived-in save, focused pool-heart pocket
|- guidance during watch  -> none
|- placements             -> 2
|- carries                -> 2
|- contributing builders  -> 1
|- unique blocks placed   -> 2
|- same-pocket placements -> 2
`- closureReady           -> true
```

This separates two claims:

```text
claim A
`- the existing autonomous path can produce real free-play block placements

claim B
`- the colony repeatedly creates a readable, colony-shaped structure pocket
```

The updated lane supports `claim A`.
It now locally supports `claim B` as an automated proof lane too, while the
human g0-bar review remains the final lived-in acceptance signoff.

## Honest Limits

```text
not closed yet
|- human g0-bar signoff is still pending
`- broader colony-richness should still be watched in ordinary play
```

So the correct read is:

```text
g2 is stronger than before because
|- there is a real lived-in proof lane on disk
|- repeated choose/carry/place/revisit behavior is demonstrated under guidance
|- unpiloted free play can produce block placements without direct target forcing
`- the existing autonomous system does not need a from-scratch rebuild

g2 remains open only at the Stage A human-signoff layer because
|- the automated free-play lane is now locally closure-ready
|- a real 20-minute g0-bar session has not signed it off yet
`- outside ordinary play may still reveal a broader richness blocker
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
