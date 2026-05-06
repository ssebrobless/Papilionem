# ENV68 Evidence Lock - Dialogue Memory To Action

Date: 2026-05-06
Branch: `codex/milestone-freeze-playtest`

## Goal

Prove a longer memory-to-action arc without changing production behavior:

```
real dialogue
  -> recipient residue
  -> social edge residue snapshot
  -> later follow-through score
  -> behaviorSystem partner-return
  -> board-space movement target near partner
  -> inspect/feed-readable residue summary
```

## Files Changed

- `scripts/run-n5-dialogue-behavior-follow-through-audit.js`

No production systems were changed in ENV68.

## What Changed

### Board-truth fixture repair

The existing N5 fixture placement only updated `x`, `y`, and `gridPos`.
In sim-board mode that left `boardPos` stale, so target-distance assertions
could compare movement targets against an old position. The fixture `place()`
helper now derives `boardPos` from `renderManager.screenToBoard(...)` and
syncs `currentZoneId` plus `lifeSim.lifecycle.currentZoneId`.

### Stronger fifth lane

Added `05-dialogue-residue-drives-later-partner-return`.

This lane does not seed `recentResidues` directly. It:

1. Places two butterflies with board-synced positions.
2. Establishes a relationship edge that is not enough to trigger follow-through.
3. Emits two real `calming_signal` dialogue records through
   `communicationSystem.createDialogueRecord(...)` and
   `communicationSystem.emitDialogue(...)`.
4. Verifies the listener receives two `shared-calm` residues tied to the
   emitted dialogue ids.
5. Advances a later window by 75 seconds.
6. Verifies behavior now selects `partner-return` and the movement target lands
   close to the speaking partner.
7. Verifies communication summary text exposes the remembered residue and the
   latest heard line.

Key successful fifth-lane evidence from:
`qa_screenshots/n5_dialogue_behavior_follow_through_audit/2026-05-06T00-02-18-732Z/report.json`

- beforeIntentSubtype: `null`
- firstDialogueId: `dialogue_calming_signal_butterfly_1778025763821_4_12000`
- dialogueId: `dialogue_calming_signal_butterfly_1778025763821_4_24000`
- residueCountForPartner: `2`
- dialogueAgeSeconds: `75`
- residueType: `shared-calm`
- beforeSeekScore: `0`
- afterSeekScore: `35`
- runtime.currentActionSubtype: `partner-return`
- targetDistance: `2.21`
- recentHeardPhrase: `I meant it; I will stay close until you feel steady.`

## Proofs

### Passed

- `node --check scripts/run-n5-dialogue-behavior-follow-through-audit.js`
- `node scripts/run-n5-dialogue-behavior-follow-through-audit.js`
  - Report: `qa_screenshots/n5_dialogue_behavior_follow_through_audit/2026-05-06T00-02-18-732Z/report.json`
  - Result: pass, 5/5 phases
- `node scripts/run-dialogue-continuity-voice-audit.js`
  - Report: `qa_screenshots/dialogue_continuity_voice_audit/2026-05-06T00-02-57-765Z/report.json`
  - Result: pass
- `node scripts/run-runtime-self-audit.js`
  - Report: `qa_screenshots/runtime_self_audit/report.json`
  - Result: pass
- `node scripts/run-scenario.js --all`
  - Final aggregate report: `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-06T00-39-05-894Z/report.json`
  - Result: pass, 43/43
- `node scripts/run-g0h-scripted-playthrough.js`
  - Final report: `qa_logs/g0h_scripted_playthrough/2026-05-06T00-46-52-024Z/report.json`
  - Result: pass, 13/13

### Honest intermediate failures

The first full scenario aggregate after ENV68 reported three failures:

- `seed-compost-pollen-regrowth-organic`
- `seed-relationship-arc-rivalry-to-companion`
- `seed-zone-pull-resource`

Targeted repeat=3 reruns all passed:

- `qa_screenshots/scenario/seed-compost-pollen-regrowth-organic/2026-05-06T00-31-34-765Z/report.json`
- `qa_screenshots/scenario/seed-relationship-arc-rivalry-to-companion/2026-05-06T00-31-20-708Z/report.json`
- `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-06T00-18-51-868Z/report.json`

The final full `--all` rerun passed 43/43.

The first G0H run after ENV68 failed:

- Report: `qa_logs/g0h_scripted_playthrough/2026-05-06T00-39-11-214Z/report.json`
- Failed lanes: `save-reload-continuity`, `flower-lifecycle`
- The rerun passed 13/13:
  `qa_logs/g0h_scripted_playthrough/2026-05-06T00-46-52-024Z/report.json`

Because ENV68 changed only an audit script, the failed aggregate/G0H attempts
are recorded as organic timing/noise observations, not production regressions.

## Current Read

This slice meaningfully improves evidence quality for "real AI" believability:
we now have a deterministic proof that spoken language can leave durable
dialogue residue that later influences behavior and board-space movement.

It still does not prove full open-ended intelligence. The next useful slice is
to make this same arc visible in lived play over longer unforced windows:
dialogue references should visibly connect to later partner choice, task
choice, and social repair without audit fixture assistance.

