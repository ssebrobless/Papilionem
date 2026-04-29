# G1 Spatial Acceptance Sweep

## Purpose

This is the local companion proof note for `g1 spatial acceptance sweep`.

It does not replace the frozen spatial child board.
It records the current lived-in proof stack against the goal-alignment
acceptance target.

## Current Read

```text
g1 status
|- local companion proof -> green
|- named contradiction   -> none found in the current local sweep
|- human g0-bar signoff  -> still pending
`- mixed-stage coverage  -> thinner than butterfly/block/route coverage
```

## Lived-In Anchor

```text
anchor save
|- source       -> qa_logs/save_exports/2026-04-22T21-44-34-355Z-v0-5-derived-real/save.json
|- focused zone -> pool-heart
|- butterflies  -> 28
|- flowers      -> 141
|- blocks       -> 108
`- caterpillars -> 0
```

This is the same real-export family used by the current runtime proof stack.

## Local Proof Stack

- [a4 spatial truth audit](../qa_screenshots/a4_spatial_truth_audit/2026-04-29T00-55-37-755Z/report.json) -> `pass`
- [r1 movement stability audit](../qa_screenshots/r1_movement_stability_audit/2026-04-29T00-57-39-353Z/report.json) -> `pass`
- [r2 zone transition audit](../qa_screenshots/r2_zone_transition_audit/2026-04-29T00-57-39-494Z/report.json) -> `pass`
- [r7 block visual audit](../qa_screenshots/r7_block_visual_audit/2026-04-29T00-55-38-071Z/report.json) -> `pass`
- [b4 carry/stack physics audit](../qa_screenshots/b4_carry_stack_physics_audit/2026-04-29T00-55-37-986Z/report.json) -> `pass`

## What The Local Sweep Established

```text
locally green now
|- board/unit/occupancy truth stays coherent
|- doorway/corridor travel stays coherent
|- block carry/stack/support visuals stay coherent
|- save/load rebuild stays coherent
`- reviewed screenshots did not surface an obvious pseudo-3D contradiction
```

The current proof stack is strongest for:

- butterflies
- flowers
- blocks
- carry / stack / support
- route and doorway truth

## What Is Still Open

```text
still open
|- one human g0-bar lived-in signoff
`- broader mixed-stage visual acceptance for eggs, cocoons, and caterpillars
```

The current lived-in anchor save is strong for butterflies, flowers, blocks,
carry, stack, and route readability.
It is not strong for egg/cocoon/caterpillar acceptance because those families
are not materially present in the anchor save.

## Honest Result

```text
g1 can be treated as
|- locally green on the companion proof stack
|- not blocked by a named mechanical contradiction
`- not fully closed until a human g0-bar lived-in sweep signs off
```
