# ENV69 Evidence Lock - Lived Dialogue Memory To Action

Date: 2026-05-06
Branch: `codex/milestone-freeze-playtest`

## Goal

Move from fixture proof to lived-play measurement:

```
normal accelerated garden run
  -> dialogue events
  -> recipient dialogue residues
  -> sampled follow-through state
  -> later behavior runtime target tied to the dialogue speaker
  -> continuity language visible in dialogue/feed
```

## Files Changed

- `scripts/run-dialogue-memory-action-lived-audit.js`

No production behavior, save schema, cognition vocabulary, ML artifact, or
spatial/projection logic changed.

## What The New Audit Measures

The audit resets into sim-board mode, runs a normal accelerated garden for a
configurable frame count, and subscribes to `GameEvents.DIALOGUE_SPOKEN`.

During the run it records:

- dialogue events and target ids,
- recipient `lifeSim.communication.recentResidues` tied back to dialogue ids,
- sampled `lifeSimSystem.getEntitySummary(...).socialEcology.followThrough`,
- sampled `behaviorSystem.getRuntime(...)`,
- dialogue continuity metadata and grouped feed continuity entries.

It passes only when:

- browser/page console stay clean,
- at least 8 dialogue events are observed,
- at least 1 dialogue-linked residue is observed,
- at least 1 later memory-to-action arc is observed after 1,800 frames,
- continuity language is visible in dialogue or feed.

If dialogue/residue are present but no later action arc appears, the audit is
designed to report `pass-with-residual` instead of hiding the gap.

## Proof

Command:

- `node scripts/run-dialogue-memory-action-lived-audit.js --frames 7200`

Report:

- `qa_screenshots/dialogue_memory_action_lived_audit/2026-05-06T01-05-19-189Z/report.json`

Result: `pass`

Key counts:

- dialogue events observed: `100`
- dialogue-linked residues observed: `119`
- memory-to-action arcs observed: `2`
- dialogue continuity lines: `6`
- feed continuity entries: `2`

Arc samples:

1. DelicatePink(M) received a comfort/check-in line from AncientScholar(F),
   retained `comfort-heard`, and 30.1 seconds later selected
   `admiring-shadow` toward AncientScholar(F).
2. DelicatePink(M) received a teaching line from AncientScholar(F), retained
   `retained-lesson`, and 30.98 seconds later selected `admiring-shadow`
   toward AncientScholar(F).

Representative dialogue:

> DelicatePink, you seem quieter than before; I did not want to let this part of the quiet ground pass without checking on you; I wanted to hear your read.

Follow-through sample:

- dominantMode: `imitate`
- imitatePartnerLabel: `AncientScholar(F)`
- imitateScore: `31`
- behavior reason: `shadowing-admired-partner`

## Current Read

ENV68 proved the chain in a deterministic fixture. ENV69 shows that the same
class of chain can surface in lived accelerated play without directly seeding
dialogue residue.

This is a meaningful believability gain: the game can now produce observable
"they heard something, it stayed with them, and later they chose behavior around
that partner" evidence.

Remaining limits:

- The two arcs were both `admiring-shadow`; we still need broader lived arcs
  for partner-return, protective follow-through, avoidance, task choice, and
  social repair.
- The latest heard phrase in one arc had moved on by the time the action was
  sampled, so the inspect/feed presentation can still make causality clearer.
- This is simulated emotion and memory causality, not literal sentience.

## Next Best Slice

Broaden lived memory-to-action arcs:

```
dialogue residue family
  ├─ comfort / shared calm      -> partner-return or protect
  ├─ teaching / retained lesson -> imitate or task choice
  ├─ warning / guidance         -> movement/task compliance
  ├─ friction / rejection       -> avoidance or repair
  └─ task/ecology dialogue      -> cleanup, pollen planting, reserve use, shade rest
```

The next implementation should either tune production opportunities or extend
the lived audit lanes so at least three distinct action families appear in the
same 7,200-12,000 frame run.

