# G3 Movement Naturalness Acceptance

## Purpose

This is the local companion note for `g3 movement naturalness acceptance`.

It records the current movement-proof stack and the exact remaining gap
between:

```text
movement is correct
```

and:

```text
movement feels graceful in ordinary play
```

## Current Read

```text
g3 status
|- local proof stack    -> green with one tooling warn
|- named movement bug   -> none found in the current local sweep
|- tooling warn         -> canvas readback noise in a6 only
`- human g0-bar signoff -> still pending
```

## Local Proof Stack

- [r1 movement stability audit](../qa_screenshots/r1_movement_stability_audit/2026-04-29T00-57-39-353Z/report.json) -> `pass`
- [r2 zone transition audit](../qa_screenshots/r2_zone_transition_audit/2026-04-29T00-57-39-494Z/report.json) -> `pass`
- [a6 live dispersal audit](../qa_screenshots/a6_live_dispersal_audit/2026-04-29T00-57-39-364Z/report.json) -> `warn`

## What The Current Stack Proves

```text
proven locally
|- movement bounds stay stable
|- physics owns final motion
|- corridor/zone travel stays coherent
|- dispersal spreads butterflies across sectors and homes
`- no failed movement step surfaced in the current local runs
```

Important `a6` note:

```text
a6 warning source
`- repeated Canvas2D getImageData readback warnings
```

That warn is tooling noise, not a failed movement/dispersal behavior step.
All three `a6` steps still pass:

- `initial-spread-baseline`
- `settled-live-dispersal`
- `home-range-personality`

## What Is Still Open

```text
still open
|- one human g0-bar free-play signoff
`- a stricter feel read across calm, social, carrying, and scared motion
```

The current proof stack is strongest on:

- route correctness
- dispersal spread
- final-motion ownership

It is weaker on:

- long ordinary-play grace/readability judgment
- state-by-state motion feel in one lived-in review pass

## Honest Result

```text
g3 can be treated as
|- locally green on correctness / route / dispersal proof
|- not blocked by a named mechanical movement contradiction
`- not fully closed until one human free-play movement review signs off
```
