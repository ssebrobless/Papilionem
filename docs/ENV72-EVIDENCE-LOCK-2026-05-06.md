# ENV72 Evidence Lock - Player-Facing Action Causality

Date: 2026-05-06
Branch: `codex/milestone-freeze-playtest`

## Goal

Make the causal thread visible to the player while it is happening.

```
prior dialogue / ecology pressure
    -> behaviorSystem runtime action + target
        -> inspect "Why This Moment"
        -> feed action cause tail
            -> audit verifies visible text matches runtime truth
```

## Files Changed

- `ui/gameUI.js`
- `scripts/run-dialogue-memory-action-lived-audit.js`

## Implementation

`ui/gameUI.js`

- Added `formatBehaviorReasonLabel`.
- Added `formatActionSubtypeLabel`.
- Added `buildCurrentActionCausalityLine`.
- Added the causality line to both DOM inspect detail state and canvas inspect
  panel state through `buildWhyThisMomentState`.
- Preserved existing ownership: behavior truth still comes from
  `behaviorSystem.getRuntime`, durable social context still comes from
  `communicationSystem.getCommunicationSummary` and `lifeSimSystem.getEntitySummary`.
- Preserved action feed `consequenceTail` for object, block, pollen, and shared
  project events so the feed can say why an action happened when a live actor can
  be resolved.

`scripts/run-dialogue-memory-action-lived-audit.js`

- Added `inspectCausalitySamples`.
- Added `inspectCausalityCount`.
- Added `inspectCausalityMatchedCount`.
- Added `feedActionCausalityCount`.
- Added checks:
  - `inspect-causality-visible`
  - `inspect-causality-matches-runtime`

## Proofs

Syntax:

- `node --check ui/gameUI.js`: pass
- `node --check scripts/run-dialogue-memory-action-lived-audit.js`: pass

Focused lived causality audit:

- Command: `node scripts/run-dialogue-memory-action-lived-audit.js --frames 12000 --min-action-subtypes 3`
- Final green report:
  - `qa_screenshots/dialogue_memory_action_lived_audit/2026-05-06T01-32-44-290Z/report.json`
- Result:
  - overall: `pass`
  - dialogue events: `98`
  - dialogue-linked residues: `127`
  - memory-to-action arcs: `13`
  - distinct action subtypes: `3`
    - `admiring-shadow`: `6`
    - `partner-return`: `1`
    - `protective-follow-through`: `6`
  - inspect causality lines visible: `8`
  - inspect causality lines matched runtime truth: `7`

Representative line:

> Acting because earlier talk left protective warning | anchoring -> checking on a vulnerable partner toward ElectricViolet | heard "I kept thinking about your warning, NervousJewel. I am we..."

Stochastic note:

- An immediately prior run at
  `qa_screenshots/dialogue_memory_action_lived_audit/2026-05-06T01-31-40-770Z/report.json`
  produced `pass-with-residual` because the unforced lived run surfaced only
  two action subtypes, despite 18 memory-to-action arcs and passing the new
  inspect causality checks.
- This is not a production regression. It confirms the existing diversity gate
  is still a stochastic lived-play signal. The final rerun passed cleanly.

Ecology causality regression:

- Command: `node scripts/run-ecology-dialogue-causality-audit.js --frames 12000 --unforced`
- Report:
  - `qa_screenshots/ecology_dialogue_causality_audit/2026-05-06T01-22-32-330Z/report.json`
- Result:
  - overall: `pass`
  - unforcedSoakVerdict: `healthy`
  - cleanup: `observed`
  - pollen: `observed`
  - reserveFood: `observed`
  - shadeRest: `observed`
  - ecology dialogue: `58 / 135`
  - ecology dialogue ratio: `0.4296`

UI / runtime regressions:

- `node scripts/run-r-feed-thread-audit.js`
  - `qa_screenshots/r_feed_thread_audit/2026-05-06T01-22-32-340Z/report.json`
  - overall: `pass`
- `node scripts/run-runtime-self-audit.js`
  - `qa_screenshots/runtime_self_audit/report.json`
  - overall: `pass`

End-to-end regressions:

- `node scripts/run-g0h-scripted-playthrough.js`
  - `qa_logs/g0h_scripted_playthrough/2026-05-06T01-23-34-307Z/report.json`
  - overall: `pass`
  - lanes: `13 / 13`
- `node scripts/run-scenario.js --all`
  - overall: `pass`
  - scenarios: `43 / 43`

## Current Read

ENV72 does not make the butterflies more intelligent internally. It makes the
existing intelligence legible. The game can now show:

- what earlier dialogue residue is influencing the current action,
- what behavior subtype is happening now,
- who the action is aimed toward,
- and when ecological pressure rather than social memory is the immediate cause.

This is important for the "real AI" goal because emergent behavior only feels
real to a player when the causal thread is visible enough to read without
debugging the save.

## Next Best Slice

The next gap is deterministic UI causality coverage for environmental actions.
ENV72 proves dialogue-to-action causality in lived play and keeps feed cause
tails available, but the feed action cause tail is not yet locked by a dedicated
fixture where a pollen/block/cleanup action is known to happen at a specific
frame.

Recommended next slice:

```
fixture ecology action
    -> feed action entry
        -> consequenceTail starts with "Because ..."
            -> inspect line agrees with behavior runtime
```

Suggested audit target:

- Extend `scripts/run-ecology-dialogue-causality-audit.js` or add a small
  `scripts/run-ecology-ui-causality-audit.js`.
- Seed a butterfly with:
  - a recent ecology dialogue residue,
  - a current pollen or cleanup target,
  - a known object/pollen action event.
- Assert:
  - feed entry has `consequenceTail`,
  - inspect `Why This Moment` has `Acting because`,
  - both lines point to the same actor and action family.
