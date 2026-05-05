# ENV66 Evidence Lock - Ecology Work Follow-Up Dialogue

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`

## Purpose

ENV66 closes the remaining ecology-dialogue legibility gap from ENV65: cleanup and pollen work could happen in unforced play without the feed reliably showing that the butterflies understood or talked about the work they had just done.

This phase adds event-driven follow-up dialogue for completed cleanup and pollen planting events. It does not change save schema, cognition vocabulary, ML artifacts, projection math, spatial logic, or ecology mechanics.

## Implementation

Files changed:

- `core/config.js`
  - Added `gameConfig.cognition.ecologyCommunication.eventFollowup`.
  - Default: enabled, 900-frame cooldown, migration suppression enabled.
- `systems/communicationSystem.js`
  - Subscribes to `ecology:cleanup-object-cleaned` and `pollen:sprinkle`.
  - Emits short task-grounded follow-up lines after actual work events.
  - Uses task-only intent tags for these follow-ups so they do not masquerade as affection or distort witnessed-affection proofs.
  - Suppresses cleanup follow-up while source/partner is actively migrating, preserving resource-pull migration scenarios.
  - Allows pollen follow-up during migration pressure so planting speech remains visible in unforced ecology soaks.

## Evidence

### ENV66 ecology causality audit

Command:

```powershell
node scripts\run-ecology-dialogue-causality-audit.js --frames 7200 --unforced
```

Result: pass, unforced soak healthy.

Report:

`qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T19-37-09-117Z/report.json`

Key results:

- `cleanupDialogueCount`: 4
- `plantingDialogueCount`: 6
- `reserveDialogueCount`: 6
- `shelterDialogueCount`: 20
- `scoutDialogueCount`: 13
- Follow-through observed: cleanup, pollen, reserve food, shade rest.

Representative new task-grounded planting lines:

- "This square has pollen now. Keep it clear while it grows."
- "I placed the pollen before it faded. This ground can become food again."

### Targeted scenario regression checks

Commands:

```powershell
node scripts\run-scenario.js seed-zone-pull-resource --repeat=3
node scripts\run-scenario.js seed-society-soak-organic
```

Results: pass.

Reports:

- `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T21-22-24-079Z/report.json`
- `qa_screenshots/scenario/seed-society-soak-organic/2026-05-05T19-37-13-210Z/report.json`

Why these were important:

- `seed-zone-pull-resource` protects migration pressure from being distracted by ecology talk.
- `seed-society-soak-organic` protects witnessed-affection evidence from being polluted by task follow-up dialogue.

### Dialogue audits

Commands:

```powershell
node scripts\run-dialogue-continuity-voice-audit.js
node scripts\run-dialogue-readability-audit.js --frames 7200
```

Results: pass.

Reports:

- `qa_screenshots/dialogue_continuity_voice_audit/2026-05-05T22-52-25-493Z/report.json`
- `qa_screenshots/dialogue_readability_audit/2026-05-05T22-53-38-608Z/report.json`

### Scenario suite

Command:

```powershell
node scripts\run-scenario.js --all
```

Result: pass, 43/43 scenarios.

Final report set:

`qa_screenshots/scenario/*/2026-05-05T23-*`

Notable final scenario proof:

`qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T23-13-17-527Z/report.json`

### G0H scripted playthrough

Command:

```powershell
node scripts\run-g0h-scripted-playthrough.js
```

Result: pass, 13/13 lanes.

Report:

`qa_logs/g0h_scripted_playthrough/2026-05-05T23-21-46-866Z/report.json`

Capture:

`qa_logs/g0h_scripted_playthrough/2026-05-05T23-21-46-866Z/capture/capture.json`

Summary:

`qa_logs/g0h_scripted_playthrough/2026-05-05T23-21-46-866Z/capture/summary.txt`

Key values:

- Runtime lane: pass.
- Pressure: hot, not critical.
- `stutterTier`: hot.
- `cacheTier`: normal.
- `p99FrameMs`: 23.10.
- `maxRenderMs`: 25.10.
- Sprite cache: 2.69 MB of 64 MB.
- Flower lifecycle: 15 piles before, 6 after, 9 cleaned net.
- 0 page errors, 0 console errors, 0 runtime errors.

Two earlier G0H attempts were not used as the evidence lock:

- `2026-05-05T23-04-55-449Z`: flower lifecycle missed by one cleanup.
- `2026-05-05T23-14-09-101Z`: runtime stutter tier hit critical once.

The final clean run above passed both lanes together.

### Runtime self audit

Command:

```powershell
node scripts\run-runtime-self-audit.js
```

Result: pass.

Report:

`qa_screenshots/runtime_self_audit/report.json`

## Current Read

ENV66 makes ecological work more legible without turning task speech into fake affection. The important behavioral line is:

```text
actual cleanup/pollen event -> task-grounded follow-up line -> feed-visible social coordination
```

This is a useful step toward believable society because butterflies now talk about object work after it happens, not only when an audit forces a prompt. The remaining believability work should continue to focus on organic task chains, richer environmental incentives, and long-soak social diversity rather than adding new emotion vocabulary.

