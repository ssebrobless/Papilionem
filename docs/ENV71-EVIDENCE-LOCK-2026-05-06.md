# ENV71 Evidence Lock - Unforced Ecology Dialogue Follow-Through

Date: 2026-05-06
Branch: `codex/milestone-freeze-playtest`

## Goal

Check whether ecological task dialogue is already surfacing in lived play before
changing production behavior.

```
environmental need
  ├─ cleanup
  ├─ pollen / planting
  ├─ reserve food
  └─ shade rest
      ↓
unforced dialogue + follow-through evidence
```

## Files Changed

None. ENV71 is an evidence-only lock.

## Proof

Command:

- `node scripts/run-ecology-dialogue-causality-audit.js --frames 12000 --unforced`

Report:

- `qa_screenshots/ecology_dialogue_causality_audit/2026-05-06T01-14-23-154Z/report.json`

Result:

- overall: `pass`
- unforcedSoakVerdict: `healthy`

Follow-through verdict:

- cleanup: `observed`
- pollen: `observed`
- reserveFood: `observed`
- shadeRest: `observed`

Dialogue counts:

- total dialogue: `108`
- ecology dialogue: `47`
- ecology dialogue ratio: `0.4352`
- cleanup dialogue: `2`
- planting dialogue: `5`
- shelter/shade dialogue: `25`
- reserve dialogue: `5`
- scout dialogue: `16`

Task/action evidence:

- cleaned seeded dirt piles: `4 / 4`
- cleanup object cleaned events: `14`
- cleanup compost created events: `14`
- pollen follow-through events: `16`
- reserve food used: `6 / 6`
- reserve food depleted visual state: `depleted`
- shade-rest targeting: `9`
- shade-rest arrivals: `20`
- shade-rest settling sleep: `20`

Representative lived lines:

> This ground needs cleaning before we plant here. If we clean this together, the ground will be easier to use.

> I planted the pollen here. In a little while this spot can feed us.

> There is reserve food here. Let us share it before anyone gets too worn down.

> I kept thinking about your guidance, DelicatePink. The shade would help me settle. Stay with me there a moment.

## Current Read

This closes the older ENV65 residual for ecology dialogue opportunity in this
run: cleanup, pollen, reserve food, and shade rest all surfaced in an unforced
soak.

The next gap is not "can they talk about ecology?" but "can the UI make the
causal thread unmistakable while it is happening?" The lines exist and the
actions happen, but player-facing feed/inspect still needs stronger linking
between:

```
prior dialogue / prior guidance
  -> current environmental task
  -> visible reason for target choice
```

## Next Best Slice

Create a player-facing causality surface for ecological/social actions:

- feed thread should show the prior reason when a butterfly follows through,
- inspect should show "acting because..." for current target choice,
- audit should assert the displayed reason matches behavior/runtime truth.

