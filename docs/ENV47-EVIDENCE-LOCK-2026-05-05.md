# ENV47 Evidence Lock - Ecology-To-Dialogue Causality

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`
Phase: ENV47 - make environmental work show up in organic communication

## Goal

The user wants the butterflies to have real reasons to talk and cooperate inside their world. ENV47 adds an audit for ecology-to-dialogue causality and closes one concrete expression gap: `cleanup_care` was selected by the social subtype logic when dirt piles were present, but it had no dedicated phrase branch, so cleanup pressure could collapse back into generic acknowledgement language.

## Files Changed

- `systems/communicationSystem.js`
- `scripts/run-ecology-dialogue-causality-audit.js`
- `docs/ENV47-EVIDENCE-LOCK-2026-05-05.md`

## Implementation

Production dialogue:

- Added a `cleanup_care` phrase branch to `composeDialoguePhrase()`.
- Cleanup lines now mention dirt piles, clearing space, planting room, shared work, and keeping a zone livable.
- Fixed loyalty memory rendering when two butterflies share the same base display name. Instead of producing `"I chose ElectricViolet over ElectricViolet"`, it now falls back to `"I made a hard choice between two familiar pulls..."`.

Audit:

- Added `scripts/run-ecology-dialogue-causality-audit.js`.
- The audit builds an isolated synthetic browser state, protects localStorage, seeds dirt piles and high-care butterflies, then lets production update/dialogue systems run for 7,200 frames.
- It does not directly inject dialogue. It measures what the normal communication system emits from the seeded ecological pressure.

## Proofs

Syntax:

- `node --check systems/communicationSystem.js`: pass
- `node --check scripts/run-ecology-dialogue-causality-audit.js`: pass

Ecology dialogue:

- Command: `node scripts/run-ecology-dialogue-causality-audit.js`
- Report: `qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T07-59-16-681Z/report.json`
- Overall: `pass`
- Dialogue count: 54
- Ecology dialogue count: 16
- Ecology dialogue ratio: 0.2963
- Cleanup dialogue count: 1
- Planting dialogue count: 1
- Shelter/rest dialogue count: 2
- Reserve-food dialogue count: 0
- Scout dialogue count: 13
- Cleanup sample: `"WarmWelcome, This ground needs cleaning before we plant here. If we clean this together, the ground will be easier to use."`

Dialogue readability:

- Command: `node scripts/run-dialogue-readability-audit.js`
- Report: `qa_screenshots/dialogue_readability_audit/2026-05-05T07-59-54-739Z/report.json`
- Overall: `pass`

Feed:

- Command: `node scripts/run-r-feed-thread-audit.js`
- Report: `qa_screenshots/r_feed_thread_audit/2026-05-05T07-59-54-765Z/report.json`
- Overall: `pass`

Runtime:

- Command: `node scripts/run-runtime-self-audit.js`
- Report: `qa_screenshots/runtime_self_audit/report.json`
- Overall: `pass`

Scenario suite:

- Command: `node scripts/run-scenario.js --all`
- Overall: `pass`
- Scenario count: 41
- First report in run: `qa_screenshots/scenario/seed-affection/2026-05-05T08-00-38-915Z/report.json`
- Final report in run: `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T08-06-28-129Z/report.json`

## Honest Read

This is a real improvement: dirt piles can now become spoken social work through the existing subtype selection path, and the audit proves a cleanup line came out of production dialogue generation.

The result is still not the finish line. Scout dialogue dominates the ecology category, cleanup appears once, and reserve-food dialogue did not appear in the final run. That means the environment is beginning to create reasons to talk, but it is still not generating a rich enough spread of social work. The audit gives us a new gauge for that.

## Recommended Next Phase

ENV48 should add narrow production communication hooks for underrepresented ecology work:

1. Pollen/planting: when a butterfly has pollen charges or a pending planting target near a potential helper, emit a low-cadence request or invitation to plant.
2. Reserve food: when scarcity or low self-maintenance coincides with reserve food nearby, let butterflies offer or request reserve food through production object/zone paths.
3. Shade/rest: when tired butterflies are near or building shade, let them ask for rest cover or thank builders for shade.
4. Extend the ecology audit so cleanup, pollen/planting, reserve food, shade/rest, and scout each have their own lane rather than passing mostly through scout.

The principle stays the same: more lived reasons to communicate, not just more isolated phrase templates.
