# ENV70 Evidence Lock - Lived Memory Action Diversity

Date: 2026-05-06
Branch: `codex/milestone-freeze-playtest`

## Goal

Broaden ENV69 from "at least one lived memory-to-action arc" to an explicit
diversity gate:

```
dialogue-linked residue
  ├─ admiring-shadow
  ├─ partner-return
  └─ protective-follow-through
```

## Files Changed

- `scripts/run-dialogue-memory-action-lived-audit.js`

No production behavior changed.

## What Changed

Added an optional diversity threshold:

- CLI flag: `--min-action-subtypes <n>`
- report field: `minActionSubtypes`
- browser result fields:
  - `actionSubtypeCounts`
  - `distinctActionSubtypeCount`
- check:
  - `memory-to-action-action-diversity`

The default remains `1`, preserving ENV69 behavior for shorter runs. Longer
runs can now explicitly gate breadth.

## Proof

Command:

- `node scripts/run-dialogue-memory-action-lived-audit.js --frames 12000 --min-action-subtypes 3`

Report:

- `qa_screenshots/dialogue_memory_action_lived_audit/2026-05-06T01-08-51-236Z/report.json`

Result: `pass`

Key counts:

- dialogue events observed: `129`
- dialogue-linked residues observed: `135`
- memory-to-action arcs observed: `11`
- distinct action subtypes: `3`

Subtype counts:

- `admiring-shadow`: `3`
- `protective-follow-through`: `7`
- `partner-return`: `1`

Representative arcs:

- `protective-warning` residue from a tired/rest warning led to
  `protective-follow-through` toward the warning partner.
- `comfort-heard` residue from a social observation/check-in led to
  `partner-return`.
- teaching/comfort residues continued to surface `admiring-shadow`.

## Current Read

This is a strong believability proof for social memory affecting behavior in
lived play. It is still not literal sentience, but it is no longer just
if/then flavor text: dialogue leaves residue, residue updates relationship
state, and behavior later chooses different social targets/actions because of
that state.

Remaining gaps:

- No lived `strained-avoidance` arc surfaced in the 12,000-frame sample.
- No task/environment action family is yet counted by this audit.
- Feed/inspect causality can still be clearer when the latest heard phrase has
  moved on from the residue that is currently driving action.

## Next Best Slice

Extend memory-to-action evidence into ecological task choice:

```
cleanup / pollen / shade / reserve dialogue
  -> task residue or remembered event
  -> later cleanup, planting, reserve use, or shade-rest target
  -> feed/inspect cause label names the prior social/environmental reason
```

