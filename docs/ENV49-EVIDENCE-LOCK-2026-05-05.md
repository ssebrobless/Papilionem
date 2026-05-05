# ENV49 Evidence Lock - Unforced Ecology/Social Soak Measurement

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`
Phase: ENV49 - measure ecology communication without forced sampling

## Goal

ENV48 proved the new ecology communication hooks can produce cleanup, pollen, reserve-food, shade/rest, and scout dialogue when the fixture explicitly samples the production hook. ENV49 adds an unforced soak mode so we can see what appears when the game is simply allowed to run.

## Files Changed

- `scripts/run-ecology-dialogue-causality-audit.js`
- `docs/ENV49-EVIDENCE-LOCK-2026-05-05.md`

## Implementation

The ecology dialogue audit now supports:

- default mode: `fixture-forced-sampling`
- unforced mode: `--unforced`
- configurable duration: `--frames <n>`

In unforced mode, the audit:

- still seeds the same synthetic ecology pressure
- does not call `communicationSystem.updateEcologyWorkCommunication()` in force mode
- does not phase-disable scout discovery
- treats individual ecology lanes as measurement, not blocking assertions
- emits `unforcedSoakVerdict`

## Proofs

Unforced soak:

- Command: `node scripts/run-ecology-dialogue-causality-audit.js --unforced --frames 14400`
- Report: `qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T08-44-13-195Z/report.json`
- Overall: `pass`
- Mode: `unforced-soak`
- Verdict: `healthy`
- Dialogue count: 81
- Ecology dialogue count: 21
- Ecology dialogue ratio: 0.2593
- Cleanup dialogue count: 2
- Pollen/planting dialogue count: 2
- Shade/rest dialogue count: 2
- Reserve-food dialogue count: 0
- Scout dialogue count: 17

Forced fixture still green:

- Command: `node scripts/run-ecology-dialogue-causality-audit.js`
- Report: `qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T08-45-04-716Z/report.json`
- Overall: `pass`
- Mode: `fixture-forced-sampling`
- Ecology dialogue ratio: 0.4468
- Cleanup: 10
- Pollen/planting: 16
- Shade/rest: 7
- Reserve-food: 12
- Scout: 7

Existing regression proofs from ENV48 remain the current green gate:

- `node scripts/run-dialogue-readability-audit.js`: pass, report `qa_screenshots/dialogue_readability_audit/2026-05-05T08-35-12-123Z/report.json`
- `node scripts/run-r-feed-thread-audit.js`: pass, report `qa_screenshots/r_feed_thread_audit/2026-05-05T08-35-12-137Z/report.json`
- `node scripts/run-runtime-self-audit.js`: pass, report `qa_screenshots/runtime_self_audit/report.json`
- `node scripts/run-scenario.js --all`: pass, 41/41, final report `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T08-42-02-317Z/report.json`

## Honest Read

The unforced soak is encouraging but not complete.

What appeared naturally:

- cleanup
- pollen/planting
- shade/rest
- scout

What did not appear naturally:

- reserve-food dialogue

That means ENV48's reserve-food hook is wired and provable, but its normal-play conditions are not common enough in this fixture. The next improvement should not add more reserve-food phrase templates. It should make reserve-food decisions matter more in behavior: when a reserve food ball exists and butterflies are tired or self-maintenance pressured, they should target it, share it, or ask someone to use it.

## Recommended Next Phase

ENV50 should connect ecology speech to object follow-through:

1. Track each ecology dialogue by `reason` and `sourceId`.
2. Within a follow-through window, measure whether:
   - cleanup speech is followed by dirt-pile targeting or cleanup
   - pollen speech is followed by planting or pollen handoff
   - reserve-food speech is followed by reserve pickup/share/use
   - shade/rest speech is followed by moving toward shade or settling near blocks
3. Add narrow behavior/object hooks only where follow-through is missing.

The target is now beyond "they say the right thing." The target is "they say it, then the world changes because of it."
