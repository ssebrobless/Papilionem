# ENV67 Evidence Lock - Feed Continuity Cause Surfacing

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`

## Purpose

ENV65 proved that butterflies can reference an earlier exchange in later dialogue. ENV66 made ecology work speak when actual cleanup and pollen events happen. ENV67 closes the remaining presentation gap: grouped feed entries could show the continuity phrase but lose the explicit cause label and continuity metadata that explain why the line happened.

The target shape is:

```text
earlier talk / social residue
        │
        ▼
later continuity phrase
        │
        ▼
grouped feed card shows [earlier talk]
        │
        ▼
DOM / canvas / audit state all retain continuity metadata
```

No save schema, cognition vocabulary, ML artifact, ecology behavior, spatial math, or projection math changed.

## Implementation

Files changed:

- `systems/communicationSystem.js`
  - `applyCauseLabelCooldown()` now allows non-memory continuity labels through when `metadata.conversationContinuity === true`.
  - Continuity labels use referenced dialogue, referenced lesson, conversation id, signature, or phrase template as their cooldown key.
  - `groupTalkFeedEntries()` now propagates continuity metadata from later grouped turns onto the grouped thread card.
- `ui/gameUI.js`
  - `getRecentActivityEntries()` now preserves `metadata` and `dialogueMetadata` through dialogue history mapping and collapse.
- `scripts/run-dialogue-continuity-voice-audit.js`
  - Tightened `conversation-continuity-visible` so the audit now requires the feed entry itself to carry `[earlier talk]` and `conversationContinuity: true`.

## Evidence

### Focused continuity / voice audit

Command:

```powershell
node scripts\run-dialogue-continuity-voice-audit.js
```

Result: pass.

Report:

`qa_screenshots/dialogue_continuity_voice_audit/2026-05-05T23-33-27-884Z/report.json`

Checks:

- `browser-clean`: pass
- `conversation-continuity-visible`: pass
- `voice-differentiation-visible`: pass

Important: this audit now fails unless grouped feed data includes a continuity entry with cause label `earlier talk`.

### Feed thread audit

Command:

```powershell
node scripts\run-r-feed-thread-audit.js
```

Result: pass.

Report:

`qa_screenshots/r_feed_thread_audit/2026-05-05T23-34-02-155Z/report.json`

This protects grouped talk threads, cause labels, filter chip isolation, and warning parity.

### Dialogue readability

Command:

```powershell
node scripts\run-dialogue-readability-audit.js --frames 7200
```

Result: pass.

Report:

`qa_screenshots/dialogue_readability_audit/2026-05-05T23-34-00-104Z/report.json`

### Ecology dialogue causality

Command:

```powershell
node scripts\run-ecology-dialogue-causality-audit.js --frames 7200 --unforced
```

Result: pass, unforced soak healthy.

Report:

`qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T23-33-54-802Z/report.json`

Key values:

- `cleanupDialogueCount`: 4
- `plantingDialogueCount`: 5
- `reserveDialogueCount`: 7
- `shelterDialogueCount`: 21
- all four follow-through lanes observed.

### Scenario suite

Command:

```powershell
node scripts\run-scenario.js --all
```

Result: pass, 43/43 scenarios.

Final report set:

`qa_screenshots/scenario/*/2026-05-05T23-*`

Notable final scenario:

`qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T23-43-09-170Z/report.json`

### G0H scripted playthrough

Command:

```powershell
node scripts\run-g0h-scripted-playthrough.js
```

Result: pass, 13/13 lanes.

Report:

`qa_logs/g0h_scripted_playthrough/2026-05-05T23-34-45-551Z/report.json`

Capture:

`qa_logs/g0h_scripted_playthrough/2026-05-05T23-34-45-551Z/capture/capture.json`

Summary:

`qa_logs/g0h_scripted_playthrough/2026-05-05T23-34-45-551Z/capture/summary.txt`

### Runtime self audit

Command:

```powershell
node scripts\run-runtime-self-audit.js
```

Result: pass.

Report:

`qa_screenshots/runtime_self_audit/report.json`

## Current Read

ENV67 is a presentation-truth fix, not a behavior change. It matters because the game already had the underlying social continuity, but the feed was not reliably carrying the causal explanation through grouped threads.

After ENV67, a player-facing feed card can show that a later sentence came from "earlier talk" instead of making the line look contextless. This is another small but important step toward believable society: simulated memory and residue now survive into the UI layer where the player can actually notice them.

