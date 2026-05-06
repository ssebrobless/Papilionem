# ENV74 Evidence Lock - Cleanup and Shade UI Causality

Date: 2026-05-06
Branch: `codex/milestone-freeze-playtest`

## Shape

```
+------------------------------------------------------------------+
| ENV74: ecology work should read as intentional work in the UI    |
+--------------+----------------------+----------------------------+
| action lane  | production event     | player-facing proof        |
+--------------+----------------------+----------------------------+
| pollen       | pollen:planted       | feed + inspect explain food|
| cleanup      | ecology:cleanup...   | feed + inspect explain dirt|
| shade/block  | object:placed        | feed + inspect explain shade|
+--------------+----------------------+----------------------------+
```

## What changed

- `ui/gameUI.js`
  - Added `ecology:cleanup-object-cleaned` to the significant activity feed event set.
  - Added an action-feed formatter for dirt pile / reserve-husk cleanup.
  - Added stable feed causality fallbacks for pollen planting, cleanup, and block placement.
  - Guarded feed causality tails with expected-action patterns so old feed rows cannot borrow a butterfly's newer unrelated action cause.

- `scripts/run-ecology-ui-causality-audit.js`
  - Expanded the deterministic browser audit from one pollen lane to three lanes:
    - pollen planting
    - dirt pile cleanup
    - shade/block placement
  - Each lane now proves action completion, inspect "Acting because..." text, and feed `consequenceTail`.

## Evidence

Focused ENV74 audit:

- Command: `node scripts\run-ecology-ui-causality-audit.js`
- Report: `qa_screenshots/ecology_ui_causality_audit/2026-05-06T01-56-54-562Z/report.json`
- Result: `pass`

Key lane excerpts:

- Pollen inspect: `Acting because planting pollen from earlier talk -> pollen planting`
- Pollen feed after later actions: `Because pollen can become future food -> pollen planting`
- Cleanup inspect/feed: `dirty ground blocks planting -> cleanup`
- Shade inspect/feed: `shade rest need -> shade rest`

Regression audits:

- `node scripts\run-r-feed-thread-audit.js`
  - Report: `qa_screenshots/r_feed_thread_audit/2026-05-06T01-57-07-381Z/report.json`
  - Result: `pass`
- `node scripts\run-runtime-self-audit.js`
  - Report: `qa_screenshots/runtime_self_audit/report.json`
  - Result: `pass`
- `node scripts\run-dialogue-memory-action-lived-audit.js --frames 12000 --min-action-subtypes 3`
  - First run: `pass-with-residual` from stochastic action diversity only.
  - Rerun report: `qa_screenshots/dialogue_memory_action_lived_audit/2026-05-06T01-58-04-198Z/report.json`
  - Rerun result: `pass`

## Honest read

This does not make the butterflies literally sentient. It does move the game closer to believable society by ensuring ecological labor is not just hidden simulation state: when a butterfly plants pollen, cleans a blocked grid cell, or places a block for shade/rest, the feed and inspect UI can explain the practical reason in player language.

ENV74 also fixed a small but important presentation truth issue. Before the stable fallback, a historic pollen row could be recomputed later with the butterfly's current cleanup cause. Feed rows now reject mismatched current-action causes and fall back to the stable event cause.

## Next best slice

The next useful slice is a short human-facing capture pass that asks whether these ecology causes feel readable in motion:

```
cleanup pressure visible?
      |
      +-- feed says why? --> inspect says same why? --> player understands work?
      |
      +-- if no: tune wording / timing / panel surfacing

shade need visible?
      |
      +-- block placement looks like shelter work?
      +-- if no: improve shade affordance visualization before adding more AI complexity
```

After that, the next implementation candidate is a lived, non-forced ecology work audit that waits for cleanup and shade/rest actions to occur organically over a longer run, instead of seeding the exact action moment.
