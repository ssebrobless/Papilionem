# ENV73 Evidence Lock - Deterministic Ecology UI Causality

Date: 2026-05-06
Branch: `codex/milestone-freeze-playtest`

## Goal

Prove the player-facing causality surface with a deterministic environmental
action, not only with stochastic lived dialogue arcs.

```
seeded guidance dialogue
    -> pollen planting intent
        -> gameCore.completePollenDrop
            -> feed action card gets "Because ..."
            -> inspect card gets "Acting because ..."
```

## Files Changed

- `ui/gameUI.js`
- `scripts/run-ecology-ui-causality-audit.js`

## Implementation

`ui/gameUI.js`

- Hardened `formatBehaviorReasonLabel` so missing runtime reasons no longer
  render as `null` or `undefined`.
- Suppressed low-value normal/wander/idle action labels so the inspect panel
  does not say `Acting because null -> normal`.

`scripts/run-ecology-ui-causality-audit.js`

- Added a deterministic Playwright audit that:
  - protects/restores localStorage,
  - resets into sim-board mode,
  - seeds two butterflies in `moss-hollow`,
  - emits a real guidance dialogue through `communicationSystem.emitDialogue`,
  - gives the actor one pollen charge,
  - assigns a runtime pollen-planting intent through `behaviorSystem.assignAction`,
  - plants pollen through `gameCore.completePollenDrop`,
  - checks inspect and feed presentation state.

No gameplay system, save schema, ML artifact, cognition vocabulary, projection
math, or durable state owner changed.

## First Run Failure And Fix

Initial report:

- `qa_screenshots/ecology_ui_causality_audit/2026-05-06T01-47-46-361Z/report.json`
- Result: `fail`

Named issue:

- The UI rendered `Acting because null -> normal` and the action feed tail
  rendered `Because null -> normal` when runtime reason was absent.
- The new audit also searched collapsed feed entries by an `event` field that
  is not preserved in the collapsed presentation shape; the reliable field is
  the `signature`.

Fix:

- Treat `null` / `undefined` strings as absent reason labels.
- Do not show `normal`, `wander`, or `idle` as meaningful action labels.
- In the audit, find the pollen action by `signature` prefix
  `pollen:planted`.

## Proofs

Syntax:

- `node --check ui/gameUI.js`: pass
- `node --check scripts/run-ecology-ui-causality-audit.js`: pass

Deterministic ecology UI causality:

- Command: `node scripts/run-ecology-ui-causality-audit.js`
- Report:
  - `qa_screenshots/ecology_ui_causality_audit/2026-05-06T01-48-28-363Z/report.json`
- Result:
  - overall: `pass`
  - pollen action completed: `true`
  - pending planting count: `1`
  - inspect before action:
    - `Acting because pollen can become future food -> pollen planting`
  - inspect after action:
    - `Acting because planting pollen from earlier talk -> pollen planting | heard "Plant this pollen before it fades. I will keep the square..."`
  - feed action consequence tail:
    - `Because planting pollen from earlier talk -> pollen planting | heard "Plant this pollen before it fades. I will keep the square..."`

Lived dialogue causality regression:

- Command: `node scripts/run-dialogue-memory-action-lived-audit.js --frames 12000 --min-action-subtypes 3`
- Report:
  - `qa_screenshots/dialogue_memory_action_lived_audit/2026-05-06T01-48-50-172Z/report.json`
- Result:
  - overall: `pass`
  - dialogue events: `149`
  - dialogue-linked residues: `144`
  - memory-to-action arcs: `10`
  - distinct action subtypes: `3`
    - `admiring-shadow`: `2`
    - `protective-follow-through`: `7`
    - `partner-return`: `1`
  - inspect causality visible: `8`
  - inspect causality matched runtime truth: `8`

Regression checks:

- `node scripts/run-r-feed-thread-audit.js`
  - `qa_screenshots/r_feed_thread_audit/2026-05-06T01-48-50-212Z/report.json`
  - overall: `pass`
- `node scripts/run-runtime-self-audit.js`
  - `qa_screenshots/runtime_self_audit/report.json`
  - overall: `pass`

## Current Read

ENV72 made causality visible for lived social follow-through. ENV73 adds a
deterministic environmental proof: a butterfly can hear task guidance, plant
pollen through the real game action path, and have both the feed and inspect UI
show why that action happened.

This closes the immediate UI causality gap for pollen planting. The next visible
environmental candidates are cleanup and block/shade building.

## Next Best Slice

Extend the deterministic causality audit to cover two more environmental action
families:

```
dirt pile cleanup
    -> feed "Because dirty ground blocks planting"
    -> inspect "Acting because dirty ground blocks planting"

shade/block work
    -> feed "Because shade rest need" or shared project cause
    -> inspect "Acting because shade rest need"
```

Recommended implementation:

- Extend `scripts/run-ecology-ui-causality-audit.js` with two additional lanes:
  - `cleanup-causality`
  - `shade-work-causality`
- Keep it audit-only unless a presentation contradiction appears.
