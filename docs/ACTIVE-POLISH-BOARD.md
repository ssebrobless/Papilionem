# Papilionem Active Polish Board

## Purpose

This is the live sequencing board for player-facing polish after the
2026-04-18 frozen repair baseline.

Use this board for:

- readability passes
- player-proof passes
- visual grounding passes
- shared visible QA closure

Do not use this board to reopen closed owner-truth repairs unless a fresh audit
proves a real regression.

```text
+=======================================================================+
| Current Polish Shape                                                  |
+=======================================================================+
| P1 inspect / feed readability shell     | live                        |
| P2 journal / roster glanceability       | live                        |
| P3 battle shell comprehension           | live                        |
| P4 communication visible grounding      | live                        |
| P5 final visible polish proof           | live                        |
+=======================================================================+
```

## Status Key

```text
live
|- implemented and holding through current polish evidence

active
|- current working phase
`- next edits should stay here until it is clean

queued
`- intentionally sequenced later
```

## Current Baseline Snapshot

```text
baseline now
|- repair and parity closure are frozen clean
|- runtime truth is currently passing the active closure audit ring
|- remaining work is not missing systems
`- player-facing proof is now frozen clean
```

```text
active now
|- P1 is holding through `r4` and `r6` after the new inspect/feed shell pass
|- P2 is holding through `r4` and `single-player-autobattle` after the journal/roster glanceability pass
|- P3 is holding through `r5` and `single-player-autobattle` after the new battle-shell comprehension pass
|- P4 is holding through `r6` and `runtime-self` after the visible communication grounding pass
|- P5 is holding through `r4`, `r5`, `r6`, `single-player-autobattle`, `runtime-self`, and `final-grand-plan`
`- the polish board is frozen clean after the shared screenshot-backed proof pass
```

## Phase Detail

### P1 - Inspect / Feed Readability Shell

```text
phase goal
|- make Inspect scan in a clearer top-to-bottom order
|- improve hierarchy, spacing, and contrast at normal play scale
|- keep feed lines more obviously tied to visible lessons, movement, and talk
`- preserve current accessibility controls and debug-truth agreement
```

Owners:
- `ui/gameUI.js`
- `ui/butterflyCollection.js`
- `systems/communicationSystem.js`

Baseline evidence:
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-r6-communication-audit.js`

Closure evidence:
- 2026-04-18: fixed inspect hero card + grouped section cards
- 2026-04-18: feed now renders structured context-aware cards while preserving feed-string audit contracts
- 2026-04-18: `run-r4-ui-readability-audit.js` -> pass
- 2026-04-18: `run-r6-communication-audit.js` -> pass

### P2 - Journal / Roster Glanceability

```text
phase goal
|- make collection and roster pages easier to skim at a glance
|- reduce card-density confusion and button collisions
|- surface battle relevance, readiness, and identity faster
`- keep long-page scrolling and current button-first flows intact
```

Owners:
- `ui/butterflyCollection.js`
- `ui/gameUI.js`

Baseline evidence:
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-single-player-autobattle-audit.js`

Closure evidence:
- 2026-04-18: collection and roster summary cards now use badge rows, stronger section contrast, and clearer shell spacing
- 2026-04-18: roster now surfaces readiness, membership, and nearby alternatives through a glance strip without changing wheel-scroll or battle-launch flow
- 2026-04-18: `run-r4-ui-readability-audit.js` -> pass
- 2026-04-18: `run-single-player-autobattle-audit.js` -> pass

### P3 - Battle Shell Comprehension

```text
phase goal
|- make live battle state easier to understand without debug tools
|- improve team-state reads, combat consequence reads, and post-battle return clarity
|- keep battle labels, event recency, and action-family reads aligned
`- avoid reopening resolved battle snapshot or arena-truth repairs
```

Owners:
- `systems/battleSystem.js`
- `core/renderManager.js`
- `ui/gameUI.js`

Baseline evidence:
- `scripts/run-r5-battle-presentation-audit.js`
- `scripts/run-single-player-autobattle-audit.js`

Closure evidence:
- 2026-04-18: battle HUD now defaults to a live focus view, clearer team-state reads, and tagged battle-feed rows instead of an empty center shell
- 2026-04-18: the arena now highlights the current battle focus and the result state now reads as `Return to Garden` before commit
- 2026-04-18: `run-r5-battle-presentation-audit.js` -> pass
- 2026-04-18: `run-single-player-autobattle-audit.js` -> pass

### P4 - Communication Visible Grounding

```text
phase goal
|- keep spoken/feed output believable and easy to map to visible behavior
|- reduce moments where the text implies stronger action than the garden shows
|- preserve current naming, intent, stance, and zone-lexicon truth
`- keep signals internal-only and avoid reviving retired feed models
```

Owners:
- `systems/communicationSystem.js`
- `systems/lifeSimSystem.js`
- `ui/gameUI.js`

Baseline evidence:
- `scripts/run-r6-communication-audit.js`
- `scripts/run-runtime-self-audit.js`

Closure evidence:
- 2026-04-18: talk cards now surface direct/open talk mode, zone context, and visible-behavior grounding without changing legacy feed-line contracts
- 2026-04-18: same-name speakers are now disambiguated in the feed and battle/action cards carry explicit grounding lines
- 2026-04-18: `run-r6-communication-audit.js` -> pass
- 2026-04-18: `run-runtime-self-audit.js` -> pass

### P5 - Final Visible Polish Proof

```text
phase goal
|- run one shared browser-visible polish pass across Inspect, Journal, feed, and battle
|- capture screenshot-backed proof for the most important player-facing states
`- freeze the polish board only after the visible shell reads cleanly end to end
```

Owners:
- `scripts/`
- `docs/`
- `ui/gameUI.js`
- `ui/butterflyCollection.js`

Baseline evidence:
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-r5-battle-presentation-audit.js`
- `scripts/run-r6-communication-audit.js`
- `scripts/run-single-player-autobattle-audit.js`
- `scripts/run-final-grand-plan-audit.js`
- `scripts/run-runtime-self-audit.js`

Closure evidence:
- 2026-04-18: shared proof pass re-ran Inspect, Journal, feed, and battle audits against the repaired shell and captured fresh screenshot-backed evidence
- 2026-04-18: `run-final-grand-plan-audit.js` was de-staled to the repaired wild-exit, migration, and short-soak rules and now passes end to end with video + screenshot output
- 2026-04-18: `run-r4-ui-readability-audit.js` -> pass
- 2026-04-18: `run-r5-battle-presentation-audit.js` -> pass
- 2026-04-18: `run-r6-communication-audit.js` -> pass
- 2026-04-18: `run-single-player-autobattle-audit.js` -> pass
- 2026-04-18: `run-runtime-self-audit.js` -> pass
- 2026-04-18: `run-final-grand-plan-audit.js` -> pass

## Completed Polish Order

```text
1. P2 journal / roster glanceability
2. P3 battle shell comprehension
3. P4 communication visible grounding
4. P5 final visible polish proof
```
